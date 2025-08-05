
import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductForm } from '@/components/Products/ProductForm';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';

const mockProducts = [
  {
    id: 1,
    name: 'iPhone 15 Pro',
    sku: 'IPH15P-001',
    category: 'Electronics',
    price: 999.99,
    stock: 25,
    unit: 'piece',
    status: 'active',
    variants: ['Space Black', 'White Titanium', 'Blue Titanium']
  },
  {
    id: 2,
    name: 'Consultation Service',
    sku: 'CONS-001',
    category: 'Services',
    price: 150.00,
    stock: null,
    unit: 'hour',
    status: 'active',
    variants: []
  },
  {
    id: 3,
    name: 'Office Bundle',
    sku: 'BUNDLE-001',
    category: 'Packages',
    price: 299.99,
    stock: 10,
    unit: 'package',
    status: 'active',
    variants: ['Basic', 'Premium']
  }
];

export default function Products() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <ProtectedRoute requiredPermissions={['canManageProducts']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Products & Services</h2>
            <p className="text-muted-foreground">
              Manage your products, services, and packages
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockProducts.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>{product.sku}</CardDescription>
                  </div>
                  <Badge variant="secondary">{product.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Price:</span>
                    <span className="font-medium">${product.price}</span>
                  </div>
                  {product.stock !== null && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Stock:</span>
                      <span className={`font-medium ${product.stock < 10 ? 'text-destructive' : ''}`}>
                        {product.stock} {product.unit}(s)
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Unit:</span>
                    <span className="font-medium">{product.unit}</span>
                  </div>
                  {product.variants.length > 0 && (
                    <div className="pt-2">
                      <span className="text-sm text-muted-foreground">Variants:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.variants.map((variant) => (
                          <Badge key={variant} variant="outline" className="text-xs">
                            {variant}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {showForm && (
          <ProductForm onClose={() => setShowForm(false)} />
        )}
      </div>
    </ProtectedRoute>
  );
}
