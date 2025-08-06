import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Shield, 
  Settings, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  UserCheck,
  Building,
  BarChart3,
  CreditCard
} from 'lucide-react';

interface RoleModule {
  name: string;
  icon: React.ReactNode;
  permissions: string[];
  description: string;
}

interface RoleDefinition {
  role: string;
  title: string;
  description: string;
  color: string;
  modules: RoleModule[];
  workflow: string[];
}

const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: 'admin',
    title: 'System Administrator',
    description: 'Full system access with all permissions',
    color: 'destructive',
    modules: [
      {
        name: 'Full System Control',
        icon: <Shield className="h-4 w-4" />,
        permissions: ['All permissions enabled'],
        description: 'Complete access to all system features and settings'
      }
    ],
    workflow: [
      'System configuration and maintenance',
      'User and role management across all organizations',
      'Database and security management',
      'System monitoring and troubleshooting'
    ]
  },
  {
    role: 'business_owner',
    title: 'Business Owner',
    description: 'Full business management with financial oversight',
    color: 'default',
    modules: [
      {
        name: 'Organization Management',
        icon: <Building className="h-4 w-4" />,
        permissions: ['Manage organizations', 'Manage branches', 'Business settings'],
        description: 'Complete control over business structure and locations'
      },
      {
        name: 'Team Management',
        icon: <Users className="h-4 w-4" />,
        permissions: ['Hire/fire employees', 'Assign roles', 'Manage payroll', 'View all reports'],
        description: 'Full authority over human resources and team structure'
      },
      {
        name: 'Financial Control',
        icon: <DollarSign className="h-4 w-4" />,
        permissions: ['View all finances', 'Manage expenses', 'Process refunds', 'Financial reports'],
        description: 'Complete financial oversight and decision-making authority'
      },
      {
        name: 'Business Operations',
        icon: <BarChart3 className="h-4 w-4" />,
        permissions: ['All sales operations', 'Inventory management', 'Customer management', 'Business analytics'],
        description: 'Strategic oversight of all business operations and performance'
      }
    ],
    workflow: [
      'Review daily/weekly business performance reports',
      'Make strategic decisions about inventory and pricing',
      'Manage employee performance and payroll',
      'Oversee financial health and growth strategies',
      'Handle major customer relationships and disputes'
    ]
  },
  {
    role: 'manager',
    title: 'Branch/Department Manager',
    description: 'Operational management with team oversight',
    color: 'secondary',
    modules: [
      {
        name: 'Team Leadership',
        icon: <UserCheck className="h-4 w-4" />,
        permissions: ['Manage employees', 'Track attendance', 'Performance reviews', 'Schedule management'],
        description: 'Direct supervision and development of team members'
      },
      {
        name: 'Inventory & Products',
        icon: <Package className="h-4 w-4" />,
        permissions: ['Manage products', 'Update inventory', 'Handle purchase orders', 'Stock reports'],
        description: 'Maintain optimal inventory levels and product availability'
      },
      {
        name: 'Sales Operations',
        icon: <ShoppingCart className="h-4 w-4" />,
        permissions: ['Process sales', 'Manage customers', 'Apply discounts', 'Generate invoices'],
        description: 'Oversee daily sales activities and customer service'
      },
      {
        name: 'Operational Finance',
        icon: <CreditCard className="h-4 w-4" />,
        permissions: ['View branch finances', 'Manage expenses', 'Invoice management', 'Operational reports'],
        description: 'Monitor branch/department financial performance'
      }
    ],
    workflow: [
      'Start shift: Review overnight reports and team schedules',
      'Morning: Conduct team briefing and assign daily tasks',
      'Throughout day: Monitor sales performance and inventory levels',
      'Handle customer escalations and team support',
      'End shift: Review daily sales, update reports, plan next day'
    ]
  },
  {
    role: 'staff',
    title: 'General Staff',
    description: 'Customer service and basic operations',
    color: 'outline',
    modules: [
      {
        name: 'Customer Service',
        icon: <Users className="h-4 w-4" />,
        permissions: ['Manage customers', 'Process sales', 'Handle inquiries', 'Basic customer support'],
        description: 'Provide excellent customer service and support'
      },
      {
        name: 'Sales Support',
        icon: <ShoppingCart className="h-4 w-4" />,
        permissions: ['Create sales', 'Update customer info', 'Process returns (with approval)', 'Order fulfillment'],
        description: 'Support sales process and order management'
      },
      {
        name: 'Inventory Support',
        icon: <Package className="h-4 w-4" />,
        permissions: ['Update inventory counts', 'Receive stock', 'Report issues', 'Basic stock management'],
        description: 'Maintain accurate inventory records and stock levels'
      }
    ],
    workflow: [
      'Clock in and review daily assignments',
      'Assist customers with product inquiries and purchases',
      'Process sales transactions and handle basic customer issues',
      'Update inventory counts and receive new stock',
      'Report any issues to management and complete daily tasks'
    ]
  },
  {
    role: 'cashier',
    title: 'Cashier/POS Operator',
    description: 'Point-of-sale and transaction processing',
    color: 'outline',
    modules: [
      {
        name: 'Transaction Processing',
        icon: <CreditCard className="h-4 w-4" />,
        permissions: ['Process sales', 'Handle payments', 'Issue receipts', 'Basic customer service'],
        description: 'Efficiently process customer transactions and payments'
      }
    ],
    workflow: [
      'Open register and verify starting cash amount',
      'Process customer transactions accurately',
      'Handle various payment methods (cash, card, etc.)',
      'Provide excellent customer service during checkout',
      'Balance register and complete end-of-shift procedures'
    ]
  }
];

