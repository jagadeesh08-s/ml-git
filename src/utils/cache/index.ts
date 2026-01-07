// Unified Cache System Exports
// Central hub for all caching functionality

export * from './memory';
export * from './persistent';
export * from './invalidation';
export * from './metrics';

// Re-export commonly used instances for convenience
export {
  circuitCache,
  gateCache,
  blochCache,
  settingsCache,
  monitoredCircuitCache,
  monitoredGateCache,
  monitoredBlochCache,
  monitoredSettingsCache,
  cacheMonitor
} from './memory';

export {
  userSettingsCache,
  tutorialProgressCache,
  circuitTemplatesCache,
  settingsManager
} from './persistent';

export {
  cacheInvalidator,
  setupDefaultInvalidationRules
} from './invalidation';

export {
  cacheMetricsCollector,
  cachePerformanceReporter
} from './metrics';

// Cache Manager - Unified interface for all cache operations
export class CacheManager {
  private static instance: CacheManager;

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Get cache by type
  getCache(type: 'circuit' | 'gate' | 'bloch' | 'settings') {
    switch (type) {
      case 'circuit': return monitoredCircuitCache;
      case 'gate': return monitoredGateCache;
      case 'bloch': return monitoredBlochCache;
      case 'settings': return monitoredSettingsCache;
      default: return monitoredCircuitCache;
    }
  }

  // Get persistent cache by type
  getPersistentCache(type: 'userSettings' | 'tutorialProgress' | 'circuitTemplates') {
    switch (type) {
      case 'userSettings': return userSettingsCache;
      case 'tutorialProgress': return tutorialProgressCache;
      case 'circuitTemplates': return circuitTemplatesCache;
      default: return userSettingsCache;
    }
  }

  // Clear all caches
  async clearAll(): Promise<void> {
    monitoredCircuitCache.clear();
    monitoredGateCache.clear();
    monitoredBlochCache.clear();
    monitoredSettingsCache.clear();
    await settingsManager.clearCache();
  }

  // Get comprehensive cache stats
  getStats() {
    return {
      memory: {
        circuit: monitoredCircuitCache.getStats(),
        gate: monitoredGateCache.getStats(),
        bloch: monitoredBlochCache.getStats(),
        settings: monitoredSettingsCache.getStats(),
      },
      persistent: settingsManager.getStats ? settingsManager.getStats() : null,
      performance: cacheMetricsCollector.collectMetrics()
    };
  }
}

export const cacheManager = CacheManager.getInstance();