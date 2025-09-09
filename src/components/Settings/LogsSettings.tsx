
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useExportUtils } from '@/hooks/useExportUtils';
import { toast } from 'sonner';

interface SystemLog {
  id: string;
  created_at: string;
  level: string;
  message: string;
  module: string;
  action?: string;
  details?: any;
  user_id?: string;
  organization_id?: string;
}

export function LogsSettings() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const { currentOrganization } = useOrganization();
  const { exportToCSV } = useExportUtils();

  const loadLogs = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading logs:', error);
        toast.error('Failed to load system logs');
        return;
      }

      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentOrganization?.id]);

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'default';
      default: return 'outline';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.action?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
    
    return matchesSearch && matchesLevel && matchesModule;
  });

  const handleExportLogs = () => {
    const exportData = filteredLogs.map(log => ({
      Timestamp: new Date(log.created_at).toLocaleString(),
      Level: log.level.toUpperCase(),
      Message: log.message,
      Module: log.module,
      Action: log.action || '',
      Details: typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || ''
    }));
    exportToCSV(exportData, 'system-logs');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
          <CardDescription>
            Monitor system activities, errors, and user actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
                <SelectItem value="payments">Payments</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="employees">Employees</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getLevelBadgeVariant(log.level)}>
                            {log.level.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.message}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.module}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.action || '-'}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {typeof log.details === 'object' 
                            ? JSON.stringify(log.details) 
                            : log.details || '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
