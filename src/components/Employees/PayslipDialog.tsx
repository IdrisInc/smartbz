import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Printer } from 'lucide-react';
import { formatTZS, PayrollResult } from '@/lib/payrollCalculator';
import { useOrganization } from '@/contexts/OrganizationContext';

interface PayslipDialogProps {
  open: boolean;
  onClose: () => void;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
    department: string;
    payrollResult: PayrollResult;
  };
  period: string;
}

export function PayslipDialog({ open, onClose, employee, period }: PayslipDialogProps) {
  const { currentOrganization } = useOrganization();
  const payslipRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = payslipRef.current?.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payslip - ${employee.firstName} ${employee.lastName}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .payslip { max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h1 { margin: 0; font-size: 24px; }
              .header p { margin: 5px 0; color: #666; }
              .section { margin: 20px 0; }
              .section-title { font-weight: bold; font-size: 14px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee; }
              .row { display: flex; justify-content: space-between; padding: 5px 0; }
              .row.total { font-weight: bold; border-top: 1px solid #000; margin-top: 10px; padding-top: 10px; }
              .highlight { background: #f5f5f5; padding: 10px; margin: 10px 0; }
              .net-pay { font-size: 20px; color: #22c55e; }
            </style>
          </head>
          <body>
            <div class="payslip">
              ${printContent}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const { payrollResult } = employee;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payslip - {period}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={payslipRef} className="space-y-6">
          {/* Company Header */}
          <div className="text-center pb-4 border-b">
            <h1 className="text-2xl font-bold">{currentOrganization?.name || 'Company Name'}</h1>
            <p className="text-muted-foreground">Payslip for {period}</p>
          </div>

          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Employee Name</p>
              <p className="font-semibold">{employee.firstName} {employee.lastName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Position</p>
              <p className="font-semibold">{employee.position}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Department</p>
              <p className="font-semibold">{employee.department}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pay Period</p>
              <p className="font-semibold">{period}</p>
            </div>
          </div>

          <Separator />

          {/* Earnings */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-primary">EARNINGS</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Basic Salary</span>
                <span>{formatTZS(payrollResult.basicSalary)}</span>
              </div>
              {payrollResult.housingAllowance > 0 && (
                <div className="flex justify-between">
                  <span>Housing Allowance</span>
                  <span>{formatTZS(payrollResult.housingAllowance)}</span>
                </div>
              )}
              {payrollResult.transportAllowance > 0 && (
                <div className="flex justify-between">
                  <span>Transport Allowance</span>
                  <span>{formatTZS(payrollResult.transportAllowance)}</span>
                </div>
              )}
              {payrollResult.otherAllowances > 0 && (
                <div className="flex justify-between">
                  <span>Other Allowances</span>
                  <span>{formatTZS(payrollResult.otherAllowances)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Gross Salary</span>
                <span>{formatTZS(payrollResult.grossSalary)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Deductions */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-destructive">DEDUCTIONS (Employee)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>NSSF (10%)</span>
                <span className="text-destructive">-{formatTZS(payrollResult.nssfEmployee)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span className="pl-4">Taxable Income</span>
                <span>{formatTZS(payrollResult.taxableIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span>PAYE (Income Tax)</span>
                <span className="text-destructive">-{formatTZS(payrollResult.paye)}</span>
              </div>
              {payrollResult.otherDeductions > 0 && (
                <div className="flex justify-between">
                  <span>Other Deductions</span>
                  <span className="text-destructive">-{formatTZS(payrollResult.otherDeductions)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t text-destructive">
                <span>Total Deductions</span>
                <span>-{formatTZS(payrollResult.totalDeductions)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Net Pay */}
          <Card className="bg-success/10 border-success/20">
            <CardContent className="pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">NET PAY</span>
                <span className="text-2xl font-bold text-success">
                  {formatTZS(payrollResult.netSalary)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Employer Contributions (shown separately) */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold text-sm mb-3 text-muted-foreground">
              EMPLOYER CONTRIBUTIONS (Not deducted from salary)
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>NSSF Employer (10%)</span>
                <span>{formatTZS(payrollResult.nssfEmployer)}</span>
              </div>
              <div className="flex justify-between">
                <span>WCF (0.5%)</span>
                <span>{formatTZS(payrollResult.wcfEmployer)}</span>
              </div>
              <div className="flex justify-between">
                <span>SDL (3.5%)</span>
                <span>{formatTZS(payrollResult.sdlEmployer)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total Employer Contributions</span>
                <span>{formatTZS(payrollResult.totalEmployerContributions)}</span>
              </div>
            </div>
          </div>

          {/* PAYE Breakdown */}
          {payrollResult.payeBreakdown.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold mb-1">PAYE Calculation:</p>
              {payrollResult.payeBreakdown.map((bracket, idx) => (
                <p key={idx}>
                  {bracket.bracket} @ {bracket.rate} = {formatTZS(bracket.amount)}
                </p>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>This is a computer-generated payslip. No signature required.</p>
            <p>Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
