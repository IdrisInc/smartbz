import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

interface SaleReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ReturnItem {
  id: string;
  sale_item_id: string;
  product_id: string;
  product_name: string;
  brand_name: string;
  sku: string;
  quantity: number;
  max_quantity: number;
  unit: string;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  condition: 'good' | 'damaged' | 'defective';
}

export function SaleReturnDialog({ open, onOpenChange, onSuccess }: SaleReturnDialogProps) {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [formData, setFormData] = useState({
    return_number: `SR-${Date.now().toString().slice(-6)}`,
    return_date: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
    refund_type: 'full' as 'full' | 'partial' | 'none',
    refund_reason: '',
  });

  useEffect(() => {
    if (open && currentOrganization) {
      fetchSales();
      setReturnItems([]);
      setSelectedSaleId('');
      setFormData({
        return_number: `SR-${Date.now().toString().slice(-6)}`,
        return_date: new Date().toISOString().split('T')[0],
        reason: '',
        notes: '',
        refund_type: 'full',
        refund_reason: '',
      });
    }
  }, [open, currentOrganization]);

  useEffect(() => {
    if (selectedSaleId) {
      fetchSaleItems(selectedSaleId);
      setReturnItems([]);
    } else {
      setSaleItems([]);
      setReturnItems([]);
    }
  }, [selectedSaleId]);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('id, sale_number, total_amount, sale_date, contacts(name)')
        .eq('organization_id', currentOrganization?.id)
        .eq('confirmation_status', 'confirmed')
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
          products(name, sku, unit, product_brands(name))
        `)
        .eq('sale_id', saleId);

      if (error) throw error;
      setSaleItems(data || []);
    } catch (error) {
      console.error('Error fetching sale items:', error);
    }
  };

  const addItemToReturn = (saleItem: any) => {
    // Check if already added
    if (returnItems.find(ri => ri.sale_item_id === saleItem.id)) return;

    const taxRate = saleItem.total_amount > 0 && saleItem.quantity > 0 
      ? 0 : 0; // You can calculate tax rate if needed

    const newItem: ReturnItem = {
      id: Date.now().toString(),
      sale_item_id: saleItem.id,
      product_id: saleItem.product_id,
      product_name: saleItem.products?.name || 'Unknown',
      brand_name: saleItem.products?.product_brands?.name || '-',
      sku: saleItem.products?.sku || '-',
      quantity: saleItem.quantity,
      max_quantity: saleItem.quantity,
      unit: saleItem.products?.unit || 'pcs',
      unit_price: Number(saleItem.unit_price),
      discount_amount: Number(saleItem.discount_amount || 0),
      tax_rate: taxRate,
      tax_amount: 0,
      total_amount: Number(saleItem.total_amount),
      condition: 'good',
    };

    setReturnItems([...returnItems, newItem]);
  };

  const removeItemFromReturn = (id: string) => {
    setReturnItems(returnItems.filter(item => item.id !== id));
  };

  const updateReturnItem = (id: string, field: keyof ReturnItem, value: any) => {
    setReturnItems(returnItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // Recalculate totals when quantity changes
        if (field === 'quantity') {
          const qty = Math.min(Number(value), item.max_quantity);
          updated.quantity = qty;
          const subtotal = qty * item.unit_price;
          updated.tax_amount = subtotal * (item.tax_rate / 100);
          updated.total_amount = subtotal - updated.discount_amount + updated.tax_amount;
        }
        
        return updated;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const subtotal = returnItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const discountTotal = returnItems.reduce((sum, item) => sum + item.discount_amount, 0);
    const taxTotal = returnItems.reduce((sum, item) => sum + item.tax_amount, 0);
    const total = subtotal - discountTotal + taxTotal;
    
    // Refund only for good condition items by default
    const refundableItems = returnItems.filter(item => item.condition === 'good');
    const refundAmount = formData.refund_type === 'none' 
      ? 0 
      : formData.refund_type === 'full' 
        ? total 
        : refundableItems.reduce((sum, item) => sum + item.total_amount, 0);
    
    return { subtotal, discountTotal, taxTotal, total, refundAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization?.id || !selectedSaleId || returnItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a sale and add at least one item to return",
      });
      return;
    }

    setLoading(true);
    try {
      const { total, refundAmount } = calculateTotals();

      // Create sale return
      const { data: returnData, error: returnError } = await supabase
        .from('sale_returns')
        .insert({
          organization_id: currentOrganization.id,
          sale_id: selectedSaleId,
          return_number: formData.return_number,
          return_date: formData.return_date,
          total_amount: total,
          refund_amount: refundAmount,
          refund_type: formData.refund_type,
          refund_reason: formData.refund_reason || null,
          reason: formData.reason,
          notes: formData.notes,
          status: 'pending',
        })
        .select()
        .single();

      if (returnError) throw returnError;

      // Create return items with condition
      const itemsToInsert = returnItems.map(item => ({
        sale_return_id: returnData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit: item.unit,
        discount_amount: item.discount_amount,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount,
        total_amount: item.total_amount,
        condition: item.condition,
      }));

      const { error: itemsError } = await supabase
        .from('sale_return_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Sale return created successfully. Awaiting approval.",
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

  const { subtotal, discountTotal, taxTotal, total, refundAmount } = calculateTotals();
  const availableItems = saleItems.filter(si => !returnItems.find(ri => ri.sale_item_id === si.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Sale Return</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="refund_type">Refund Type</Label>
              <Select 
                value={formData.refund_type} 
                onValueChange={(val: 'full' | 'partial' | 'none') => setFormData({ ...formData, refund_type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Refund</SelectItem>
                  <SelectItem value="partial">Partial Refund (Good Condition Only)</SelectItem>
                  <SelectItem value="none">No Refund</SelectItem>
                </SelectContent>
              </Select>
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

          {availableItems.length > 0 && (
            <div className="space-y-2">
              <Label>Add Items to Return</Label>
              <div className="flex flex-wrap gap-2">
                {availableItems.map((item) => (
                  <Button 
                    key={item.id} 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => addItemToReturn(item)}
                  >
                    + {item.products?.name} (Qty: {item.quantity})
                  </Button>
                ))}
              </div>
            </div>
          )}

          {returnItems.length > 0 && (
            <div className="space-y-2">
              <Label>Sale Return Items</Label>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10">No</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead className="w-20">Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Tax %</TableHead>
                      <TableHead className="text-right">Tax Amt</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product_name}</div>
                            <div className="text-xs text-muted-foreground">{item.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>{item.brand_name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            max={item.max_quantity}
                            value={item.quantity}
                            onChange={(e) => updateReturnItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-16 h-8"
                          />
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.discount_amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.tax_rate.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">${item.tax_amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">${item.total_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Select 
                            value={item.condition} 
                            onValueChange={(val) => updateReturnItem(item.id, 'condition', val)}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="damaged">Damaged</SelectItem>
                              <SelectItem value="defective">Defective</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItemFromReturn(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Discount:</span>
                  <span>-${discountTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Tax:</span>
                  <span>${taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Return Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-primary">
                  <span>Refund Amount ({formData.refund_type}):</span>
                  <span>${refundAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {formData.refund_type === 'partial' && (
            <div className="space-y-2">
              <Label htmlFor="refund_reason">Partial Refund Reason</Label>
              <Textarea
                id="refund_reason"
                value={formData.refund_reason}
                onChange={(e) => setFormData({ ...formData, refund_reason: e.target.value })}
                placeholder="Explain why only partial refund is being issued..."
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Return Reason *</Label>
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
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || returnItems.length === 0}>
              {loading ? 'Creating...' : 'Create Return'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
