import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Building2, Users, Briefcase } from 'lucide-react';
import { formatTZS, PayrollResult } from '@/lib/payrollCalculator';
import { useExportUtils } from '@/hooks/useExportUtils';
import { useOrganization } from '@/contexts/OrganizationContext';

interface PayrollReportsTabProps {
  payrollData: {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
    payrollResult: PayrollResult;
  }[];
  totals: {
    gross: number;
    paye: number;
    nssfEmployee: number;
    nssfEmployer: number;
    wcf: number;
    sdl: number;
    net: number;
    deductions: number;
  };
}

export function PayrollReportsTab({ payrollData, totals }: PayrollReportsTabProps) {
  const { exportToCSV } = useExportUtils();
  const { currentOrganization } = useOrganization();
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const exportTRAReport = () => {
    const data = payrollData.map(emp => ({
      'Employee Name': `${emp.firstName} ${emp.lastName}`,
      'Gross Salary (TZS)': emp.payrollResult.grossSalary,
      'NSSF Employee (TZS)': emp.payrollResult.nssfEmployee,
      'Taxable Income (TZS)': emp.payrollResult.taxableIncome,
      'PAYE (TZS)': emp.payrollResult.paye,
    }));
    
    // Add totals row
    data.push({
      'Employee Name': 'TOTAL',
      'Gross Salary (TZS)': totals.gross,
      'NSSF Employee (TZS)': totals.nssfEmployee,
      'Taxable Income (TZS)': totals.gross - totals.nssfEmployee,
      'PAYE (TZS)': totals.paye,
    });
    
    exportToCSV(data, `TRA_PAYE_Report_${currentMonth.replace(' ', '_')}`);
  };

  const exportNSSFReport = () => {
    const data = payrollData.map(emp => ({
      'Employee Name': `${emp.firstName} ${emp.lastName}`,
      'Gross Salary (TZS)': emp.payrollResult.grossSalary,
      'Employee Contribution (10%)': emp.payrollResult.nssfEmployee,
      'Employer Contribution (10%)': emp.payrollResult.nssfEmployer,
      'Total Contribution': emp.payrollResult.nssfEmployee + emp.payrollResult.nssfEmployer,
    }));
    
    data.push({
      'Employee Name': 'TOTAL',
      'Gross Salary (TZS)': totals.gross,
      'Employee Contribution (10%)': totals.nssfEmployee,
      'Employer Contribution (10%)': totals.nssfEmployer,
      'Total Contribution': totals.nssfEmployee + totals.nssfEmployer,
    });
    
    exportToCSV(data, `NSSF_Report_${currentMonth.replace(' ', '_')}`);
  };

  const exportSDLWCFReport = () => {
    const data = payrollData.map(emp => ({
      'Employee Name': `${emp.firstName} ${emp.lastName}`,
      'Gross Salary (TZS)': emp.payrollResult.grossSalary,
      'SDL (3.5%)': emp.payrollResult.sdlEmployer,
      'WCF (0.5%)': emp.payrollResult.wcfEmployer,
    }));
    
    data.push({
      'Employee Name': 'TOTAL',
      'Gross Salary (TZS)': totals.gross,
      'SDL (3.5%)': totals.sdl,
      'WCF (0.5%)': totals.wcf,
    });
    
    exportToCSV(data, `SDL_WCF_Report_${currentMonth.replace(' ', '_')}`);
  };

  return (
    <div className="space-y-6">
      {/* Report Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* TRA PAYE Report */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-base">TRA PAYE Report</CardTitle>
                <CardDescription className="text-xs">Income tax submission</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total PAYE:</span>
                <span className="font-semibold">{formatTZS(totals.paye)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employees:</span>
                <span className="font-semibold">{payrollData.length}</span>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline" size="sm" onClick={exportTRAReport}>
              <Download className="h-4 w-4 mr-2" />
              Export for TRA
            </Button>
          </CardContent>
        </Card>

        {/* NSSF Report */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">NSSF Report</CardTitle>
                <CardDescription className="text-xs">Social security contributions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employee (10%):</span>
                <span className="font-semibold">{formatTZS(totals.nssfEmployee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employer (10%):</span>
                <span className="font-semibold">{formatTZS(totals.nssfEmployer)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-primary">
                  {formatTZS(totals.nssfEmployee + totals.nssfEmployer)}
                </span>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline" size="sm" onClick={exportNSSFReport}>
              <Download className="h-4 w-4 mr-2" />
              Export for NSSF
            </Button>
          </CardContent>
        </Card>

        {/* SDL & WCF Report */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-warning" />
              </div>
              <div>
                <CardTitle className="text-base">SDL & WCF Report</CardTitle>
                <CardDescription className="text-xs">Skills levy & compensation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">SDL (3.5%):</span>
                <span className="font-semibold">{formatTZS(totals.sdl)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">WCF (0.5%):</span>
                <span className="font-semibold">{formatTZS(totals.wcf)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-warning">{formatTZS(totals.sdl + totals.wcf)}</span>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline" size="sm" onClick={exportSDLWCFReport}>
              <Download className="h-4 w-4 mr-2" />
              Export SDL/WCF
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Register */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Payroll Register</CardTitle>
              <CardDescription>Complete payroll breakdown for {currentMonth}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              const data = payrollData.map(emp => ({
                'Employee': `${emp.firstName} ${emp.lastName}`,
                'Position': emp.position,
                'Basic Salary': emp.payrollResult.basicSalary,
                'Gross Salary': emp.payrollResult.grossSalary,
                'NSSF (Employee)': emp.payrollResult.nssfEmployee,
                'PAYE': emp.payrollResult.paye,
                'Total Deductions': emp.payrollResult.totalDeductions,
                'Net Salary': emp.payrollResult.netSalary,
                'NSSF (Employer)': emp.payrollResult.nssfEmployer,
                'WCF': emp.payrollResult.wcfEmployer,
                'SDL': emp.payrollResult.sdlEmployer,
              }));
              exportToCSV(data, `Payroll_Register_${currentMonth.replace(' ', '_')}`);
            }}>
              <FileText className="h-4 w-4 mr-2" />
              Export Register
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Employee</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">NSSF (E)</TableHead>
                  <TableHead className="text-right">PAYE</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">NSSF (ER)</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">SDL</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">WCF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollData.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">
                      {emp.firstName} {emp.lastName}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {formatTZS(emp.payrollResult.grossSalary)}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {formatTZS(emp.payrollResult.nssfEmployee)}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {formatTZS(emp.payrollResult.paye)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-success">
                      {formatTZS(emp.payrollResult.netSalary)}
                    </TableCell>
                    <TableCell className="text-right text-xs hidden lg:table-cell">
                      {formatTZS(emp.payrollResult.nssfEmployer)}
                    </TableCell>
                    <TableCell className="text-right text-xs hidden lg:table-cell">
                      {formatTZS(emp.payrollResult.sdlEmployer)}
                    </TableCell>
                    <TableCell className="text-right text-xs hidden lg:table-cell">
                      {formatTZS(emp.payrollResult.wcfEmployer)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals Row */}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right text-xs">{formatTZS(totals.gross)}</TableCell>
                  <TableCell className="text-right text-xs">{formatTZS(totals.nssfEmployee)}</TableCell>
                  <TableCell className="text-right text-xs">{formatTZS(totals.paye)}</TableCell>
                  <TableCell className="text-right text-xs text-success">{formatTZS(totals.net)}</TableCell>
                  <TableCell className="text-right text-xs hidden lg:table-cell">{formatTZS(totals.nssfEmployer)}</TableCell>
                  <TableCell className="text-right text-xs hidden lg:table-cell">{formatTZS(totals.sdl)}</TableCell>
                  <TableCell className="text-right text-xs hidden lg:table-cell">{formatTZS(totals.wcf)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Info */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Tanzania Payroll Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">PAYE Tax Brackets (Monthly)</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 0 – 270,000 TZS → 0%</li>
                <li>• 270,001 – 520,000 → 8% of excess</li>
                <li>• 520,001 – 760,000 → 20,000 + 20% of excess</li>
                <li>• 760,001 – 1,040,000 → 68,000 + 25% of excess</li>
                <li>• Above 1,040,000 → 128,000 + 30% of excess</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Statutory Contributions</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• NSSF Employee: 10%</li>
                <li>• NSSF Employer: 10%</li>
                <li>• WCF Employer: 0.5%</li>
                <li>• SDL Employer: 3.5% (if ≥10 employees)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
