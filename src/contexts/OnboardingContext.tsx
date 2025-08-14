
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
    setNeedsOnboarding(!hasOrganizations);
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
