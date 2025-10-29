import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Tag, Award, Ruler, Receipt } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function ProductManagement() {
  const { currentOrganization } = useOrganization();
  const [activeTab, setActiveTab] = useState('categories');

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['product-categories', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization?.id,
  });

  const { data: brands, isLoading: loadingBrands } = useQuery({
    queryKey: ['product-brands', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from('product_brands')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization?.id,
  });

  const { data: units, isLoading: loadingUnits } = useQuery({
    queryKey: ['product-units', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from('product_units')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization?.id,
  });

  const { data: taxes, isLoading: loadingTaxes } = useQuery({
    queryKey: ['product-taxes', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from('product_taxes')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization?.id,
  });

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
          <p className="text-muted-foreground">
            Manage product categories, brands, units, and taxes
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
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

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product Categories</CardTitle>
                <Button>
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
                      {categories.map((cat) => (
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
                <Button>
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
                      {brands.map((brand) => (
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
                <Button>
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
                      {units.map((unit) => (
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
                <Button>
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
                      {taxes.map((tax) => (
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
      </div>
    </ProtectedRoute>
  );
}
