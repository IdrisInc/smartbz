
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, DollarSign, Download, Play, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

export function PayrollTab() {
  const [payPeriod, setPayPeriod] = useState('current');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to load payroll data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate payroll stats from employee data
  const calculatePayrollData = () => {
    return employees.map(emp => {
      const baseSalary = emp.salary || 0;
      const monthlySalary = baseSalary / 12;
      const hoursWorked = 160; // Standard monthly hours
      const overtime = 0; // Mock overtime for now
      const grossPay = monthlySalary;
      const deductions = grossPay * 0.25; // 25% deductions (taxes, benefits, etc.)
      const netPay = grossPay - deductions;
      
      return {
        id: emp.id,
        employee: `${emp.first_name} ${emp.last_name}`,
        position: emp.position || 'Unknown',
        baseSalary,
        hoursWorked,
        overtime,
        grossPay,
        deductions,
        netPay,
        status: 'pending'
      };
    });
  };

  const payrollData = calculatePayrollData();
  const totalGrossPay = payrollData.reduce((sum, emp) => sum + emp.grossPay, 0);
  const totalNetPay = payrollData.reduce((sum, emp) => sum + emp.netPay, 0);
  const totalDeductions = payrollData.reduce((sum, emp) => sum + emp.deductions, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'default';
      case 'pending': return 'secondary';
      case 'draft': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <Select value={payPeriod} onValueChange={setPayPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Pay Period</SelectItem>
              <SelectItem value="previous">Previous Pay Period</SelectItem>
              <SelectItem value="jan2024">January 2024</SelectItem>
              <SelectItem value="dec2023">December 2023</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            Pay Period: Jan 1 - Jan 31, 2024
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Play className="mr-2 h-4 w-4" />
            Process Payroll
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Gross Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalGrossPay.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDeductions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalNetPay.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pay Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">Jan 31, 2024</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Details</CardTitle>
          <CardDescription>Employee payroll breakdown for current pay period</CardDescription>
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
                  <TableHead>Hours</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollData.length > 0 ? (
                  payrollData.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.employee}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.hoursWorked}h</TableCell>
                      <TableCell>{employee.overtime}h</TableCell>
                      <TableCell>${employee.grossPay.toFixed(2)}</TableCell>
                      <TableCell>${employee.deductions.toFixed(2)}</TableCell>
                      <TableCell className="font-medium">${employee.netPay.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(employee.status)}>
                          {employee.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No employees found for payroll
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
