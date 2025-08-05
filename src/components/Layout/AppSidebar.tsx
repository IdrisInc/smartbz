
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { useRoleBasedNavigation } from './RoleBasedNavigation';
import { useUserRole } from '@/hooks/useUserRole';
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
import { Badge } from '@/components/ui/badge';

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const menuItems = useRoleBasedNavigation();
  const { userRole } = useUserRole();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Crown className="h-8 w-8 text-primary" />
            {!isCollapsed && <span className="font-bold text-xl">BizWiz</span>}
          </div>
          {!isCollapsed && userRole && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {userRole.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          )}
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
                      {!isCollapsed && <span>{item.title}</span>}
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
