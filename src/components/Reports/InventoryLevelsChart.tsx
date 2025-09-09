import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Loader2 } from 'lucide-react';

interface InventoryData {
  name: string;
  current: number;
  minimum: number;
  status: 'good' | 'low' | 'critical';
}

export function InventoryLevelsChart() {
  const [data, setData] = useState<InventoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization) {
      fetchInventoryData();
    }
  }, [currentOrganization]);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      
      const { data: productsData, error } = await supabase
        .from('products')
        .select('name, stock_quantity, min_stock_level')
        .eq('organization_id', currentOrganization?.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const inventoryData = productsData?.map(product => {
        const current = product.stock_quantity || 0;
        const minimum = product.min_stock_level || 0;
        
        let status: 'good' | 'low' | 'critical' = 'good';
        if (current === 0) {
          status = 'critical';
        } else if (current <= minimum) {
          status = 'low';
        }

        return {
          name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
          current,
          minimum,
          status
        };
      }) || [];

      setData(inventoryData);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
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
        No inventory data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Current Stock: {data.current}
          </p>
          <p className="text-sm text-muted-foreground">
            Minimum Level: {data.minimum}
          </p>
          <p className={`text-sm font-medium ${
            data.status === 'critical' ? 'text-red-500' : 
            data.status === 'low' ? 'text-yellow-500' : 'text-green-500'
          }`}>
            Status: {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.toString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="current" 
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="minimum" 
            fill="hsl(var(--muted))" 
            radius={[2, 2, 0, 0]}
            opacity={0.5}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}