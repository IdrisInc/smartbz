-- Add condition field to sale_return_items for inventory impact logic
ALTER TABLE public.sale_return_items 
ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'good' CHECK (condition IN ('good', 'damaged', 'defective')),
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit TEXT;

-- Add condition field to purchase_return_items for inventory impact logic
ALTER TABLE public.purchase_return_items 
ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'defective' CHECK (condition IN ('defective', 'damaged', 'excess', 'wrong_item')),
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit TEXT;

-- Add refund type tracking to sale_returns
ALTER TABLE public.sale_returns 
ADD COLUMN IF NOT EXISTS refund_type TEXT DEFAULT 'full' CHECK (refund_type IN ('full', 'partial', 'none')),
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS credit_note_id UUID;

-- Create credit_notes table for tracking refunds
CREATE TABLE IF NOT EXISTS public.credit_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  credit_note_number TEXT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id),
  sale_return_id UUID REFERENCES public.sale_returns(id),
  purchase_return_id UUID REFERENCES public.purchase_returns(id),
  note_type TEXT NOT NULL CHECK (note_type IN ('sales', 'purchase')),
  amount NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'applied', 'cancelled')),
  reason TEXT,
  notes TEXT,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  applied_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on credit_notes
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for credit_notes
CREATE POLICY "Users can manage credit notes in their organizations"
ON public.credit_notes
FOR ALL
USING (EXISTS (
  SELECT 1 FROM organization_memberships
  WHERE organization_memberships.organization_id = credit_notes.organization_id
  AND organization_memberships.user_id = auth.uid()
  AND organization_memberships.role IN ('business_owner', 'manager', 'admin_staff', 'finance_staff')
));

CREATE POLICY "Users can view credit notes in their organizations"
ON public.credit_notes
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM organization_memberships
  WHERE organization_memberships.organization_id = credit_notes.organization_id
  AND organization_memberships.user_id = auth.uid()
));