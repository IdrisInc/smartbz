-- Create business_settings table for storing business information
CREATE TABLE public.business_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  business_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  timezone TEXT DEFAULT 'UTC',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view business settings for their organizations" 
ON public.business_settings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM organization_memberships 
  WHERE organization_memberships.organization_id = business_settings.organization_id 
  AND organization_memberships.user_id = auth.uid()
));

CREATE POLICY "Organization owners can manage business settings" 
ON public.business_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM organization_memberships 
  WHERE organization_memberships.organization_id = business_settings.organization_id 
  AND organization_memberships.user_id = auth.uid() 
  AND organization_memberships.is_owner = true
));

-- Create system_logs table for real logging
CREATE TABLE public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  user_id UUID,
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'debug')),
  message TEXT NOT NULL,
  module TEXT NOT NULL,
  action TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for system_logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for system_logs
CREATE POLICY "Users can view logs for their organizations" 
ON public.system_logs 
FOR SELECT 
USING (
  organization_id IS NULL OR 
  EXISTS (
    SELECT 1 FROM organization_memberships 
    WHERE organization_memberships.organization_id = system_logs.organization_id 
    AND organization_memberships.user_id = auth.uid()
  )
);

CREATE POLICY "System can create logs" 
ON public.system_logs 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for business_settings updated_at
CREATE TRIGGER update_business_settings_updated_at
BEFORE UPDATE ON public.business_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_business_settings_organization_id ON public.business_settings(organization_id);
CREATE INDEX idx_system_logs_organization_id ON public.system_logs(organization_id);
CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX idx_system_logs_level ON public.system_logs(level);
CREATE INDEX idx_system_logs_module ON public.system_logs(module);