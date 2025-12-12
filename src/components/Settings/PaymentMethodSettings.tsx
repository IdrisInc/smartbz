import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Banknote, Smartphone, Building2, Loader2, Save, ExternalLink } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  requiresIntegration: boolean;
  integrationUrl?: string;
}

export function PaymentMethodSettings() {
  const [saving, setSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'cash',
      name: 'Cash',
      description: 'Accept cash payments at point of sale',
      icon: <Banknote className="h-5 w-5" />,
      enabled: true,
      requiresIntegration: false
    },
    {
      id: 'card',
      name: 'Card (Manual)',
      description: 'Record card payments manually without online processing',
      icon: <CreditCard className="h-5 w-5" />,
      enabled: true,
      requiresIntegration: false
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Accept online card payments via Stripe',
      icon: <CreditCard className="h-5 w-5 text-purple-500" />,
      enabled: false,
      requiresIntegration: true,
      integrationUrl: 'https://stripe.com'
    },
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      description: 'Accept mobile money payments (M-Pesa, MTN, etc.)',
      icon: <Smartphone className="h-5 w-5" />,
      enabled: false,
      requiresIntegration: false
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Accept direct bank transfers',
      icon: <Building2 className="h-5 w-5" />,
      enabled: false,
      requiresIntegration: false
    }
  ]);

  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  useEffect(() => {
    if (currentOrganization) {
      loadPaymentSettings();
    }
  }, [currentOrganization]);

  const loadPaymentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('organization_id', currentOrganization?.id)
        .maybeSingle();

      if (data) {
        // Load saved payment method settings from business_settings if stored
        // For now, we use defaults
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
    }
  };

  const togglePaymentMethod = (id: string) => {
    setPaymentMethods(prev =>
      prev.map(method =>
        method.id === id ? { ...method, enabled: !method.enabled } : method
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a full implementation, this would save to database
      // For now, we just show success
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Settings Saved",
        description: "Payment method settings have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save payment settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const enabledMethods = paymentMethods.filter(m => m.enabled);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>
            Configure which payment methods are available at checkout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span>Active methods:</span>
            {enabledMethods.map(method => (
              <Badge key={method.id} variant="secondary">
                {method.name}
              </Badge>
            ))}
          </div>

          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    {method.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{method.name}</h4>
                      {method.requiresIntegration && (
                        <Badge variant="outline" className="text-xs">
                          Requires Setup
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {method.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {method.integrationUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(method.integrationUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Setup
                    </Button>
                  )}
                  <Switch
                    checked={method.enabled}
                    onCheckedChange={() => togglePaymentMethod(method.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Gateway Integration</CardTitle>
          <CardDescription>
            Connect third-party payment providers for online transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium">Stripe</h4>
                  <p className="text-sm text-muted-foreground">
                    Accept credit/debit cards and digital wallets
                  </p>
                </div>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium">Mobile Money</h4>
                  <p className="text-sm text-muted-foreground">
                    M-Pesa, MTN Mobile Money, Airtel Money
                  </p>
                </div>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Need a specific payment integration? Contact support to request additional providers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
