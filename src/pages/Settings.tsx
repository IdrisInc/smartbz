import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BusinessSettings } from '@/components/Settings/BusinessSettings';
import { TaxSettings } from '@/components/Settings/TaxSettings';
import { FeatureSettings } from '@/components/Settings/FeatureSettings';
import { UserSettings } from '@/components/Settings/UserSettings';
import { LogsSettings } from '@/components/Settings/LogsSettings';
import { SubscriptionSettings } from '@/components/Settings/SubscriptionSettings';
import { RolesPermissionsTab } from '@/components/Settings/RolesPermissionsTab';
import { EmailTemplateSettings } from '@/components/Settings/EmailTemplateSettings';
import { PaymentMethodSettings } from '@/components/Settings/PaymentMethodSettings';
import { BranchManagement } from '@/components/Organization/BranchManagement';
import { AdminUserRegistration } from '@/components/Admin/AdminUserRegistration';
import { ModuleConfigTab } from '@/components/SuperAdmin/ModuleConfigTab';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Settings() {
  const { userRole } = useUserRole();
  const { t } = useLanguage();
  const isBusinessOwnerOrAdmin = userRole === 'business_owner' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h2>
        <p className="text-muted-foreground">
          Configure your business settings and feature preferences
        </p>
      </div>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="business">{t('settings.business')}</TabsTrigger>
          <TabsTrigger value="subscription">{t('settings.subscription')}</TabsTrigger>
          <TabsTrigger value="tax">{t('settings.tax')}</TabsTrigger>
          <TabsTrigger value="payments">{t('settings.payments')}</TabsTrigger>
          <TabsTrigger value="features">{t('settings.features')}</TabsTrigger>
          <TabsTrigger value="users">{t('settings.users')}</TabsTrigger>
          <TabsTrigger value="branches">{t('nav.branches')}</TabsTrigger>
          <TabsTrigger value="permissions">{t('settings.permissions')}</TabsTrigger>
          {isBusinessOwnerOrAdmin && (
            <TabsTrigger value="email">{t('settings.email')}</TabsTrigger>
          )}
          <TabsTrigger value="logs">{t('settings.logs')}</TabsTrigger>
          {isSuperAdmin && (
            <>
              <TabsTrigger value="modules">{t('settings.modules')}</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="business">
          <BusinessSettings />
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionSettings />
        </TabsContent>

        <TabsContent value="tax">
          <TaxSettings />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentMethodSettings />
        </TabsContent>

        <TabsContent value="features">
          <FeatureSettings />
        </TabsContent>

        <TabsContent value="users">
          <UserSettings />
        </TabsContent>

        <TabsContent value="branches">
          <BranchManagement />
        </TabsContent>

        <TabsContent value="permissions">
          <RolesPermissionsTab />
        </TabsContent>

        {isBusinessOwnerOrAdmin && (
          <TabsContent value="email">
            <EmailTemplateSettings />
          </TabsContent>
        )}

        <TabsContent value="logs">
          <LogsSettings />
        </TabsContent>
        
        {isSuperAdmin && (
          <>
            <TabsContent value="modules">
              <ModuleConfigTab />
            </TabsContent>
            <TabsContent value="admin">
              <AdminUserRegistration />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
