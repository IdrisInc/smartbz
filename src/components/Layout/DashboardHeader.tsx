import React, { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { OrganizationSelector } from '@/components/Organization/OrganizationSelector';
import { NotificationCenter } from '@/components/Notifications/NotificationCenter';
import { UserProfileModal } from '@/components/UserProfile/UserProfileModal';
import { GlobalSearch } from '@/components/Layout/GlobalSearch';
import { LanguageThemeSelector } from '@/components/Layout/LanguageThemeSelector';

export function DashboardHeader() {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 gap-4">
        <SidebarTrigger />
        
        {/* Global Search */}
        <GlobalSearch />
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-3">
          <OrganizationSelector />
          
          {/* Language and Theme */}
          <LanguageThemeSelector />
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden md:block">{user?.email}</span>
            <NotificationCenter />
            <Button variant="ghost" size="icon" onClick={() => setShowProfile(true)}>
              <User className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <UserProfileModal 
        open={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
    </header>
  );
}
