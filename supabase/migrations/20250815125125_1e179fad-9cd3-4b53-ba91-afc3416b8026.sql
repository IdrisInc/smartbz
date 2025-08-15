-- Create table for payment proofs submitted by users
CREATE TABLE public.payment_proofs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  plan subscription_plan NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL, -- mobile_money, bank_transfer, cash
  transaction_id TEXT,
  proof_image_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  admin_notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for activation codes
CREATE TABLE public.activation_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  plan subscription_plan NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly
  duration_days INTEGER NOT NULL,
  payment_proof_id UUID,
  status TEXT NOT NULL DEFAULT 'unused', -- unused, used, expired
  used_by UUID,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for code redemption logs
CREATE TABLE public.code_redemption_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_id UUID NOT NULL,
  user_id UUID NOT NULL,
  organization_id UUID,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_redemption_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_proofs
CREATE POLICY "Users can create payment proofs for their organizations" 
ON public.payment_proofs 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_memberships 
    WHERE organization_id = payment_proofs.organization_id 
    AND user_id = auth.uid()
    AND is_owner = true
  )
);

CREATE POLICY "Users can view their organization payment proofs" 
ON public.payment_proofs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships 
    WHERE organization_id = payment_proofs.organization_id 
    AND user_id = auth.uid()
    AND (is_owner = true OR role = ANY(ARRAY['super_admin'::user_role, 'admin_staff'::user_role]))
  )
);

CREATE POLICY "Admins can manage payment proofs" 
ON public.payment_proofs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['super_admin'::user_role, 'admin_staff'::user_role])
  )
);

-- RLS Policies for activation_codes
CREATE POLICY "Admins can manage activation codes" 
ON public.activation_codes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['super_admin'::user_role, 'admin_staff'::user_role])
  )
);

CREATE POLICY "Users can view unused codes for redemption" 
ON public.activation_codes 
FOR SELECT 
USING (status = 'unused' AND expires_at > now());

-- RLS Policies for code_redemption_logs
CREATE POLICY "Users can view their own redemption logs" 
ON public.code_redemption_logs 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all redemption logs" 
ON public.code_redemption_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['super_admin'::user_role, 'admin_staff'::user_role])
  )
);

CREATE POLICY "Anyone can insert redemption logs" 
ON public.code_redemption_logs 
FOR INSERT 
WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_payment_proofs_updated_at
BEFORE UPDATE ON public.payment_proofs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activation_codes_updated_at
BEFORE UPDATE ON public.activation_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate activation code
CREATE OR REPLACE FUNCTION public.generate_activation_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a code in format: ABC1-2DEF-3GHI
    code := 
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      floor(random() * 10)::text ||
      '-' ||
      floor(random() * 10)::text ||
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      '-' ||
      floor(random() * 10)::text ||
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      floor(random() * 10)::text;
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM activation_codes WHERE activation_codes.code = generate_activation_code.code) INTO exists_check;
    
    -- If code doesn't exist, we can use it
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;