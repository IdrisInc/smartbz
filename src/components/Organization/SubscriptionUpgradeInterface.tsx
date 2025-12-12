import React, { useState } from 'react';
import { Check, Zap, Crown, Building2, Users, Star, Shield, Smartphone, Loader2, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionUpgradeInterfaceProps {
  open: boolean;
  onClose: () => void;
  currentFeature?: string;
  limitReached?: boolean;
}

export function SubscriptionUpgradeInterface({ 
  open, 
  onClose, 
  currentFeature,
  limitReached 
}: SubscriptionUpgradeInterfaceProps) {
  const { currentPlan, limits, currentUsage } = useSubscriptionLimits();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showMobileMoneyDialog, setShowMobileMoneyDialog] = useState(false);
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState('');
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState('MPESA');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);

  const plans = [
    {
      id: 'base',
      name: 'Base Plan',
      price: '$29',
      period: 'month',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      popular: false,
      limits: {
        businesses: 1,
        branches: 2,
        staff: 5
      },
      features: [
        'Dashboard',
        'Sales Management',
        'Products & Inventory',
        'Basic Reports',
        'Customer Management',
        'Email Support'
      ],
      upgradePrompt: limitReached ? `Upgrade to add more ${currentFeature}` : undefined
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: '$79',
      period: 'month',
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      popular: true,
      limits: {
        businesses: 10,
        branches: 10,
        staff: 25
      },
      features: [
        'Everything in Base',
        'Multiple Businesses',
        'Advanced Finance Module',
        'Advanced Reports & Analytics',
        'API Integrations',
        'Payment Gateway Integration',
        'Priority Support'
      ],
      upgradePrompt: 'Most popular for growing businesses'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: 'pricing',
      icon: Crown,
      color: 'text-gold-600',
      bgColor: 'bg-gold-50',
      borderColor: 'border-gold-200',
      popular: false,
      limits: {
        businesses: -1,
        branches: -1,
        staff: -1
      },
      features: [
        'Everything in Pro',
        'Unlimited Businesses & Staff',
        'Custom Branding / White-label',
        'Bulk Import/Export',
        'Advanced Integrations',
        'Custom Reports',
        'Dedicated Account Manager',
        '24/7 Premium Support'
      ],
      upgradePrompt: 'Perfect for large enterprises'
    }
  ];

  const getCurrentPlanIndex = () => {
    return plans.findIndex(plan => plan.id === currentPlan);
  };

  const canUpgradeTo = (planId: string) => {
    const currentIndex = getCurrentPlanIndex();
    const targetIndex = plans.findIndex(plan => plan.id === planId);
    return targetIndex > currentIndex;
  };

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    setPendingPlanId(planId);
    setShowMobileMoneyDialog(true);
  };

  const processMobileMoneyPayment = async () => {
    if (!mobileMoneyPhone || mobileMoneyPhone.length < 9 || !pendingPlanId || !currentOrganization) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const plan = plans.find(p => p.id === pendingPlanId);
      const planPrices: Record<string, number> = {
        base: 75000,    // ~$29 in TZS
        pro: 200000,    // ~$79 in TZS
        enterprise: 500000 // Custom
      };
      const amount = planPrices[pendingPlanId] || 75000;

      const { data, error } = await supabase.functions.invoke('clickpesa-payment', {
        body: {
          amount,
          phone: `255${mobileMoneyPhone}`,
          provider: mobileMoneyProvider,
          reference: `SUB-${currentOrganization.id.slice(0, 8)}-${Date.now()}`,
          description: `${plan?.name || pendingPlanId} Subscription`,
          paymentType: 'subscription',
          organizationId: currentOrganization.id,
          plan: pendingPlanId,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Payment Request Sent",
          description: data.message || "Check your phone for the USSD prompt to complete payment",
        });
        setShowMobileMoneyDialog(false);
        onClose();
      } else {
        throw new Error(data.error || 'Payment initiation failed');
      }
    } catch (error: any) {
      console.error('Subscription payment error:', error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message || "There was an error processing the payment.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Unlimited' : limit.toString();
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Upgrade Your Subscription</DialogTitle>
          <DialogDescription>
            {limitReached 
              ? `You have reached your plan limit. Upgrade to ${currentFeature ? `add more ${currentFeature}` : 'continue growing'}.`
              : 'Choose the plan that fits your business needs'
            }
          </DialogDescription>
        </DialogHeader>

        {limitReached && (
          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Limit Reached:</strong> Your current {currentPlan} plan limits have been reached. 
              Upgrade to continue adding {currentFeature}.
            </AlertDescription>
          </Alert>
        )}

        {/* Current Plan Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Current Plan Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{currentUsage?.businesses || 0}</div>
                <div className="text-sm text-muted-foreground">
                  of {formatLimit(limits?.businesses || 0)} businesses
                </div>
                {limits?.businesses !== -1 && (currentUsage?.businesses || 0) >= (limits?.businesses || 0) && (
                  <Badge variant="destructive" className="mt-1">Limit Reached</Badge>
                )}
              </div>
              <div>
                <div className="text-2xl font-bold">{currentUsage?.branches || 0}</div>
                <div className="text-sm text-muted-foreground">
                  of {formatLimit(limits?.branchesPerBusiness || 0)} branches
                </div>
                {limits?.branchesPerBusiness !== -1 && (currentUsage?.branches || 0) >= (limits?.branchesPerBusiness || 0) && (
                  <Badge variant="destructive" className="mt-1">Limit Reached</Badge>
                )}
              </div>
              <div>
                <div className="text-2xl font-bold">{currentUsage?.staff || 0}</div>
                <div className="text-sm text-muted-foreground">
                  of {formatLimit(limits?.staffPerBranch || 0)} staff
                </div>
                {limits?.staffPerBranch !== -1 && (currentUsage?.staff || 0) >= (limits?.staffPerBranch || 0) && (
                  <Badge variant="destructive" className="mt-1">Limit Reached</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Comparison */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan;
            const canUpgrade = canUpgradeTo(plan.id);
            
            return (
              <Card 
                key={plan.id}
                className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''} ${plan.borderColor} transition-all hover:shadow-lg`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className={`text-center ${plan.bgColor} rounded-t-lg`}>
                  <div className={`w-12 h-12 ${plan.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <plan.icon className={`h-6 w-6 ${plan.color}`} />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {plan.price}
                    {plan.price !== 'Custom' && (
                      <span className="text-lg font-normal text-muted-foreground">/{plan.period}</span>
                    )}
                  </div>
                  {plan.upgradePrompt && (
                    <p className="text-sm text-muted-foreground">{plan.upgradePrompt}</p>
                  )}
                </CardHeader>

                <CardContent className="p-6">
                  {/* Limits */}
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Plan Limits</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Businesses:</span>
                        <span className="font-medium">{formatLimit(plan.limits.businesses)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Branches:</span>
                        <span className="font-medium">{formatLimit(plan.limits.branches)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Staff:</span>
                        <span className="font-medium">{formatLimit(plan.limits.staff)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? "secondary" : plan.popular ? "default" : "outline"}
                    disabled={isCurrentPlan || !canUpgrade}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {isCurrentPlan 
                      ? 'Current Plan' 
                      : canUpgrade 
                        ? `Upgrade to ${plan.name}`
                        : 'Lower Plan'
                    }
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment Integration Notice */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Secure payment processing • Cancel anytime • 30-day money-back guarantee</span>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>

    {/* Mobile Money Payment Dialog */}
    <Dialog open={showMobileMoneyDialog} onOpenChange={setShowMobileMoneyDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            Pay with Mobile Money
          </DialogTitle>
          <DialogDescription>
            Complete your subscription payment via mobile money
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Provider</Label>
            <Select value={mobileMoneyProvider} onValueChange={setMobileMoneyProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MPESA">M-Pesa (Vodacom)</SelectItem>
                <SelectItem value="TIGOPESA">Tigo Pesa</SelectItem>
                <SelectItem value="AIRTELMONEY">Airtel Money</SelectItem>
                <SelectItem value="HALOPESA">Halopesa</SelectItem>
                <SelectItem value="EZYPESA">EzyPesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 border rounded-l-md bg-muted">
                <span className="text-sm text-muted-foreground">+255</span>
              </div>
              <Input
                placeholder="712345678"
                value={mobileMoneyPhone}
                onChange={(e) => setMobileMoneyPhone(e.target.value.replace(/\D/g, ''))}
                className="rounded-l-none"
                maxLength={9}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowMobileMoneyDialog(false)}>Cancel</Button>
          <Button 
            onClick={processMobileMoneyPayment} 
            disabled={isProcessing || mobileMoneyPhone.length < 9}
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Phone className="h-4 w-4 mr-2" />}
            {isProcessing ? 'Processing...' : 'Pay Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}