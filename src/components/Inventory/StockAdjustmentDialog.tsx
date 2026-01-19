import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowRight } from 'lucide-react';
import { StockStatusBadge, stockStatusLabels, StockStatusType } from './StockStatusBadge';

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: {
    id: string;
    name: string;
    sku?: string | null;
  } | null;
  onSuccess?: () => void;
}

type AdjustmentType = 'damage' | 'repair' | 'scrap' | 'return_to_supplier' | 'transfer' | 'receive' | 'correction';

const adjustmentTypeOptions: { value: AdjustmentType; label: string; description: string }[] = [
  { value: 'damage', label: 'Mark as Damaged', description: 'Mark items as damaged/defective during inspection' },
  { value: 'repair', label: 'Repair & Reclassify', description: 'Move repaired items back to available stock' },
  { value: 'scrap', label: 'Scrap / Write-off', description: 'Write off items that cannot be sold or returned' },
  { value: 'return_to_supplier', label: 'Return to Supplier', description: 'Prepare items for return to supplier' },
  { value: 'transfer', label: 'Transfer Status', description: 'Move items between stock statuses' },
  { value: 'receive', label: 'Receive Stock', description: 'Add new stock from purchase' },
  { value: 'correction', label: 'Stock Correction', description: 'Correct stock count discrepancy' },
];

const damageReasons = [
  'Pre-sale damage during receiving',
  'Warehouse handling damage',
  'Storage damage',
  'Customer return - damaged',
  'Manufacturing defect',
  'Expired/deteriorated',
  'Other',
];

