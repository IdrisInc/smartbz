import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getSalesStats, logAuditEvent } from '@/lib/auditService';

const PAGE_SIZE = 20;

export function useSalesData() {
  const [sales, setSales] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [stats, setStats] = useState({
    todaysSales: 0,
    ordersToday: 0,
    pendingConfirmation: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingReturns, setLoadingReturns] = useState(true);
  const [salesPage, setSalesPage] = useState(0);
  const [hasMoreSales, setHasMoreSales] = useState(true);

  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const { userRole } = useUserRole();
  const { currentUser } = useCurrentUser();

  const isBusinessOwner = userRole === 'business_owner';

  const fetchSales = useCallback(async (page = 0, append = false) => {
    if (!currentOrganization?.id) return;
    try {
      setLoading(true);
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('sales')
        .select(`
          id, sale_number, total_amount, payment_status, payment_method,
          sale_date, created_at, created_by_name, confirmation_status,
          confirmed_at, confirmed_by_name, rejection_reason,
          contacts(name)
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (append) {
        setSales(prev => [...prev, ...(data || [])]);
      } else {
        setSales(data || []);
      }
      setHasMoreSales((data?.length || 0) === PAGE_SIZE);
      setSalesPage(page);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({ title: 'Error', description: 'Failed to load sales data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  const fetchStats = useCallback(async () => {
    if (!currentOrganization?.id) return;
    try {
      const data = await getSalesStats(currentOrganization.id);
      if (data) {
        setStats({
          todaysSales: data.todays_sales,
          ordersToday: data.orders_today,
          pendingConfirmation: data.pending_confirmation,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [currentOrganization?.id]);

  const fetchReturns = useCallback(async () => {
    if (!currentOrganization?.id) return;
    try {
      setLoadingReturns(true);
      const { data, error } = await supabase
        .from('sale_returns')
        .select(`*, sales(contacts(name))`)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReturns(data || []);
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast({ title: 'Error', description: 'Failed to load sale returns', variant: 'destructive' });
    } finally {
      setLoadingReturns(false);
    }
  }, [currentOrganization?.id, toast]);

  const handleConfirmSale = useCallback(async (saleId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('sales')
        .update({
          confirmation_status: 'confirmed',
          confirmed_by: user?.id,
          confirmed_by_name: currentUser?.displayName,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', saleId);

      if (error) throw error;

      // Audit log
      if (currentOrganization?.id && user?.id) {
        logAuditEvent({
          organizationId: currentOrganization.id,
          userId: user.id,
          userName: currentUser?.displayName || 'Unknown',
          action: 'approve',
          entityType: 'sale',
          entityId: saleId,
          newValues: { confirmation_status: 'confirmed' },
        });
      }

      // Send email
      const { data: saleData } = await supabase
        .from('sales')
        .select(`id, contacts(name, email)`)
        .eq('id', saleId)
        .single();

      if (saleData?.contacts?.email && currentOrganization) {
        try {
          await supabase.functions.invoke('send-transaction-email', {
            body: {
              type: 'sale',
              transactionId: saleId,
              recipientEmail: saleData.contacts.email,
              recipientName: saleData.contacts.name || 'Customer',
              organizationId: currentOrganization.id,
            },
          });
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
        }
      }

      toast({ title: 'Sale Confirmed', description: 'The sale has been confirmed successfully.' });
      fetchSales();
      fetchStats();
    } catch (error) {
      console.error('Error confirming sale:', error);
      toast({ title: 'Error', description: 'Failed to confirm sale', variant: 'destructive' });
    }
  }, [currentOrganization, currentUser, fetchSales, fetchStats, toast]);

  const handleRejectSale = useCallback(async (saleId: string, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('sales')
        .update({
          confirmation_status: 'rejected',
          confirmed_by: user?.id,
          confirmed_by_name: currentUser?.displayName,
          confirmed_at: new Date().toISOString(),
          rejection_reason: reason || 'No reason provided',
        })
        .eq('id', saleId);

      if (error) throw error;

      // Audit log
      if (currentOrganization?.id && user?.id) {
        logAuditEvent({
          organizationId: currentOrganization.id,
          userId: user.id,
          userName: currentUser?.displayName || 'Unknown',
          action: 'reject',
          entityType: 'sale',
          entityId: saleId,
          newValues: { confirmation_status: 'rejected', rejection_reason: reason },
        });
      }

      toast({ title: 'Sale Rejected', description: 'The sale has been rejected.' });
      fetchSales();
      fetchStats();
    } catch (error) {
      console.error('Error rejecting sale:', error);
      toast({ title: 'Error', description: 'Failed to reject sale', variant: 'destructive' });
    }
  }, [currentOrganization, currentUser, fetchSales, fetchStats, toast]);

  const loadMoreSales = useCallback(() => {
    if (hasMoreSales && !loading) {
      fetchSales(salesPage + 1, true);
    }
  }, [hasMoreSales, loading, salesPage, fetchSales]);

  useEffect(() => {
    if (currentOrganization) {
      fetchSales();
      fetchStats();
      fetchReturns();
    }
  }, [currentOrganization, fetchSales, fetchStats, fetchReturns]);

  return {
    sales, returns, stats, loading, loadingReturns,
    isBusinessOwner, hasMoreSales,
    fetchSales, fetchStats, fetchReturns,
    handleConfirmSale, handleRejectSale, loadMoreSales,
  };
}
