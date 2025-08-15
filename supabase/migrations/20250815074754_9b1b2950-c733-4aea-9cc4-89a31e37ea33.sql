-- Update user roles to support the new hierarchy
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM (
  'super_admin',      -- Platform owner - manages all business owners
  'business_owner',   -- Owns one or more businesses
  'manager',          -- Branch manager
  'admin_staff',      -- Full access to branch features
  'sales_staff',      -- Sales & Contacts only
  'inventory_staff',  -- Products & Inventory
  'finance_staff',    -- Finance & Reports
  'cashier'          -- Basic sales operations
);

-- Update organization_memberships to use new roles
ALTER TABLE organization_memberships ALTER COLUMN role TYPE user_role USING role::text::user_role;

-- Add super admin management table
CREATE TABLE public.super_admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id UUID NOT NULL,
  target_user_id UUID,
  target_organization_id UUID,
  action_type TEXT NOT NULL, -- 'approve', 'suspend', 'activate', 'monitor'
  action_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on super admin actions
ALTER TABLE public.super_admin_actions ENABLE ROW LEVEL SECURITY;

-- Create policy for super admins to manage their actions
CREATE POLICY "Super admins can manage their actions" ON public.super_admin_actions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Add branch-specific permissions
ALTER TABLE organization_memberships ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Update the existing function to handle new roles
CREATE OR REPLACE FUNCTION public.get_user_role_in_organization(org_id uuid, user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT role 
  FROM public.organization_memberships 
  WHERE organization_id = org_id 
  AND user_id = user_id 
  LIMIT 1;
$function$;