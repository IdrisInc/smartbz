import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, FileText, RotateCcw, ClipboardList } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default function Purchases() {
  const { currentOrganization } = useOrganization();
  const [activeTab, setActiveTab] = useState('orders');

  const { data: purchaseOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ['purchase-orders', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization?.id,
  });

  const { data: purchaseReturns, isLoading: loadingReturns } = useQuery({
    queryKey: ['purchase-returns', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from('purchase_returns')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization?.id,
  });

  const { data: quotations, isLoading: loadingQuotations } = useQuery({
    queryKey: ['quotations', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from('quotations')
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
      draft: 'secondary',
      pending: 'outline',
      approved: 'default',
      received: 'default',
      cancelled: 'destructive',
    };
    return colors[status] || 'secondary';
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Purchase Management</h1>
            <p className="text-muted-foreground">
              Manage purchase orders, returns, and quotations
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="orders">
              <FileText className="h-4 w-4 mr-2" />
              Purchase Orders
            </TabsTrigger>
            <TabsTrigger value="returns">
              <RotateCcw className="h-4 w-4 mr-2" />
              Purchase Returns
            </TabsTrigger>
            <TabsTrigger value="quotations">
              <ClipboardList className="h-4 w-4 mr-2" />
              Quotations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Purchase Orders</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Purchase Order
                </Button>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="text-center py-8">Loading...</div>
                ) : !purchaseOrders || purchaseOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No purchase orders found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO Number</TableHead>
                        <TableHead>Order Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrders.map((po) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-medium">{po.po_number}</TableCell>
                          <TableCell>{po.order_date}</TableCell>
                          <TableCell>${Number(po.total_amount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(po.status || 'draft')}>
                              {po.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDistanceToNow(new Date(po.created_at), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="returns" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Purchase Returns</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Return
                </Button>
              </CardHeader>
              <CardContent>
                {loadingReturns ? (
                  <div className="text-center py-8">Loading...</div>
                ) : !purchaseReturns || purchaseReturns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No purchase returns found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Return Number</TableHead>
                        <TableHead>Return Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseReturns.map((ret) => (
                        <TableRow key={ret.id}>
                          <TableCell className="font-medium">{ret.return_number}</TableCell>
                          <TableCell>{ret.return_date}</TableCell>
                          <TableCell>${Number(ret.total_amount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(ret.status || 'pending')}>
                              {ret.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{ret.reason || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotations" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Quotations</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Quotation
                </Button>
              </CardHeader>
              <CardContent>
                {loadingQuotations ? (
                  <div className="text-center py-8">Loading...</div>
                ) : !quotations || quotations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No quotations found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quotation Number</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotations.map((quote) => (
                        <TableRow key={quote.id}>
                          <TableCell className="font-medium">{quote.quotation_number}</TableCell>
                          <TableCell>{quote.quotation_date}</TableCell>
                          <TableCell>{quote.valid_until || '-'}</TableCell>
                          <TableCell>${Number(quote.total_amount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(quote.status || 'draft')}>
                              {quote.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
