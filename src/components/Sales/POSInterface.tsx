import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Search, ShoppingCart, CreditCard, Banknote, Copy, CheckCircle, Mail, Phone } from 'lucide-react';
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
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentCode, setPaymentCode] = useState('');
  const [showPaymentCode, setShowPaymentCode] = useState(false);
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

  const generateSaleNumber = () => {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    return `SALE-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${timestamp}`;
  };

  const generatePaymentCode = (saleId: string, saleNumber: string) => {
    const productList = cart.map(item => `${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n');
    
    return `PAYMENT CODE: ${saleNumber}
    
SALE DETAILS:
${productList}

Subtotal: $${subtotal.toFixed(2)}
Tax (10%): $${tax.toFixed(2)}
TOTAL: $${total.toFixed(2)}

Customer: ${customerEmail || customerPhone || 'Walk-in Customer'}
Date: ${new Date().toLocaleString()}

Reference ID: ${saleId}

Please keep this code for your records.`;
  };

  const processPayment = async (method: string) => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty Cart",
        description: "Please add items to the cart before processing payment.",
      });
      return;
    }

    if (!customerEmail && !customerPhone) {
      toast({
        variant: "destructive",
        title: "Customer Details Required",
        description: "Please provide customer email or phone number for the payment code.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const saleNumber = generateSaleNumber();

      // Create sale record
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          organization_id: currentOrganization?.id,
          total_amount: total,
          tax_amount: tax,
          payment_method: method.toLowerCase(),
          payment_status: 'paid',
          sale_date: new Date().toISOString(),
          sale_number: saleNumber,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = cart.map(item => ({
        sale_id: saleData.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_amount: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of cart) {
        const { data: productData, error: fetchError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.id)
          .single();

        if (fetchError) throw fetchError;

        const newStock = productData.stock_quantity - item.quantity;
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.id);

        if (stockError) throw stockError;
      }

      // Generate payment code
      const code = generatePaymentCode(saleData.id, saleNumber);
      setPaymentCode(code);
      setShowPaymentCode(true);

      toast({
        title: "Payment Successful",
        description: `Payment code generated for ${customerEmail || customerPhone}`,
      });
      
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "There was an error processing the payment. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyPaymentCode = () => {
    navigator.clipboard.writeText(paymentCode);
    toast({
      title: "Copied!",
      description: "Payment code copied to clipboard",
    });
  };

  const sendEmail = () => {
    if (!customerEmail) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter a customer email to send the code.",
      });
      return;
    }
    const subject = encodeURIComponent("Your Purchase Details");
    const body = encodeURIComponent(paymentCode);
    window.open(`mailto:${customerEmail}?subject=${subject}&body=${body}`, "_blank");
  };

  const sendSMS = () => {
    if (!customerPhone) {
      toast({
        variant: "destructive",
        title: "Phone required",
        description: "Please enter a customer phone number to send the code.",
      });
      return;
    }
    const body = encodeURIComponent(paymentCode);
    const smsUrl = `sms:${customerPhone}?&body=${body}`;
    window.open(smsUrl, "_self");
  };

  const handleNewSale = () => {
    setCart([]);
    setCustomerEmail('');
    setCustomerPhone('');
    setPaymentCode('');
    setShowPaymentCode(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] h-[80vh]">
        <DialogHeader>
          <DialogTitle>Point of Sale System</DialogTitle>
        </DialogHeader>

        {showPaymentCode ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Payment Successful
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <Label className="text-sm font-medium">Payment Code (Send to Customer)</Label>
                  <div className="mt-2 p-3 bg-white border rounded text-sm font-mono whitespace-pre-line">
                    {paymentCode}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button onClick={copyPaymentCode} size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </Button>
                    <Button onClick={sendEmail} size="sm" disabled={!customerEmail}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send via Email
                    </Button>
                    {customerPhone && (
                      <Button onClick={sendSMS} size="sm" variant="outline">
                        <Phone className="h-4 w-4 mr-2" />
                        Send via SMS
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Manual Instructions:
                  <ul className="mt-2 space-y-1">
                    <li>• Copy the payment code above</li>
                    <li>• Send via email to: {customerEmail}</li>
                    {customerPhone && <li>• Or send via SMS to: {customerPhone}</li>}
                    <li>• Keep a copy for your records</li>
                  </ul>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleNewSale} className="flex-1">
                    New Sale
                  </Button>
                  <Button onClick={onClose} variant="outline" className="flex-1">
                    Close POS
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
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
              {/* Customer Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="customerEmail" className="text-xs">Email</Label>
                    <Input
                      id="customerEmail"
                      placeholder="customer@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone" className="text-xs">Phone (Optional)</Label>
                    <Input
                      id="customerPhone"
                      placeholder="+1 234 567 8900"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

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
        )}
      </DialogContent>
    </Dialog>
  );
}