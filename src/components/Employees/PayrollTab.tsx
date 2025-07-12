
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, DollarSign, Download, Play } from 'lucide-react';

const mockPayrollData = [
  { id: 1, employee: 'John Smith', position: 'Store Manager', baseSalary: 55000, hoursWorked: 160, overtime: 8, grossPay: 4583.33, deductions: 1145.83, netPay: 3437.50, status: 'processed' },
  { id: 2, employee: 'Sarah Johnson', position: 'Sales Associate', baseSalary: 35000, hoursWorked: 160, overtime: 4, grossPay: 2916.67, deductions: 729.17, netPay: 2187.50, status: 'pending' },
  { id: 3, employee: 'Mike Wilson', position: 'Accountant', baseSalary: 48000, hoursWorked: 160, overtime: 0, grossPay: 4000.00, deductions: 1000.00, netPay: 3000.00, status: 'draft' },
];

export function PayrollTab() {
  const [payPeriod, setPayPeriod] = useState('current');

  const totalGrossPay = mockPayrollData.reduce((sum, emp) => sum + emp.grossPay, 0);
  const totalNetPay = mockPayrollData.reduce((sum, emp) => sum + emp.netPay, 0);
  const totalDeductions = mockPayrollData.reduce((sum, emp) => sum + emp.deductions, 0);

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
              {mockPayrollData.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.employee}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.hoursWorked}h</TableCell>
                  <TableCell>{employee.overtime}h</TableCell>
                  <TableCell>${employee.grossPay.toLocaleString()}</TableCell>
                  <TableCell>${employee.deductions.toLocaleString()}</TableCell>
                  <TableCell className="font-medium">${employee.netPay.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(employee.status)}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
