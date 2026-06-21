import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Keyboard, Camera } from 'lucide-react';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
  title?: string;
}

export function BarcodeScanner({ open, onClose, onDetected, title = 'Scan Barcode / QR' }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [manual, setManual] = useState('');
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');

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
            if (result) {
              ctrl.stop();
              onDetected(result.getText());
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
  }, [open, mode, onDetected, onClose]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manual.trim();
    if (code) {
      onDetected(code);
      setManual('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === 'camera'
              ? 'Point the camera at a barcode or QR code.'
              : 'Type or use a hardware scanner that types into this field.'}
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
