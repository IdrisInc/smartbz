-- Add confirmation_status column to sales table for business owner approval workflow
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS confirmation_status text DEFAULT 'pending' CHECK (confirmation_status IN ('pending', 'confirmed', 'rejected'));

-- Add confirmed_by column to track who confirmed the sale
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS confirmed_by uuid REFERENCES auth.users(id);

-- Add confirmed_at timestamp
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone;

-- Add rejection_reason for rejected sales
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS rejection_reason text;