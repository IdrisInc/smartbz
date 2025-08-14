-- Create missing profile for the current user
INSERT INTO public.profiles (id, user_id, display_name)
SELECT 
    auth.uid(),
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid())
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid());

-- Also ensure the handle_new_user trigger is working correctly
-- Check if trigger exists and recreate if needed
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update the organization_memberships foreign key to reference auth.users directly instead of profiles
-- This will prevent the foreign key constraint error
ALTER TABLE public.organization_memberships 
DROP CONSTRAINT IF EXISTS organization_memberships_user_id_fkey;

-- Add the correct foreign key constraint to auth.users
ALTER TABLE public.organization_memberships 
ADD CONSTRAINT organization_memberships_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;