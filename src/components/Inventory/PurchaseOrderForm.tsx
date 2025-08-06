
import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface PurchaseOrderFormProps {
  onClose: () => void;
}

interface OrderItem {
  id: string;
  product: string;
  quantity: number;
  price: number;
  total: number;
}

export function PurchaseOrderForm({ onClose }: PurchaseOrderFormProps) {
  const { toast } = useToast();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [supplier, setSupplier] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      product: 'New Product',
      quantity: 1,
      price: 0,
      total: 0
    };
    setOrderItems([...orderItems, newItem]);
  };

  const removeItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updated.total = updated.quantity * updated.price;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSubmit = async () => {
    if (!supplier) {
      toast({
        title: "Error",
        description: "Please select a supplier",
        variant: "destructive",
      });
      return;
    }

    if (orderItems.length === 0) {
      toast({
        title: "Error", 
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>New Purchase Order</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Select value={supplier} onValueChange={setSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech-supplies">Tech Supplies Ltd</SelectItem>
                  <SelectItem value="office-depot">Office Depot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedDate">Expected Delivery</Label>
              <Input 
                id="expectedDate" 
                type="date" 
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Order Items</h4>
              <Button size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
            
            {orderItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No items added yet
              </p>
            ) : (
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-3 border rounded">
                    <div className="flex-1">
                      <Input 
                        value={item.product}
                        onChange={(e) => updateItem(item.id, 'product', e.target.value)}
                        placeholder="Product name"
                        className="font-medium"
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
                      value={item.price}
                      onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                    />
                    <div className="w-24 text-sm font-medium">
                      ${item.total.toFixed(2)}
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => removeItem(item.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {orderItems.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total: ${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Purchase Order'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
