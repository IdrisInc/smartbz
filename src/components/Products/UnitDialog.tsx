import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

interface Unit {
  id: string;
  name: string;
  short_name: string | null;
  is_active: boolean;
}

interface UnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editUnit?: Unit | null;
}

export function UnitDialog({ open, onOpenChange, onSuccess, editUnit }: UnitDialogProps) {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      if (editUnit) {
        setFormData({
          name: editUnit.name,
          short_name: editUnit.short_name || '',
          is_active: editUnit.is_active,
        });
      } else {
        setFormData({ name: '', short_name: '', is_active: true });
      }
    }
  }, [open, editUnit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      if (editUnit) {
        const { error } = await supabase
          .from('product_units')
          .update({
            name: formData.name,
            short_name: formData.short_name || null,
            is_active: formData.is_active,
          })
          .eq('id', editUnit.id);
        if (error) throw error;
        toast({ title: "Success", description: "Unit updated successfully" });
      } else {
        const { error } = await supabase
          .from('product_units')
          .insert({
            organization_id: currentOrganization.id,
            name: formData.name,
            short_name: formData.short_name || null,
          });
        if (error) throw error;
        toast({ title: "Success", description: "Unit created successfully" });
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${editUnit ? 'update' : 'create'} unit`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Unit Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Kilogram, Meter, Piece"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="short_name">Short Name</Label>
            <Input
              id="short_name"
              placeholder="e.g., kg, m, pcs"
              value={formData.short_name}
              onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
            />
          </div>
          {editUnit && (
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
              {loading ? 'Saving...' : editUnit ? 'Save Changes' : 'Create Unit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
