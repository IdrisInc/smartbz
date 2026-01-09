
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Loader2 } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { SubscriptionModal } from './SubscriptionModal';
import { createSystemNotification, NotificationTemplates } from '@/lib/notificationService';

const businessSectors = [
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'construction', label: 'Construction' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'non_profit', label: 'Non-Profit' },
  { value: 'other', label: 'Other' },
];

interface BusinessRegistrationStepProps {
  onComplete: () => void;
}

export function BusinessRegistrationStep({ onComplete }: BusinessRegistrationStepProps) {
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    description: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);
  const { createOrganization } = useOrganization();
  const { toast } = useToast();
  const { checkOnboardingStatus } = useOnboarding();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sector) {
      toast({
        title: "Error",
        description: "Please fill in the required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newOrg = await createOrganization(
        formData.name.trim(),
        formData.sector as any,
        formData.description.trim() || undefined
      );
      
      if (newOrg) {
        setCreatedOrgId(newOrg.id);
        
        // Notify super admins about the new organization
        const notification = NotificationTemplates.organizationCreated(formData.name.trim());
        await createSystemNotification({
          ...notification,
          // No specific userId - this notification goes to super admins (user_id = null)
        });
        
        setShowSubscriptionModal(true);
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: "Failed to save business details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionSuccess = async () => {
    toast({
      title: "Success!",
      description: "Business details saved successfully",
    });
    // Refresh onboarding status
    await checkOnboardingStatus();
    onComplete();
  };

  return (
    <>
      <Card className="animate-slide-in-right glass-effect border-white/30 shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-4 bg-white/20 rounded-full backdrop-blur-sm">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-3xl text-white font-bold">Business Information</CardTitle>
        <CardDescription className="text-white/80 text-lg">
          Tell us about your business to get started with BizWiz
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your Business Name"
                required
                className="transition-all duration-200 focus:scale-105"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Business Sector *</Label>
              <Select value={formData.sector} onValueChange={(value) => setFormData({ ...formData, sector: value })} required>
                <SelectTrigger className="transition-all duration-200 focus:scale-105">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {businessSectors.map((sector) => (
                    <SelectItem key={sector.value} value={sector.value}>
                      {sector.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Business Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of your business"
              rows={3}
              className="transition-all duration-200 focus:scale-105"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourwebsite.com"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Business Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@yourcompany.com"
                className="transition-all duration-200 focus:scale-105"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Your City"
                className="transition-all duration-200 focus:scale-105"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street address"
              rows={2}
              className="transition-all duration-200 focus:scale-105"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={loading || !formData.name.trim() || !formData.sector}
              className="min-w-[140px] transition-all duration-200 hover:scale-105"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue to Branch Setup'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    
    {createdOrgId && (
      <SubscriptionModal
        open={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        organizationId={createdOrgId}
        onSuccess={handleSubscriptionSuccess}
      />
    )}
  </>
  );
}
