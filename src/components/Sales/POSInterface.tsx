
import React, { useState } from 'react';
import { X, Calculator, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface POSInterfaceProps {
  onClose: () => void;
}

export function POSInterface({ onClose }: POSInterfaceProps) {
  const [cart, setCart] = useState<any[]>([]);
  const [serialInput, setSerialInput] = useState('');

  const handleSerialScan = (serial: string) => {
    // This would lookup product by serial number
    console.log('Looking up product with serial:', serial);
    // Add product to cart based on serial
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-full max-w-6xl h-[90vh] bg-background rounded-lg overflow-hidden">
        <div className="flex h-full">
          {/* Product Grid */}
          <div className="flex-1 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Products</h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mb-4">
              <Input
                placeholder="Scan or enter serial number..."
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSerialScan(serialInput);
                    setSerialInput('');
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Product buttons would go here */}
              <Button variant="outline" className="h-24 flex flex-col">
                <div className="font-medium">iPhone 15 Pro</div>
                <div className="text-sm text-muted-foreground">$999.99</div>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col">
                <div className="font-medium">Consultation</div>
                <div className="text-sm text-muted-foreground">$150.00</div>
              </Button>
            </div>
          </div>

          {/* Cart */}
          <div className="w-80 border-l bg-muted/20 p-4">
            <h3 className="text-lg font-semibold mb-4">Current Sale</h3>
            
            <div className="space-y-2 mb-4">
              {cart.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Cart is empty
                </p>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="flex justify-between p-2 bg-background rounded">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${item.total}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>$0.00</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Button className="w-full">
                <Receipt className="mr-2 h-4 w-4" />
                Complete Sale
              </Button>
              <Button variant="outline" className="w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Calculator
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
