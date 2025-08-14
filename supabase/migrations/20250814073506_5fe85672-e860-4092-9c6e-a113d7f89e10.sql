-- Fix the foreign key constraint issue by updating organization_memberships table
-- Remove the foreign key constraint to auth.users and reference profiles instead

-- Drop the existing foreign key constraint
ALTER TABLE public.organization_memberships 
DROP CONSTRAINT IF EXISTS organization_memberships_user_id_fkey;

-- Add a new foreign key constraint that references profiles table
ALTER TABLE public.organization_memberships 
ADD CONSTRAINT organization_memberships_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;