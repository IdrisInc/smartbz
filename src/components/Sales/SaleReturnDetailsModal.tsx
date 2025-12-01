import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
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
  const [returnData, setReturnData] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open && returnId) {
      fetchReturnDetails();
    }
  }, [open, returnId]);

  const fetchReturnDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch return details
      const { data: returnInfo, error: returnError } = await supabase
        .from('sale_returns')
        .select(`
          *,
          sales(sale_number)
        `)
        .eq('id', returnId)
        .single();

      if (returnError) throw returnError;

      // Fetch return items
      const { data: items, error: itemsError } = await supabase
        .from('sale_return_items')
        .select(`
          *,
          products(name, sku)
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

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('sale_returns')
        .update({ status: newStatus })
        .eq('id', returnId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Return ${newStatus} successfully`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating return status:', error);
      toast({
        title: "Error",
        description: "Failed to update return status",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Return Date</p>
                  <p className="font-medium">{new Date(returnData.return_date).toLocaleDateString()}</p>
                </div>
                {returnData.reason && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Reason</p>
                    <p className="font-medium">{returnData.reason}</p>
                  </div>
                )}
                {returnData.notes && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Notes</p>
                    <p className="font-medium">{returnData.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Return Items */}
            <div className="space-y-3">
              <h4 className="font-semibold">Returned Items</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Product</th>
                      <th className="text-right p-3 text-sm font-medium">Qty</th>
                      <th className="text-right p-3 text-sm font-medium">Unit Price</th>
                      <th className="text-right p-3 text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{item.products?.name}</p>
                            {item.products?.sku && (
                              <p className="text-xs text-muted-foreground">SKU: {item.products.sku}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">{item.quantity}</td>
                        <td className="p-3 text-right">${Number(item.unit_price).toFixed(2)}</td>
                        <td className="p-3 text-right font-medium">${Number(item.total_amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-bold">${Number(returnData.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Refund Amount:</span>
                <span className="font-bold text-green-600">${Number(returnData.refund_amount || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            {returnData.status === 'pending' && (
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleUpdateStatus('approved')}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Return
                </Button>
                <Button
                  onClick={() => handleUpdateStatus('rejected')}
                  variant="destructive"
                  className="flex-1"
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
