import React, { useState, useEffect } from 'react';
import { Plus, Search, UserCheck, Calendar, DollarSign, Loader2, Eye, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TanzaniaPayrollTab } from '@/components/Employees/TanzaniaPayrollTab';
import { PayrollReportsTab } from '@/components/Employees/PayrollReportsTab';
import { AttendanceTab } from '@/components/Employees/AttendanceTab';
import { PerformanceTab } from '@/components/Employees/PerformanceTab';
import { EmployeeDialog } from '@/components/Employees/EmployeeDialog';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteEmployee, setDeleteEmployee] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    onLeave: 0,
    totalPayroll: 0
  });
  
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  useEffect(() => {
    if (currentOrganization) {
      fetchEmployees();
    }
  }, [currentOrganization]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('organization_id', currentOrganization?.id);

      if (error) throw error;

      setEmployees(data || []);
      
      const activeEmployees = data?.filter(emp => emp.status === 'active') || [];
      const totalSalary = data?.reduce((sum, emp) => sum + (emp.salary || 0), 0) || 0;
      
      setStats({
        total: data?.length || 0,
        active: activeEmployees.length,
        onLeave: data?.filter(emp => emp.status === 'on_leave')?.length || 0,
        totalPayroll: totalSalary
      });
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deleteEmployee) return;
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', deleteEmployee.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
      
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    } finally {
      setDeleteEmployee(null);
    }
  };

  const syncSystemUsers = async () => {
    if (!currentOrganization) return;
    
    try {
      setSyncing(true);
      
      // Get all organization members
      const { data: members, error: membersError } = await supabase
        .from('organization_memberships')
        .select('user_id, role, joined_at')
        .eq('organization_id', currentOrganization.id);

      if (membersError) throw membersError;

      // Get existing employees for this org
      const { data: existingEmployees } = await supabase
        .from('employees')
        .select('first_name, last_name')
        .eq('organization_id', currentOrganization.id);

      const existingNames = new Set(
        existingEmployees?.map(e => `${e.first_name?.toLowerCase()}-${e.last_name?.toLowerCase()}`) || []
      );

      let addedCount = 0;
      
      for (const member of members || []) {
        // Fetch profile separately for each member
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', member.user_id)
          .maybeSingle();

        if (!profile) continue;

        const nameKey = `${(profile.first_name || '').toLowerCase()}-${(profile.last_name || '').toLowerCase()}`;
        
        // Skip if employee with same name already exists
        if (existingNames.has(nameKey)) continue;

        // Create employee record
        const { error: insertError } = await supabase
          .from('employees')
          .insert({
            organization_id: currentOrganization.id,
            employee_id: `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            first_name: profile.first_name || 'Unknown',
            last_name: profile.last_name || 'User',
            position: member.role?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Staff',
            department: 'General',
            status: 'active',
            hire_date: member.joined_at ? new Date(member.joined_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          });

        if (!insertError) {
          addedCount++;
          existingNames.add(nameKey); // Prevent duplicates in same sync
        }
      }

      toast({
        title: "Sync Complete",
        description: addedCount > 0 
          ? `Added ${addedCount} system user(s) as employees` 
          : "All system users are already in the employee list",
      });
      
      fetchEmployees();
    } catch (error) {
      console.error('Error syncing users:', error);
      toast({
        title: "Error",
        description: "Failed to sync system users",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Employee Management</h2>
          <p className="text-muted-foreground">
            Manage your team members, roles, and payroll
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={syncSystemUsers} disabled={syncing}>
            {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sync System Users
          </Button>
          <EmployeeDialog 
            mode="add"
            onSuccess={fetchEmployees}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total workforce</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onLeave}</div>
            <p className="text-xs text-muted-foreground">Temporary absence</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total monthly cost</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="employees">Employee Directory</TabsTrigger>
          <TabsTrigger value="payroll">Tanzania Payroll</TabsTrigger>
          <TabsTrigger value="reports">Payroll Reports</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>Manage your team members and their details</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src="" />
                                <AvatarFallback>
                                  {`${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{`${employee.first_name} ${employee.last_name}`}</div>
                                <div className="text-sm text-muted-foreground">{employee.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{employee.position || '-'}</TableCell>
                          <TableCell>{employee.department || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                              {employee.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            {employee.salary ? `$${employee.salary.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <EmployeeDialog
                                mode="view"
                                employee={employee}
                                trigger={
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <EmployeeDialog
                                mode="edit"
                                employee={employee}
                                onSuccess={fetchEmployees}
                                trigger={
                                  <Button variant="ghost" size="sm">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setDeleteEmployee(employee)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {employees.length === 0 ? 'No employees found' : 'No employees match your search'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <TanzaniaPayrollTab />
        </TabsContent>

        <TabsContent value="reports">
          <PayrollReportsTab />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceTab />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceTab />
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteEmployee} onOpenChange={() => setDeleteEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteEmployee?.first_name} {deleteEmployee?.last_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}