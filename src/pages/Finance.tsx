
import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Receipt, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvoicesTab } from '@/components/Finance/InvoicesTab';
import { ExpensesTab } from '@/components/Finance/ExpensesTab';
import { ReportsTab } from '@/components/Finance/ReportsTab';
import { RevenueTrendChart } from '@/components/Finance/RevenueTrendChart';
import { ExpenseBreakdownChart } from '@/components/Finance/ExpenseBreakdownChart';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { UpgradePrompt } from '@/components/Organization/UpgradePrompt';

export default function Finance() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    profit: 0,
    outstanding: 0
  });
  const [loading, setLoading] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const { hasFinanceAccess } = useSubscriptionLimits();

  // Check if user has access to finance module
  useEffect(() => {
    if (!hasFinanceAccess() && !promptDismissed) {
      setShowUpgradePrompt(true);
    }
  }, [hasFinanceAccess, promptDismissed]);

  useEffect(() => {
    if (currentOrganization) {
      fetchFinanceStats();
    }
  }, [currentOrganization]);

  const fetchFinanceStats = async () => {
    try {
      setLoading(true);
      
      // Fetch sales data for revenue
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('organization_id', currentOrganization?.id);

      if (salesError) throw salesError;

      // Fetch expenses data
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('organization_id', currentOrganization?.id);

      if (expensesError) throw expensesError;

      // Fetch outstanding invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('organization_id', currentOrganization?.id)
        .eq('status', 'pending');

      if (invoicesError) throw invoicesError;

      const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const totalExpenses = expensesData?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
      const outstanding = invoicesData?.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0;

      setStats({
        totalRevenue,
        totalExpenses,
        profit: totalRevenue - totalExpenses,
        outstanding
      });
    } catch (error) {
      console.error('Error fetching finance stats:', error);
      toast({
        title: "Error",
        description: "Failed to load finance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Finance & Accounting</h2>
        <p className="text-muted-foreground">
          Track revenue, expenses, and financial performance
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From sales transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total business expenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${stats.profit.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Revenue minus expenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <Receipt className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.outstanding.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Pending invoice payments</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueTrendChart />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Expenses by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseBreakdownChart />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <InvoicesTab />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesTab />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>
      </Tabs>

      <UpgradePrompt
        feature="finance"
        action="access finance features"
        open={showUpgradePrompt}
        onClose={() => {
          setShowUpgradePrompt(false);
          setPromptDismissed(true);
        }}
      />
    </div>
  );
}
