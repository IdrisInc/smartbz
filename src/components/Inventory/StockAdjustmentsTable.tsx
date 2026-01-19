import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { format } from 'date-fns';
import { Search, Filter, Eye, Loader2, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { stockStatusLabels, StockStatusType, StockStatusBadge } from './StockStatusBadge';

interface StockAdjustment {
  id: string;
  adjustment_number: string;
  adjustment_type: string;
  from_status: string | null;
  to_status: string;
  quantity: number;
  reason: string | null;
  notes: string | null;
  warehouse_location: string | null;
  reference_type: string | null;
  approval_status: string;
  performed_by: string | null;
  created_at: string;
  product?: { name: string; sku: string | null };
}

const adjustmentTypeLabels: Record<string, string> = {
  purchase_receive: 'Purchase Receive',
  sale: 'Sale',
  sale_return: 'Sale Return',
  purchase_return: 'Purchase Return',
  damage: 'Damage Report',
  repair: 'Repair & Reclassify',
  scrap: 'Scrap / Write-off',
  return_to_supplier: 'Return to Supplier',
  transfer: 'Status Transfer',
  receive: 'Receive Stock',
  correction: 'Stock Correction',
};

export function StockAdjustmentsTable() {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustment | null>(null);
  
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchAdjustments();
    }
  }, [currentOrganization?.id]);

  const fetchAdjustments = async () => {
    if (!currentOrganization?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_adjustments')
        .select(`
          *,
          product:products(name, sku)
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAdjustments(data || []);
    } catch (error) {
      console.error('Error fetching adjustments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      purchase_receive: 'default',
      sale: 'secondary',
      sale_return: 'outline',
      purchase_return: 'outline',
      damage: 'destructive',
      repair: 'default',
      scrap: 'destructive',
      return_to_supplier: 'secondary',
      transfer: 'outline',
      receive: 'default',
      correction: 'secondary',
    };
    return <Badge variant={variants[type] || 'secondary'}>{adjustmentTypeLabels[type] || type}</Badge>;
  };

  const getApprovalBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      approved: 'default',
      pending: 'outline',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getPerformerName = (adj: StockAdjustment) => {
    return adj.performed_by ? 'User' : 'System';
  };

  const filteredAdjustments = adjustments.filter((adj) => {
    const matchesSearch = 
      adj.adjustment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || adj.adjustment_type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Stock Adjustments</CardTitle>
          <CardDescription>
            All stock transactions and adjustments (manual stock editing is prohibited)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by adjustment # or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Adjustment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(adjustmentTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchAdjustments}>
              <Filter className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAdjustments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No stock adjustments found
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Adjustment #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status Change</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdjustments.map((adj) => (
                    <TableRow key={adj.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(adj.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{adj.adjustment_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{adj.product?.name}</div>
                          {adj.product?.sku && (
                            <div className="text-xs text-muted-foreground">{adj.product.sku}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(adj.adjustment_type)}</TableCell>
                      <TableCell>
                        {adj.from_status && adj.to_status ? (
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-muted-foreground">
                              {stockStatusLabels[adj.from_status as StockStatusType] || adj.from_status}
                            </span>
                            <ArrowRight className="h-3 w-3" />
                            <span>{stockStatusLabels[adj.to_status as StockStatusType] || adj.to_status}</span>
                          </div>
                        ) : adj.to_status ? (
                          <span className="text-sm">
                            → {stockStatusLabels[adj.to_status as StockStatusType] || adj.to_status}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">{adj.quantity}</TableCell>
                      <TableCell>{getApprovalBadge(adj.approval_status)}</TableCell>
                      <TableCell className="text-sm">{getPerformerName(adj)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedAdjustment(adj)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedAdjustment} onOpenChange={() => setSelectedAdjustment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjustment Details</DialogTitle>
            <DialogDescription>{selectedAdjustment?.adjustment_number}</DialogDescription>
          </DialogHeader>
          {selectedAdjustment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Product</p>
                  <p>{selectedAdjustment.product?.name}</p>
                  {selectedAdjustment.product?.sku && (
                    <p className="text-xs text-muted-foreground">{selectedAdjustment.product.sku}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                  <p className="text-2xl font-bold">{selectedAdjustment.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  {getTypeBadge(selectedAdjustment.adjustment_type)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {getApprovalBadge(selectedAdjustment.approval_status)}
                </div>
                {selectedAdjustment.from_status && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">From Status</p>
                    <StockStatusBadge status={selectedAdjustment.from_status as StockStatusType} />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">To Status</p>
                  <StockStatusBadge status={selectedAdjustment.to_status as StockStatusType} />
                </div>
                {selectedAdjustment.warehouse_location && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Warehouse</p>
                    <p>{selectedAdjustment.warehouse_location}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p>{format(new Date(selectedAdjustment.created_at), 'PPpp')}</p>
                </div>
              </div>
              {selectedAdjustment.reason && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reason</p>
                  <p>{selectedAdjustment.reason}</p>
                </div>
              )}
              {selectedAdjustment.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedAdjustment.notes}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Performed By</p>
                <p>{getPerformerName(selectedAdjustment)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
