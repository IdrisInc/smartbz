-- Fix the foreign key constraint issue by updating organization_memberships table
-- First ensure profiles.user_id has a unique constraint, then update the foreign key

-- Add unique constraint to profiles.user_id
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Drop the existing foreign key constraint on organization_memberships
ALTER TABLE public.organization_memberships 
DROP CONSTRAINT IF EXISTS organization_memberships_user_id_fkey;

-- Add a new foreign key constraint that references profiles table
ALTER TABLE public.organization_memberships 
ADD CONSTRAINT organization_memberships_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;