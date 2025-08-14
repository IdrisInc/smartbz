-- Update the current user to admin role in their existing memberships
UPDATE organization_memberships 
SET role = 'admin', is_owner = true
WHERE user_id = '2477cc84-669e-4df7-8644-1eb9da32607d';

-- Create a function to easily promote users to admin
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update all existing memberships for this user to admin
  UPDATE public.organization_memberships 
  SET role = 'admin', is_owner = true
  WHERE user_id = target_user_id;
  
  -- If user has no memberships, we'll handle that when they join an organization
END;
$$;