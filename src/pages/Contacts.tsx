
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, User, Building, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactForm } from '@/components/Contacts/ContactForm';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

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

  const handleDeleteContact = async () => {
    if (!deleteContact) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', deleteContact.id);

      if (error) throw error;

      toast({
        title: "Contact deleted",
        description: `${deleteContact.name} has been removed.`,
      });
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete contact. Please try again.",
      });
    } finally {
      setDeleteContact(null);
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const customers = contacts.filter(contact => contact.contact_type === 'customer');
  const suppliers = contacts.filter(contact => contact.contact_type === 'supplier');

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const ContactCard = ({ contact, type }: { contact: Contact; type: 'customer' | 'supplier' }) => (
    <Card key={contact.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {type === 'customer' ? <User className="h-5 w-5" /> : <Building className="h-5 w-5" />}
            <div>
              <CardTitle className="text-lg">{contact.name}</CardTitle>
              <CardDescription>{contact.email || 'No email'}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={type === 'customer' ? 'secondary' : 'outline'}>
              {type === 'customer' ? 'Customer' : 'Supplier'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Phone:</span>
            <span className="text-sm">{contact.phone || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Address:</span>
            <span className="text-sm">{contact.address || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">City:</span>
            <span className="text-sm">{contact.city || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Country:</span>
            <span className="text-sm">{contact.country || 'N/A'}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleEditContact(contact)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-destructive hover:text-destructive"
            onClick={() => setDeleteContact(contact)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
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
        <Button onClick={() => { setEditingContact(null); setShowForm(true); }}>
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
          <TabsTrigger value="customers">Customers ({customers.length})</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers ({suppliers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-3 text-center py-8">Loading customers...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-muted-foreground">No customers found</div>
            ) : (
              filteredCustomers.map((customer) => (
                <ContactCard key={customer.id} contact={customer} type="customer" />
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
                <ContactCard key={supplier.id} contact={supplier} type="supplier" />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {showForm && (
        <ContactForm 
          contact={editingContact}
          onClose={() => { setShowForm(false); setEditingContact(null); }} 
          onSave={() => {
            setShowForm(false);
            setEditingContact(null);
            fetchContacts();
          }}
        />
      )}

      <AlertDialog open={!!deleteContact} onOpenChange={() => setDeleteContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteContact?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
