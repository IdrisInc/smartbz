import React from 'react';
import { X, Package, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  price: number | null;
  cost: number | null;
  stock_quantity: number | null;
  min_stock_level: number | null;
  unit: string | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  brand?: { id: string; name: string } | null;
}

interface ProductViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function ProductViewDialog({ open, onOpenChange, product }: ProductViewDialogProps) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="flex flex-col items-center">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full max-w-[250px] h-auto aspect-square object-cover rounded-lg border"
              />
            ) : (
              <div className="w-full max-w-[250px] aspect-square border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                <ImageIcon className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.sku || 'No SKU'}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {product.category && (
                <Badge variant="secondary">{product.category}</Badge>
              )}
              {product.brand && (
                <Badge variant="outline">{product.brand.name}</Badge>
              )}
              <Badge variant={product.is_active ? 'default' : 'destructive'}>
                {product.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground">Selling Price</span>
                <p className="font-semibold text-lg">${Number(product.price || 0).toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Cost Price</span>
                <p className="font-medium">${Number(product.cost || 0).toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Stock</span>
                <p className={`font-medium ${(product.stock_quantity || 0) < (product.min_stock_level || 0) ? 'text-destructive' : ''}`}>
                  {product.stock_quantity || 0} {product.unit}(s)
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Min Stock Level</span>
                <p className="font-medium">{product.min_stock_level || 0}</p>
              </div>
            </div>
            
            {product.description && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Description</span>
                <p className="text-sm">{product.description}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
