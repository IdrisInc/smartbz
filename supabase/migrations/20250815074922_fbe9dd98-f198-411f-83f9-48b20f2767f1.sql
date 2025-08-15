-- Recreate all the RLS policies with updated role references
-- Contacts policies
CREATE POLICY "Users can manage contacts in their organizations" ON contacts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE organization_id = contacts.organization_id 
    AND user_id = auth.uid() 
    AND role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'admin_staff'::user_role])
  )
);

-- Purchase orders policies
CREATE POLICY "Users can manage purchase orders in their organizations" ON purchase_orders
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE organization_id = purchase_orders.organization_id 
    AND user_id = auth.uid() 
    AND role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'admin_staff'::user_role, 'inventory_staff'::user_role])
  )
);

-- Invoices policies
CREATE POLICY "Users can manage invoices in their organizations" ON invoices
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE organization_id = invoices.organization_id 
    AND user_id = auth.uid() 
    AND role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'admin_staff'::user_role, 'finance_staff'::user_role])
  )
);

-- Expenses policies
CREATE POLICY "Users can manage expenses in their organizations" ON expenses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE organization_id = expenses.organization_id 
    AND user_id = auth.uid() 
    AND role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'admin_staff'::user_role, 'finance_staff'::user_role])
  )
);

-- Employees policies
CREATE POLICY "Business owners and managers can manage employees" ON employees
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE organization_id = employees.organization_id 
    AND user_id = auth.uid() 
    AND role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'admin_staff'::user_role])
  )
);

-- Attendance policies
CREATE POLICY "Users can manage attendance in their organizations" ON attendance
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE organization_id = attendance.organization_id 
    AND user_id = auth.uid() 
    AND role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'admin_staff'::user_role])
  )
);

-- Products policies
CREATE POLICY "Users can manage products in their organizations" ON products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE organization_id = products.organization_id 
    AND user_id = auth.uid() 
    AND role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'admin_staff'::user_role, 'inventory_staff'::user_role])
  )
);

-- Organization memberships policies
CREATE POLICY "Users can insert memberships" ON organization_memberships
FOR INSERT
WITH CHECK (
  (user_id = auth.uid()) OR 
  is_organization_owner(organization_id, auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM organization_memberships om
    WHERE om.organization_id = organization_memberships.organization_id 
    AND om.user_id = auth.uid() 
    AND om.role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'admin_staff'::user_role])
  ))
);

-- Add super admin management table
CREATE TABLE IF NOT EXISTS public.super_admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id UUID NOT NULL,
  target_user_id UUID,
  target_organization_id UUID,
  action_type TEXT NOT NULL,
  action_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on super admin actions
ALTER TABLE public.super_admin_actions ENABLE ROW LEVEL SECURITY;

-- Create policy for super admins
CREATE POLICY "Super admins can manage their actions" ON public.super_admin_actions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Add branch-specific permissions and organization status
ALTER TABLE organization_memberships ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;