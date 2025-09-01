-- Fix security warnings for functions by setting search_path

-- Update function to have proper search_path
CREATE OR REPLACE FUNCTION public.create_payment_proof_notification()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Update function to have proper search_path
CREATE OR REPLACE FUNCTION public.notify_payment_proof_status_change()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';