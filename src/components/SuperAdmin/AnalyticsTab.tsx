import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Users, Building2, DollarSign, Activity } from 'lucide-react';

interface AnalyticsData {
  monthlyGrowth: { month: string; organizations: number; users: number; revenue: number }[];
  sectorDistribution: { name: string; value: number; color: string }[];
  subscriptionTrends: { month: string; free: number; basic: number; premium: number; enterprise: number }[];
  recentActivity: { date: string; registrations: number; sales: number }[];
  topSectors: { sector: string; count: number; growth: number }[];
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    monthlyGrowth: [],
    sectorDistribution: [],
    subscriptionTrends: [],
    recentActivity: [],
    topSectors: []
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Get all organizations with their creation dates
      const { data: orgs } = await supabase
        .from('organizations')
        .select('created_at, business_sector, subscription_plan, status')
        .order('created_at', { ascending: true });

      // Get all users/memberships
      const { data: memberships } = await supabase
        .from('organization_memberships')
        .select('joined_at, role')
        .order('joined_at', { ascending: true });

      // Get sales data
      const { data: sales } = await supabase
        .from('sales')
        .select('sale_date, total_amount')
        .order('sale_date', { ascending: true });

      // Process monthly growth data (last 6 months)
      const monthlyGrowth = generateMonthlyGrowth(orgs || [], memberships || [], sales || []);
      
      // Process sector distribution
      const sectorDistribution = generateSectorDistribution(orgs || []);
      
      // Process subscription trends
      const subscriptionTrends = generateSubscriptionTrends(orgs || []);
      
      // Process recent activity (last 7 days)
      const recentActivity = generateRecentActivity(orgs || [], sales || []);
      
      // Process top sectors
      const topSectors = generateTopSectors(orgs || []);

      setAnalytics({
        monthlyGrowth,
        sectorDistribution,
        subscriptionTrends,
        recentActivity,
        topSectors
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyGrowth = (orgs: any[], memberships: any[], sales: any[]) => {
    const months: { month: string; organizations: number; users: number; revenue: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const orgsCount = orgs.filter(o => new Date(o.created_at) <= monthEnd).length;
      const usersCount = memberships.filter(m => new Date(m.joined_at) <= monthEnd).length;
      const monthRevenue = sales
        .filter(s => {
          const saleDate = new Date(s.sale_date);
          return saleDate.getMonth() === date.getMonth() && saleDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, s) => sum + (s.total_amount || 0), 0);
      
      months.push({ month: monthKey, organizations: orgsCount, users: usersCount, revenue: Math.round(monthRevenue) });
    }
    
    return months;
  };

  const generateSectorDistribution = (orgs: any[]) => {
    const sectorCounts: Record<string, number> = {};
    orgs.forEach(org => {
      const sector = org.business_sector || 'other';
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    });

    return Object.entries(sectorCounts)
      .map(([name, value], index) => ({
        name: name.replace('_', ' ').charAt(0).toUpperCase() + name.replace('_', ' ').slice(1),
        value,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const generateSubscriptionTrends = (orgs: any[]) => {
    const months: { month: string; free: number; basic: number; premium: number; enterprise: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const activeOrgs = orgs.filter(o => new Date(o.created_at) <= monthEnd);
      
      months.push({
        month: monthKey,
        free: activeOrgs.filter(o => o.subscription_plan === 'free').length,
        basic: activeOrgs.filter(o => o.subscription_plan === 'basic').length,
        premium: activeOrgs.filter(o => o.subscription_plan === 'premium').length,
        enterprise: activeOrgs.filter(o => o.subscription_plan === 'enterprise').length
      });
    }
    
    return months;
  };

  const generateRecentActivity = (orgs: any[], sales: any[]) => {
    const days: { date: string; registrations: number; sales: number }[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStart = new Date(date.setHours(0, 0, 0, 0));
      const dateEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const registrations = orgs.filter(o => {
        const created = new Date(o.created_at);
        return created >= dateStart && created <= dateEnd;
      }).length;
      
      const salesCount = sales.filter(s => {
        const saleDate = new Date(s.sale_date);
        return saleDate >= dateStart && saleDate <= dateEnd;
      }).length;
      
      days.push({ date: dateStr, registrations, sales: salesCount });
    }
    
    return days;
  };

  const generateTopSectors = (orgs: any[]) => {
    const sectorCounts: Record<string, number> = {};
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    orgs.forEach(org => {
      const sector = org.business_sector || 'other';
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    });

    const lastMonthCounts: Record<string, number> = {};
    orgs.filter(o => new Date(o.created_at) < lastMonth).forEach(org => {
      const sector = org.business_sector || 'other';
      lastMonthCounts[sector] = (lastMonthCounts[sector] || 0) + 1;
    });

    return Object.entries(sectorCounts)
      .map(([sector, count]) => ({
        sector: sector.replace('_', ' ').charAt(0).toUpperCase() + sector.replace('_', ' ').slice(1),
        count,
        growth: lastMonthCounts[sector] ? Math.round(((count - lastMonthCounts[sector]) / lastMonthCounts[sector]) * 100) : 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentMonthData = analytics.monthlyGrowth[analytics.monthlyGrowth.length - 1];
  const previousMonthData = analytics.monthlyGrowth[analytics.monthlyGrowth.length - 2];
  
  const orgGrowth = previousMonthData ? Math.round(((currentMonthData?.organizations || 0) - previousMonthData.organizations) / previousMonthData.organizations * 100) : 0;
  const userGrowth = previousMonthData ? Math.round(((currentMonthData?.users || 0) - previousMonthData.users) / previousMonthData.users * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthData?.organizations || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {orgGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={orgGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {orgGrowth}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthData?.users || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {userGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={userGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {userGrowth}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(currentMonthData?.revenue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month's sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.recentActivity.reduce((sum, d) => sum + d.sales, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Transactions this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Growth Trends</CardTitle>
            <CardDescription>Organizations and users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="organizations" 
                  stackId="1"
                  stroke="hsl(var(--chart-1))" 
                  fill="hsl(var(--chart-1))" 
                  fillOpacity={0.6}
                  name="Organizations"
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stackId="2"
                  stroke="hsl(var(--chart-2))" 
                  fill="hsl(var(--chart-2))" 
                  fillOpacity={0.6}
                  name="Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sector Distribution</CardTitle>
            <CardDescription>Businesses by industry</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.sectorDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.sectorDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Trends</CardTitle>
            <CardDescription>Plan distribution over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.subscriptionTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="free" stackId="a" fill="hsl(var(--muted-foreground))" name="Free" />
                <Bar dataKey="basic" stackId="a" fill="hsl(var(--chart-2))" name="Basic" />
                <Bar dataKey="premium" stackId="a" fill="hsl(var(--chart-3))" name="Premium" />
                <Bar dataKey="enterprise" stackId="a" fill="hsl(var(--chart-1))" name="Enterprise" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Registrations and sales this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.recentActivity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="registrations" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  name="Registrations"
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Sales"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Sectors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Business Sectors</CardTitle>
          <CardDescription>Most popular industries on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topSectors.map((sector, index) => (
              <div key={sector.sector} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium">{sector.sector}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">{sector.count} businesses</span>
                  <Badge variant={sector.growth >= 0 ? 'default' : 'destructive'}>
                    {sector.growth >= 0 ? '+' : ''}{sector.growth}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
