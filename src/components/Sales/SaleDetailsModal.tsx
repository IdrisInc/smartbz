import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SaleDetailsModalProps {
  saleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleDetailsModal({ saleId, open, onOpenChange }: SaleDetailsModalProps) {
  const [sale, setSale] = useState<any>(null);
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && saleId) {
      fetchSaleDetails();
    }
  }, [open, saleId]);

  const fetchSaleDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch sale with contact info
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          contacts(name, email, phone),
          employees(first_name, last_name)
        `)
        .eq('id', saleId)
        .single();

      if (saleError) throw saleError;

      // Fetch sale items with product info
      const { data: itemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select(`
          *,
          products(name, sku)
        `)
        .eq('sale_id', saleId);

      if (itemsError) throw itemsError;

      // Fetch business settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('business_settings')
        .select('*')
        .eq('organization_id', saleData.organization_id)
        .maybeSingle();

      if (settingsError) throw settingsError;

      setSale(saleData);
      setSaleItems(itemsData || []);
      setBusinessSettings(settingsData);
    } catch (error) {
      console.error('Error fetching sale details:', error);
      toast({
        title: "Error",
        description: "Failed to load sale details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Receipt</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { font-family: Arial, sans-serif; padding: 20px; }
      .receipt-header { text-align: center; margin-bottom: 20px; }
      .receipt-header h1 { margin: 0; font-size: 24px; }
      .receipt-header p { margin: 5px 0; font-size: 12px; }
      .receipt-info { margin: 20px 0; }
      .receipt-info p { margin: 5px 0; font-size: 14px; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
      th { font-weight: bold; }
      .totals { margin-top: 20px; text-align: right; }
      .totals p { margin: 5px 0; font-size: 14px; }
      .totals .grand-total { font-size: 18px; font-weight: bold; }
      .receipt-footer { text-align: center; margin-top: 30px; font-size: 12px; }
      hr { border: none; border-top: 2px solid #000; margin: 10px 0; }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sale Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handlePrint} variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div ref={receiptRef}>
                {/* Header with Business Details */}
                <div className="receipt-header text-center mb-6">
                  <h1 className="text-2xl font-bold">{businessSettings?.business_name || 'Business Name'}</h1>
                  {businessSettings?.address && <p className="text-sm text-muted-foreground">{businessSettings.address}</p>}
                  {businessSettings?.city && <p className="text-sm text-muted-foreground">{businessSettings.city}, {businessSettings.country}</p>}
                  {businessSettings?.phone && <p className="text-sm text-muted-foreground">Phone: {businessSettings.phone}</p>}
                  {businessSettings?.email && <p className="text-sm text-muted-foreground">Email: {businessSettings.email}</p>}
                </div>

                <Separator className="my-4" />

                {/* Sale Information */}
                <div className="receipt-info space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="font-semibold">Receipt Number:</span>
                    <span>{sale.sale_number || `#${sale.id.slice(0, 8)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Date:</span>
                    <span>{new Date(sale.sale_date || sale.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Customer:</span>
                    <span>{sale.contacts?.name || 'Walk-in Customer'}</span>
                  </div>
                  {sale.contacts?.phone && (
                    <div className="flex justify-between">
                      <span className="font-semibold">Phone:</span>
                      <span>{sale.contacts.phone}</span>
                    </div>
                  )}
                  {sale.employees && (
                    <div className="flex justify-between">
                      <span className="font-semibold">Served by:</span>
                      <span>{sale.employees.first_name} {sale.employees.last_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Payment Status:</span>
                    <Badge variant={sale.payment_status === 'paid' ? 'default' : 'secondary'}>
                      {sale.payment_status || 'pending'}
                    </Badge>
                  </div>
                  {sale.payment_method && (
                    <div className="flex justify-between">
                      <span className="font-semibold">Payment Method:</span>
                      <span className="capitalize">{sale.payment_method}</span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Items Table */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Items</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saleItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.products?.name || 'Unknown Product'}</div>
                              {item.products?.sku && (
                                <div className="text-xs text-muted-foreground">SKU: {item.products.sku}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">${Number(item.unit_price).toFixed(2)}</TableCell>
                          <TableCell className="text-right">${Number(item.discount_amount || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right">${Number(item.total_amount).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Separator className="my-4" />

                {/* Totals */}
                <div className="totals space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${(Number(sale.total_amount) - Number(sale.tax_amount || 0) + Number(sale.discount_amount || 0)).toFixed(2)}</span>
                  </div>
                  {sale.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Discount:</span>
                      <span>-${Number(sale.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {sale.tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tax:</span>
                      <span>${Number(sale.tax_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold grand-total">
                    <span>Total:</span>
                    <span>${Number(sale.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                {sale.notes && (
                  <>
                    <Separator className="my-4" />
                    <div className="text-sm">
                      <span className="font-semibold">Notes:</span>
                      <p className="text-muted-foreground mt-1">{sale.notes}</p>
                    </div>
                  </>
                )}

                {/* Footer */}
                <div className="receipt-footer mt-6 text-center text-sm text-muted-foreground">
                  <p>Thank you for your business!</p>
                  <p>Please come again</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
