
import React, { useState } from 'react';
import { Plus, Search, Filter, User, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactForm } from '@/components/Contacts/ContactForm';

const mockCustomers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    type: 'customer',
    loyaltyPoints: 150,
    totalOrders: 12,
    totalSpent: 2450.00,
    address: '123 Main St, City, Country'
  },
  {
    id: 2,
    name: 'Acme Corp',
    email: 'contact@acme.com',
    phone: '+1987654321',
    type: 'customer',
    loyaltyPoints: 500,
    totalOrders: 25,
    totalSpent: 15000.00,
    address: '456 Business Ave, City, Country'
  }
];

const mockSuppliers = [
  {
    id: 1,
    name: 'Tech Supplies Ltd',
    email: 'sales@techsupplies.com',
    phone: '+1122334455',
    type: 'supplier',
    creditTerms: '30 days',
    totalPurchases: 25000.00,
    address: '789 Industrial St, City, Country'
  }
];

export default function Contacts() {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('customers');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers & Suppliers</h2>
          <p className="text-muted-foreground">
            Manage your customer relationships and supplier partnerships
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockCustomers.map((customer) => (
              <Card key={customer.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      <div>
                        <CardTitle className="text-lg">{customer.name}</CardTitle>
                        <CardDescription>{customer.email}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">Customer</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Phone:</span>
                      <span className="text-sm">{customer.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Loyalty Points:</span>
                      <span className="text-sm font-medium">{customer.loyaltyPoints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Orders:</span>
                      <span className="text-sm">{customer.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Spent:</span>
                      <span className="text-sm font-medium">${customer.totalSpent}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockSuppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      <div>
                        <CardTitle className="text-lg">{supplier.name}</CardTitle>
                        <CardDescription>{supplier.email}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">Supplier</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Phone:</span>
                      <span className="text-sm">{supplier.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Credit Terms:</span>
                      <span className="text-sm">{supplier.creditTerms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Purchases:</span>
                      <span className="text-sm font-medium">${supplier.totalPurchases}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {showForm && (
        <ContactForm onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
