-- First, let's check what user_role enum values currently exist
-- and create the new enum with updated values
DO $$ 
BEGIN
  -- Drop existing constraints and recreate the enum
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    -- Create new enum type with updated values
    CREATE TYPE user_role_new AS ENUM (
      'super_admin',      -- Platform owner - manages all business owners
      'business_owner',   -- Owns one or more businesses
      'manager',          -- Branch manager
      'admin_staff',      -- Full access to branch features
      'sales_staff',      -- Sales & Contacts only
      'inventory_staff',  -- Products & Inventory
      'finance_staff',    -- Finance & Reports
      'cashier'          -- Basic sales operations
    );
    
    -- Update the column to use new enum, with mapping for existing values
    ALTER TABLE organization_memberships 
    ALTER COLUMN role TYPE user_role_new 
    USING CASE 
      WHEN role::text = 'admin' THEN 'super_admin'::user_role_new
      WHEN role::text = 'business_owner' THEN 'business_owner'::user_role_new
      WHEN role::text = 'manager' THEN 'manager'::user_role_new
      WHEN role::text = 'staff' THEN 'admin_staff'::user_role_new
      WHEN role::text = 'cashier' THEN 'cashier'::user_role_new
      ELSE 'admin_staff'::user_role_new
    END;
    
    -- Drop old enum and rename new one
    DROP TYPE user_role CASCADE;
    ALTER TYPE user_role_new RENAME TO user_role;
  END IF;
END $$;

-- Add super admin management table
CREATE TABLE IF NOT EXISTS public.super_admin_actions (
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
DROP POLICY IF EXISTS "Super admins can manage their actions" ON public.super_admin_actions;
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

-- Add organization status for super admin management
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;