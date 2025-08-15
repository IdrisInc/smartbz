import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionEditorProps {
  subscription: any;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function SubscriptionEditor({ subscription, open, onClose, onUpdate }: SubscriptionEditorProps) {
  const [plan, setPlan] = useState(subscription?.plan || 'free');
  const [status, setStatus] = useState(subscription?.status || 'active');
  const [customAmount, setCustomAmount] = useState(subscription?.amount || 0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const planPricing = {
    free: 0,
    base: 29,
    pro: 99,
    enterprise: 299
  };

  const handleSave = async () => {
    if (!subscription) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          subscription_plan: plan,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      // Log the admin action
      await supabase.from('super_admin_actions').insert({
        super_admin_id: (await supabase.auth.getUser()).data.user?.id,
        target_organization_id: subscription.id,
        action_type: 'subscription_update',
        action_details: {
          previous_plan: subscription.plan,
          new_plan: plan,
          previous_status: subscription.status,
          new_status: status,
          custom_amount: customAmount
        }
      });

      toast({
        title: "Success",
        description: "Subscription updated successfully"
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Business Name</Label>
                  <p className="text-sm text-muted-foreground">{subscription?.business_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Owner</Label>
                  <p className="text-sm text-muted-foreground">{subscription?.owner_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Usage</Label>
                  <div className="text-sm text-muted-foreground">
                    {subscription?.branches_count} branches, {subscription?.staff_count} staff
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(subscription?.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plan">Subscription Plan</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">
                    <div className="flex items-center gap-2">
                      Free <Badge variant="outline">${planPricing.free}/mo</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="base">
                    <div className="flex items-center gap-2">
                      Base <Badge variant="secondary">${planPricing.base}/mo</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="pro">
                    <div className="flex items-center gap-2">
                      Pro <Badge variant="default">${planPricing.pro}/mo</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="enterprise">
                    <div className="flex items-center gap-2">
                      Enterprise <Badge variant="destructive">${planPricing.enterprise}/mo</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="custom-amount">Custom Amount (Override)</Label>
            <Input
              id="custom-amount"
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(Number(e.target.value))}
              placeholder="Enter custom amount"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Leave as is to use standard pricing: ${planPricing[plan as keyof typeof planPricing]}/month
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}