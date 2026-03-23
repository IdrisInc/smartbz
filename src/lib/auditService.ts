import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 
  | 'create' | 'update' | 'delete' 
  | 'approve' | 'reject' 
  | 'price_change' | 'stock_adjust'
  | 'login' | 'permission_change'
  | 'refund' | 'return';

export type EntityType = 
  | 'sale' | 'expense' | 'product' | 'invoice' 
  | 'purchase_order' | 'purchase_return' | 'sale_return'
  | 'contact' | 'employee' | 'stock_adjustment'
  | 'cash_register' | 'credit_note' | 'user_role';

interface AuditLogEntry {
  organizationId: string;
  userId: string;
  userName: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      organization_id: entry.organizationId,
      user_id: entry.userId,
      user_name: entry.userName,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      old_values: entry.oldValues,
      new_values: entry.newValues,
      metadata: entry.metadata,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Never let audit logging break the main flow
  }
}

export async function validateStockForSale(
  items: { product_id: string; quantity: number }[]
): Promise<{ valid: boolean; errors: any[] }> {
  const { data, error } = await supabase.rpc('validate_stock_for_sale', {
    p_items: items,
  });

  if (error) {
    console.error('Stock validation error:', error);
    return { valid: false, errors: [{ error: 'Stock validation failed' }] };
  }

  return data as { valid: boolean; errors: any[] };
}

export async function getSalesStats(orgId: string) {
  const { data, error } = await supabase.rpc('get_sales_stats', {
    p_org_id: orgId,
  });

  if (error) {
    console.error('Failed to get sales stats:', error);
    return null;
  }

  return data as {
    todays_sales: number;
    orders_today: number;
    pending_confirmation: number;
    total_sales_month: number;
  };
}
