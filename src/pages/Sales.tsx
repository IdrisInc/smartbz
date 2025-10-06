
import React, { useState, useEffect } from 'react';
import { Plus, Search, Receipt, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SaleForm } from '@/components/Sales/SaleForm';
import { POSInterface } from '@/components/Sales/POSInterface';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

export default function Sales() {
  const [showForm, setShowForm] = useState(false);
  const [showPOS, setShowPOS] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({
    todaysSales: 0,
    ordersToday: 0
  });
  const [loading, setLoading] = useState(true);
  
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  useEffect(() => {
    if (currentOrganization) {
      fetchSales();
      fetchStats();
    }
  }, [currentOrganization]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          sale_number,
          total_amount,
          payment_status,
          payment_method,
          sale_date,
          created_at,
          contacts(name)
        `)
        .eq('organization_id', currentOrganization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date().toDateString();
      
      const { data: todaySales, error: salesError } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('organization_id', currentOrganization?.id)
        .gte('sale_date', new Date(today).toISOString());

      if (salesError) throw salesError;

      const todaysSales = todaySales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const ordersToday = todaySales?.length || 0;

      setStats({ todaysSales, ordersToday });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.sale_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.contacts?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Sales & Orders</h2>
          <p className="text-sm text-muted-foreground">
            Manage sales transactions and customer orders
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => setShowPOS(true)} className="w-full sm:w-auto">
            <Receipt className="mr-2 h-4 w-4" />
            POS System
          </Button>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.todaysSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Sales for today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ordersToday}</div>
            <p className="text-xs text-muted-foreground">Transactions today</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSales.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  {searchTerm ? 'No sales found matching your search.' : 'No sales recorded yet.'}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredSales.map((sale) => (
              <Card key={sale.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">{sale.sale_number || `Sale #${sale.id.slice(0, 8)}`}</CardTitle>
                      <CardDescription>Customer: {sale.contacts?.name || 'Walk-in Customer'}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${sale.total_amount?.toLocaleString() || '0'}</div>
                      <Badge variant={sale.payment_status === 'paid' ? 'default' : 'secondary'}>
                        {sale.payment_status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Payment: {sale.payment_method || 'Not specified'}</span>
                    <span>Date: {new Date(sale.sale_date || sale.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {showForm && (
        <SaleForm onClose={() => setShowForm(false)} />
      )}

      {showPOS && (
        <POSInterface onClose={() => setShowPOS(false)} />
      )}
    </div>
  );
}
