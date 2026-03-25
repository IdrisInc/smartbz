import React from 'react';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { BranchManagement } from '@/components/Organization/BranchManagement';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Branches() {
  const { t } = useLanguage();

  return (
    <ProtectedRoute requiredPermissions={['canViewAllBranches']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('branches.title')}</h1>
          <p className="text-muted-foreground">
            {t('branches.desc')}
          </p>
        </div>
        
        <BranchManagement />
      </div>
    </ProtectedRoute>
  );
}
