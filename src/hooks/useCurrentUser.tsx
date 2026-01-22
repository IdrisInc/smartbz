import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadCurrentUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      // Get profile for display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, display_name')
        .eq('user_id', user.id)
        .single();

      let displayName = user.email || 'Unknown User';
      
      if (profile) {
        if (profile.display_name) {
          displayName = profile.display_name;
        } else if (profile.first_name || profile.last_name) {
          displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        }
      }

      setCurrentUser({
        id: user.id,
        email: user.email || '',
        displayName
      });
    } catch (error) {
      console.error('Error loading current user:', error);
    } finally {
      setLoading(false);
    }
  };

  return { currentUser, loading, refreshUser: loadCurrentUser };
}
