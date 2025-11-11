-- Create purchase_order_items table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for purchase order items
CREATE POLICY "Users can manage purchase order items"
ON public.purchase_order_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM purchase_orders po
    JOIN organization_memberships om ON po.organization_id = om.organization_id
    WHERE po.id = purchase_order_items.purchase_order_id
    AND om.user_id = auth.uid()
    AND om.role IN ('business_owner', 'manager', 'admin_staff', 'inventory_staff')
  )
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON public.purchase_order_items(product_id);