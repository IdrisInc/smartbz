-- Add defective_quantity column to products to track defective items separately
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS defective_quantity integer DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.products.defective_quantity IS 'Quantity of defective items excluded from sellable inventory';