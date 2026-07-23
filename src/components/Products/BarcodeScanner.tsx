import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Keyboard, Camera, CheckCircle2 } from 'lucide-react';
import { parseScanned, ParsedScan } from '@/lib/scanParser';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  /** Called with raw scan string (kept for backwards compatibility). */
  onDetected?: (code: string) => void;
  /** Called with structured parse result (IMEI / serial / URL extraction). */
  onDetectedStructured?: (parsed: ParsedScan) => void;
  title?: string;
  /** When true, camera stays open after a hit for continuous scanning. */
  repeating?: boolean;
  /** Optional counter text displayed above the video, e.g. "3 of 10 received". */
  progressLabel?: string;
  /** Hint about which field is expected next, shown as a badge. */
  expecting?: 'imei' | 'serial' | 'sku' | 'any';
}

export function BarcodeScanner({
  open,
  onClose,
  onDetected,
  onDetectedStructured,
  title = 'Scan Barcode / QR',
  repeating = false,
  progressLabel,
  expecting = 'any',
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [manual, setManual] = useState('');
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [lastHit, setLastHit] = useState<ParsedScan | null>(null);
  const [mismatch, setMismatch] = useState<string | null>(null);
  const cooldownRef = useRef<number>(0);
  const seenRef = useRef<Set<string>>(new Set());

  // Reset dedupe + mismatch when scanner reopens or the expected field changes.
  useEffect(() => {
    if (open) {
      seenRef.current = new Set();
      setMismatch(null);
    }
  }, [open, expecting]);

  const matchesExpecting = (parsed: ParsedScan): boolean => {
    if (expecting === 'any') return true;
    if (expecting === 'imei') return !!parsed.imei;
    if (expecting === 'serial') return !!parsed.serial || parsed.kind === 'unknown' || parsed.kind === 'url';
    if (expecting === 'sku') return true;
    return true;
  };


  useEffect(() => {
    if (!open || mode !== 'camera') return;
    let cancelled = false;
    const reader = new BrowserMultiFormatReader();
    setStarting(true);
    setError(null);

    (async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const back = devices.find(d => /back|rear|environment/i.test(d.label)) || devices[0];
        if (!back) throw new Error('No camera found');
        if (cancelled || !videoRef.current) return;
        const controls = await reader.decodeFromVideoDevice(
          back.deviceId,
          videoRef.current,
          (result, _err, ctrl) => {
            if (!result) return;
            const now = Date.now();
            if (now - cooldownRef.current < 1200) return; // debounce
            cooldownRef.current = now;
            const raw = result.getText();
            if (seenRef.current.has(raw)) {
              setMismatch('This code was already scanned in this session.');
              return;
            }
            const parsed = parseScanned(raw);
            if (!matchesExpecting(parsed)) {
              setMismatch(`Expected ${expectLabel[expecting]} — got a different code type. Ignored.`);
              return;
            }
            seenRef.current.add(raw);
            setMismatch(null);
            setLastHit(parsed);
            onDetected?.(raw);
            onDetectedStructured?.(parsed);
            if (!repeating) {
              ctrl.stop();
              onClose();
            }
          }
        );
        controlsRef.current = controls;
      } catch (e: any) {
        setError(e?.message || 'Unable to access camera. You can type the code manually.');
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, mode, repeating, onDetected, onDetectedStructured, onClose, expecting]);


  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manual.trim();
    if (!code) return;
    const parsed = parseScanned(code);
    setLastHit(parsed);
    onDetected?.(code);
    onDetectedStructured?.(parsed);
    setManual('');
    if (!repeating) onClose();
  };

  const expectLabel: Record<string, string> = {
    imei: 'Expecting: IMEI',
    serial: 'Expecting: Serial Number',
    sku: 'Expecting: SKU / barcode',
    any: 'Any code',
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span>{title}</span>
            {expecting !== 'any' && (
              <Badge variant="outline" className="text-[10px]">{expectLabel[expecting]}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'camera'
              ? 'Point the camera at a barcode or QR code.'
              : 'Type or use a hardware scanner that types into this field.'}
          </DialogDescription>
        </DialogHeader>

        {progressLabel && (
          <div className="text-sm font-medium text-center text-muted-foreground">{progressLabel}</div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === 'camera' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('camera')}
          >
            <Camera className="mr-2 h-4 w-4" /> Camera
          </Button>
          <Button
            type="button"
            variant={mode === 'manual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              controlsRef.current?.stop();
              setMode('manual');
            }}
          >
            <Keyboard className="mr-2 h-4 w-4" /> Manual / Hardware
          </Button>
        </div>

        {mode === 'camera' ? (
          <div className="space-y-2">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
              <video ref={videoRef} className="h-full w-full object-cover" />
              {starting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Starting camera…
                </div>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <Label htmlFor="manual-code">Code</Label>
            <Input
              id="manual-code"
              autoFocus
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Scan or type code, then Enter"
            />
            <Button type="submit" className="w-full">Use code</Button>
          </form>
        )}

        {lastHit && repeating && (
          <div className="rounded-md border p-2 text-xs space-y-1">
            <div className="flex items-center gap-1 font-medium text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Captured
            </div>
            {lastHit.imei && <div>IMEI: <span className="font-mono">{lastHit.imei}</span></div>}
            {lastHit.serial && <div>Serial: <span className="font-mono">{lastHit.serial}</span></div>}
            {!lastHit.imei && !lastHit.serial && <div>Raw: <span className="font-mono">{lastHit.raw}</span></div>}
          </div>
        )}

        {repeating && (
          <Button variant="secondary" onClick={onClose}>Done</Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
