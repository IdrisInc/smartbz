import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Loader2 } from 'lucide-react';

interface CustomerData {
  month: string;
  newCustomers: number;
  totalCustomers: number;
  acquisitionRate: number;
}

export function CustomerAcquisitionChart() {
  const [data, setData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization) {
      fetchCustomerData();
    }
  }, [currentOrganization]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      // Fetch contacts data (customers)
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select('created_at, contact_type')
        .eq('organization_id', currentOrganization?.id)
        .eq('contact_type', 'customer')
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at');

      if (error) throw error;

      // Group customers by month
      const monthlyNewCustomers = contactsData?.reduce((acc: { [key: string]: number }, contact) => {
        const date = new Date(contact.created_at);
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        acc[monthKey] = (acc[monthKey] || 0) + 1;
        return acc;
      }, {}) || {};

      // Create data for the last 12 months
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        months.push(monthKey);
      }

      let runningTotal = 0;
      const customerData = months.map((month, index) => {
        const newCustomers = monthlyNewCustomers[month] || 0;
        runningTotal += newCustomers;
        
        // Calculate acquisition rate (percentage growth)
        const prevTotal = index > 0 ? runningTotal - newCustomers : 0;
        const acquisitionRate = prevTotal > 0 ? (newCustomers / prevTotal) * 100 : 0;

        return {
          month,
          newCustomers,
          totalCustomers: runningTotal,
          acquisitionRate: Number(acquisitionRate.toFixed(1))
        };
      });

      setData(customerData);
    } catch (error) {
      console.error('Error fetching customer data:', error);
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
        No customer data available
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
            tickFormatter={(value) => value.toString()}
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              const labels = {
                newCustomers: 'New Customers',
                totalCustomers: 'Total Customers',
                acquisitionRate: 'Acquisition Rate (%)'
              };
              const suffix = name === 'acquisitionRate' ? '%' : '';
              return [`${value}${suffix}`, labels[name as keyof typeof labels] || name];
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
            dataKey="newCustomers" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="totalCustomers" 
            stroke="hsl(var(--chart-2))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: 'hsl(var(--chart-2))', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="acquisitionRate" 
            stroke="hsl(var(--chart-3))" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: 'hsl(var(--chart-3))', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}