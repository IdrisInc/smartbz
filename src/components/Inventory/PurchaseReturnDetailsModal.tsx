import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PurchaseReturnDetailsModalProps {
  returnId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PurchaseReturnDetailsModal({ returnId, open, onOpenChange, onSuccess }: PurchaseReturnDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [returnData, setReturnData] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  useEffect(() => {
    if (open && returnId) {
      fetchReturnDetails();
    }
  }, [open, returnId]);

  const fetchReturnDetails = async () => {
    try {
      setLoading(true);
      
      const { data: returnInfo, error: returnError } = await supabase
        .from('purchase_returns')
        .select(`
          *,
          purchase_orders(po_number),
          contacts:supplier_id(name, phone, email)
        `)
        .eq('id', returnId)
        .single();

      if (returnError) throw returnError;

      const { data: items, error: itemsError } = await supabase
        .from('purchase_return_items')
        .select(`
          *,
          products(name, sku, unit, product_brands(name))
        `)
        .eq('purchase_return_id', returnId);

      if (itemsError) throw itemsError;

      setReturnData(returnInfo);
      setReturnItems(items || []);
    } catch (error) {
      console.error('Error fetching return details:', error);
      toast({
        title: "Error",
        description: "Failed to load return details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReturn = async () => {
    if (!returnData || !currentOrganization) return;
    
    setApproving(true);
    try {
      // Update return status
      const { error: updateError } = await supabase
        .from('purchase_returns')
        .update({ status: 'approved' })
        .eq('id', returnId);

      if (updateError) throw updateError;

      // Decrease inventory for all returned items (they're going back to supplier)
      for (const item of returnItems) {
        // Decrease stock
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();
        
        if (product) {
          await supabase
            .from('products')
            .update({ stock_quantity: Math.max(0, (product.stock_quantity || 0) - item.quantity) })
            .eq('id', item.product_id);
        }

        // Log inventory movement
        await supabase.from('inventory_movements').insert({
          organization_id: currentOrganization.id,
          product_id: item.product_id,
          movement_type: 'purchase_return',
          quantity: -item.quantity,
          reference_type: 'purchase_return',
          reference_id: returnId,
          notes: `Purchase return approved - ${item.condition} item returned to supplier`
        });
      }

      // Create debit note (credit note for purchases)
      const creditNoteNumber = `DN-${Date.now().toString().slice(-8)}`;
      
      await supabase.from('credit_notes').insert({
        organization_id: currentOrganization.id,
        credit_note_number: creditNoteNumber,
        contact_id: returnData.supplier_id || null,
        purchase_return_id: returnId,
        note_type: 'purchase',
        amount: returnData.total_amount,
        tax_amount: returnItems.reduce((sum, item) => sum + (Number(item.tax_amount) || 0), 0),
        total_amount: returnData.total_amount,
        status: 'issued',
        reason: returnData.reason || 'Items returned to supplier',
        notes: returnData.notes,
      });

      toast({
        title: "Success",
        description: `Return approved. ${returnItems.length} item(s) removed from inventory. Debit note created.`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error approving return:', error);
      toast({
        title: "Error",
        description: "Failed to approve return",
        variant: "destructive",
      });
    } finally {
      setApproving(false);
    }
  };

  const handleRejectReturn = async () => {
    try {
      const { error } = await supabase
        .from('purchase_returns')
        .update({ status: 'rejected' })
        .eq('id', returnId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Return rejected successfully",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error rejecting return:', error);
      toast({
        title: "Error",
        description: "Failed to reject return",
        variant: "destructive",
      });
    }
  };

  const getConditionBadge = (condition: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      defective: 'destructive',
      damaged: 'destructive',
      excess: 'secondary',
      wrong_item: 'outline',
    };
    const labels: Record<string, string> = {
      defective: 'Defective',
      damaged: 'Damaged',
      excess: 'Excess Stock',
      wrong_item: 'Wrong Item',
    };
    return <Badge variant={variants[condition] || 'secondary'}>{labels[condition] || condition}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Purchase Return Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : returnData ? (
          <div className="space-y-6">
            {/* Return Information */}
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{returnData.return_number}</h3>
                  <p className="text-sm text-muted-foreground">
                    {returnData.purchase_orders?.po_number && `Original PO: ${returnData.purchase_orders.po_number}`}
                  </p>
                </div>
                <Badge variant={
                  returnData.status === 'approved' ? 'default' : 
                  returnData.status === 'rejected' ? 'destructive' : 
                  'secondary'
                }>
                  {returnData.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Return Date</p>
                  <p className="font-medium">{new Date(returnData.return_date).toLocaleDateString()}</p>
                </div>
                {returnData.contacts && (
                  <div>
                    <p className="text-muted-foreground">Supplier</p>
                    <p className="font-medium">{returnData.contacts.name}</p>
                  </div>
                )}
                {returnData.reason && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Reason</p>
                    <p className="font-medium">{returnData.reason}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Return Items Table */}
            <div className="space-y-3">
              <h4 className="font-semibold">Return Items</h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10">No</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Tax %</TableHead>
                      <TableHead className="text-right">Tax Amt</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Condition</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.products?.name}</p>
                            {item.products?.sku && (
                              <p className="text-xs text-muted-foreground">SKU: {item.products.sku}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.products?.product_brands?.name || '-'}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell>{item.unit || item.products?.unit || '-'}</TableCell>
                        <TableCell className="text-right">${Number(item.unit_price).toFixed(2)}</TableCell>
                        <TableCell className="text-right">${Number(item.discount_amount || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right">{Number(item.tax_rate || 0).toFixed(1)}%</TableCell>
                        <TableCell className="text-right">${Number(item.tax_amount || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">${Number(item.total_amount).toFixed(2)}</TableCell>
                        <TableCell>{getConditionBadge(item.condition || 'defective')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Separator />

            {/* Inventory Impact Preview */}
            {returnData.status === 'pending' && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Inventory Impact Preview
                </h4>
                <div className="text-sm space-y-1">
                  <p className="text-orange-600">
                    ⚠ {returnItems.reduce((sum, i) => sum + i.quantity, 0)} items will be removed from inventory (returned to supplier)
                  </p>
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total Return Amount:</span>
                <span className="font-bold">${Number(returnData.total_amount).toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            {returnData.status === 'pending' && (
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleApproveReturn}
                  className="flex-1"
                  disabled={approving}
                >
                  {approving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve Return & Create Debit Note
                </Button>
                <Button
                  onClick={handleRejectReturn}
                  variant="destructive"
                  className="flex-1"
                  disabled={approving}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Return
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No return data found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
