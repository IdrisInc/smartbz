
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, User, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactForm } from '@/components/Contacts/ContactForm';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  contact_type: string;
  address: string;
  city: string;
  country: string;
  notes: string;
}

export default function Contacts() {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchContacts();
    }
  }, [currentOrganization]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', currentOrganization?.id);

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const customers = contacts.filter(contact => contact.contact_type === 'customer');
  const suppliers = contacts.filter(contact => contact.contact_type === 'supplier');

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            {loading ? (
              <div className="col-span-3 text-center py-8">Loading customers...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-muted-foreground">No customers found</div>
            ) : (
              filteredCustomers.map((customer) => (
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
                        <span className="text-sm">{customer.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Address:</span>
                        <span className="text-sm">{customer.address || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">City:</span>
                        <span className="text-sm">{customer.city || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Country:</span>
                        <span className="text-sm">{customer.country || 'N/A'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-3 text-center py-8">Loading suppliers...</div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-muted-foreground">No suppliers found</div>
            ) : (
              filteredSuppliers.map((supplier) => (
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
                        <span className="text-sm">{supplier.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Address:</span>
                        <span className="text-sm">{supplier.address || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">City:</span>
                        <span className="text-sm">{supplier.city || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Country:</span>
                        <span className="text-sm">{supplier.country || 'N/A'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {showForm && (
        <ContactForm 
          onClose={() => setShowForm(false)} 
          onSave={() => {
            setShowForm(false);
            fetchContacts();
          }}
        />
      )}
    </div>
  );
}
