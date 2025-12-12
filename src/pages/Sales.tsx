
import React, { useState, useEffect } from 'react';
import { Plus, Search, Receipt, CreditCard, Loader2, Eye, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SaleForm } from '@/components/Sales/SaleForm';
import { SaleReturnDialog } from '@/components/Sales/SaleReturnDialog';
import { SaleDetailsModal } from '@/components/Sales/SaleDetailsModal';
import { SaleReturnDetailsModal } from '@/components/Sales/SaleReturnDetailsModal';
import { POSInterface } from '@/components/Sales/POSInterface';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function Sales() {
  const [activeTab, setActiveTab] = useState('sales');
  const [showForm, setShowForm] = useState(false);
  const [showPOS, setShowPOS] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReturnDetailsModal, setShowReturnDetailsModal] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [selectedReturnId, setSelectedReturnId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sales, setSales] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [stats, setStats] = useState({
    todaysSales: 0,
    ordersToday: 0,
    pendingConfirmation: 0
  });
  const [loading, setLoading] = useState(true);
  const [loadingReturns, setLoadingReturns] = useState(true);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingSaleId, setRejectingSaleId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const { userRole } = useUserRole();
  
  const isBusinessOwner = userRole === 'business_owner';

  const handleViewDetails = (saleId: string) => {
    setSelectedSaleId(saleId);
    setShowDetailsModal(true);
  };

  const handleViewReturnDetails = (returnId: string) => {
    setSelectedReturnId(returnId);
    setShowReturnDetailsModal(true);
  };

  useEffect(() => {
    if (currentOrganization) {
      fetchSales();
      fetchStats();
      fetchReturns();
    }
  }, [currentOrganization]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          sale_number,
          total_amount,
          payment_status,
          payment_method,
          sale_date,
          created_at,
          confirmation_status,
          confirmed_at,
          rejection_reason,
          contacts(name)
        `)
        .eq('organization_id', currentOrganization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date().toDateString();
      
      const { data: todaySales, error: salesError } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('organization_id', currentOrganization?.id)
        .gte('sale_date', new Date(today).toISOString());

      if (salesError) throw salesError;

      const todaysSales = todaySales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const ordersToday = todaySales?.length || 0;

      // Get pending confirmation count
      const { count: pendingCount } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization?.id)
        .eq('confirmation_status', 'pending');

      setStats({ todaysSales, ordersToday, pendingConfirmation: pendingCount || 0 });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleConfirmSale = async (saleId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('sales')
        .update({
          confirmation_status: 'confirmed',
          confirmed_by: user?.id,
          confirmed_at: new Date().toISOString()
        })
        .eq('id', saleId);

      if (error) throw error;

      toast({
        title: "Sale Confirmed",
        description: "The sale has been confirmed successfully.",
      });
      
      fetchSales();
      fetchStats();
    } catch (error) {
      console.error('Error confirming sale:', error);
      toast({
        title: "Error",
        description: "Failed to confirm sale",
        variant: "destructive",
      });
    }
  };

  const handleRejectSale = async () => {
    if (!rejectingSaleId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('sales')
        .update({
          confirmation_status: 'rejected',
          confirmed_by: user?.id,
          confirmed_at: new Date().toISOString(),
          rejection_reason: rejectionReason || 'No reason provided'
        })
        .eq('id', rejectingSaleId);

      if (error) throw error;

      toast({
        title: "Sale Rejected",
        description: "The sale has been rejected.",
      });
      
      setShowRejectDialog(false);
      setRejectingSaleId('');
      setRejectionReason('');
      fetchSales();
      fetchStats();
    } catch (error) {
      console.error('Error rejecting sale:', error);
      toast({
        title: "Error",
        description: "Failed to reject sale",
        variant: "destructive",
      });
    }
  };

  const openRejectDialog = (saleId: string) => {
    setRejectingSaleId(saleId);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const fetchReturns = async () => {
    try {
      setLoadingReturns(true);
      const { data, error } = await supabase
        .from('sale_returns')
        .select(`
          *,
          sales(contacts(name))
        `)
        .eq('organization_id', currentOrganization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReturns(data || []);
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast({
        title: "Error",
        description: "Failed to load sale returns",
        variant: "destructive",
      });
    } finally {
      setLoadingReturns(false);
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.sale_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.contacts?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Sales & Orders</h2>
          <p className="text-sm text-muted-foreground">
            Manage sales transactions and customer orders
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => setShowPOS(true)} className="w-full sm:w-auto">
            <Receipt className="mr-2 h-4 w-4" />
            POS System
          </Button>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.todaysSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Sales for today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ordersToday}</div>
            <p className="text-xs text-muted-foreground">Transactions today</p>
          </CardContent>
        </Card>
        {isBusinessOwner && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingConfirmation}</div>
              <p className="text-xs text-muted-foreground">Awaiting your confirmation</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sales">
            <Receipt className="h-4 w-4 mr-2" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="returns">
            <RotateCcw className="h-4 w-4 mr-2" />
            Sale Returns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
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
              {filteredSales.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                      {searchTerm ? 'No sales found matching your search.' : 'No sales recorded yet.'}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredSales.map((sale) => (
                  <Card key={sale.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg">{sale.sale_number || `Sale #${sale.id.slice(0, 8)}`}</CardTitle>
                          <CardDescription>Customer: {sale.contacts?.name || 'Walk-in Customer'}</CardDescription>
                        </div>
                      <div className="text-right space-y-1">
                          <div className="text-2xl font-bold">${sale.total_amount?.toLocaleString() || '0'}</div>
                          <div className="flex gap-1 justify-end">
                            <Badge variant={sale.payment_status === 'paid' ? 'default' : 'secondary'}>
                              {sale.payment_status || 'pending'}
                            </Badge>
                            <Badge 
                              variant={
                                sale.confirmation_status === 'confirmed' ? 'default' : 
                                sale.confirmation_status === 'rejected' ? 'destructive' : 
                                'outline'
                              }
                            >
                              {sale.confirmation_status === 'confirmed' && <Check className="h-3 w-3 mr-1" />}
                              {sale.confirmation_status === 'rejected' && <X className="h-3 w-3 mr-1" />}
                              {sale.confirmation_status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {sale.confirmation_status || 'pending'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Payment: {sale.payment_method || 'Not specified'}</span>
                          <span>Date: {new Date(sale.sale_date || sale.created_at).toLocaleDateString()}</span>
                          {sale.rejection_reason && (
                            <span className="text-destructive">Reason: {sale.rejection_reason}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {isBusinessOwner && sale.confirmation_status === 'pending' && (
                            <>
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleConfirmSale(sale.id)}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Confirm
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => openRejectDialog(sale.id)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(sale.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="returns" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sale Returns</CardTitle>
              <Button onClick={() => setShowReturnDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Return
              </Button>
            </CardHeader>
            <CardContent>
              {loadingReturns ? (
                <div className="text-center py-8">Loading...</div>
              ) : !returns || returns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sale returns found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Return Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Return Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Refund</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returns.map((ret) => (
                      <TableRow key={ret.id}>
                        <TableCell className="font-medium">{ret.return_number}</TableCell>
                        <TableCell>{ret.sales?.contacts?.name || 'Walk-in Customer'}</TableCell>
                        <TableCell>{ret.return_date}</TableCell>
                        <TableCell>${Number(ret.total_amount).toFixed(2)}</TableCell>
                        <TableCell>${Number(ret.refund_amount || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={ret.status === 'approved' ? 'default' : ret.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {ret.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{ret.reason || '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReturnDetails(ret.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
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
      </Tabs>

      {showForm && (
        <SaleForm onClose={() => setShowForm(false)} />
      )}

      {showPOS && (
        <POSInterface onClose={() => setShowPOS(false)} />
      )}

      <SaleReturnDialog
        open={showReturnDialog}
        onOpenChange={setShowReturnDialog}
        onSuccess={() => {
          fetchReturns();
          fetchSales();
        }}
      />

      <SaleDetailsModal
        saleId={selectedSaleId}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />

      <SaleReturnDetailsModal
        returnId={selectedReturnId}
        open={showReturnDetailsModal}
        onOpenChange={setShowReturnDetailsModal}
        onSuccess={fetchReturns}
      />

      {/* Reject Sale Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Sale</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this sale.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectSale}>
              Reject Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ProtectedRoute>
  );
}
