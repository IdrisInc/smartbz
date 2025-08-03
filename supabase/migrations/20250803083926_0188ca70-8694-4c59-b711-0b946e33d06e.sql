-- Fix security warnings by adding proper search paths to functions

-- Fix the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix the create_organization_with_membership function
CREATE OR REPLACE FUNCTION public.create_organization_with_membership(
  org_name TEXT,
  org_sector public.business_sector DEFAULT 'other',
  org_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Insert organization
  INSERT INTO public.organizations (name, business_sector, description)
  VALUES (org_name, org_sector, org_description)
  RETURNING id INTO new_org_id;
  
  -- Insert membership with owner role
  INSERT INTO public.organization_memberships (user_id, organization_id, role, is_owner)
  VALUES (auth.uid(), new_org_id, 'owner', true);
  
  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';