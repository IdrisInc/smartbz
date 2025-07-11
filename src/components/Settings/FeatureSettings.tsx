
import React, { useState } from 'react';
import { Crown, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const plans = [
  {
    name: 'Basic',
    price: 'Free',
    description: 'Essential features for small businesses',
    features: [
      'Up to 100 products',
      'Basic reporting',
      'Single location',
      'Email support'
    ],
    limitations: [
      'No advanced analytics',
      'No multi-location support',
      'No API access'
    ]
  },
  {
    name: 'Professional',
    price: '$29/month',
    description: 'Advanced features for growing businesses',
    features: [
      'Unlimited products',
      'Advanced reporting & analytics',
      'Multi-location support',
      'Priority support',
      'API access',
      'Custom integrations'
    ],
    limitations: []
  },
  {
    name: 'Enterprise',
    price: '$99/month',
    description: 'Full-featured solution for large businesses',
    features: [
      'Everything in Professional',
      'Advanced workflow automation',
      'Custom roles & permissions',
      'White-label options',
      'Dedicated support',
      'Custom development'
    ],
    limitations: []
  }
];

const featureToggles = [
  { id: 'inventory', name: 'Advanced Inventory Management', isPaid: true, plan: 'Professional' },
  { id: 'analytics', name: 'Advanced Analytics & Reporting', isPaid: true, plan: 'Professional' },
  { id: 'multi-location', name: 'Multi-Location Support', isPaid: true, plan: 'Professional' },
  { id: 'api', name: 'API Access', isPaid: true, plan: 'Professional' },
  { id: 'automation', name: 'Workflow Automation', isPaid: true, plan: 'Enterprise' },
  { id: 'custom-roles', name: 'Custom Roles & Permissions', isPaid: true, plan: 'Enterprise' },
  { id: 'white-label', name: 'White-Label Branding', isPaid: true, plan: 'Enterprise' },
];

export function FeatureSettings() {
  const [currentPlan] = useState('Basic'); // This would come from your subscription state
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([]);

  const toggleFeature = (featureId: string) => {
    setEnabledFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const canAccessFeature = (feature: typeof featureToggles[0]) => {
    if (!feature.isPaid) return true;
    if (currentPlan === 'Enterprise') return true;
    if (currentPlan === 'Professional' && feature.plan === 'Professional') return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Current Plan: {currentPlan}
          </CardTitle>
          <CardDescription>
            Manage your subscription and access to premium features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">You are currently on the {currentPlan} plan</p>
              <p className="text-sm text-muted-foreground">
                {currentPlan === 'Basic' ? 'Upgrade to unlock more features' : 'Enjoying premium features'}
              </p>
            </div>
            {currentPlan === 'Basic' && (
              <Button>Upgrade Plan</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={currentPlan === plan.name ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    {currentPlan === plan.name && <Badge>Current</Badge>}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{plan.price}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Included:</h4>
                <ul className="space-y-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              {plan.limitations.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Not included:</h4>
                  <ul className="space-y-1">
                    {plan.limitations.map((limitation) => (
                      <li key={limitation} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <X className="h-3 w-3 text-red-500" />
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {currentPlan !== plan.name && (
                <Button className="w-full" variant={plan.name === 'Professional' ? 'default' : 'outline'}>
                  {plan.price === 'Free' ? 'Downgrade' : 'Upgrade'} to {plan.name}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Configuration</CardTitle>
          <CardDescription>
            Enable or disable specific features based on your plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {featureToggles.map((feature) => {
            const canAccess = canAccessFeature(feature);
            const isEnabled = enabledFeatures.includes(feature.id);
            
            return (
              <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={feature.id} className="font-medium">
                      {feature.name}
                    </Label>
                    {feature.isPaid && (
                      <Badge variant="secondary" className="text-xs">
                        {feature.plan}+
                      </Badge>
                    )}
                  </div>
                  {!canAccess && (
                    <p className="text-sm text-muted-foreground">
                      Upgrade to {feature.plan} to access this feature
                    </p>
                  )}
                </div>
                <Switch
                  id={feature.id}
                  checked={isEnabled && canAccess}
                  onCheckedChange={() => canAccess && toggleFeature(feature.id)}
                  disabled={!canAccess}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
