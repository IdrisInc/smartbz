-- First, drop all policies that depend on the role column
DROP POLICY IF EXISTS "Users can manage contacts in their organizations" ON contacts;
DROP POLICY IF EXISTS "Users can manage purchase orders in their organizations" ON purchase_orders;
DROP POLICY IF EXISTS "Users can manage invoices in their organizations" ON invoices;
DROP POLICY IF EXISTS "Users can manage expenses in their organizations" ON expenses;
DROP POLICY IF EXISTS "Only business owners and managers can manage employees" ON employees;
DROP POLICY IF EXISTS "Users can manage attendance in their organizations" ON attendance;
DROP POLICY IF EXISTS "Users can manage products in their organizations" ON products;
DROP POLICY IF EXISTS "Users can insert memberships" ON organization_memberships;

-- Now update the enum type
CREATE TYPE user_role_new AS ENUM (
  'super_admin',      -- Platform owner - manages all business owners
  'business_owner',   -- Owns one or more businesses
  'manager',          -- Branch manager
  'admin_staff',      -- Full access to branch features
  'sales_staff',      -- Sales & Contacts only
  'inventory_staff',  -- Products & Inventory
  'finance_staff',    -- Finance & Reports
  'cashier'          -- Basic sales operations
);

-- Update the column to use new enum, with mapping for existing values
ALTER TABLE organization_memberships 
ALTER COLUMN role TYPE user_role_new 
USING CASE 
  WHEN role::text = 'admin' THEN 'super_admin'::user_role_new
  WHEN role::text = 'business_owner' THEN 'business_owner'::user_role_new
  WHEN role::text = 'manager' THEN 'manager'::user_role_new
  WHEN role::text = 'staff' THEN 'admin_staff'::user_role_new
  WHEN role::text = 'cashier' THEN 'cashier'::user_role_new
  ELSE 'admin_staff'::user_role_new
END;

-- Drop old enum and rename new one
DROP TYPE user_role CASCADE;
ALTER TYPE user_role_new RENAME TO user_role;