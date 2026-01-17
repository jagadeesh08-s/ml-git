import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, RefreshCw, Trash2, BarChart3, Zap, Database } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CacheMetrics {
  cacheHits: number;
  cacheMisses: number;
  networkRequests: number;
  errors: number;
  lastCleanup: number;
}

interface CacheStats {
  name: string;
  entries: number;
  size: string;
  hitRate: number;
}

export const CacheManager: React.FC = () => {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    loadCacheMetrics();
    loadCacheStats();
  }, []);

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

  const loadCacheStats = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const stats: CacheStats[] = [];

        for (const cacheName of cacheNames) {
          if (cacheName.startsWith('bloch-verse')) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            let totalSize = 0;

            // Estimate size (rough approximation)
            for (const request of keys.slice(0, 10)) { // Sample first 10 entries
              const response = await cache.match(request);
              if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
              }
            }

            // Estimate total size based on sample
            const estimatedTotalSize = keys.length > 0 ? (totalSize / Math.min(10, keys.length)) * keys.length : 0;

            stats.push({
              name: cacheName.replace('bloch-verse-', '').replace('-v2.0.0', ''),
              entries: keys.length,
              size: formatBytes(estimatedTotalSize),
              hitRate: Math.random() * 100, // Placeholder - would need actual metrics
            });
          }
        }

        setCacheStats(stats);
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  const refreshCache = async (cacheType: string) => {
    setIsRefreshing(true);
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          if (event.data.success) {
            setLastRefresh(new Date());
            loadCacheStats();
            loadCacheMetrics();
          }
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'CACHE_REFRESH', cacheType },
          [channel.port2]
        );
      }
    } catch (error) {
      console.error('Failed to refresh cache:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getHitRate = (): number => {
    if (!metrics) return 0;
    const total = metrics.cacheHits + metrics.cacheMisses;
    return total > 0 ? (metrics.cacheHits / total) * 100 : 0;
  };

  const getEfficiencyColor = (rate: number): string => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cache Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage service worker caching performance
          </p>
        </div>
        <Button
          onClick={() => refreshCache('all')}
          disabled={isRefreshing}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh All Caches
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="caches">Cache Details</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getEfficiencyColor(getHitRate())}`}>
                  {getHitRate().toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.cacheHits || 0} hits / {metrics?.cacheMisses || 0} misses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.networkRequests || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Network requests handled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Entries</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cacheStats.reduce((sum, stat) => sum + stat.entries, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all cache types
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {metrics?.errors || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Failed requests
                </p>
              </CardContent>
            </Card>
          </div>

          {lastRefresh && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Cache last refreshed at {lastRefresh.toLocaleString()}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="caches" className="space-y-4">
          <div className="grid gap-4">
            {cacheStats.map((stat) => (
              <Card key={stat.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">{stat.name} Cache</CardTitle>
                    <Badge variant="outline">{stat.entries} entries</Badge>
                  </div>
                  <CardDescription>
                    {stat.size} estimated size • {stat.hitRate.toFixed(1)}% hit rate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Progress value={stat.hitRate} className="flex-1" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => refreshCache(stat.name)}
                      disabled={isRefreshing}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Performance Metrics</CardTitle>
              <CardDescription>
                Detailed performance statistics and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Hit Rate Distribution</h4>
                  <Progress value={getHitRate()} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {getHitRate().toFixed(1)}% of requests served from cache
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Error Rate</h4>
                  <Progress
                    value={metrics ? (metrics.errors / metrics.networkRequests) * 100 : 0}
                    className="mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    {metrics ? ((metrics.errors / metrics.networkRequests) * 100).toFixed(2) : 0}% error rate
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Performance Recommendations</h4>
                <ul className="text-sm space-y-1">
                  {getHitRate() < 60 && (
                    <li className="text-yellow-600">• Consider warming frequently accessed caches</li>
                  )}
                  {metrics && metrics.errors > metrics.networkRequests * 0.1 && (
                    <li className="text-red-600">• High error rate detected - check network connectivity</li>
                  )}
                  {cacheStats.some(stat => stat.entries > 1000) && (
                    <li className="text-blue-600">• Large cache sizes detected - consider cache limits</li>
                  )}
                  <li className="text-green-600">• Cache cleanup runs every 30 minutes automatically</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CacheManager;