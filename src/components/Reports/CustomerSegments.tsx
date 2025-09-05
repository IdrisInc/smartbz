import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CustomerSegmentsProps {
  organizationId: string;
  dateRange: string;
}

export function CustomerSegments({ organizationId, dateRange }: CustomerSegmentsProps) {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId) {
      fetchCustomerSegments();
    }
  }, [organizationId, dateRange]);

  const fetchCustomerSegments = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (dateRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Fetch sales data with customer information
      const { data, error } = await supabase
        .from('sales')
        .select(`
          contact_id,
          total_amount,
          contacts(name)
        `)
        .eq('organization_id', organizationId)
        .gte('sale_date', startDate.toISOString())
        .lte('sale_date', endDate.toISOString())
        .not('contact_id', 'is', null);

      if (error) throw error;

      // Group by customer and calculate totals
      const customerData = {};
      data?.forEach(sale => {
        const customerId = sale.contact_id;
        if (!customerData[customerId]) {
          customerData[customerId] = {
            name: sale.contacts?.name || 'Unknown Customer',
            totalSpent: 0,
            orderCount: 0
          };
        }
        customerData[customerId].totalSpent += sale.total_amount || 0;
        customerData[customerId].orderCount += 1;
      });

      // Convert to array and categorize customers
      const customers = Object.values(customerData);
      const totalCustomers = customers.length;
      
      // Sort by total spent
      customers.sort((a: any, b: any) => b.totalSpent - a.totalSpent);
      
      // Calculate segments
      const highValueCount = customers.filter((c: any) => c.totalSpent > 1000).length;
      const mediumValueCount = customers.filter((c: any) => c.totalSpent >= 500 && c.totalSpent <= 1000).length;
      const lowValueCount = customers.filter((c: any) => c.totalSpent < 500).length;
      
      const segments = [
        {
          name: 'High Value Customers',
          count: highValueCount,
          percentage: totalCustomers > 0 ? ((highValueCount / totalCustomers) * 100).toFixed(1) : 0,
          description: 'Customers who spent $1000+',
          variant: 'default' as const,
          color: 'text-green-600'
        },
        {
          name: 'Medium Value Customers',
          count: mediumValueCount,
          percentage: totalCustomers > 0 ? ((mediumValueCount / totalCustomers) * 100).toFixed(1) : 0,
          description: 'Customers who spent $500-$1000',
          variant: 'secondary' as const,
          color: 'text-blue-600'
        },
        {
          name: 'Low Value Customers',
          count: lowValueCount,
          percentage: totalCustomers > 0 ? ((lowValueCount / totalCustomers) * 100).toFixed(1) : 0,
          description: 'Customers who spent under $500',
          variant: 'outline' as const,
          color: 'text-orange-600'
        }
      ];

      setSegments(segments);
    } catch (error) {
      console.error('Error fetching customer segments:', error);
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
      {segments.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No customer data found for the selected period</p>
        </div>
      ) : (
        segments.map((segment: any) => (
          <div key={segment.name} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className={`h-5 w-5 ${segment.color}`} />
              <div>
                <h4 className="font-medium">{segment.name}</h4>
                <p className="text-sm text-muted-foreground">{segment.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <Badge variant={segment.variant}>
                  {segment.percentage}%
                </Badge>
                <span className="font-bold text-lg">{segment.count}</span>
              </div>
              <div className="text-sm text-muted-foreground">customers</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}