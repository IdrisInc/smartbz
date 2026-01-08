-- Create payroll_config table for configurable tax rates and contributions
CREATE TABLE public.payroll_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    config_key TEXT NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(organization_id, config_key)
);

-- Create employee_payroll_details table for TIN, NSSF, bank details
CREATE TABLE public.employee_payroll_details (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    tin_number TEXT,
    nssf_number TEXT,
    bank_name TEXT,
    bank_account_number TEXT,
    bank_branch TEXT,
    employment_type TEXT DEFAULT 'permanent' CHECK (employment_type IN ('permanent', 'contract', 'temporary')),
    basic_salary DECIMAL(15,2) DEFAULT 0,
    housing_allowance DECIMAL(15,2) DEFAULT 0,
    transport_allowance DECIMAL(15,2) DEFAULT 0,
    other_allowances DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(employee_id)
);

-- Create payroll_runs table to track payroll processing
CREATE TABLE public.payroll_runs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
    period_year INTEGER NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'cancelled')),
    total_gross DECIMAL(15,2) DEFAULT 0,
    total_paye DECIMAL(15,2) DEFAULT 0,
    total_nssf_employee DECIMAL(15,2) DEFAULT 0,
    total_nssf_employer DECIMAL(15,2) DEFAULT 0,
    total_wcf DECIMAL(15,2) DEFAULT 0,
    total_sdl DECIMAL(15,2) DEFAULT 0,
    total_net DECIMAL(15,2) DEFAULT 0,
    processed_by UUID,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(organization_id, period_month, period_year)
);

-- Create payslips table
CREATE TABLE public.payslips (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    basic_salary DECIMAL(15,2) DEFAULT 0,
    housing_allowance DECIMAL(15,2) DEFAULT 0,
    transport_allowance DECIMAL(15,2) DEFAULT 0,
    other_allowances DECIMAL(15,2) DEFAULT 0,
    gross_salary DECIMAL(15,2) DEFAULT 0,
    taxable_income DECIMAL(15,2) DEFAULT 0,
    paye DECIMAL(15,2) DEFAULT 0,
    nssf_employee DECIMAL(15,2) DEFAULT 0,
    nssf_employer DECIMAL(15,2) DEFAULT 0,
    wcf_employer DECIMAL(15,2) DEFAULT 0,
    sdl_employer DECIMAL(15,2) DEFAULT 0,
    other_deductions DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    net_salary DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feature_configs table for super admin to configure features by plan
CREATE TABLE public.feature_configs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    feature_key TEXT NOT NULL UNIQUE,
    feature_name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    free_enabled BOOLEAN DEFAULT false,
    basic_enabled BOOLEAN DEFAULT false,
    premium_enabled BOOLEAN DEFAULT true,
    enterprise_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create footer_links table for configurable footer links
CREATE TABLE public.footer_links (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create faq table
CREATE TABLE public.faqs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create privacy_policy table
CREATE TABLE public.legal_pages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    page_type TEXT NOT NULL CHECK (page_type IN ('privacy_policy', 'terms_of_service', 'cookie_policy')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    last_updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(page_type)
);

-- Enable RLS
ALTER TABLE public.payroll_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payroll_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payroll tables
CREATE POLICY "Users can view their organization's payroll config"
ON public.payroll_config FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their organization's payroll config"
ON public.payroll_config FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_memberships 
        WHERE user_id = auth.uid() AND role IN ('business_owner', 'manager', 'finance_staff')
    )
);

CREATE POLICY "Users can view their organization's employee payroll details"
ON public.employee_payroll_details FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their organization's employee payroll details"
ON public.employee_payroll_details FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_memberships 
        WHERE user_id = auth.uid() AND role IN ('business_owner', 'manager', 'finance_staff')
    )
);

CREATE POLICY "Users can view their organization's payroll runs"
ON public.payroll_runs FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their organization's payroll runs"
ON public.payroll_runs FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_memberships 
        WHERE user_id = auth.uid() AND role IN ('business_owner', 'manager', 'finance_staff')
    )
);

CREATE POLICY "Users can view their organization's payslips"
ON public.payslips FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their organization's payslips"
ON public.payslips FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_memberships 
        WHERE user_id = auth.uid() AND role IN ('business_owner', 'manager', 'finance_staff')
    )
);

-- RLS for public pages - everyone can view
CREATE POLICY "Anyone can view feature configs"
ON public.feature_configs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only super admin can manage feature configs"
ON public.feature_configs FOR ALL
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Anyone can view active footer links"
ON public.footer_links FOR SELECT USING (is_active = true);

