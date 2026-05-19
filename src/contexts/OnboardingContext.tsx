import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useOrganization } from './OrganizationContext';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingContextType {
  needsOnboarding: boolean;
  onboardingChecked: boolean;
  setNeedsOnboarding: (needs: boolean) => void;
  checkOnboardingStatus: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const { user } = useAuth();
  const { organizations, loading } = useOrganization();

  const checkOnboardingStatus = async () => {
    if (!user) {
      setOnboardingChecked(false);
      return;
    }
    if (loading) return; // wait until orgs finished loading

    try {
      // Super admins skip onboarding
      const { data: superAdminCheck } = await supabase
        .from('organization_memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .maybeSingle();

      if (superAdminCheck) {
        setNeedsOnboarding(false);
        setOnboardingChecked(true);
        return;
      }
    } catch (error) {
      console.error('Error checking super admin status:', error);
    }

    const hasOrganizations = organizations && organizations.length > 0;

    if (!hasOrganizations) {
      setNeedsOnboarding(true);
      setOnboardingChecked(true);
      return;
    }

    const currentOrg = organizations[0];
    try {
      const { data: branches, error } = await supabase
        .from('branches')
        .select('id')
        .eq('organization_id', currentOrg.id)
        .limit(1);

      if (error) {
        // On RLS or transient errors, do NOT force onboarding — keep current state
        console.error('Error checking branches:', error);
        setOnboardingChecked(true);
        return;
      }

      setNeedsOnboarding(!branches || branches.length === 0);
      setOnboardingChecked(true);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setOnboardingChecked(true);
    }
  };

  useEffect(() => {
    checkOnboardingStatus();
  }, [user, organizations, loading]);

  return (
    <OnboardingContext.Provider value={{
      needsOnboarding,
      onboardingChecked,
      setNeedsOnboarding,
      checkOnboardingStatus,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
