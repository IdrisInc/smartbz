import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  salary?: number;
  hire_date?: string;
  status?: string;
}

interface EmployeeDialogProps {
  trigger?: React.ReactNode;
  employee?: Employee | null;
  mode: 'add' | 'edit' | 'view';
  onSuccess?: () => void;
}

const DEPARTMENTS = [
  'Human Resources',
  'Finance',
  'Marketing',
  'Sales',
  'Engineering',
  'Operations',
  'Customer Service',
  'IT',
  'Administration',
  'Other'
];

const POSITIONS = [
  'Manager',
  'Senior Specialist',
  'Specialist',
  'Junior Specialist',
  'Intern',
  'Director',
  'Executive',
  'Coordinator',
  'Assistant',
  'Other'
];

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'suspended', label: 'Suspended' }
];

export function EmployeeDialog({ trigger, employee, mode, onSuccess }: EmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [hireDate, setHireDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: '',
    status: 'active'
  });

  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  useEffect(() => {
    if (open && mode === 'add') {
      fetchSystemUsers();
    }
  }, [open, mode]);

  useEffect(() => {
    if (employee && (mode === 'edit' || mode === 'view')) {
      setFormData({
        employee_id: employee.employee_id || '',
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        department: employee.department || '',
        salary: employee.salary?.toString() || '',
        status: employee.status || 'active'
      });
      if (employee.hire_date) {
        setHireDate(new Date(employee.hire_date));
      }
    }
  }, [employee, mode]);

  const fetchSystemUsers = async () => {
    if (!currentOrganization) return;
    
    try {
      // Fetch organization members who aren't already employees
      const { data: members, error: membersError } = await supabase
        .from('organization_memberships')
        .select(`
          user_id,
          role,
          profiles:user_id (
            id,
            display_name,
            first_name,
            last_name
          )
        `)
        .eq('organization_id', currentOrganization.id);

      if (membersError) throw membersError;

      // Fetch existing employees to exclude them
      const { data: existingEmployees } = await supabase
        .from('employees')
        .select('email')
        .eq('organization_id', currentOrganization.id);

      const existingEmails = new Set(existingEmployees?.map(e => e.email?.toLowerCase()) || []);

      // Filter out users who are already employees (by matching profile info)
      const availableUsers = members?.filter(m => {
        const profile = m.profiles as any;
        return profile && !existingEmails.has(profile.display_name?.toLowerCase());
      }) || [];

      setSystemUsers(availableUsers);
    } catch (error) {
      console.error('Error fetching system users:', error);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const user = systemUsers.find(u => u.user_id === userId);
    if (user?.profiles) {
      const profile = user.profiles as any;
      setFormData(prev => ({
        ...prev,
        first_name: profile.first_name || profile.display_name?.split(' ')[0] || '',
        last_name: profile.last_name || profile.display_name?.split(' ').slice(1).join(' ') || '',
        email: profile.display_name || ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const employeeData = {
        organization_id: currentOrganization.id,
        employee_id: formData.employee_id || `EMP-${Date.now()}`,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        department: formData.department,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        hire_date: hireDate.toISOString().split('T')[0],
        status: formData.status
      };

      if (mode === 'add') {
        const { error } = await supabase
          .from('employees')
          .insert(employeeData);
        if (error) throw error;
        toast({ title: "Success", description: "Employee added successfully" });
      } else if (mode === 'edit' && employee?.id) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', employee.id);
        if (error) throw error;
        toast({ title: "Success", description: "Employee updated successfully" });
      }

      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({
        title: "Error",
        description: `Failed to ${mode === 'add' ? 'add' : 'update'} employee`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      salary: '',
      status: 'active'
    });
    setHireDate(new Date());
    setSelectedUserId('');
  };

  const isViewMode = mode === 'view';
  const dialogTitle = mode === 'add' ? 'Add New Employee' : mode === 'edit' ? 'Edit Employee' : 'Employee Details';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'add' && systemUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Link to System User (Optional)</Label>
              <Select value={selectedUserId} onValueChange={handleUserSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a system user or enter manually" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Enter Manually</SelectItem>
                  {systemUsers.map((user) => {
                    const profile = user.profiles as any;
                    const displayName = profile?.display_name || profile?.first_name || 'Unknown';
                    return (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {displayName} ({user.role})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                placeholder="John"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                required
                disabled={isViewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                placeholder="Doe"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                required
                disabled={isViewMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@company.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={isViewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={isViewMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input
                id="employee_id"
                placeholder="Auto-generated if empty"
                value={formData.employee_id}
                onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                disabled={isViewMode}
              />
            </div>
            <div className="space-y-2">
              <Label>Hire Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal")}
                    disabled={isViewMode}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(hireDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={hireDate}
                    onSelect={(date) => date && setHireDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select 
                value={formData.position} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select 
                value={formData.department} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary">Salary (Monthly)</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                placeholder="5000.00"
                value={formData.salary}
                onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                disabled={isViewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {!isViewMode && (
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'add' ? 'Add Employee' : 'Save Changes'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EmployeeDialog;
