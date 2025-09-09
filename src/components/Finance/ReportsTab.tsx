
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useExportUtils } from '@/hooks/useExportUtils';
import { useToast } from '@/hooks/use-toast';

export function ReportsTab() {
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    salesTax: 0,
    cashInflow: 0,
    cashOutflow: 0,
    netCashFlow: 0
  });

  const { currentOrganization } = useOrganization();
  const { exportToCSV } = useExportUtils();
  const { toast } = useToast();

  const exportFinanceReport = async () => {
    if (!currentOrganization) return;
    
    setLoading(true);
    try {
      // Get sales data
      const { data: salesData } = await supabase
        .from('sales')
        .select('*')
        .eq('organization_id', currentOrganization.id);

      // Get expenses data
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('organization_id', currentOrganization.id);

      // Get invoices data
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', currentOrganization.id);

      const reportData = {
        sales: salesData || [],
        expenses: expensesData || [],
        invoices: invoicesData || []
      };

      // Export combined data
      if (reportData.sales.length || reportData.expenses.length || reportData.invoices.length) {
        exportToCSV([
          ...reportData.sales.map(s => ({ type: 'sale', ...s })),
          ...reportData.expenses.map(e => ({ type: 'expense', ...e })),
          ...reportData.invoices.map(i => ({ type: 'invoice', ...i }))
        ], 'finance_report');
      } else {
        toast({
          title: "No Data",
          description: "No financial data available to export",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrganization) {
      fetchFinancialData();
    }
  }, [currentOrganization, period]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (period) {
        case 'weekly':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarterly':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'yearly':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch sales data
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total_amount, tax_amount')
        .eq('organization_id', currentOrganization?.id)
        .gte('sale_date', startDate.toISOString())
        .lte('sale_date', endDate.toISOString());

      if (salesError) throw salesError;

      // Fetch expenses data
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('organization_id', currentOrganization?.id)
        .gte('expense_date', startDate.toISOString().split('T')[0])
        .lte('expense_date', endDate.toISOString().split('T')[0]);

      if (expensesError) throw expensesError;

      const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const totalExpenses = expensesData?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
      const salesTax = salesData?.reduce((sum, sale) => sum + (sale.tax_amount || 0), 0) || 0;
      
      setFinancialData({
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        salesTax,
        cashInflow: totalRevenue,
        cashOutflow: totalExpenses,
        netCashFlow: totalRevenue - totalExpenses
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={exportFinanceReport}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Statement</CardTitle>
            <CardDescription>Current month financial summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Revenue</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-bold text-green-600">${financialData.totalRevenue.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Expenses</span>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="font-bold text-red-600">${financialData.totalExpenses.toLocaleString()}</span>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-lg">Net Profit</span>
                <span className={`font-bold text-lg ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${financialData.netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax Summary</CardTitle>
            <CardDescription>Tax obligations and payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Sales Tax Collected</span>
              <span className="font-bold">${financialData.salesTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Income Tax Due</span>
              <span className="font-bold">${(financialData.netProfit * 0.25).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Payroll Tax</span>
              <span className="font-bold">${(financialData.totalExpenses * 0.15).toLocaleString()}</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Tax Liability</span>
                <span className="font-bold">${(financialData.salesTax + (financialData.netProfit * 0.25) + (financialData.totalExpenses * 0.15)).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Analysis</CardTitle>
          <CardDescription>Monthly cash flow breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">${financialData.cashInflow.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Cash Inflow</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">${financialData.cashOutflow.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Cash Outflow</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className={`text-2xl font-bold ${financialData.netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ${financialData.netCashFlow.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Net Cash Flow</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
