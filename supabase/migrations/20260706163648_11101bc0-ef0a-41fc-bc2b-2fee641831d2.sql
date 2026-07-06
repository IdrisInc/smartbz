
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_serialized boolean NOT NULL DEFAULT false;

DO $$ BEGIN
  CREATE TYPE public.product_unit_status AS ENUM ('in_stock','sold','returned','damaged','lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.product_serial_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  imei text,
  serial_number text,
  barcode text,
  status public.product_unit_status NOT NULL DEFAULT 'in_stock',
  purchase_order_id uuid REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  sold_at timestamptz,
  notes text,
  created_by_name text,
  updated_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT psu_has_identifier CHECK (
    imei IS NOT NULL OR serial_number IS NOT NULL OR barcode IS NOT NULL
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_serial_units TO authenticated;
GRANT ALL ON public.product_serial_units TO service_role;

ALTER TABLE public.product_serial_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "psu org read" ON public.product_serial_units
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.organization_id = product_serial_units.organization_id
      AND om.user_id = auth.uid()
  ));

CREATE POLICY "psu org insert" ON public.product_serial_units
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.organization_id = product_serial_units.organization_id
      AND om.user_id = auth.uid()
  ));

CREATE POLICY "psu org update" ON public.product_serial_units
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.organization_id = product_serial_units.organization_id
      AND om.user_id = auth.uid()
  ));

CREATE POLICY "psu org delete" ON public.product_serial_units
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.organization_id = product_serial_units.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('business_owner','manager','admin_staff','super_admin')
  ));

CREATE UNIQUE INDEX IF NOT EXISTS psu_org_imei_uidx
  ON public.product_serial_units (organization_id, imei) WHERE imei IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS psu_org_serial_uidx
  ON public.product_serial_units (organization_id, serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS psu_product_idx ON public.product_serial_units (product_id);
CREATE INDEX IF NOT EXISTS psu_status_idx ON public.product_serial_units (organization_id, status);

CREATE TRIGGER trg_psu_updated_at
  BEFORE UPDATE ON public.product_serial_units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
