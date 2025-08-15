import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, CheckCircle, XCircle, AlertCircle, Monitor } from 'lucide-react';

interface BusinessOwner {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  organization_name?: string;
  organization_id?: string;
  organization_status?: string;
  subscription_plan?: string;
  joined_at: string;
  last_seen?: string;
}

export function BusinessOwnersManagement() {
  const [businessOwners, setBusinessOwners] = useState<BusinessOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOwner, setSelectedOwner] = useState<BusinessOwner | null>(null);
  const [actionType, setActionType] = useState<string>('');
  const [actionNotes, setActionNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadBusinessOwners();
  }, []);

  const loadBusinessOwners = async () => {
    try {
      // Get organization memberships for business owners
      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_memberships')
        .select(`
          user_id,
          organization_id,
          role,
          joined_at
        `)
        .eq('role', 'business_owner');

      if (membershipError) throw membershipError;

      // Get organizations for those memberships
      const orgIds = membershipData?.map(m => m.organization_id) || [];
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          status,
          subscription_plan
        `)
        .in('id', orgIds);

      if (orgError) throw orgError;

      // Get profiles for the users
      const userIds = membershipData?.map(m => m.user_id) || [];
      let profileData = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            user_id,
            first_name,
            last_name,
            display_name
          `)
          .in('user_id', userIds);

        if (profileError) {
          console.warn('Error loading profiles:', profileError);
        } else {
          profileData = profiles || [];
        }
      }

      // Transform the data to match our interface
      const owners = membershipData?.map((membership: any) => {
        const organization = orgData?.find(org => org.id === membership.organization_id);
        const profile = profileData?.find((p: any) => p.user_id === membership.user_id);
        
        return {
          id: profile?.id || membership.user_id,
          email: profile?.display_name || 'No email',
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          organization_name: organization?.name,
          organization_id: membership.organization_id,
          organization_status: organization?.status,
          subscription_plan: organization?.subscription_plan,
          joined_at: membership.joined_at,
        };
      }) || [];

      setBusinessOwners(owners);
    } catch (error) {
      console.error('Error loading business owners:', error);
      toast({
        title: "Error",
        description: "Failed to load business owners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (owner: BusinessOwner, action: string) => {
    setSelectedOwner(owner);
    setActionType(action);
  };

  const executeAction = async () => {
    if (!selectedOwner || !actionType) return;

    try {
      // Log the action
      const { error: logError } = await supabase
        .from('super_admin_actions')
        .insert({
          super_admin_id: (await supabase.auth.getUser()).data.user?.id,
          target_user_id: selectedOwner.id,
          target_organization_id: selectedOwner.organization_id,
          action_type: actionType,
          action_details: {
            notes: actionNotes,
            previous_status: selectedOwner.organization_status,
          },
        });

      if (logError) throw logError;

      // Update organization status based on action
      let newStatus = selectedOwner.organization_status;
      switch (actionType) {
        case 'approve':
          newStatus = 'active';
          break;
        case 'suspend':
          newStatus = 'suspended';
          break;
        case 'activate':
          newStatus = 'active';
          break;
      }

      if (actionType !== 'monitor') {
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ 
            status: newStatus,
            approved_by: (await supabase.auth.getUser()).data.user?.id,
            approved_at: new Date().toISOString()
          })
          .eq('id', selectedOwner.organization_id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Action completed",
        description: `${actionType} action completed successfully`,
      });

      // Reload data
      await loadBusinessOwners();
      setSelectedOwner(null);
      setActionType('');
      setActionNotes('');
    } catch (error) {
      console.error('Error executing action:', error);
      toast({
        title: "Error",
        description: "Failed to execute action",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPlanBadge = (plan?: string) => {
    switch (plan) {
      case 'premium':
        return <Badge variant="default" className="bg-purple-500">Premium</Badge>;
      case 'enterprise':
        return <Badge variant="default" className="bg-blue-500">Enterprise</Badge>;
      case 'free':
        return <Badge variant="outline">Free</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  if (loading) {
    return <div>Loading business owners...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Owners Management</CardTitle>
          <CardDescription>
            Manage all business owners and their organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businessOwners.map((owner) => (
                <TableRow key={owner.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {owner.first_name} {owner.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {owner.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{owner.organization_name}</TableCell>
                  <TableCell>{getStatusBadge(owner.organization_status)}</TableCell>
                  <TableCell>{getPlanBadge(owner.subscription_plan)}</TableCell>
                  <TableCell>
                    {new Date(owner.joined_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(owner, 'monitor')}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      
                      {owner.organization_status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(owner, 'approve')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {owner.organization_status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(owner, 'suspend')}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {owner.organization_status === 'suspended' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(owner, 'activate')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedOwner} onOpenChange={() => setSelectedOwner(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType.charAt(0).toUpperCase() + actionType.slice(1)} Organization
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionType} this organization?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Organization</Label>
              <p className="text-sm text-muted-foreground">
                {selectedOwner?.organization_name}
              </p>
            </div>
            
            <div>
              <Label>Owner</Label>
              <p className="text-sm text-muted-foreground">
                {selectedOwner?.first_name} {selectedOwner?.last_name}
              </p>
            </div>
            
            <div>
              <Label htmlFor="action-notes">Notes</Label>
              <Textarea
                id="action-notes"
                placeholder="Add notes about this action..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSelectedOwner(null)}>
                Cancel
              </Button>
              <Button onClick={executeAction}>
                Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}