-- Create contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  contact_type TEXT DEFAULT 'customer' CHECK (contact_type IN ('customer', 'supplier', 'lead')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  category TEXT,
  price DECIMAL(10,2),
  cost DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'piece',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  employee_id TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  department TEXT,
  hire_date DATE,
  salary DECIMAL(10,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  sale_number TEXT,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'cancelled')),
  payment_method TEXT,
  notes TEXT,
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sale_items table
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  receipt_url TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  po_number TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'received', 'cancelled')),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Enable RLS on all tables
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contacts
CREATE POLICY "Users can view contacts in their organizations" ON public.contacts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = contacts.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage contacts in their organizations" ON public.contacts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = contacts.organization_id 
    AND user_id = auth.uid()
    AND role IN ('business_owner', 'manager')
  )
);

-- Create RLS policies for products
CREATE POLICY "Users can view products in their organizations" ON public.products
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = products.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage products in their organizations" ON public.products
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = products.organization_id 
    AND user_id = auth.uid()
    AND role IN ('business_owner', 'manager')
  )
);

-- Create RLS policies for employees
CREATE POLICY "Users can view employees in their organizations" ON public.employees
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = employees.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Only business owners and managers can manage employees" ON public.employees
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = employees.organization_id 
    AND user_id = auth.uid()
    AND role IN ('business_owner', 'manager')
  )
);

-- Create RLS policies for sales
CREATE POLICY "Users can view sales in their organizations" ON public.sales
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = sales.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create and manage sales in their organizations" ON public.sales
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = sales.organization_id 
    AND user_id = auth.uid()
  )
);

-- Create RLS policies for sale_items
CREATE POLICY "Users can view sale items through sales" ON public.sale_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sales s
    JOIN public.organization_memberships om ON s.organization_id = om.organization_id
    WHERE s.id = sale_items.sale_id AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage sale items through sales" ON public.sale_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.sales s
    JOIN public.organization_memberships om ON s.organization_id = om.organization_id
    WHERE s.id = sale_items.sale_id AND om.user_id = auth.uid()
  )
);

-- Create RLS policies for expenses
CREATE POLICY "Users can view expenses in their organizations" ON public.expenses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = expenses.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage expenses in their organizations" ON public.expenses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = expenses.organization_id 
    AND user_id = auth.uid()
    AND role IN ('business_owner', 'manager')
  )
);

-- Create RLS policies for invoices
CREATE POLICY "Users can view invoices in their organizations" ON public.invoices
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = invoices.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage invoices in their organizations" ON public.invoices
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = invoices.organization_id 
    AND user_id = auth.uid()
    AND role IN ('business_owner', 'manager')
  )
);

-- Create RLS policies for purchase_orders
CREATE POLICY "Users can view purchase orders in their organizations" ON public.purchase_orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = purchase_orders.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage purchase orders in their organizations" ON public.purchase_orders
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = purchase_orders.organization_id 
    AND user_id = auth.uid()
    AND role IN ('business_owner', 'manager')
  )
);

-- Create RLS policies for attendance
CREATE POLICY "Users can view attendance in their organizations" ON public.attendance
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = attendance.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage attendance in their organizations" ON public.attendance
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = attendance.organization_id 
    AND user_id = auth.uid()
    AND role IN ('business_owner', 'manager', 'staff')
  )
);

-- Create triggers for updated_at columns
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_contacts_organization_id ON public.contacts(organization_id);
CREATE INDEX idx_products_organization_id ON public.products(organization_id);
CREATE INDEX idx_employees_organization_id ON public.employees(organization_id);
CREATE INDEX idx_sales_organization_id ON public.sales(organization_id);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX idx_expenses_organization_id ON public.expenses(organization_id);
CREATE INDEX idx_invoices_organization_id ON public.invoices(organization_id);
CREATE INDEX idx_purchase_orders_organization_id ON public.purchase_orders(organization_id);
CREATE INDEX idx_attendance_organization_id ON public.attendance(organization_id);
CREATE INDEX idx_attendance_employee_date ON public.attendance(employee_id, date);