CREATE POLICY "Only super admin can manage footer links"
ON public.footer_links FOR ALL
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Anyone can view active FAQs"
ON public.faqs FOR SELECT USING (is_active = true);

CREATE POLICY "Only super admin can manage FAQs"
ON public.faqs FOR ALL
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Anyone can view legal pages"
ON public.legal_pages FOR SELECT USING (true);

CREATE POLICY "Only super admin can manage legal pages"
ON public.legal_pages FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Insert default feature configs
INSERT INTO public.feature_configs (feature_key, feature_name, description, category, free_enabled, basic_enabled, premium_enabled, enterprise_enabled) VALUES
('payroll', 'Payroll Management', 'Complete payroll processing with TRA compliance', 'hr', false, true, true, true),
('advanced_reports', 'Advanced Reports', 'Detailed analytics and custom reports', 'reporting', false, false, true, true),
('multi_branch', 'Multi-Branch Support', 'Manage multiple business locations', 'operations', false, true, true, true),
('inventory', 'Inventory Management', 'Track stock levels and movements', 'operations', true, true, true, true),
('pos', 'Point of Sale', 'Sales and checkout system', 'sales', true, true, true, true),
('invoicing', 'Invoicing', 'Create and manage invoices', 'finance', true, true, true, true),
('mobile_payments', 'Mobile Money Payments', 'Accept M-Pesa, Tigo Pesa, etc.', 'payments', false, true, true, true),
('api_access', 'API Access', 'Integrate with external systems', 'integrations', false, false, false, true),
('audit_logs', 'Audit Logs', 'Track all system activities', 'security', false, false, true, true),
('custom_branding', 'Custom Branding', 'Add your logo and colors', 'customization', false, false, true, true);

-- Insert default footer links
INSERT INTO public.footer_links (title, url, category, display_order) VALUES
('FAQ', '/faq', 'support', 1),
('Privacy Policy', '/privacy', 'legal', 2),
('Terms of Service', '/terms', 'legal', 3),
('Contact Us', '/contact', 'support', 4);

-- Insert default FAQ entries
INSERT INTO public.faqs (question, answer, category, display_order) VALUES
('What is BizWiz?', 'BizWiz is a comprehensive business management platform designed to help Tanzanian businesses manage their operations, including sales, inventory, payroll, and more.', 'general', 1),
('How do I get started?', 'Simply create an account, register your business, and set up your first branch. Our onboarding process will guide you through each step.', 'getting_started', 2),
('What payment methods are supported?', 'We support M-Pesa, Tigo Pesa, Airtel Money, Halopesa, and bank transfers for both subscription payments and business transactions.', 'payments', 3),
('Is my data secure?', 'Yes, we use industry-standard encryption and security practices. Your data is stored securely and backed up regularly.', 'security', 4),
('Can I export my data?', 'Yes, you can export your data in various formats including CSV and PDF for reports, payslips, and other documents.', 'features', 5);

-- Insert default legal pages
INSERT INTO public.legal_pages (page_type, title, content) VALUES
('privacy_policy', 'Privacy Policy', '# Privacy Policy

## Introduction
BizWiz ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information.

## Information We Collect
- Personal information (name, email, phone number)
- Business information (company name, address, TIN)
- Transaction data
- Usage data and analytics

## How We Use Your Information
- To provide and maintain our services
- To process transactions and send related information
- To comply with legal obligations (TRA, NSSF, etc.)
- To improve our services

## Data Security
We implement appropriate security measures to protect your personal information.

## Contact Us
For privacy-related questions, contact us at privacy@bizwiz.co.tz'),
('terms_of_service', 'Terms of Service', '# Terms of Service

## Acceptance of Terms
By accessing or using BizWiz, you agree to be bound by these Terms of Service.

## Services
BizWiz provides business management software including:
- Point of Sale
- Inventory Management
- Payroll Processing
- Financial Reporting

## User Responsibilities
- Maintain accurate account information
- Comply with applicable laws
- Keep login credentials secure

## Limitation of Liability
BizWiz shall not be liable for any indirect, incidental, or consequential damages.

## Contact
Questions? Contact us at support@bizwiz.co.tz');

-- Create trigger for updated_at
CREATE TRIGGER update_payroll_config_updated_at
    BEFORE UPDATE ON public.payroll_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_payroll_details_updated_at
    BEFORE UPDATE ON public.employee_payroll_details
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_runs_updated_at
    BEFORE UPDATE ON public.payroll_runs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_configs_updated_at
    BEFORE UPDATE ON public.feature_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_footer_links_updated_at
    BEFORE UPDATE ON public.footer_links
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON public.faqs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_pages_updated_at
    BEFORE UPDATE ON public.legal_pages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();