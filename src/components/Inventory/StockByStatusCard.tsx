import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Search, Package, AlertTriangle, Ban, RotateCcw, Trash2, Settings2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { stockStatusLabels, StockStatusType, StockStatusBadge } from './StockStatusBadge';
import { StockAdjustmentDialog } from './StockAdjustmentDialog';

interface ProductStock {
  id: string;
  name: string;
  sku: string | null;
  image_url: string | null;
  available: number;
  reserved: number;
  damaged: number;
  returned_qc: number;
  scrap: number;
  total: number;
}

const statusIcons: Record<StockStatusType, React.ReactNode> = {
  available: <Package className="h-4 w-4 text-green-600" />,
  reserved: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
  damaged: <Ban className="h-4 w-4 text-red-600" />,
  returned_qc: <RotateCcw className="h-4 w-4 text-blue-600" />,
  scrap: <Trash2 className="h-4 w-4 text-gray-600" />,
};

export function StockByStatusCard() {
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string; sku?: string | null } | null>(null);
  const [showAdjustment, setShowAdjustment] = useState(false);
  
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchStockByStatus();
    }
  }, [currentOrganization?.id]);

  const fetchStockByStatus = async () => {
    if (!currentOrganization?.id) return;
    
    setLoading(true);
    try {
      // Get products with their stock by status
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, image_url, stock_quantity, defective_quantity')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Get stock by status
      const { data: stockData, error: stockError } = await supabase
        .from('product_stock')
        .select('product_id, status, quantity')
        .eq('organization_id', currentOrganization.id);

      if (stockError) throw stockError;

      // Map stock data to products
      const stockByProduct = new Map<string, Record<StockStatusType, number>>();
      stockData?.forEach((item) => {
        if (!stockByProduct.has(item.product_id)) {
          stockByProduct.set(item.product_id, {
            available: 0,
            reserved: 0,
            damaged: 0,
            returned_qc: 0,
            scrap: 0,
          });
        }
        const productStock = stockByProduct.get(item.product_id)!;
        if (item.status in productStock) {
          productStock[item.status as StockStatusType] = item.quantity;
        }
      });

      const mappedProducts: ProductStock[] = (productsData || []).map((product) => {
        const stock = stockByProduct.get(product.id) || {
          available: product.stock_quantity || 0,
          reserved: 0,
          damaged: product.defective_quantity || 0,
          returned_qc: 0,
          scrap: 0,
        };

        // If no stock records exist, use legacy columns
        if (!stockByProduct.has(product.id)) {
          stock.available = product.stock_quantity || 0;
          stock.damaged = product.defective_quantity || 0;
        }

        const total = stock.available + stock.reserved + stock.damaged + stock.returned_qc + stock.scrap;

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          image_url: product.image_url,
          ...stock,
          total,
        };
      });

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error fetching stock by status:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const totals = filteredProducts.reduce(
    (acc, p) => ({
      available: acc.available + p.available,
      reserved: acc.reserved + p.reserved,
      damaged: acc.damaged + p.damaged,
      returned_qc: acc.returned_qc + p.returned_qc,
      scrap: acc.scrap + p.scrap,
      total: acc.total + p.total,
    }),
    { available: 0, reserved: 0, damaged: 0, returned_qc: 0, scrap: 0, total: 0 }
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Stock by Status</CardTitle>
              <CardDescription>
                Track inventory quantities across all stock statuses
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {(Object.keys(stockStatusLabels) as StockStatusType[]).map((status) => (
              <div key={status} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  {statusIcons[status]}
                  <span className="text-xs font-medium text-muted-foreground">{stockStatusLabels[status]}</span>
                </div>
                <p className="text-2xl font-bold">{totals[status].toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Products Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No products found
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">{statusIcons.available} Available</TableHead>
                    <TableHead className="text-right">{statusIcons.reserved} Reserved</TableHead>
                    <TableHead className="text-right">{statusIcons.damaged} Damaged</TableHead>
                    <TableHead className="text-right">{statusIcons.returned_qc} QC</TableHead>
                    <TableHead className="text-right">{statusIcons.scrap} Scrap</TableHead>
                    <TableHead className="text-right font-bold">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.sku && (
                            <div className="text-xs text-muted-foreground">{product.sku}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {product.available}
                      </TableCell>
                      <TableCell className="text-right text-yellow-600">
                        {product.reserved || '-'}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {product.damaged || '-'}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {product.returned_qc || '-'}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {product.scrap || '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {product.total}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProduct({ id: product.id, name: product.name, sku: product.sku });
                            setShowAdjustment(true);
                          }}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <StockAdjustmentDialog
        open={showAdjustment}
        onOpenChange={setShowAdjustment}
        product={selectedProduct}
        onSuccess={fetchStockByStatus}
      />
    </>
  );
}
