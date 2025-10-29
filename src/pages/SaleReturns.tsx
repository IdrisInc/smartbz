import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RotateCcw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default function SaleReturns() {
  const { currentOrganization } = useOrganization();

  const { data: saleReturns, isLoading } = useQuery({
    queryKey: ['sale-returns', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from('sale_returns')
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
      pending: 'outline',
      approved: 'default',
      rejected: 'destructive',
      completed: 'default',
    };
    return colors[status] || 'secondary';
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sale Returns</h1>
            <p className="text-muted-foreground">
              Manage customer returns and refunds
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Sale Return
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              All Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : !saleReturns || saleReturns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sale returns found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return Number</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Refund Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saleReturns.map((ret) => (
                    <TableRow key={ret.id}>
                      <TableCell className="font-medium">{ret.return_number}</TableCell>
                      <TableCell>{ret.return_date}</TableCell>
                      <TableCell>${Number(ret.total_amount).toFixed(2)}</TableCell>
                      <TableCell>${Number(ret.refund_amount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(ret.status || 'pending')}>
                          {ret.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {ret.reason || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(ret.created_at), { addSuffix: true })}
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
