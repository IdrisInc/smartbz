
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Tag, Award, Ruler, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProductForm } from '@/components/Products/ProductForm';
import { CategoryDialog } from '@/components/Products/CategoryDialog';
import { BrandDialog } from '@/components/Products/BrandDialog';
import { UnitDialog } from '@/components/Products/UnitDialog';
import { TaxDialog } from '@/components/Products/TaxDialog';
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
  const [activeTab, setActiveTab] = useState('products');
  const [showForm, setShowForm] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showBrandDialog, setShowBrandDialog] = useState(false);
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [showTaxDialog, setShowTaxDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingTaxes, setLoadingTaxes] = useState(true);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  useEffect(() => {
    if (currentOrganization) {
      fetchProducts();
      fetchCategories();
      fetchBrands();
      fetchUnits();
      fetchTaxes();
    }
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

  const fetchCategories = async () => {
    if (!currentOrganization?.id) return;
    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchBrands = async () => {
    if (!currentOrganization?.id) return;
    setLoadingBrands(true);
    try {
      const { data, error } = await supabase
        .from('product_brands')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');
      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoadingBrands(false);
    }
  };

  const fetchUnits = async () => {
    if (!currentOrganization?.id) return;
    setLoadingUnits(true);
    try {
      const { data, error } = await supabase
        .from('product_units')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');
      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
    } finally {
      setLoadingUnits(false);
    }
  };

  const fetchTaxes = async () => {
    if (!currentOrganization?.id) return;
    setLoadingTaxes(true);
    try {
      const { data, error } = await supabase
        .from('product_taxes')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');
      if (error) throw error;
      setTaxes(data || []);
    } catch (error) {
      console.error('Error fetching taxes:', error);
    } finally {
      setLoadingTaxes(false);
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="products">
              <Search className="h-4 w-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Tag className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="brands">
              <Award className="h-4 w-4 mr-2" />
              Brands
            </TabsTrigger>
            <TabsTrigger value="units">
              <Ruler className="h-4 w-4 mr-2" />
              Units
            </TabsTrigger>
            <TabsTrigger value="taxes">
              <Receipt className="h-4 w-4 mr-2" />
              Taxes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product Categories</CardTitle>
                <Button onClick={() => setShowCategoryDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Category
                </Button>
              </CardHeader>
              <CardContent>
                {loadingCategories ? (
                  <div className="text-center py-8">Loading...</div>
                ) : !categories || categories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No categories found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((cat: any) => (
                        <TableRow key={cat.id}>
                          <TableCell className="font-medium">{cat.name}</TableCell>
                          <TableCell className="text-sm">{cat.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={cat.is_active ? 'default' : 'secondary'}>
                              {cat.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="brands" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product Brands</CardTitle>
                <Button onClick={() => setShowBrandDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Brand
                </Button>
              </CardHeader>
              <CardContent>
                {loadingBrands ? (
                  <div className="text-center py-8">Loading...</div>
                ) : !brands || brands.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No brands found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brands.map((brand: any) => (
                        <TableRow key={brand.id}>
                          <TableCell className="font-medium">{brand.name}</TableCell>
                          <TableCell className="text-sm">{brand.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={brand.is_active ? 'default' : 'secondary'}>
                              {brand.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="units" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product Units</CardTitle>
                <Button onClick={() => setShowUnitDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Unit
                </Button>
              </CardHeader>
              <CardContent>
                {loadingUnits ? (
                  <div className="text-center py-8">Loading...</div>
                ) : !units || units.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No units found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Short Name</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {units.map((unit: any) => (
                        <TableRow key={unit.id}>
                          <TableCell className="font-medium">{unit.name}</TableCell>
                          <TableCell>{unit.short_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={unit.is_active ? 'default' : 'secondary'}>
                              {unit.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="taxes" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product Taxes</CardTitle>
                <Button onClick={() => setShowTaxDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Tax
                </Button>
              </CardHeader>
              <CardContent>
                {loadingTaxes ? (
                  <div className="text-center py-8">Loading...</div>
                ) : !taxes || taxes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No taxes found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Rate (%)</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxes.map((tax: any) => (
                        <TableRow key={tax.id}>
                          <TableCell className="font-medium">{tax.name}</TableCell>
                          <TableCell>{Number(tax.rate).toFixed(2)}%</TableCell>
                          <TableCell>
                            <Badge variant={tax.is_active ? 'default' : 'secondary'}>
                              {tax.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {showForm && (
          <ProductForm onClose={() => { setShowForm(false); fetchProducts(); }} />
        )}

        <CategoryDialog
          open={showCategoryDialog}
          onOpenChange={setShowCategoryDialog}
          onSuccess={fetchCategories}
        />
        <BrandDialog
          open={showBrandDialog}
          onOpenChange={setShowBrandDialog}
          onSuccess={fetchBrands}
        />
        <UnitDialog
          open={showUnitDialog}
          onOpenChange={setShowUnitDialog}
          onSuccess={fetchUnits}
        />
        <TaxDialog
          open={showTaxDialog}
          onOpenChange={setShowTaxDialog}
          onSuccess={fetchTaxes}
        />
      </div>
    </ProtectedRoute>
  );
}
