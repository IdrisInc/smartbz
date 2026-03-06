import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { LayoutDashboard, Package, ShoppingCart, Store, Users, Wallet, TrendingUp, UserCheck, GitBranch, DollarSign, FolderOpen, CheckSquare, FileText, Smartphone, HelpCircle, Settings } from 'lucide-react';

const ALL_MODULES = [
  { key: 'branches', label: 'Branches', icon: GitBranch },
  { key: 'employees', label: 'Employees', icon: UserCheck },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'inventory', label: 'Inventory', icon: Store },
  { key: 'sales', label: 'Sales', icon: ShoppingCart },
  { key: 'pending-approvals', label: 'Pending Approvals', icon: CheckSquare },
  { key: 'finance', label: 'Finance', icon: Wallet },
  { key: 'expense-categories', label: 'Expense Categories', icon: FolderOpen },
  { key: 'cash-registers', label: 'Cash Registers', icon: DollarSign },
  { key: 'contacts', label: 'Contacts', icon: Users },
  { key: 'payment-history', label: 'Payment History', icon: Smartphone },
  { key: 'reports', label: 'Reports', icon: TrendingUp },
  { key: 'faq', label: 'FAQ / Help', icon: HelpCircle },
  { key: 'trunker', label: 'Trunker', icon: FileText },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export function ModuleVisibilitySettings() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentOrganization) return;
    loadVisibility();
  }, [currentOrganization]);

  const loadVisibility = async () => {
    if (!currentOrganization) return;
    const { data } = await supabase
      .from('org_module_visibility')
      .select('module_key, is_visible')
      .eq('organization_id', currentOrganization.id);

    const vis: Record<string, boolean> = {};
    ALL_MODULES.forEach(m => { vis[m.key] = true; }); // default all visible
    data?.forEach(row => { vis[row.module_key] = row.is_visible; });
    setVisibility(vis);
  };

  const handleToggle = (key: string) => {
    setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!currentOrganization) return;
    setSaving(true);

    const upserts = ALL_MODULES.map(m => ({
      organization_id: currentOrganization.id,
      module_key: m.key,
      is_visible: visibility[m.key] ?? true,
    }));

    const { error } = await supabase
      .from('org_module_visibility')
      .upsert(upserts, { onConflict: 'organization_id,module_key' });

    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to save module visibility', variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Module visibility updated successfully' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sidebar Module Visibility</CardTitle>
        <CardDescription>Choose which modules appear in the sidebar for your organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ALL_MODULES.map(mod => (
            <div key={mod.key} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <mod.icon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor={`mod-${mod.key}`} className="cursor-pointer">{mod.label}</Label>
              </div>
              <Switch
                id={`mod-${mod.key}`}
                checked={visibility[mod.key] ?? true}
                onCheckedChange={() => handleToggle(mod.key)}
              />
            </div>
          ))}
        </div>
        <Button className="mt-4" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
}
