
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, ShoppingCart, CreditCard, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface POSInterfaceProps {
  onClose: () => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock_quantity: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export function POSInterface({ onClose }: POSInterfaceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchProducts();
    }
  }, [currentOrganization]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, category, stock_quantity')
        .eq('organization_id', currentOrganization?.id)
        .eq('is_active', true)
        .gt('stock_quantity', 0);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
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

  const updateQuantity = (id: string, quantity: number) => {
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
      // Create sale record
      const { error: saleError } = await supabase
        .from('sales')
        .insert({
          organization_id: currentOrganization?.id,
          total_amount: total,
          tax_amount: tax,
          payment_method: method.toLowerCase(),
          payment_status: 'completed',
          sale_date: new Date().toISOString(),
        });

      if (saleError) throw saleError;

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
              {loading ? (
                <div className="col-span-3 text-center py-8">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-3 text-center py-8 text-muted-foreground">No products found</div>
              ) : (
                filteredProducts.map((product) => (
                  <Card key={product.id} className="cursor-pointer hover:bg-gray-50" onClick={() => addToCart(product)}>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.category}</div>
                      <div className="text-lg font-bold mt-2">${product.price}</div>
                      <div className="text-xs text-muted-foreground">Stock: {product.stock_quantity}</div>
                    </CardContent>
                  </Card>
                ))
              )}
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
