import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Array<keyof UserPermissions>;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredPermissions = [], 
  requiredRole,
  fallback 
}: ProtectedRouteProps) {
  const { userRole, permissions, loading } = useUserRole();

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Check role requirement
  if (requiredRole && userRole !== requiredRole) {
    return fallback || (
      <Alert variant="destructive" className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this area. Required role: {requiredRole}
        </AlertDescription>
      </Alert>
    );
  }

  // Check permission requirements
  if (requiredPermissions.length > 0 && permissions) {
    const hasRequiredPermissions = requiredPermissions.every(
      permission => permissions[permission]
    );

    if (!hasRequiredPermissions) {
      return fallback || (
        <Alert variant="destructive" className="m-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have the required permissions to access this area.
          </AlertDescription>
        </Alert>
      );
    }
  }

  return <>{children}</>;
}

import { UserPermissions, UserRole } from '@/hooks/useUserRole';