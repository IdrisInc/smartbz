import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { ProductSelector } from '@/components/Products/ProductSelector';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

interface PurchaseReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ReturnItem {
  id: string;
  product_id: string;
  product_name: string;
  brand_name: string;
  sku: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  condition: 'defective' | 'damaged' | 'excess' | 'wrong_item';
}

interface PurchaseOrder {
  id: string;
  po_number: string;
}

interface Supplier {
  id: string;
  name: string;
}

export function PurchaseReturnDialog({ open, onOpenChange, onSuccess }: PurchaseReturnDialogProps) {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [formData, setFormData] = useState({
    return_number: `PR-${Date.now().toString().slice(-6)}`,
    return_date: new Date().toISOString().split('T')[0],
    purchase_order_id: '',
    supplier_id: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    if (open && currentOrganization?.id) {
      fetchPurchaseOrders();
      fetchSuppliers();
      setItems([]);
      setFormData({
        return_number: `PR-${Date.now().toString().slice(-6)}`,
        return_date: new Date().toISOString().split('T')[0],
        purchase_order_id: '',
        supplier_id: '',
        reason: '',
        notes: '',
      });
    }
  }, [open, currentOrganization]);

  const fetchPurchaseOrders = async () => {
    const { data } = await supabase
      .from('purchase_orders')
      .select('id, po_number')
      .eq('organization_id', currentOrganization?.id)
      .eq('status', 'received')
      .order('created_at', { ascending: false });
    setPurchaseOrders(data || []);
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('contacts')
      .select('id, name')
      .eq('organization_id', currentOrganization?.id)
      .eq('contact_type', 'supplier');
    setSuppliers(data || []);
  };

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      product_id: '',
      product_name: '',
      brand_name: '-',
      sku: '-',
      quantity: 1,
      unit: 'pcs',
      unit_price: 0,
      discount_amount: 0,
      tax_rate: 0,
      tax_amount: 0,
      total_amount: 0,
      condition: 'defective',
    }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof ReturnItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price' || field === 'tax_rate' || field === 'discount_amount') {
          const subtotal = updated.quantity * updated.unit_price;
          updated.tax_amount = subtotal * (updated.tax_rate / 100);
          updated.total_amount = subtotal - updated.discount_amount + updated.tax_amount;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleProductSelect = (id: string, product: any) => {
    if (product) {
      setItems(items.map(item => {
        if (item.id === id) {
          const unitPrice = product.cost || product.price || 0;
          return {
            ...item,
            product_id: product.id,
            product_name: product.name,
            brand_name: product.product_brands?.name || '-',
            sku: product.sku || '-',
            unit: product.unit || 'pcs',
            unit_price: unitPrice,
            total_amount: unitPrice * item.quantity,
          };
        }
        return item;
      }));
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const discountTotal = items.reduce((sum, item) => sum + item.discount_amount, 0);
    const taxTotal = items.reduce((sum, item) => sum + item.tax_amount, 0);
    const total = subtotal - discountTotal + taxTotal;
    return { subtotal, discountTotal, taxTotal, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization?.id) return;

    if (items.length === 0 || items.some(item => !item.product_id)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add at least one valid item",
      });
      return;
    }

    setLoading(true);
    try {
      const { total } = calculateTotals();

      const { data: returnData, error: returnError } = await supabase
        .from('purchase_returns')
        .insert({
          organization_id: currentOrganization.id,
          return_number: formData.return_number,
          return_date: formData.return_date,
          purchase_order_id: formData.purchase_order_id || null,
          supplier_id: formData.supplier_id || null,
          total_amount: total,
          reason: formData.reason,
          notes: formData.notes,
          status: 'pending',
        })
        .select()
        .single();

      if (returnError) throw returnError;

      const itemsToInsert = items.map(item => ({
        purchase_return_id: returnData.id,
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
        .from('purchase_return_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Purchase return created successfully. Awaiting approval.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating purchase return:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create purchase return",
      });
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, discountTotal, taxTotal, total } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Return</DialogTitle>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_order">Purchase Order</Label>
              <Select value={formData.purchase_order_id} onValueChange={(val) => setFormData({ ...formData, purchase_order_id: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select PO (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrders.map(po => (
                    <SelectItem key={po.id} value={po.id}>{po.po_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select value={formData.supplier_id} onValueChange={(val) => setFormData({ ...formData, supplier_id: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(sup => (
                    <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Purchase Return Items *</Label>
              <Button type="button" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {items.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10">No</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead className="w-20">Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right w-24">Unit Price</TableHead>
                      <TableHead className="text-right w-20">Discount</TableHead>
                      <TableHead className="text-right w-16">Tax %</TableHead>
                      <TableHead className="text-right w-20">Tax Amt</TableHead>
                      <TableHead className="text-right w-24">Total</TableHead>
                      <TableHead className="w-28">Condition</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="min-w-[200px]">
                          <ProductSelector
                            value={item.product_id}
                            onSelect={(product) => handleProductSelect(item.id, product)}
                            placeholder="Select product..."
                          />
                        </TableCell>
                        <TableCell>{item.brand_name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-16 h-8"
                          />
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-24 h-8 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.discount_amount}
                            onChange={(e) => updateItem(item.id, 'discount_amount', parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step="0.1"
                            value={item.tax_rate}
                            onChange={(e) => updateItem(item.id, 'tax_rate', parseFloat(e.target.value) || 0)}
                            className="w-16 h-8 text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right">${item.tax_amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">${item.total_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Select 
                            value={item.condition} 
                            onValueChange={(val) => updateItem(item.id, 'condition', val)}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="defective">Defective</SelectItem>
                              <SelectItem value="damaged">Damaged</SelectItem>
                              <SelectItem value="excess">Excess</SelectItem>
                              <SelectItem value="wrong_item">Wrong Item</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {items.length > 0 && (
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
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || items.length === 0}>
              {loading ? 'Creating...' : 'Create Return'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
