import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  allowed_roles: string[];
}

export function MaintenanceSettings() {
  const [config, setConfig] = useState<MaintenanceConfig>({
    enabled: false,
    message: 'System is under maintenance. Please try again later.',
    allowed_roles: ['super_admin'],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'maintenance_mode')
        .single();

      if (data && !error) {
        const value = data.setting_value as unknown as MaintenanceConfig;
        setConfig(value);
      }
    } catch (err) {
      console.error('Error loading maintenance config:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          setting_value: config as unknown as Record<string, unknown>,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('setting_key', 'maintenance_mode');

      if (error) throw error;

      toast({
        title: config.enabled ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled',
        description: config.enabled
          ? 'Only super admins can access the system now.'
          : 'All users can access the system normally.',
      });
    } catch (err) {
      console.error('Error saving maintenance config:', err);
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            <CardTitle>Maintenance Mode</CardTitle>
          </div>
          <CardDescription>
            When enabled, only super admins can access the system. All other users will see a maintenance page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {config.enabled && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Maintenance mode is currently <strong>ACTIVE</strong>. Non-admin users cannot access the system.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <Label className="text-base font-medium">Enable Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Block all non-super-admin users from accessing the system
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => setConfig((prev) => ({ ...prev, enabled }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Maintenance Message</Label>
            <Textarea
              value={config.message}
              onChange={(e) => setConfig((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Message to display to users during maintenance..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Allowed Roles During Maintenance</Label>
            <div className="flex flex-wrap gap-2">
              {config.allowed_roles.map((role) => (
                <Badge key={role} variant="secondary">{role}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Only users with these roles can access the system during maintenance.
            </p>
          </div>

          <Button onClick={saveConfig} disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
