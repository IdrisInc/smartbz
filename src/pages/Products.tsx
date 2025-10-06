
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductForm } from '@/components/Products/ProductForm';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock_quantity: number;
  unit: string;
  is_active: boolean;
  description?: string;
}

export default function Products() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, [currentOrganization]);

  const fetchProducts = async () => {
    if (!currentOrganization?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true);
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch products",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute requiredPermissions={['canManageProducts']}>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Products & Services</h2>
            <p className="text-sm text-muted-foreground">
              Manage your products, services, and packages
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground">No products found</p>
              <Button onClick={() => setShowForm(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add your first product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
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
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Stock:</span>
                      <span className={`font-medium ${product.stock_quantity < 10 ? 'text-destructive' : ''}`}>
                        {product.stock_quantity} {product.unit}(s)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Unit:</span>
                      <span className="font-medium">{product.unit}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showForm && (
          <ProductForm onClose={() => { setShowForm(false); fetchProducts(); }} />
        )}
      </div>
    </ProtectedRoute>
  );
}
