
import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PurchaseOrderFormProps {
  onClose: () => void;
}

export function PurchaseOrderForm({ onClose }: PurchaseOrderFormProps) {
  const [orderItems, setOrderItems] = useState<any[]>([]);

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
              <Select>
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
              <Input id="expectedDate" type="date" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Order Items</h4>
              <Button size="sm">
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
                {orderItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                    </div>
                    <Input type="number" placeholder="Qty" className="w-20" />
                    <Input type="number" placeholder="Price" className="w-24" />
                    <Button size="sm" variant="destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button>Create Purchase Order</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
