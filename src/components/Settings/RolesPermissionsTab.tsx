
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Edit } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrganizationMember {
  id: string;
  user_id: string;
  role: 'admin' | 'business_owner' | 'manager' | 'cashier' | 'staff';
  is_owner: boolean;
  joined_at: string;
  branch_id?: string;
}

interface Branch {
  id: string;
  name: string;
  address?: string;
}

export function RolesPermissionsTab() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'cashier' | 'staff'>('staff');
  const [inviteBranch, setInviteBranch] = useState<string>('');

  useEffect(() => {
    if (currentOrganization) {
      loadMembersAndBranches();
    }
  }, [currentOrganization]);

  const loadMembersAndBranches = async () => {
    try {
      setLoading(true);
      
      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from('organization_memberships')
        .select('*')
        .eq('organization_id', currentOrganization?.id);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Load branches
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('id, name, address')
        .eq('organization_id', currentOrganization?.id)
        .eq('is_active', true);

      if (branchesError) throw branchesError;
      setBranches(branchesData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load members and branches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail || !currentOrganization) return;

    try {
      // In a real app, you'd send an invitation email
      // For now, we'll just show a message
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail} as ${inviteRole}`,
      });
      
      setInviteEmail('');
      setInviteRole('staff');
      setInviteBranch('');
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'business_owner': return 'default';
      case 'manager': return 'secondary';
      case 'cashier': return 'outline';
      default: return 'outline';
    }
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full system access, manage all organizations';
      case 'business_owner':
        return 'Full organization access, manage all branches';
      case 'manager':
        return 'Branch management, view reports, manage staff';
      case 'cashier':
        return 'Process sales, view products';
      case 'staff':
        return 'Basic access, assigned tasks only';
      default:
        return 'Limited access';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage your organization members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.branch_id 
                        ? branches.find(b => b.id === member.branch_id)?.name || 'Unknown'
                        : 'All branches'
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(member.joined_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {!member.is_owner && (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Invite New Member */}
        <Card>
          <CardHeader>
            <CardTitle>Invite Team Member</CardTitle>
            <CardDescription>
              Add new members to your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="inviteEmail">Email Address</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="member@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="inviteRole">Role</Label>
              <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {branches.length > 0 && (
              <div>
                <Label htmlFor="inviteBranch">Branch (Optional)</Label>
                <Select value={inviteBranch} onValueChange={setInviteBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button onClick={handleInviteMember} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              Send Invitation
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Understanding what each role can do in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['admin', 'business_owner', 'manager', 'cashier', 'staff'].map((role) => (
              <div key={role} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Badge variant={getRoleBadgeVariant(role)} className="mb-2">
                    {role.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {getRolePermissions(role)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
