// Cache Metrics Implementation
// Consolidated from cacheMetrics.ts - provides detailed analytics and performance insights

import { MemoryCache, CacheMonitor, monitoredCircuitCache, monitoredGateCache, monitoredBlochCache, monitoredSettingsCache } from './memory';
import { PersistentCache } from './persistent';

export interface CacheMetrics {
  timestamp: number;
  memoryUsage: {
    circuitCache: { entries: number; size: number; hitRate: number };
    gateCache: { entries: number; size: number; hitRate: number };
    blochCache: { entries: number; size: number; hitRate: number };
    settingsCache: { entries: number; size: number; hitRate: number };
  };
  performance: {
    averageResponseTime: number;
    cacheEfficiency: number;
    memoryPressure: number;
  };
  trends: {
    hitsOverTime: number[];
    missesOverTime: number[];
    evictionsOverTime: number[];
  };
}

export interface PerformanceSnapshot {
  timestamp: number;
  operation: string;
  duration: number;
  cacheUsed: boolean;
  cacheType?: string;
}

export class CacheMetricsCollector {
  private static instance: CacheMetricsCollector;
  private snapshots: PerformanceSnapshot[] = [];
  private metricsHistory: CacheMetrics[] = [];
  private maxSnapshots = 1000;
  private maxHistory = 100;

  static getInstance(): CacheMetricsCollector {
    if (!CacheMetricsCollector.instance) {
      CacheMetricsCollector.instance = new CacheMetricsCollector();
    }
    return CacheMetricsCollector.instance;
  }

  // Record performance snapshot
  recordSnapshot(snapshot: Omit<PerformanceSnapshot, 'timestamp'>): void {
    const fullSnapshot: PerformanceSnapshot = {
      ...snapshot,
      timestamp: Date.now(),
    };

    this.snapshots.push(fullSnapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }
  }

