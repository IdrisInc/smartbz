import React, { useState, useEffect } from 'react';
import { Search, Building2, Package, Users, UserCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface SearchResult {
  id: string;
  type: 'organization' | 'product' | 'contact' | 'employee';
  name: string;
  subtitle?: string;
  badge?: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { userRole } = useUserRole();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const isSuperAdmin = userRole === 'super_admin';

  useEffect(() => {
    const searchData = async () => {
      if (!search.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      const searchResults: SearchResult[] = [];

      try {
        // Super admin can search all organizations
        if (isSuperAdmin) {
          const { data: orgs } = await supabase
            .from('organizations')
            .select('id, name, business_sector, subscription_plan')
            .ilike('name', `%${search}%`)
            .limit(5);

          orgs?.forEach(org => {
            searchResults.push({
              id: org.id,
              type: 'organization',
              name: org.name,
              subtitle: org.business_sector,
              badge: org.subscription_plan,
            });
          });
        }

        // Search products
        if (currentOrganization) {
          const { data: products } = await supabase
            .from('products')
            .select('id, name, sku, category')
            .eq('organization_id', currentOrganization.id)
            .ilike('name', `%${search}%`)
            .limit(5);

          products?.forEach(product => {
            searchResults.push({
              id: product.id,
              type: 'product',
              name: product.name,
              subtitle: product.sku || undefined,
              badge: product.category || undefined,
            });
          });

          // Search contacts
          const { data: contacts } = await supabase
            .from('contacts')
            .select('id, name, email, contact_type')
            .eq('organization_id', currentOrganization.id)
            .ilike('name', `%${search}%`)
            .limit(5);

          contacts?.forEach(contact => {
            searchResults.push({
              id: contact.id,
              type: 'contact',
              name: contact.name,
              subtitle: contact.email || undefined,
              badge: contact.contact_type || undefined,
            });
          });

          // Search employees
          const { data: employees } = await supabase
            .from('employees')
            .select('id, first_name, last_name, email, position')
            .eq('organization_id', currentOrganization.id)
            .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
            .limit(5);

          employees?.forEach(emp => {
            searchResults.push({
              id: emp.id,
              type: 'employee',
              name: `${emp.first_name} ${emp.last_name}`,
              subtitle: emp.email || undefined,
              badge: emp.position || undefined,
            });
          });
        }

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchData, 300);
    return () => clearTimeout(debounce);
  }, [search, currentOrganization, isSuperAdmin]);

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'organization':
        return <Building2 className="h-4 w-4" />;
      case 'product':
        return <Package className="h-4 w-4" />;
      case 'contact':
        return <Users className="h-4 w-4" />;
      case 'employee':
        return <UserCircle className="h-4 w-4" />;
    }
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setSearch('');
    
    switch (result.type) {
      case 'organization':
        navigate('/dashboard/super-admin/businesses');
        break;
      case 'product':
        navigate('/dashboard/products');
        break;
      case 'contact':
        navigate('/dashboard/contacts');
        break;
      case 'employee':
        navigate('/dashboard/employees');
        break;
    }
  };

  const groupedResults = {
    organizations: results.filter(r => r.type === 'organization'),
    products: results.filter(r => r.type === 'product'),
    contacts: results.filter(r => r.type === 'contact'),
    employees: results.filter(r => r.type === 'employee'),
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[300px] justify-start text-muted-foreground"
        >
          <Search className="h-4 w-4 mr-2" />
          <span className="truncate">{t('search.placeholder')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={t('search.placeholder')}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            
            {!loading && search && results.length === 0 && (
              <CommandEmpty>{t('common.noResults')}</CommandEmpty>
            )}

            {!loading && groupedResults.organizations.length > 0 && (
              <>
                <CommandGroup heading={t('search.organizations')}>
                  {groupedResults.organizations.map(result => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="cursor-pointer"
                    >
                      {getIcon(result.type)}
                      <div className="ml-2 flex-1">
                        <p className="font-medium">{result.name}</p>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                        )}
                      </div>
                      {result.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {result.badge}
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {!loading && groupedResults.products.length > 0 && (
              <>
                <CommandGroup heading={t('search.products')}>
                  {groupedResults.products.map(result => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="cursor-pointer"
                    >
                      {getIcon(result.type)}
                      <div className="ml-2 flex-1">
                        <p className="font-medium">{result.name}</p>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                        )}
                      </div>
                      {result.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {result.badge}
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {!loading && groupedResults.contacts.length > 0 && (
              <>
                <CommandGroup heading={t('search.contacts')}>
                  {groupedResults.contacts.map(result => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="cursor-pointer"
                    >
                      {getIcon(result.type)}
                      <div className="ml-2 flex-1">
                        <p className="font-medium">{result.name}</p>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                        )}
                      </div>
                      {result.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {result.badge}
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {!loading && groupedResults.employees.length > 0 && (
              <CommandGroup heading={t('search.employees')}>
                {groupedResults.employees.map(result => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer"
                  >
                    {getIcon(result.type)}
                    <div className="ml-2 flex-1">
                      <p className="font-medium">{result.name}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                      )}
                    </div>
                    {result.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {result.badge}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
