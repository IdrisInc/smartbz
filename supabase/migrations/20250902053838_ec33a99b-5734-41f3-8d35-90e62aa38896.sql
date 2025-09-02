-- Add missing foreign key relationships to support Supabase relational selects
-- 1) payment_proofs.organization_id -> organizations.id
ALTER TABLE public.payment_proofs
ADD CONSTRAINT payment_proofs_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES public.organizations(id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

-- 2) payment_proofs.user_id -> profiles.id (profiles.id mirrors auth.uid())
ALTER TABLE public.payment_proofs
ADD CONSTRAINT payment_proofs_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

-- Optional but recommended: add indexes for better performance on join columns
CREATE INDEX IF NOT EXISTS idx_payment_proofs_organization_id ON public.payment_proofs(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_user_id ON public.payment_proofs(user_id);
