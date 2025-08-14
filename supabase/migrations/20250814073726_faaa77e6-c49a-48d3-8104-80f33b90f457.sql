-- Clean up orphaned organization memberships and fix the foreign key constraint
-- Step 1: Remove organization memberships that reference non-existent profiles
DELETE FROM public.organization_memberships 
WHERE user_id NOT IN (SELECT user_id FROM public.profiles);

-- Step 2: Add unique constraint to profiles.user_id if it doesn't exist
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Step 3: Drop the existing foreign key constraint on organization_memberships
ALTER TABLE public.organization_memberships 
DROP CONSTRAINT IF EXISTS organization_memberships_user_id_fkey;

-- Step 4: Add a new foreign key constraint that references profiles table
ALTER TABLE public.organization_memberships 
ADD CONSTRAINT organization_memberships_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;