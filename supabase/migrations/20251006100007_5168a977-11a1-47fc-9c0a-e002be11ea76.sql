-- Add RLS policies for super admins to view all data across organizations

-- Super admins can view all organizations
CREATE POLICY "Super admins can view all organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- Super admins can view all organization memberships
CREATE POLICY "Super admins can view all memberships"
ON public.organization_memberships
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid()
    AND om.role = 'super_admin'
  )
);

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- Super admins can view all branches
CREATE POLICY "Super admins can view all branches"
ON public.branches
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- Super admins can view all employees
CREATE POLICY "Super admins can view all employees"
ON public.employees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);