ALTER TYPE public.business_sector ADD VALUE IF NOT EXISTS 'restaurant';

ALTER TABLE public.organization_memberships
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by_name text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id),
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 2,
  area text,
  status text NOT NULL DEFAULT 'free',
  current_sale_id uuid REFERENCES public.sales(id),
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_by_name text,
  updated_by uuid,
  updated_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_tables TO authenticated;
GRANT ALL ON public.restaurant_tables TO service_role;

ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their org tables"
ON public.restaurant_tables FOR SELECT TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Members can manage their org tables"
ON public.restaurant_tables FOR ALL TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
))
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
));

CREATE TRIGGER update_restaurant_tables_updated_at
BEFORE UPDATE ON public.restaurant_tables
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();