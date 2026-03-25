import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { LayoutDashboard, Package, ShoppingCart, Store, Users, Wallet, TrendingUp, UserCheck, GitBranch, DollarSign, FolderOpen, CheckSquare, FileText, Smartphone, HelpCircle, Settings } from 'lucide-react';

const ALL_MODULES = [
  { key: 'branches', labelKey: 'nav.branches', icon: GitBranch },
  { key: 'employees', labelKey: 'nav.employees', icon: UserCheck },
  { key: 'products', labelKey: 'nav.products', icon: Package },
  { key: 'inventory', labelKey: 'nav.inventory', icon: Store },
  { key: 'sales', labelKey: 'nav.sales', icon: ShoppingCart },
  { key: 'pending-approvals', labelKey: 'nav.pendingApprovals', icon: CheckSquare },
  { key: 'finance', labelKey: 'nav.finance', icon: Wallet },
  { key: 'expense-categories', labelKey: 'nav.expenseCategories', icon: FolderOpen },
  { key: 'cash-registers', labelKey: 'nav.cashRegisters', icon: DollarSign },
  { key: 'contacts', labelKey: 'nav.contacts', icon: Users },
  { key: 'payment-history', labelKey: 'nav.paymentHistory', icon: Smartphone },
  { key: 'reports', labelKey: 'nav.reports', icon: TrendingUp },
  { key: 'faq', labelKey: 'nav.faq', icon: HelpCircle },
  { key: 'trunker', labelKey: 'nav.trunker', icon: FileText },
  { key: 'settings', labelKey: 'nav.settings', icon: Settings },
];

export function ModuleVisibilitySettings() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const { t } = useLanguage();
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
    ALL_MODULES.forEach(m => { vis[m.key] = true; });
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
      toast({ title: t('common.error'), description: t('moduleVisibility.saveFailed'), variant: 'destructive' });
    } else {
      toast({ title: t('common.success'), description: t('moduleVisibility.saved') });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('moduleVisibility.title')}</CardTitle>
        <CardDescription>{t('moduleVisibility.desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ALL_MODULES.map(mod => (
            <div key={mod.key} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <mod.icon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor={`mod-${mod.key}`} className="cursor-pointer">{t(mod.labelKey)}</Label>
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
          {saving ? t('common.saving') : t('common.saveChanges')}
        </Button>
      </CardContent>
    </Card>
  );
}
