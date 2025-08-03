import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrganization } from '@/contexts/OrganizationContext';
import { SubscriptionUpgrade } from '@/components/Organization/SubscriptionUpgrade';
import { format } from 'date-fns';

export function SubscriptionSettings() {
  const { currentOrganization } = useOrganization();

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

  return (
    <div className="space-y-6">
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
    </div>
  );
}