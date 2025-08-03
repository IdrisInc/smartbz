import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrganization } from '@/contexts/OrganizationContext';

const businessSectors = [
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'construction', label: 'Construction' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'non_profit', label: 'Non-Profit' },
  { value: 'other', label: 'Other' },
];

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationDialog({ open, onOpenChange }: CreateOrganizationDialogProps) {
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { createOrganization } = useOrganization();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sector) return;

    setLoading(true);
    try {
      const newOrg = await createOrganization(name.trim(), sector, description.trim() || undefined);
      if (newOrg) {
        setName('');
        setSector('');
        setDescription('');
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Set up a new organization to manage your business operations.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter organization name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sector">Business Sector</Label>
              <Select value={sector} onValueChange={setSector} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select business sector" />
                </SelectTrigger>
                <SelectContent>
                  {businessSectors.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your organization"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim() || !sector}>
              {loading ? 'Creating...' : 'Create Organization'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}