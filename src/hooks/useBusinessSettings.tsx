import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface BusinessSettings {
  id?: string;
  organization_id: string;
  business_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  timezone: string;
  logo_url: string | null;
}

export function useBusinessSettings() {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  const loadBusinessSettings = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading business settings:', error);
        return;
      }

      if (data) {
        setBusinessSettings(data);
      } else {
        // Create default settings if none exist
        const defaultSettings: Omit<BusinessSettings, 'id'> = {
          organization_id: currentOrganization.id,
          business_name: currentOrganization.name || 'My Business',
          email: null,
          phone: null,
          address: null,
          city: null,
          country: null,
          timezone: 'UTC',
          logo_url: null,
        };
        setBusinessSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading business settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBusinessSettings = async (settings: Omit<BusinessSettings, 'id' | 'organization_id'>) => {
    if (!currentOrganization?.id) return false;

    try {
      const settingsData = {
        ...settings,
        organization_id: currentOrganization.id,
      };

      const { error } = await supabase
        .from('business_settings')
        .upsert(settingsData, {
          onConflict: 'organization_id'
        });

      if (error) {
        console.error('Error saving business settings:', error);
        toast.error('Failed to save business settings');
        return false;
      }

      setBusinessSettings({ ...settingsData, id: businessSettings?.id });
      toast.success('Business settings saved successfully');
      
      // Log the action
      await supabase.from('system_logs').insert({
        organization_id: currentOrganization.id,
        level: 'info',
        message: 'Business settings updated',
        module: 'settings',
        action: 'update_business_settings',
        details: { business_name: settings.business_name }
      });

      return true;
    } catch (error) {
      console.error('Error saving business settings:', error);
      toast.error('Failed to save business settings');
      return false;
    }
  };

  useEffect(() => {
    loadBusinessSettings();
  }, [currentOrganization?.id]);

  return {
    businessSettings,
    loading,
    saveBusinessSettings,
    refreshBusinessSettings: loadBusinessSettings,
  };
}