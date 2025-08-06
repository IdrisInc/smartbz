import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  key: string;
  label: string;
  description: string;
  category: string;
}

interface RolePermissions {
  [role: string]: {
    [permission: string]: boolean;
  };
}

const PERMISSIONS: Permission[] = [
  // Organization Management
  { key: 'canManageOrganizations', label: 'Manage Organizations', description: 'Create, edit, and delete organizations', category: 'Organization' },
  { key: 'canManageBranches', label: 'Manage Branches', description: 'Create, edit, and delete branches', category: 'Organization' },
  
  // User Management  
  { key: 'canManageUsers', label: 'Manage Users', description: 'Invite, edit, and remove users', category: 'Users' },
  { key: 'canManageRoles', label: 'Manage Roles', description: 'Assign and modify user roles', category: 'Users' },
  { key: 'canViewUserReports', label: 'View User Reports', description: 'Access user activity and performance reports', category: 'Users' },
  
  // Products & Inventory
  { key: 'canManageProducts', label: 'Manage Products', description: 'Create, edit, and delete products/services', category: 'Inventory' },
  { key: 'canManageInventory', label: 'Manage Inventory', description: 'Update stock levels and track inventory', category: 'Inventory' },
  { key: 'canViewInventoryReports', label: 'View Inventory Reports', description: 'Access inventory and stock reports', category: 'Inventory' },
  
  // Sales & Customer Management
  { key: 'canCreateSales', label: 'Create Sales', description: 'Process sales transactions', category: 'Sales' },
  { key: 'canManageCustomers', label: 'Manage Customers', description: 'Create, edit, and delete customer records', category: 'Sales' },
  { key: 'canViewSalesReports', label: 'View Sales Reports', description: 'Access sales analytics and reports', category: 'Sales' },
  { key: 'canApplyDiscounts', label: 'Apply Discounts', description: 'Apply discounts to sales transactions', category: 'Sales' },
  
  // Financial Management
  { key: 'canViewFinances', label: 'View Finances', description: 'Access financial data and reports', category: 'Finance' },
  { key: 'canManageInvoices', label: 'Manage Invoices', description: 'Create, edit, and send invoices', category: 'Finance' },
  { key: 'canManageExpenses', label: 'Manage Expenses', description: 'Record and categorize business expenses', category: 'Finance' },
  { key: 'canProcessRefunds', label: 'Process Refunds', description: 'Issue refunds for sales transactions', category: 'Finance' },
  
  // Employee Management
  { key: 'canManageEmployees', label: 'Manage Employees', description: 'Add, edit, and manage employee records', category: 'Employees' },
  { key: 'canManageAttendance', label: 'Manage Attendance', description: 'Track and manage employee attendance', category: 'Employees' },
  { key: 'canManagePayroll', label: 'Manage Payroll', description: 'Process payroll and manage salaries', category: 'Employees' },
  { key: 'canViewEmployeeReports', label: 'View Employee Reports', description: 'Access employee performance reports', category: 'Employees' },
  
  // System & Settings
  { key: 'canManageSettings', label: 'Manage Settings', description: 'Configure system settings and preferences', category: 'System' },
  { key: 'canViewLogs', label: 'View System Logs', description: 'Access system logs and audit trails', category: 'System' },
  { key: 'canManageIntegrations', label: 'Manage Integrations', description: 'Configure third-party integrations', category: 'System' },
];

