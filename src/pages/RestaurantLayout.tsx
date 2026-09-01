import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, MapPin, Plus, Trash2, LayoutGrid } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';
import { FloorPlanView, FloorPlanTable } from '@/components/Restaurant/FloorPlanView';

interface FloorPlan {
  id: string;
  name: string;
  image_url: string | null;
}

interface LayoutTable extends FloorPlanTable {
  floor_plan_id: string | null;
}

export default function RestaurantLayout() {
  const { currentOrganization } = useOrganization();
  const { currentUser } = useCurrentUser();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [plans, setPlans] = useState<FloorPlan[]>([]);
  const [planId, setPlanId] = useState<string>('');
  const [tables, setTables] = useState<LayoutTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [placingTableId, setPlacingTableId] = useState<string>('');

  const activePlan = plans.find(p => p.id === planId) || null;

  const load = async () => {
    if (!currentOrganization?.id) return;
    setLoading(true);
    const [{ data: planData }, { data: tableData }] = await Promise.all([
      (supabase as any)
        .from('restaurant_floor_plans')
        .select('id, name, image_url')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .order('created_at'),
      (supabase as any)
        .from('restaurant_tables')
        .select('id, name, capacity, area, status, pos_x, pos_y, floor_plan_id')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .order('name'),
    ]);
    setPlans((planData as FloorPlan[]) || []);
    setTables((tableData as LayoutTable[]) || []);
    if (!planId && planData?.length) setPlanId(planData[0].id);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id]);

  const createPlan = async () => {
    if (!newPlanName.trim() || !currentOrganization?.id) return;
    const { data, error } = await (supabase as any)
      .from('restaurant_floor_plans')
      .insert({
        organization_id: currentOrganization.id,
        name: newPlanName.trim(),
        created_by: currentUser?.id,
        created_by_name: currentUser?.displayName,
      })
      .select()
      .single();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setNewPlanName('');
    setPlans(prev => [...prev, data]);
    setPlanId(data.id);
    toast({ title: 'Floor plan created' });
  };

  const uploadImage = async (file: File) => {
    if (!activePlan || !currentOrganization?.id) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `floor-plans/${currentOrganization.id}/${activePlan.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
    if (uploadError) {
      setUploading(false);
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      return;
    }
    const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path);
    const { error } = await (supabase as any)
      .from('restaurant_floor_plans')
      .update({ image_url: pub.publicUrl, updated_by_name: currentUser?.displayName })
      .eq('id', activePlan.id);
    setUploading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setPlans(prev => prev.map(p => (p.id === activePlan.id ? { ...p, image_url: pub.publicUrl } : p)));
    toast({ title: 'Floor plan image updated' });
  };

  const placeTable = async (x: number, y: number) => {
    if (!placingTableId || !activePlan) return;
    const { error } = await (supabase as any)
      .from('restaurant_tables')
      .update({ pos_x: x, pos_y: y, floor_plan_id: activePlan.id, updated_by_name: currentUser?.displayName })
      .eq('id', placingTableId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setTables(prev =>
      prev.map(t => (t.id === placingTableId ? { ...t, pos_x: x, pos_y: y, floor_plan_id: activePlan.id } : t)),
    );
    setPlacingTableId('');
  };

  const unplaceTable = async (tableId: string) => {
    const { error } = await (supabase as any)
      .from('restaurant_tables')
      .update({ pos_x: null, pos_y: null, floor_plan_id: null })
      .eq('id', tableId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setTables(prev => prev.map(t => (t.id === tableId ? { ...t, pos_x: null, pos_y: null, floor_plan_id: null } : t)));
  };

  const planTables = tables.filter(t => t.floor_plan_id === planId);
  const unplaced = tables.filter(t => t.pos_x == null || t.pos_y == null || t.floor_plan_id !== planId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <LayoutGrid className="h-7 w-7" /> Restaurant Layout
        </h1>
        <p className="text-muted-foreground">
          Upload your own floor plan image and map tables and sections onto it. The POS floor cards follow this layout.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{activePlan?.name || 'No floor plan'}</CardTitle>
                <CardDescription>
                  {placingTableId
                    ? 'Click on the plan to place the selected table'
                    : 'Select a table on the right, then click the plan to position it'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {plans.length > 0 && (
                  <Select value={planId} onValueChange={setPlanId}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button variant="outline" disabled={!activePlan || uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload image
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage(f);
                    e.target.value = '';
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <FloorPlanView
                imageUrl={activePlan?.image_url}
                tables={planTables}
                selectedTableId={placingTableId}
                onPlace={placeTable}
                onTableClick={t => setPlacingTableId(t.id)}
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">New floor plan</CardTitle>
                <CardDescription>e.g. Ground Floor, Terrace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="planName">Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="planName"
                    value={newPlanName}
                    onChange={e => setNewPlanName(e.target.value)}
                    placeholder="Ground Floor"
                  />
                  <Button onClick={createPlan} disabled={!newPlanName.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tables</CardTitle>
                <CardDescription>
                  {planTables.length} mapped · {unplaced.length} unmapped
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {tables.length === 0 && (
                  <p className="text-sm text-muted-foreground">Add tables on the Restaurant page first.</p>
                )}
                {tables.map(t => {
                  const mapped = t.floor_plan_id === planId && t.pos_x != null;
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.capacity} seats{t.area ? ` · ${t.area}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {mapped ? (
                          <>
                            <Badge variant="secondary">Mapped</Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => unplaceTable(t.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant={placingTableId === t.id ? 'default' : 'outline'}
                            onClick={() => setPlacingTableId(t.id)}
                            disabled={!activePlan}
                          >
                            <MapPin className="mr-1 h-4 w-4" />
                            {placingTableId === t.id ? 'Click plan' : 'Place'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
