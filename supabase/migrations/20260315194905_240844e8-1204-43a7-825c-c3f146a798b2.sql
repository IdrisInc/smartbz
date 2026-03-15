
-- Add created_by to sales table
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS created_by uuid;

-- Add created_by_name to expenses table  
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS created_by_name text;

-- Add created_by and created_by_name to invoices table
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS created_by_name text;

-- Add confirmed_by_name to sales table for approval tracking
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS confirmed_by_name text;
