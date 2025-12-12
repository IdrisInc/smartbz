-- Create email_templates table for customizable email templates
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL, -- 'sale_confirmation', 'purchase_order'
  subject TEXT NOT NULL,
  header_text TEXT,
  footer_text TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  logo_url TEXT,
  show_business_details BOOLEAN DEFAULT true,
  show_items_table BOOLEAN DEFAULT true,
  custom_message TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, template_type)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their organization's email templates" 
ON public.email_templates 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE user_id = auth.uid() 
    AND organization_id = email_templates.organization_id
  )
);

CREATE POLICY "Business owners can manage email templates" 
ON public.email_templates 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE user_id = auth.uid() 
    AND organization_id = email_templates.organization_id
    AND role IN ('business_owner', 'super_admin')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();