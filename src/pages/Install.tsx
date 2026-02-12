import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 rounded-2xl bg-primary/10">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Install BizWiz</CardTitle>
          <CardDescription>
            Install BizWiz on your device for quick access and offline support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInstalled ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
              <p className="font-medium">BizWiz is installed!</p>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Open Dashboard
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Works offline — access your data anytime</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Faster loading with cached resources</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Home screen shortcut like a native app</span>
                </div>
              </div>

              {deferredPrompt ? (
                <Button onClick={handleInstall} className="w-full" size="lg">
                  <Download className="h-4 w-4 mr-2" />
                  Install Now
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted text-sm">
                    <p className="font-medium mb-1 flex items-center gap-1.5">
                      <Smartphone className="h-4 w-4" /> On Mobile
                    </p>
                    <p className="text-muted-foreground">Tap Share → "Add to Home Screen"</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-sm">
                    <p className="font-medium mb-1 flex items-center gap-1.5">
                      <Monitor className="h-4 w-4" /> On Desktop
                    </p>
                    <p className="text-muted-foreground">Click the install icon in your browser's address bar</p>
                  </div>
                </div>
              )}

              <Button variant="ghost" className="w-full" onClick={() => navigate('/')}>
                Continue in browser
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
