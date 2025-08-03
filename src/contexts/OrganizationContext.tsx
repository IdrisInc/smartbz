import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface Organization {
  id: string;
  name: string;
  business_sector: string;
  description?: string;
  logo_url?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  subscription_plan: 'free' | 'basic' | 'premium' | 'enterprise';
  subscription_end?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMembership {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  is_owner: boolean;
  joined_at: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  memberships: OrganizationMembership[];
  loading: boolean;
  setCurrentOrganization: (org: Organization | null) => void;
  createOrganization: (name: string, sector: string, description?: string) => Promise<Organization | null>;
  switchOrganization: (organizationId: string) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrganizations();
    } else {
      setCurrentOrganization(null);
      setOrganizations([]);
      setMemberships([]);
      setLoading(false);
    }
  }, [user]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      
      // Fetch user's memberships
      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_memberships')
        .select('*')
        .eq('user_id', user?.id);

      if (membershipError) throw membershipError;
      setMemberships(membershipData || []);

      // Fetch organizations user is member of
      const orgIds = membershipData?.map(m => m.organization_id) || [];
      if (orgIds.length > 0) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .in('id', orgIds)
          .eq('is_active', true);

        if (orgError) throw orgError;
        setOrganizations(orgData || []);

        // Set current organization from localStorage or first available
        const savedOrgId = localStorage.getItem('currentOrganizationId');
        const savedOrg = orgData?.find(org => org.id === savedOrgId);
        if (savedOrg) {
          setCurrentOrganization(savedOrg);
        } else if (orgData && orgData.length > 0) {
          setCurrentOrganization(orgData[0]);
        }
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrganization = async (name: string, sector: string, description?: string): Promise<Organization | null> => {
    try {
      const { data, error } = await supabase.rpc('create_organization_with_membership', {
        org_name: name,
        org_sector: sector as any,
        org_description: description
      });

      if (error) throw error;

      // Refresh organizations list
      await loadOrganizations();
      
      // Find and set the new organization as current
      const { data: newOrgData, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError) throw fetchError;

      setCurrentOrganization(newOrgData);
      localStorage.setItem('currentOrganizationId', newOrgData.id);

      toast({
        title: "Success",
        description: "Organization created successfully",
      });

      return newOrgData;
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: "Failed to create organization",
        variant: "destructive",
      });
      return null;
    }
  };

  const switchOrganization = (organizationId: string) => {
    const org = organizations.find(o => o.id === organizationId);
    if (org) {
      setCurrentOrganization(org);
      localStorage.setItem('currentOrganizationId', organizationId);
    }
  };

  const refreshOrganizations = async () => {
    await loadOrganizations();
  };

  return (
    <OrganizationContext.Provider value={{
      currentOrganization,
      organizations,
      memberships,
      loading,
      setCurrentOrganization,
      createOrganization,
      switchOrganization,
      refreshOrganizations,
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}