const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  admin: Object.fromEntries(PERMISSIONS.map(p => [p.key, true])),
  business_owner: {
    canManageOrganizations: true,
    canManageBranches: true,
    canManageUsers: true,
    canManageRoles: true,
    canViewUserReports: true,
    canManageProducts: true,
    canManageInventory: true,
    canViewInventoryReports: true,
    canCreateSales: true,
    canManageCustomers: true,
    canViewSalesReports: true,
    canApplyDiscounts: true,
    canViewFinances: true,
    canManageInvoices: true,
    canManageExpenses: true,
    canProcessRefunds: true,
    canManageEmployees: true,
    canManageAttendance: true,
    canManagePayroll: true,
    canViewEmployeeReports: true,
    canManageSettings: true,
    canViewLogs: true,
    canManageIntegrations: true,
  },
  manager: {
    canManageOrganizations: false,
    canManageBranches: false,
    canManageUsers: false,
    canManageRoles: false,
    canViewUserReports: true,
    canManageProducts: true,
    canManageInventory: true,
    canViewInventoryReports: true,
    canCreateSales: true,
    canManageCustomers: true,
    canViewSalesReports: true,
    canApplyDiscounts: true,
    canViewFinances: true,
    canManageInvoices: true,
    canManageExpenses: true,
    canProcessRefunds: false,
    canManageEmployees: true,
    canManageAttendance: true,
    canManagePayroll: false,
    canViewEmployeeReports: true,
    canManageSettings: false,
    canViewLogs: false,
    canManageIntegrations: false,
  },
  staff: {
    canManageOrganizations: false,
    canManageBranches: false,
    canManageUsers: false,
    canManageRoles: false,
    canViewUserReports: false,
    canManageProducts: false,
    canManageInventory: true,
    canViewInventoryReports: false,
    canCreateSales: true,
    canManageCustomers: true,
    canViewSalesReports: false,
    canApplyDiscounts: false,
    canViewFinances: false,
    canManageInvoices: false,
    canManageExpenses: false,
    canProcessRefunds: false,
    canManageEmployees: false,
    canManageAttendance: false,
    canManagePayroll: false,
    canViewEmployeeReports: false,
    canManageSettings: false,
    canViewLogs: false,
    canManageIntegrations: false,
  },
  cashier: {
    canManageOrganizations: false,
    canManageBranches: false,
    canManageUsers: false,
    canManageRoles: false,
    canViewUserReports: false,
    canManageProducts: false,
    canManageInventory: false,
    canViewInventoryReports: false,
    canCreateSales: true,
    canManageCustomers: false,
    canViewSalesReports: false,
    canApplyDiscounts: false,
    canViewFinances: false,
    canManageInvoices: false,
    canManageExpenses: false,
    canProcessRefunds: false,
    canManageEmployees: false,
    canManageAttendance: false,
    canManagePayroll: false,
    canViewEmployeeReports: false,
    canManageSettings: false,
    canViewLogs: false,
    canManageIntegrations: false,
  }
};

export function RolePermissionEditor() {
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(DEFAULT_ROLE_PERMISSIONS);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved permissions from localStorage
    const saved = localStorage.getItem('customRolePermissions');
    if (saved) {
      try {
        setRolePermissions(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved permissions');
      }
    }
  }, []);

  const updatePermission = (role: string, permission: string, enabled: boolean) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: enabled
      }
    }));
    setHasChanges(true);
  };

  const saveChanges = () => {
    localStorage.setItem('customRolePermissions', JSON.stringify(rolePermissions));
    setHasChanges(false);
    toast({
      title: "Settings saved",
      description: "Role permissions have been updated successfully.",
    });
  };

  const resetToDefaults = () => {
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    localStorage.removeItem('customRolePermissions');
    setHasChanges(false);
    toast({
      title: "Reset complete",
      description: "Role permissions have been reset to defaults.",
    });
  };

  const groupedPermissions = PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const roles = Object.keys(rolePermissions);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Role & Permission Management</h3>
          <p className="text-sm text-muted-foreground">
            Customize permissions for each role to control system access
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button onClick={saveChanges} disabled={!hasChanges}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            You have unsaved changes. Click "Save Changes" to apply your modifications.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedPermissions).map(([category, permissions]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-base">{category} Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {permissions.map((permission) => (
                  <div key={permission.key} className="space-y-3">
                    <div>
                      <h4 className="font-medium">{permission.label}</h4>
                      <p className="text-sm text-muted-foreground">{permission.description}</p>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      {roles.map((role) => (
                        <div key={role} className="flex items-center space-x-2">
                          <Switch
                            id={`${permission.key}-${role}`}
                            checked={rolePermissions[role]?.[permission.key] || false}
                            onCheckedChange={(checked) => 
                              updatePermission(role, permission.key, checked)
                            }
                          />
                          <Label htmlFor={`${permission.key}-${role}`} className="capitalize">
                            <Badge variant="outline" className="text-xs">
                              {role.replace('_', ' ')}
                            </Badge>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}