import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

const redeemCodeSchema = z.object({
  code: z.string().min(1, 'Activation code is required').regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Invalid code format (e.g., ABC1-2DEF-3GHI)'),
});

type RedeemCodeForm = z.infer<typeof redeemCodeSchema>;

interface ActivationCodeRedemptionProps {
  onSuccess?: () => void;
}

export function ActivationCodeRedemption({ onSuccess }: ActivationCodeRedemptionProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentOrganization, refreshOrganizations } = useOrganization();

  const form = useForm<RedeemCodeForm>({
    resolver: zodResolver(redeemCodeSchema),
  });

  const handleSubmit = async (data: RedeemCodeForm) => {
    if (!currentOrganization) {
      toast({
        title: 'Error',
        description: 'No organization selected',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Check if code exists and is valid
      const { data: codeData, error: fetchError } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('code', data.code.toUpperCase())
        .eq('status', 'unused')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!codeData) {
        // Log the failed attempt
        await supabase.from('code_redemption_logs').insert({
          code_id: null,
          user_id: user.user.id,
          organization_id: currentOrganization.id,
          success: false,
          failure_reason: 'Invalid or expired code',
        });

        throw new Error('Invalid or expired activation code');
      }

      // Mark code as used
      const { error: updateError } = await supabase
        .from('activation_codes')
        .update({
          status: 'used',
          used_by: user.user.id,
          used_at: new Date().toISOString(),
        })
        .eq('id', codeData.id);

      if (updateError) throw updateError;

      // Update organization subscription
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + codeData.duration_days);

      const { error: orgUpdateError } = await supabase
        .from('organizations')
        .update({
          subscription_plan: codeData.plan,
          subscription_end: endDate.toISOString(),
          status: 'active',
        })
        .eq('id', currentOrganization.id);

      if (orgUpdateError) throw orgUpdateError;

      // Log successful redemption
      await supabase.from('code_redemption_logs').insert({
        code_id: codeData.id,
        user_id: user.user.id,
        organization_id: currentOrganization.id,
        success: true,
      });

      toast({
        title: 'Activation successful!',
        description: `Your ${codeData.plan} plan has been activated for ${codeData.duration_days} days.`,
      });

      form.reset();
      refreshOrganizations();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activate Subscription</CardTitle>
        <CardDescription>
          Enter your activation code to upgrade your subscription
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activation Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ABC1-2DEF-3GHI" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      className="font-mono tracking-wider"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Activating...' : 'Activate Subscription'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}