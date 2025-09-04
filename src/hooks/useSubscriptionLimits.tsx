import { useEffect, useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionLimits {
  businesses: number; // -1 for unlimited
  branchesPerBusiness: number;
  staffPerBranch: number;
}

export interface CurrentUsage {
  businesses: number;
  branches: number;
  staff: number;
}

const PLAN_LIMITS: Record<string, SubscriptionLimits> = {
  'free': {
    businesses: 1,
    branchesPerBusiness: 1,
    staffPerBranch: 3
  },
  'base': {
    businesses: 1,
    branchesPerBusiness: 2,
    staffPerBranch: 5
  },
  'pro': {
    businesses: 10,
    branchesPerBusiness: 10,
    staffPerBranch: 25
  },
  'enterprise': {
    businesses: -1,
    branchesPerBusiness: -1,
    staffPerBranch: -1
  }
};

export function useSubscriptionLimits() {
  const { currentOrganization, organizations } = useOrganization();
  const [currentUsage, setCurrentUsage] = useState<CurrentUsage>({
    businesses: 0,
    branches: 0,
    staff: 0
  });
  const [loading, setLoading] = useState(true);

  const currentPlan = currentOrganization?.subscription_plan || 'free';
  const limits = PLAN_LIMITS[currentPlan];

  useEffect(() => {
    const fetchUsage = async () => {
      if (!currentOrganization) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get branches count for current organization
        const { data: branches, error: branchesError } = await supabase
          .from('branches')
          .select('id')
          .eq('organization_id', currentOrganization.id);

        if (branchesError) throw branchesError;

        // Get employees count for current organization
        const { data: employees, error: employeesError } = await supabase
          .from('employees')
          .select('id')
          .eq('organization_id', currentOrganization.id);

        if (employeesError) throw employeesError;

        setCurrentUsage({
          businesses: organizations.length,
          branches: branches?.length || 0,
          staff: employees?.length || 0
        });
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [currentOrganization, organizations]);

  const canAddBusiness = () => {
    return limits?.businesses === -1 || (currentUsage?.businesses || 0) < (limits?.businesses || 0);
  };

  const canAddBranch = () => {
    return limits?.branchesPerBusiness === -1 || (currentUsage?.branches || 0) < (limits?.branchesPerBusiness || 0);
  };

  const canAddStaff = () => {
    return limits?.staffPerBranch === -1 || (currentUsage?.staff || 0) < (limits?.staffPerBranch || 0);
  };

  const getNextPlan = () => {
    const plans = ['free', 'base', 'pro', 'enterprise'];
    const currentIndex = plans.indexOf(currentPlan);
    return currentIndex < plans.length - 1 ? plans[currentIndex + 1] : null;
  };

  const hasFinanceAccess = () => {
    return ['pro', 'enterprise'].includes(currentPlan);
  };

  const hasAdvancedReports = () => {
    return ['pro', 'enterprise'].includes(currentPlan);
  };

  const hasIntegrations = () => {
    return ['pro', 'enterprise'].includes(currentPlan);
  };

  return {
    limits,
    currentUsage,
    loading,
    currentPlan,
    canAddBusiness,
    canAddBranch,
    canAddStaff,
    getNextPlan,
    hasFinanceAccess,
    hasAdvancedReports,
    hasIntegrations
  };
}