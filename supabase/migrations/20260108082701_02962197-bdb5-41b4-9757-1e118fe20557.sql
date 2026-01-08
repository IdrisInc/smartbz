-- Create module_configs table for managing modules and subsystems
CREATE TABLE public.module_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_key TEXT NOT NULL UNIQUE,
  module_name TEXT NOT NULL,
  description TEXT,
  parent_module_id UUID REFERENCES public.module_configs(id),
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  free_enabled BOOLEAN DEFAULT false,
  basic_enabled BOOLEAN DEFAULT false,
  premium_enabled BOOLEAN DEFAULT true,
  enterprise_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create onboarding_content table for managing onboarding page content
CREATE TABLE public.onboarding_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_key TEXT NOT NULL UNIQUE,
  title TEXT,
  subtitle TEXT,
  content TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.module_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_content ENABLE ROW LEVEL SECURITY;

-- Policies for module_configs (read for all authenticated, write for super_admin)
CREATE POLICY "Anyone can view module configs" 
  ON public.module_configs FOR SELECT 
  USING (true);

CREATE POLICY "Super admin can manage module configs" 
  ON public.module_configs FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.user_id = auth.uid() AND om.role = 'super_admin'
    )
  );

-- Policies for onboarding_content (read for all, write for super_admin)
CREATE POLICY "Anyone can view onboarding content" 
  ON public.onboarding_content FOR SELECT 
  USING (true);

CREATE POLICY "Super admin can manage onboarding content" 
  ON public.onboarding_content FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.user_id = auth.uid() AND om.role = 'super_admin'
    )
  );

-- Insert default modules with subsystems
INSERT INTO public.module_configs (module_key, module_name, description, icon, display_order, free_enabled, basic_enabled, premium_enabled, enterprise_enabled) VALUES
-- Core Modules
('dashboard', 'Dashboard', 'Main dashboard and analytics overview', 'LayoutDashboard', 1, true, true, true, true),
('sales', 'Sales Management', 'Complete sales and POS functionality', 'ShoppingCart', 2, true, true, true, true),
('inventory', 'Inventory Management', 'Stock control and warehouse management', 'Package', 3, true, true, true, true),
('finance', 'Finance & Accounting', 'Financial management and reporting', 'DollarSign', 4, false, true, true, true),
('hr', 'Human Resources', 'Employee and payroll management', 'Users', 5, false, false, true, true),
('crm', 'Customer Relations', 'Customer and contact management', 'UserCircle', 6, false, true, true, true),
('reports', 'Reports & Analytics', 'Business intelligence and reporting', 'BarChart3', 7, false, true, true, true),
('settings', 'System Settings', 'Configuration and administration', 'Settings', 8, true, true, true, true);

-- Get parent IDs and insert subsystems
DO $$
DECLARE
  sales_id UUID;
  inventory_id UUID;
  finance_id UUID;
  hr_id UUID;
  crm_id UUID;
  reports_id UUID;
  settings_id UUID;
