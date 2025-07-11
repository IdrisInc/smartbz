
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Package,
  Users,
  ShoppingCart,
  Truck,
  DollarSign,
  UserCheck,
  BarChart3,
  Settings,
  Home,
  Crown
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Products & Services', url: '/products', icon: Package },
  { title: 'Customers & Suppliers', url: '/contacts', icon: Users },
  { title: 'Sales & Orders', url: '/sales', icon: ShoppingCart },
  { title: 'Purchases & Inventory', url: '/inventory', icon: Truck },
  { title: 'Finance & Accounting', url: '/finance', icon: DollarSign },
  { title: 'Employee Management', url: '/employees', icon: UserCheck },
  { title: 'Reports & Analytics', url: '/reports', icon: BarChart3 },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { collapsed } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible>
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Crown className="h-8 w-8 text-primary" />
            {!collapsed && <span className="font-bold text-xl">BizWiz</span>}
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Business Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
