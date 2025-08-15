import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Save, Settings, Building2, Users, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlanLimits {
  businesses: number;
  branches: number;
  staff: number;
  monthlyTransactions: number;
  storageGB: number;
  supportLevel: 'basic' | 'priority' | 'dedicated';
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  limits: PlanLimits;
  features: string[];
}

export function SubscriptionPlanEditor() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'USD',
      interval: 'month',
      limits: {
        businesses: 1,
        branches: 1,
        staff: 3,
        monthlyTransactions: 50,
        storageGB: 1,
        supportLevel: 'basic'
      },
      features: ['Basic reporting', 'Email support', 'Mobile access']
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 29,
      currency: 'USD',
      interval: 'month',
      limits: {
        businesses: 2,
        branches: 5,
        staff: 15,
        monthlyTransactions: 500,
        storageGB: 10,
        supportLevel: 'basic'
      },
      features: ['Advanced reporting', 'Priority email support', 'API access', 'Custom fields']
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 79,
      currency: 'USD',
      interval: 'month',
      limits: {
        businesses: 5,
        branches: 25,
        staff: 100,
        monthlyTransactions: 2500,
        storageGB: 50,
        supportLevel: 'priority'
      },
      features: ['All Basic features', 'Phone support', 'Advanced analytics', 'Custom integrations', 'Multi-currency support']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 199,
      currency: 'USD',
      interval: 'month',
      limits: {
        businesses: -1, // unlimited
        branches: -1,
        staff: -1,
        monthlyTransactions: -1,
        storageGB: 500,
        supportLevel: 'dedicated'
      },
      features: ['All Professional features', 'Dedicated account manager', 'Custom development', 'SLA guarantee', 'White-label options']
    }
  ]);

  const [editingPlan, setEditingPlan] = useState<string>('');

  const updatePlan = (planId: string, updates: Partial<SubscriptionPlan>) => {
    setPlans(prev => prev.map(plan => 
      plan.id === planId ? { ...plan, ...updates } : plan
    ));
  };

  const updatePlanLimits = (planId: string, limits: Partial<PlanLimits>) => {
    setPlans(prev => prev.map(plan => 
      plan.id === planId 
        ? { ...plan, limits: { ...plan.limits, ...limits } }
        : plan
    ));
  };

  const handleSavePlans = () => {
    // Here you would typically save to your backend/database
    console.log('Saving subscription plans:', plans);
    toast({
      title: "Plans Updated",
      description: "Subscription plans have been updated successfully.",
    });
    setEditingPlan('');
  };

  const formatLimit = (value: number) => {
    return value === -1 ? 'Unlimited' : value.toString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Subscription Plan Configuration
          </CardTitle>
          <CardDescription>
            Customize limits and features for each subscription tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="free" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {plans.map(plan => (
                <TabsTrigger 
                  key={plan.id} 
                  value={plan.id}
                  className="relative"
                >
                  {plan.name}
                  {editingPlan === plan.id && (
                    <Badge variant="secondary" className="ml-2 h-4 text-xs">
                      Editing
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {plans.map(plan => (
              <TabsContent key={plan.id} value={plan.id} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{plan.name} Plan</h3>
                    <p className="text-muted-foreground">
                      ${plan.price}/{plan.interval}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPlan(editingPlan === plan.id ? '' : plan.id)}
                  >
                    {editingPlan === plan.id ? 'Stop Editing' : 'Edit Plan'}
                  </Button>
                </div>

                {editingPlan === plan.id ? (
                  <div className="space-y-6 p-4 border rounded-lg bg-muted/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${plan.id}-price`}>Monthly Price (USD)</Label>
                        <Input
                          id={`${plan.id}-price`}
                          type="number"
                          value={plan.price}
                          onChange={(e) => updatePlan(plan.id, { price: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${plan.id}-name`}>Plan Name</Label>
                        <Input
                          id={`${plan.id}-name`}
                          value={plan.name}
                          onChange={(e) => updatePlan(plan.id, { name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Business & Branch Limits
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`${plan.id}-businesses`}>Max Businesses</Label>
                          <Input
                            id={`${plan.id}-businesses`}
                            type="number"
                            value={plan.limits.businesses === -1 ? '' : plan.limits.businesses}
                            placeholder="Unlimited"
                            onChange={(e) => updatePlanLimits(plan.id, { 
                              businesses: e.target.value === '' ? -1 : parseInt(e.target.value) || 0 
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${plan.id}-branches`}>Max Branches</Label>
                          <Input
                            id={`${plan.id}-branches`}
                            type="number"
                            value={plan.limits.branches === -1 ? '' : plan.limits.branches}
                            placeholder="Unlimited"
                            onChange={(e) => updatePlanLimits(plan.id, { 
                              branches: e.target.value === '' ? -1 : parseInt(e.target.value) || 0 
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${plan.id}-staff`}>Max Staff per Branch</Label>
                          <Input
                            id={`${plan.id}-staff`}
                            type="number"
                            value={plan.limits.staff === -1 ? '' : plan.limits.staff}
                            placeholder="Unlimited"
                            onChange={(e) => updatePlanLimits(plan.id, { 
                              staff: e.target.value === '' ? -1 : parseInt(e.target.value) || 0 
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Additional Limits
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`${plan.id}-transactions`}>Monthly Transactions</Label>
                          <Input
                            id={`${plan.id}-transactions`}
                            type="number"
                            value={plan.limits.monthlyTransactions === -1 ? '' : plan.limits.monthlyTransactions}
                            placeholder="Unlimited"
                            onChange={(e) => updatePlanLimits(plan.id, { 
                              monthlyTransactions: e.target.value === '' ? -1 : parseInt(e.target.value) || 0 
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${plan.id}-storage`}>Storage (GB)</Label>
                          <Input
                            id={`${plan.id}-storage`}
                            type="number"
                            value={plan.limits.storageGB}
                            onChange={(e) => updatePlanLimits(plan.id, { 
                              storageGB: parseInt(e.target.value) || 0 
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Business Limits
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Businesses:</span>
                          <span className="font-medium">{formatLimit(plan.limits.businesses)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Branches:</span>
                          <span className="font-medium">{formatLimit(plan.limits.branches)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Staff:</span>
                          <span className="font-medium">{formatLimit(plan.limits.staff)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Usage Limits
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Transactions/month:</span>
                          <span className="font-medium">{formatLimit(plan.limits.monthlyTransactions)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Storage:</span>
                          <span className="font-medium">{plan.limits.storageGB} GB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Support:</span>
                          <span className="font-medium capitalize">{plan.limits.supportLevel}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Features</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          {plan.features.slice(0, 3).map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-1 h-1 bg-primary rounded-full mr-2"></span>
                              {feature}
                            </li>
                          ))}
                          {plan.features.length > 3 && (
                            <li className="text-muted-foreground">
                              +{plan.features.length - 3} more...
                            </li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex justify-end pt-6">
            <Button onClick={handleSavePlans} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save All Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}