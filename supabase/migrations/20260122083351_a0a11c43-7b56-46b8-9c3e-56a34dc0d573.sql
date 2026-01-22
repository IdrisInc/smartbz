-- Add working hours and days to business_settings
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS working_days text[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
ADD COLUMN IF NOT EXISTS opening_time time DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS closing_time time DEFAULT '17:00:00';

-- Add performed_by_name to system logs and other tables
ALTER TABLE public.stock_audit_log
ADD COLUMN IF NOT EXISTS performed_by_name text;

ALTER TABLE public.stock_adjustments
ADD COLUMN IF NOT EXISTS performed_by_name text,
ADD COLUMN IF NOT EXISTS approved_by_name text;

-- Add created_by_name to inventory_movements  
ALTER TABLE public.inventory_movements
ADD COLUMN IF NOT EXISTS created_by_name text;

-- Add user name tracking to purchase_orders
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS created_by_name text;

-- Add user name tracking to purchase_returns
ALTER TABLE public.purchase_returns
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS created_by_name text,
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS approved_by_name text;

-- Add user name tracking to sale_returns
ALTER TABLE public.sale_returns
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS created_by_name text,
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS approved_by_name text;

-- Add user name tracking to sales
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS created_by_name text;

-- Add user name tracking to credit_notes
ALTER TABLE public.credit_notes
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS created_by_name text;