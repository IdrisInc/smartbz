import React from 'react';
import { AlertTriangle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { SubscriptionModal } from './EnhancedSubscriptionModal';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';

interface UpgradePromptProps {
  feature: 'business' | 'branch' | 'staff' | 'finance' | 'advanced_reports' | 'integrations';
  action: string;
  open: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

export function UpgradePrompt({ feature, action, open, onClose, onUpgrade }: UpgradePromptProps) {
  const { currentPlan, getNextPlan } = useSubscriptionLimits();
  const [showSubscription, setShowSubscription] = React.useState(false);
  
  const nextPlan = getNextPlan();

  const getFeatureMessage = () => {
    switch (feature) {
      case 'business':
        return `Your ${currentPlan} plan allows only 1 business. Upgrade to ${nextPlan} to manage multiple businesses.`;
      case 'branch':
        return `You've reached the branch limit for your ${currentPlan} plan. Upgrade to ${nextPlan} for more branches.`;
      case 'staff':
        return `You've reached the staff limit for your ${currentPlan} plan. Upgrade to ${nextPlan} for more staff members.`;
      case 'finance':
        return `Finance module is available on Pro and Enterprise plans. Upgrade to access advanced financial features.`;
      case 'advanced_reports':
        return `Advanced reporting is available on Pro and Enterprise plans. Upgrade for detailed analytics.`;
      case 'integrations':
        return `API integrations are available on Pro and Enterprise plans. Upgrade to connect with third-party services.`;
      default:
        return `This feature requires a higher plan. Upgrade to access all features.`;
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg p-6 max-w-md w-full">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Upgrade Required</AlertTitle>
            <AlertDescription className="mt-2">
              {getFeatureMessage()}
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={() => setShowSubscription(true)}
              className="flex-1"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </div>
      </div>

      <SubscriptionModal
        open={showSubscription}
        onClose={() => {
          setShowSubscription(false);
          onClose();
        }}
        organizationId={''} // Will be handled by the component
        highlightFeature={feature}
        onSuccess={() => {
          setShowSubscription(false);
          onClose();
          onUpgrade?.();
        }}
      />
    </>
  );
}