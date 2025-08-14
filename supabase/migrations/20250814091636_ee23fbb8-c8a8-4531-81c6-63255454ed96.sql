-- Create a function to make a user admin across all organizations
CREATE OR REPLACE FUNCTION public.make_user_admin(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert admin role for the user if not exists
  INSERT INTO public.organization_memberships (user_id, organization_id, role, is_owner)
  SELECT target_user_id, NULL, 'admin', true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE user_id = target_user_id AND role = 'admin'
  );
  
  -- Update existing memberships to admin if user is not already admin somewhere
  UPDATE public.organization_memberships 
  SET role = 'admin', is_owner = true
  WHERE user_id = target_user_id 
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE user_id = target_user_id AND role = 'admin'
  );
END;
$$;

-- Make the current user admin if they're not already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE user_id = '2477cc84-669e-4df7-8644-1eb9da32607d' AND role = 'admin'
  ) THEN
    -- Insert admin membership without organization (system-wide admin)
    INSERT INTO public.organization_memberships (user_id, organization_id, role, is_owner)
    VALUES ('2477cc84-669e-4df7-8644-1eb9da32607d', NULL, 'admin', true);
  END IF;
END;
$$;