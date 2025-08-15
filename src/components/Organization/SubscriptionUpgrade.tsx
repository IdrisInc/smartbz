import React, { useState } from 'react';
import { Crown, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const plans = [
  {
    id: 'base',
    name: 'Base Plan',
    price: 29,
    period: 'month',
    description: 'Perfect for small businesses',
    features: [
      '1 Business',
      '1-2 Branches per Business',
      'Up to 5 Staff',
      'Dashboard & Sales',
      'Products & Inventory',
      'Contacts & Basic Reports'
    ],
    popular: false,
    limits: {
      businesses: 1,
      branchesPerBusiness: 2,
      staffPerBranch: 5
    }
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: 79,
    period: 'month',
    description: 'Best for growing companies',
    features: [
      'Multiple Businesses',
      'More Branches per Business',
      'More Staff per Branch',
      'Finance Module',
      'Advanced Reports & Analytics',
      'Integrations & Priority Support'
    ],
    popular: true,
    limits: {
      businesses: 10,
      branchesPerBusiness: 10,
      staffPerBranch: 25
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 299,
    period: 'month',
    description: 'For large organizations',
    features: [
      'Unlimited Businesses',
      'Unlimited Branches & Staff',
      'Custom Branding / White-label',
      'Bulk Import/Export',
      'Advanced Integrations',
      'Dedicated Account Manager'
    ],
    popular: false,
    limits: {
      businesses: -1, // unlimited
      branchesPerBusiness: -1,
      staffPerBranch: -1
    }
  },
];

export function SubscriptionUpgrade() {
  const [loading, setLoading] = useState<string | null>(null);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const handleUpgrade = async (planId: string) => {
    if (!currentOrganization) return;
    
    setLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          organizationId: currentOrganization.id,
          plan: planId,
          paymentType: 'subscription'
        }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
          {plan.popular && (
            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
              Most Popular
            </Badge>
          )}
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {plan.id === 'base' && <Zap className="h-8 w-8 text-blue-500" />}
              {plan.id === 'pro' && <Crown className="h-8 w-8 text-yellow-500" />}
              {plan.id === 'enterprise' && <Crown className="h-8 w-8 text-purple-500" />}
            </div>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">${plan.price}</span>
              <span className="text-muted-foreground">/{plan.period}</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant={plan.popular ? 'default' : 'outline'}
              onClick={() => handleUpgrade(plan.id)}
              disabled={loading === plan.id || currentOrganization?.subscription_plan === plan.id}
            >
              {loading === plan.id ? 'Processing...' : 
                currentOrganization?.subscription_plan === plan.id ? 'Current Plan' : 
                `Upgrade to ${plan.name}`}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}