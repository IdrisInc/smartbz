import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Edit, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FooterLink {
  id: string;
  title: string;
  url: string;
  category: string;
  display_order: number;
  is_active: boolean;
}

export function FooterLinksTab() {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    category: 'general',
    display_order: 0,
    is_active: true,
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('footer_links')
        .select('*')
        .order('category')
        .order('display_order');

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.url) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingLink) {
        const { error } = await supabase
          .from('footer_links')
          .update(formData)
          .eq('id', editingLink.id);

        if (error) throw error;
        setLinks(prev => prev.map(l => l.id === editingLink.id ? { ...l, ...formData } : l));
      } else {
        const { data, error } = await supabase
          .from('footer_links')
          .insert(formData)
          .select()
          .single();

        if (error) throw error;
        setLinks(prev => [...prev, data]);
      }

      setIsDialogOpen(false);
      setEditingLink(null);
      setFormData({
        title: '',
        url: '',
        category: 'general',
        display_order: 0,
        is_active: true,
      });

      toast({
        title: "Success",
        description: editingLink ? "Link updated" : "Link added",
      });
    } catch (error) {
      console.error('Error saving link:', error);
      toast({
        title: "Error",
        description: "Failed to save link",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
      const { error } = await supabase
        .from('footer_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLinks(prev => prev.filter(l => l.id !== id));
      toast({ title: "Deleted", description: "Link deleted" });
    } catch (error) {
      console.error('Error deleting link:', error);
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const toggleActive = async (link: FooterLink) => {
    try {
      const { error } = await supabase
        .from('footer_links')
        .update({ is_active: !link.is_active })
        .eq('id', link.id);

      if (error) throw error;
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, is_active: !l.is_active } : l));
    } catch (error) {
      console.error('Error toggling link:', error);
    }
  };

  const openEditDialog = (link: FooterLink) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      category: link.category,
      display_order: link.display_order,
      is_active: link.is_active,
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Footer Links</h2>
          <p className="text-muted-foreground">Manage footer navigation links</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingLink(null);
            setFormData({
              title: '',
              url: '',
              category: 'general',
              display_order: 0,
              is_active: true,
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLink ? 'Edit Link' : 'Add New Link'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Link title"
                />
              </div>
              <div className="space-y-2">
                <Label>URL *</Label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="/page or https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
              <Button onClick={handleSubmit} disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingLink ? 'Update Link' : 'Add Link'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map(link => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">{link.title}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{link.url}</TableCell>
                  <TableCell className="capitalize">{link.category}</TableCell>
                  <TableCell>{link.display_order}</TableCell>
                  <TableCell>
                    <Switch
                      checked={link.is_active}
                      onCheckedChange={() => toggleActive(link)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(link)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteLink(link.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