export function RoleManagementGuide() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Role Management Guide</h3>
        <p className="text-sm text-muted-foreground">
          Understanding how each role manages and interacts with the system
        </p>
      </div>

      <div className="space-y-6">
        {ROLE_DEFINITIONS.map((role) => (
          <Card key={role.role}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {role.title}
                    <Badge variant={role.color as any}>{role.role.replace('_', ' ')}</Badge>
                  </CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Modules and Permissions */}
              <div>
                <h4 className="font-medium mb-3">System Modules & Permissions</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {role.modules.map((module, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {module.icon}
                        <h5 className="font-medium">{module.name}</h5>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                      <div className="space-y-1">
                        {module.permissions.map((permission, permIndex) => (
                          <div key={permIndex} className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            <span className="text-xs">{permission}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Daily Workflow */}
              <div>
                <h4 className="font-medium mb-3">Typical Daily Workflow</h4>
                <div className="space-y-2">
                  {role.workflow.map((task, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm">{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Navigation Map */}
      <Card>
        <CardHeader>
          <CardTitle>System Navigation by Role</CardTitle>
          <CardDescription>
            Quick reference for which sections each role typically accesses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-6 gap-2 text-xs font-medium">
              <div>Module</div>
              <div className="text-center">Admin</div>
              <div className="text-center">Owner</div>
              <div className="text-center">Manager</div>
              <div className="text-center">Staff</div>
              <div className="text-center">Cashier</div>
            </div>
            {[
              'Dashboard',
              'Sales & POS',
              'Products & Inventory',
              'Customers & Contacts',
              'Employees & HR',
              'Finance & Reports',
              'Organization & Branches',
              'Settings & Configuration'
            ].map((module) => (
              <div key={module} className="grid grid-cols-6 gap-2 py-2 border-t text-sm">
                <div className="font-medium">{module}</div>
                <div className="text-center">✅</div>
                <div className="text-center">✅</div>
                <div className="text-center">{['Dashboard', 'Sales & POS', 'Products & Inventory', 'Customers & Contacts', 'Employees & HR', 'Finance & Reports'].includes(module) ? '✅' : '❌'}</div>
                <div className="text-center">{['Dashboard', 'Sales & POS', 'Products & Inventory', 'Customers & Contacts'].includes(module) ? '✅' : '❌'}</div>
                <div className="text-center">{['Dashboard', 'Sales & POS'].includes(module) ? '✅' : '❌'}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}