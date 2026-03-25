import React, { useState, useEffect } from 'react';
import { useUserRole, UserPermissions } from '@/hooks/useUserRole';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, Users, Package, ShoppingCart, TrendingUp, FileText, Wallet,
  Settings, Building2, UserCheck, GitBranch, Crown, CreditCard, BarChart3,
  Store, UserCog, DollarSign, FolderOpen, CheckSquare, Smartphone, HelpCircle
} from 'lucide-react';

interface NavigationItem {
  title: string;
  titleKey: string;
  url: string;
  icon: React.ComponentType<any>;
  requiredPermission?: keyof UserPermissions;
  moduleKey?: string;
  badge?: string;
}

export function useRoleBasedNavigation() {
  const { userRole, permissions } = useUserRole();
  const { currentOrganization } = useOrganization();
  const { t } = useLanguage();
  const [hiddenModules, setHiddenModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentOrganization || userRole === 'super_admin') return;
    
    supabase
      .from('org_module_visibility')
      .select('module_key, is_visible')
      .eq('organization_id', currentOrganization.id)
      .then(({ data }) => {
        const hidden = new Set<string>();
        data?.forEach(row => { if (!row.is_visible) hidden.add(row.module_key); });
        setHiddenModules(hidden);
      });
  }, [currentOrganization, userRole]);

  const superAdminItems: NavigationItem[] = [
    { title: t('nav.dashboard'), titleKey: 'nav.dashboard', url: "/dashboard", icon: LayoutDashboard },
    { title: t('nav.owners'), titleKey: 'nav.owners', url: "/dashboard/super-admin/owners", icon: Crown },
    { title: t('nav.businesses'), titleKey: 'nav.businesses', url: "/dashboard/super-admin/businesses", icon: Building2 },
    { title: t('nav.branches'), titleKey: 'nav.branches', url: "/dashboard/super-admin/branches", icon: GitBranch },
    { title: t('nav.staff'), titleKey: 'nav.staff', url: "/dashboard/super-admin/staff", icon: UserCog },
    { title: t('nav.subscriptions'), titleKey: 'nav.subscriptions', url: "/dashboard/super-admin/subscriptions", icon: CreditCard },
    { title: t('nav.reports'), titleKey: 'nav.reports', url: "/dashboard/super-admin/reports", icon: BarChart3 },
    { title: t('nav.trunker'), titleKey: 'nav.trunker', url: "/dashboard/trunker", icon: FileText },
    { title: t('nav.faq'), titleKey: 'nav.faq', url: "/dashboard/faq", icon: HelpCircle },
    { title: t('nav.settings'), titleKey: 'nav.settings', url: "/dashboard/settings", icon: Settings },
  ];

  const allNavigationItems: NavigationItem[] = [
    { title: t('nav.dashboard'), titleKey: 'nav.dashboard', url: "/dashboard", icon: LayoutDashboard },
    { title: t('nav.branches'), titleKey: 'nav.branches', url: "/dashboard/branches", icon: GitBranch, requiredPermission: 'canManageBranches', moduleKey: 'branches' },
    { title: t('nav.employees'), titleKey: 'nav.employees', url: "/dashboard/employees", icon: UserCheck, requiredPermission: 'canManageEmployees', moduleKey: 'employees' },
    { title: t('nav.products'), titleKey: 'nav.products', url: "/dashboard/products", icon: Package, requiredPermission: 'canManageProducts', moduleKey: 'products' },
    { title: t('nav.inventory'), titleKey: 'nav.inventory', url: "/dashboard/inventory", icon: Store, requiredPermission: 'canManageInventory', moduleKey: 'inventory' },
    { title: t('nav.sales'), titleKey: 'nav.sales', url: "/dashboard/sales", icon: ShoppingCart, requiredPermission: 'canProcessSales', moduleKey: 'sales' },
    { title: t('nav.pendingApprovals'), titleKey: 'nav.pendingApprovals', url: "/dashboard/pending-approvals", icon: CheckSquare, moduleKey: 'pending-approvals' },
    { title: t('nav.finance'), titleKey: 'nav.finance', url: "/dashboard/finance", icon: Wallet, requiredPermission: 'canManageFinances', moduleKey: 'finance' },
    { title: t('nav.expenseCategories'), titleKey: 'nav.expenseCategories', url: "/dashboard/expense-categories", icon: FolderOpen, requiredPermission: 'canManageExpenses', moduleKey: 'expense-categories' },
    { title: t('nav.cashRegisters'), titleKey: 'nav.cashRegisters', url: "/dashboard/cash-registers", icon: DollarSign, requiredPermission: 'canProcessSales', moduleKey: 'cash-registers' },
    { title: t('nav.contacts'), titleKey: 'nav.contacts', url: "/dashboard/contacts", icon: Users, requiredPermission: 'canManageContacts', moduleKey: 'contacts' },
    { title: t('nav.paymentHistory'), titleKey: 'nav.paymentHistory', url: "/dashboard/payment-history", icon: Smartphone, requiredPermission: 'canManageFinances', moduleKey: 'payment-history' },
    { title: t('nav.reports'), titleKey: 'nav.reports', url: "/dashboard/reports", icon: TrendingUp, requiredPermission: 'canViewReports', moduleKey: 'reports' },
    { title: t('nav.faq'), titleKey: 'nav.faq', url: "/dashboard/faq", icon: HelpCircle, moduleKey: 'faq' },
    { title: t('nav.trunker'), titleKey: 'nav.trunker', url: "/dashboard/trunker", icon: FileText, requiredPermission: 'canViewLogs', moduleKey: 'trunker' },
    { title: t('nav.settings'), titleKey: 'nav.settings', url: "/dashboard/settings", icon: Settings, requiredPermission: 'canManageSettings', moduleKey: 'settings' },
  ];

  const filterByPermissions = (items: NavigationItem[]): NavigationItem[] => {
    if (!permissions) return [{ title: t('nav.dashboard'), titleKey: 'nav.dashboard', url: "/dashboard", icon: LayoutDashboard }];
    
    return items.filter(item => {
      if (item.url === "/dashboard") return true;
      if (item.moduleKey && hiddenModules.has(item.moduleKey)) return false;
      if (!item.requiredPermission) return true;
      return permissions[item.requiredPermission] === true;
    });
  };

  if (userRole === 'super_admin') return superAdminItems;
  if (userRole === 'business_owner') return filterByPermissions(allNavigationItems);
  return filterByPermissions(allNavigationItems);
}

export function RoleBasedNavigation() {
  const navigation = useRoleBasedNavigation();
  const { userRole } = useUserRole();
  const { t } = useLanguage();

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'super_admin': t('roles.superAdmin'),
      'business_owner': t('roles.businessOwner'),
      'manager': t('roles.manager'),
      'admin_staff': t('roles.adminStaff'),
      'sales_staff': t('roles.salesStaff'),
      'inventory_staff': t('roles.inventoryStaff'),
      'finance_staff': t('roles.financeStaff'),
      'cashier': t('roles.cashier'),
    };
    return roleMap[role] || role;
  };

  return (
    <div className="space-y-2">
      {userRole && (
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t('common.role')}: {getRoleDisplayName(userRole)}
        </div>
      )}
      <nav className="space-y-1">
        {navigation.map((item) => (
          <div key={item.url} className="flex items-center justify-between">
            <span className="text-sm font-medium">{item.title}</span>
            {item.badge && (
              <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">{item.badge}</span>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
