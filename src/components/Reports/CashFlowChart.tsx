import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Loader2 } from 'lucide-react';

interface CashFlowData {
  month: string;
  inflow: number;
  outflow: number;
  netFlow: number;
}

export function CashFlowChart() {
  const [data, setData] = useState<CashFlowData[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization) {
      fetchCashFlowData();
    }
  }, [currentOrganization]);

  const fetchCashFlowData = async () => {
    try {
      setLoading(true);
      
      // Fetch sales data (inflow)
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total_amount, sale_date')
        .eq('organization_id', currentOrganization?.id)
        .gte('sale_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      if (salesError) throw salesError;

      // Fetch expenses data (outflow)
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .eq('organization_id', currentOrganization?.id)
        .gte('expense_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (expensesError) throw expensesError;

      // Group sales by month
      const monthlyInflow = salesData?.reduce((acc: { [key: string]: number }, sale) => {
        const date = new Date(sale.sale_date);
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        acc[monthKey] = (acc[monthKey] || 0) + (sale.total_amount || 0);
        return acc;
      }, {}) || {};

      // Group expenses by month
      const monthlyOutflow = expensesData?.reduce((acc: { [key: string]: number }, expense) => {
        const date = new Date(expense.expense_date);
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        acc[monthKey] = (acc[monthKey] || 0) + (expense.amount || 0);
        return acc;
      }, {}) || {};

      // Create combined data for the last 12 months
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        months.push(monthKey);
      }

      const cashFlowData = months.map(month => {
        const inflow = monthlyInflow[month] || 0;
        const outflow = monthlyOutflow[month] || 0;
        const netFlow = inflow - outflow;

        return {
          month,
          inflow: Number(inflow),
          outflow: Number(outflow),
          netFlow: Number(netFlow)
        };
      });

      setData(cashFlowData);
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No cash flow data available
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              const labels = {
                inflow: 'Cash Inflow',
                outflow: 'Cash Outflow',
                netFlow: 'Net Cash Flow'
              };
              return [`$${value.toLocaleString()}`, labels[name as keyof typeof labels] || name];
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
          <Area
            type="monotone"
            dataKey="inflow"
            stackId="1"
            stroke="hsl(var(--chart-1))"
            fill="hsl(var(--chart-1))"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="outflow"
            stackId="2"
            stroke="hsl(var(--chart-2))"
            fill="hsl(var(--chart-2))"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="netFlow"
            stackId="3"
            stroke="hsl(var(--chart-3))"
            fill="hsl(var(--chart-3))"
            fillOpacity={0.4}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}