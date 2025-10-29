import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface TrashItem {
  id: string;
  table_name: string;
  record_id: string;
  organization_id: string;
  old_data: any;
  deleted_at: string;
  deleted_by: string | null;
  purge_at: string;
}

export default function Trunker() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!currentOrganization) return;
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('trash_bin' as string)
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('deleted_at', { ascending: false });

      if (error) {
        console.error(error);
        toast({ title: 'Error', description: 'Failed to load deleted items', variant: 'destructive' });
      } else {
        setItems((data as any) || []);
      }
      setLoading(false);
    };
    load();
  }, [currentOrganization, toast]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return items;
    return items.filter((it) =>
      it.table_name.toLowerCase().includes(f) ||
      it.record_id.toLowerCase().includes(f) ||
      JSON.stringify(it.old_data || {}).toLowerCase().includes(f)
    );
  }, [items, filter]);

  const summarize = (data: any): string => {
    if (!data) return '';
    return (
      data.name ||
      data.title ||
      data.invoice_number ||
      data.sale_number ||
      data.email ||
      data.sku ||
      data.id ||
      ''
    );
  };

  return (
    <main className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Trunker — Deleted records (kept 90 days)</h1>
        <div className="w-64">
          <Input placeholder="Search table, id or content..." value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
      </header>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">{loading ? 'Loading…' : `Items: ${filtered.length}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Deleted</TableHead>
                  <TableHead>Purges On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{it.table_name.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[420px] truncate text-sm text-muted-foreground">
                      {summarize(it.old_data)}
                    </TableCell>
                    <TableCell className="text-sm">{new Date(it.deleted_at).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{new Date(it.purge_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No deleted records.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
