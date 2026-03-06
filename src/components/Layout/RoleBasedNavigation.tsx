import React, { useState, useEffect } from 'react';
import { useUserRole, UserPermissions } from '@/hooks/useUserRole';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, Users, Package, ShoppingCart, TrendingUp, FileText, Wallet,
  Settings, Building2, UserCheck, GitBranch, Crown, CreditCard, BarChart3,
  Store, UserCog, DollarSign, FolderOpen, CheckSquare, Smartphone, HelpCircle
} from 'lucide-react';

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  requiredPermission?: keyof UserPermissions;
  moduleKey?: string;
  badge?: string;
}

export function useRoleBasedNavigation() {
  const { userRole, permissions } = useUserRole();
  const { currentOrganization } = useOrganization();
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
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Owners", url: "/dashboard/super-admin/owners", icon: Crown },
    { title: "Businesses", url: "/dashboard/super-admin/businesses", icon: Building2 },
    { title: "Branches", url: "/dashboard/super-admin/branches", icon: GitBranch },
    { title: "Staff", url: "/dashboard/super-admin/staff", icon: UserCog },
    { title: "Subscriptions", url: "/dashboard/super-admin/subscriptions", icon: CreditCard },
    { title: "Reports", url: "/dashboard/super-admin/reports", icon: BarChart3 },
    { title: "Trunker", url: "/dashboard/trunker", icon: FileText },
    { title: "FAQ", url: "/dashboard/faq", icon: HelpCircle },
    { title: "Settings", url: "/dashboard/settings", icon: Settings },
  ];

  const allNavigationItems: NavigationItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Branches", url: "/dashboard/branches", icon: GitBranch, requiredPermission: 'canManageBranches', moduleKey: 'branches' },
    { title: "Employees", url: "/dashboard/employees", icon: UserCheck, requiredPermission: 'canManageEmployees', moduleKey: 'employees' },
    { title: "Products", url: "/dashboard/products", icon: Package, requiredPermission: 'canManageProducts', moduleKey: 'products' },
    { title: "Inventory", url: "/dashboard/inventory", icon: Store, requiredPermission: 'canManageInventory', moduleKey: 'inventory' },
    { title: "Sales", url: "/dashboard/sales", icon: ShoppingCart, requiredPermission: 'canProcessSales', moduleKey: 'sales' },
    { title: "Pending Approvals", url: "/dashboard/pending-approvals", icon: CheckSquare, moduleKey: 'pending-approvals' },
    { title: "Finance", url: "/dashboard/finance", icon: Wallet, requiredPermission: 'canManageFinances', moduleKey: 'finance' },
    { title: "Expense Categories", url: "/dashboard/expense-categories", icon: FolderOpen, requiredPermission: 'canManageExpenses', moduleKey: 'expense-categories' },
    { title: "Cash Registers", url: "/dashboard/cash-registers", icon: DollarSign, requiredPermission: 'canProcessSales', moduleKey: 'cash-registers' },
    { title: "Contacts", url: "/dashboard/contacts", icon: Users, requiredPermission: 'canManageContacts', moduleKey: 'contacts' },
    { title: "Payment History", url: "/dashboard/payment-history", icon: Smartphone, requiredPermission: 'canManageFinances', moduleKey: 'payment-history' },
    { title: "Reports", url: "/dashboard/reports", icon: TrendingUp, requiredPermission: 'canViewReports', moduleKey: 'reports' },
    { title: "FAQ", url: "/dashboard/faq", icon: HelpCircle, moduleKey: 'faq' },
    { title: "Trunker", url: "/dashboard/trunker", icon: FileText, requiredPermission: 'canViewLogs', moduleKey: 'trunker' },
    { title: "Settings", url: "/dashboard/settings", icon: Settings, requiredPermission: 'canManageSettings', moduleKey: 'settings' },
  ];

  const filterByPermissions = (items: NavigationItem[]): NavigationItem[] => {
    if (!permissions) return [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }];
    
    return items.filter(item => {
      if (item.url === "/dashboard") return true;
      // Check module visibility
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

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'super_admin': 'Super Admin',
      'business_owner': 'Business Owner',
      'manager': 'Manager',
      'admin_staff': 'Admin Staff',
      'sales_staff': 'Sales Staff',
      'inventory_staff': 'Inventory Staff',
      'finance_staff': 'Finance Staff',
      'cashier': 'Cashier',
    };
    return roleMap[role] || role;
  };

  return (
    <div className="space-y-2">
      {userRole && (
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Role: {getRoleDisplayName(userRole)}
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
