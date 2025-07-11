
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Users, ShoppingCart, DollarSign } from 'lucide-react';

const stats = [
  {
    title: 'Total Products',
    value: '1,234',
    description: '+12% from last month',
    icon: Package,
  },
  {
    title: 'Active Customers',
    value: '892',
    description: '+8% from last month',
    icon: Users,
  },
  {
    title: 'Orders Today',
    value: '45',
    description: '+23% from yesterday',
    icon: ShoppingCart,
  },
  {
    title: 'Revenue (Month)',
    value: '$12,345',
    description: '+15% from last month',
    icon: DollarSign,
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your business management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your business overview for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">New order #1234</p>
                  <p className="text-sm text-muted-foreground">Customer: John Doe - $125.00</p>
                </div>
                <div className="ml-auto font-medium">2 min ago</div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Low stock alert</p>
                  <p className="text-sm text-muted-foreground">Product: iPhone 15 - 5 units left</p>
                </div>
                <div className="ml-auto font-medium">5 min ago</div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Payment received</p>
                  <p className="text-sm text-muted-foreground">Invoice #INV-001 - $500.00</p>
                </div>
                <div className="ml-auto font-medium">1 hour ago</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Add New Product
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Create Order
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <DollarSign className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
