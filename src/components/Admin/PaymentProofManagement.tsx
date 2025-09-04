import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Check, X } from 'lucide-react';

interface PaymentProof {
  id: string;
  organization_id: string;
  user_id: string;
  plan: string;
  payment_type: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id?: string;
  proof_image_url?: string;
  notes?: string;
  status: string;
  admin_notes?: string;
  created_at: string;
  organizations?: any;
  profiles?: any;
  // Enriched fields
  activation_code?: string;
  activation_status?: string;
  activation_expires_at?: string;
}

export function PaymentProofManagement() {
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPaymentProofs();
  }, []);

  const loadPaymentProofs = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_proofs')
        .select(`
          *,
          organizations:organization_id(name),
          profiles:user_id(display_name, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const proofs = data || [];
      if (proofs.length === 0) {
        setProofs([]);
        return;
      }

      // Fetch activation codes linked to these proofs
      const proofIds = proofs.map((p) => p.id);
      const { data: codes, error: codesError } = await supabase
        .from('activation_codes')
        .select('payment_proof_id, code, status, expires_at')
        .in('payment_proof_id', proofIds);

      if (codesError) {
        // Non-fatal: still show proofs even if codes failed to load
        console.error('Failed to load activation codes', codesError);
      }

      const codeMap = new Map(
        (codes || []).map((c: any) => [c.payment_proof_id, c])
      );

      const enriched = proofs.map((p: any) => ({
        ...p,
        activation_code: codeMap.get(p.id)?.code,
        activation_status: codeMap.get(p.id)?.status,
        activation_expires_at: codeMap.get(p.id)?.expires_at,
      }));

      setProofs(enriched);
    } catch (error: any) {
      toast({
        title: 'Error loading payment proofs',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (proof: PaymentProof) => {
    setProcessing(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Approve the payment proof
      const { error: updateError } = await supabase
        .from('payment_proofs')
        .update({
          status: 'approved',
          admin_notes: adminNotes,
          approved_by: user.user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', proof.id);

      if (updateError) throw updateError;

      // Generate activation code
      const durationDays = proof.payment_type === 'yearly' ? 365 : 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Code expires in 7 days if not used

      const { data: codeData, error: codeError } = await supabase.rpc('generate_activation_code');
      if (codeError) throw codeError;

      const { error: insertError } = await supabase
        .from('activation_codes')
        .insert({
          code: codeData,
          plan: proof.plan as 'free' | 'basic' | 'premium' | 'enterprise',
          payment_type: proof.payment_type,
          duration_days: durationDays,
          payment_proof_id: proof.id,
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) throw insertError;

      toast({
        title: 'Payment approved',
        description: `Activation code generated: ${codeData}`,
      });

      setSelectedProof(null);
      setAdminNotes('');
      loadPaymentProofs();
    } catch (error: any) {
      toast({
        title: 'Error approving payment',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (proof: PaymentProof) => {
    if (!adminNotes.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide admin notes for rejection',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('payment_proofs')
        .update({
          status: 'rejected',
          admin_notes: adminNotes,
          approved_by: user.user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', proof.id);

      if (error) throw error;

      toast({
        title: 'Payment rejected',
        description: 'The payment proof has been rejected.',
      });

      setSelectedProof(null);
      setAdminNotes('');
      loadPaymentProofs();
    } catch (error: any) {
      toast({
        title: 'Error rejecting payment',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };
 
  const generateCodeForProof = async (proof: PaymentProof) => {
    setProcessing(true);
    try {
      const durationDays = proof.payment_type === 'yearly' ? 365 : 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
 
      const { data: codeData, error: codeError } = await supabase.rpc('generate_activation_code');
      if (codeError) throw codeError;
 
      const { error: insertError } = await supabase
        .from('activation_codes')
        .insert({
          code: codeData,
          plan: proof.plan as 'free' | 'basic' | 'premium' | 'enterprise',
          payment_type: proof.payment_type,
          duration_days: durationDays,
          payment_proof_id: proof.id,
          expires_at: expiresAt.toISOString(),
        });
 
      if (insertError) throw insertError;
 
      toast({
        title: 'Activation code generated',
        description: `Code: ${codeData}`,
      });
 
      setSelectedProof(null);
      setAdminNotes('');
      loadPaymentProofs();
    } catch (error: any) {
      toast({
        title: 'Error generating code',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };
 
  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
    } as const;
 
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getUserName = (proof: PaymentProof) => {
    const profile = proof.profiles as any;
    if (profile?.display_name) return profile.display_name;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return 'Unknown User';
  };

  if (loading) {
    return <div>Loading payment proofs...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Proof Management</CardTitle>
        <CardDescription>Review and manage manual payment submissions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Activation Code</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proofs.map((proof) => (
              <TableRow key={proof.id}>
                <TableCell>{getUserName(proof)}</TableCell>
                <TableCell>{(proof.organizations as any)?.name || 'Unknown'}</TableCell>
                <TableCell className="capitalize">{proof.plan} ({proof.payment_type})</TableCell>
                <TableCell>{proof.amount} {proof.currency}</TableCell>
                <TableCell className="capitalize">{proof.payment_method.replace('_', ' ')}</TableCell>
                <TableCell>{getStatusBadge(proof.status)}</TableCell>
                <TableCell>{new Date(proof.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="font-mono">{proof.activation_code || '—'}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProof(proof);
                          setAdminNotes(proof.admin_notes || '');
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Payment Proof Details</DialogTitle>
                        <DialogDescription>
                          Review payment submission for {getUserName(proof)}
                        </DialogDescription>
                      </DialogHeader>
                      {selectedProof && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>User</Label>
                              <p className="text-sm font-medium">{getUserName(selectedProof)}</p>
                            </div>
                            <div>
                              <Label>Organization</Label>
                              <p className="text-sm font-medium">{(selectedProof.organizations as any)?.name}</p>
                            </div>
                            <div>
                              <Label>Plan</Label>
                              <p className="text-sm font-medium">{selectedProof.plan} ({selectedProof.payment_type})</p>
                            </div>
                            <div>
                              <Label>Amount</Label>
                              <p className="text-sm font-medium">{selectedProof.amount} {selectedProof.currency}</p>
                            </div>
                            <div>
                              <Label>Payment Method</Label>
                              <p className="text-sm font-medium">{selectedProof.payment_method.replace('_', ' ')}</p>
                            </div>
                            <div>
                              <Label>Transaction ID</Label>
                              <p className="text-sm font-medium">{selectedProof.transaction_id || 'N/A'}</p>
                            </div>
                          </div>

                          {selectedProof.notes && (
                            <div>
                              <Label>User Notes</Label>
                              <p className="text-sm bg-muted p-3 rounded">{selectedProof.notes}</p>
                            </div>
                          )}

                          {selectedProof.proof_image_url && (
                            <div>
                              <Label>Proof Image</Label>
                              <img 
                                src={selectedProof.proof_image_url} 
                                alt="Payment proof" 
                                className="max-w-full h-auto rounded border"
                              />
                            </div>
                          )}

                          <div>
                            <Label>Admin Notes</Label>
                            <Textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Add notes about this payment..."
                              className="mt-1"
                            />
                          </div>

                          {selectedProof.activation_code && (
                            <div>
                              <Label>Activation Code</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm font-mono">{selectedProof.activation_code}</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => selectedProof.activation_code && navigator.clipboard.writeText(selectedProof.activation_code)}
                                >
                                  Copy
                                </Button>
                              </div>
                            </div>
                          )}

                          {selectedProof.status === 'approved' && !selectedProof.activation_code && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => generateCodeForProof(selectedProof)}
                                disabled={processing}
                                className="flex-1"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Generate Activation Code
                              </Button>
                            </div>
                          )}

                          {selectedProof.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApprove(selectedProof)}
                                disabled={processing}
                                className="flex-1"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Approve & Generate Code
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleReject(selectedProof)}
                                disabled={processing || !adminNotes.trim()}
                                className="flex-1"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {proofs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No payment proofs found
          </div>
        )}
      </CardContent>
    </Card>
  );
}