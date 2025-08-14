-- Fix the create_organization_with_membership function to use correct enum value
CREATE OR REPLACE FUNCTION public.create_organization_with_membership(org_name text, org_sector business_sector DEFAULT 'other'::business_sector, org_description text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  new_org_id UUID;
BEGIN
  -- Insert organization
  INSERT INTO public.organizations (name, business_sector, description)
  VALUES (org_name, org_sector, org_description)
  RETURNING id INTO new_org_id;
  
  -- Insert membership with business_owner role (not owner)
  INSERT INTO public.organization_memberships (user_id, organization_id, role, is_owner)
  VALUES (auth.uid(), new_org_id, 'business_owner', true);
  
  RETURN new_org_id;
END;
$function$