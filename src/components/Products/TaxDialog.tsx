import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

interface Tax {
  id: string;
  name: string;
  rate: number;
  is_active: boolean;
}

interface TaxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editTax?: Tax | null;
}

export function TaxDialog({ open, onOpenChange, onSuccess, editTax }: TaxDialogProps) {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      if (editTax) {
        setFormData({
          name: editTax.name,
          rate: editTax.rate.toString(),
          is_active: editTax.is_active,
        });
      } else {
        setFormData({ name: '', rate: '', is_active: true });
      }
    }
  }, [open, editTax]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      if (editTax) {
        const { error } = await supabase
          .from('product_taxes')
          .update({
            name: formData.name,
            rate: parseFloat(formData.rate),
            is_active: formData.is_active,
          })
          .eq('id', editTax.id);
        if (error) throw error;
        toast({ title: "Success", description: "Tax updated successfully" });
      } else {
        const { error } = await supabase
          .from('product_taxes')
          .insert({
            organization_id: currentOrganization.id,
            name: formData.name,
            rate: parseFloat(formData.rate),
          });
        if (error) throw error;
        toast({ title: "Success", description: "Tax created successfully" });
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${editTax ? 'update' : 'create'} tax`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editTax ? 'Edit Tax' : 'Add New Tax'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tax Name *</Label>
            <Input
              id="name"
              placeholder="e.g., VAT, Sales Tax, GST"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">Rate (%) *</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              placeholder="e.g., 15.00"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              required
            />
          </div>
          {editTax && (
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editTax ? 'Save Changes' : 'Create Tax'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
