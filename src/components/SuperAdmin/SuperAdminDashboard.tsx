import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BusinessOwnersManagement } from './BusinessOwnersManagement';
import { FeatureConfigTab } from './FeatureConfigTab';
import { FooterLinksTab } from './FooterLinksTab';
import { Building2, Users, CreditCard, Activity, TrendingUp, AlertTriangle, Settings, Link } from 'lucide-react';

interface DashboardStats {
  totalOrganizations: number;
  activeOrganizations: number;
  pendingApproval: number;
  suspendedOrganizations: number;
  totalBusinessOwners: number;
  premiumSubscriptions: number;
  freeSubscriptions: number;
  monthlyRevenue: number;
}

export function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    pendingApproval: 0,
    suspendedOrganizations: 0,
    totalBusinessOwners: 0,
    premiumSubscriptions: 0,
    freeSubscriptions: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Get organization stats
      const { data: orgs } = await supabase
        .from('organizations')
        .select('status, subscription_plan');

      const totalOrganizations = orgs?.length || 0;
      const activeOrganizations = orgs?.filter(org => org.status === 'active').length || 0;
      const pendingApproval = orgs?.filter(org => org.status === 'pending').length || 0;
      const suspendedOrganizations = orgs?.filter(org => org.status === 'suspended').length || 0;
      const premiumSubscriptions = orgs?.filter(org => org.subscription_plan === 'premium').length || 0;
      const freeSubscriptions = orgs?.filter(org => org.subscription_plan === 'free').length || 0;

      // Get business owners count
      const { data: businessOwners } = await supabase
        .from('organization_memberships')
        .select('user_id')
        .eq('role', 'business_owner');

      const totalBusinessOwners = businessOwners?.length || 0;

      // Calculate estimated monthly revenue (placeholder calculation)
      const monthlyRevenue = premiumSubscriptions * 29; // Assuming $29/month for premium

      setStats({
        totalOrganizations,
        activeOrganizations,
        pendingApproval,
        suspendedOrganizations,
        totalBusinessOwners,
        premiumSubscriptions,
        freeSubscriptions,
        monthlyRevenue,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend, 
    variant = "default" 
  }: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: string;
    variant?: "default" | "destructive" | "secondary";
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <Badge variant={variant} className="mt-2">
            {trend}
          </Badge>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Platform overview and business owner management
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Organizations"
          value={stats.totalOrganizations}
          description="All registered organizations"
          icon={Building2}
        />
        <StatCard
          title="Active Organizations"
          value={stats.activeOrganizations}
          description="Currently active"
          icon={Activity}
        />
        <StatCard
          title="Pending Approval"
          value={stats.pendingApproval}
          description="Awaiting approval"
          icon={AlertTriangle}
          variant={stats.pendingApproval > 0 ? "destructive" : "default"}
        />
        <StatCard
          title="Business Owners"
          value={stats.totalBusinessOwners}
          description="Total registered owners"
          icon={Users}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Premium Subscriptions"
          value={stats.premiumSubscriptions}
          description="Paid subscribers"
          icon={CreditCard}
        />
        <StatCard
          title="Free Subscriptions"
          value={stats.freeSubscriptions}
          description="Free tier users"
          icon={Users}
        />
        <StatCard
          title="Est. Monthly Revenue"
          value={`$${stats.monthlyRevenue}`}
          description="From premium subscriptions"
          icon={TrendingUp}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="business-owners">Business Owners</TabsTrigger>
          <TabsTrigger value="features">Feature Config</TabsTrigger>
          <TabsTrigger value="footer-links">Footer Links</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
                <CardDescription>
                  Key metrics and system status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Active Organizations</span>
                    <Badge variant="default">
                      {Math.round((stats.activeOrganizations / stats.totalOrganizations) * 100)}% Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Premium Adoption</span>
                    <Badge variant="secondary">
                      {Math.round((stats.premiumSubscriptions / stats.totalOrganizations) * 100)}% Premium
                    </Badge>
                  </div>
                  {stats.pendingApproval > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Pending Approvals</span>
                      <Badge variant="destructive">
                        {stats.pendingApproval} Pending
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business-owners">
          <BusinessOwnersManagement />
        </TabsContent>

        <TabsContent value="features">
          <FeatureConfigTab />
        </TabsContent>

        <TabsContent value="footer-links">
          <FooterLinksTab />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Reports</CardTitle>
              <CardDescription>
                Detailed analytics and reporting features (Coming Soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Advanced analytics and reporting features will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}