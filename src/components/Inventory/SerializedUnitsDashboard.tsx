import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useExportUtils } from '@/hooks/useExportUtils';
import {
  Search, Smartphone, ShoppingCart, RotateCcw, Ban, HelpCircle, Loader2, Download, Building2,
} from 'lucide-react';

type UnitStatus = 'in_stock' | 'sold' | 'returned' | 'damaged' | 'lost';

const STATUSES: UnitStatus[] = ['in_stock', 'sold', 'returned', 'damaged', 'lost'];

const statusLabels: Record<UnitStatus, string> = {
  in_stock: 'In Stock',
  sold: 'Sold',
  returned: 'Returned',
  damaged: 'Damaged',
  lost: 'Lost',
};

const statusIcons: Record<UnitStatus, React.ReactNode> = {
  in_stock: <Smartphone className="h-4 w-4 text-green-600" />,
  sold: <ShoppingCart className="h-4 w-4 text-blue-600" />,
  returned: <RotateCcw className="h-4 w-4 text-yellow-600" />,
  damaged: <Ban className="h-4 w-4 text-red-600" />,
  lost: <HelpCircle className="h-4 w-4 text-gray-600" />,
};

const statusVariants: Record<UnitStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  in_stock: 'default',
  sold: 'secondary',
  returned: 'outline',
  damaged: 'destructive',
  lost: 'destructive',
};

interface UnitRow {
  id: string;
  imei: string | null;
  serial_number: string | null;
  barcode: string | null;
  status: UnitStatus;
  received_at: string;
  sold_at: string | null;
  returned_at: string | null;
  product_id: string;
  organization_id: string;
  product_name: string;
  product_sku: string | null;
  organization_name: string;
}

const emptyCounts = (): Record<UnitStatus, number> => ({
  in_stock: 0, sold: 0, returned: 0, damaged: 0, lost: 0,
});

