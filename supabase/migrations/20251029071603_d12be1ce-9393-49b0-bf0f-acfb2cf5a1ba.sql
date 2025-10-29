-- Purchase Order Items (line items for purchase orders)
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_po_items_po ON public.purchase_order_items(purchase_order_id);

-- Purchase Returns
CREATE TABLE IF NOT EXISTS public.purchase_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid,
  purchase_order_id uuid REFERENCES public.purchase_orders(id),
  supplier_id uuid,
  return_number text NOT NULL,
  return_date date NOT NULL DEFAULT CURRENT_DATE,
  total_amount numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'pending',
  reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_returns_org ON public.purchase_returns(organization_id);

-- Purchase Return Items
CREATE TABLE IF NOT EXISTS public.purchase_return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_return_id uuid NOT NULL REFERENCES public.purchase_returns(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Quotations
CREATE TABLE IF NOT EXISTS public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid,
  supplier_id uuid,
  quotation_number text NOT NULL,
  quotation_date date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  total_amount numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotations_org ON public.quotations(organization_id);

-- Quotation Items
CREATE TABLE IF NOT EXISTS public.quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Sale Returns
CREATE TABLE IF NOT EXISTS public.sale_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid,
  sale_id uuid REFERENCES public.sales(id),
  contact_id uuid,
  return_number text NOT NULL,
  return_date date NOT NULL DEFAULT CURRENT_DATE,
  total_amount numeric NOT NULL DEFAULT 0,
  refund_amount numeric DEFAULT 0,
  status text DEFAULT 'pending',
  reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sale_returns_org ON public.sale_returns(organization_id);

-- Sale Return Items
CREATE TABLE IF NOT EXISTS public.sale_return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_return_id uuid NOT NULL REFERENCES public.sale_returns(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Product Categories
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES public.product_categories(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_org ON public.product_categories(organization_id);

-- Product Brands
CREATE TABLE IF NOT EXISTS public.product_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brands_org ON public.product_brands(organization_id);

-- Product Units
CREATE TABLE IF NOT EXISTS public.product_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  short_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_units_org ON public.product_units(organization_id);

-- Product Taxes
CREATE TABLE IF NOT EXISTS public.product_taxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  rate numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_taxes_org ON public.product_taxes(organization_id);

-- Cash Registers
CREATE TABLE IF NOT EXISTS public.cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid,
  name text NOT NULL,
  opening_balance numeric NOT NULL DEFAULT 0,
  current_balance numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'closed',
  opened_by uuid,
  opened_at timestamptz,
  closed_by uuid,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registers_org ON public.cash_registers(organization_id);
CREATE INDEX IF NOT EXISTS idx_registers_branch ON public.cash_registers(branch_id);

-- Expense Categories
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_org ON public.expense_categories(organization_id);

-- Enable RLS on all new tables
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Purchase Order Items
DROP POLICY IF EXISTS "Users can manage PO items" ON public.purchase_order_items;
CREATE POLICY "Users can manage PO items"
  ON public.purchase_order_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      JOIN public.organization_memberships om ON po.organization_id = om.organization_id
      WHERE po.id = purchase_order_items.purchase_order_id
        AND om.user_id = auth.uid()
    )
  );

-- RLS Policies for Purchase Returns
DROP POLICY IF EXISTS "Users can manage purchase returns" ON public.purchase_returns;
CREATE POLICY "Users can manage purchase returns"
  ON public.purchase_returns FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = purchase_returns.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('business_owner', 'manager', 'admin_staff', 'inventory_staff')
    )
  );

-- RLS for Purchase Return Items
DROP POLICY IF EXISTS "Users can manage purchase return items" ON public.purchase_return_items;
CREATE POLICY "Users can manage purchase return items"
  ON public.purchase_return_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_returns pr
      JOIN public.organization_memberships om ON pr.organization_id = om.organization_id
      WHERE pr.id = purchase_return_items.purchase_return_id
        AND om.user_id = auth.uid()
    )
  );

-- RLS for Quotations
DROP POLICY IF EXISTS "Users can manage quotations" ON public.quotations;
CREATE POLICY "Users can manage quotations"
  ON public.quotations FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = quotations.organization_id
        AND om.user_id = auth.uid()
    )
  );

-- RLS for Quotation Items
DROP POLICY IF EXISTS "Users can manage quotation items" ON public.quotation_items;
CREATE POLICY "Users can manage quotation items"
  ON public.quotation_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations q
      JOIN public.organization_memberships om ON q.organization_id = om.organization_id
      WHERE q.id = quotation_items.quotation_id
        AND om.user_id = auth.uid()
    )
  );

