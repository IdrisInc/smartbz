
import React, { useState } from 'react';
import { Plus, Search, Receipt, CreditCard, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SaleForm } from '@/components/Sales/SaleForm';
import { SaleReturnDialog } from '@/components/Sales/SaleReturnDialog';
import { SaleDetailsModal } from '@/components/Sales/SaleDetailsModal';
import { SaleReturnDetailsModal } from '@/components/Sales/SaleReturnDetailsModal';
import { POSInterface } from '@/components/Sales/POSInterface';
import { SalesListView } from '@/components/Sales/SalesListView';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { useSalesData } from '@/hooks/useSalesData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Eye, Plus as PlusIcon } from 'lucide-react';
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
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingSaleId, setRejectingSaleId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const {
    sales, returns, stats, loading, loadingReturns,
    isBusinessOwner, hasMoreSales,
    fetchSales, fetchStats, fetchReturns,
    handleConfirmSale, handleRejectSale, loadMoreSales,
  } = useSalesData();

  const handleViewDetails = (saleId: string) => {
    setSelectedSaleId(saleId);
    setShowDetailsModal(true);
  };

  const handleViewReturnDetails = (returnId: string) => {
    setSelectedReturnId(returnId);
    setShowReturnDetailsModal(true);
  };

  const openRejectDialog = (saleId: string) => {
    setRejectingSaleId(saleId);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    handleRejectSale(rejectingSaleId, rejectionReason);
    setShowRejectDialog(false);
    setRejectingSaleId('');
    setRejectionReason('');
  };

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
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex h-auto gap-1 w-max min-w-full sm:w-auto sm:min-w-0 flex-nowrap">
              <TabsTrigger value="sales">
                <Receipt className="h-4 w-4 mr-2" />Sales
              </TabsTrigger>
              <TabsTrigger value="returns">
                <RotateCcw className="h-4 w-4 mr-2" />Sale Returns
              </TabsTrigger>
            </TabsList>
          </div>

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
            <SalesListView
              sales={sales}
              loading={loading}
              searchTerm={searchTerm}
              isBusinessOwner={isBusinessOwner}
              hasMoreSales={hasMoreSales}
              onConfirm={handleConfirmSale}
              onReject={openRejectDialog}
              onViewDetails={handleViewDetails}
              onLoadMore={loadMoreSales}
            />
          </TabsContent>

          <TabsContent value="returns" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Sale Returns</CardTitle>
                <Button onClick={() => setShowReturnDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />New Return
                </Button>
              </CardHeader>
              <CardContent>
                {loadingReturns ? (
                  <div className="text-center py-8">Loading...</div>
                ) : !returns || returns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No sale returns found</div>
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
                            <Button variant="outline" size="sm" onClick={() => handleViewReturnDetails(ret.id)}>
                              <Eye className="h-4 w-4 mr-2" />View
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

        {showForm && <SaleForm onClose={() => setShowForm(false)} />}
        {showPOS && <POSInterface onClose={() => setShowPOS(false)} />}

        <SaleReturnDialog
          open={showReturnDialog}
          onOpenChange={setShowReturnDialog}
          onSuccess={() => { fetchReturns(); fetchSales(); }}
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

        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Sale</DialogTitle>
              <DialogDescription>Please provide a reason for rejecting this sale.</DialogDescription>
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
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmReject}>Reject Sale</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
