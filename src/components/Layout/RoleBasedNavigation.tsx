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
  GitBranch
} from 'lucide-react';

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  requiredPermissions?: Array<keyof import('@/hooks/useUserRole').UserPermissions>;
  badge?: string;
}

export function useRoleBasedNavigation() {
  const { permissions } = useUserRole();

  const allNavigationItems: NavigationItem[] = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Sales",
      url: "/sales",
      icon: ShoppingCart,
      requiredPermissions: ['canProcessSales'],
    },
    {
      title: "Products",
      url: "/products",
      icon: Package,
      requiredPermissions: ['canManageProducts'],
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: Package,
      requiredPermissions: ['canManageInventory'],
    },
    {
      title: "Contacts",
      url: "/contacts",
      icon: Users,
      requiredPermissions: ['canManageUsers'],
    },
    {
      title: "Employees",
      url: "/employees",
      icon: UserCheck,
      requiredPermissions: ['canManageEmployees'],
    },
    {
      title: "Finance",
      url: "/finance",
      icon: Wallet,
      requiredPermissions: ['canManageFinances'],
    },
    {
      title: "Reports",
      url: "/reports",
      icon: TrendingUp,
      requiredPermissions: ['canViewReports'],
    },
    {
      title: "Branches",
      url: "/branches",
      icon: GitBranch,
      requiredPermissions: ['canViewAllBranches'],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      requiredPermissions: ['canManageOrganizations'],
    },
  ];

  // Filter navigation items based on user permissions
  const filteredNavigation = allNavigationItems.filter(item => {
    if (!item.requiredPermissions || !permissions) {
      return true; // Show items without requirements or when permissions not loaded
    }

    return item.requiredPermissions.every(permission => permissions[permission]);
  });

  return filteredNavigation;
}

export function RoleBasedNavigation() {
  const navigation = useRoleBasedNavigation();
  const { userRole } = useUserRole();

  return (
    <div className="space-y-2">
      {userRole && (
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Role: {userRole.replace('_', ' ')}
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