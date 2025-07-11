
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export function FeatureSettings() {
  const [features, setFeatures] = useState({
    inventory: true,
    pos: true,
    accounting: false,
    payroll: false,
    multiLocation: false,
    apiAccess: false
  });

  const featureList = [
    { key: 'inventory', name: 'Inventory Management', description: 'Track stock levels and purchase orders', plan: 'Basic' },
    { key: 'pos', name: 'Point of Sale', description: 'POS system for direct sales', plan: 'Basic' },
    { key: 'accounting', name: 'Advanced Accounting', description: 'Detailed financial reports and bookkeeping', plan: 'Pro' },
    { key: 'payroll', name: 'Payroll Management', description: 'Employee payroll and tax calculations', plan: 'Pro' },
    { key: 'multiLocation', name: 'Multi-Location', description: 'Manage multiple business locations', plan: 'Enterprise' },
    { key: 'apiAccess', name: 'API Access', description: 'REST API for custom integrations', plan: 'Enterprise' }
  ];

  const handleFeatureToggle = (featureKey: string, enabled: boolean) => {
    setFeatures(prev => ({
      ...prev,
      [featureKey]: enabled
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feature Management</CardTitle>
          <CardDescription>
            Enable or disable features based on your business plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {featureList.map((feature) => (
            <div key={feature.key} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{feature.name}</h4>
                  <Badge variant={feature.plan === 'Basic' ? 'default' : feature.plan === 'Pro' ? 'secondary' : 'outline'}>
                    {feature.plan}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
              <Switch
                checked={features[feature.key as keyof typeof features]}
                onCheckedChange={(checked) => handleFeatureToggle(feature.key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
