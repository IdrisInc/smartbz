
import React, { useState } from 'react';
import { Plus, Search, Receipt, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SaleForm } from '@/components/Sales/SaleForm';
import { POSInterface } from '@/components/Sales/POSInterface';

const mockSales = [
  {
    id: 1,
    orderNumber: 'ORD-001',
    customer: 'John Doe',
    total: 150.00,
    status: 'completed',
    paymentMethod: 'card',
    date: '2024-01-15',
    items: 3
  },
  {
    id: 2,
    orderNumber: 'ORD-002',
    customer: 'Walk-in Customer',
    total: 75.50,
    status: 'pending',
    paymentMethod: 'cash',
    date: '2024-01-15',
    items: 2
  }
];

export default function Sales() {
  const [showForm, setShowForm] = useState(false);
  const [showPOS, setShowPOS] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales & Orders</h2>
          <p className="text-muted-foreground">
            Manage sales transactions and customer orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPOS(true)}>
            <Receipt className="mr-2 h-4 w-4" />
            POS System
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,234</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+8% from yesterday</p>
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

      <div className="space-y-4">
        {mockSales.map((sale) => (
          <Card key={sale.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">{sale.orderNumber}</CardTitle>
                  <CardDescription>Customer: {sale.customer}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">${sale.total}</div>
                  <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                    {sale.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Items: {sale.items}</span>
                <span>Payment: {sale.paymentMethod}</span>
                <span>Date: {sale.date}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showForm && (
        <SaleForm onClose={() => setShowForm(false)} />
      )}

      {showPOS && (
        <POSInterface onClose={() => setShowPOS(false)} />
      )}
    </div>
  );
}
