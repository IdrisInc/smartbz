
import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, TrendingDown, AlertTriangle, Loader2, FileText, RotateCcw, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PurchaseOrderForm } from '@/components/Inventory/PurchaseOrderForm';
import { PurchaseReturnDialog } from '@/components/Inventory/PurchaseReturnDialog';
import { QuotationDialog } from '@/components/Inventory/QuotationDialog';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPOForm, setShowPOForm] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showQuotationDialog, setShowQuotationDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    inventoryValue: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [loadingPO, setLoadingPO] = useState(true);
  const [loadingReturns, setLoadingReturns] = useState(true);
  const [loadingQuotations, setLoadingQuotations] = useState(true);
  
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  useEffect(() => {
    if (currentOrganization) {
      fetchProducts();
      fetchStats();
      fetchPurchaseOrders();
      fetchPurchaseReturns();
      fetchQuotations();
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
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('stock_quantity, min_stock_level, price, cost')
        .eq('organization_id', currentOrganization?.id)
        .eq('is_active', true);

      if (productsError) throw productsError;

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

  const fetchPurchaseOrders = async () => {
    try {
      setLoadingPO(true);
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('organization_id', currentOrganization?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPurchaseOrders(data || []);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoadingPO(false);
    }
  };

  const fetchPurchaseReturns = async () => {
    try {
      setLoadingReturns(true);
      const { data, error } = await supabase
        .from('purchase_returns')
        .select('*')
        .eq('organization_id', currentOrganization?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPurchaseReturns(data || []);
    } catch (error) {
      console.error('Error fetching purchase returns:', error);
    } finally {
      setLoadingReturns(false);
    }
  };

  const fetchQuotations = async () => {
    try {
      setLoadingQuotations(true);
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('organization_id', currentOrganization?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setQuotations(data || []);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoadingQuotations(false);
    }
  };

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    const colors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      draft: 'secondary',
      pending: 'outline',
      approved: 'default',
      received: 'default',
      cancelled: 'destructive',
    };
    return colors[status] || 'secondary';
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Package className="h-4 w-4 mr-2" />
            Inventory Overview
          </TabsTrigger>
          <TabsTrigger value="orders">
            <FileText className="h-4 w-4 mr-2" />
            Purchase Orders
          </TabsTrigger>
          <TabsTrigger value="returns">
            <RotateCcw className="h-4 w-4 mr-2" />
            Purchase Returns
          </TabsTrigger>
          <TabsTrigger value="quotations">
            <ClipboardList className="h-4 w-4 mr-2" />
            Quotations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Purchase Orders</CardTitle>
              <Button onClick={() => setShowPOForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Purchase Order
              </Button>
            </CardHeader>
            <CardContent>
              {loadingPO ? (
                <div className="text-center py-8">Loading...</div>
              ) : !purchaseOrders || purchaseOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No purchase orders found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.po_number}</TableCell>
                        <TableCell>{po.order_date}</TableCell>
                        <TableCell>${Number(po.total_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(po.status || 'draft')}>
                            {po.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(po.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Purchase Returns</CardTitle>
              <Button onClick={() => setShowReturnDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Return
              </Button>
            </CardHeader>
            <CardContent>
              {loadingReturns ? (
                <div className="text-center py-8">Loading...</div>
              ) : !purchaseReturns || purchaseReturns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No purchase returns found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Return Number</TableHead>
                      <TableHead>Return Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseReturns.map((ret) => (
                      <TableRow key={ret.id}>
                        <TableCell className="font-medium">{ret.return_number}</TableCell>
                        <TableCell>{ret.return_date}</TableCell>
                        <TableCell>${Number(ret.total_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(ret.status || 'pending')}>
                            {ret.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{ret.reason || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotations" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Quotations</CardTitle>
              <Button onClick={() => setShowQuotationDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Quotation
              </Button>
            </CardHeader>
            <CardContent>
              {loadingQuotations ? (
                <div className="text-center py-8">Loading...</div>
              ) : !quotations || quotations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No quotations found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quotation Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell className="font-medium">{quote.quotation_number}</TableCell>
                        <TableCell>{quote.quotation_date}</TableCell>
                        <TableCell>{quote.valid_until || '-'}</TableCell>
                        <TableCell>${Number(quote.total_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(quote.status || 'draft')}>
                            {quote.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showPOForm && (
        <PurchaseOrderForm 
          onClose={() => setShowPOForm(false)} 
          onSuccess={() => {
            fetchPurchaseOrders();
            fetchStats();
          }}
        />
      )}

      <PurchaseReturnDialog
        open={showReturnDialog}
        onOpenChange={setShowReturnDialog}
        onSuccess={fetchPurchaseReturns}
      />
      <QuotationDialog
        open={showQuotationDialog}
        onOpenChange={setShowQuotationDialog}
        onSuccess={fetchQuotations}
      />
      </div>
    </ProtectedRoute>
  );
}
