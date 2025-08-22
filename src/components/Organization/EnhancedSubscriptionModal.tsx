import React, { useState } from 'react';
import { Crown, Check, Zap, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';

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
      'Multiple Businesses (up to 10)',
      'More Branches per Business (up to 10)',
      'More Staff per Branch (up to 25)',
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
      'Dedicated Account Manager',
      'API Access',
      'Custom Development'
    ],
    popular: false,
    limits: {
      businesses: -1, // unlimited
      branchesPerBusiness: -1,
      staffPerBranch: -1
    }
  },
];

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  organizationId?: string;
  onSuccess?: () => void;
  highlightFeature?: 'business' | 'branch' | 'staff' | 'finance' | 'advanced_reports' | 'integrations';
}

export function SubscriptionModal({ 
  open, 
  onClose, 
  organizationId, 
  onSuccess,
  highlightFeature 
}: SubscriptionModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { currentOrganization } = useOrganization();
  const { currentPlan } = useSubscriptionLimits();
  const { toast } = useToast();
  const navigate = useNavigate();
  const handleUpgrade = async (planId: string) => {
    const orgId = organizationId || currentOrganization?.id;
    if (!orgId) return;
    setLoading(planId);
    try {
      toast({
        title: "Manual upgrade required",
        description: "Please submit a payment proof in Settings → Manual Payment.",
      });
      navigate('/settings');
      onClose();
      onSuccess?.();
    } finally {
      setLoading(null);
    }
  };

  const handleContinueWithFree = () => {
    onClose();
    onSuccess?.();
  };

  const isFeatureHighlighted = (planId: string) => {
    if (!highlightFeature) return false;
    
    switch (highlightFeature) {
      case 'business':
        return planId !== 'free';
      case 'branch':
        return planId === 'pro' || planId === 'enterprise';
      case 'staff':
        return planId === 'pro' || planId === 'enterprise';
      case 'finance':
      case 'advanced_reports':
      case 'integrations':
        return planId === 'pro' || planId === 'enterprise';
      default:
        return false;
    }
  };

  const getFeatureAlert = () => {
    switch (highlightFeature) {
      case 'business':
        return 'Multiple businesses require a paid plan';
      case 'branch':
        return 'More branches available on Pro and Enterprise plans';
      case 'staff':
        return 'Higher staff limits available on Pro and Enterprise plans';
      case 'finance':
        return 'Finance module available on Pro and Enterprise plans';
      case 'advanced_reports':
        return 'Advanced reports available on Pro and Enterprise plans';
      case 'integrations':
        return 'API integrations available on Pro and Enterprise plans';
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
          <DialogDescription>
            Select the plan that best fits your business needs
          </DialogDescription>
          
          {highlightFeature && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">{getFeatureAlert()}</span>
            </div>
          )}
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 py-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${
                plan.popular ? 'border-primary shadow-lg' : ''
              } ${
                isFeatureHighlighted(plan.id) ? 'ring-2 ring-primary ring-opacity-50' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              
              {isFeatureHighlighted(plan.id) && (
                <Badge className="absolute -top-2 right-4 bg-green-500">
                  Includes Feature
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
                  disabled={loading === plan.id || currentPlan === plan.id}
                >
                  {loading === plan.id ? 'Processing...' : 
                    currentPlan === plan.id ? 'Current Plan' : 
                    `Upgrade to ${plan.name}`}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Free Plan Option */}
        <div className="border-t pt-6">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">Continue with Free Plan</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Limited to 1 business, 1 branch, and 3 staff members
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={handleContinueWithFree}>
                Continue with Free
              </Button>
              <Button variant="ghost" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}