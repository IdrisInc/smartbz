-- Add brand_id to products table
ALTER TABLE public.products 
ADD COLUMN brand_id UUID REFERENCES public.product_brands(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_products_brand_id ON public.products(brand_id);