import React, { useState, useEffect } from 'react';
import { X, Plus, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
}

interface ProductEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess: () => void;
}

export function ProductEditDialog({ open, onOpenChange, product, onSuccess }: ProductEditDialogProps) {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    brand_id: '',
    price: '',
    cost: '',
    unit: 'piece',
    description: '',
    min_stock_level: '',
    is_active: true,
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (open && currentOrganization?.id) {
      fetchCategories();
      fetchBrands();
      fetchUnits();
    }
  }, [open, currentOrganization?.id]);
  
  useEffect(() => {
    if (product && open) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || '',
        brand_id: product.brand_id || '',
        price: product.price?.toString() || '',
        cost: product.cost?.toString() || '',
        unit: product.unit || 'piece',
        description: product.description || '',
        min_stock_level: product.min_stock_level?.toString() || '',
        is_active: product.is_active,
      });
      setImagePreview(product.image_url);
      setImageFile(null);
    }
  }, [product, open]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('product_categories')
      .select('*')
      .eq('organization_id', currentOrganization!.id)
      .eq('is_active', true)
      .order('name');
    setCategories(data || []);
  };

  const fetchBrands = async () => {
    const { data } = await supabase
      .from('product_brands')
      .select('*')
      .eq('organization_id', currentOrganization!.id)
      .eq('is_active', true)
      .order('name');
    setBrands(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization?.id || !product) return;

    setLoading(true);
    try {
      let imageUrl = product.image_url;
      
      // Upload new image if selected
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
      
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          sku: formData.sku || null,
          category: formData.category || null,
          brand_id: formData.brand_id || null,
          price: parseFloat(formData.price) || 0,
          cost: parseFloat(formData.cost) || 0,
          unit: formData.unit,
          description: formData.description || null,
          min_stock_level: parseInt(formData.min_stock_level) || 0,
          is_active: formData.is_active,
          image_url: imageUrl,
        })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update product",
      });
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="flex gap-4 items-start">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
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
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Select value={formData.brand_id} onValueChange={(value) => setFormData({ ...formData, brand_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
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
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Selling Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost Price</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Min Stock Level</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
