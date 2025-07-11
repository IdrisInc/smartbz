
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, ShoppingCart, CreditCard, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface POSInterfaceProps {
  onClose: () => void;
}

const mockProducts = [
  { id: 1, name: 'iPhone 15', price: 999.99, category: 'Electronics' },
  { id: 2, name: 'Coffee Mug', price: 12.99, category: 'Accessories' },
  { id: 3, name: 'Notebook', price: 5.99, category: 'Stationery' },
  { id: 4, name: 'Wireless Headphones', price: 199.99, category: 'Electronics' },
];

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export function POSInterface({ onClose }: POSInterfaceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: typeof mockProducts[0]) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  const processPayment = async (method: string) => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty Cart",
        description: "Please add items to the cart before processing payment.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Payment Successful",
        description: `Payment of $${total.toFixed(2)} processed via ${method}.`,
      });
      
      setCart([]);
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "There was an error processing the payment.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] h-[80vh]">
        <DialogHeader>
          <DialogTitle>Point of Sale System</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6 h-full">
          {/* Product Selection */}
          <div className="col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="cursor-pointer hover:bg-gray-50" onClick={() => addToCart(product)}>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium">{product.name}</div>
                    <div className="text-xs text-muted-foreground">{product.category}</div>
                    <div className="text-lg font-bold mt-2">${product.price}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart and Checkout */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">${item.price} each</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    Cart is empty
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Buttons */}
            <div className="space-y-2">
              <Button 
                className="w-full" 
                onClick={() => processPayment('Cash')}
                disabled={isProcessing}
              >
                <Banknote className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Pay with Cash'}
              </Button>
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={() => processPayment('Card')}
                disabled={isProcessing}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Pay with Card'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
