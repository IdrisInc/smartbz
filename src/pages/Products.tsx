import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Tag, Award, Ruler, Receipt, Eye, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
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
import { ProductViewDialog } from '@/components/Products/ProductViewDialog';
import { ProductEditDialog } from '@/components/Products/ProductEditDialog';
import { DeleteConfirmDialog } from '@/components/Products/DeleteConfirmDialog';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

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
  brand_id: string | null;
  brand?: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface Brand {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface Unit {
  id: string;
  name: string;
  short_name: string | null;
  is_active: boolean;
}

interface Tax {
  id: string;
  name: string;
  rate: number;
  is_active: boolean;
}

export default function Products() {
  const [activeTab, setActiveTab] = useState('products');
  const [showForm, setShowForm] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showBrandDialog, setShowBrandDialog] = useState(false);
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [showTaxDialog, setShowTaxDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingTaxes, setLoadingTaxes] = useState(true);
  
  // Edit/View states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editBrand, setEditBrand] = useState<Brand | null>(null);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [editTax, setEditTax] = useState<Tax | null>(null);
  
  // Delete states
  const [deleteItem, setDeleteItem] = useState<{ type: string; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  
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
        .select('*, brand:product_brands(id, name)')
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

  const handleDelete = async () => {
    if (!deleteItem) return;
    
    setDeleting(true);
    try {
      let tableName: 'products' | 'product_categories' | 'product_brands' | 'product_units' | 'product_taxes';
      switch (deleteItem.type) {
        case 'product':
          tableName = 'products';
          break;
        case 'category':
          tableName = 'product_categories';
          break;
        case 'brand':
          tableName = 'product_brands';
          break;
        case 'unit':
          tableName = 'product_units';
          break;
        case 'tax':
          tableName = 'product_taxes';
          break;
        default:
          tableName = 'products';
      }
      
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from(tableName)
        .update({ is_active: false })
        .eq('id', deleteItem.id);
      
      toast({
        title: "Success",
        description: `${deleteItem.type.charAt(0).toUpperCase() + deleteItem.type.slice(1)} deleted successfully`,
      });
      
      // Refresh the appropriate data
      switch (deleteItem.type) {
        case 'product':
          fetchProducts();
          break;
        case 'category':
          fetchCategories();
          break;
        case 'brand':
          fetchBrands();
          break;
        case 'unit':
          fetchUnits();
          break;
        case 'tax':
          fetchTaxes();
          break;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete ${deleteItem.type}`,
      });
    } finally {
      setDeleting(false);
      setDeleteItem(null);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ActionButtons = ({ onView, onEdit, onDelete }: { onView: () => void; onEdit: () => void; onDelete: () => void }) => (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" onClick={onView} title="View">
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onEdit} title="Edit">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} title="Delete" className="text-destructive hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
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
          <TabsList className="flex-wrap h-auto">
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

          {/* Products Tab */}
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
              <div className="text-center py-8">Loading products...</div>
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
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
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
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-muted-foreground">{product.sku || '-'}</TableCell>
                          <TableCell>
                            {product.category ? (
                              <Badge variant="secondary">{product.category}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {product.brand ? (
                              <Badge variant="outline">{product.brand.name}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">${Number(product.price || 0).toFixed(2)}</TableCell>
                          <TableCell className={`text-right ${(product.stock_quantity || 0) < (product.min_stock_level || 0) ? 'text-destructive' : ''}`}>
                            {product.stock_quantity || 0}
                          </TableCell>
                          <TableCell className="text-right">
                            <ActionButtons
                              onView={() => { setSelectedProduct(product); setShowViewDialog(true); }}
                              onEdit={() => { setSelectedProduct(product); setShowEditDialog(true); }}
                              onDelete={() => setDeleteItem({ type: 'product', id: product.id, name: product.name })}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product Categories</CardTitle>
                <Button onClick={() => { setEditCategory(null); setShowCategoryDialog(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Category
                </Button>
              </CardHeader>
              <CardContent>
                {loadingCategories ? (
                  <div className="text-center py-8">Loading...</div>
                ) : categories.filter(c => c.is_active).length === 0 ? (
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
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.filter(c => c.is_active).map((cat) => (
                        <TableRow key={cat.id}>
                          <TableCell className="font-medium">{cat.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{cat.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={cat.is_active ? 'default' : 'secondary'}>
                              {cat.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <ActionButtons
                              onView={() => { setEditCategory(cat); setShowCategoryDialog(true); }}
                              onEdit={() => { setEditCategory(cat); setShowCategoryDialog(true); }}
                              onDelete={() => setDeleteItem({ type: 'category', id: cat.id, name: cat.name })}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brands Tab */}
          <TabsContent value="brands" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product Brands</CardTitle>
                <Button onClick={() => { setEditBrand(null); setShowBrandDialog(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Brand
                </Button>
              </CardHeader>
              <CardContent>
                {loadingBrands ? (
                  <div className="text-center py-8">Loading...</div>
                ) : brands.filter(b => b.is_active).length === 0 ? (
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
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brands.filter(b => b.is_active).map((brand) => (
                        <TableRow key={brand.id}>
                          <TableCell className="font-medium">{brand.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{brand.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={brand.is_active ? 'default' : 'secondary'}>
                              {brand.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <ActionButtons
                              onView={() => { setEditBrand(brand); setShowBrandDialog(true); }}
                              onEdit={() => { setEditBrand(brand); setShowBrandDialog(true); }}
                              onDelete={() => setDeleteItem({ type: 'brand', id: brand.id, name: brand.name })}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Units Tab */}
          <TabsContent value="units" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product Units</CardTitle>
                <Button onClick={() => { setEditUnit(null); setShowUnitDialog(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Unit
                </Button>
              </CardHeader>
              <CardContent>
                {loadingUnits ? (
                  <div className="text-center py-8">Loading...</div>
                ) : units.filter(u => u.is_active).length === 0 ? (
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
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {units.filter(u => u.is_active).map((unit) => (
                        <TableRow key={unit.id}>
                          <TableCell className="font-medium">{unit.name}</TableCell>
                          <TableCell>{unit.short_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={unit.is_active ? 'default' : 'secondary'}>
                              {unit.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <ActionButtons
                              onView={() => { setEditUnit(unit); setShowUnitDialog(true); }}
                              onEdit={() => { setEditUnit(unit); setShowUnitDialog(true); }}
                              onDelete={() => setDeleteItem({ type: 'unit', id: unit.id, name: unit.name })}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Taxes Tab */}
          <TabsContent value="taxes" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product Taxes</CardTitle>
                <Button onClick={() => { setEditTax(null); setShowTaxDialog(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Tax
                </Button>
              </CardHeader>
              <CardContent>
                {loadingTaxes ? (
                  <div className="text-center py-8">Loading...</div>
                ) : taxes.filter(t => t.is_active).length === 0 ? (
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
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxes.filter(t => t.is_active).map((tax) => (
                        <TableRow key={tax.id}>
                          <TableCell className="font-medium">{tax.name}</TableCell>
                          <TableCell>{Number(tax.rate).toFixed(2)}%</TableCell>
                          <TableCell>
                            <Badge variant={tax.is_active ? 'default' : 'secondary'}>
                              {tax.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <ActionButtons
                              onView={() => { setEditTax(tax); setShowTaxDialog(true); }}
                              onEdit={() => { setEditTax(tax); setShowTaxDialog(true); }}
                              onDelete={() => setDeleteItem({ type: 'tax', id: tax.id, name: tax.name })}
                            />
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

        {/* Product Form Modal */}
        {showForm && (
          <ProductForm onClose={() => { setShowForm(false); fetchProducts(); }} />
        )}

        {/* Product View Dialog */}
        <ProductViewDialog
          open={showViewDialog}
          onOpenChange={setShowViewDialog}
          product={selectedProduct}
        />

        {/* Product Edit Dialog */}
        <ProductEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          product={selectedProduct}
          onSuccess={() => { fetchProducts(); setShowEditDialog(false); }}
        />

        {/* Category Dialog */}
        <CategoryDialog
          open={showCategoryDialog}
          onOpenChange={setShowCategoryDialog}
          onSuccess={fetchCategories}
          editCategory={editCategory}
        />

        {/* Brand Dialog */}
        <BrandDialog
          open={showBrandDialog}
          onOpenChange={setShowBrandDialog}
          onSuccess={fetchBrands}
          editBrand={editBrand}
        />

        {/* Unit Dialog */}
        <UnitDialog
          open={showUnitDialog}
          onOpenChange={setShowUnitDialog}
          onSuccess={fetchUnits}
          editUnit={editUnit}
        />

        {/* Tax Dialog */}
        <TaxDialog
          open={showTaxDialog}
          onOpenChange={setShowTaxDialog}
          onSuccess={fetchTaxes}
          editTax={editTax}
        />

        {/* Delete Confirm Dialog */}
        <DeleteConfirmDialog
          open={!!deleteItem}
          onOpenChange={(open) => !open && setDeleteItem(null)}
          onConfirm={handleDelete}
          title={`Delete ${deleteItem?.type || 'item'}`}
          description={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
          loading={deleting}
        />
      </div>
    </ProtectedRoute>
  );
}
