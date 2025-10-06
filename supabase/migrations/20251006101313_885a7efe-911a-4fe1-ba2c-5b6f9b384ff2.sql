-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Super admins can view all memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Super admins can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all branches" ON public.branches;
DROP POLICY IF EXISTS "Super admins can view all employees" ON public.employees;

-- Create security definer function to check super admin status
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships
    WHERE user_id = check_user_id
    AND role = 'super_admin'
  )
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Super admins can view all organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view all memberships"
ON public.organization_memberships
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view all branches"
ON public.branches
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view all employees"
ON public.employees
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));