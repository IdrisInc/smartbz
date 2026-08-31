import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Utensils, Pencil, Trash2, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface RestaurantTable {
  id: string;
  name: string;
  capacity: number;
  area: string | null;
  status: string;
  notes: string | null;
  is_active: boolean;
}

const STATUSES = [
  { value: 'free', label: 'Free' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'cleaning', label: 'Cleaning' },
];

const statusVariant = (status: string) =>
  status === 'free' ? 'secondary' : status === 'occupied' ? 'default' : 'outline';

export default function Restaurant() {
  const { currentOrganization } = useOrganization();
  const { currentUser } = useCurrentUser();
  const displayName = currentUser?.displayName;
  const { toast } = useToast();
  const navigate = useNavigate();

  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', capacity: '4', area: '', status: 'free', notes: '' });

  const load = async () => {
    if (!currentOrganization?.id) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('restaurant_tables')
      .select('id, name, capacity, area, status, notes, is_active')
      .eq('organization_id', currentOrganization.id)
      .eq('is_active', true)
      .order('name');
    if (error) {
      toast({ title: 'Error', description: 'Failed to load tables', variant: 'destructive' });
    } else {
      setTables((data as RestaurantTable[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id]);

  const openNew = () => {
    setEditingId(null);
    setForm({ name: '', capacity: '4', area: '', status: 'free', notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (t: RestaurantTable) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      capacity: String(t.capacity ?? 4),
      area: t.area || '',
      status: t.status,
      notes: t.notes || '',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !currentOrganization?.id) {
      toast({ title: 'Table name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload: any = {
      organization_id: currentOrganization.id,
      name: form.name.trim(),
      capacity: Number(form.capacity) || 1,
      area: form.area || null,
      status: form.status,
      notes: form.notes || null,
      updated_by_name: displayName || null,
    };
    const { error } = editingId
      ? await (supabase as any).from('restaurant_tables').update(payload).eq('id', editingId)
      : await (supabase as any)
          .from('restaurant_tables')
          .insert({ ...payload, created_by_name: displayName || null });
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editingId ? 'Table updated' : 'Table added' });
    setDialogOpen(false);
    load();
  };

  const changeStatus = async (table: RestaurantTable, status: string) => {
    const { error } = await (supabase as any)
      .from('restaurant_tables')
      .update({ status, updated_by_name: displayName || null })
      .eq('id', table.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setTables(prev => prev.map(t => (t.id === table.id ? { ...t, status } : t)));
  };

  const remove = async (table: RestaurantTable) => {
    const { error } = await (supabase as any)
      .from('restaurant_tables')
      .update({ is_active: false, updated_by_name: displayName || null })
      .eq('id', table.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Table removed' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Utensils className="h-7 w-7" /> Restaurant
          </h1>
          <p className="text-muted-foreground">Manage dining tables, sections and their live status</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Table
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Floor Plan</CardTitle>
          <CardDescription>
            {tables.length} table{tables.length === 1 ? '' : 's'} ·{' '}
            {tables.filter(t => t.status === 'free').length} free
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : tables.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No tables yet. Add your first table to start taking orders.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tables.map(table => (
                <div key={table.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{table.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {table.capacity} seats{table.area ? ` · ${table.area}` : ''}
                      </div>
                    </div>
                    <Badge variant={statusVariant(table.status) as any}>
                      {STATUSES.find(s => s.value === table.status)?.label || table.status}
                    </Badge>
                  </div>
                  {table.notes && <p className="text-xs text-muted-foreground">{table.notes}</p>}
                  <div className="flex items-center gap-2">
                    <Select value={table.status} onValueChange={v => changeStatus(table, v)}>
                      <SelectTrigger className="h-8 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() => navigate(`/dashboard/sales?pos=1&table=${table.id}`)}
                    >
                      <ShoppingCart className="mr-1 h-4 w-4" /> Order
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(table)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => remove(table)}>
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
            <DialogTitle>{editingId ? 'Edit Table' : 'Add Table'}</DialogTitle>
            <DialogDescription>Tables are used to track dine-in orders.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Table name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Table 1" />
              </div>
              <div className="space-y-2">
                <Label>Seats</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={e => setForm({ ...form, capacity: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Section / Area</Label>
                <Input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="Terrace" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Save Changes' : 'Add Table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
