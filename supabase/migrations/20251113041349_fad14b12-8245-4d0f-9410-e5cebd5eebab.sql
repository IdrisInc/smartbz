-- Create inventory_movements table
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view movements in their organizations"
  ON public.inventory_movements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_memberships.organization_id = inventory_movements.organization_id
      AND organization_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create movements in their organizations"
  ON public.inventory_movements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_memberships.organization_id = inventory_movements.organization_id
      AND organization_memberships.user_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX idx_inventory_movements_org_product ON public.inventory_movements(organization_id, product_id);
CREATE INDEX idx_inventory_movements_reference ON public.inventory_movements(reference_type, reference_id);