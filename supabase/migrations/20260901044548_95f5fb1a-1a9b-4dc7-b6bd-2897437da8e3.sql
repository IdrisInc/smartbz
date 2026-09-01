CREATE TABLE public.restaurant_floor_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  branch_id UUID,
  name TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_by_name TEXT,
  updated_by UUID,
  updated_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_floor_plans TO authenticated;
GRANT ALL ON public.restaurant_floor_plans TO service_role;

ALTER TABLE public.restaurant_floor_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view floor plans"
ON public.restaurant_floor_plans FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.organization_memberships om
  WHERE om.organization_id = restaurant_floor_plans.organization_id
  AND om.user_id = auth.uid()
));

CREATE POLICY "Managers can manage floor plans"
ON public.restaurant_floor_plans FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.organization_memberships om
  WHERE om.organization_id = restaurant_floor_plans.organization_id
  AND om.user_id = auth.uid()
  AND om.role IN ('super_admin','business_owner','manager','admin_staff')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.organization_memberships om
  WHERE om.organization_id = restaurant_floor_plans.organization_id
  AND om.user_id = auth.uid()
  AND om.role IN ('super_admin','business_owner','manager','admin_staff')
));

CREATE TRIGGER update_restaurant_floor_plans_updated_at
BEFORE UPDATE ON public.restaurant_floor_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.restaurant_tables
  ADD COLUMN IF NOT EXISTS floor_plan_id UUID REFERENCES public.restaurant_floor_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pos_x NUMERIC,
  ADD COLUMN IF NOT EXISTS pos_y NUMERIC;

ALTER TABLE public.product_serial_units
  ADD COLUMN IF NOT EXISTS sale_return_id UUID,
  ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;