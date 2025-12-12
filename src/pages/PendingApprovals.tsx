import React, { useState, useEffect } from 'react';
import { Check, X, Search, Loader2, CheckCheck, XCircle, Eye, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SaleDetailsModal } from '@/components/Sales/SaleDetailsModal';

interface PendingSale {
  id: string;
  sale_number: string | null;
  total_amount: number;
  payment_status: string | null;
  payment_method: string | null;
  sale_date: string;
  created_at: string;
  contacts: { name: string } | null;
}

export default function PendingApprovals() {
  const [sales, setSales] = useState<PendingSale[]>([]);
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const { userRole } = useUserRole();
  
  const isBusinessOwner = userRole === 'business_owner';

  useEffect(() => {
    if (currentOrganization) {
      fetchPendingSales();
    }
  }, [currentOrganization]);

  const fetchPendingSales = async () => {
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
          contacts(name)
        `)
        .eq('organization_id', currentOrganization?.id)
        .eq('confirmation_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching pending sales:', error);
      toast({
        title: "Error",
        description: "Failed to load pending sales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSales(filteredSales.map(sale => sale.id));
    } else {
      setSelectedSales([]);
    }
  };

  const handleSelectSale = (saleId: string, checked: boolean) => {
    if (checked) {
      setSelectedSales([...selectedSales, saleId]);
    } else {
      setSelectedSales(selectedSales.filter(id => id !== saleId));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedSales.length === 0) {
      toast({
        title: "No sales selected",
        description: "Please select at least one sale to approve",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('sales')
        .update({
          confirmation_status: 'confirmed',
          confirmed_by: user?.id,
          confirmed_at: new Date().toISOString()
        })
        .in('id', selectedSales);

      if (error) throw error;

      toast({
        title: "Sales Approved",
        description: `${selectedSales.length} sale(s) have been approved successfully.`,
      });
      
      setSelectedSales([]);
      fetchPendingSales();
    } catch (error) {
      console.error('Error approving sales:', error);
      toast({
        title: "Error",
        description: "Failed to approve sales",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedSales.length === 0) {
      toast({
        title: "No sales selected",
        description: "Please select at least one sale to reject",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('sales')
        .update({
          confirmation_status: 'rejected',
          confirmed_by: user?.id,
          confirmed_at: new Date().toISOString(),
          rejection_reason: rejectionReason || 'Bulk rejection - no reason provided'
        })
        .in('id', selectedSales);

      if (error) throw error;

      toast({
        title: "Sales Rejected",
        description: `${selectedSales.length} sale(s) have been rejected.`,
      });
      
      setSelectedSales([]);
      setShowRejectDialog(false);
      setRejectionReason('');
      fetchPendingSales();
    } catch (error) {
      console.error('Error rejecting sales:', error);
      toast({
        title: "Error",
        description: "Failed to reject sales",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSingleApprove = async (saleId: string) => {
    setProcessing(true);
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
        title: "Sale Approved",
        description: "The sale has been approved successfully.",
      });
      
      fetchPendingSales();
    } catch (error) {
      console.error('Error approving sale:', error);
      toast({
        title: "Error",
        description: "Failed to approve sale",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = (saleId: string) => {
    setSelectedSaleId(saleId);
    setShowDetailsModal(true);
  };

  const filteredSales = sales.filter(sale =>
    sale.sale_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.contacts?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPendingAmount = filteredSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const allSelected = filteredSales.length > 0 && selectedSales.length === filteredSales.length;

  if (!isBusinessOwner) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <Card className="p-8 text-center">
            <CardTitle className="mb-2">Access Denied</CardTitle>
            <CardDescription>Only business owners can access this page.</CardDescription>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Pending Approvals</h2>
            <p className="text-sm text-muted-foreground">
              Review and approve or reject pending sales transactions
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Sales</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sales.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting your approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Value</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPendingAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total pending amount</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selected</CardTitle>
              <CheckCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedSales.length}</div>
              <p className="text-xs text-muted-foreground">Sales selected for action</p>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Sales Awaiting Approval</CardTitle>
                <CardDescription>Select sales to approve or reject in bulk</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={selectedSales.length === 0 || processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4 mr-2" />
                  )}
                  Approve Selected ({selectedSales.length})
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={selectedSales.length === 0 || processing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Selected ({selectedSales.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by sale number or customer..."
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
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No pending sales match your search.' : 'No pending sales awaiting approval.'}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Sale Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedSales.includes(sale.id)}
                            onCheckedChange={(checked) => handleSelectSale(sale.id, checked as boolean)}
                            aria-label={`Select sale ${sale.sale_number}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {sale.sale_number || `#${sale.id.slice(0, 8)}`}
                        </TableCell>
                        <TableCell>{sale.contacts?.name || 'Walk-in Customer'}</TableCell>
                        <TableCell>
                          {new Date(sale.sale_date || sale.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{sale.payment_method || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${sale.total_amount?.toLocaleString() || '0'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(sale.id)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSingleApprove(sale.id)}
                              disabled={processing}
                              title="Approve"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedSales([sale.id]);
                                setShowRejectDialog(true);
                              }}
                              disabled={processing}
                              title="Reject"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Sale(s)</DialogTitle>
              <DialogDescription>
                You are about to reject {selectedSales.length} sale(s). Please provide a reason.
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
              <Button variant="destructive" onClick={handleBulkReject} disabled={processing}>
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Reject {selectedSales.length} Sale(s)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sale Details Modal */}
        <SaleDetailsModal
          saleId={selectedSaleId}
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
        />
      </div>
    </ProtectedRoute>
  );
}
