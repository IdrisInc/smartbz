import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Calendar,
  AlertCircle,
  Building2,
  Briefcase,
  Plus,
  Zap
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { supabase } from '@/integrations/supabase/client';
import { CreateOrganizationDialog } from '@/components/Organization/CreateOrganizationDialog';
import { UpgradePrompt } from '@/components/Organization/UpgradePrompt';

interface BusinessSummary {
  id: string;
  name: string;
  sector: string;
  revenue: number;
  salesCount: number;
  productsCount: number;
  employeesCount: number;
  branchesCount: number;
  recentActivity: string;
}

export function BusinessOwnerDashboard() {
  const { currentOrganization, organizations } = useOrganization();
  const { currentUsage, limits, canAddBusiness } = useSubscriptionLimits();
  const [businessSummaries, setBusinessSummaries] = useState<BusinessSummary[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    totalProducts: 0,
    totalEmployees: 0,
    lowStockAlerts: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  useEffect(() => {
    if (organizations.length > 0) {
      loadBusinessSummaries();
    }
  }, [organizations]);

  const loadBusinessSummaries = async () => {
    try {
      setLoading(true);
      const summaries: BusinessSummary[] = [];
      let totalRevenue = 0;
      let totalSales = 0;
      let totalProducts = 0;
      let totalEmployees = 0;

      for (const org of organizations) {
        // Get sales data
        const { data: sales } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('organization_id', org.id);

        // Get products count
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('organization_id', org.id);

        // Get employees count
        const { data: employees } = await supabase
          .from('employees')
          .select('id')
          .eq('organization_id', org.id);

        // Get branches count
        const { data: branches } = await supabase
          .from('branches')
          .select('id')
          .eq('organization_id', org.id);

        const revenue = sales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
        const salesCount = sales?.length || 0;
        const productsCount = products?.length || 0;
        const employeesCount = employees?.length || 0;
        const branchesCount = branches?.length || 0;

        summaries.push({
          id: org.id,
          name: org.name,
          sector: org.business_sector,
          revenue,
          salesCount,
          productsCount,
          employeesCount,
          branchesCount,
          recentActivity: salesCount > 0 ? 'Active sales' : 'No recent activity'
        });

        totalRevenue += revenue;
        totalSales += salesCount;
        totalProducts += productsCount;
        totalEmployees += employeesCount;
      }

      setBusinessSummaries(summaries);
      setTotalStats({
        totalRevenue,
        totalSales,
        totalProducts,
        totalEmployees,
        lowStockAlerts: 0, // Placeholder
        pendingOrders: 0   // Placeholder
      });
    } catch (error) {
      console.error('Error loading business summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBusiness = () => {
    if (!canAddBusiness()) {
      setShowUpgradePrompt(true);
      return;
    }
    setShowCreateDialog(true);
  };

  const QuickActionCard = ({ 
    title, 
    description, 
    icon: Icon, 
    onClick, 
    disabled = false 
  }: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${disabled ? 'opacity-50' : ''}`}>
      <CardContent className="p-6" onClick={disabled ? undefined : onClick}>
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
          <h1 className="text-3xl font-bold">Business Portfolio</h1>
          <p className="text-muted-foreground">
            Manage your {organizations.length} business{organizations.length !== 1 ? 'es' : ''} from one dashboard
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="default" className="px-3 py-1">
            {currentOrganization?.subscription_plan.charAt(0).toUpperCase() + currentOrganization?.subscription_plan.slice(1)} Plan
          </Badge>
          <Button onClick={handleCreateBusiness}>
            <Plus className="h-4 w-4 mr-2" />
            Add Business
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all businesses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalSales}</div>
            <p className="text-xs text-muted-foreground">Completed transactions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Total inventory items</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Total employees</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Usage</CardTitle>
          <CardDescription>Current usage against your subscription limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{currentUsage.businesses}</div>
              <div className="text-sm text-muted-foreground">
                of {limits.businesses === -1 ? '∞' : limits.businesses} businesses
              </div>
              {limits.businesses !== -1 && currentUsage.businesses >= limits.businesses && (
                <Badge variant="destructive" className="mt-1">Limit Reached</Badge>
              )}
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{currentUsage.branches}</div>
              <div className="text-sm text-muted-foreground">
                of {limits.branchesPerBusiness === -1 ? '∞' : limits.branchesPerBusiness} branches
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{currentUsage.staff}</div>
              <div className="text-sm text-muted-foreground">
                of {limits.staffPerBranch === -1 ? '∞' : limits.staffPerBranch} staff
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          title="Add Business"
          description="Create a new business"
          icon={Building2}
          onClick={handleCreateBusiness}
        />
        <QuickActionCard
          title="Add Branch"
          description="Expand current business"
          icon={Briefcase}
          onClick={() => window.location.href = '/branches'}
        />
        <QuickActionCard
          title="Add Staff"
          description="Hire new employees"
          icon={Users}
          onClick={() => window.location.href = '/employees'}
        />
        <QuickActionCard
          title="Add Products"
          description="Expand your inventory"
          icon={Package}
          onClick={() => window.location.href = '/products'}
        />
      </div>

      {/* Business Summaries */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Businesses</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {businessSummaries.map((business) => (
            <Card key={business.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{business.name}</CardTitle>
                  <Badge variant="outline" className="capitalize">
                    {business.sector.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      ${business.revenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{business.salesCount}</div>
                    <div className="text-xs text-muted-foreground">Sales</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="font-medium">{business.branchesCount}</div>
                    <div className="text-xs text-muted-foreground">Branches</div>
                  </div>
                  <div>
                    <div className="font-medium">{business.productsCount}</div>
                    <div className="text-xs text-muted-foreground">Products</div>
                  </div>
                  <div>
                    <div className="font-medium">{business.employeesCount}</div>
                    <div className="text-xs text-muted-foreground">Staff</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">
                    {business.recentActivity}
                  </span>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <CreateOrganizationDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />

      <UpgradePrompt
        feature="business"
        action="add more businesses"
        open={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
      />
    </div>
  );
}