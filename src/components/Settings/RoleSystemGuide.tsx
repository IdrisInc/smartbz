import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Users,
  Building,
  Package,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Settings,
  UserCheck,
  ClipboardList,
  Truck,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export function RoleSystemGuide() {
  const systemWorkflow = [
    {
      title: "Product Management",
      description: "Adding and managing inventory",
      steps: [
        "Business Owner/Manager adds products to system",
        "Set pricing, stock levels, and product details",
        "Configure low stock alerts",
        "Organize products by categories"
      ],
      roles: ["business_owner", "manager"]
    },
    {
      title: "Purchase Orders",
      description: "Buying inventory from suppliers",
      steps: [
        "Manager creates purchase orders",
        "Select suppliers from contact database",
        "Add products and quantities needed",
        "Set expected delivery dates",
        "Track order status and delivery"
      ],
      roles: ["business_owner", "manager"]
    },
    {
      title: "Sales Process",
      description: "Selling products to customers",
      steps: [
        "Staff/Cashier processes customer sales",
        "Select products using search/dropdown",
        "Apply discounts (if authorized)",
        "Process payment (cash/card)",
        "Generate receipt and update inventory"
      ],
      roles: ["cashier", "staff", "manager", "business_owner"]
    },
    {
      title: "Customer Management",
      description: "Managing customer relationships",
      steps: [
        "Add customer information and addresses",
        "Track purchase history",
        "Manage loyalty points (if applicable)",
        "Generate customer reports"
      ],
      roles: ["staff", "manager", "business_owner"]
    },
    {
      title: "Financial Management",
      description: "Tracking money flow",
      steps: [
        "Record all sales transactions",
        "Track expenses and receipts",
        "Generate invoices for customers",
        "Monitor profit and loss",
        "Process refunds (manager level)"
      ],
      roles: ["manager", "business_owner"]
    },
    {
      title: "Employee Management",
      description: "Managing staff and operations",
      steps: [
        "Track employee attendance",
        "Manage payroll and salaries",
        "Assign roles and permissions",
        "Monitor performance metrics"
      ],
      roles: ["business_owner", "manager"]
    }
  ];

  const roleCapabilities = {
    admin: {
      color: "destructive",
      icon: Shield,
      title: "System Administrator",
      description: "Full system access across all organizations",
      capabilities: [
        "Manage all organizations",
        "System configuration",
        "User account management",
        "Platform monitoring",
        "Technical support"
      ],
      limitations: []
    },
    business_owner: {
      color: "default",
      icon: Building,
      title: "Business Owner",
      description: "Complete control over their business",
      capabilities: [
        "Full business management",
        "Financial oversight",
        "Employee management",
        "Multi-branch operations",
        "System settings",
        "All reports and analytics"
      ],
      limitations: ["Cannot access other businesses"]
    },
    manager: {
      color: "secondary",
      icon: Users,
      title: "Manager",
      description: "Operational control of assigned areas",
      capabilities: [
        "Product and inventory management",
        "Sales and customer management",
        "Staff supervision",
        "Branch operations",
        "Most reports",
        "Expense management"
      ],
      limitations: [
        "Cannot manage other managers",
        "No payroll access",
        "Cannot change core settings"
      ]
    },
    staff: {
      color: "outline",
      icon: UserCheck,
      title: "Staff Member",
      description: "Handles day-to-day customer operations",
      capabilities: [
        "Process sales transactions",
        "Customer service",
        "Basic inventory updates",
        "Customer data entry",
        "Product information"
      ],
      limitations: [
        "No financial reports",
        "Cannot manage inventory",
        "Cannot access employee data",
        "No discount authorization"
      ]
    },
    cashier: {
      color: "outline",
      icon: ShoppingCart,
      title: "Cashier",
      description: "Focused on point-of-sale operations",
      capabilities: [
        "Process payments",
        "Handle cash register",
        "Basic product lookup",
        "Print receipts",
        "Handle returns (basic)"
      ],
      limitations: [
        "No customer management",
        "No inventory access",
        "No reports access",
        "Cannot apply discounts"
      ]
    }
  };

  const businessScenarios = [
    {
      title: "Small Retail Store",
      description: "Single location with 2-5 employees",
      setup: [
        "Business Owner manages everything initially",
        "Add 1-2 Staff for customer service",
        "Add 1 Cashier for dedicated POS",
        "Manager role optional for growth"
      ]
    },
    {
      title: "Multi-Branch Business",
      description: "Multiple locations with 10+ employees",
      setup: [
        "Business Owner oversees all branches",
        "Branch Managers for each location",
        "Multiple Staff per branch",
        "Dedicated Cashiers for busy locations"
      ]
    },
    {
      title: "Growing Business",
      description: "Expanding operations and team",
      setup: [
        "Start with Business Owner + Staff",
        "Promote experienced Staff to Manager",
        "Add specialized Cashiers",
        "Delegate branch management"
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            System Workflow Overview
          </CardTitle>
          <CardDescription>
            How different roles work together in your business operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {systemWorkflow.map((workflow, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg">{workflow.title}</h4>
                <div className="flex gap-1">
                  {workflow.roles.map((role) => (
                    <Badge key={role} variant="outline" className="text-xs">
                      {role.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{workflow.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {workflow.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {step}
                  </div>
                ))}
              </div>
              {index < systemWorkflow.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Capabilities & Limitations
          </CardTitle>
          <CardDescription>
            Detailed breakdown of what each role can and cannot do
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(roleCapabilities).map(([role, info]) => {
            const IconComponent = info.icon;
            return (
              <div key={role} className="space-y-3">
                <div className="flex items-center gap-3">
                  <IconComponent className="h-6 w-6" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{info.title}</h4>
                      <Badge variant={info.color as any}>{role.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-9">
                  <div>
                    <h5 className="font-medium text-green-700 mb-2 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Can Do
                    </h5>
                    <ul className="space-y-1">
                      {info.capabilities.map((capability, index) => (
                        <li key={index} className="text-sm flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-green-500" />
                          {capability}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {info.limitations.length > 0 && (
                    <div>
                      <h5 className="font-medium text-red-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Cannot Do
                      </h5>
                      <ul className="space-y-1">
                        {info.limitations.map((limitation, index) => (
                          <li key={index} className="text-sm flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-red-500" />
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {role !== 'cashier' && <Separator />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Business Setup Scenarios
          </CardTitle>
          <CardDescription>
            Common role configurations for different business types
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {businessScenarios.map((scenario, index) => (
            <div key={index} className="space-y-3">
              <div>
                <h4 className="font-semibold text-lg">{scenario.title}</h4>
                <p className="text-sm text-muted-foreground">{scenario.description}</p>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium">Recommended Setup:</h5>
                <ul className="space-y-1">
                  {scenario.setup.map((step, stepIndex) => (
                    <li key={stepIndex} className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
              {index < businessScenarios.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}