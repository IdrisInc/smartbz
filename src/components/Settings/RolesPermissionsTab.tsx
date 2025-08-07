
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Edit, Mail } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RolePermissionEditor } from './RolePermissionEditor';
import { RoleManagementGuide } from './RoleManagementGuide';
import { RoleSystemGuide } from './RoleSystemGuide';

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
  const [inviteBranch, setInviteBranch] = useState<string>('all');

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
      setInviteBranch('all');
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
    <Tabs defaultValue="members" className="space-y-4">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="members">Team Members</TabsTrigger>
        <TabsTrigger value="permissions">Custom Permissions</TabsTrigger>
        <TabsTrigger value="guide">Role Guide</TabsTrigger>
        <TabsTrigger value="workflow">System Workflow</TabsTrigger>
        <TabsTrigger value="contacts">Contact Management</TabsTrigger>
      </TabsList>

      <TabsContent value="members">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage your organization members</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Branch</TableHead>
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
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invite Team Member</CardTitle>
              <CardDescription>Add new members to your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="member@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInviteMember} className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Send Invitation
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="permissions">
        <RolePermissionEditor />
      </TabsContent>

      <TabsContent value="guide">
        <RoleManagementGuide />
      </TabsContent>

      <TabsContent value="workflow">
        <RoleSystemGuide />
      </TabsContent>

      <TabsContent value="contacts">
        <Card>
          <CardHeader>
            <CardTitle>Contact & Address Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Contact management features will be implemented here.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
