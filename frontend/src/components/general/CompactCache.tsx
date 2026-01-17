import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, RefreshCw, Trash2, Clock, Play, Pause } from 'lucide-react';

interface CacheMetrics {
  cacheHits: number;
  cacheMisses: number;
  networkRequests: number;
  errors: number;
}

export const CompactCache: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30); // seconds
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadCacheMetrics();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  useEffect(() => {
    if (isAutoRefreshEnabled) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
    };
  }, [isAutoRefreshEnabled, autoRefreshInterval]);

  const loadCacheMetrics = async () => {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          if (event.data.metrics) {
            setMetrics(event.data.metrics);
          }
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_METRICS' },
          [channel.port2]
        );
      }
    } catch (error) {
      console.error('Failed to load cache metrics:', error);
    }
  };

  const refreshCache = async () => {
    setIsRefreshing(true);
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          if (event.data.success) {
            loadCacheMetrics();
          }
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'CACHE_REFRESH', cacheType: 'all' },
          [channel.port2]
        );
      }
    } catch (error) {
      console.error('Failed to refresh cache:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getHitRate = (): number => {
    if (!metrics) return 0;
    const total = metrics.cacheHits + metrics.cacheMisses;
    return total > 0 ? (metrics.cacheHits / total) * 100 : 0;
  };

  const startAutoRefresh = () => {
    stopAutoRefresh(); // Clear any existing timers

    setNextRefreshIn(autoRefreshInterval);

    // Start countdown timer
    countdownRef.current = setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) {
          loadCacheMetrics(); // Refresh when countdown reaches 0
          return autoRefreshInterval; // Reset countdown
        }
        return prev - 1;
      });
    }, 1000);

    // Start auto-refresh interval
    intervalRef.current = setInterval(() => {
      loadCacheMetrics();
    }, autoRefreshInterval * 1000);
  };

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setNextRefreshIn(0);
  };

  const getHitRateColor = (rate: number): string => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-primary/10 relative"
        >
          <Database className="h-4 w-4 text-primary" />
          {metrics && metrics.errors > 0 && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Cache Manager</span>
            {isAutoRefreshEnabled && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {nextRefreshIn}s
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Hit Rate:</span>
              <span className={`font-medium ${getHitRateColor(getHitRate())}`}>
                {getHitRate().toFixed(1)}%
              </span>
            </div>

            <Progress value={getHitRate()} className="h-2" />

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Hits:</span>
                <div className="font-medium">{metrics?.cacheHits || 0}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Misses:</span>
                <div className="font-medium">{metrics?.cacheMisses || 0}</div>
              </div>
            </div>

            {metrics && metrics.errors > 0 && (
              <div className="flex items-center gap-2 text-xs text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                {metrics.errors} errors detected
              </div>
            )}
          </div>

          {/* Auto-refresh Timer Settings */}
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Auto-refresh:</span>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={autoRefreshInterval.toString()}
                onValueChange={(value) => setAutoRefreshInterval(parseInt(value))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10s</SelectItem>
                  <SelectItem value="30">30s</SelectItem>
                  <SelectItem value="60">1m</SelectItem>
                  <SelectItem value="300">5m</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
                size="sm"
                variant={isAutoRefreshEnabled ? "default" : "outline"}
                className="h-8 px-2"
              >
                {isAutoRefreshEnabled ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={refreshCache}
              disabled={isRefreshing}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              size="sm"
              variant="outline"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CompactCache;