import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
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
  quantity: number;
  unit_price: number;
  total_amount: number;
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
      quantity: 1,
      unit_price: 0,
      total_amount: 0
    }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof ReturnItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updated.total_amount = updated.quantity * updated.unit_price;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleProductSelect = (id: string, product: any) => {
    if (product) {
      updateItem(id, 'product_id', product.id);
      updateItem(id, 'product_name', product.name);
      updateItem(id, 'unit_price', product.cost || product.price || 0);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total_amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization?.id) return;

    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add at least one item",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: returnData, error: returnError } = await supabase
        .from('purchase_returns')
        .insert({
          organization_id: currentOrganization.id,
          return_number: formData.return_number,
          return_date: formData.return_date,
          purchase_order_id: formData.purchase_order_id || null,
          supplier_id: formData.supplier_id || null,
          total_amount: totalAmount,
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
        total_amount: item.total_amount
      }));

      const { error: itemsError } = await supabase
        .from('purchase_return_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Log inventory movement
      for (const item of items) {
        await supabase.from('inventory_movements').insert({
          organization_id: currentOrganization.id,
          product_id: item.product_id,
          movement_type: 'return_to_supplier',
          quantity: -item.quantity,
          reference_type: 'purchase_return',
          reference_id: returnData.id,
          notes: `Return to supplier: ${formData.reason}`
        });
      }

      toast({
        title: "Success",
        description: "Purchase return created successfully",
      });
      onSuccess();
      onOpenChange(false);
      setItems([]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create purchase return",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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
              <Label>Return Items *</Label>
              <Button type="button" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-2 p-3 border rounded">
                <div className="flex-1">
                  <ProductSelector
                    value={item.product_id}
                    onSelect={(product) => handleProductSelect(item.id, product)}
                    placeholder="Select product..."
                  />
                </div>
                <Input
                  type="number"
                  placeholder="Qty"
                  className="w-20"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                />
                <Input
                  type="number"
                  placeholder="Price"
                  className="w-24"
                  value={item.unit_price}
                  onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                />
                <div className="w-24 text-sm font-medium">
                  ${item.total_amount.toFixed(2)}
                </div>
                <Button type="button" size="sm" variant="destructive" onClick={() => removeItem(item.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {items.length > 0 && (
              <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-lg font-semibold">Total: ${totalAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Return'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}