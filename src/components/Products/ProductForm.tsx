
import React, { useState, useEffect } from 'react';
import { X, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { useSectorFeatures } from '@/hooks/useSectorFeatures';
import { CategoryDialog } from './CategoryDialog';
import { BrandDialog } from './BrandDialog';
import { UnitDialog } from './UnitDialog';
import { TaxDialog } from './TaxDialog';

interface ProductFormProps {
  onClose: () => void;
}

export function ProductForm({ onClose }: ProductFormProps) {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const { productCategories, getCustomFields, isSectorSpecific } = useSectorFeatures();
  const [product, setProduct] = useState({
    name: '',
    sku: '',
    category: '',
    type: 'product',
    price: '',
    cost: '',
    unit: 'piece',
    description: '',
    trackStock: true,
    minStock: '',
    maxStock: '',
    hasVariants: false,
    variants: [''],
    hasSerialNumbers: false
  });
  
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const customFields = getCustomFields();
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [showTaxDialog, setShowTaxDialog] = useState(false);
  
  useEffect(() => {
    if (currentOrganization?.id) {
      fetchCategories();
      fetchUnits();
      fetchTaxes();
    }
  }, [currentOrganization?.id]);
  
  const fetchCategories = async () => {
    const { data } = await supabase
      .from('product_categories')
      .select('*')
      .eq('organization_id', currentOrganization!.id)
      .eq('is_active', true)
      .order('name');
    setCategories(data || []);
  };
  
  const fetchUnits = async () => {
    const { data } = await supabase
      .from('product_units')
      .select('*')
      .eq('organization_id', currentOrganization!.id)
      .eq('is_active', true)
      .order('name');
    setUnits(data || []);
  };
  
  const fetchTaxes = async () => {
    const { data } = await supabase
      .from('product_taxes')
      .select('*')
      .eq('organization_id', currentOrganization!.id)
      .eq('is_active', true)
      .order('name');
    setTaxes(data || []);
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateSKU = () => {
    const prefix = product.type.toUpperCase().substring(0, 3);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setProduct({...product, sku: `${prefix}-${random}`});
  };

  const addVariant = () => {
    setProduct({...product, variants: [...product.variants, '']});
  };

  const updateVariant = (index: number, value: string) => {
    const newVariants = [...product.variants];
    newVariants[index] = value;
    setProduct({...product, variants: newVariants});
  };

  const removeVariant = (index: number) => {
    const newVariants = product.variants.filter((_, i) => i !== index);
    setProduct({...product, variants: newVariants});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentOrganization?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No organization selected",
      });
      return;
    }

    try {
      setUploading(true);
      let imageUrl = null;
      
      // Upload image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${currentOrganization.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }
      
      const productData = {
        organization_id: currentOrganization.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: parseFloat(product.price) || 0,
        cost: parseFloat(product.cost) || 0,
        unit: product.unit,
        description: product.description,
        stock_quantity: product.trackStock ? parseInt(product.minStock) || 0 : 0,
        min_stock_level: product.trackStock ? parseInt(product.minStock) || 0 : 0,
        image_url: imageUrl,
        is_active: true
      };

      const { error } = await supabase
        .from('products')
        .insert(productData);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create product",
        });
        console.error('Error creating product:', error);
      } else {
        toast({
          title: "Success",
          description: "Product created successfully",
        });
        onClose();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
      console.error('Error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Add New Product/Service</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={product.name}
                  onChange={(e) => setProduct({...product, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={product.type} onValueChange={(value) => setProduct({...product, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Physical Product</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="package">Package/Bundle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="flex gap-4 items-start">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload product image (JPG, PNG, WEBP)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <div className="flex gap-2">
                  <Input
                    id="sku"
                    value={product.sku}
                    onChange={(e) => setProduct({...product, sku: e.target.value})}
                  />
                  <Button type="button" variant="outline" onClick={generateSKU}>
                    Generate
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <div className="flex gap-2">
                  <Select value={product.category} onValueChange={(value) => setProduct({...product, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowCategoryDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <div className="flex gap-2">
                  <Select value={product.unit} onValueChange={(value) => setProduct({...product, unit: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.short_name || unit.name}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowUnitDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Selling Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={product.price}
                  onChange={(e) => setProduct({...product, price: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost Price</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={product.cost}
                  onChange={(e) => setProduct({...product, cost: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={product.description}
                onChange={(e) => setProduct({...product, description: e.target.value})}
              />
            </div>

            {product.type === 'product' && (
              <>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="trackStock"
                    checked={product.trackStock}
                    onCheckedChange={(checked) => setProduct({...product, trackStock: checked})}
                  />
                  <Label htmlFor="trackStock">Track Stock Levels</Label>
                </div>

                {product.trackStock && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minStock">Minimum Stock</Label>
                      <Input
                        id="minStock"
                        type="number"
                        value={product.minStock}
                        onChange={(e) => setProduct({...product, minStock: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxStock">Maximum Stock</Label>
                      <Input
                        id="maxStock"
                        type="number"
                        value={product.maxStock}
                        onChange={(e) => setProduct({...product, maxStock: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="hasSerialNumbers"
                    checked={product.hasSerialNumbers}
                    onCheckedChange={(checked) => setProduct({...product, hasSerialNumbers: checked})}
                  />
                  <Label htmlFor="hasSerialNumbers">Has Serial Numbers (Auto-generated)</Label>
                </div>
              </>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="hasVariants"
                checked={product.hasVariants}
                onCheckedChange={(checked) => setProduct({...product, hasVariants: checked})}
              />
              <Label htmlFor="hasVariants">Has Variants</Label>
            </div>

            {product.hasVariants && (
              <div className="space-y-2">
                <Label>Product Variants</Label>
                {product.variants.map((variant, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={variant}
                      onChange={(e) => updateVariant(index, e.target.value)}
                      placeholder="Variant name"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeVariant(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addVariant}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Variant
                </Button>
              </div>
            )}

            {/* Sector-specific custom fields */}
            {isSectorSpecific && customFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional {productCategories.find(c => c.id === product.category)?.name || 'Product'} Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customFields.map((field) => (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name}>
                        {field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      {field.type === 'select' && field.options ? (
                        <Select 
                          value={customFieldValues[field.name] || ''}
                          onValueChange={(value) => setCustomFieldValues(prev => ({ ...prev, [field.name]: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${field.name.replace(/_/g, ' ')}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={field.name}
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          value={customFieldValues[field.name] || ''}
                          onChange={(e) => setCustomFieldValues(prev => ({ 
                            ...prev, 
                            [field.name]: field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value 
                          }))}
                          placeholder={`Enter ${field.name.replace(/_/g, ' ')}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category-specific fields */}
            {isSectorSpecific && product.category && (
              <div className="space-y-4">
                {(() => {
                  const selectedCategory = productCategories.find(c => c.id === product.category);
                  if (!selectedCategory?.fields?.length) return null;
                  
                  return (
                    <>
                      <h3 className="text-lg font-semibold">{selectedCategory.name} Specific Fields</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedCategory.fields.map((field) => (
                          <div key={field.name} className="space-y-2">
                            <Label htmlFor={`category_${field.name}`}>
                              {field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Label>
                            {field.type === 'select' && field.options ? (
                              <Select 
                                value={customFieldValues[`category_${field.name}`] || ''}
                                onValueChange={(value) => setCustomFieldValues(prev => ({ ...prev, [`category_${field.name}`]: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select ${field.name.replace(/_/g, ' ')}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                id={`category_${field.name}`}
                                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                value={customFieldValues[`category_${field.name}`] || ''}
                                onChange={(e) => setCustomFieldValues(prev => ({ 
                                  ...prev, 
                                  [`category_${field.name}`]: field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value 
                                }))}
                                placeholder={`Enter ${field.name.replace(/_/g, ' ')}`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <CategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        onSuccess={() => {
          fetchCategories();
          setShowCategoryDialog(false);
        }}
      />
      <UnitDialog
        open={showUnitDialog}
        onOpenChange={setShowUnitDialog}
        onSuccess={() => {
          fetchUnits();
          setShowUnitDialog(false);
        }}
      />
      <TaxDialog
        open={showTaxDialog}
        onOpenChange={setShowTaxDialog}
        onSuccess={() => {
          fetchTaxes();
          setShowTaxDialog(false);
        }}
      />
    </div>
  );
}
