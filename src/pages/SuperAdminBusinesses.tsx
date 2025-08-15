import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Search, MoreHorizontal, Eye, Edit, Trash } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Business {
  id: string;
  name: string;
  industry: string;
  status: string;
  subscription_plan: string;
  created_at: string;
  owner_name: string;
  branches_count: number;
  staff_count: number;
}

export default function SuperAdminBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      // Get all organizations
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          status,
          subscription_plan,
          created_at
        `);

      if (orgError) throw orgError;

      // Get organization memberships for business owners
      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_memberships')
        .select(`
          user_id,
          organization_id,
          role
        `)
        .eq('role', 'business_owner');

      if (membershipError) throw membershipError;

      // Get profiles for the business owners
      const userIds = membershipData?.map(m => m.user_id) || [];
      let profileData = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select(`
            user_id,
            first_name,
            last_name,
            display_name
          `)
          .in('user_id', userIds);

        if (profileError) {
          console.warn('Error loading profiles:', profileError);
        } else {
          profileData = profiles || [];
        }
      }

      // Get branch counts for each organization
      const orgIds = orgData?.map(org => org.id) || [];
      let branchCounts = {};
      if (orgIds.length > 0) {
        const { data: branchData, error: branchError } = await supabase
          .from('branches')
          .select('organization_id')
          .in('organization_id', orgIds);

        if (!branchError && branchData) {
          branchCounts = branchData.reduce((acc, branch) => {
            acc[branch.organization_id] = (acc[branch.organization_id] || 0) + 1;
            return acc;
          }, {});
        }
      }

      // Get staff counts for each organization
      let staffCounts = {};
      if (orgIds.length > 0) {
        const { data: staffData, error: staffError } = await supabase
          .from('organization_memberships')
          .select('organization_id')
          .in('organization_id', orgIds)
          .neq('role', 'business_owner');

        if (!staffError && staffData) {
          staffCounts = staffData.reduce((acc, staff) => {
            acc[staff.organization_id] = (acc[staff.organization_id] || 0) + 1;
            return acc;
          }, {});
        }
      }

      // Combine the data
      const formattedData = orgData?.map(org => {
        const membership = membershipData?.find(m => m.organization_id === org.id);
        const profile = membership ? profileData?.find(p => p.user_id === membership.user_id) : null;
        
        return {
          id: org.id,
          name: org.name,
          industry: 'Various',
          status: org.status || 'active',
          subscription_plan: org.subscription_plan || 'free',
          created_at: org.created_at,
          owner_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.display_name || 'Unknown' : 'Unknown',
          branches_count: branchCounts[org.id] || 0,
          staff_count: staffCounts[org.id] || 0
        };
      }) || [];

      setBusinesses(formattedData);
    } catch (error) {
      console.error('Error loading businesses:', error);
      toast({
        title: "Error",
        description: "Failed to load businesses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(business =>
    business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variant = status === 'active' ? 'default' : 
                   status === 'suspended' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const variant = plan === 'enterprise' ? 'default' : 
                   plan === 'pro' ? 'secondary' : 'outline';
    return <Badge variant={variant}>{plan}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Business Management</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search businesses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Businesses ({filteredBusinesses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Loading businesses...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Branches</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBusinesses.map((business) => (
                  <TableRow key={business.id}>
                    <TableCell className="font-medium">{business.name}</TableCell>
                    <TableCell>{business.owner_name}</TableCell>
                    <TableCell>{business.industry}</TableCell>
                    <TableCell>{getStatusBadge(business.status)}</TableCell>
                    <TableCell>{getPlanBadge(business.subscription_plan)}</TableCell>
                    <TableCell>{business.branches_count}</TableCell>
                    <TableCell>{business.staff_count}</TableCell>
                    <TableCell>{new Date(business.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Business
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash className="mr-2 h-4 w-4" />
                            Suspend Business
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}