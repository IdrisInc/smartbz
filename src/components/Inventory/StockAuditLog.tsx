import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { format } from 'date-fns';
import { Search, Filter, ArrowRight, Loader2 } from 'lucide-react';
import { stockStatusLabels, StockStatusType } from './StockStatusBadge';

interface AuditLogEntry {
  id: string;
  product_id: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  quantity_before: number;
  quantity_change: number;
  performed_by: string | null;
  quantity_after: number;
  reference_type: string | null;
  created_at: string;
  product?: { name: string; sku: string | null };
}

export function StockAuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchLogs();
    }
  }, [currentOrganization?.id]);

  const fetchLogs = async () => {
    if (!currentOrganization?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_audit_log')
        .select(`
          *,
          product:products(name, sku)
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      increase: 'default',
      decrease: 'destructive',
      transfer: 'secondary',
      status_change: 'outline',
    };
    return <Badge variant={variants[action] || 'secondary'}>{action}</Badge>;
  };

  const getPerformerName = (log: AuditLogEntry) => {
    return log.performed_by ? 'User' : 'System';
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesStatus = statusFilter === 'all' || 
      log.from_status === statusFilter || 
      log.to_status === statusFilter;

    return matchesSearch && matchesAction && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Audit Log</CardTitle>
        <CardDescription>
          Immutable record of all stock movements and changes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="increase">Increase</SelectItem>
              <SelectItem value="decrease">Decrease</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(Object.keys(stockStatusLabels) as StockStatusType[]).map((status) => (
                <SelectItem key={status} value={status}>{stockStatusLabels[status]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchLogs}>
            <Filter className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No audit log entries found
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status Change</TableHead>
                  <TableHead className="text-right">Before</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">After</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.product?.name}</div>
                        {log.product?.sku && (
                          <div className="text-xs text-muted-foreground">{log.product.sku}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      {log.from_status && log.to_status ? (
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-muted-foreground">{stockStatusLabels[log.from_status as StockStatusType] || log.from_status}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span>{stockStatusLabels[log.to_status as StockStatusType] || log.to_status}</span>
                        </div>
                      ) : log.to_status ? (
                        <span className="text-sm">{stockStatusLabels[log.to_status as StockStatusType] || log.to_status}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">{log.quantity_before}</TableCell>
                    <TableCell className={`text-right font-medium ${log.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                    </TableCell>
                    <TableCell className="text-right font-medium">{log.quantity_after}</TableCell>
                    <TableCell className="text-sm">{getPerformerName(log)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {log.reference_type || 'manual'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
