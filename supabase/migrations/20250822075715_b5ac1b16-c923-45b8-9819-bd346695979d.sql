-- Create notifications table for real notification data
CREATE TABLE public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    read boolean NOT NULL DEFAULT false,
    action_url text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (user_id = auth.uid());

-- System can create notifications
CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Super admins can view all notifications
CREATE POLICY "Super admins can view all notifications" 
ON public.notifications 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM organization_memberships 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
));

-- Create function to automatically create notifications for payment proof submissions
CREATE OR REPLACE FUNCTION create_payment_proof_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for super admins
    INSERT INTO public.notifications (
        title,
        message,
        type,
        action_url
    ) VALUES (
        'New Payment Proof Submitted',
        'A new payment proof has been submitted and requires review.',
        'info',
        '/super-admin/payments'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment proof notifications
CREATE TRIGGER payment_proof_notification_trigger
    AFTER INSERT ON payment_proofs
    FOR EACH ROW
    EXECUTE FUNCTION create_payment_proof_notification();

-- Create function to notify users when their payment proof status changes
CREATE OR REPLACE FUNCTION notify_payment_proof_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification if status changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.notifications (
            user_id,
            organization_id,
            title,
            message,
            type,
            action_url
        ) VALUES (
            NEW.user_id,
            NEW.organization_id,
            'Payment Proof Status Updated',
            CASE 
                WHEN NEW.status = 'approved' THEN 'Your payment proof has been approved and your subscription has been updated.'
                WHEN NEW.status = 'rejected' THEN 'Your payment proof has been rejected. Please check the admin notes for details.'
                ELSE 'Your payment proof status has been updated to: ' || NEW.status
            END,
            CASE 
                WHEN NEW.status = 'approved' THEN 'success'
                WHEN NEW.status = 'rejected' THEN 'error'
                ELSE 'info'
            END,
            '/settings?tab=manual-payment'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment proof status changes
CREATE TRIGGER payment_proof_status_notification_trigger
    AFTER UPDATE ON payment_proofs
    FOR EACH ROW
    EXECUTE FUNCTION notify_payment_proof_status_change();