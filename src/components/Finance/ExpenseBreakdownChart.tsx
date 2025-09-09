import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Loader2 } from 'lucide-react';

interface ExpenseData {
  category: string;
  amount: number;
  color: string;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function ExpenseBreakdownChart() {
  const [data, setData] = useState<ExpenseData[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization) {
      fetchExpenseData();
    }
  }, [currentOrganization]);

  const fetchExpenseData = async () => {
    try {
      setLoading(true);
      
      // Fetch expenses data for the current year
      const { data: expensesData, error } = await supabase
        .from('expenses')
        .select('category, amount')
        .eq('organization_id', currentOrganization?.id)
        .gte('expense_date', new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);

      if (error) throw error;

      // Group by category and calculate totals
      const categoryTotals = expensesData?.reduce((acc: { [key: string]: number }, expense) => {
        const category = expense.category || 'Other';
        acc[category] = (acc[category] || 0) + (expense.amount || 0);
        return acc;
      }, {}) || {};

      // Convert to chart format
      const chartData = Object.entries(categoryTotals)
        .map(([category, amount], index) => ({
          category,
          amount: Number(amount),
          color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.amount - a.amount);

      setData(chartData);
    } catch (error) {
      console.error('Error fetching expense data:', error);
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
        No expense data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{data.category}</p>
          <p className="text-sm text-muted-foreground">
            Amount: ${data.amount.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="amount"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            formatter={(value, entry: any) => `${value}: $${entry.payload.amount.toLocaleString()}`}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}