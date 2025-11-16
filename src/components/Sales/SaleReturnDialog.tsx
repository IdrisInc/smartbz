import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

interface SaleReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SaleReturnDialog({ open, onOpenChange, onSuccess }: SaleReturnDialogProps) {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    return_number: `SR-${Date.now().toString().slice(-6)}`,
    return_date: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
  });

  useEffect(() => {
    if (open && currentOrganization) {
      fetchSales();
    }
  }, [open, currentOrganization]);

  useEffect(() => {
    if (selectedSaleId) {
      fetchSaleItems(selectedSaleId);
    } else {
      setSaleItems([]);
      setSelectedItems(new Set());
    }
  }, [selectedSaleId]);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('id, sale_number, total_amount, sale_date, contacts(name)')
        .eq('organization_id', currentOrganization?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchSaleItems = async (saleId: string) => {
    try {
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          *,
          products(name, sku)
        `)
        .eq('sale_id', saleId);

      if (error) throw error;
      setSaleItems(data || []);
    } catch (error) {
      console.error('Error fetching sale items:', error);
    }
  };

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const calculateTotals = () => {
    const selectedSaleItems = saleItems.filter(item => selectedItems.has(item.id));
    const total = selectedSaleItems.reduce((sum, item) => sum + Number(item.total_amount), 0);
    return { total, refund: total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization?.id || !selectedSaleId || selectedItems.size === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a sale and at least one item to return",
      });
      return;
    }

    setLoading(true);
    try {
      const { total, refund } = calculateTotals();

      // Create sale return
      const { data: returnData, error: returnError } = await supabase
        .from('sale_returns')
        .insert({
          organization_id: currentOrganization.id,
          sale_id: selectedSaleId,
          return_number: formData.return_number,
          return_date: formData.return_date,
          total_amount: total,
          refund_amount: refund,
          reason: formData.reason,
          notes: formData.notes,
          status: 'pending',
        })
        .select()
        .single();

      if (returnError) throw returnError;

      // Create return items
      const returnItems = Array.from(selectedItems).map(itemId => {
        const item = saleItems.find(i => i.id === itemId);
        return {
          sale_return_id: returnData.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: item.total_amount,
        };
      });

      const { error: itemsError } = await supabase
        .from('sale_return_items')
        .insert(returnItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Sale return created successfully",
      });
      
      // Reset form
      setSelectedSaleId('');
      setSelectedItems(new Set());
      setFormData({
        return_number: `SR-${Date.now().toString().slice(-6)}`,
        return_date: new Date().toISOString().split('T')[0],
        reason: '',
        notes: '',
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating sale return:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create sale return",
      });
    } finally {
      setLoading(false);
    }
  };

  const { total, refund } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Sale Return</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="return_number">Return Number *</Label>
              <Input
                id="return_number"
                value={formData.return_number}
                onChange={(e) => setFormData({ ...formData, return_number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="return_date">Return Date *</Label>
              <Input
                id="return_date"
                type="date"
                value={formData.return_date}
                onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sale">Select Sale *</Label>
            <Select value={selectedSaleId} onValueChange={setSelectedSaleId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a sale to return" />
              </SelectTrigger>
              <SelectContent>
                {sales.map((sale) => (
                  <SelectItem key={sale.id} value={sale.id}>
                    {sale.sale_number || `#${sale.id.slice(0, 8)}`} - {sale.contacts?.name || 'Walk-in'} - ${Number(sale.total_amount).toFixed(2)} ({new Date(sale.sale_date).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {saleItems.length > 0 && (
            <div className="space-y-2">
              <Label>Select Items to Return *</Label>
              <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                {saleItems.map((item) => (
                  <div key={item.id} className="flex items-start space-x-2 p-2 hover:bg-muted rounded">
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.products?.name || 'Unknown Product'}</div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × ${Number(item.unit_price).toFixed(2)} = ${Number(item.total_amount).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedItems.size > 0 && (
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex justify-between text-sm">
                    <span>Return Total:</span>
                    <span className="font-bold">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Refund Amount:</span>
                    <span className="font-bold">${refund.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Why are these items being returned?"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes (optional)"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedItems.size === 0}>
              {loading ? 'Creating...' : 'Create Return'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}