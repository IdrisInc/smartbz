import { supabase } from '@/integrations/supabase/client';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface CreateNotificationParams {
  title: string;
  message: string;
  type?: NotificationType;
  userId?: string | null;
  organizationId?: string | null;
  actionUrl?: string;
}

export async function createSystemNotification({
  title,
  message,
  type = 'info',
  userId = null,
  organizationId = null,
  actionUrl
}: CreateNotificationParams) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type,
        user_id: userId,
        organization_id: organizationId,
        action_url: actionUrl,
        read: false
      });

    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
}

// Pre-defined notification templates for common system actions
export const NotificationTemplates = {
  // Organization events
  organizationCreated: (orgName: string) => ({
    title: 'New Organization Registered',
    message: `${orgName} has registered and is pending approval.`,
    type: 'info' as NotificationType,
    actionUrl: '/dashboard/super-admin/businesses'
  }),
  
  organizationApproved: (orgName: string) => ({
    title: 'Organization Approved',
    message: `Your organization "${orgName}" has been approved.`,
    type: 'success' as NotificationType,
    actionUrl: '/dashboard'
  }),
  
  organizationSuspended: (orgName: string, reason?: string) => ({
    title: 'Organization Suspended',
    message: `${orgName} has been suspended.${reason ? ` Reason: ${reason}` : ''}`,
    type: 'warning' as NotificationType
  }),

  // Subscription events
  subscriptionUpgraded: (plan: string) => ({
    title: 'Subscription Upgraded',
    message: `Your subscription has been upgraded to ${plan}.`,
    type: 'success' as NotificationType,
    actionUrl: '/dashboard/settings'
  }),
  
  subscriptionExpiring: (daysLeft: number) => ({
    title: 'Subscription Expiring Soon',
    message: `Your subscription expires in ${daysLeft} days. Renew to avoid service interruption.`,
    type: 'warning' as NotificationType,
    actionUrl: '/dashboard/settings'
  }),

  subscriptionExpired: () => ({
    title: 'Subscription Expired',
    message: 'Your subscription has expired. Please renew to continue using premium features.',
    type: 'error' as NotificationType,
    actionUrl: '/dashboard/settings'
  }),

  // Payment events
  paymentProofSubmitted: (orgName: string) => ({
    title: 'Payment Proof Submitted',
    message: `${orgName} has submitted a payment proof for review.`,
    type: 'info' as NotificationType,
    actionUrl: '/dashboard/super-admin/payments'
  }),

  paymentApproved: (plan: string) => ({
    title: 'Payment Approved',
    message: `Your payment has been approved. ${plan} plan is now active.`,
    type: 'success' as NotificationType,
    actionUrl: '/dashboard'
  }),

  paymentRejected: (reason?: string) => ({
    title: 'Payment Rejected',
    message: `Your payment was rejected.${reason ? ` Reason: ${reason}` : ' Please contact support.'}`,
    type: 'error' as NotificationType,
    actionUrl: '/dashboard/payment-history'
  }),

  // User events
  userRegistered: (email: string) => ({
    title: 'New User Registered',
    message: `${email} has registered on the platform.`,
    type: 'info' as NotificationType
  }),

  staffAdded: (name: string, role: string) => ({
    title: 'Staff Member Added',
    message: `${name} has been added as ${role}.`,
    type: 'success' as NotificationType,
    actionUrl: '/dashboard/employees'
  }),

  // Inventory events
  lowStockAlert: (productName: string, currentStock: number) => ({
    title: 'Low Stock Alert',
    message: `${productName} is running low (${currentStock} remaining).`,
    type: 'warning' as NotificationType,
    actionUrl: '/dashboard/inventory'
  }),

  // Sales events
  saleCompleted: (saleNumber: string, amount: number) => ({
    title: 'Sale Completed',
    message: `Sale ${saleNumber} completed for ${amount.toLocaleString()}.`,
    type: 'success' as NotificationType,
    actionUrl: '/dashboard/sales'
  }),

  salePendingApproval: (saleNumber: string) => ({
    title: 'Sale Pending Approval',
    message: `Sale ${saleNumber} requires approval.`,
    type: 'info' as NotificationType,
    actionUrl: '/dashboard/pending-approvals'
  }),
};

// Helper to send notification using templates
export async function sendTemplateNotification(
  template: keyof typeof NotificationTemplates,
  params: any,
  options?: { userId?: string; organizationId?: string }
) {
  const templateFn = NotificationTemplates[template] as (...args: any[]) => any;
  const notification = templateFn(params);
  
  return createSystemNotification({
    ...notification,
    userId: options?.userId,
    organizationId: options?.organizationId
  });
}
