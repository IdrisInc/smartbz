import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ShoppingCart, CreditCard, Banknote, Copy, CheckCircle, Mail, Phone, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { ContactForm } from '@/components/Contacts/ContactForm';

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
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [paymentCode, setPaymentCode] = useState('');
  const [showPaymentCode, setShowPaymentCode] = useState(false);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchProducts();
      fetchCustomers();
    }
  }, [currentOrganization]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', currentOrganization?.id)
        .eq('contact_type', 'customer')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

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

  const generatePaymentCode = (saleId: string, saleNumber: string, customerName: string) => {
    const productList = cart.map(item => `${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n');
    
    return `PAYMENT CODE: ${saleNumber}
    
SALE DETAILS:
${productList}

Subtotal: $${subtotal.toFixed(2)}
Tax (10%): $${tax.toFixed(2)}
TOTAL: $${total.toFixed(2)}

Customer: ${customerName}
Date: ${new Date().toLocaleString()}

Reference ID: ${saleId}

Please keep this code for your records.`;
  };

  const processPayment = async (paymentMethod: 'cash' | 'card') => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const saleNumber = generateSaleNumber();
      
      // Get customer info
      const selectedCustomer = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) : null;
      const customerName = selectedCustomer?.name || 'Walk-in Customer';
      
      // Create sale record
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          organization_id: currentOrganization?.id,
          contact_id: selectedCustomerId || null,
          sale_number: saleNumber,
          total_amount: total,
          tax_amount: tax,
          payment_status: 'paid',
          payment_method: paymentMethod,
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
      const code = generatePaymentCode(saleData.id, saleNumber, customerName);
      setPaymentCode(code);
      setShowPaymentCode(true);

      toast({
        title: "Payment Successful",
        description: `Sale completed successfully`,
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
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    if (!selectedCustomer?.email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Selected customer doesn't have an email address.",
      });
      return;
    }
    const subject = encodeURIComponent("Your Purchase Details");
    const body = encodeURIComponent(paymentCode);
    window.location.href = `mailto:${selectedCustomer.email}?subject=${subject}&body=${body}`;
    toast({
      title: "Email client opened",
      description: "Please send the email from your email client",
    });
  };

  const sendSMS = () => {
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    if (!selectedCustomer?.phone) {
      toast({
        variant: "destructive",
        title: "Phone required",
        description: "Selected customer doesn't have a phone number.",
      });
      return;
    }
    const smsBody = encodeURIComponent(paymentCode);
    window.location.href = `sms:${selectedCustomer.phone}?body=${smsBody}`;
    toast({
      title: "SMS opened",
      description: "Please send the SMS from your messaging app",
    });
  };

  const handleNewSale = () => {
    setCart([]);
    setSelectedCustomerId('');
    setPaymentCode('');
    setShowPaymentCode(false);
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-2xl">Point of Sale</DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6">
            {!showPaymentCode ? (
              <div className="grid grid-cols-3 gap-6 pb-6">
                {/* Products Section */}
                <div className="col-span-2 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {loading ? (
                      <div className="col-span-3 text-center py-8">Loading products...</div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="col-span-3 text-center py-8 text-muted-foreground">
                        No products found
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <Card
                          key={product.id}
                          className="cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => addToCart(product)}
                        >
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">{product.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                              <Badge variant="secondary">{product.stock_quantity} in stock</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                {/* Cart Section */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Shopping Cart ({cart.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {cart.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Cart is empty</p>
                      ) : (
                        <>
                          <div className="space-y-3 max-h-[25vh] overflow-y-auto">
                            {cart.map((item) => (
                              <div key={item.id} className="flex items-center justify-between border-b pb-3">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{item.name}</p>
                                  <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  >
                                    -
                                  </Button>
                                  <span className="w-8 text-center">{item.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  >
                                    +
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <Separator />

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tax (10%):</span>
                              <span>${tax.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-xl font-bold">
                              <span>Total:</span>
                              <span>${total.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="customer">Select Customer</Label>
                              <div className="flex gap-2">
                                <Select value={selectedCustomerId || "walk-in"} onValueChange={(value) => setSelectedCustomerId(value === "walk-in" ? "" : value)}>
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Walk-in customer" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="walk-in">Walk-in customer</SelectItem>
                                    {customers.map((customer) => (
                                      <SelectItem key={customer.id} value={customer.id}>
                                        {customer.name} {customer.phone && `- ${customer.phone}`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setShowAddCustomer(true)}
                                  title="Add new customer"
                                >
                                  <UserPlus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={() => processPayment('cash')}
                              disabled={isProcessing}
                              className="w-full"
                            >
                              <Banknote className="mr-2 h-4 w-4" />
                              Pay with Cash
                            </Button>
                            <Button
                              onClick={() => processPayment('card')}
                              disabled={isProcessing}
                              variant="secondary"
                              className="w-full"
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Pay with Card
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Card className="w-full max-w-md">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl">Payment Successful!</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap font-mono">{paymentCode}</pre>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Button onClick={copyPaymentCode} variant="outline" className="w-full">
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      <Button 
                        onClick={sendEmail} 
                        variant="outline" 
                        className="w-full"
                        disabled={!customers.find(c => c.id === selectedCustomerId)?.email}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </Button>
                      <Button 
                        onClick={sendSMS} 
                        variant="outline" 
                        className="w-full"
                        disabled={!customers.find(c => c.id === selectedCustomerId)?.phone}
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        SMS
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={handleNewSale} className="w-full">
                        New Sale
                      </Button>
                      <Button onClick={onClose} variant="outline" className="w-full">
                        Close
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {showAddCustomer && (
        <ContactForm
          onClose={() => setShowAddCustomer(false)}
          onSave={() => {
            fetchCustomers();
            setShowAddCustomer(false);
          }}
        />
      )}
    </>
  );
}