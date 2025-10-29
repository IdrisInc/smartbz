-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Trash bin table for 90-day retention
CREATE TABLE IF NOT EXISTS public.trash_bin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  old_data jsonb NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  deleted_by uuid,
  purge_at timestamptz NOT NULL DEFAULT (now() + interval '90 days')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trash_bin_org ON public.trash_bin (organization_id);
CREATE INDEX IF NOT EXISTS idx_trash_bin_purge_at ON public.trash_bin (purge_at);
CREATE INDEX IF NOT EXISTS idx_trash_bin_table ON public.trash_bin (table_name);

-- Enable RLS
ALTER TABLE public.trash_bin ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow inserts from authenticated (via triggers)" ON public.trash_bin;
CREATE POLICY "Allow inserts from authenticated (via triggers)"
  ON public.trash_bin FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Members can view org trash" ON public.trash_bin;
CREATE POLICY "Members can view org trash"
  ON public.trash_bin FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = trash_bin.organization_id
        AND om.user_id = auth.uid()
    )
    OR is_super_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Owners can delete trash" ON public.trash_bin;
CREATE POLICY "Owners can delete trash"
  ON public.trash_bin FOR DELETE TO authenticated
  USING (
    is_organization_owner(organization_id, auth.uid())
    OR is_super_admin(auth.uid())
  );

-- Archive function
CREATE OR REPLACE FUNCTION public.archive_deleted_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.trash_bin (
    organization_id, table_name, record_id, old_data, deleted_by
  ) VALUES (
    OLD.organization_id, TG_TABLE_NAME, OLD.id, to_jsonb(OLD), auth.uid()
  );
  RETURN OLD;
END;
$$;

-- Triggers on tables
DROP TRIGGER IF EXISTS trg_contacts_archive_delete ON public.contacts;
CREATE TRIGGER trg_contacts_archive_delete
  BEFORE DELETE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS trg_products_archive_delete ON public.products;
CREATE TRIGGER trg_products_archive_delete
  BEFORE DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS trg_invoices_archive_delete ON public.invoices;
CREATE TRIGGER trg_invoices_archive_delete
  BEFORE DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS trg_purchase_orders_archive_delete ON public.purchase_orders;
CREATE TRIGGER trg_purchase_orders_archive_delete
  BEFORE DELETE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS trg_expenses_archive_delete ON public.expenses;
CREATE TRIGGER trg_expenses_archive_delete
  BEFORE DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS trg_employees_archive_delete ON public.employees;
CREATE TRIGGER trg_employees_archive_delete
  BEFORE DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS trg_sales_archive_delete ON public.sales;
CREATE TRIGGER trg_sales_archive_delete
  BEFORE DELETE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS trg_branches_archive_delete ON public.branches;
CREATE TRIGGER trg_branches_archive_delete
  BEFORE DELETE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

-- Purge function
CREATE OR REPLACE FUNCTION public.purge_expired_trash()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.trash_bin WHERE purge_at <= now();
END;
$$;

-- Schedule daily purge (unschedule first if exists)
SELECT cron.unschedule('purge_trash_daily') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'purge_trash_daily'
);

SELECT cron.schedule(
  'purge_trash_daily',
  '0 3 * * *',
  'SELECT public.purge_expired_trash();'
);