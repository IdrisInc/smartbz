import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

interface StaffDashboardData {
  todaysSales: number;
  salesCount: number;
  assignedTasks: number;
  completedTasks: number;
  branchName: string;
  role: string;
  quickActions: string[];
}

export function StaffDashboard() {
  const { currentOrganization } = useOrganization();
  const { userRole, permissions } = useUserRole();
  const [dashboardData, setDashboardData] = useState<StaffDashboardData>({
    todaysSales: 0,
    salesCount: 0,
    assignedTasks: 0,
    completedTasks: 0,
    branchName: 'Main Branch',
    role: userRole || 'staff',
    quickActions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrganization) {
      loadStaffData();
    }
  }, [currentOrganization, userRole]);

  const loadStaffData = async () => {
    try {
      setLoading(true);

      // Get today's sales if user has sales permissions
      if (permissions?.canProcessSales) {
        const today = new Date().toISOString().split('T')[0];
        const { data: sales } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('organization_id', currentOrganization?.id)
          .gte('sale_date', today);

        const todaysSales = sales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
        const salesCount = sales?.length || 0;

        setDashboardData(prev => ({
          ...prev,
          todaysSales,
          salesCount
        }));
      }

      // Set quick actions based on role
      const quickActions = getQuickActionsForRole(userRole || '');
      
      setDashboardData(prev => ({
        ...prev,
        quickActions,
        role: userRole || 'staff'
      }));

    } catch (error) {
      console.error('Error loading staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuickActionsForRole = (role: string): string[] => {
    switch (role) {
      case 'admin_staff':
        return ['Process Sale', 'Check Inventory', 'Manage Staff', 'View Reports'];
      case 'sales_staff':
        return ['Process Sale', 'View Customers', 'Check Products'];
      case 'inventory_staff':
        return ['Check Inventory', 'Update Stock', 'Generate Reports'];
      case 'finance_staff':
        return ['View Revenue', 'Process Expenses', 'Generate Reports'];
      case 'cashier':
        return ['Process Sale', 'Handle Returns', 'Cash Management'];
      default:
        return ['Process Sale', 'Check Inventory'];
    }
  };

  const getRoleDisplayName = (role: string): string => {
    const roleNames: Record<string, string> = {
      'admin_staff': 'Admin Staff',
      'sales_staff': 'Sales Staff',
      'inventory_staff': 'Inventory Staff',
      'finance_staff': 'Finance Staff',
      'cashier': 'Cashier',
      'manager': 'Manager'
    };
    return roleNames[role] || role.replace('_', ' ');
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin_staff':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'sales_staff':
        return 'secondary';
      case 'finance_staff':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const QuickActionButton = ({ action, onClick }: { action: string; onClick: () => void }) => (
    <Button 
      variant="outline" 
      className="h-auto p-4 text-left justify-start"
      onClick={onClick}
    >
      <div>
        <div className="font-medium">{action}</div>
        <div className="text-xs text-muted-foreground">Click to access</div>
      </div>
    </Button>
  );

  const handleQuickAction = (action: string) => {
    const actionRoutes: Record<string, string> = {
      'Process Sale': '/sales',
      'Check Inventory': '/inventory',
      'Manage Staff': '/employees',
      'View Reports': '/reports',
      'View Customers': '/contacts',
      'Check Products': '/products',
      'Update Stock': '/inventory',
      'Generate Reports': '/reports',
      'View Revenue': '/finance',
      'Process Expenses': '/finance',
      'Handle Returns': '/sales',
      'Cash Management': '/sales'
    };

    const route = actionRoutes[action];
    if (route) {
      window.location.href = route;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
          <p className="text-muted-foreground">
            {dashboardData.branchName} • {currentOrganization?.name}
          </p>
        </div>
        <Badge variant={getRoleBadgeVariant(dashboardData.role)}>
          {getRoleDisplayName(dashboardData.role)}
        </Badge>
      </div>

      {/* Key Metrics - role-based visibility */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {permissions?.canProcessSales && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${dashboardData.todaysSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{dashboardData.salesCount} transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94%</div>
                <p className="text-xs text-muted-foreground">Target achievement</p>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.completedTasks}/{dashboardData.assignedTasks}</div>
            <p className="text-xs text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">Checked in at 9:00 AM</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for your role as {getRoleDisplayName(dashboardData.role)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {dashboardData.quickActions.map((action) => (
              <QuickActionButton
                key={action}
                action={action}
                onClick={() => handleQuickAction(action)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role-specific sections */}
      {userRole === 'cashier' && (
        <Card>
          <CardHeader>
            <CardTitle>POS Terminal</CardTitle>
            <CardDescription>Quick access to point-of-sale functions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">$0.00</div>
                <p className="text-muted-foreground">Current transaction</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button size="lg" onClick={() => handleQuickAction('Process Sale')}>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  New Sale
                </Button>
                <Button variant="secondary" size="lg" onClick={() => handleQuickAction('Check Products')}>
                  <Package className="h-5 w-5 mr-2" />
                  View Products
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {permissions?.canManageInventory && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-medium">Low Stock Items</div>
                    <div className="text-sm text-muted-foreground">3 products below minimum level</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Reorder Required</div>
                    <div className="text-sm text-muted-foreground">2 items need restocking</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Review</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {permissions?.canManageFinances && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Revenue</span>
                  <span className="font-medium">${dashboardData.todaysSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expenses</span>
                  <span className="font-medium">$245</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Net</span>
                  <span className="font-medium text-green-600">
                    ${(dashboardData.todaysSales - 245).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Cash</span>
                  <span>$567</span>
                </div>
                <div className="flex justify-between">
                  <span>Card</span>
                  <span>$1,234</span>
                </div>
                <div className="flex justify-between">
                  <span>Digital</span>
                  <span>$89</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}