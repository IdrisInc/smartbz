-- Create a security definer function to check if user is org owner/manager
CREATE OR REPLACE FUNCTION public.can_manage_user_profile(profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships om1
    JOIN public.organization_memberships om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
    AND om2.user_id = profile_user_id
    AND om1.role IN ('super_admin', 'business_owner', 'manager', 'admin_staff')
  )
$$;

-- Add policy for business owners/managers to update profiles in their org
CREATE POLICY "Managers can update profiles in their org"
ON public.profiles
FOR UPDATE
USING (public.can_manage_user_profile(user_id))
WITH CHECK (public.can_manage_user_profile(user_id));

-- Add policy for managers to view profiles in their org
CREATE POLICY "Managers can view profiles in their org"
ON public.profiles
FOR SELECT
USING (public.can_manage_user_profile(user_id));