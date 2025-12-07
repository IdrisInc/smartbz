import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  salary?: number;
}

interface PayrollSettingsDialogProps {
  employee: Employee;
  onSuccess?: () => void;
}

export function PayrollSettingsDialog({ employee, onSuccess }: PayrollSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    baseSalary: '',
    overtimeRate: '1.5',
    taxRate: '20',
    healthInsurance: '200',
    retirement: '5',
    otherDeductions: '0'
  });

  const { toast } = useToast();

  useEffect(() => {
    if (employee && open) {
      setFormData(prev => ({
        ...prev,
        baseSalary: employee.salary?.toString() || ''
      }));
    }
  }, [employee, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          salary: formData.baseSalary ? parseFloat(formData.baseSalary) : null
        })
        .eq('id', employee.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payroll settings updated successfully",
      });
      
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating payroll:', error);
      toast({
        title: "Error",
        description: "Failed to update payroll settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const baseSalary = parseFloat(formData.baseSalary) || 0;
  const taxAmount = baseSalary * (parseFloat(formData.taxRate) / 100);
  const healthInsurance = parseFloat(formData.healthInsurance) || 0;
  const retirementAmount = baseSalary * (parseFloat(formData.retirement) / 100);
  const otherDeductions = parseFloat(formData.otherDeductions) || 0;
  const totalDeductions = taxAmount + healthInsurance + retirementAmount + otherDeductions;
  const netPay = baseSalary - totalDeductions;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Payroll Settings - {employee.first_name} {employee.last_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="baseSalary">Base Salary (Monthly)</Label>
            <Input
              id="baseSalary"
              type="number"
              step="0.01"
              placeholder="5000.00"
              value={formData.baseSalary}
              onChange={(e) => setFormData(prev => ({ ...prev, baseSalary: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="overtimeRate">Overtime Rate (multiplier)</Label>
              <Input
                id="overtimeRate"
                type="number"
                step="0.1"
                placeholder="1.5"
                value={formData.overtimeRate}
                onChange={(e) => setFormData(prev => ({ ...prev, overtimeRate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.1"
                placeholder="20"
                value={formData.taxRate}
                onChange={(e) => setFormData(prev => ({ ...prev, taxRate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="healthInsurance">Health Insurance ($)</Label>
              <Input
                id="healthInsurance"
                type="number"
                step="0.01"
                placeholder="200"
                value={formData.healthInsurance}
                onChange={(e) => setFormData(prev => ({ ...prev, healthInsurance: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retirement">Retirement Contribution (%)</Label>
              <Input
                id="retirement"
                type="number"
                step="0.1"
                placeholder="5"
                value={formData.retirement}
                onChange={(e) => setFormData(prev => ({ ...prev, retirement: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="otherDeductions">Other Deductions ($)</Label>
            <Input
              id="otherDeductions"
              type="number"
              step="0.01"
              placeholder="0"
              value={formData.otherDeductions}
              onChange={(e) => setFormData(prev => ({ ...prev, otherDeductions: e.target.value }))}
            />
          </div>

          <div className="border-t pt-4 space-y-2">
            <h4 className="font-medium">Payroll Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Base Salary:</span>
              <span className="text-right">${baseSalary.toFixed(2)}</span>
              
              <span className="text-muted-foreground">Tax ({formData.taxRate}%):</span>
              <span className="text-right text-destructive">-${taxAmount.toFixed(2)}</span>
              
              <span className="text-muted-foreground">Health Insurance:</span>
              <span className="text-right text-destructive">-${healthInsurance.toFixed(2)}</span>
              
              <span className="text-muted-foreground">Retirement ({formData.retirement}%):</span>
              <span className="text-right text-destructive">-${retirementAmount.toFixed(2)}</span>
              
              <span className="text-muted-foreground">Other Deductions:</span>
              <span className="text-right text-destructive">-${otherDeductions.toFixed(2)}</span>
              
              <span className="font-medium border-t pt-2">Net Pay:</span>
              <span className="text-right font-bold text-primary border-t pt-2">${netPay.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default PayrollSettingsDialog;
