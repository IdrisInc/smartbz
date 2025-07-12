
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Shield, Users } from 'lucide-react';

const mockRoles = [
  { 
    id: 1, 
    name: 'Administrator', 
    description: 'Full system access', 
    userCount: 2, 
    permissions: {
      dashboard: true, products: true, sales: true, inventory: true, 
      finance: true, employees: true, reports: true, settings: true, contacts: true
    }
  },
  { 
    id: 2, 
    name: 'Manager', 
    description: 'Management level access', 
    userCount: 5, 
    permissions: {
      dashboard: true, products: true, sales: true, inventory: true, 
      finance: true, employees: true, reports: true, settings: false, contacts: true
    }
  },
  { 
    id: 3, 
    name: 'Cashier', 
    description: 'Point of sale access', 
    userCount: 8, 
    permissions: {
      dashboard: true, products: false, sales: true, inventory: false, 
      finance: false, employees: false, reports: false, settings: false, contacts: true
    }
  },
  { 
    id: 4, 
    name: 'Viewer', 
    description: 'Read-only access', 
    userCount: 3, 
    permissions: {
      dashboard: true, products: false, sales: false, inventory: false, 
      finance: false, employees: false, reports: true, settings: false, contacts: false
    }
  }
];

const systemModules = [
  { key: 'dashboard', name: 'Dashboard', description: 'View main dashboard' },
  { key: 'products', name: 'Products', description: 'Manage product catalog' },
  { key: 'sales', name: 'Sales', description: 'Process sales and POS' },
  { key: 'inventory', name: 'Inventory', description: 'Manage stock levels' },
  { key: 'finance', name: 'Finance', description: 'View financial data' },
  { key: 'employees', name: 'Employees', description: 'Manage staff' },
  { key: 'reports', name: 'Reports', description: 'Generate reports' },
  { key: 'contacts', name: 'Contacts', description: 'Manage customers' },
  { key: 'settings', name: 'Settings', description: 'System configuration' }
];

export function RolesPermissionsTab() {
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: {} as Record<string, boolean>
  });

  const handleCreateRole = () => {
    setIsCreating(true);
    setNewRole({
      name: '',
      description: '',
      permissions: systemModules.reduce((acc, module) => ({ ...acc, [module.key]: false }), {})
    });
  };

  const handleSaveRole = () => {
    console.log('Saving role:', newRole);
    setIsCreating(false);
    setNewRole({ name: '', description: '', permissions: {} });
  };

  const handlePermissionChange = (module: string, enabled: boolean) => {
    if (isCreating) {
      setNewRole(prev => ({
        ...prev,
        permissions: { ...prev.permissions, [module]: enabled }
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Roles & Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Manage user roles and their access to system modules
          </p>
        </div>
        <Button onClick={handleCreateRole}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Roles
            </CardTitle>
            <CardDescription>
              Manage roles and their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRoles.map((role) => (
                  <TableRow 
                    key={role.id}
                    className={selectedRole === role.id ? 'bg-muted' : ''}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{role.name}</div>
                        <div className="text-sm text-muted-foreground">{role.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{role.userCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedRole(role.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
            <CardTitle>
              {isCreating ? 'Create New Role' : selectedRole ? `Edit ${mockRoles.find(r => r.id === selectedRole)?.name}` : 'Module Permissions'}
            </CardTitle>
            <CardDescription>
              {isCreating ? 'Configure permissions for the new role' : 'Select a role to view and edit its permissions'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isCreating && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roleName">Role Name</Label>
                  <Input
                    id="roleName"
                    value={newRole.name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter role name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleDescription">Description</Label>
                  <Input
                    id="roleDescription"
                    value={newRole.description}
                    onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter role description"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-medium">Module Access</Label>
              {systemModules.map((module) => {
                const currentRole = selectedRole ? mockRoles.find(r => r.id === selectedRole) : null;
                const hasPermission = isCreating 
                  ? newRole.permissions[module.key] 
                  : currentRole?.permissions[module.key as keyof typeof currentRole.permissions];

                return (
                  <div key={module.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{module.name}</div>
                      <div className="text-sm text-muted-foreground">{module.description}</div>
                    </div>
                    <Switch
                      checked={hasPermission || false}
                      onCheckedChange={(checked) => handlePermissionChange(module.key, checked)}
                      disabled={!isCreating && !selectedRole}
                    />
                  </div>
                );
              })}
            </div>

            {isCreating && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveRole}>Create Role</Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
