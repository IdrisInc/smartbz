import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScanLine, Trash2, PlusCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';
import { BarcodeScanner } from '@/components/Products/BarcodeScanner';
import { ParsedScan } from '@/lib/scanParser';

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
}

const emptyUnit = (): DraftUnit => ({ imei: '', serial: '', barcode: '' });

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

  const validCount = units.filter(u => u.imei.trim() || u.serial.trim() || u.barcode.trim()).length;

  const handleScanResult = (parsed: ParsedScan) => {
    setUnits(prev => {
      const next = [...prev];
      // Find a row that is still missing IMEI or serial (in-progress), else first fully empty, else append
      let idx = next.findIndex(u => (u.imei || u.serial || u.barcode) && (!u.imei || !u.serial));
      if (idx === -1) idx = next.findIndex(u => !u.imei && !u.serial && !u.barcode);
      if (idx === -1) {
        next.push(emptyUnit());
        idx = next.length - 1;
      }
      const slot = { ...next[idx] };
      // Autofill both fields if the QR/URL carried them
      if (parsed.imei && !slot.imei) slot.imei = parsed.imei;
      if (parsed.serial && !slot.serial) slot.serial = parsed.serial;
      if (!parsed.imei && !parsed.serial && !slot.barcode) slot.barcode = parsed.raw;
      next[idx] = slot;
      // Only advance to a new empty row once this unit has BOTH IMEI and serial captured
      const rowComplete = !!slot.imei && !!slot.serial;
      if (rowComplete && idx === next.length - 1) {
        next.push(emptyUnit());
      }
      return next;
    });
  };

  // Compute what the next scan should fill so the scanner can hint the user
  const nextExpecting: 'imei' | 'serial' | 'any' = useMemo(() => {
    const inProgress = units.find(u => (u.imei || u.serial) && (!u.imei || !u.serial));
    if (inProgress) return inProgress.imei ? 'serial' : 'imei';
    return 'any';
  }, [units]);

  const updateUnit = (idx: number, patch: Partial<DraftUnit>) => {
    setUnits(prev => prev.map((u, i) => (i === idx ? { ...u, ...patch } : u)));
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
      .filter(u => u.imei.trim() || u.serial.trim() || u.barcode.trim())
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
      toast({ title: 'Nothing to receive', description: 'Scan at least one unit.', variant: 'destructive' });
      return;
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
                <p className="text-xs text-yellow-600">
                  This product is not marked as serialized. Units will still be saved; edit the product to enable per-unit tracking.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <Badge variant="secondary" className="mr-2">{validCount}</Badge>
                unit(s) ready to receive
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setUnits(prev => [...prev, emptyUnit()])}>
                  <PlusCircle className="mr-1 h-4 w-4" /> Add row
                </Button>
                <Button type="button" size="sm" onClick={() => setShowScanner(true)} disabled={!selectedProductId}>
                  <ScanLine className="mr-1 h-4 w-4" /> Scan unit
                </Button>
              </div>
            </div>

            <ScrollArea className="max-h-[45vh] pr-2">
              <div className="space-y-2">
                {units.map((u, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
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
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || validCount === 0}>
              {saving ? 'Saving…' : `Receive ${validCount} unit(s)`}
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
        progressLabel={`${validCount} unit(s) captured`}
        expecting={nextExpecting}
      />
    </>
  );
}
