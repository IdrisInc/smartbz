
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, UserMinus, Loader2, Eye, Pencil, MoreHorizontal } from 'lucide-react';
import { RolesPermissionsTab } from './RolesPermissionsTab';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function UserSettings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState({ firstName: '', lastName: '', role: '' });
  const [updating, setUpdating] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'sales_staff'
  });

  useEffect(() => {
    if (currentOrganization) {
      fetchUsers();
    }
  }, [currentOrganization]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organization_memberships')
        .select(`
          id,
          role,
          joined_at,
          user_id
        `)
        .eq('organization_id', currentOrganization?.id);

      if (error) throw error;

      // Fetch profiles separately for each user
      const usersWithProfiles = await Promise.all(
        (data || []).map(async (membership) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, display_name, user_id')
            .eq('user_id', membership.user_id)
            .maybeSingle();

          // Extract email from display_name if it looks like an email (fallback from auth)
          let email = '';
          if (profile?.display_name && profile.display_name.includes('@')) {
            email = profile.display_name;
          }

          // Generate a meaningful name from profile data
          let displayName = 'User';
          if (profile) {
            if (profile.first_name || profile.last_name) {
              displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            } else if (profile.display_name && !profile.display_name.includes('@')) {
              displayName = profile.display_name;
            }
          }
          
          // If no profile or empty name, show truncated user ID
          if (displayName === 'User' || !displayName) {
            displayName = `User (${membership.user_id.substring(0, 8)}...)`;
          }

          return {
            ...membership,
            profiles: {
              id: profile?.id || membership.user_id,
              first_name: profile?.first_name || '',
              last_name: profile?.last_name || '',
              display_name: displayName,
              email: email,
              user_id: membership.user_id,
              has_profile: !!profile
            }
          };
        })
      );

      setUsers(usersWithProfiles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!currentOrganization?.id) {
      toast({
        title: "Error",
        description: "No organization selected",
        variant: "destructive",
      });
      return;
    }

    try {
      setAdding(true);

      // Use edge function to create user and membership in one transaction
      // This avoids the session issue when using signUp directly
      const { data: result, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUser.email,
          password: newUser.password,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          organizationId: currentOrganization.id
        }
      });

      if (error) {
        // Handle FunctionsHttpError specifically
        if (error.message && error.message.includes('Edge Function returned a non-2xx status code')) {
          throw new Error('Failed to create user. The email may already be in use or there was a server error.');
        }
        throw error;
      }

      // Check if the function returned an error in the response data
      if (result?.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Success", 
        description: "User created successfully",
      });

      setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'sales_staff' });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('organization_memberships')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', currentOrganization?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User removed successfully",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive",
      });
    }
  };

  const handleViewUser = (membership: any) => {
    setSelectedUser(membership);
    setViewDialogOpen(true);
  };

  const handleEditUser = (membership: any) => {
    setSelectedUser(membership);
    setEditingUser({
      firstName: membership.profiles.first_name || '',
      lastName: membership.profiles.last_name || '',
      role: membership.role
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      setUpdating(true);

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', selectedUser.user_id)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: editingUser.firstName,
            last_name: editingUser.lastName,
            display_name: `${editingUser.firstName} ${editingUser.lastName}`.trim()
          })
          .eq('user_id', selectedUser.user_id);

        if (profileError) throw profileError;
      } else {
        // Insert new profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: selectedUser.user_id,
            user_id: selectedUser.user_id,
            first_name: editingUser.firstName,
            last_name: editingUser.lastName,
            display_name: `${editingUser.firstName} ${editingUser.lastName}`.trim()
          });

        if (insertError) throw insertError;
      }

      // Update role in membership
      const { error: membershipError } = await supabase
        .from('organization_memberships')
        .update({ role: editingUser.role as 'admin_staff' | 'business_owner' | 'cashier' | 'finance_staff' | 'inventory_staff' | 'manager' | 'sales_staff' | 'super_admin' })
        .eq('user_id', selectedUser.user_id)
        .eq('organization_id', currentOrganization?.id);

      if (membershipError) throw membershipError;

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Tabs defaultValue="users" className="space-y-4">
      <TabsList>
        <TabsTrigger value="users">User Management</TabsTrigger>
        <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user accounts and assign roles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((membership) => (
                  <div key={membership.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {membership.profiles.display_name}
                      </div>
                      {membership.profiles.email && (
                        <div className="text-sm text-muted-foreground">
                          {membership.profiles.email}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Joined: {new Date(membership.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={membership.role === 'business_owner' ? 'default' : 'secondary'}>
                        {membership.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewUser(membership)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditUser(membership)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRemoveUser(membership.profiles.user_id)}
                            disabled={membership.role === 'business_owner'}
                            className="text-destructive"
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remove User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No users found in this organization
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add New User</CardTitle>
            <CardDescription>
              Invite new team members to your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email *</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Enter password (min 6 characters)"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userRole">Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
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

            <Button onClick={handleAddUser} disabled={adding}>
              {adding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {adding ? 'Creating User...' : 'Add User'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="roles">
        <RolesPermissionsTab />
      </TabsContent>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View user information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">First Name</Label>
                  <p className="font-medium">{selectedUser.profiles.first_name || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Name</Label>
                  <p className="font-medium">{selectedUser.profiles.last_name || 'Not set'}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Display Name</Label>
                <p className="font-medium">{selectedUser.profiles.display_name}</p>
              </div>
              {selectedUser.profiles.email && (
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUser.profiles.email}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Role</Label>
                <div className="mt-1">
                  <Badge variant={selectedUser.role === 'business_owner' ? 'default' : 'secondary'}>
                    {selectedUser.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Joined Date</Label>
                <p className="font-medium">{new Date(selectedUser.joined_at).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">User ID</Label>
                <p className="font-mono text-sm text-muted-foreground">{selectedUser.user_id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={editingUser.firstName}
                  onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={editingUser.lastName}
                  onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select 
                value={editingUser.role} 
                onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
              >
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={updating}>
              {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {updating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
