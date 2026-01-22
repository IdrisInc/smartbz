import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface PendingActivities {
  pendingReturns: number;
  draftPurchaseOrders: number;
}

export function ClosingTimeAlert() {
  const [showAlert, setShowAlert] = useState(false);
  const [pendingActivities, setPendingActivities] = useState<PendingActivities>({
    pendingReturns: 0,
    draftPurchaseOrders: 0
  });
  const [dismissed, setDismissed] = useState(false);
  const [closingTime, setClosingTime] = useState('17:00');
  const { currentOrganization } = useOrganization();

  const loadBusinessHours = useCallback(async () => {
    if (!currentOrganization?.id) return;
    try {
      const { data } = await supabase
        .from('business_settings')
        .select('closing_time')
        .eq('organization_id', currentOrganization.id)
        .single();

      if (data?.closing_time) {
        setClosingTime(data.closing_time.substring(0, 5));
      }
    } catch (error) {
      console.error('Error loading business hours:', error);
    }
  }, [currentOrganization?.id]);

  const loadPendingActivities = useCallback(async () => {
    if (!currentOrganization?.id) return;
    const orgId = currentOrganization.id;
    
    try {
      // Query tables that don't have type issues
      const saleReturnRes = await supabase
        .from('sale_returns')
        .select('id')
        .eq('organization_id', orgId)
        .eq('status', 'pending');

      const purchaseReturnRes = await supabase
        .from('purchase_returns')
        .select('id')
        .eq('organization_id', orgId)
        .eq('status', 'pending');

      const poRes = await supabase
        .from('purchase_orders')
        .select('id')
        .eq('organization_id', orgId)
        .eq('status', 'draft');

      const activities: PendingActivities = {
        pendingReturns: (saleReturnRes.data?.length || 0) + (purchaseReturnRes.data?.length || 0),
        draftPurchaseOrders: poRes.data?.length || 0
      };
      
      setPendingActivities(activities);
      
      const hasActivities = Object.values(activities).some(v => v > 0);
      setShowAlert(hasActivities);
    } catch (error) {
      console.error('Error loading pending activities:', error);
    }
  }, [currentOrganization?.id]);

  const checkClosingTime = useCallback(async () => {
    if (dismissed || !currentOrganization?.id) return;

    const now = new Date();
    const [closingHour, closingMinute] = closingTime.split(':').map(Number);
    
    const closingDate = new Date();
    closingDate.setHours(closingHour, closingMinute, 0, 0);
    
    const oneHourBefore = new Date(closingDate.getTime() - 60 * 60 * 1000);
    
    // Check if we're within 1 hour of closing
    if (now >= oneHourBefore && now < closingDate) {
      await loadPendingActivities();
    } else {
      setShowAlert(false);
    }
  }, [dismissed, currentOrganization?.id, closingTime, loadPendingActivities]);

  useEffect(() => {
    if (currentOrganization?.id) {
      loadBusinessHours();
    }
  }, [currentOrganization?.id, loadBusinessHours]);

  useEffect(() => {
    // Check every minute
    const interval = setInterval(checkClosingTime, 60000);
    checkClosingTime();
    return () => clearInterval(interval);
  }, [checkClosingTime]);

  if (!showAlert || dismissed) return null;

  const totalPending = Object.values(pendingActivities).reduce((a, b) => a + b, 0);

  return (
    <Alert variant="destructive" className="fixed bottom-4 right-4 w-96 z-50 shadow-lg">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Closing Time Approaching
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          You have {totalPending} pending activities to complete before closing:
        </p>
        <ul className="text-sm space-y-1">
          {pendingActivities.pendingReturns > 0 && (
            <li>• {pendingActivities.pendingReturns} pending returns</li>
          )}
          {pendingActivities.draftPurchaseOrders > 0 && (
            <li>• {pendingActivities.draftPurchaseOrders} draft purchase orders</li>
          )}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
