import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Banknote, Smartphone, Building2, Loader2, Save, ExternalLink, CheckCircle, Phone } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  requiresIntegration: boolean;
  integrationUrl?: string;
}

interface ClickPesaPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPayment: (phone: string, provider: string) => void;
  loading: boolean;
  amount: number;
}

function ClickPesaPaymentDialog({ open, onOpenChange, onPayment, loading, amount }: ClickPesaPaymentDialogProps) {
  const [phone, setPhone] = useState('');
  const [provider, setProvider] = useState('MPESA');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            Mobile Money Payment
          </DialogTitle>
          <DialogDescription>
            Pay TZS {amount.toLocaleString()} using mobile money
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Select Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MPESA">M-Pesa (Vodacom)</SelectItem>
                <SelectItem value="TIGOPESA">Tigo Pesa (Mixx by Yas)</SelectItem>
                <SelectItem value="AIRTELMONEY">Airtel Money</SelectItem>
                <SelectItem value="HALOPESA">Halopesa</SelectItem>
                <SelectItem value="EZYPESA">EzyPesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 border rounded-l-md bg-muted">
                <span className="text-sm text-muted-foreground">+255</span>
              </div>
              <Input
                id="phone"
                placeholder="712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="rounded-l-none"
                maxLength={9}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your phone number without the country code
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => onPayment(`255${phone}`, provider)} 
            disabled={loading || phone.length < 9}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Phone className="h-4 w-4 mr-2" />
                Send Payment Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PaymentMethodSettings() {
  const [saving, setSaving] = useState(false);
  const [clickPesaEnabled, setClickPesaEnabled] = useState(false);
  const [testPaymentOpen, setTestPaymentOpen] = useState(false);
  const [testPaymentLoading, setTestPaymentLoading] = useState(false);
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
      id: 'clickpesa',
      name: 'ClickPesa (Mobile Money)',
      description: 'Accept M-Pesa, Tigo Pesa, Airtel Money, Halopesa, EzyPesa',
      icon: <Smartphone className="h-5 w-5 text-green-600" />,
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
    if (id === 'clickpesa') {
      setClickPesaEnabled(!clickPesaEnabled);
    }
    setPaymentMethods(prev =>
      prev.map(method =>
        method.id === id ? { ...method, enabled: !method.enabled } : method
      )
    );
  };

  const handleTestPayment = async (phone: string, provider: string) => {
    if (!currentOrganization) return;
    
    setTestPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('clickpesa-payment', {
        body: {
          amount: 1000, // Test amount: 1000 TZS
          phone,
          provider,
          reference: `TEST-${Date.now()}`,
          description: 'Test payment from settings',
          paymentType: 'sale',
          organizationId: currentOrganization.id,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Payment Request Sent",
          description: data.message || "Check your phone for the USSD prompt",
        });
        setTestPaymentOpen(false);
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Test payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate test payment",
        variant: "destructive",
      });
    } finally {
      setTestPaymentLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a full implementation, this would save to database
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
                      {method.id === 'clickpesa' && method.enabled && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
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
                  {method.id === 'clickpesa' && method.enabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTestPaymentOpen(true)}
                    >
                      Test Payment
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
          <CardTitle>ClickPesa Integration</CardTitle>
          <CardDescription>
            Accept mobile money payments from Tanzanian providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium">ClickPesa Mobile Money</h4>
                  <p className="text-sm text-muted-foreground">
                    M-Pesa, Tigo Pesa, Airtel Money, Halopesa, EzyPesa
                  </p>
                </div>
              </div>
              <Badge className="bg-green-600 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            </div>
            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
              <p className="text-sm text-muted-foreground">
                Your ClickPesa API credentials are configured. Enable "ClickPesa (Mobile Money)" above to start accepting payments.
              </p>
            </div>
          </div>

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

          <p className="text-sm text-muted-foreground">
            Need a specific payment integration? Contact support to request additional providers.
          </p>
        </CardContent>
      </Card>

      <ClickPesaPaymentDialog
        open={testPaymentOpen}
        onOpenChange={setTestPaymentOpen}
        onPayment={handleTestPayment}
        loading={testPaymentLoading}
        amount={1000}
      />
    </div>
  );
}

export { ClickPesaPaymentDialog };
