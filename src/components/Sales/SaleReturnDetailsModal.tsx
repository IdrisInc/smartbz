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

interface SaleReturnDetailsModalProps {
  returnId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SaleReturnDetailsModal({ returnId, open, onOpenChange, onSuccess }: SaleReturnDetailsModalProps) {
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
        .from('sale_returns')
        .select(`
          *,
          sales(
            sale_number,
            contacts(name, phone, email),
            employees(first_name, last_name)
          )
        `)
        .eq('id', returnId)
        .single();

      if (returnError) throw returnError;

      const { data: items, error: itemsError } = await supabase
        .from('sale_return_items')
        .select(`
          *,
          products(name, sku, unit, product_brands(name))
        `)
        .eq('sale_return_id', returnId);

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
        .from('sale_returns')
        .update({ status: 'approved' })
        .eq('id', returnId);

      if (updateError) throw updateError;

      // Update inventory for good condition items only
      const goodConditionItems = returnItems.filter(item => item.condition === 'good');
      
      for (const item of goodConditionItems) {
        // Add stock back
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();
        
        if (product) {
          await supabase
            .from('products')
            .update({ stock_quantity: (product.stock_quantity || 0) + item.quantity })
            .eq('id', item.product_id);
        }

        // Log inventory movement
        await supabase.from('inventory_movements').insert({
          organization_id: currentOrganization.id,
          product_id: item.product_id,
          movement_type: 'sale_return',
          quantity: item.quantity,
          reference_type: 'sale_return',
          reference_id: returnId,
          notes: `Sale return approved - Good condition item returned to stock`
        });
      }

      // Move damaged/defective items to defective_quantity (not sellable stock)
      const damagedItems = returnItems.filter(item => item.condition !== 'good');
      for (const item of damagedItems) {
        // Add to defective_quantity instead of stock_quantity
        const { data: product } = await supabase
          .from('products')
          .select('defective_quantity')
          .eq('id', item.product_id)
          .single();
        
        if (product) {
          await supabase
            .from('products')
            .update({ defective_quantity: (product.defective_quantity || 0) + item.quantity })
            .eq('id', item.product_id);
        }

        await supabase.from('inventory_movements').insert({
          organization_id: currentOrganization.id,
          product_id: item.product_id,
          movement_type: 'sale_return_defective',
          quantity: item.quantity,
          reference_type: 'sale_return',
          reference_id: returnId,
          notes: `Sale return approved - ${item.condition} item, added to defective inventory`
        });
      }

      // Create credit note if refund > 0
      if (returnData.refund_amount > 0) {
        const creditNoteNumber = `CN-${Date.now().toString().slice(-8)}`;
        
        await supabase.from('credit_notes').insert({
          organization_id: currentOrganization.id,
          credit_note_number: creditNoteNumber,
          contact_id: returnData.sales?.contact_id || null,
          sale_return_id: returnId,
          note_type: 'sales',
          amount: returnData.refund_amount,
          tax_amount: returnItems.reduce((sum, item) => sum + (Number(item.tax_amount) || 0), 0),
          total_amount: returnData.refund_amount,
          status: 'issued',
          reason: returnData.refund_type === 'partial' 
            ? `Partial refund: ${returnData.refund_reason || 'Per agreement'}`
            : 'Full refund for returned items',
          notes: returnData.notes,
        });

        // Update sale return with credit note reference
        await supabase
          .from('sale_returns')
          .update({ credit_note_id: creditNoteNumber })
          .eq('id', returnId);
      }

      toast({
        title: "Success",
        description: `Return approved. ${goodConditionItems.length} item(s) added to inventory. Credit note created.`,
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
        .from('sale_returns')
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
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      good: 'default',
      damaged: 'destructive',
      defective: 'destructive',
    };
    return <Badge variant={variants[condition] || 'secondary'}>{condition}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sale Return Details</DialogTitle>
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
                    {returnData.sales?.sale_number && `Original Sale: ${returnData.sales.sale_number}`}
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
                <div>
                  <p className="text-muted-foreground">Refund Type</p>
                  <p className="font-medium capitalize">{returnData.refund_type || 'Full'}</p>
                </div>
                {returnData.sales?.contacts && (
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium">{returnData.sales.contacts.name}</p>
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
              <h4 className="font-semibold">Returned Items</h4>
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
                        <TableCell>{getConditionBadge(item.condition || 'good')}</TableCell>
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
                  {returnItems.filter(i => i.condition === 'good').length > 0 && (
                    <p className="text-green-600">
                      ✓ {returnItems.filter(i => i.condition === 'good').reduce((sum, i) => sum + i.quantity, 0)} items in good condition will be added to inventory
                    </p>
                  )}
                  {returnItems.filter(i => i.condition !== 'good').length > 0 && (
                    <p className="text-orange-600">
                      ⚠ {returnItems.filter(i => i.condition !== 'good').reduce((sum, i) => sum + i.quantity, 0)} damaged/defective items will NOT be added to inventory
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-bold">${Number(returnData.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Refund Amount:</span>
                <span className="font-bold text-primary">${Number(returnData.refund_amount || 0).toFixed(2)}</span>
              </div>
              {returnData.refund_reason && (
                <div className="text-sm text-muted-foreground">
                  Refund Reason: {returnData.refund_reason}
                </div>
              )}
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
                  Approve Return & Create Credit Note
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
