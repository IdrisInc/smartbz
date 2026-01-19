-- Create stock_status enum type
DO $$ BEGIN
  CREATE TYPE public.stock_status AS ENUM ('available', 'reserved', 'damaged', 'returned_qc', 'scrap');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create product_stock table for tracking quantities by status
CREATE TABLE IF NOT EXISTS public.product_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'available',
  quantity INTEGER NOT NULL DEFAULT 0,
  warehouse_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, status)
);

-- Create stock_adjustments table for all stock transactions
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  adjustment_number TEXT NOT NULL,
  adjustment_type TEXT NOT NULL, -- 'purchase_receive', 'sale', 'sale_return', 'purchase_return', 'damage', 'repair', 'scrap', 'transfer', 'correction'
  from_status TEXT, -- source status for transfers
  to_status TEXT NOT NULL, -- destination status
  quantity INTEGER NOT NULL,
  reason TEXT,
  notes TEXT,
  reference_type TEXT, -- 'purchase_order', 'sale', 'sale_return', 'purchase_return', 'inspection', 'manual'
  reference_id UUID,
  warehouse_location TEXT,
  performed_by UUID,
  approved_by UUID,
  approval_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock_audit_log for immutable audit trail
CREATE TABLE IF NOT EXISTS public.stock_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'increase', 'decrease', 'transfer', 'status_change'
  from_status TEXT,
  to_status TEXT,
  quantity_before INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  adjustment_id UUID REFERENCES public.stock_adjustments(id),
  reference_type TEXT,
  reference_id UUID,
  performed_by UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_stock
CREATE POLICY "Users can view product_stock in their org" ON public.product_stock
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = product_stock.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert product_stock in their org" ON public.product_stock
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = product_stock.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update product_stock in their org" ON public.product_stock
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = product_stock.organization_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for stock_adjustments
CREATE POLICY "Users can view stock_adjustments in their org" ON public.stock_adjustments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = stock_adjustments.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert stock_adjustments in their org" ON public.stock_adjustments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = stock_adjustments.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update stock_adjustments in their org" ON public.stock_adjustments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = stock_adjustments.organization_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for stock_audit_log
CREATE POLICY "Users can view stock_audit_log in their org" ON public.stock_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = stock_audit_log.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert stock_audit_log in their org" ON public.stock_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = stock_audit_log.organization_id
      AND user_id = auth.uid()
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_product_stock_updated_at
  BEFORE UPDATE ON public.product_stock
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_adjustments_updated_at
  BEFORE UPDATE ON public.stock_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_stock_product ON public.product_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_status ON public.product_stock(status);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product ON public.stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_type ON public.stock_adjustments(adjustment_type);
CREATE INDEX IF NOT EXISTS idx_stock_audit_log_product ON public.stock_audit_log(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_audit_log_created ON public.stock_audit_log(created_at DESC);