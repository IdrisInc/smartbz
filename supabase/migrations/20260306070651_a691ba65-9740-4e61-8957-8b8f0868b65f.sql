
-- Add target_roles column to notifications for role-based filtering
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_roles text[] DEFAULT NULL;

-- Create chat_messages table for org live chat
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_name text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat in their org" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE organization_memberships.organization_id = chat_messages.organization_id
    AND organization_memberships.user_id = auth.uid()
  ));

CREATE POLICY "Users can send chat in their org" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE organization_memberships.organization_id = chat_messages.organization_id
    AND organization_memberships.user_id = auth.uid()
  ));

CREATE INDEX idx_chat_messages_org_created ON public.chat_messages(organization_id, created_at DESC);

-- Create org_module_visibility table for admin sidebar customization
CREATE TABLE public.org_module_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, module_key)
);

ALTER TABLE public.org_module_visibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org module visibility" ON public.org_module_visibility
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE organization_memberships.organization_id = org_module_visibility.organization_id
    AND organization_memberships.user_id = auth.uid()
  ));

CREATE POLICY "Owners can manage module visibility" ON public.org_module_visibility
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE organization_memberships.organization_id = org_module_visibility.organization_id
    AND organization_memberships.user_id = auth.uid()
    AND organization_memberships.role IN ('business_owner', 'super_admin')
  ));
