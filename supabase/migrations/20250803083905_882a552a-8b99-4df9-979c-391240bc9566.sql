-- Create multi-tenant architecture for supporting multiple businesses

-- Create business sectors enum
CREATE TYPE public.business_sector AS ENUM (
  'retail',
  'manufacturing',
  'technology',
  'healthcare',
  'finance',
  'education',
  'hospitality',
  'real_estate',
  'construction',
  'transportation',
  'agriculture',
  'entertainment',
  'consulting',
  'non_profit',
  'other'
);

-- Create subscription plans enum
CREATE TYPE public.subscription_plan AS ENUM (
  'free',
  'basic',
  'premium',
  'enterprise'
);

-- Create organizations table (businesses)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_sector public.business_sector NOT NULL DEFAULT 'other',
  description TEXT,
  logo_url TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  timezone TEXT DEFAULT 'UTC',
  subscription_plan public.subscription_plan NOT NULL DEFAULT 'free',
  subscription_end TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create organization memberships table (links users to organizations)
CREATE TABLE public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  is_owner BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Create organization payments table
CREATE TABLE public.organization_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  payment_type TEXT NOT NULL, -- 'subscription' or 'one_time'
  plan public.subscription_plan,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for organizations
CREATE POLICY "Users can view organizations they are members of" 
ON public.organizations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = organizations.id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Organization owners can update their organizations" 
ON public.organizations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = organizations.id 
    AND user_id = auth.uid() 
    AND is_owner = true
  )
);

CREATE POLICY "Authenticated users can create organizations" 
ON public.organizations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for organization memberships
CREATE POLICY "Users can view their own memberships" 
ON public.organization_memberships 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Organization owners can view all memberships" 
ON public.organization_memberships 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships AS owner_check
    WHERE owner_check.organization_id = organization_memberships.organization_id 
    AND owner_check.user_id = auth.uid() 
    AND owner_check.is_owner = true
  )
);

CREATE POLICY "Users can insert their own memberships" 
ON public.organization_memberships 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Organization owners can manage memberships" 
ON public.organization_memberships 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships AS owner_check
    WHERE owner_check.organization_id = organization_memberships.organization_id 
    AND owner_check.user_id = auth.uid() 
    AND owner_check.is_owner = true
  )
);

-- RLS policies for organization payments
CREATE POLICY "Users can view their own organization payments" 
ON public.organization_payments 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = organization_payments.organization_id 
    AND user_id = auth.uid() 
    AND is_owner = true
  )
);

CREATE POLICY "Users can create payments for their organizations" 
ON public.organization_payments 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = organization_payments.organization_id 
    AND user_id = auth.uid()
  )
);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_payments_updated_at
  BEFORE UPDATE ON public.organization_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create organization with owner membership
CREATE OR REPLACE FUNCTION public.create_organization_with_membership(
  org_name TEXT,
  org_sector public.business_sector DEFAULT 'other',
  org_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Insert organization
  INSERT INTO public.organizations (name, business_sector, description)
  VALUES (org_name, org_sector, org_description)
  RETURNING id INTO new_org_id;
  
  -- Insert membership with owner role
  INSERT INTO public.organization_memberships (user_id, organization_id, role, is_owner)
  VALUES (auth.uid(), new_org_id, 'owner', true);
  
  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;