export function SerializedUnitsDashboard() {
  const { currentOrganization } = useOrganization();
  const { userRole } = useUserRole();
  const { exportToCSV } = useExportUtils();
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UnitStatus | 'all'>('all');

  const isSuperAdmin = userRole === 'super_admin';

  const fetchUnits = useCallback(async () => {
    if (!currentOrganization?.id && !isSuperAdmin) return;
    setLoading(true);
    try {
      let query = supabase
        .from('product_serial_units')
        .select(`
          id, imei, serial_number, barcode, status, received_at, sold_at, returned_at,
          product_id, organization_id,
          products:product_id ( name, sku ),
          organizations:organization_id ( name )
        `)
        .order('received_at', { ascending: false })
        .limit(1000);

      if (!isSuperAdmin && currentOrganization?.id) {
        query = query.eq('organization_id', currentOrganization.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: UnitRow[] = (data || []).map((u: any) => ({
        id: u.id,
        imei: u.imei,
        serial_number: u.serial_number,
        barcode: u.barcode,
        status: u.status as UnitStatus,
        received_at: u.received_at,
        sold_at: u.sold_at,
        returned_at: u.returned_at,
        product_id: u.product_id,
        organization_id: u.organization_id,
        product_name: u.products?.name || 'Unknown product',
        product_sku: u.products?.sku ?? null,
        organization_name: u.organizations?.name || 'Unknown business',
      }));
      setUnits(mapped);
    } catch (error) {
      console.error('Error fetching serialized units:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, isSuperAdmin]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return units.filter((u) => {
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchesTerm =
        !term ||
        u.imei?.toLowerCase().includes(term) ||
        u.serial_number?.toLowerCase().includes(term) ||
        u.barcode?.toLowerCase().includes(term) ||
        u.product_name.toLowerCase().includes(term) ||
        u.product_sku?.toLowerCase().includes(term) ||
        u.organization_name.toLowerCase().includes(term);
      return matchesStatus && Boolean(matchesTerm);
    });
  }, [units, search, statusFilter]);

  const totals = useMemo(() => {
    const counts = emptyCounts();
    filtered.forEach((u) => { if (u.status in counts) counts[u.status] += 1; });
    return counts;
  }, [filtered]);

  const byBusiness = useMemo(() => {
    const map = new Map<string, { name: string; counts: Record<UnitStatus, number>; total: number }>();
    filtered.forEach((u) => {
      if (!map.has(u.organization_id)) {
        map.set(u.organization_id, { name: u.organization_name, counts: emptyCounts(), total: 0 });
      }
      const entry = map.get(u.organization_id)!;
      entry.counts[u.status] += 1;
      entry.total += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const byProduct = useMemo(() => {
    const map = new Map<string, { name: string; sku: string | null; counts: Record<UnitStatus, number>; total: number }>();
    filtered.forEach((u) => {
      const key = `${u.organization_id}:${u.product_id}`;
      if (!map.has(key)) {
        map.set(key, { name: u.product_name, sku: u.product_sku, counts: emptyCounts(), total: 0 });
      }
      const entry = map.get(key)!;
      entry.counts[u.status] += 1;
      entry.total += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const handleExport = () => {
    exportToCSV(
      filtered.map((u) => ({
        Business: u.organization_name,
        Product: u.product_name,
        SKU: u.product_sku || '',
        IMEI: u.imei || '',
        Serial: u.serial_number || '',
        Status: statusLabels[u.status],
        Received: new Date(u.received_at).toLocaleDateString(),
        Sold: u.sold_at ? new Date(u.sold_at).toLocaleDateString() : '',
        Returned: u.returned_at ? new Date(u.returned_at).toLocaleDateString() : '',
      })),
      'device-units'
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Device Tracking</CardTitle>
              <CardDescription>
                Phones and other tracked units by status{isSuperAdmin ? ' across all businesses' : ''}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search IMEI, serial, product..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                className={`p-3 border rounded-lg text-left transition-colors hover:bg-accent ${
                  statusFilter === status ? 'border-primary bg-accent' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {statusIcons[status]}
                  <span className="text-xs font-medium text-muted-foreground">{statusLabels[status]}</span>
                </div>
                <p className="text-2xl font-bold">{totals[status].toLocaleString()}</p>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {isSuperAdmin && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> Per Business
                  </h3>
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Business</TableHead>
                          {STATUSES.map((s) => (
                            <TableHead key={s} className="text-right">{statusLabels[s]}</TableHead>
                          ))}
                          <TableHead className="text-right font-bold">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {byBusiness.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                              No tracked units yet
                            </TableCell>
                          </TableRow>
                        ) : byBusiness.map((b) => (
                          <TableRow key={b.name}>
                            <TableCell className="font-medium">{b.name}</TableCell>
                            {STATUSES.map((s) => (
                              <TableCell key={s} className="text-right">{b.counts[s] || '-'}</TableCell>
                            ))}
                            <TableCell className="text-right font-bold">{b.total}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold mb-2">Per Product</h3>
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        {STATUSES.map((s) => (
                          <TableHead key={s} className="text-right">{statusLabels[s]}</TableHead>
                        ))}
                        <TableHead className="text-right font-bold">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byProduct.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                            No tracked units yet
                          </TableCell>
                        </TableRow>
                      ) : byProduct.map((p) => (
                        <TableRow key={`${p.name}-${p.sku}`}>
                          <TableCell>
                            <div className="font-medium">{p.name}</div>
                            {p.sku && <div className="text-xs text-muted-foreground">{p.sku}</div>}
                          </TableCell>
                          {STATUSES.map((s) => (
                            <TableCell key={s} className="text-right">{p.counts[s] || '-'}</TableCell>
                          ))}
                          <TableCell className="text-right font-bold">{p.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Units ({filtered.length})</h3>
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {isSuperAdmin && <TableHead>Business</TableHead>}
                        <TableHead>Product</TableHead>
                        <TableHead>IMEI</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>Sold</TableHead>
                        <TableHead>Returned</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isSuperAdmin ? 8 : 7} className="text-center text-muted-foreground py-6">
                            No units match your search
                          </TableCell>
                        </TableRow>
                      ) : filtered.slice(0, 200).map((u) => (
                        <TableRow key={u.id}>
                          {isSuperAdmin && <TableCell>{u.organization_name}</TableCell>}
                          <TableCell className="font-medium">{u.product_name}</TableCell>
                          <TableCell className="font-mono text-xs">{u.imei || '-'}</TableCell>
                          <TableCell className="font-mono text-xs">{u.serial_number || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariants[u.status]}>{statusLabels[u.status]}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{new Date(u.received_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs">{u.sold_at ? new Date(u.sold_at).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="text-xs">{u.returned_at ? new Date(u.returned_at).toLocaleDateString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {filtered.length > 200 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing the first 200 units. Refine your search or export to see them all.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
