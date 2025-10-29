import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function CashRegisters() {
  const { currentOrganization } = useOrganization();

  const { data: registers, isLoading } = useQuery({
    queryKey: ['cash-registers', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization?.id,
  });

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    const colors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      open: 'default',
      closed: 'secondary',
    };
    return colors[status] || 'secondary';
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cash Registers</h1>
            <p className="text-muted-foreground">
              Manage and monitor your cash registers
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Register
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              All Registers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : !registers || registers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No cash registers found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Register Name</TableHead>
                    <TableHead>Opening Balance</TableHead>
                    <TableHead>Current Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Opened At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registers.map((register) => (
                    <TableRow key={register.id}>
                      <TableCell className="font-medium">{register.name}</TableCell>
                      <TableCell>${Number(register.opening_balance).toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">
                        ${Number(register.current_balance).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(register.status || 'closed')}>
                          {register.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {register.opened_at
                          ? new Date(register.opened_at).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          {register.status === 'open' ? 'Close' : 'Open'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
