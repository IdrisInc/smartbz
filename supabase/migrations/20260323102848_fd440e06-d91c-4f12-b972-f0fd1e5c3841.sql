
-- =============================================
-- PHASE 1: DATABASE INDEXES & AUDIT FIELDS
-- =============================================

-- Performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_sales_org_date ON public.sales(organization_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_confirmation_status ON public.sales(organization_id, confirmation_status);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_org_date ON public.expenses(organization_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON public.inventory_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_org ON public.inventory_movements(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_org_date ON public.invoices(organization_id, invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_org_type ON public.contacts(organization_id, contact_type);
CREATE INDEX IF NOT EXISTS idx_products_org_active ON public.products(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_org_status ON public.purchase_orders(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_sale_returns_org ON public.sale_returns(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_returns_org ON public.purchase_returns(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON public.organization_memberships(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance(employee_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_credit_notes_org ON public.credit_notes(organization_id, created_at DESC);

-- Add updated_by audit field to core tables
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS updated_by_name text;

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS updated_by_name text;

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS updated_by_name text;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_by_name text;

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS updated_by_name text;

-- =============================================
-- AUDIT LOG TABLE - for tracking all critical actions
-- =============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  action text NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject', 'price_change', 'stock_adjust'
  entity_type text NOT NULL, -- 'sale', 'expense', 'product', 'invoice', 'purchase_order', etc
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_org ON public.audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(organization_id, action);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE organization_memberships.organization_id = audit_logs.organization_id
    AND organization_memberships.user_id = auth.uid()
    AND organization_memberships.role IN ('business_owner', 'super_admin', 'manager')
  ));

CREATE POLICY "Org members can create audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE organization_memberships.organization_id = audit_logs.organization_id
    AND organization_memberships.user_id = auth.uid()
  ));

-- =============================================
-- SERVER-SIDE STOCK VALIDATION FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.validate_stock_for_sale(
  p_items jsonb -- array of {product_id, quantity}
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  item jsonb;
  product_record RECORD;
  errors jsonb := '[]'::jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, stock_quantity, is_active
    INTO product_record
    FROM public.products
    WHERE id = (item->>'product_id')::uuid;
    
    IF NOT FOUND THEN
      errors := errors || jsonb_build_object(
        'product_id', item->>'product_id',
        'error', 'Product not found'
      );
    ELSIF NOT product_record.is_active THEN
      errors := errors || jsonb_build_object(
        'product_id', item->>'product_id',
        'product_name', product_record.name,
        'error', 'Product is inactive'
      );
    ELSIF product_record.stock_quantity < (item->>'quantity')::int THEN
      errors := errors || jsonb_build_object(
        'product_id', item->>'product_id',
        'product_name', product_record.name,
        'requested', (item->>'quantity')::int,
        'available', product_record.stock_quantity,
        'error', 'Insufficient stock'
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'valid', jsonb_array_length(errors) = 0,
    'errors', errors
  );
END;
$$;

-- =============================================
-- DB-LEVEL AGGREGATION FUNCTION FOR DASHBOARD STATS
-- =============================================
CREATE OR REPLACE FUNCTION public.get_sales_stats(p_org_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    'todays_sales', COALESCE((
      SELECT SUM(total_amount) FROM sales
      WHERE organization_id = p_org_id
      AND sale_date >= CURRENT_DATE
    ), 0),
    'orders_today', (
      SELECT COUNT(*) FROM sales
      WHERE organization_id = p_org_id
      AND sale_date >= CURRENT_DATE
    ),
    'pending_confirmation', (
      SELECT COUNT(*) FROM sales
      WHERE organization_id = p_org_id
      AND confirmation_status = 'pending'
    ),
    'total_sales_month', COALESCE((
      SELECT SUM(total_amount) FROM sales
      WHERE organization_id = p_org_id
      AND sale_date >= date_trunc('month', CURRENT_DATE)
    ), 0)
  );
$$;
