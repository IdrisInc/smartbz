import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Search, MoreHorizontal, Eye, Edit, Pause, Play, Mail, Phone, MapPin, Calendar, Users, GitBranch } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  owner_email?: string;
  branches_count: number;
  staff_count: number;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export default function SuperAdminBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    status: '',
    subscription_plan: ''
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*');

      if (orgError) throw orgError;

      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_memberships')
        .select('user_id, organization_id, role')
        .eq('role', 'business_owner');

      if (membershipError) throw membershipError;

      const userIds = membershipData?.map(m => m.user_id) || [];
      let profileData: any[] = [];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, display_name')
          .in('user_id', userIds);
        profileData = profiles || [];
      }

      const orgIds = orgData?.map(org => org.id) || [];
      let branchCounts: Record<string, number> = {};
      let staffCounts: Record<string, number> = {};

      if (orgIds.length > 0) {
        const { data: branchData } = await supabase
          .from('branches')
          .select('organization_id')
          .in('organization_id', orgIds);
        
        branchCounts = (branchData || []).reduce((acc, b) => {
          acc[b.organization_id] = (acc[b.organization_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const { data: staffData } = await supabase
          .from('organization_memberships')
          .select('organization_id')
          .in('organization_id', orgIds)
          .neq('role', 'business_owner');

        staffCounts = (staffData || []).reduce((acc, s) => {
          acc[s.organization_id] = (acc[s.organization_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }

      const formattedData = orgData?.map(org => {
        const membership = membershipData?.find(m => m.organization_id === org.id);
        const profile = membership ? profileData?.find(p => p.user_id === membership.user_id) : null;
        
        return {
          id: org.id,
          name: org.name,
          industry: org.business_sector || 'Various',
          status: org.status || 'active',
          subscription_plan: org.subscription_plan || 'free',
          created_at: org.created_at,
          owner_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.display_name || 'Unknown' : 'Unknown',
          branches_count: branchCounts[org.id] || 0,
          staff_count: staffCounts[org.id] || 0,
          email: org.email,
          phone: org.phone,
          address: org.address,
          city: org.city,
          country: org.country
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

  const handleViewDetails = (business: Business) => {
    setSelectedBusiness(business);
    setViewDialogOpen(true);
  };

  const handleEditBusiness = (business: Business) => {
    setSelectedBusiness(business);
    setEditForm({
      name: business.name,
      status: business.status,
      subscription_plan: business.subscription_plan
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedBusiness) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: editForm.name,
          status: editForm.status,
          subscription_plan: editForm.subscription_plan as any
        })
        .eq('id', selectedBusiness.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Business updated successfully",
      });
      
      setEditDialogOpen(false);
      loadBusinesses();
    } catch (error) {
      console.error('Error updating business:', error);
      toast({
        title: "Error",
        description: "Failed to update business",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (business: Business) => {
    const newStatus = business.status === 'active' ? 'suspended' : 'active';
    
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status: newStatus })
        .eq('id', business.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Business ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`,
      });
      
      loadBusinesses();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: "Error",
        description: "Failed to update business status",
        variant: "destructive"
      });
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
                   plan === 'premium' ? 'default' :
                   plan === 'basic' ? 'secondary' : 'outline';
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
                    <TableCell className="capitalize">{business.industry.replace('_', ' ')}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleViewDetails(business)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditBusiness(business)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Business
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(business)}
                            className={business.status === 'active' ? 'text-destructive' : 'text-green-600'}
                          >
                            {business.status === 'active' ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Suspend Business
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Activate Business
                              </>
                            )}
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

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Business Details</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedBusiness?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedBusiness && (
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Business Name</Label>
                  <p className="font-medium">{selectedBusiness.name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Owner</Label>
                  <p className="font-medium">{selectedBusiness.owner_name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Industry</Label>
                  <p className="font-medium capitalize">{selectedBusiness.industry.replace('_', ' ')}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(selectedBusiness.status)}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Subscription Plan</Label>
                  <div>{getPlanBadge(selectedBusiness.subscription_plan)}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedBusiness.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {selectedBusiness.email || 'Not provided'}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {selectedBusiness.phone || 'Not provided'}
                  </p>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {[selectedBusiness.address, selectedBusiness.city, selectedBusiness.country]
                      .filter(Boolean).join(', ') || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <GitBranch className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{selectedBusiness.branches_count}</p>
                        <p className="text-sm text-muted-foreground">Branches</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{selectedBusiness.staff_count}</p>
                        <p className="text-sm text-muted-foreground">Staff Members</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Business</DialogTitle>
            <DialogDescription>
              Update business information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Subscription Plan</Label>
              <Select
                value={editForm.subscription_plan}
                onValueChange={(value) => setEditForm({ ...editForm, subscription_plan: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
