import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Building2, 
  GitBranch, 
  DollarSign, 
  TrendingUp,
  Activity,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface PlatformStats {
  totalBusinesses: number;
  totalBranches: number;
  totalStaff: number;
  totalRevenue: number;
  activeSubscriptions: number;
  newBusinessesThisMonth: number;
  revenueGrowth: number;
}

export default function SuperAdminReports() {
  const [stats, setStats] = useState<PlatformStats>({
    totalBusinesses: 0,
    totalBranches: 0,
    totalStaff: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    newBusinessesThisMonth: 0,
    revenueGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Sample data for charts
  const revenueData = [
    { month: 'Jan', revenue: 45000, businesses: 120 },
    { month: 'Feb', revenue: 52000, businesses: 135 },
    { month: 'Mar', revenue: 48000, businesses: 142 },
    { month: 'Apr', revenue: 61000, businesses: 158 },
    { month: 'May', revenue: 55000, businesses: 167 },
    { month: 'Jun', revenue: 67000, businesses: 180 }
  ];

  const planDistribution = [
    { name: 'Basic', value: 65, color: '#8884d8' },
    { name: 'Pro', value: 25, color: '#82ca9d' },
    { name: 'Enterprise', value: 10, color: '#ffc658' }
  ];

  const topIndustries = [
    { industry: 'Retail', count: 45 },
    { industry: 'Food & Beverage', count: 38 },
    { industry: 'Healthcare', count: 32 },
    { industry: 'Education', count: 28 },
    { industry: 'Technology', count: 22 }
  ];

  useEffect(() => {
    loadPlatformStats();
  }, []);

  const loadPlatformStats = async () => {
    try {
      // Load businesses
      const { data: businesses, error: businessError } = await supabase
        .from('organizations')
        .select('id, created_at');

      if (businessError) throw businessError;

      // Load branches
      const { data: branches, error: branchError } = await supabase
        .from('branches')
        .select('id');

      if (branchError) throw branchError;

      // Load profiles as staff
      const { data: staff, error: staffError } = await supabase
        .from('profiles')
        .select('id, created_at');

      if (staffError) throw staffError;

      const totalRevenue = (businesses?.length || 0) * 29; // Mock revenue
      const activeSubscriptions = businesses?.length || 0;
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newBusinessesThisMonth = businesses?.filter(b => 
        new Date(b.created_at) >= thisMonth
      ).length || 0;

      setStats({
        totalBusinesses: businesses?.length || 0,
        totalBranches: branches?.length || 0,
        totalStaff: staff?.length || 0,
        totalRevenue,
        activeSubscriptions,
        newBusinessesThisMonth,
        revenueGrowth: 12.5 // Mock growth percentage
      });
    } catch (error) {
      console.error('Error loading platform stats:', error);
      toast({
        title: "Error",
        description: "Failed to load platform statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Platform Reports</h1>
        <p className="text-center py-8">Loading platform analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Platform Reports</h1>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Live Data
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Businesses</p>
                <p className="text-2xl font-bold">{stats.totalBusinesses}</p>
                <p className="text-xs text-green-600">+{stats.newBusinessesThisMonth} this month</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Branches</p>
                <p className="text-2xl font-bold">{stats.totalBranches}</p>
              </div>
              <GitBranch className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{stats.totalStaff}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{stats.revenueGrowth}%
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="businesses" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Industries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topIndustries.map((item, index) => (
                <div key={item.industry} className="flex items-center justify-between">
                  <span className="font-medium">{item.industry}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(item.count / 50) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Platform Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.activeSubscriptions}</p>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{((stats.totalStaff / stats.totalBusinesses) || 0).toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Avg Staff per Business</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{((stats.totalBranches / stats.totalBusinesses) || 0).toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Avg Branches per Business</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}