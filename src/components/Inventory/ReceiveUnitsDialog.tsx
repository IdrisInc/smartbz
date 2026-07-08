import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScanLine, Trash2, PlusCircle, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';
import { BarcodeScanner } from '@/components/Products/BarcodeScanner';
import { ParsedScan } from '@/lib/scanParser';
import { cn } from '@/lib/utils';

interface ReceiveUnitsDialogProps {
  open: boolean;
  onClose: () => void;
  onReceived?: () => void;
  /** Optional pre-selection */
  productId?: string;
  purchaseOrderId?: string;
}

interface DraftUnit {
  imei: string;
  serial: string;
  barcode: string;
  completed: boolean;
}

const emptyUnit = (): DraftUnit => ({ imei: '', serial: '', barcode: '', completed: false });

export function ReceiveUnitsDialog({ open, onClose, onReceived, productId, purchaseOrderId }: ReceiveUnitsDialogProps) {
  const { currentOrganization } = useOrganization();
  const { currentUser } = useCurrentUser();
  const { toast } = useToast();

  const [products, setProducts] = useState<Array<{ id: string; name: string; sku: string | null; is_serialized: boolean }>>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(productId || '');
  const [units, setUnits] = useState<DraftUnit[]>([emptyUnit()]);
  const [showScanner, setShowScanner] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !currentOrganization?.id) return;
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, sku, is_serialized')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .order('name');
      setProducts((data as any) || []);
    })();
  }, [open, currentOrganization?.id]);

  useEffect(() => {
    if (open) {
      setSelectedProductId(productId || '');
      setUnits([emptyUnit()]);
    }
  }, [open, productId]);

  const selectedProduct = useMemo(
    () => products.find(p => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const rowStatus = (u: DraftUnit): {
    state: 'empty' | 'in_progress' | 'needs_imei' | 'needs_serial' | 'needs_followup' | 'complete';
    label: string;
    icon: React.ReactNode;
    variant: 'outline' | 'secondary' | 'default' | 'destructive';
  } => {
    const hasImei = !!u.imei.trim();
    const hasSerial = !!u.serial.trim();
    const hasBarcode = !!u.barcode.trim();
    if (hasImei && hasSerial) {
      return { state: 'complete', label: 'Complete', icon: <CheckCircle2 className="h-3.5 w-3.5" />, variant: 'default' };
    }
    if (hasBarcode && !hasImei && !hasSerial) {
      return { state: 'needs_followup', label: 'Step 1 of 2', icon: <AlertCircle className="h-3.5 w-3.5" />, variant: 'destructive' };
    }
    if (hasImei && !hasSerial) {
      return { state: 'needs_serial', label: 'Needs serial', icon: <Circle className="h-3.5 w-3.5" />, variant: 'secondary' };
    }
    if (!hasImei && hasSerial) {
      return { state: 'needs_imei', label: 'Needs IMEI', icon: <Circle className="h-3.5 w-3.5" />, variant: 'secondary' };
    }
    if (hasImei || hasSerial || hasBarcode) {
      return { state: 'in_progress', label: 'In progress', icon: <Circle className="h-3.5 w-3.5" />, variant: 'outline' };
    }
    return { state: 'empty', label: 'Empty', icon: <Circle className="h-3.5 w-3.5" />, variant: 'outline' };
  };

  const completedCount = units.filter(u => rowStatus(u).state === 'complete').length;
  const inProgressCount = units.filter(u => {
    const s = rowStatus(u).state;
    return s !== 'empty' && s !== 'complete';
  }).length;

  const handleScanResult = (parsed: ParsedScan) => {
    console.log('[ReceiveUnits] scan captured', parsed);
    const captured: string[] = [];
    let needsFollowUp = false;
    setUnits(prev => {
      const next = [...prev];
      // Prefer a row already in progress (has something but is missing IMEI or serial)
      let idx = next.findIndex(u => (u.imei || u.serial || u.barcode) && (!u.imei || !u.serial) && !u.completed);
      if (idx === -1) idx = next.findIndex(u => !u.imei && !u.serial && !u.barcode);
      if (idx === -1) { next.push(emptyUnit()); idx = next.length - 1; }
      const slot = { ...next[idx] };

      if (parsed.imei && !slot.imei) { slot.imei = parsed.imei; captured.push(`IMEI ${parsed.imei}`); }
      if (parsed.serial && !slot.serial) { slot.serial = parsed.serial; captured.push(`SN ${parsed.serial}`); }

      if (!parsed.imei && !parsed.serial) {
        if (!slot.barcode) {
          slot.barcode = parsed.raw;
          captured.push(parsed.kind === 'url' ? 'QR URL saved' : `Barcode ${parsed.raw}`);
        }
        needsFollowUp = true;
      }

      slot.completed = !!slot.imei && !!slot.serial;
      next[idx] = slot;
      if (slot.completed && idx === next.length - 1) next.push(emptyUnit());
      return next;
    });
    toast({
      title: captured.length ? 'Captured' : 'Scan received',
      description: needsFollowUp
        ? `${captured.join(' · ') || parsed.raw} — now scan the printed IMEI/SN barcode`
        : (captured.join(' · ') || `Raw: ${parsed.raw}`),
    });
  };

  // Compute what the next scan should fill so the scanner can hint the user
  const nextExpecting: 'imei' | 'serial' | 'any' = useMemo(() => {
    const inProgress = units.find(u => (u.imei || u.serial || u.barcode) && (!u.imei || !u.serial) && !u.completed);
    if (inProgress) return inProgress.imei ? 'serial' : 'imei';
    return 'any';
  }, [units]);

  // A row that started from a QR/URL scan but still needs the printed IMEI/SN
  const pendingFollowUp = useMemo(
    () => units.find(u => u.barcode && !u.imei && !u.serial && !u.completed),
    [units]
  );

  const updateUnit = (idx: number, patch: Partial<DraftUnit>) => {
    setUnits(prev => prev.map((u, i) => {
      if (i !== idx) return u;
      const next = { ...u, ...patch };
      next.completed = !!next.imei.trim() && !!next.serial.trim();
      return next;
    }));
  };

  const removeUnit = (idx: number) => {
    setUnits(prev => prev.length === 1 ? [emptyUnit()] : prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!currentOrganization?.id || !selectedProductId) {
      toast({ title: 'Select a product', variant: 'destructive' });
      return;
    }
    const rows = units
      .filter(u => rowStatus(u).state === 'complete')
      .map(u => ({
        organization_id: currentOrganization.id,
        product_id: selectedProductId,
        imei: u.imei.trim() || null,
        serial_number: u.serial.trim() || null,
        barcode: u.barcode.trim() || null,
        status: 'in_stock' as const,
        purchase_order_id: purchaseOrderId || null,
        created_by_name: currentUser?.displayName || currentUser?.email || null,
      }));

    if (rows.length === 0) {
      toast({
        title: 'No complete units',
        description: 'Each row needs both IMEI and serial before it can be received.',
        variant: 'destructive',
      });
      return;
    }

    const incompleteCount = units.filter(u => rowStatus(u).state !== 'complete' && rowStatus(u).state !== 'empty').length;
    if (incompleteCount > 0) {
      toast({
        title: 'Incomplete rows skipped',
        description: `${incompleteCount} row(s) missing IMEI or serial were not saved.`,
      });
    }

    // Client-side duplicate check within the current batch
    const seenImei = new Set<string>();
    const seenSerial = new Set<string>();
    for (const r of rows) {
      if (r.imei) {
        if (seenImei.has(r.imei)) {
          toast({ title: 'Duplicate IMEI in batch', description: r.imei, variant: 'destructive' });
          return;
        }
        seenImei.add(r.imei);
      }
      if (r.serial_number) {
        if (seenSerial.has(r.serial_number)) {
          toast({ title: 'Duplicate serial in batch', description: r.serial_number, variant: 'destructive' });
          return;
        }
        seenSerial.add(r.serial_number);
      }
    }

    setSaving(true);
    try {
      // Server-side duplicate check against existing units in this org
      const imeis = Array.from(seenImei);
      const serials = Array.from(seenSerial);
      const dupChecks: Array<Promise<any>> = [];
      if (imeis.length) {
        dupChecks.push(
          Promise.resolve(
            supabase.from('product_serial_units')
              .select('imei')
              .eq('organization_id', currentOrganization.id)
              .in('imei', imeis)
          )
        );
      }
      if (serials.length) {
        dupChecks.push(
          Promise.resolve(
            supabase.from('product_serial_units')
              .select('serial_number')
              .eq('organization_id', currentOrganization.id)
              .in('serial_number', serials)
          )
        );
      }
      const results = await Promise.all(dupChecks);
      const existingImeis = (results[0]?.data || []).map((r: any) => r.imei).filter(Boolean);
      const existingSerials = (imeis.length ? results[1]?.data : results[0]?.data)?.map((r: any) => r.serial_number).filter(Boolean) || [];
      if (existingImeis.length || existingSerials.length) {
        toast({
          title: 'Duplicate found',
          description: [
            existingImeis.length ? `IMEI already exists: ${existingImeis.join(', ')}` : '',
            existingSerials.length ? `Serial already exists: ${existingSerials.join(', ')}` : '',
          ].filter(Boolean).join(' · '),
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      const { error } = await supabase.from('product_serial_units').insert(rows);
      if (error) throw error;

      // Bump product stock by the number of units received
      const { data: prod } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', selectedProductId)
        .single();
      const newStock = (prod?.stock_quantity || 0) + rows.length;
      await supabase.from('products').update({ stock_quantity: newStock }).eq('id', selectedProductId);

      toast({ title: 'Units received', description: `${rows.length} unit(s) added to stock.` });
      onReceived?.();
      onClose();
    } catch (e: any) {
      toast({
        title: 'Save failed',
        description: e?.message?.includes('duplicate') ? 'One of the IMEIs / serials already exists.' : (e?.message || 'Try again'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receive Serialized Units</DialogTitle>
            <DialogDescription>
              Scan each phone / device to capture its IMEI or serial number. Each unit becomes traceable through sale and return.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.sku ? `· ${p.sku}` : ''} {p.is_serialized ? '· serialized' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProduct && !selectedProduct.is_serialized && (
                <div className="flex items-start justify-between gap-2 rounded-md border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-200">
                  <span>
                    This product is not marked as serialized. Mark it to enable per-unit IMEI/serial tracking.
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const { error } = await supabase
                        .from('products')
                        .update({ is_serialized: true })
                        .eq('id', selectedProduct.id);
                      if (error) {
                        toast({ title: 'Failed to update product', description: error.message, variant: 'destructive' });
                        return;
                      }
                      setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, is_serialized: true } : p));
                      toast({ title: 'Marked as serialized', description: selectedProduct.name });
                    }}
                  >
                    Mark as serialized
                  </Button>
                </div>
              )}
            </div>

            {pendingFollowUp && (
              <div className="rounded-md border border-blue-300 bg-blue-50 p-2 text-xs text-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
                <div className="font-medium">Step 2 of 2 — scan the printed IMEI/SN barcode</div>
                <div className="mt-0.5 opacity-80">
                  The QR you just scanned only contained a URL. Its raw text was saved in the Barcode field. Now scan the
                  printed Code-128 barcode (the one under the IMEI/SN on the box) to complete this unit.
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Badge variant="default">{completedCount}</Badge>
                <span>complete</span>
                {inProgressCount > 0 && (
                  <>
                    <Badge variant="secondary" className="ml-1">{inProgressCount}</Badge>
                    <span>in progress</span>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setUnits(prev => [...prev, emptyUnit()])}>
                  <PlusCircle className="mr-1 h-4 w-4" /> Add row
                </Button>
                <Button type="button" size="sm" onClick={() => setShowScanner(true)} disabled={!selectedProductId}>
                  <ScanLine className="mr-1 h-4 w-4" /> {pendingFollowUp ? 'Scan IMEI/SN barcode' : 'Scan unit'}
                </Button>
              </div>
            </div>


            <ScrollArea className="max-h-[45vh] pr-2">
              <div className="space-y-3">
                {units.map((u, idx) => {
                  const status = rowStatus(u);
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "rounded-md border p-2 transition-colors",
                        status.state === 'complete' && "border-green-500 bg-green-50/50 dark:bg-green-950/20",
                        status.state === 'needs_followup' && "border-blue-300 bg-blue-50/50 dark:bg-blue-950/20",
                        status.state === 'needs_imei' && "border-amber-300 bg-amber-50/30 dark:bg-amber-950/20",
                        status.state === 'needs_serial' && "border-amber-300 bg-amber-50/30 dark:bg-amber-950/20"
                      )}
                    >
                      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                        <div>
                          {idx === 0 && <Label className="text-xs">IMEI</Label>}
                          <Input
                            value={u.imei}
                            onChange={(e) => updateUnit(idx, { imei: e.target.value })}
                            placeholder="15-digit IMEI"
                            inputMode="numeric"
                          />
                        </div>
                        <div>
                          {idx === 0 && <Label className="text-xs">Serial number</Label>}
                          <Input
                            value={u.serial}
                            onChange={(e) => updateUnit(idx, { serial: e.target.value })}
                            placeholder="Serial number"
                          />
                        </div>
                        <div>
                          {idx === 0 && <Label className="text-xs">Barcode / other</Label>}
                          <Input
                            value={u.barcode}
                            onChange={(e) => updateUnit(idx, { barcode: e.target.value })}
                            placeholder="Barcode"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeUnit(idx)}
                          aria-label="Remove unit"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant={status.variant} className="flex items-center gap-1 text-xs">
                          {status.icon}
                          {status.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {status.state === 'empty' && 'Scan or type IMEI + serial to start'}
                          {status.state === 'needs_followup' && 'Step 2 of 2: scan printed IMEI/SN barcode'}
                          {status.state === 'needs_serial' && 'Step 2 of 2: scan serial number'}
                          {status.state === 'needs_imei' && 'Step 1 of 2: scan IMEI'}
                          {status.state === 'in_progress' && 'Continue scanning both IMEI and serial'}
                          {status.state === 'complete' && 'Both IMEI and serial captured'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || completedCount === 0}>
              {saving ? 'Saving…' : `Receive ${completedCount} unit(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BarcodeScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onDetectedStructured={handleScanResult}
        repeating
        title="Scan units"
        progressLabel={`${completedCount} complete · ${inProgressCount} in progress`}
        expecting={nextExpecting}
      />
    </>
  );
}
