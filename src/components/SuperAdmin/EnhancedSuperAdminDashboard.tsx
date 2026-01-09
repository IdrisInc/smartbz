import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { BusinessOwnersManagement } from './BusinessOwnersManagement';
import { AnalyticsTab } from './AnalyticsTab';
import { ModuleConfigTab } from './ModuleConfigTab';
import { FooterLinksTab } from './FooterLinksTab';
import { OnboardingContentTab } from './OnboardingContentTab';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Pause,
  Play
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalOrganizations: number;
  activeOrganizations: number;
  pendingApproval: number;
  suspendedOrganizations: number;
  totalBusinessOwners: number;
  totalBranches: number;
  totalStaff: number;
  premiumSubscriptions: number;
  proSubscriptions: number;
  baseSubscriptions: number;
  freeSubscriptions: number;
  monthlyRevenue: number;
}

interface Organization {
  id: string;
  name: string;
  business_sector: string;
  subscription_plan: string;
  status: string;
  created_at: string;
  approved_at?: string;
  branches?: number;
  staff?: number;
}

export function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    pendingApproval: 0,
    suspendedOrganizations: 0,
    totalBusinessOwners: 0,
    totalBranches: 0,
    totalStaff: 0,
    premiumSubscriptions: 0,
    proSubscriptions: 0,
    baseSubscriptions: 0,
    freeSubscriptions: 0,
    monthlyRevenue: 0,
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    filterOrganizations();
  }, [organizations, searchTerm, statusFilter]);

  const loadDashboardData = async () => {
    try {
      // Get organization stats with branches and staff counts
      const { data: orgs } = await supabase
        .from('organizations')
        .select(`
          *,
          branches:branches(count),
          staff:employees(count)
        `);

      const totalOrganizations = orgs?.length || 0;
      const activeOrganizations = orgs?.filter(org => org.status === 'active').length || 0;
      const pendingApproval = orgs?.filter(org => org.status === 'pending').length || 0;
      const suspendedOrganizations = orgs?.filter(org => org.status === 'suspended').length || 0;
      const premiumSubscriptions = orgs?.filter(org => org.subscription_plan === 'premium' || org.subscription_plan === 'enterprise').length || 0;
      const proSubscriptions = orgs?.filter(org => org.subscription_plan === 'basic').length || 0;
      const baseSubscriptions = orgs?.filter(org => org.subscription_plan === 'basic').length || 0;
      const freeSubscriptions = orgs?.filter(org => org.subscription_plan === 'free').length || 0;

      // Get business owners count
      const { data: businessOwners } = await supabase
        .from('organization_memberships')
        .select('user_id')
        .eq('role', 'business_owner');

      // Get total branches and staff
      const { data: branches } = await supabase
        .from('branches')
        .select('id');

      const { data: staff } = await supabase
        .from('employees')
        .select('id');

      const totalBusinessOwners = businessOwners?.length || 0;
      const totalBranches = branches?.length || 0;
      const totalStaff = staff?.length || 0;

      // Calculate estimated monthly revenue
      const monthlyRevenue = (premiumSubscriptions * 299) + (proSubscriptions * 79) + (baseSubscriptions * 29);

      setStats({
        totalOrganizations,
        activeOrganizations,
        pendingApproval,
        suspendedOrganizations,
        totalBusinessOwners,
        totalBranches,
        totalStaff,
        premiumSubscriptions,
        proSubscriptions,
        baseSubscriptions,
        freeSubscriptions,
        monthlyRevenue,
      });

      // Process organizations data for table
      const processedOrgs = orgs?.map(org => ({
        ...org,
        branches: org.branches?.[0]?.count || 0,
        staff: org.staff?.[0]?.count || 0,
      })) || [];

      setOrganizations(processedOrgs);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrganizations = () => {
    let filtered = organizations;

    if (searchTerm) {
      filtered = filtered.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.business_sector.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(org => org.status === statusFilter);
    }

    setFilteredOrgs(filtered);
  };

  const handleApproveOrganization = async (orgId: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ 
          status: 'active',
          approved_at: new Date().toISOString()
        })
        .eq('id', orgId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization approved successfully",
      });

      loadDashboardData();
    } catch (error) {
      console.error('Error approving organization:', error);
      toast({
        title: "Error",
        description: "Failed to approve organization",
        variant: "destructive",
      });
    }
  };

  const handleSuspendOrganization = async (orgId: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status: 'suspended' })
        .eq('id', orgId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization suspended successfully",
      });

      loadDashboardData();
    } catch (error) {
      console.error('Error suspending organization:', error);
      toast({
        title: "Error",
        description: "Failed to suspend organization",
        variant: "destructive",
      });
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Platform overview and management center
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Organizations"
          value={stats.totalOrganizations}
          description="All registered businesses"
          icon={Building2}
        />
        <StatCard
          title="Business Owners"
          value={stats.totalBusinessOwners}
          description="Platform users"
          icon={Users}
        />
        <StatCard
          title="Total Branches"
          value={stats.totalBranches}
          description="Across all businesses"
          icon={Building2}
        />
        <StatCard
          title="Total Staff"
          value={stats.totalStaff}
          description="All employees"
          icon={Users}
        />
      </div>

      {/* Status and Revenue Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Organizations"
          value={stats.activeOrganizations}
          description="Currently operational"
          icon={Activity}
        />
        <StatCard
          title="Pending Approval"
          value={stats.pendingApproval}
          description="Awaiting review"
          icon={AlertTriangle}
          variant={stats.pendingApproval > 0 ? "destructive" : "default"}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          description="From subscriptions"
          icon={TrendingUp}
        />
        <StatCard
          title="Premium Users"
          value={stats.proSubscriptions + stats.premiumSubscriptions}
          description="Pro + Enterprise plans"
          icon={CreditCard}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="owners">Business Owners</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
                <CardDescription>Key platform metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Active Rate</span>
                  <Badge variant="default">
                    {Math.round((stats.activeOrganizations / stats.totalOrganizations) * 100)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Premium Adoption</span>
                  <Badge variant="secondary">
                    {Math.round(((stats.proSubscriptions + stats.premiumSubscriptions) / stats.totalOrganizations) * 100)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Avg Staff per Org</span>
                  <Badge variant="outline">
                    {Math.round(stats.totalStaff / stats.totalOrganizations)} staff
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Distribution</CardTitle>
                <CardDescription>Plan breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Free Plans</span>
                  <Badge variant="outline">{stats.freeSubscriptions}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Base Plans</span>
                  <Badge variant="secondary">{stats.baseSubscriptions}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pro Plans</span>
                  <Badge variant="default">{stats.proSubscriptions}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Enterprise Plans</span>
                  <Badge variant="destructive">{stats.premiumSubscriptions}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="businesses">
          <Card>
            <CardHeader>
              <CardTitle>Business Management</CardTitle>
              <CardDescription>All registered businesses on the platform</CardDescription>
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search businesses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Branches</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell className="capitalize">
                        {org.business_sector.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          org.subscription_plan === 'free' ? 'outline' :
                          org.subscription_plan === 'base' ? 'secondary' :
                          org.subscription_plan === 'pro' ? 'default' : 'destructive'
                        }>
                          {org.subscription_plan.charAt(0).toUpperCase() + org.subscription_plan.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          org.status === 'active' ? 'default' :
                          org.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{org.branches}</TableCell>
                      <TableCell>{org.staff}</TableCell>
                      <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {org.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleApproveOrganization(org.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {org.status === 'active' && (
                              <DropdownMenuItem onClick={() => handleSuspendOrganization(org.id)}>
                                <Pause className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            {org.status === 'suspended' && (
                              <DropdownMenuItem onClick={() => handleApproveOrganization(org.id)}>
                                <Play className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="owners">
          <BusinessOwnersManagement />
        </TabsContent>

        <TabsContent value="modules">
          <ModuleConfigTab />
        </TabsContent>

        <TabsContent value="onboarding">
          <OnboardingContentTab />
        </TabsContent>

        <TabsContent value="footer">
          <FooterLinksTab />
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>Platform-wide subscription analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-muted-foreground">{stats.freeSubscriptions}</div>
                  <div className="text-sm text-muted-foreground">Free Plans</div>
                  <div className="text-xs text-muted-foreground">$0/month</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.baseSubscriptions}</div>
                  <div className="text-sm text-muted-foreground">Base Plans</div>
                  <div className="text-xs text-muted-foreground">$29/month</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.proSubscriptions}</div>
                  <div className="text-sm text-muted-foreground">Pro Plans</div>
                  <div className="text-xs text-muted-foreground">$79/month</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.premiumSubscriptions}</div>
                  <div className="text-sm text-muted-foreground">Enterprise Plans</div>
                  <div className="text-xs text-muted-foreground">$299/month</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}