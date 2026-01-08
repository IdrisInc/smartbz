import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Edit, Eye, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OnboardingContent {
  id: string;
  content_key: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
}

export function OnboardingContentTab() {
  const [contents, setContents] = useState<OnboardingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<OnboardingContent | null>(null);
  const [formData, setFormData] = useState({
    content_key: '',
    title: '',
    subtitle: '',
    content: '',
    image_url: '',
    display_order: 0,
    is_active: true,
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('onboarding_content')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Error fetching onboarding content:', error);
      toast({
        title: "Error",
        description: "Failed to load onboarding content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.content_key) {
      toast({ title: "Error", description: "Content key is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editingContent) {
        const { error } = await supabase
          .from('onboarding_content')
          .update(formData)
          .eq('id', editingContent.id);

        if (error) throw error;
        setContents(prev => prev.map(c => c.id === editingContent.id ? { ...c, ...formData } : c));
      } else {
        const { data, error } = await supabase
          .from('onboarding_content')
          .insert(formData)
          .select()
          .single();

        if (error) throw error;
        setContents(prev => [...prev, data]);
      }

      setIsDialogOpen(false);
      setEditingContent(null);
      resetForm();
      toast({ title: "Success", description: editingContent ? "Content updated" : "Content added" });
    } catch (error) {
      console.error('Error saving content:', error);
      toast({ title: "Error", description: "Failed to save content", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteContent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const { error } = await supabase
        .from('onboarding_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setContents(prev => prev.filter(c => c.id !== id));
      toast({ title: "Deleted", description: "Content deleted" });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const toggleActive = async (content: OnboardingContent) => {
    try {
      const { error } = await supabase
        .from('onboarding_content')
        .update({ is_active: !content.is_active })
        .eq('id', content.id);

      if (error) throw error;
      setContents(prev => prev.map(c => c.id === content.id ? { ...c, is_active: !c.is_active } : c));
    } catch (error) {
      console.error('Error toggling content:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      content_key: '',
      title: '',
      subtitle: '',
      content: '',
      image_url: '',
      display_order: 0,
      is_active: true,
    });
  };

  const openEditDialog = (content: OnboardingContent) => {
    setEditingContent(content);
    setFormData({
      content_key: content.content_key,
      title: content.title || '',
      subtitle: content.subtitle || '',
      content: content.content || '',
      image_url: content.image_url || '',
      display_order: content.display_order,
      is_active: content.is_active,
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Onboarding Content</h2>
          <p className="text-muted-foreground">
            Manage the content displayed on the onboarding landing page
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingContent(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingContent ? 'Edit Content' : 'Add New Content'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Content Key *</Label>
                <Input
                  value={formData.content_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, content_key: e.target.value }))}
                  placeholder="e.g., hero, features_intro, cta"
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier used in the code (hero, features_intro, sectors_intro, cta)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Main heading text"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Secondary heading text"
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Main content/description text"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-center justify-between pt-6">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingContent ? 'Update Content' : 'Add Content'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content Preview Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {contents.filter(c => c.is_active).map(content => (
          <Card key={content.id} className={!content.is_active ? 'opacity-50' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <code className="text-xs bg-muted px-2 py-1 rounded">{content.content_key}</code>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(content)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {content.title && <h4 className="font-semibold">{content.title}</h4>}
              {content.subtitle && <p className="text-sm text-muted-foreground">{content.subtitle}</p>}
              {content.content && (
                <p className="text-sm mt-2 line-clamp-2">{content.content}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Content Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents.map(content => (
                <TableRow key={content.id}>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{content.content_key}</code>
                  </TableCell>
                  <TableCell className="font-medium">{content.title || '-'}</TableCell>
                  <TableCell>{content.display_order}</TableCell>
                  <TableCell>
                    <Switch
                      checked={content.is_active}
                      onCheckedChange={() => toggleActive(content)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(content)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteContent(content.id)}>
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