export function StockAdjustmentDialog({ open, onOpenChange, product, onSuccess }: StockAdjustmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('damage');
  const [fromStatus, setFromStatus] = useState<StockStatusType>('available');
  const [toStatus, setToStatus] = useState<StockStatusType>('damaged');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [stockByStatus, setStockByStatus] = useState<Record<StockStatusType, number>>({
    available: 0,
    reserved: 0,
    damaged: 0,
    returned_qc: 0,
    scrap: 0,
  });
  
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (product?.id && open) {
      fetchProductStock();
    }
  }, [product?.id, open]);

  useEffect(() => {
    // Set default to/from statuses based on adjustment type
    switch (adjustmentType) {
      case 'damage':
        setFromStatus('available');
        setToStatus('damaged');
        break;
      case 'repair':
        setFromStatus('damaged');
        setToStatus('available');
        break;
      case 'scrap':
        setFromStatus('damaged');
        setToStatus('scrap');
        break;
      case 'return_to_supplier':
        setFromStatus('damaged');
        setToStatus('returned_qc');
        break;
      case 'receive':
        setToStatus('available');
        break;
      case 'correction':
        setToStatus('available');
        break;
    }
  }, [adjustmentType]);

  const fetchProductStock = async () => {
    if (!product?.id || !currentOrganization?.id) return;

    try {
      const { data, error } = await supabase
        .from('product_stock')
        .select('status, quantity')
        .eq('product_id', product.id);

      if (error) throw error;

      const stockMap: Record<StockStatusType, number> = {
        available: 0,
        reserved: 0,
        damaged: 0,
        returned_qc: 0,
        scrap: 0,
      };

      data?.forEach((item) => {
        if (item.status in stockMap) {
          stockMap[item.status as StockStatusType] = item.quantity;
        }
      });

      setStockByStatus(stockMap);
    } catch (error) {
      console.error('Error fetching product stock:', error);
    }
  };

  const generateAdjustmentNumber = async () => {
    const { data } = await supabase
      .from('stock_adjustments')
      .select('adjustment_number')
      .eq('organization_id', currentOrganization?.id)
      .order('created_at', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].adjustment_number.split('-')[1] || '0');
      nextNumber = lastNumber + 1;
    }
    return `ADJ-${String(nextNumber).padStart(5, '0')}`;
  };

  const handleSubmit = async () => {
    if (!product?.id || !currentOrganization?.id) return;
    
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid quantity' });
      return;
    }

    if (adjustmentType !== 'receive' && adjustmentType !== 'correction') {
      if (qty > stockByStatus[fromStatus]) {
        toast({ variant: 'destructive', title: 'Error', description: `Insufficient stock in ${stockStatusLabels[fromStatus]} (${stockByStatus[fromStatus]} available)` });
        return;
      }
    }

    if (!reason && adjustmentType === 'damage') {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a reason for damage' });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const adjustmentNumber = await generateAdjustmentNumber();

      // Create stock adjustment record
      const { data: adjustment, error: adjustmentError } = await supabase
        .from('stock_adjustments')
        .insert({
          organization_id: currentOrganization.id,
          product_id: product.id,
          adjustment_number: adjustmentNumber,
          adjustment_type: adjustmentType,
          from_status: adjustmentType !== 'receive' && adjustmentType !== 'correction' ? fromStatus : null,
          to_status: toStatus,
          quantity: qty,
          reason,
          notes,
          warehouse_location: warehouse,
          performed_by: user?.id,
          approval_status: 'approved', // Auto-approve for now
          reference_type: 'manual',
        })
        .select()
        .single();

      if (adjustmentError) throw adjustmentError;

      // Get current quantities for audit log
      const fromQuantityBefore = stockByStatus[fromStatus] || 0;
      const toQuantityBefore = stockByStatus[toStatus] || 0;

      // Update stock quantities
      if (adjustmentType !== 'receive' && adjustmentType !== 'correction') {
        // Decrease from status
        await supabase
          .from('product_stock')
          .upsert({
            organization_id: currentOrganization.id,
            product_id: product.id,
            status: fromStatus,
            quantity: fromQuantityBefore - qty,
          }, { onConflict: 'product_id,status' });

        // Create audit log for decrease
        await supabase.from('stock_audit_log').insert({
          organization_id: currentOrganization.id,
          product_id: product.id,
          action: 'decrease',
          from_status: fromStatus,
          to_status: toStatus,
          quantity_before: fromQuantityBefore,
          quantity_change: -qty,
          quantity_after: fromQuantityBefore - qty,
          adjustment_id: adjustment.id,
          reference_type: 'stock_adjustment',
          reference_id: adjustment.id,
          performed_by: user?.id,
        });
      }

      // Increase to status
      await supabase
        .from('product_stock')
        .upsert({
          organization_id: currentOrganization.id,
          product_id: product.id,
          status: toStatus,
          quantity: toQuantityBefore + qty,
        }, { onConflict: 'product_id,status' });

      // Create audit log for increase
      await supabase.from('stock_audit_log').insert({
        organization_id: currentOrganization.id,
        product_id: product.id,
        action: 'increase',
        from_status: fromStatus,
        to_status: toStatus,
        quantity_before: toQuantityBefore,
        quantity_change: qty,
        quantity_after: toQuantityBefore + qty,
        adjustment_id: adjustment.id,
        reference_type: 'stock_adjustment',
        reference_id: adjustment.id,
        performed_by: user?.id,
      });

      // Update legacy stock_quantity and defective_quantity for backwards compatibility
      const newAvailable = adjustmentType === 'receive' || toStatus === 'available' 
        ? toQuantityBefore + qty 
        : (fromStatus === 'available' ? fromQuantityBefore - qty : stockByStatus.available);
      
      const newDefective = toStatus === 'damaged' 
        ? toQuantityBefore + qty 
        : (fromStatus === 'damaged' ? fromQuantityBefore - qty : stockByStatus.damaged);

      await supabase
        .from('products')
        .update({ 
          stock_quantity: newAvailable,
          defective_quantity: newDefective,
        })
        .eq('id', product.id);

      toast({ title: 'Success', description: `Stock adjustment ${adjustmentNumber} completed` });
      
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating stock adjustment:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create stock adjustment' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAdjustmentType('damage');
    setFromStatus('available');
    setToStatus('damaged');
    setQuantity('');
    setReason('');
    setNotes('');
    setWarehouse('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Stock Adjustment</DialogTitle>
          <DialogDescription>
            {product?.name} {product?.sku && `(${product.sku})`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Stock Summary */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Current Stock by Status:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {(Object.entries(stockByStatus) as [StockStatusType, number][]).map(([status, qty]) => (
                <div key={status} className="flex justify-between">
                  <span className="text-muted-foreground">{stockStatusLabels[status]}:</span>
                  <span className="font-medium">{qty}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <Select value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as AdjustmentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {adjustmentTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Transfer */}
          {adjustmentType === 'transfer' && (
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label>From Status</Label>
                <Select value={fromStatus} onValueChange={(v) => setFromStatus(v as StockStatusType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(stockStatusLabels) as StockStatusType[]).map((status) => (
                      <SelectItem key={status} value={status}>{stockStatusLabels[status]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ArrowRight className="h-4 w-4 mt-6" />
              <div className="flex-1 space-y-2">
                <Label>To Status</Label>
                <Select value={toStatus} onValueChange={(v) => setToStatus(v as StockStatusType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(stockStatusLabels) as StockStatusType[]).filter(s => s !== fromStatus).map((status) => (
                      <SelectItem key={status} value={status}>{stockStatusLabels[status]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Show status change for non-transfer types */}
          {adjustmentType !== 'transfer' && adjustmentType !== 'receive' && adjustmentType !== 'correction' && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
              <StockStatusBadge status={fromStatus} />
              <ArrowRight className="h-4 w-4" />
              <StockStatusBadge status={toStatus} />
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
            />
            {adjustmentType !== 'receive' && adjustmentType !== 'correction' && (
              <p className="text-xs text-muted-foreground">
                Available in {stockStatusLabels[fromStatus]}: {stockByStatus[fromStatus]}
              </p>
            )}
          </div>

          {/* Reason (for damage) */}
          {adjustmentType === 'damage' && (
            <div className="space-y-2">
              <Label>Reason for Damage</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {damageReasons.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Warehouse */}
          <div className="space-y-2">
            <Label>Warehouse / Location (Optional)</Label>
            <Input
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              placeholder="e.g., Main Warehouse, Shelf A3"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this adjustment"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
