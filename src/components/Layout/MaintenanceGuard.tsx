import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Shield, Wrench } from 'lucide-react';

interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  allowed_roles: string[];
}

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { userRole, loading: roleLoading } = useUserRole();
  const [maintenance, setMaintenance] = useState<MaintenanceConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'maintenance_mode')
          .single();

        if (data) {
          setMaintenance(data.setting_value as unknown as MaintenanceConfig);
        }
      } catch {
        // If we can't fetch, assume not in maintenance
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceStatus();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('system_settings_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'system_settings',
        filter: 'setting_key=eq.maintenance_mode',
      }, (payload) => {
        setMaintenance(payload.new.setting_value as unknown as MaintenanceConfig);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading || roleLoading) return null;

  if (maintenance?.enabled && userRole && !maintenance.allowed_roles.includes(userRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="mx-auto max-w-md text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Wrench className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">System Under Maintenance</h1>
            <p className="text-muted-foreground">{maintenance.message}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>We'll be back shortly</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
