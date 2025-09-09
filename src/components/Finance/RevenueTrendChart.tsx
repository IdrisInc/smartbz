import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Loader2 } from 'lucide-react';

interface RevenueData {
  month: string;
  revenue: number;
}

export function RevenueTrendChart() {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization) {
      fetchRevenueData();
    }
  }, [currentOrganization]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      
      // Fetch sales data for the last 12 months
      const { data: salesData, error } = await supabase
        .from('sales')
        .select('total_amount, sale_date')
        .eq('organization_id', currentOrganization?.id)
        .gte('sale_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('sale_date', { ascending: true });

      if (error) throw error;

      // Group by month and calculate totals
      const monthlyRevenue = salesData?.reduce((acc: { [key: string]: number }, sale) => {
        const date = new Date(sale.sale_date);
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        acc[monthKey] = (acc[monthKey] || 0) + (sale.total_amount || 0);
        return acc;
      }, {}) || {};

      // Convert to chart format
      const chartData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        revenue: Number(revenue)
      }));

      setData(chartData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
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
        No revenue data available
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}