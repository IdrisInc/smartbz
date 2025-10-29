import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
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
  DollarSign
} from 'lucide-react';

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  requiredRoles?: Array<import('@/hooks/useUserRole').UserRole>;
  badge?: string;
}

export function useRoleBasedNavigation() {
  const { userRole } = useUserRole();

  // Super Admin Navigation
  const superAdminItems: NavigationItem[] = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Owners", url: "/super-admin/owners", icon: Crown },
    { title: "Businesses", url: "/super-admin/businesses", icon: Building2 },
    { title: "Branches", url: "/super-admin/branches", icon: GitBranch },
    { title: "Staff", url: "/super-admin/staff", icon: UserCog },
    { title: "Subscriptions", url: "/super-admin/subscriptions", icon: CreditCard },
    { title: "Reports", url: "/super-admin/reports", icon: BarChart3 },
    { title: "Trunker", url: "/trunker", icon: FileText },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  // Business Owner Navigation
  const businessOwnerItems: NavigationItem[] = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Branches", url: "/branches", icon: GitBranch },
    { title: "Employees", url: "/employees", icon: UserCheck },
    { title: "Products", url: "/products", icon: Package },
    { title: "Inventory", url: "/inventory", icon: Store },
    { title: "Sales", url: "/sales", icon: ShoppingCart },
    { title: "Finance", url: "/finance", icon: Wallet },
    { title: "Expense Categories", url: "/expense-categories", icon: FolderOpen },
    { title: "Cash Registers", url: "/cash-registers", icon: DollarSign },
    { title: "Contacts", url: "/contacts", icon: Users },
    { title: "Reports", url: "/reports", icon: TrendingUp },
    { title: "Trunker", url: "/trunker", icon: FileText },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  // Admin Staff Navigation (Full branch access)
  const adminStaffItems: NavigationItem[] = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Products", url: "/products", icon: Package },
    { title: "Inventory", url: "/inventory", icon: Store },
    { title: "Sales", url: "/sales", icon: ShoppingCart },
    { title: "Finance", url: "/finance", icon: Wallet },
    { title: "Expense Categories", url: "/expense-categories", icon: FolderOpen },
    { title: "Cash Registers", url: "/cash-registers", icon: DollarSign },
    { title: "Reports", url: "/reports", icon: TrendingUp },
    { title: "Contacts", url: "/contacts", icon: Users },
    { title: "Trunker", url: "/trunker", icon: FileText },
  ];

  // Sales Staff Navigation
  const salesStaffItems: NavigationItem[] = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Sales", url: "/sales", icon: ShoppingCart },
    { title: "Contacts", url: "/contacts", icon: Users },
  ];

  // Inventory Staff Navigation
  const inventoryStaffItems: NavigationItem[] = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Products", url: "/products", icon: Package },
    { title: "Inventory", url: "/inventory", icon: Store },
  ];

  // Finance Staff Navigation
  const financeStaffItems: NavigationItem[] = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Finance", url: "/finance", icon: Wallet },
    { title: "Reports", url: "/reports", icon: TrendingUp },
  ];

  // Return navigation based on user role
  switch (userRole) {
    case 'super_admin':
      return superAdminItems;
    case 'business_owner':
      return businessOwnerItems;
    case 'admin_staff':
      return adminStaffItems;
    case 'sales_staff':
      return salesStaffItems;
    case 'inventory_staff':
      return inventoryStaffItems;
    case 'finance_staff':
      return financeStaffItems;
    default:
      return businessOwnerItems; // Default fallback
  }
}

export function RoleBasedNavigation() {
  const navigation = useRoleBasedNavigation();
  const { userRole } = useUserRole();

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'super_admin': 'Super Admin',
      'business_owner': 'Business Owner',
      'admin_staff': 'Admin Staff',
      'sales_staff': 'Sales Staff',
      'inventory_staff': 'Inventory Staff',
      'finance_staff': 'Finance Staff',
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