BEGIN
  SELECT id INTO sales_id FROM public.module_configs WHERE module_key = 'sales';
  SELECT id INTO inventory_id FROM public.module_configs WHERE module_key = 'inventory';
  SELECT id INTO finance_id FROM public.module_configs WHERE module_key = 'finance';
  SELECT id INTO hr_id FROM public.module_configs WHERE module_key = 'hr';
  SELECT id INTO crm_id FROM public.module_configs WHERE module_key = 'crm';
  SELECT id INTO reports_id FROM public.module_configs WHERE module_key = 'reports';
  SELECT id INTO settings_id FROM public.module_configs WHERE module_key = 'settings';

  -- Sales subsystems
  INSERT INTO public.module_configs (module_key, module_name, description, parent_module_id, display_order, free_enabled, basic_enabled, premium_enabled, enterprise_enabled) VALUES
  ('sales_pos', 'Point of Sale', 'POS interface for quick sales', sales_id, 1, true, true, true, true),
  ('sales_invoicing', 'Invoicing', 'Create and manage invoices', sales_id, 2, true, true, true, true),
  ('sales_quotations', 'Quotations', 'Generate sales quotations', sales_id, 3, false, true, true, true),
  ('sales_returns', 'Sales Returns', 'Process sales returns', sales_id, 4, false, true, true, true),
  ('sales_discounts', 'Discount Management', 'Manage discounts and promotions', sales_id, 5, false, false, true, true);

  -- Inventory subsystems
  INSERT INTO public.module_configs (module_key, module_name, description, parent_module_id, display_order, free_enabled, basic_enabled, premium_enabled, enterprise_enabled) VALUES
  ('inventory_products', 'Product Management', 'Manage products and services', inventory_id, 1, true, true, true, true),
  ('inventory_stock', 'Stock Control', 'Track stock levels and movements', inventory_id, 2, true, true, true, true),
  ('inventory_purchase', 'Purchase Orders', 'Create and manage purchase orders', inventory_id, 3, false, true, true, true),
  ('inventory_warehouse', 'Warehouse Management', 'Multi-location stock tracking', inventory_id, 4, false, false, true, true),
  ('inventory_alerts', 'Low Stock Alerts', 'Automated stock level notifications', inventory_id, 5, false, true, true, true);

  -- Finance subsystems
  INSERT INTO public.module_configs (module_key, module_name, description, parent_module_id, display_order, free_enabled, basic_enabled, premium_enabled, enterprise_enabled) VALUES
  ('finance_expenses', 'Expense Tracking', 'Track and categorize expenses', finance_id, 1, false, true, true, true),
  ('finance_revenue', 'Revenue Management', 'Monitor revenue streams', finance_id, 2, false, true, true, true),
  ('finance_cashflow', 'Cash Flow', 'Cash flow analysis and projections', finance_id, 3, false, false, true, true),
  ('finance_budgeting', 'Budgeting', 'Budget planning and tracking', finance_id, 4, false, false, true, true),
  ('finance_tax', 'Tax Management', 'Tax calculations and reporting', finance_id, 5, false, false, true, true);

  -- HR subsystems
  INSERT INTO public.module_configs (module_key, module_name, description, parent_module_id, display_order, free_enabled, basic_enabled, premium_enabled, enterprise_enabled) VALUES
  ('hr_employees', 'Employee Records', 'Manage employee information', hr_id, 1, false, false, true, true),
  ('hr_payroll', 'Payroll Processing', 'Tanzania-compliant payroll', hr_id, 2, false, false, true, true),
  ('hr_attendance', 'Attendance Tracking', 'Track employee attendance', hr_id, 3, false, false, true, true),
  ('hr_leave', 'Leave Management', 'Manage employee leave requests', hr_id, 4, false, false, true, true),
  ('hr_performance', 'Performance Reviews', 'Employee performance management', hr_id, 5, false, false, false, true);

  -- CRM subsystems
  INSERT INTO public.module_configs (module_key, module_name, description, parent_module_id, display_order, free_enabled, basic_enabled, premium_enabled, enterprise_enabled) VALUES
  ('crm_contacts', 'Contact Management', 'Manage customers and suppliers', crm_id, 1, false, true, true, true),
  ('crm_leads', 'Lead Tracking', 'Track sales leads', crm_id, 2, false, false, true, true),
  ('crm_communication', 'Communication History', 'Track customer interactions', crm_id, 3, false, false, true, true);

  -- Reports subsystems
  INSERT INTO public.module_configs (module_key, module_name, description, parent_module_id, display_order, free_enabled, basic_enabled, premium_enabled, enterprise_enabled) VALUES
  ('reports_sales', 'Sales Reports', 'Sales analytics and trends', reports_id, 1, false, true, true, true),
  ('reports_inventory', 'Inventory Reports', 'Stock and movement reports', reports_id, 2, false, true, true, true),
  ('reports_finance', 'Financial Reports', 'P&L, balance sheets, etc.', reports_id, 3, false, false, true, true),
  ('reports_hr', 'HR Reports', 'Payroll and attendance reports', reports_id, 4, false, false, true, true),
  ('reports_custom', 'Custom Reports', 'Build custom reports', reports_id, 5, false, false, false, true);

  -- Settings subsystems
  INSERT INTO public.module_configs (module_key, module_name, description, parent_module_id, display_order, free_enabled, basic_enabled, premium_enabled, enterprise_enabled) VALUES
  ('settings_business', 'Business Settings', 'Configure business details', settings_id, 1, true, true, true, true),
  ('settings_users', 'User Management', 'Manage users and roles', settings_id, 2, false, true, true, true),
  ('settings_branches', 'Branch Management', 'Multi-branch configuration', settings_id, 3, false, false, true, true),
  ('settings_integrations', 'Integrations', 'Third-party integrations', settings_id, 4, false, false, false, true);
END $$;

-- Insert default onboarding content
INSERT INTO public.onboarding_content (content_key, title, subtitle, content, display_order, metadata) VALUES
('hero', 'Welcome to BizWiz', 'Transform Your Business Management', 'The complete business management solution designed for Tanzanian businesses. Streamline operations, boost productivity, and grow your business with our powerful yet easy-to-use platform.', 1, '{"show_animation": true}'),
('features_intro', 'Everything You Need', 'Powerful Features for Modern Business', 'From sales and inventory to payroll and analytics, BizWiz provides all the tools you need to run your business efficiently.', 2, '{}'),
('sectors_intro', 'Built for Your Industry', 'Industry-Specific Solutions', 'Whether you''re in retail, manufacturing, healthcare, or any other sector, BizWiz adapts to your unique business needs.', 3, '{}'),
('cta', 'Ready to Get Started?', 'Set Up Your Business in Minutes', 'Join thousands of Tanzanian businesses already using BizWiz to streamline their operations.', 4, '{}');

-- Update footer_links policy to allow anonymous read
DROP POLICY IF EXISTS "Anyone can view footer links" ON public.footer_links;
CREATE POLICY "Anyone can view footer links" 
  ON public.footer_links FOR SELECT 
  USING (true);