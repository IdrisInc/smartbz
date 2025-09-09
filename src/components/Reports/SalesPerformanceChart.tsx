import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Loader2 } from 'lucide-react';

interface SalesData {
  month: string;
  sales: number;
  revenue: number;
  growth: number;
}

export function SalesPerformanceChart() {
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization) {
      fetchSalesData();
    }
  }, [currentOrganization]);

  const fetchSalesData = async () => {
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

      // Group by month and calculate metrics
      const monthlyData = salesData?.reduce((acc: { [key: string]: { sales: number; revenue: number } }, sale) => {
        const date = new Date(sale.sale_date);
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        
        if (!acc[monthKey]) {
          acc[monthKey] = { sales: 0, revenue: 0 };
        }
        
        acc[monthKey].sales += 1;
        acc[monthKey].revenue += sale.total_amount || 0;
        return acc;
      }, {}) || {};

      // Convert to chart format with growth calculation
      const chartData = Object.entries(monthlyData).map(([month, data], index, array) => {
        const prevRevenue = index > 0 ? array[index - 1][1].revenue : data.revenue;
        const growth = prevRevenue > 0 ? ((data.revenue - prevRevenue) / prevRevenue) * 100 : 0;
        
        return {
          month,
          sales: data.sales,
          revenue: Number(data.revenue),
          growth: Number(growth.toFixed(1))
        };
      });

      setData(chartData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
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
        No sales data available
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
            formatter={(value: number, name: string) => {
              if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
              if (name === 'sales') return [value, 'Sales Count'];
              if (name === 'growth') return [`${value}%`, 'Growth'];
              return [value, name];
            }}
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
          <Line 
            type="monotone" 
            dataKey="growth" 
            stroke="hsl(var(--chart-2))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: 'hsl(var(--chart-2))', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}