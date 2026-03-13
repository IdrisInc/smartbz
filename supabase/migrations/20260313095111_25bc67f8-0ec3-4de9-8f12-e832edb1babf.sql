
-- Update the create_organization_with_membership function to set status as pending_activation
CREATE OR REPLACE FUNCTION public.create_organization_with_membership(org_name text, org_sector business_sector DEFAULT 'other'::business_sector, org_description text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $$
DECLARE
  new_org_id UUID;
  selected_plan text;
BEGIN
  -- Get the selected plan from user metadata
  SELECT COALESCE(
    (SELECT raw_user_meta_data->>'selected_plan' FROM auth.users WHERE id = auth.uid()),
    'free'
  ) INTO selected_plan;

  -- Insert organization with pending_activation status
  INSERT INTO public.organizations (name, business_sector, description, status, subscription_plan)
  VALUES (org_name, org_sector, org_description, 'pending_activation', selected_plan::public.subscription_plan)
  RETURNING id INTO new_org_id;
  
  -- Insert membership with business_owner role
  INSERT INTO public.organization_memberships (user_id, organization_id, role, is_owner)
  VALUES (auth.uid(), new_org_id, 'business_owner', true);
  
  -- Create notification for super admins
  INSERT INTO public.notifications (title, message, type, target_roles, action_url)
  VALUES (
    'New Business Registration',
    'A new business "' || org_name || '" has registered and requires activation.',
    'info',
    ARRAY['super_admin'],
    '/dashboard/super-admin/owners'
  );
  
  RETURN new_org_id;
END;
$$;
