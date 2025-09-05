import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Package } from 'lucide-react';

interface TopProductsChartProps {
  organizationId: string;
  dateRange: string;
}

export function TopProductsChart({ organizationId, dateRange }: TopProductsChartProps) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId) {
      fetchTopProducts();
    }
  }, [organizationId, dateRange]);

  const fetchTopProducts = async () => {
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

      // Fetch top products based on sales data
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          product_id,
          quantity,
          total_amount,
          products(name, price),
          sales!inner(organization_id, sale_date)
        `)
        .eq('sales.organization_id', organizationId)
        .gte('sales.sale_date', startDate.toISOString())
        .lte('sales.sale_date', endDate.toISOString());

      if (error) throw error;

      // Group by product and calculate totals
      const productSales = {};
      data?.forEach(item => {
        const productId = item.product_id;
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.products?.name || 'Unknown Product',
            totalQuantity: 0,
            totalRevenue: 0,
            price: item.products?.price || 0
          };
        }
        productSales[productId].totalQuantity += item.quantity || 0;
        productSales[productId].totalRevenue += item.total_amount || 0;
      });

      // Convert to array and sort by revenue
      const topProducts = Object.values(productSales)
        .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);

      setProducts(topProducts);
    } catch (error) {
      console.error('Error fetching top products:', error);
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
      {products.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No product sales data found for the selected period</p>
        </div>
      ) : (
        products.map((product: any, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium">{product.name}</h4>
              <p className="text-sm text-muted-foreground">
                {product.totalQuantity} units sold
              </p>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">${product.totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Revenue</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}