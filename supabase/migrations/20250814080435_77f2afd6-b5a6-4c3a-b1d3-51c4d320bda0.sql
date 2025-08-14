-- Fix RLS policy for organization_memberships to allow admins to create memberships for other users
DROP POLICY IF EXISTS "Users can insert their own memberships" ON public.organization_memberships;

-- Create new policy that allows both users to insert their own memberships 
-- AND organization owners/managers to insert memberships for other users
CREATE POLICY "Users can insert memberships" 
ON public.organization_memberships 
FOR INSERT 
WITH CHECK (
  -- Users can insert their own memberships
  user_id = auth.uid() 
  OR 
  -- Organization owners can insert memberships for others in their organization
  is_organization_owner(organization_id, auth.uid())
  OR
  -- Managers can also insert memberships for others in their organization
  EXISTS (
    SELECT 1 
    FROM public.organization_memberships om 
    WHERE om.organization_id = organization_memberships.organization_id 
    AND om.user_id = auth.uid() 
    AND om.role IN ('business_owner', 'manager')
  )
);