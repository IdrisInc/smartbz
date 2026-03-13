
-- System settings table for maintenance mode and other global settings
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read system settings (needed for maintenance check)
CREATE POLICY "Anyone can view system settings" ON public.system_settings
  FOR SELECT TO authenticated USING (true);

-- Only super admins can manage system settings
CREATE POLICY "Super admins can manage system settings" ON public.system_settings
  FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- Insert default maintenance mode setting
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES ('maintenance_mode', '{"enabled": false, "message": "System is under maintenance. Please try again later.", "allowed_roles": ["super_admin"]}'::jsonb, 'Controls system-wide maintenance mode');

-- Add updated_at trigger
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
