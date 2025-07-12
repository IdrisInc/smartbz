
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, UserMinus } from 'lucide-react';
import { RolesPermissionsTab } from './RolesPermissionsTab';

export function UserSettings() {
  const [users] = useState([
    { id: 1, name: 'John Admin', email: 'admin@bizwiz.com', role: 'Administrator', status: 'active' },
    { id: 2, name: 'Jane Manager', email: 'manager@bizwiz.com', role: 'Manager', status: 'active' },
    { id: 3, name: 'Bob Cashier', email: 'cashier@bizwiz.com', role: 'Cashier', status: 'inactive' }
  ]);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Cashier'
  });

  const handleAddUser = () => {
    console.log('Adding user:', newUser);
    setNewUser({ name: '', email: '', role: 'Cashier' });
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
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === 'Administrator' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                    <Badge variant={user.status === 'active' ? 'default' : 'outline'}>
                      {user.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
                <Label htmlFor="userName">Name</Label>
                <Input
                  id="userName"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
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
                  <SelectItem value="Administrator">Administrator</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Cashier">Cashier</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAddUser}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
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
