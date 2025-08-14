
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Loader2 } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { SubscriptionModal } from './SubscriptionModal';

interface BranchRegistrationStepProps {
  onComplete: () => void;
}

export function BranchRegistrationStep({ onComplete }: BranchRegistrationStepProps) {
  const [formData, setFormData] = useState({
    name: 'Main Branch',
    address: '',
    city: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const { checkOnboardingStatus } = useOnboarding();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !currentOrganization) {
      toast({
        title: "Error",
        description: "Please fill in the required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('branches')
        .insert({
          organization_id: currentOrganization.id,
          name: formData.name.trim(),
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null
        });

      if (error) throw error;

      // Check if organization is on free plan and show subscription modal
      if (currentOrganization.subscription_plan === 'free') {
        setShowSubscriptionModal(true);
      } else {
        toast({
          title: "Success!",
          description: "Branch created successfully",
        });
        // Refresh onboarding status
        await checkOnboardingStatus();
        onComplete();
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      toast({
        title: "Error",
        description: "Failed to create branch",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionSuccess = async () => {
    toast({
      title: "Success!",
      description: "Branch created successfully",
    });
    // Refresh onboarding status
    await checkOnboardingStatus();
    onComplete();
  };

  return (
    <>
      <Card className="animate-slide-in-right">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Set Up Your First Branch</CardTitle>
        <CardDescription>
          Create your main business location (included free)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Branch Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Main Branch"
              required
              className="transition-all duration-200 focus:scale-105"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street address"
              rows={3}
              className="transition-all duration-200 focus:scale-105"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
                className="transition-all duration-200 focus:scale-105"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="transition-all duration-200 focus:scale-105"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Branch Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="branch@yourcompany.com"
              className="transition-all duration-200 focus:scale-105"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Free Branch:</strong> Your first branch is included at no cost. You can add more branches later from the settings.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={loading || !formData.name.trim()}
              className="min-w-[140px] transition-all duration-200 hover:scale-105"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    
    {currentOrganization && (
      <SubscriptionModal
        open={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        organizationId={currentOrganization.id}
        onSuccess={handleSubscriptionSuccess}
      />
    )}
  </>
  );
}
