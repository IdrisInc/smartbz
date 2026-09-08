
CREATE TABLE public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by_name text,
  updated_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_categories TO authenticated;
GRANT ALL ON public.menu_categories TO service_role;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage their menu categories" ON public.menu_categories FOR ALL TO authenticated
USING (organization_id IN (SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()))
WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()));

CREATE TABLE public.menu_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric not null default 0,
  cost_price numeric,
  prep_time_minutes integer,
  image_url text,
  is_available boolean not null default true,
  is_active boolean not null default true,
  created_by_name text,
  updated_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage their menu items" ON public.menu_items FOR ALL TO authenticated
USING (organization_id IN (SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()))
WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()));

CREATE TABLE public.restaurant_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid,
  table_id uuid references public.restaurant_tables(id) on delete set null,
  order_number text not null,
  order_type text not null default 'dine_in',
  customer_name text,
  status text not null default 'open',
  subtotal numeric not null default 0,
  tax_amount numeric not null default 0,
  discount_amount numeric not null default 0,
  total_amount numeric not null default 0,
  notes text,
  sale_id uuid,
  created_by uuid,
  created_by_name text,
  updated_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_orders TO authenticated;
GRANT ALL ON public.restaurant_orders TO service_role;
ALTER TABLE public.restaurant_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage their restaurant orders" ON public.restaurant_orders FOR ALL TO authenticated
USING (organization_id IN (SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()))
WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()));

CREATE TABLE public.restaurant_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.restaurant_orders(id) on delete cascade,
  organization_id uuid not null,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  total_price numeric not null default 0,
  notes text,
  status text not null default 'pending',
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_order_items TO authenticated;
GRANT ALL ON public.restaurant_order_items TO service_role;
ALTER TABLE public.restaurant_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage their restaurant order items" ON public.restaurant_order_items FOR ALL TO authenticated
USING (organization_id IN (SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()))
WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()));

CREATE INDEX idx_menu_items_org ON public.menu_items(organization_id, is_active);
CREATE INDEX idx_restaurant_orders_org_status ON public.restaurant_orders(organization_id, status);
CREATE INDEX idx_restaurant_order_items_order ON public.restaurant_order_items(order_id);

CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON public.menu_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restaurant_orders_updated_at BEFORE UPDATE ON public.restaurant_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restaurant_order_items_updated_at BEFORE UPDATE ON public.restaurant_order_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
