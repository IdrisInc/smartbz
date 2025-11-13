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

interface QuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface QuotationItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

interface Supplier {
  id: string;
  name: string;
}

export function QuotationDialog({ open, onOpenChange, onSuccess }: QuotationDialogProps) {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [formData, setFormData] = useState({
    quotation_number: `QT-${Date.now().toString().slice(-6)}`,
    quotation_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    supplier_id: '',
    notes: '',
  });

  useEffect(() => {
    if (open && currentOrganization?.id) {
      fetchSuppliers();
    }
  }, [open, currentOrganization]);

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

  const updateItem = (id: string, field: keyof QuotationItem, value: any) => {
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
      updateItem(id, 'unit_price', product.price || 0);
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
      const { data: quotationData, error: quotationError } = await supabase
        .from('quotations')
        .insert({
          organization_id: currentOrganization.id,
          quotation_number: formData.quotation_number,
          quotation_date: formData.quotation_date,
          valid_until: formData.valid_until || null,
          supplier_id: formData.supplier_id || null,
          total_amount: totalAmount,
          notes: formData.notes,
          status: 'draft',
        })
        .select()
        .single();

      if (quotationError) throw quotationError;

      const itemsToInsert = items.map(item => ({
        quotation_id: quotationData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.total_amount
      }));

      const { error: itemsError } = await supabase
        .from('quotation_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Quotation created successfully",
      });
      onSuccess();
      onOpenChange(false);
      setItems([]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create quotation",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Quotation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quotation_number">Quotation Number *</Label>
              <Input
                id="quotation_number"
                value={formData.quotation_number}
                onChange={(e) => setFormData({ ...formData, quotation_number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quotation_date">Quotation Date *</Label>
              <Input
                id="quotation_date"
                type="date"
                value={formData.quotation_date}
                onChange={(e) => setFormData({ ...formData, quotation_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input
                id="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
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
              <Label>Quotation Items *</Label>
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
              {loading ? 'Creating...' : 'Create Quotation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}