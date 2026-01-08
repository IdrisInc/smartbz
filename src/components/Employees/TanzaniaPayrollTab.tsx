import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Play, Loader2, FileText, Calculator, Settings2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { useExportUtils } from '@/hooks/useExportUtils';
import { calculatePayroll, formatTZS, PayrollResult } from '@/lib/payrollCalculator';
import { PayrollSettingsDialog } from './PayrollSettingsDialog';
import { PayslipDialog } from './PayslipDialog';
import { PayrollReportsTab } from './PayrollReportsTab';

interface PayrollTabProps {
  onRefresh?: () => void;
}

interface EmployeePayroll {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  basicSalary: number;
  payrollResult: PayrollResult;
  status: 'draft' | 'processing' | 'completed';
}

export function TanzaniaPayrollTab({ onRefresh }: PayrollTabProps) {
  const [payPeriod, setPayPeriod] = useState('current');
  const [employees, setEmployees] = useState<any[]>([]);
  const [payrollData, setPayrollData] = useState<EmployeePayroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<EmployeePayroll | null>(null);
  
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const { exportToCSV } = useExportUtils();

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

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
        .eq('organization_id', currentOrganization?.id)
        .eq('status', 'active');

      if (error) throw error;
      
      const employeesWithPayroll = (data || []).map(emp => {
        const payrollResult = calculatePayroll({
          basicSalary: emp.salary || 0,
          totalEmployees: data?.length || 1,
        });
        
        return {
          id: emp.id,
          firstName: emp.first_name,
          lastName: emp.last_name,
          position: emp.position || 'Staff',
          department: emp.department || 'General',
          basicSalary: emp.salary || 0,
          payrollResult,
          status: 'draft' as const,
        };
      });
      
      setEmployees(data || []);
      setPayrollData(employeesWithPayroll);
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

  const processPayroll = async () => {
    if (!currentOrganization) return;
    
    setProcessing(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // Create payroll run
      const { data: payrollRun, error: runError } = await supabase
        .from('payroll_runs')
        .upsert({
          organization_id: currentOrganization.id,
          period_month: month,
          period_year: year,
          status: 'completed',
          total_gross: payrollData.reduce((sum, e) => sum + e.payrollResult.grossSalary, 0),
          total_paye: payrollData.reduce((sum, e) => sum + e.payrollResult.paye, 0),
          total_nssf_employee: payrollData.reduce((sum, e) => sum + e.payrollResult.nssfEmployee, 0),
          total_nssf_employer: payrollData.reduce((sum, e) => sum + e.payrollResult.nssfEmployer, 0),
          total_wcf: payrollData.reduce((sum, e) => sum + e.payrollResult.wcfEmployer, 0),
          total_sdl: payrollData.reduce((sum, e) => sum + e.payrollResult.sdlEmployer, 0),
          total_net: payrollData.reduce((sum, e) => sum + e.payrollResult.netSalary, 0),
          processed_at: now.toISOString(),
        }, {
          onConflict: 'organization_id,period_month,period_year',
        })
        .select()
        .single();

      if (runError) throw runError;

      // Create payslips for each employee
      const payslips = payrollData.map(emp => ({
        payroll_run_id: payrollRun.id,
        employee_id: emp.id,
        organization_id: currentOrganization.id,
        basic_salary: emp.payrollResult.basicSalary,
        housing_allowance: emp.payrollResult.housingAllowance,
        transport_allowance: emp.payrollResult.transportAllowance,
        other_allowances: emp.payrollResult.otherAllowances,
        gross_salary: emp.payrollResult.grossSalary,
        taxable_income: emp.payrollResult.taxableIncome,
        paye: emp.payrollResult.paye,
        nssf_employee: emp.payrollResult.nssfEmployee,
        nssf_employer: emp.payrollResult.nssfEmployer,
        wcf_employer: emp.payrollResult.wcfEmployer,
        sdl_employer: emp.payrollResult.sdlEmployer,
        other_deductions: emp.payrollResult.otherDeductions,
        total_deductions: emp.payrollResult.totalDeductions,
        net_salary: emp.payrollResult.netSalary,
      }));

      const { error: payslipError } = await supabase
        .from('payslips')
        .insert(payslips);

      if (payslipError) throw payslipError;

      setPayrollData(prev => prev.map(emp => ({ ...emp, status: 'completed' as const })));
      
      toast({
        title: "Payroll Processed",
        description: `Payroll for ${currentMonth} has been processed successfully`,
      });
    } catch (error) {
      console.error('Error processing payroll:', error);
      toast({
        title: "Error",
        description: "Failed to process payroll",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const exportPayrollData = async () => {
    if (payrollData.length === 0) {
      toast({
        title: "No Data",
        description: "No payroll data available to export",
        variant: "destructive",
      });
      return;
    }

    const exportData = payrollData.map(emp => ({
      'Employee Name': `${emp.firstName} ${emp.lastName}`,
      'Position': emp.position,
      'Basic Salary (TZS)': emp.payrollResult.basicSalary,
      'Gross Salary (TZS)': emp.payrollResult.grossSalary,
      'NSSF Employee (TZS)': emp.payrollResult.nssfEmployee,
      'Taxable Income (TZS)': emp.payrollResult.taxableIncome,
      'PAYE (TZS)': emp.payrollResult.paye,
      'Total Deductions (TZS)': emp.payrollResult.totalDeductions,
      'Net Salary (TZS)': emp.payrollResult.netSalary,
      'NSSF Employer (TZS)': emp.payrollResult.nssfEmployer,
      'WCF Employer (TZS)': emp.payrollResult.wcfEmployer,
      'SDL Employer (TZS)': emp.payrollResult.sdlEmployer,
    }));

    exportToCSV(exportData, `payroll_${currentMonth.replace(' ', '_')}`);
  };

  const totals = {
    gross: payrollData.reduce((sum, e) => sum + e.payrollResult.grossSalary, 0),
    paye: payrollData.reduce((sum, e) => sum + e.payrollResult.paye, 0),
    nssfEmployee: payrollData.reduce((sum, e) => sum + e.payrollResult.nssfEmployee, 0),
    nssfEmployer: payrollData.reduce((sum, e) => sum + e.payrollResult.nssfEmployer, 0),
    wcf: payrollData.reduce((sum, e) => sum + e.payrollResult.wcfEmployer, 0),
    sdl: payrollData.reduce((sum, e) => sum + e.payrollResult.sdlEmployer, 0),
    net: payrollData.reduce((sum, e) => sum + e.payrollResult.netSalary, 0),
    deductions: payrollData.reduce((sum, e) => sum + e.payrollResult.totalDeductions, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'draft': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="payroll" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
          <TabsTrigger value="payroll" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Payroll Processing</span>
            <span className="sm:hidden">Payroll</span>
          </TabsTrigger>
          <TabsTrigger value="payslips" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Payslips</span>
            <span className="sm:hidden">Slips</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Reports & Compliance</span>
            <span className="sm:hidden">Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="space-y-4">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Select value={payPeriod} onValueChange={setPayPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Period</SelectItem>
                  <SelectItem value="previous">Previous Period</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                Period: {currentMonth}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportPayrollData}>
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button size="sm" onClick={processPayroll} disabled={processing || payrollData.length === 0}>
                {processing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                <span className="hidden sm:inline">Process Payroll</span>
                <span className="sm:hidden">Process</span>
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Gross</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{formatTZS(totals.gross)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total PAYE</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-destructive">{formatTZS(totals.paye)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Deductions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-destructive">{formatTZS(totals.deductions)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Net Pay</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-success">{formatTZS(totals.net)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Employer Contributions Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Employer Contributions (Statutory)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">NSSF (10%):</span>
                  <p className="font-semibold">{formatTZS(totals.nssfEmployer)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">WCF (0.5%):</span>
                  <p className="font-semibold">{formatTZS(totals.wcf)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">SDL (3.5%):</span>
                  <p className="font-semibold">{formatTZS(totals.sdl)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <p className="font-bold text-primary">
                    {formatTZS(totals.nssfEmployer + totals.wcf + totals.sdl)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee Payroll Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payroll Details</CardTitle>
              <CardDescription>Tanzania-compliant payroll with PAYE, NSSF, WCF & SDL</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Employee</TableHead>
                        <TableHead className="hidden md:table-cell">Position</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">NSSF</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">PAYE</TableHead>
                        <TableHead className="text-right">Net Pay</TableHead>
                        <TableHead className="hidden lg:table-cell">Status</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollData.length > 0 ? (
                        payrollData.map((employee) => (
                          <TableRow key={employee.id}>
                            <TableCell className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{employee.position}</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm">
                              {formatTZS(employee.payrollResult.grossSalary)}
                            </TableCell>
                            <TableCell className="text-right text-xs sm:text-sm hidden sm:table-cell">
                              {formatTZS(employee.payrollResult.nssfEmployee)}
                            </TableCell>
                            <TableCell className="text-right text-xs sm:text-sm hidden sm:table-cell">
                              {formatTZS(employee.payrollResult.paye)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-xs sm:text-sm text-success">
                              {formatTZS(employee.payrollResult.netSalary)}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <Badge variant={getStatusColor(employee.status)}>
                                {employee.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedPayslip(employee)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <PayrollSettingsDialog 
                                  employee={{
                                    id: employee.id,
                                    first_name: employee.firstName,
                                    last_name: employee.lastName,
                                    salary: employee.basicSalary,
                                  }}
                                  onSuccess={() => {
                                    fetchEmployees();
                                    onRefresh?.();
                                  }}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No active employees found for payroll
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payslips">
          <Card>
            <CardHeader>
              <CardTitle>Generated Payslips</CardTitle>
              <CardDescription>View and download individual employee payslips</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {payrollData.map((employee) => (
                  <Card 
                    key={employee.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedPayslip(employee)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{employee.position}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Net Pay:</span>
                          <span className="font-semibold text-success">
                            {formatTZS(employee.payrollResult.netSalary)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <PayrollReportsTab />
        </TabsContent>
      </Tabs>

      {/* Payslip Dialog */}
      {selectedPayslip && (
        <PayslipDialog
          open={!!selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
          employee={selectedPayslip}
          period={currentMonth}
        />
      )}
    </div>
  );
}

export default TanzaniaPayrollTab;
