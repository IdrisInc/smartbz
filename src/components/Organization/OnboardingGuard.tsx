
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { needsOnboarding } = useOnboarding();
  const { user, loading, signOut } = useAuth();
  const { currentOrganization } = useOrganization();
  const { userRole } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && needsOnboarding) {
      navigate('/onboarding', { replace: true });
    }
  }, [needsOnboarding, user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (needsOnboarding) {
    return null;
  }

  // Check if organization is pending activation (skip for super admins)
  if (currentOrganization && currentOrganization.status === 'pending_activation' && userRole !== 'super_admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="mx-auto max-w-md text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Clock className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Account Pending Activation</h1>
            <p className="text-muted-foreground">
              Your business account has been created successfully and is awaiting activation by an administrator. 
              You will be notified once your account has been approved.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>This usually takes less than 24 hours</span>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
