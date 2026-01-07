import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Wifi, WifiOff } from 'lucide-react';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = useOfflineDetection();

  if (isOnline) {
    return null;
  }

  return (
    <Card className="fixed top-4 right-4 z-50 max-w-sm shadow-lg border-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/50">
      <CardContent className="flex items-center gap-3 p-4">
        <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <div className="flex-1">
          <div className="font-medium text-amber-800 dark:text-amber-200">
            You're Offline
          </div>
          <div className="text-sm text-amber-600 dark:text-amber-400">
            Core quantum features work offline. Some features may be limited.
          </div>
        </div>
        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
      </CardContent>
    </Card>
  );
};