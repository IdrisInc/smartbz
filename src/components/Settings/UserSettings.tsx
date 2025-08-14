
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, UserMinus, Loader2 } from 'lucide-react';
import { RolesPermissionsTab } from './RolesPermissionsTab';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

export function UserSettings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'staff'
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
            .single();

          return {
            ...membership,
            profiles: profile || {
              id: membership.user_id,
              first_name: 'Unknown',
              last_name: 'User',
              display_name: 'Unknown User',
              user_id: membership.user_id
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

      setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'staff' });
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
                        {membership.profiles.display_name || `${membership.profiles.first_name} ${membership.profiles.last_name}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Joined: {new Date(membership.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={membership.role === 'business_owner' ? 'default' : 'secondary'}>
                        {membership.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemoveUser(membership.profiles.user_id)}
                        disabled={membership.role === 'business_owner'}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
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
                  <SelectItem value="staff">Staff</SelectItem>
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
    </Tabs>
  );
}
