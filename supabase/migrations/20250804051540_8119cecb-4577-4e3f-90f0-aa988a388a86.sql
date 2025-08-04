-- Fix infinite recursion in organization_memberships policies
-- First, create a security definer function to check ownership
CREATE OR REPLACE FUNCTION public.is_organization_owner(org_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_memberships 
    WHERE organization_id = org_id 
    AND user_id = user_id 
    AND is_owner = true
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Organization owners can manage memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Organization owners can view all memberships" ON public.organization_memberships;

-- Create new policies using the security definer function
CREATE POLICY "Organization owners can manage memberships" 
ON public.organization_memberships
FOR ALL
USING (public.is_organization_owner(organization_id, auth.uid()));

CREATE POLICY "Organization owners can view all memberships" 
ON public.organization_memberships
FOR SELECT
USING (public.is_organization_owner(organization_id, auth.uid()));

-- Add branches table for multi-branch support
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on branches
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Branches policies
CREATE POLICY "Users can view branches of their organizations" 
ON public.branches
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.organization_memberships 
  WHERE organization_id = branches.organization_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Organization owners can manage branches" 
ON public.branches
FOR ALL
USING (public.is_organization_owner(organization_id, auth.uid()));

-- Add role enum for better role management
CREATE TYPE public.user_role AS ENUM ('admin', 'business_owner', 'manager', 'cashier', 'staff');

-- Add new role column with proper type
ALTER TABLE public.organization_memberships 
ADD COLUMN new_role public.user_role;

-- Update the new column based on existing data
UPDATE public.organization_memberships 
SET new_role = CASE 
  WHEN is_owner = true THEN 'business_owner'::public.user_role
  ELSE 'staff'::public.user_role
END;

-- Make the new column NOT NULL
ALTER TABLE public.organization_memberships 
ALTER COLUMN new_role SET NOT NULL;

-- Drop the old role column and rename the new one
ALTER TABLE public.organization_memberships 
DROP COLUMN role;

ALTER TABLE public.organization_memberships 
RENAME COLUMN new_role TO role;

-- Add branch_id to organization_memberships for branch-specific access
ALTER TABLE public.organization_memberships 
ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Add trigger for branches updated_at
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check user role in organization
CREATE OR REPLACE FUNCTION public.get_user_role_in_organization(org_id UUID, user_id UUID)
RETURNS public.user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT role 
  FROM public.organization_memberships 
  WHERE organization_id = org_id 
  AND user_id = user_id 
  LIMIT 1;
$$;