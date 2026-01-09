import React from 'react';
import { useUserRole, UserPermissions } from '@/hooks/useUserRole';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  FileText, 
  Wallet, 
  Calendar,
  Settings,
  Building2,
  UserCheck,
  GitBranch,
  Crown,
  Shield,
  CreditCard,
  BarChart3,
  Store,
  UserCog,
  ShoppingBag,
  RotateCcw,
  ClipboardList,
  Tag,
  FolderOpen,
  DollarSign,
  CheckSquare,
  Smartphone
} from 'lucide-react';

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  requiredPermission?: keyof UserPermissions;
  badge?: string;
}

export function useRoleBasedNavigation() {
  const { userRole, permissions } = useUserRole();

  // Super Admin Navigation - always full access
  const superAdminItems: NavigationItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Owners", url: "/dashboard/super-admin/owners", icon: Crown },
    { title: "Businesses", url: "/dashboard/super-admin/businesses", icon: Building2 },
    { title: "Branches", url: "/dashboard/super-admin/branches", icon: GitBranch },
    { title: "Staff", url: "/dashboard/super-admin/staff", icon: UserCog },
    { title: "Subscriptions", url: "/dashboard/super-admin/subscriptions", icon: CreditCard },
    { title: "Reports", url: "/dashboard/super-admin/reports", icon: BarChart3 },
    { title: "Trunker", url: "/dashboard/trunker", icon: FileText },
    { title: "Settings", url: "/dashboard/settings", icon: Settings },
  ];

  // All possible navigation items with their required permissions
  const allNavigationItems: NavigationItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Branches", url: "/dashboard/branches", icon: GitBranch, requiredPermission: 'canManageBranches' },
    { title: "Employees", url: "/dashboard/employees", icon: UserCheck, requiredPermission: 'canManageEmployees' },
    { title: "Products", url: "/dashboard/products", icon: Package, requiredPermission: 'canManageProducts' },
    { title: "Inventory", url: "/dashboard/inventory", icon: Store, requiredPermission: 'canManageInventory' },
    { title: "Sales", url: "/dashboard/sales", icon: ShoppingCart, requiredPermission: 'canProcessSales' },
    { title: "Pending Approvals", url: "/dashboard/pending-approvals", icon: CheckSquare },
    { title: "Finance", url: "/dashboard/finance", icon: Wallet, requiredPermission: 'canManageFinances' },
    { title: "Expense Categories", url: "/dashboard/expense-categories", icon: FolderOpen, requiredPermission: 'canManageExpenses' },
    { title: "Cash Registers", url: "/dashboard/cash-registers", icon: DollarSign, requiredPermission: 'canProcessSales' },
    { title: "Contacts", url: "/dashboard/contacts", icon: Users, requiredPermission: 'canManageContacts' },
    { title: "Payment History", url: "/dashboard/payment-history", icon: Smartphone, requiredPermission: 'canManageFinances' },
    { title: "Reports", url: "/dashboard/reports", icon: TrendingUp, requiredPermission: 'canViewReports' },
    { title: "Trunker", url: "/dashboard/trunker", icon: FileText, requiredPermission: 'canViewLogs' },
    { title: "Settings", url: "/dashboard/settings", icon: Settings, requiredPermission: 'canManageSettings' },
  ];

  // Filter navigation items based on permissions
  const filterByPermissions = (items: NavigationItem[]): NavigationItem[] => {
    if (!permissions) return [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }];
    
    return items.filter(item => {
      // Dashboard is always visible
      if (item.url === "/dashboard") return true;
      
      // If no permission required, show the item
      if (!item.requiredPermission) return true;
      
      // Check if user has the required permission
      return permissions[item.requiredPermission] === true;
    });
  };

  // Return navigation based on user role
  if (userRole === 'super_admin') {
    return superAdminItems;
  }

  // Business owner gets all items
  if (userRole === 'business_owner') {
    return allNavigationItems;
  }

  // All other roles get filtered items based on their permissions
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
              <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
