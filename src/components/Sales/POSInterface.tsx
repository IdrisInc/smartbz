import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Search, ShoppingCart, CreditCard, Banknote, Copy, CheckCircle, Mail, Phone, UserPlus, Printer, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { ContactForm } from '@/components/Contacts/ContactForm';
import { useExportUtils } from '@/hooks/useExportUtils';

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
  const [applyTax, setApplyTax] = useState(true);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [completedSaleId, setCompletedSaleId] = useState<string>('');
  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { exportToCSV } = useExportUtils();

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchProducts();
      fetchCustomers();
      fetchBusinessSettings();
    }
  }, [currentOrganization]);

  const fetchBusinessSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('organization_id', currentOrganization?.id)
        .single();

      if (error) throw error;
      setBusinessSettings(data);
    } catch (error) {
      console.error('Error fetching business settings:', error);
    }
  };

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
  const discountedSubtotal = subtotal - discountAmount;
  const tax = applyTax ? discountedSubtotal * 0.1 : 0; // 10% tax only if applied
  const total = discountedSubtotal + tax;

  const generateSaleNumber = () => {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    return `SALE-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${timestamp}`;
  };

  const generateReceipt = (saleId: string, saleNumber: string, customerName: string) => {
    const productList = cart.map(item => 
      `${item.name} x${item.quantity} @ $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');
    
    return {
      businessName: businessSettings?.business_name || currentOrganization?.name || 'Business',
      businessAddress: businessSettings?.address || '',
      businessPhone: businessSettings?.phone || '',
      businessEmail: businessSettings?.email || '',
      saleNumber,
      saleId,
      date: new Date().toLocaleString(),
      customerName,
      items: cart,
      subtotal,
      discount: discountAmount,
      tax: applyTax ? tax : 0,
      taxRate: applyTax ? '10%' : 'N/A',
      total,
      paymentMethod: '',
      productList
    };
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
          discount_amount: discountAmount,
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

      // Generate receipt
      const receipt = generateReceipt(saleData.id, saleNumber, customerName);
      receipt.paymentMethod = paymentMethod;
      setPaymentCode(JSON.stringify(receipt, null, 2));
      setCompletedSaleId(saleData.id);
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

  const printReceipt = () => {
    const receipt = JSON.parse(paymentCode);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${receipt.saleNumber}</title>
            <style>
              body { font-family: monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
              h1, h2 { text-align: center; margin: 10px 0; }
              .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
              .items { margin: 20px 0; }
              .item { display: flex; justify-content: space-between; margin: 5px 0; }
              .totals { border-top: 2px dashed #000; padding-top: 10px; margin-top: 10px; }
              .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
              .grand-total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; }
              .footer { text-align: center; border-top: 2px dashed #000; padding-top: 10px; margin-top: 10px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${receipt.businessName}</h1>
              ${receipt.businessAddress ? `<p>${receipt.businessAddress}</p>` : ''}
              ${receipt.businessPhone ? `<p>Phone: ${receipt.businessPhone}</p>` : ''}
              ${receipt.businessEmail ? `<p>Email: ${receipt.businessEmail}</p>` : ''}
            </div>
            <p><strong>Receipt #:</strong> ${receipt.saleNumber}</p>
            <p><strong>Date:</strong> ${receipt.date}</p>
            <p><strong>Customer:</strong> ${receipt.customerName}</p>
            <p><strong>Payment:</strong> ${receipt.paymentMethod}</p>
            <div class="items">
              <h2>Items</h2>
              ${receipt.items.map((item: CartItem) => `
                <div class="item">
                  <span>${item.name} x${item.quantity}</span>
                  <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>$${receipt.subtotal.toFixed(2)}</span>
              </div>
              ${receipt.discount > 0 ? `
                <div class="total-row">
                  <span>Discount:</span>
                  <span>-$${receipt.discount.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="total-row">
                <span>Tax (${receipt.taxRate}):</span>
                <span>$${receipt.tax.toFixed(2)}</span>
              </div>
              <div class="total-row grand-total">
                <span>TOTAL:</span>
                <span>$${receipt.total.toFixed(2)}</span>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for your business!</p>
              <p>We appreciate your purchase</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportReceipt = () => {
    const receipt = JSON.parse(paymentCode);
    const csvData = [
      { field: 'Business Name', value: receipt.businessName },
      { field: 'Receipt Number', value: receipt.saleNumber },
      { field: 'Date', value: receipt.date },
      { field: 'Customer', value: receipt.customerName },
      { field: 'Payment Method', value: receipt.paymentMethod },
      { field: '', value: '' },
      { field: 'Items', value: '' },
      ...receipt.items.map((item: CartItem) => ({
        field: `${item.name} x${item.quantity}`,
        value: `$${(item.price * item.quantity).toFixed(2)}`
      })),
      { field: '', value: '' },
      { field: 'Subtotal', value: `$${receipt.subtotal.toFixed(2)}` },
      { field: 'Discount', value: `-$${receipt.discount.toFixed(2)}` },
      { field: 'Tax', value: `$${receipt.tax.toFixed(2)}` },
      { field: 'TOTAL', value: `$${receipt.total.toFixed(2)}` }
    ];
    exportToCSV(csvData, `receipt-${receipt.saleNumber}`);
  };

  const viewSaleDetails = async () => {
    if (!completedSaleId) return;
    
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            *,
            products (name, sku)
          ),
          contacts (name, email, phone)
        `)
        .eq('id', completedSaleId)
        .single();

      if (error) throw error;
      
      console.log('Sale details:', data);
      toast({
        title: "Sale Details",
        description: "Check console for full sale details",
      });
    } catch (error) {
      console.error('Error fetching sale details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch sale details",
      });
    }
  };

  const handleNewSale = () => {
    setCart([]);
    setSelectedCustomerId('');
    setPaymentCode('');
    setShowPaymentCode(false);
    setDiscountAmount(0);
    setApplyTax(true);
    setCompletedSaleId('');
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

                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>${subtotal.toFixed(2)}</span>
                            </div>
                            
                            <div>
                              <Label htmlFor="discount">Discount Amount</Label>
                              <Input
                                id="discount"
                                type="number"
                                min="0"
                                max={subtotal}
                                step="0.01"
                                value={discountAmount}
                                onChange={(e) => setDiscountAmount(Math.max(0, Math.min(subtotal, parseFloat(e.target.value) || 0)))}
                                placeholder="0.00"
                              />
                            </div>

                            {discountAmount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Discount:</span>
                                <span>-${discountAmount.toFixed(2)}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <Label htmlFor="apply-tax">Apply Tax (10%)</Label>
                              <Switch
                                id="apply-tax"
                                checked={applyTax}
                                onCheckedChange={setApplyTax}
                              />
                            </div>

                            {applyTax && (
                              <div className="flex justify-between">
                                <span>Tax (10%):</span>
                                <span>${tax.toFixed(2)}</span>
                              </div>
                            )}
                            
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
                <Card className="w-full max-w-2xl">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl">Payment Successful!</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div ref={receiptRef} className="p-6 bg-muted rounded-lg border">
                      {(() => {
                        try {
                          const receipt = JSON.parse(paymentCode);
                          return (
                            <div className="space-y-4 font-mono text-sm">
                              <div className="text-center border-b pb-4">
                                <h2 className="text-xl font-bold">{receipt.businessName}</h2>
                                {receipt.businessAddress && <p className="text-xs">{receipt.businessAddress}</p>}
                                {receipt.businessPhone && <p className="text-xs">Phone: {receipt.businessPhone}</p>}
                                {receipt.businessEmail && <p className="text-xs">Email: {receipt.businessEmail}</p>}
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span>Receipt #:</span>
                                  <span className="font-bold">{receipt.saleNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Date:</span>
                                  <span>{receipt.date}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Customer:</span>
                                  <span>{receipt.customerName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Payment:</span>
                                  <span className="uppercase">{receipt.paymentMethod}</span>
                                </div>
                              </div>

                              <div className="border-t border-b py-2">
                                <h3 className="font-bold mb-2">Items</h3>
                                {receipt.items.map((item: CartItem, idx: number) => (
                                  <div key={idx} className="flex justify-between text-xs">
                                    <span>{item.name} x{item.quantity}</span>
                                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span>Subtotal:</span>
                                  <span>${receipt.subtotal.toFixed(2)}</span>
                                </div>
                                {receipt.discount > 0 && (
                                  <div className="flex justify-between text-green-600">
                                    <span>Discount:</span>
                                    <span>-${receipt.discount.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span>Tax ({receipt.taxRate}):</span>
                                  <span>${receipt.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-base border-t pt-1">
                                  <span>TOTAL:</span>
                                  <span>${receipt.total.toFixed(2)}</span>
                                </div>
                              </div>

                              <div className="text-center border-t pt-4 text-xs">
                                <p className="font-bold">Thank you for your business!</p>
                                <p>We appreciate your purchase</p>
                              </div>
                            </div>
                          );
                        } catch (e) {
                          return <pre className="text-xs whitespace-pre-wrap">{paymentCode}</pre>;
                        }
                      })()}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Button onClick={printReceipt} variant="outline" className="w-full">
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                      </Button>
                      <Button onClick={exportReceipt} variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      <Button onClick={viewSaleDetails} variant="outline" className="w-full">
                        <Eye className="mr-2 h-4 w-4" />
                        Details
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