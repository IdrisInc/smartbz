-- Create storage bucket for payment proof images
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false);

-- Create RLS policies for payment proof images
CREATE POLICY "Users can upload payment proof images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their payment proof images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payment-proofs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all payment proof images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payment-proofs' AND EXISTS (
  SELECT 1 FROM organization_memberships 
  WHERE user_id = auth.uid() 
  AND role IN ('super_admin', 'admin_staff')
));