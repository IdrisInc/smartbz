
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Edit, Mail, Save, Loader2 } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RolePermissionEditor } from './RolePermissionEditor';
import { RoleManagementGuide } from './RoleManagementGuide';
import { RoleSystemGuide } from './RoleSystemGuide';

type UserRole = 'super_admin' | 'business_owner' | 'manager' | 'admin_staff' | 'sales_staff' | 'inventory_staff' | 'finance_staff' | 'cashier';

interface OrganizationMember {
  id: string;
  user_id: string;
  role: UserRole;
  is_owner: boolean;
  joined_at: string;
  branch_id?: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
  };
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
  const [inviteRole, setInviteRole] = useState<UserRole>('admin_staff');
  const [inviteBranch, setInviteBranch] = useState<string>('all');
  
  // Edit role dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('admin_staff');
  const [editBranch, setEditBranch] = useState<string>('all');
  const [saving, setSaving] = useState(false);

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

      // Load profiles for each member
      const membersWithProfiles: OrganizationMember[] = [];
      for (const member of membersData || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, display_name')
          .eq('user_id', member.user_id)
          .maybeSingle();
        
        membersWithProfiles.push({
          ...member,
          profile: profile || undefined
        });
      }
      
      setMembers(membersWithProfiles);

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
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail} as ${inviteRole.replace(/_/g, ' ')}`,
      });
      
      setInviteEmail('');
      setInviteRole('admin_staff');
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

  const openEditDialog = (member: OrganizationMember) => {
    setSelectedMember(member);
    setEditRole(member.role);
    setEditBranch(member.branch_id || 'all');
    setEditDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedMember || !currentOrganization) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('organization_memberships')
        .update({
          role: editRole,
          branch_id: editBranch === 'all' ? null : editBranch,
          is_owner: editRole === 'business_owner'
        })
        .eq('id', selectedMember.id);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `Member role updated to ${editRole.replace(/_/g, ' ')}`,
      });

      setEditDialogOpen(false);
      loadMembersAndBranches();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getMemberName = (member: OrganizationMember) => {
    if (member.profile) {
      const firstName = member.profile.first_name || '';
      const lastName = member.profile.last_name || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
      if (member.profile.display_name) {
        return member.profile.display_name;
      }
    }
    return 'Unknown User';
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'business_owner': return 'default';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <>
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
                <CardDescription>Manage your organization members and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {getMemberName(member)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            {formatRole(member.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.branch_id 
                            ? branches.find(b => b.id === member.branch_id)?.name || 'Unknown'
                            : 'All branches'
                          }
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditDialog(member)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Role
                          </Button>
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
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    placeholder="member@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(value: UserRole) => setInviteRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business_owner">Business Owner</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin_staff">Admin Staff</SelectItem>
                      <SelectItem value="sales_staff">Sales Staff</SelectItem>
                      <SelectItem value="inventory_staff">Inventory Staff</SelectItem>
                      <SelectItem value="finance_staff">Finance Staff</SelectItem>
                      <SelectItem value="cashier">Cashier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assign to Branch</Label>
                  <Select value={inviteBranch} onValueChange={setInviteBranch}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member Role</DialogTitle>
            <DialogDescription>
              Change role and branch assignment for {selectedMember ? getMemberName(selectedMember) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(value: UserRole) => setEditRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business_owner">Business Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin_staff">Admin Staff</SelectItem>
                  <SelectItem value="sales_staff">Sales Staff</SelectItem>
                  <SelectItem value="inventory_staff">Inventory Staff</SelectItem>
                  <SelectItem value="finance_staff">Finance Staff</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Branch Assignment</Label>
              <Select value={editBranch} onValueChange={setEditBranch}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
