import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LowStockAlertsProps {
  organizationId: string;
}

export function LowStockAlerts({ organizationId }: LowStockAlertsProps) {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId) {
      fetchLowStockProducts();
    }
  }, [organizationId]);

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId)
        .or('stock_quantity.lte.min_stock_level,stock_quantity.eq.0')
        .eq('is_active', true)
        .order('stock_quantity', { ascending: true });

      if (error) throw error;
      setLowStockProducts(data || []);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stockQuantity: number, minStockLevel: number) => {
    if (stockQuantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (stockQuantity <= minStockLevel) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lowStockProducts.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <Package className="h-12 w-12 mx-auto mb-4 text-green-400" />
          <p>All products are well stocked!</p>
        </div>
      ) : (
        lowStockProducts.map((product: any) => {
          const status = getStockStatus(product.stock_quantity, product.min_stock_level);
          return (
            <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <h4 className="font-medium">{product.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    SKU: {product.sku || 'N/A'} | Category: {product.category || 'Uncategorized'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={status.variant}>
                  {status.label}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">
                  Stock: {product.stock_quantity} / Min: {product.min_stock_level}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}