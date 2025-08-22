import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

const paymentProofSchema = z.object({
  plan: z.enum(['free', 'basic', 'premium', 'enterprise']),
  payment_type: z.enum(['monthly', 'yearly']),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  payment_method: z.enum(['mobile_money', 'bank_transfer', 'cash']),
  transaction_id: z.string().optional(),
  proof_image_url: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentProofForm = z.infer<typeof paymentProofSchema>;

interface PaymentProofSubmissionProps {
  onSuccess?: () => void;
}

export function PaymentProofSubmission({ onSuccess }: PaymentProofSubmissionProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();

  const form = useForm<PaymentProofForm>({
    resolver: zodResolver(paymentProofSchema),
    defaultValues: {
      currency: 'USD',
      payment_type: 'monthly',
    },
  });

  const handleSubmit = async (data: PaymentProofForm) => {
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

      const { error } = await supabase.from('payment_proofs').insert({
        organization_id: currentOrganization.id,
        user_id: user.user.id,
        plan: data.plan,
        payment_type: data.payment_type,
        amount: parseFloat(data.amount),
        currency: data.currency,
        payment_method: data.payment_method,
        transaction_id: data.transaction_id,
        proof_image_url: data.proof_image_url,
        notes: data.notes,
      });

      if (error) throw error;

      toast({
        title: 'Payment proof submitted',
        description: 'Your payment proof has been submitted for admin review.',
      });

      form.reset();
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
        <CardTitle>Submit Payment Proof</CardTitle>
        <CardDescription>
          Submit proof of your manual payment for subscription upgrade
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscription Plan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid</FormLabel>
                    <FormControl>
                      <Input placeholder="29.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="TZS">TZS</SelectItem>
                        <SelectItem value="KES">KES</SelectItem>
                        <SelectItem value="UGX">UGX</SelectItem>
                        <SelectItem value="RWF">RWF</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transaction_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="TXN123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proof_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proof Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/receipt.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information about the payment..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Submitting...' : 'Submit Payment Proof'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}