  // Collect comprehensive cache metrics
  collectMetrics(): CacheMetrics {
    const cacheMonitor = CacheMonitor.getInstance();
    const monitorMetrics = cacheMonitor.getMetrics();

    // Get individual cache stats
    const circuitStats = monitoredCircuitCache.getStats();
    const gateStats = monitoredGateCache.getStats();
    const blochStats = monitoredBlochCache.getStats();
    const settingsStats = monitoredSettingsCache.getStats();

    // Calculate memory usage
    const totalMemory = circuitStats.totalSize + gateStats.totalSize +
                       blochStats.totalSize + settingsStats.totalSize;

    // Calculate performance metrics
    const recentSnapshots = this.snapshots.slice(-100); // Last 100 operations
    const averageResponseTime = recentSnapshots.length > 0
      ? recentSnapshots.reduce((sum, s) => sum + s.duration, 0) / recentSnapshots.length
      : 0;

    const cacheHits = recentSnapshots.filter(s => s.cacheUsed).length;
    const cacheEfficiency = recentSnapshots.length > 0 ? cacheHits / recentSnapshots.length : 0;

    // Calculate memory pressure (0-1 scale)
    const memoryPressure = Math.min(totalMemory / (50 * 1024 * 1024), 1); // 50MB threshold

    // Calculate trends (last 10 data points)
    const recentMetrics = this.metricsHistory.slice(-10);
    const hitsTrend = recentMetrics.map(m => m.memoryUsage.circuitCache.hitRate);
    const missesTrend = recentMetrics.map(m => monitorMetrics.misses);
    const evictionsTrend = recentMetrics.map(m => monitorMetrics.evictions);

    const metrics: CacheMetrics = {
      timestamp: Date.now(),
      memoryUsage: {
        circuitCache: {
          entries: circuitStats.entries,
          size: circuitStats.totalSize,
          hitRate: circuitStats.hitRate,
        },
        gateCache: {
          entries: gateStats.entries,
          size: gateStats.totalSize,
          hitRate: gateStats.hitRate,
        },
        blochCache: {
          entries: blochStats.entries,
          size: blochStats.totalSize,
          hitRate: blochStats.hitRate,
        },
        settingsCache: {
          entries: settingsStats.entries,
          size: settingsStats.totalSize,
          hitRate: settingsStats.hitRate,
        },
      },
      performance: {
        averageResponseTime,
        cacheEfficiency,
        memoryPressure,
      },
      trends: {
        hitsOverTime: hitsTrend,
        missesOverTime: missesTrend,
        evictionsOverTime: evictionsTrend,
      },
    };

    // Store in history
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistory) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistory);
    }

    return metrics;
  }

  // Get performance analytics
  getAnalytics(): {
    topOperations: { operation: string; count: number; avgDuration: number }[];
    cacheEffectiveness: { type: string; effectiveness: number }[];
    recommendations: string[];
  } {
    const recentSnapshots = this.snapshots.slice(-500); // Last 500 operations

    // Analyze operation patterns
    const operationStats = new Map<string, { count: number; totalDuration: number }>();

    for (const snapshot of recentSnapshots) {
      const existing = operationStats.get(snapshot.operation) || { count: 0, totalDuration: 0 };
      existing.count++;
      existing.totalDuration += snapshot.duration;
      operationStats.set(snapshot.operation, existing);
    }

    const topOperations = Array.from(operationStats.entries())
      .map(([operation, stats]) => ({
        operation,
        count: stats.count,
        avgDuration: stats.totalDuration / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate cache effectiveness by type
    const cacheEffectiveness = [
      { type: 'Circuit Simulation', effectiveness: this.calculateEffectiveness('circuit') },
      { type: 'Gate Matrix', effectiveness: this.calculateEffectiveness('gate') },
      { type: 'Bloch Sphere', effectiveness: this.calculateEffectiveness('bloch') },
      { type: 'Settings', effectiveness: this.calculateEffectiveness('settings') },
    ];

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    return {
      topOperations,
      cacheEffectiveness,
      recommendations,
    };
  }

  // Calculate effectiveness for specific cache type
  private calculateEffectiveness(cacheType: string): number {
    const relevantSnapshots = this.snapshots.filter(s => s.cacheType === cacheType);
    if (relevantSnapshots.length === 0) return 0;

    const cacheHits = relevantSnapshots.filter(s => s.cacheUsed).length;
    return cacheHits / relevantSnapshots.length;
  }

  // Generate performance recommendations
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const recentMetrics = this.collectMetrics();

    // Memory pressure recommendations
    if (recentMetrics.performance.memoryPressure > 0.8) {
      recommendations.push('High memory usage detected. Consider increasing cache size limits or reducing TTL values.');
    }

    // Cache efficiency recommendations
    if (recentMetrics.performance.cacheEfficiency < 0.3) {
      recommendations.push('Low cache efficiency. Consider adjusting cache TTL values or warming cache with common circuits.');
    }

    // Response time recommendations
    if (recentMetrics.performance.averageResponseTime > 1000) {
      recommendations.push('Slow response times detected. Cache optimization may improve performance.');
    }

    // Gate cache recommendations
    const gateStats = recentMetrics.memoryUsage.gateCache;
    if (gateStats.hitRate < 0.5 && gateStats.entries > 50) {
      recommendations.push('Gate cache hit rate is low. Consider reducing gate cache TTL or clearing unused entries.');
    }

    return recommendations;
  }

  // Export metrics for analysis
  exportMetrics(): {
    snapshots: PerformanceSnapshot[];
    metrics: CacheMetrics[];
    analytics: ReturnType<CacheMetricsCollector['getAnalytics']>;
  } {
    return {
      snapshots: [...this.snapshots],
      metrics: [...this.metricsHistory],
      analytics: this.getAnalytics(),
    };
  }

  // Clear collected data
  clear(): void {
    this.snapshots = [];
    this.metricsHistory = [];
  }
}

// Global metrics collector instance
export const cacheMetricsCollector = CacheMetricsCollector.getInstance();

// Enhanced cache wrapper with performance monitoring
export class MonitoredCacheWithMetrics<T = any> extends MemoryCache<T> {
  private metricsCollector: CacheMetricsCollector;

  constructor(options?: any) {
    super(options);
    this.metricsCollector = CacheMetricsCollector.getInstance();
  }

  get(key: string): T | null {
    const startTime = performance.now();
    const result = super.get(key);
    const duration = performance.now() - startTime;

    this.metricsCollector.recordSnapshot({
      operation: `get_${key}`,
      duration,
      cacheUsed: result !== null,
      cacheType: this.getCacheType(),
    });

    return result;
  }

  set(key: string, data: T, ttl?: number): void {
    const startTime = performance.now();
    super.set(key, data, ttl);
    const duration = performance.now() - startTime;

    this.metricsCollector.recordSnapshot({
      operation: `set_${key}`,
      duration,
      cacheUsed: false,
      cacheType: this.getCacheType(),
    });
  }

  private getCacheType(): string {
    // This would need to be implemented by subclasses
    return 'unknown';
  }
}

// Cache performance reporter
export class CachePerformanceReporter {
  private static instance: CachePerformanceReporter;

  static getInstance(): CachePerformanceReporter {
    if (!CachePerformanceReporter.instance) {
      CachePerformanceReporter.instance = new CachePerformanceReporter();
    }
    return CachePerformanceReporter.instance;
  }

  // Generate performance report
  generateReport(): {
    summary: string;
    metrics: CacheMetrics;
    analytics: ReturnType<CacheMetricsCollector['getAnalytics']>;
    recommendations: string[];
  } {
    const metrics = cacheMetricsCollector.collectMetrics();
    const analytics = cacheMetricsCollector.getAnalytics();

    // Generate summary
    const summary = this.generateSummary(metrics, analytics);

    return {
      summary,
      metrics,
      analytics,
      recommendations: analytics.recommendations,
    };
  }

  private generateSummary(metrics: CacheMetrics, analytics: ReturnType<CacheMetricsCollector['getAnalytics']>): string {
    const totalMemoryMB = (Object.values(metrics.memoryUsage)
      .reduce((sum, cache) => sum + cache.size, 0) / (1024 * 1024)).toFixed(2);

    const avgEfficiency = analytics.cacheEffectiveness
      .reduce((sum, eff) => sum + eff.effectiveness, 0) / analytics.cacheEffectiveness.length;

    return `Cache Performance Summary:
• Total Memory Usage: ${totalMemoryMB} MB
• Overall Cache Efficiency: ${(avgEfficiency * 100).toFixed(1)}%
• Average Response Time: ${metrics.performance.averageResponseTime.toFixed(2)}ms
• Memory Pressure: ${(metrics.performance.memoryPressure * 100).toFixed(1)}%
• Top Operation: ${analytics.topOperations[0]?.operation || 'N/A'}`;
  }

  // Log performance report to console
  logReport(): void {
    const report = this.generateReport();
    console.group('📊 Cache Performance Report');
    console.log(report.summary);
    console.log('Top Operations:', report.analytics.topOperations);
    console.log('Cache Effectiveness:', report.analytics.cacheEffectiveness);
    if (report.recommendations.length > 0) {
      console.log('Recommendations:', report.recommendations);
    }
    console.groupEnd();
  }
}

// Global reporter instance
export const cachePerformanceReporter = CachePerformanceReporter.getInstance();

// Auto-generate reports periodically (in development)
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    cachePerformanceReporter.logReport();
  }, 5 * 60 * 1000); // Every 5 minutes
}