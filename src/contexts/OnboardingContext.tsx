
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useOrganization } from './OrganizationContext';

interface OnboardingContextType {
  needsOnboarding: boolean;
  setNeedsOnboarding: (needs: boolean) => void;
  checkOnboardingStatus: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const { user } = useAuth();
  const { organizations, loading } = useOrganization();

  const checkOnboardingStatus = async () => {
    if (!user || loading) return;
    
    // If user has no organizations, they need onboarding
    const hasOrganizations = organizations && organizations.length > 0;
    
    if (!hasOrganizations) {
      setNeedsOnboarding(true);
      return;
    }

    // If user has organizations, check if onboarding is complete
    // We'll check if they have at least one branch (indicates completed onboarding)
    const currentOrg = organizations[0];
    if (currentOrg) {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: branches, error } = await supabase
          .from('branches')
          .select('id')
          .eq('organization_id', currentOrg.id)
          .limit(1);
        
        // If no branches exist, user needs to complete onboarding
        const needsOnboarding = !branches || branches.length === 0;
        setNeedsOnboarding(needsOnboarding);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to not needing onboarding if there's an error
        setNeedsOnboarding(false);
      }
    } else {
      setNeedsOnboarding(false);
    }
  };

  useEffect(() => {
    checkOnboardingStatus();
  }, [user, organizations, loading]);

  return (
    <OnboardingContext.Provider value={{
      needsOnboarding,
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
