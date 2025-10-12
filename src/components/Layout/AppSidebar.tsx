
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Crown, AlertTriangle } from 'lucide-react';
import { useRoleBasedNavigation } from './RoleBasedNavigation';
import { useUserRole } from '@/hooks/useUserRole';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { SubscriptionUpgradeInterface } from '@/components/Organization/SubscriptionUpgradeInterface';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const menuItems = useRoleBasedNavigation();
  const { userRole } = useUserRole();
  const { currentPlan, limits, currentUsage, getNextPlan } = useSubscriptionLimits();
  const { businessSettings } = useBusinessSettings();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const isMobile = useIsMobile();
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isCollapsed = state === 'collapsed';

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

  const isLimitReached = () => {
    if (!limits || !currentUsage) return false;
    return (
      (limits.businesses !== -1 && (currentUsage.businesses || 0) >= limits.businesses) ||
      (limits.branchesPerBusiness !== -1 && (currentUsage.branches || 0) >= limits.branchesPerBusiness) ||
      (limits.staffPerBranch !== -1 && (currentUsage.staff || 0) >= limits.staffPerBranch)
    );
  };

  const getSidebarGroupLabel = () => {
    switch (userRole) {
      case 'super_admin':
        return 'Platform Management';
      case 'business_owner':
        return 'Business Management';
      default:
        return 'Staff Dashboard';
    }
  };

  return (
    <Sidebar className="w-64" collapsible="none">
      <SidebarContent>
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Crown className="h-8 w-8 text-primary" />
            {!isCollapsed && (
              <span className="font-bold text-xl truncate">
                {businessSettings?.business_name || 'BizWiz'}
              </span>
            )}
          </div>
          {!isCollapsed && userRole && (
            <div className="mt-2">
              <Badge 
                variant={userRole === 'super_admin' ? 'default' : 'secondary'} 
                className="text-xs"
              >
                {getRoleDisplayName(userRole)}
              </Badge>
            </div>
          )}
        </div>

        {/* Subscription Banner for Business Owners */}
        {!isCollapsed && userRole === 'business_owner' && (
          <div className="px-4 pb-4">
            <Card className={`border ${isLimitReached() ? 'border-destructive' : 'border-border'}`}>
              <CardContent className="p-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Current Plan
                </div>
                <div className="text-sm font-semibold capitalize mb-2">
                  {currentPlan} Plan
                </div>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div>Businesses: {currentUsage?.businesses || 0}/{limits?.businesses === -1 ? '∞' : limits?.businesses || 0}</div>
                  <div>Branches: {currentUsage?.branches || 0}/{limits?.branchesPerBusiness === -1 ? '∞' : limits?.branchesPerBusiness || 0}</div>
                  <div>Staff: {currentUsage?.staff || 0}/{limits?.staffPerBranch === -1 ? '∞' : limits?.staffPerBranch || 0}</div>
                </div>
                {isLimitReached() && getNextPlan() && (
                  <div className="mt-2">
                    <div className="flex items-center gap-1 text-xs text-destructive mb-2">
                      <AlertTriangle className="h-3 w-3" />
                      Limit reached
                    </div>
                    <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setShowUpgradeDialog(true)}>
                      Upgrade to {getNextPlan()}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>{getSidebarGroupLabel()}</SidebarGroupLabel>
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
                            ? 'bg-primary text-primary-foreground font-semibold'
                            : 'text-foreground hover:bg-muted hover:text-foreground font-medium'
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SubscriptionUpgradeInterface 
        open={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        limitReached={isLimitReached()}
      />
    </Sidebar>
  );
}
