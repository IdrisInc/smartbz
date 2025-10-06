
import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PurchaseOrderForm } from '@/components/Inventory/PurchaseOrderForm';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

export default function Inventory() {
  const [showPOForm, setShowPOForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    inventoryValue: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  useEffect(() => {
    if (currentOrganization) {
      fetchProducts();
      fetchStats();
    }
  }, [currentOrganization]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', currentOrganization?.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch products for stats
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('stock_quantity, min_stock_level, price, cost')
        .eq('organization_id', currentOrganization?.id)
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Fetch purchase orders
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select('status')
        .eq('organization_id', currentOrganization?.id)
        .eq('status', 'pending');

      if (poError) throw poError;

      const totalItems = productsData?.length || 0;
      const lowStockItems = productsData?.filter(p => (p.stock_quantity || 0) <= (p.min_stock_level || 0)).length || 0;
      const inventoryValue = productsData?.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.cost || p.price || 0)), 0) || 0;
      const pendingOrders = poData?.length || 0;

      setStats({ totalItems, lowStockItems, inventoryValue, pendingOrders });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Purchases & Inventory</h2>
          <p className="text-sm text-muted-foreground">
            Manage inventory levels, purchase orders, and stock movements
          </p>
        </div>
        <Button onClick={() => setShowPOForm(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Purchase Order
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active inventory items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Need reordering</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.inventoryValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total stock value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Purchase orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  {searchTerm ? 'No products found matching your search.' : 'No products in inventory yet.'}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredProducts.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription>
                        SKU: {item.sku || 'N/A'} | Category: {item.category || 'Uncategorized'}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={(item.stock_quantity || 0) <= (item.min_stock_level || 0) ? 'destructive' : 'default'}
                    >
                      {(item.stock_quantity || 0) <= (item.min_stock_level || 0) ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Current Stock</div>
                      <div className="text-base sm:text-lg font-semibold">{item.stock_quantity || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Min Stock Level</div>
                      <div className="text-base sm:text-lg">{item.min_stock_level || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Price</div>
                      <div className="text-base sm:text-lg font-semibold">${item.price?.toLocaleString() || '0'}</div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Cost</div>
                      <div className="text-base sm:text-lg">${item.cost?.toLocaleString() || '0'}</div>
                    </div>
                  </div>
                  {item.description && (
                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground mb-1">Description:</div>
                      <div className="text-sm">{item.description}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {showPOForm && (
        <PurchaseOrderForm onClose={() => setShowPOForm(false)} />
      )}
    </div>
  );
}
