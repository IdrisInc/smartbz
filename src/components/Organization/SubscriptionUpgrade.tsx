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
    id: 'basic',
    name: 'Basic',
    price: 29,
    period: 'month',
    description: 'Perfect for small businesses',
    features: [
      'Up to 5 users',
      'Basic reporting',
      'Email support',
      '10GB storage',
      'Basic integrations'
    ],
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 79,
    period: 'month',
    description: 'Best for growing companies',
    features: [
      'Up to 25 users',
      'Advanced reporting',
      'Priority support',
      '100GB storage',
      'All integrations',
      'Custom workflows'
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    period: 'month',
    description: 'For large organizations',
    features: [
      'Unlimited users',
      'Custom reporting',
      '24/7 phone support',
      'Unlimited storage',
      'API access',
      'Custom development',
      'Dedicated manager'
    ],
    popular: false,
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
              {plan.id === 'basic' && <Zap className="h-8 w-8 text-blue-500" />}
              {plan.id === 'premium' && <Crown className="h-8 w-8 text-yellow-500" />}
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