import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2, UtensilsCrossed } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';

interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  prep_time_minutes: number | null;
  category_id: string | null;
  is_available: boolean;
}

export function MenuManager() {
  const { currentOrganization } = useOrganization();
  const { currentUser } = useCurrentUser();
  const displayName = currentUser?.displayName;
  const { toast } = useToast();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [catName, setCatName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', prep: '', category_id: '', is_available: true });

  const load = async () => {
    if (!currentOrganization?.id) return;
    setLoading(true);
    const [{ data: cats }, { data: its }] = await Promise.all([
      (supabase as any)
        .from('menu_categories')
        .select('id, name, sort_order')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .order('sort_order'),
      (supabase as any)
        .from('menu_items')
        .select('id, name, description, price, prep_time_minutes, category_id, is_available')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .order('name'),
    ]);
    setCategories((cats as MenuCategory[]) || []);
    setItems((its as MenuItem[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id]);

  const addCategory = async () => {
    if (!catName.trim() || !currentOrganization?.id) return;
    const { error } = await (supabase as any).from('menu_categories').insert({
      organization_id: currentOrganization.id,
      name: catName.trim(),
      sort_order: categories.length,
      created_by_name: displayName || null,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setCatName('');
    load();
  };

  const removeCategory = async (id: string) => {
    await (supabase as any).from('menu_categories').update({ is_active: false, updated_by_name: displayName || null }).eq('id', id);
    load();
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ name: '', description: '', price: '', prep: '', category_id: categories[0]?.id || '', is_available: true });
    setDialogOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price ?? ''),
      prep: item.prep_time_minutes ? String(item.prep_time_minutes) : '',
      category_id: item.category_id || '',
      is_available: item.is_available,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !currentOrganization?.id) {
      toast({ title: 'Food name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload: any = {
      organization_id: currentOrganization.id,
      name: form.name.trim(),
      description: form.description || null,
      price: Number(form.price) || 0,
      prep_time_minutes: form.prep ? Number(form.prep) : null,
      category_id: form.category_id || null,
      is_available: form.is_available,
      updated_by_name: displayName || null,
    };
    const { error } = editingId
      ? await (supabase as any).from('menu_items').update(payload).eq('id', editingId)
      : await (supabase as any).from('menu_items').insert({ ...payload, created_by_name: displayName || null });
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editingId ? 'Food updated' : 'Food added' });
    setDialogOpen(false);
    load();
  };

  const toggleAvailable = async (item: MenuItem) => {
    await (supabase as any)
      .from('menu_items')
      .update({ is_available: !item.is_available, updated_by_name: displayName || null })
      .eq('id', item.id);
    setItems(prev => prev.map(i => (i.id === item.id ? { ...i, is_available: !i.is_available } : i)));
  };

  const remove = async (item: MenuItem) => {
    await (supabase as any).from('menu_items').update({ is_active: false, updated_by_name: displayName || null }).eq('id', item.id);
    toast({ title: 'Food removed' });
    load();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Menu sections</CardTitle>
          <CardDescription>Group foods, e.g. Drinks, Starters, Main dishes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="New section name" />
            <Button onClick={addCategory}>
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <Badge key={c.id} variant="secondary" className="gap-2">
                {c.name}
                <button onClick={() => removeCategory(c.id)} aria-label={`Remove ${c.name}`}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </Badge>
            ))}
            {categories.length === 0 && <span className="text-sm text-muted-foreground">No sections yet</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" /> Foods &amp; drinks
            </CardTitle>
            <CardDescription>{items.length} item{items.length === 1 ? '' : 's'} on the menu</CardDescription>
          </div>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Add food
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No foods yet. Add your first item to start taking orders.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(item => (
                <div key={item.id} className="space-y-2 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {categories.find(c => c.id === item.category_id)?.name || 'Uncategorised'}
                        {item.prep_time_minutes ? ` · ${item.prep_time_minutes} min` : ''}
                      </div>
                    </div>
                    <div className="font-semibold">{Number(item.price).toLocaleString()}</div>
                  </div>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 items-center gap-2">
                      <Switch checked={item.is_available} onCheckedChange={() => toggleAvailable(item)} />
                      <span className="text-xs text-muted-foreground">{item.is_available ? 'Available' : 'Sold out'}</span>
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => remove(item)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit food' : 'Add food'}</DialogTitle>
            <DialogDescription>These items appear when taking table orders.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Chicken biryani" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price *</Label>
                <Input type="number" min={0} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Prep time (min)</Label>
                <Input type="number" min={0} value={form.prep} onChange={e => setForm({ ...form, prep: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a section" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_available} onCheckedChange={v => setForm({ ...form, is_available: v })} />
              <span className="text-sm">Available today</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Save changes' : 'Add food'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
