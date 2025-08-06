import React from 'react';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { BranchManagement } from '@/components/Organization/BranchManagement';

export default function Branches() {
  return (
    <ProtectedRoute requiredPermissions={['canViewAllBranches']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Branches</h1>
          <p className="text-muted-foreground">
            Manage your organization's branch locations and settings.
          </p>
        </div>
        
        <BranchManagement />
      </div>
    </ProtectedRoute>
  );
}