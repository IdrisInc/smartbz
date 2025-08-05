import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'business_owner' | 'manager' | 'staff' | 'cashier';

export interface UserPermissions {
  canManageOrganizations: boolean;
  canManageUsers: boolean;
  canManageFinances: boolean;
  canViewReports: boolean;
  canManageProducts: boolean;
  canProcessSales: boolean;
  canManageInventory: boolean;
  canManageEmployees: boolean;
  canViewAllBranches: boolean;
}

export function useUserRole() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user || !currentOrganization) {
        setUserRole(null);
        setPermissions(null);
        setLoading(false);
        return;
      }

      try {
        // Check if user is admin (system-wide)
        const { data: adminCheck } = await supabase
          .from('organization_memberships')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (adminCheck) {
          setUserRole('admin');
          setPermissions(getPermissionsForRole('admin'));
          setLoading(false);
          return;
        }

        // Get user's role in current organization
        const { data: membership } = await supabase
          .from('organization_memberships')
          .select('role')
          .eq('user_id', user.id)
          .eq('organization_id', currentOrganization.id)
          .single();

        if (membership) {
          const role = membership.role as UserRole;
          setUserRole(role);
          setPermissions(getPermissionsForRole(role));
        } else {
          setUserRole(null);
          setPermissions(null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
        setPermissions(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user, currentOrganization]);

  return { userRole, permissions, loading };
}

function getPermissionsForRole(role: UserRole): UserPermissions {
  const basePermissions: UserPermissions = {
    canManageOrganizations: false,
    canManageUsers: false,
    canManageFinances: false,
    canViewReports: false,
    canManageProducts: false,
    canProcessSales: false,
    canManageInventory: false,
    canManageEmployees: false,
    canViewAllBranches: false,
  };

  switch (role) {
    case 'admin':
      return {
        canManageOrganizations: true,
        canManageUsers: true,
        canManageFinances: true,
        canViewReports: true,
        canManageProducts: true,
        canProcessSales: true,
        canManageInventory: true,
        canManageEmployees: true,
        canViewAllBranches: true,
      };

    case 'business_owner':
      return {
        canManageOrganizations: true,
        canManageUsers: true,
        canManageFinances: true,
        canViewReports: true,
        canManageProducts: true,
        canProcessSales: true,
        canManageInventory: true,
        canManageEmployees: true,
        canViewAllBranches: true,
      };

    case 'manager':
      return {
        ...basePermissions,
        canManageUsers: true,
        canManageFinances: true,
        canViewReports: true,
        canManageProducts: true,
        canProcessSales: true,
        canManageInventory: true,
        canManageEmployees: true,
        canViewAllBranches: true,
      };

    case 'staff':
      return {
        ...basePermissions,
        canViewReports: true,
        canManageProducts: true,
        canProcessSales: true,
        canManageInventory: true,
      };

    case 'cashier':
      return {
        ...basePermissions,
        canProcessSales: true,
      };

    default:
      return basePermissions;
  }
}