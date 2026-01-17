import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Monitor } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, installPWA } = usePWAInstall();
  const { isOnline } = useOfflineDetection();

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 max-w-sm shadow-lg border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="w-5 h-5" />
          Install Quantum State Visualizer
        </CardTitle>
        <CardDescription>
          Install the app for offline access and better experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Smartphone className="w-4 h-4" />
          <Monitor className="w-4 h-4" />
          <span>Available on mobile and desktop</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={installPWA} className="flex-1">
            Install App
          </Button>
          <Button variant="outline" onClick={() => {}}>
            Later
          </Button>
        </div>
        {!isOnline && (
          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-2 rounded">
            ⚠️ You're offline. Install now to access the app anytime.
          </div>
        )}
      </CardContent>
    </Card>
  );
};