-- RLS for Sale Returns
DROP POLICY IF EXISTS "Users can manage sale returns" ON public.sale_returns;
CREATE POLICY "Users can manage sale returns"
  ON public.sale_returns FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = sale_returns.organization_id
        AND om.user_id = auth.uid()
    )
  );

-- RLS for Sale Return Items
DROP POLICY IF EXISTS "Users can manage sale return items" ON public.sale_return_items;
CREATE POLICY "Users can manage sale return items"
  ON public.sale_return_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sale_returns sr
      JOIN public.organization_memberships om ON sr.organization_id = om.organization_id
      WHERE sr.id = sale_return_items.sale_return_id
        AND om.user_id = auth.uid()
    )
  );

-- RLS for Product Management tables
DROP POLICY IF EXISTS "Users can manage categories" ON public.product_categories;
CREATE POLICY "Users can manage categories"
  ON public.product_categories FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = product_categories.organization_id
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage brands" ON public.product_brands;
CREATE POLICY "Users can manage brands"
  ON public.product_brands FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = product_brands.organization_id
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage units" ON public.product_units;
CREATE POLICY "Users can manage units"
  ON public.product_units FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = product_units.organization_id
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage taxes" ON public.product_taxes;
CREATE POLICY "Users can manage taxes"
  ON public.product_taxes FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = product_taxes.organization_id
        AND om.user_id = auth.uid()
    )
  );

-- RLS for Cash Registers
DROP POLICY IF EXISTS "Users can manage cash registers" ON public.cash_registers;
CREATE POLICY "Users can manage cash registers"
  ON public.cash_registers FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = cash_registers.organization_id
        AND om.user_id = auth.uid()
    )
  );

-- RLS for Expense Categories
DROP POLICY IF EXISTS "Users can manage expense categories" ON public.expense_categories;
CREATE POLICY "Users can manage expense categories"
  ON public.expense_categories FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = expense_categories.organization_id
        AND om.user_id = auth.uid()
    )
  );

-- Add triggers for archive on delete
DROP TRIGGER IF EXISTS trg_purchase_returns_archive_delete ON public.purchase_returns;
CREATE TRIGGER trg_purchase_returns_archive_delete
  BEFORE DELETE ON public.purchase_returns
  FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS trg_quotations_archive_delete ON public.quotations;
CREATE TRIGGER trg_quotations_archive_delete
  BEFORE DELETE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS trg_sale_returns_archive_delete ON public.sale_returns;
CREATE TRIGGER trg_sale_returns_archive_delete
  BEFORE DELETE ON public.sale_returns
  FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS trg_product_categories_archive_delete ON public.product_categories;
CREATE TRIGGER trg_product_categories_archive_delete
  BEFORE DELETE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS trg_product_brands_archive_delete ON public.product_brands;
CREATE TRIGGER trg_product_brands_archive_delete
  BEFORE DELETE ON public.product_brands
  FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS trg_cash_registers_archive_delete ON public.cash_registers;
CREATE TRIGGER trg_cash_registers_archive_delete
  BEFORE DELETE ON public.cash_registers
  FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS trg_expense_categories_archive_delete ON public.expense_categories;
CREATE TRIGGER trg_expense_categories_archive_delete
  BEFORE DELETE ON public.expense_categories
  FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_purchase_returns_updated_at ON public.purchase_returns;
CREATE TRIGGER update_purchase_returns_updated_at
  BEFORE UPDATE ON public.purchase_returns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_quotations_updated_at ON public.quotations;
CREATE TRIGGER update_quotations_updated_at
  BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sale_returns_updated_at ON public.sale_returns;
CREATE TRIGGER update_sale_returns_updated_at
  BEFORE UPDATE ON public.sale_returns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_categories_updated_at ON public.product_categories;
CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_brands_updated_at ON public.product_brands;
CREATE TRIGGER update_product_brands_updated_at
  BEFORE UPDATE ON public.product_brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_taxes_updated_at ON public.product_taxes;
CREATE TRIGGER update_product_taxes_updated_at
  BEFORE UPDATE ON public.product_taxes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cash_registers_updated_at ON public.cash_registers;
CREATE TRIGGER update_cash_registers_updated_at
  BEFORE UPDATE ON public.cash_registers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_expense_categories_updated_at ON public.expense_categories;
CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();