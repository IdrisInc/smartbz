
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface ContactFormProps {
  onClose: () => void;
  onSave?: () => void;
  contact?: any;
}

export function ContactForm({ onClose, onSave, contact }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    city: contact?.city || '',
    country: contact?.country || '',
    contact_type: contact?.contact_type || 'customer',
    address: contact?.address || '',
    notes: contact?.notes || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization?.id || !formData.name) return;

    setIsLoading(true);

    try {
      const contactData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        city: formData.city || null,
        country: formData.country || null,
        contact_type: formData.contact_type,
        address: formData.address || null,
        notes: formData.notes || null,
        organization_id: currentOrganization.id
      };

      if (contact) {
        const { error } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', contact.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contacts')
          .insert(contactData);
        
        if (error) throw error;
      }
      
      toast({
        title: contact ? "Contact updated" : "Contact created",
        description: "Contact has been saved successfully.",
      });
      
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save contact. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
          <DialogDescription>
            {contact ? 'Update contact information' : 'Create a new contact for your business'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_type">Contact Type</Label>
            <Select value={formData.contact_type} onValueChange={(value) => handleChange('contact_type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (contact ? 'Update Contact' : 'Create Contact')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
