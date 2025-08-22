import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganization } from '@/contexts/OrganizationContext';
import { SubscriptionUpgrade } from '@/components/Organization/SubscriptionUpgrade';
import { SubscriptionPlanEditor } from '@/components/Settings/SubscriptionPlanEditor';
import { PaymentProofSubmission } from '@/components/Payment/PaymentProofSubmission';
import { ActivationCodeRedemption } from '@/components/Payment/ActivationCodeRedemption';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';

export function SubscriptionSettings() {
  const { currentOrganization } = useOrganization();
  const { limits, currentUsage, currentPlan, loading } = useSubscriptionLimits();
  const { userRole } = useUserRole();

  if (!currentOrganization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Settings</CardTitle>
          <CardDescription>
            Please select an organization to manage subscription settings.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // unlimited
    return Math.min((current / limit) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {userRole === 'super_admin' && (
            <TabsTrigger value="plans">Plan Management</TabsTrigger>
          )}
          <TabsTrigger value="manual-payment">Manual Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>
                Manage your organization's subscription plan and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Organization: {currentOrganization.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {currentOrganization.business_sector.replace('_', ' ')}
                  </p>
                </div>
                <Badge variant={currentOrganization.subscription_plan === 'free' ? 'secondary' : 'default'}>
                  {currentOrganization.subscription_plan.charAt(0).toUpperCase() + currentOrganization.subscription_plan.slice(1)} Plan
                </Badge>
              </div>
              
              {currentOrganization.subscription_end && (
                <div className="text-sm text-muted-foreground">
                  Subscription ends: {format(new Date(currentOrganization.subscription_end), 'PPP')}
                </div>
              )}
            </CardContent>
          </Card>

          {!loading && (
            <Card>
              <CardHeader>
                <CardTitle>Usage Overview</CardTitle>
                <CardDescription>
                  Current usage against your plan limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Businesses</span>
                    <span>{currentUsage.businesses} / {limits.businesses === -1 ? '∞' : limits.businesses}</span>
                  </div>
                  {limits.businesses !== -1 && (
                    <Progress value={getUsagePercentage(currentUsage.businesses, limits.businesses)} />
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Branches</span>
                    <span>{currentUsage.branches} / {limits.branchesPerBusiness === -1 ? '∞' : limits.branchesPerBusiness}</span>
                  </div>
                  {limits.branchesPerBusiness !== -1 && (
                    <Progress value={getUsagePercentage(currentUsage.branches, limits.branchesPerBusiness)} />
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Staff Members</span>
                    <span>{currentUsage.staff} / {limits.staffPerBranch === -1 ? '∞' : limits.staffPerBranch}</span>
                  </div>
                  {limits.staffPerBranch !== -1 && (
                    <Progress value={getUsagePercentage(currentUsage.staff, limits.staffPerBranch)} />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Upgrade Your Plan</CardTitle>
              <CardDescription>
                Choose a plan that fits your organization's needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionUpgrade />
            </CardContent>
          </Card>
        </TabsContent>

        {userRole === 'super_admin' && (
          <TabsContent value="plans">
            <SubscriptionPlanEditor />
          </TabsContent>
        )}

        <TabsContent value="manual-payment">
          <div className="space-y-6">
            <PaymentProofSubmission />
            <ActivationCodeRedemption />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}