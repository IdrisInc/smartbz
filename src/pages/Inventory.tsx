
import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, TrendingDown, AlertTriangle, Loader2, FileText, RotateCcw, ClipboardList, Check, Eye, ArrowRight, History, Printer, Download, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PurchaseOrderForm } from '@/components/Inventory/PurchaseOrderForm';
import { PurchaseReturnDialog } from '@/components/Inventory/PurchaseReturnDialog';
import { QuotationDialog } from '@/components/Inventory/QuotationDialog';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { useExportUtils } from '@/hooks/useExportUtils';
import { formatDistanceToNow, format } from 'date-fns';

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPOForm, setShowPOForm] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showQuotationDialog, setShowQuotationDialog] = useState(false);
  const [showPODetails, setShowPODetails] = useState(false);
  const [showReturnDetails, setShowReturnDetails] = useState(false);
  const [showQuotationDetails, setShowQuotationDetails] = useState(false);
  const [showReceiveActions, setShowReceiveActions] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [receivedPO, setReceivedPO] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [movements, setMovements] = useState([]);
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
  const [loadingMovements, setLoadingMovements] = useState(true);
  
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const { exportToCSV } = useExportUtils();

  useEffect(() => {
    if (currentOrganization) {
      fetchProducts();
      fetchStats();
      fetchPurchaseOrders();
      fetchPurchaseReturns();
      fetchQuotations();
      fetchMovements();
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
        .select(`
          *,
          supplier:contacts(name, phone, email)
        `)
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

  const fetchMovements = async () => {
    try {
      setLoadingMovements(true);
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*, product:products(name, sku)')
        .eq('organization_id', currentOrganization?.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoadingMovements(false);
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

  const handleReceivePO = async (poId: string) => {
    try {
      // Get PO details with items
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .select('*, supplier:contacts(name, email), items:purchase_order_items(*, product:products(name))')
        .eq('id', poId)
        .single();

      if (poError) throw poError;

      const { error } = await supabase
        .from('purchase_orders')
        .update({ status: 'received' })
        .eq('id', poId);

      if (error) throw error;

      setReceivedPO(po);
      setShowReceiveActions(true);

      // Send email notification to supplier
      if (po?.supplier?.email && currentOrganization) {
        try {
          await supabase.functions.invoke('send-transaction-email', {
            body: {
              type: 'purchase',
              transactionId: poId,
              recipientEmail: po.supplier.email,
              recipientName: po.supplier.name || 'Supplier',
              organizationId: currentOrganization.id
            }
          });
          console.log('PO received email sent to supplier');
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          // Don't fail the receive if email fails
        }
      }

      toast({
        title: "Success",
        description: "Purchase order received and stock updated",
      });

      fetchPurchaseOrders();
      fetchStats();
      fetchProducts();
      fetchMovements();
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      toast({
        title: "Error",
        description: "Failed to receive purchase order",
        variant: "destructive",
      });
    }
  };

  const handlePrintPO = () => {
    window.print();
    toast({ title: "Print dialog opened" });
  };

  const handleExportPO = () => {
    if (!receivedPO) return;
    const exportData = receivedPO.items?.map((item: any) => ({
      Product: item.product?.name,
      Quantity: item.quantity,
      'Unit Price': item.unit_price,
      Total: item.total_amount
    }));
    exportToCSV(exportData, `Received-${receivedPO.po_number}`);
  };

  const handleEmailPO = () => {
    if (!receivedPO?.supplier?.email) {
      toast({
        variant: "destructive",
        title: "No email",
        description: "Supplier has no email address"
      });
      return;
    }
    const subject = `Purchase Order Received - ${receivedPO.po_number}`;
    const body = `Purchase Order ${receivedPO.po_number} has been received.\n\nTotal: $${Number(receivedPO.total_amount).toFixed(2)}`;
    window.location.href = `mailto:${receivedPO.supplier.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast({ title: "Email client opened" });
  };

  const viewPODetails = async (po: any) => {
    try {
      const { data: items, error } = await supabase
        .from('purchase_order_items')
        .select('*, product:products(name, sku)')
        .eq('purchase_order_id', po.id);
      
      if (error) throw error;
      setSelectedPO({ ...po, items });
      setShowPODetails(true);
    } catch (error) {
      console.error('Error fetching PO details:', error);
      toast({
        title: "Error",
        description: "Failed to load purchase order details",
        variant: "destructive",
      });
    }
  };

  const viewReturnDetails = async (returnItem: any) => {
    try {
      const { data: items, error } = await supabase
        .from('purchase_return_items')
        .select('*, product:products(name, sku)')
        .eq('purchase_return_id', returnItem.id);
      
      if (error) throw error;
      setSelectedReturn({ ...returnItem, items });
      setShowReturnDetails(true);
    } catch (error) {
      console.error('Error fetching return details:', error);
      toast({
        title: "Error",
        description: "Failed to load return details",
        variant: "destructive",
      });
    }
  };

  const viewQuotationDetails = async (quotation: any) => {
    try {
      const { data: items, error } = await supabase
        .from('quotation_items')
        .select('*, product:products(name, sku)')
        .eq('quotation_id', quotation.id);
      
      if (error) throw error;
      setSelectedQuotation({ ...quotation, items });
      setShowQuotationDetails(true);
    } catch (error) {
      console.error('Error fetching quotation details:', error);
      toast({
        title: "Error",
        description: "Failed to load quotation details",
        variant: "destructive",
      });
    }
  };

  const convertQuotationToPO = async (quotation: any) => {
    try {
      // Get quotation items
      const { data: items, error: itemsError } = await supabase
        .from('quotation_items')
        .select('*')
        .eq('quotation_id', quotation.id);

      if (itemsError) throw itemsError;

      // Generate PO number
      const { data: lastPO } = await supabase
        .from('purchase_orders')
        .select('po_number')
        .eq('organization_id', currentOrganization?.id)
        .order('created_at', { ascending: false })
        .limit(1);

      let poNumber = 'PO-0001';
      if (lastPO && lastPO.length > 0) {
        const lastNumber = parseInt(lastPO[0].po_number.split('-')[1]);
        poNumber = `PO-${String(lastNumber + 1).padStart(4, '0')}`;
      }

      // Create purchase order
      const { data: newPO, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          organization_id: currentOrganization?.id,
          branch_id: quotation.branch_id,
          supplier_id: quotation.supplier_id,
          po_number: poNumber,
          order_date: new Date().toISOString().split('T')[0],
          total_amount: quotation.total_amount,
          status: 'pending',
          notes: `Converted from Quotation ${quotation.quotation_number}`
        })
        .select()
        .single();

      if (poError) throw poError;

      // Create PO items
      const poItems = items?.map(item => ({
        purchase_order_id: newPO.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.total_amount
      }));

      const { error: itemsInsertError } = await supabase
        .from('purchase_order_items')
        .insert(poItems);

      if (itemsInsertError) throw itemsInsertError;

      // Update quotation status
      await supabase
        .from('quotations')
        .update({ status: 'converted' })
        .eq('id', quotation.id);

      toast({
        title: "Success",
        description: `Purchase Order ${poNumber} created from quotation`,
      });

      fetchQuotations();
      fetchPurchaseOrders();
      setShowQuotationDetails(false);
      setActiveTab('orders');
    } catch (error) {
      console.error('Error converting quotation to PO:', error);
      toast({
        title: "Error",
        description: "Failed to convert quotation to purchase order",
        variant: "destructive",
      });
    }
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <Package className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="orders">
            <FileText className="h-4 w-4 mr-2" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="returns">
            <RotateCcw className="h-4 w-4 mr-2" />
            Returns
          </TabsTrigger>
          <TabsTrigger value="quotations">
            <ClipboardList className="h-4 w-4 mr-2" />
            Quotations
          </TabsTrigger>
          <TabsTrigger value="movements">
            <History className="h-4 w-4 mr-2" />
            Movements
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
                      <TableHead>Supplier</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.po_number}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{po.supplier?.name || 'N/A'}</div>
                            {po.supplier?.phone && (
                              <div className="text-xs text-muted-foreground">{po.supplier.phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(po.order_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          {po.expected_date ? format(new Date(po.expected_date), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>${Number(po.total_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(po.status || 'draft')}>
                            {po.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => viewPODetails(po)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {po.status !== 'received' && po.status !== 'cancelled' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleReceivePO(po.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Receive
                              </Button>
                            )}
                          </div>
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseReturns.map((ret) => (
                      <TableRow key={ret.id}>
                        <TableCell className="font-medium">{ret.return_number}</TableCell>
                        <TableCell>{format(new Date(ret.return_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>${Number(ret.total_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(ret.status || 'pending')}>
                            {ret.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{ret.reason || '-'}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => viewReturnDetails(ret)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell className="font-medium">{quote.quotation_number}</TableCell>
                        <TableCell>{format(new Date(quote.quotation_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{quote.valid_until ? format(new Date(quote.valid_until), 'MMM dd, yyyy') : '-'}</TableCell>
                        <TableCell>${Number(quote.total_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(quote.status || 'draft')}>
                            {quote.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => viewQuotationDetails(quote)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {quote.status !== 'converted' && quote.status !== 'rejected' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => viewQuotationDetails(quote)}
                              >
                                <ArrowRight className="h-4 w-4 mr-1" />
                                Convert
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Movements</CardTitle>
              <CardDescription>Track incoming and outgoing stock movements</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMovements ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </div>
              ) : !movements || movements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Movements Yet</p>
                  <p className="text-sm">Stock movements will appear here as you receive orders and process returns</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement: any) => (
                      <TableRow key={movement.id}>
                        <TableCell>{format(new Date(movement.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{movement.product?.name}</div>
                            <div className="text-xs text-muted-foreground">{movement.product?.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={movement.quantity > 0 ? 'default' : 'secondary'}>
                            {movement.movement_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {movement.reference_type || '-'}
                        </TableCell>
                        <TableCell className="text-sm">{movement.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Receive PO Actions Dialog */}
      <Dialog open={showReceiveActions} onOpenChange={setShowReceiveActions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Order Received</DialogTitle>
            <DialogDescription>
              {receivedPO?.po_number} - Stock has been updated
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              What would you like to do next?
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={handlePrintPO}>
                <Printer className="h-4 w-4 mr-2" />
                Print Purchase Order
              </Button>
              <Button variant="outline" onClick={handleExportPO}>
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
              <Button variant="outline" onClick={handleEmailPO}>
                <Mail className="h-4 w-4 mr-2" />
                Email Supplier
              </Button>
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setShowReceiveActions(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Purchase Order Details Dialog */}
      <Dialog open={showPODetails} onOpenChange={setShowPODetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
            <DialogDescription>
              {selectedPO?.po_number} - {selectedPO?.supplier?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">{format(new Date(selectedPO.order_date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Date</p>
                  <p className="font-medium">
                    {selectedPO.expected_date ? format(new Date(selectedPO.expected_date), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(selectedPO.status)}>{selectedPO.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium text-lg">${Number(selectedPO.total_amount).toFixed(2)}</p>
                </div>
              </div>
              
              {selectedPO.supplier && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Supplier Information</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span> {selectedPO.supplier.name}
                    </div>
                    {selectedPO.supplier.phone && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span> {selectedPO.supplier.phone}
                      </div>
                    )}
                    {selectedPO.supplier.email && (
                      <div>
                        <span className="text-muted-foreground">Email:</span> {selectedPO.supplier.email}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Line Items</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPO.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product?.name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.product?.sku || '-'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${Number(item.unit_price).toFixed(2)}</TableCell>
                        <TableCell className="font-medium">${Number(item.total_amount).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedPO.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm border rounded p-2">{selectedPO.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Return Details Dialog */}
      <Dialog open={showReturnDetails} onOpenChange={setShowReturnDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Return Details</DialogTitle>
            <DialogDescription>{selectedReturn?.return_number}</DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Return Date</p>
                  <p className="font-medium">{format(new Date(selectedReturn.return_date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(selectedReturn.status)}>{selectedReturn.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium text-lg">${Number(selectedReturn.total_amount).toFixed(2)}</p>
                </div>
                {selectedReturn.reason && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reason</p>
                    <p className="text-sm">{selectedReturn.reason}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Returned Items</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedReturn.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product?.name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.product?.sku || '-'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${Number(item.unit_price).toFixed(2)}</TableCell>
                        <TableCell className="font-medium">${Number(item.total_amount).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedReturn.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm border rounded p-2">{selectedReturn.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quotation Details Dialog */}
      <Dialog open={showQuotationDetails} onOpenChange={setShowQuotationDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quotation Details</DialogTitle>
            <DialogDescription>{selectedQuotation?.quotation_number}</DialogDescription>
          </DialogHeader>
          {selectedQuotation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Quotation Date</p>
                  <p className="font-medium">{format(new Date(selectedQuotation.quotation_date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valid Until</p>
                  <p className="font-medium">
                    {selectedQuotation.valid_until ? format(new Date(selectedQuotation.valid_until), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(selectedQuotation.status)}>{selectedQuotation.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium text-lg">${Number(selectedQuotation.total_amount).toFixed(2)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Items</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedQuotation.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product?.name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.product?.sku || '-'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${Number(item.unit_price).toFixed(2)}</TableCell>
                        <TableCell className="font-medium">${Number(item.total_amount).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedQuotation.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm border rounded p-2">{selectedQuotation.notes}</p>
                </div>
              )}

              {selectedQuotation.status !== 'converted' && selectedQuotation.status !== 'rejected' && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button 
                    variant="outline"
                    onClick={() => setShowQuotationDetails(false)}
                  >
                    Close
                  </Button>
                  <Button onClick={() => convertQuotationToPO(selectedQuotation)}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Convert to Purchase Order
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
