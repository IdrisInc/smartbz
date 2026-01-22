import React, { useRef } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Download, Mail } from 'lucide-react';

interface PurchaseOrderPrintViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: any;
  businessSettings: any;
}

export function PurchaseOrderPrintView({
  open,
  onOpenChange,
  purchaseOrder,
  businessSettings
}: PurchaseOrderPrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const printWindow = window.open('', '', 'width=800,height=600');
    
    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Purchase Order - ${purchaseOrder?.po_number}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
              .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .business-info { margin-bottom: 20px; }
              .po-info { margin-bottom: 20px; }
              .total { text-align: right; font-weight: bold; margin-top: 20px; }
              .logo { max-height: 60px; }
              @media print { body { print-color-adjust: exact; } }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleEmail = () => {
    const supplierEmail = purchaseOrder?.supplier?.email;
    if (!supplierEmail) return;
    
    const subject = `Purchase Order - ${purchaseOrder.po_number}`;
    const body = `Dear ${purchaseOrder.supplier?.name || 'Supplier'},

Please find the purchase order details below:

PO Number: ${purchaseOrder.po_number}
Order Date: ${format(new Date(purchaseOrder.order_date), 'MMM dd, yyyy')}
Expected Delivery: ${purchaseOrder.expected_date ? format(new Date(purchaseOrder.expected_date), 'MMM dd, yyyy') : 'N/A'}

Total Amount: $${Number(purchaseOrder.total_amount).toFixed(2)}

Best regards,
${businessSettings?.business_name || 'Our Team'}`;

    window.location.href = `mailto:${supplierEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (!purchaseOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Purchase Order - {purchaseOrder.po_number}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              {purchaseOrder.supplier?.email && (
                <Button variant="outline" size="sm" onClick={handleEmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="space-y-6 p-4">
          {/* Business Header */}
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              {businessSettings?.logo_url && (
                <img 
                  src={businessSettings.logo_url} 
                  alt={businessSettings.business_name}
                  className="h-16 object-contain mb-2"
                />
              )}
              <h2 className="text-xl font-bold">{businessSettings?.business_name || 'Business Name'}</h2>
              {businessSettings?.address && <p className="text-sm text-muted-foreground">{businessSettings.address}</p>}
              {businessSettings?.city && <p className="text-sm text-muted-foreground">{businessSettings.city}, {businessSettings.country}</p>}
              {businessSettings?.phone && <p className="text-sm text-muted-foreground">Tel: {businessSettings.phone}</p>}
              {businessSettings?.email && <p className="text-sm text-muted-foreground">Email: {businessSettings.email}</p>}
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold text-primary">PURCHASE ORDER</h3>
              <p className="font-medium">{purchaseOrder.po_number}</p>
            </div>
          </div>

          {/* PO Details */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Supplier:</h4>
              <p className="font-medium">{purchaseOrder.supplier?.name || 'N/A'}</p>
              {purchaseOrder.supplier?.email && (
                <p className="text-sm text-muted-foreground">{purchaseOrder.supplier.email}</p>
              )}
              {purchaseOrder.supplier?.phone && (
                <p className="text-sm text-muted-foreground">{purchaseOrder.supplier.phone}</p>
              )}
            </div>
            <div className="text-right">
              <p><span className="font-semibold">Order Date:</span> {format(new Date(purchaseOrder.order_date), 'MMM dd, yyyy')}</p>
              {purchaseOrder.expected_date && (
                <p><span className="font-semibold">Expected:</span> {format(new Date(purchaseOrder.expected_date), 'MMM dd, yyyy')}</p>
              )}
              <p><span className="font-semibold">Status:</span> {purchaseOrder.status}</p>
              {purchaseOrder.created_by_name && (
                <p className="text-sm text-muted-foreground mt-2">Created by: {purchaseOrder.created_by_name}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrder.items?.map((item: any, index: number) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.product?.name || 'N/A'}</TableCell>
                  <TableCell>{item.product?.sku || '-'}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">${Number(item.unit_price).toFixed(2)}</TableCell>
                  <TableCell className="text-right">${Number(item.total_amount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Total */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${Number(purchaseOrder.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {purchaseOrder.notes && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Notes:</h4>
              <p className="text-sm text-muted-foreground">{purchaseOrder.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
