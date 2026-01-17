// Cache Invalidation Implementation
// Consolidated from cacheInvalidation.ts - provides intelligent cache management and cleanup

import { monitoredCircuitCache, monitoredGateCache, monitoredBlochCache } from './memory';
import { settingsManager } from './persistent';

export interface InvalidationRule {
  id: string;
  condition: () => boolean;
  action: () => void;
  description: string;
}

export interface CacheDependency {
  source: string;
  targets: string[];
  invalidationType: 'cascade' | 'selective' | 'manual';
}

export class CacheInvalidator {
  private static instance: CacheInvalidator;
  private invalidationRules: InvalidationRule[] = [];
  private dependencies: Map<string, CacheDependency[]> = new Map();

  static getInstance(): CacheInvalidator {
    if (!CacheInvalidator.instance) {
      CacheInvalidator.instance = new CacheInvalidator();
    }
    return CacheInvalidator.instance;
  }

  // Register invalidation rule
  registerRule(rule: InvalidationRule): void {
    this.invalidationRules.push(rule);
    console.log(`📋 Registered invalidation rule: ${rule.id}`);
  }

  // Register dependency relationship
  registerDependency(dependency: CacheDependency): void {
    if (!this.dependencies.has(dependency.source)) {
      this.dependencies.set(dependency.source, []);
    }
    this.dependencies.get(dependency.source)!.push(dependency);
    console.log(`🔗 Registered dependency: ${dependency.source} -> ${dependency.targets.join(', ')}`);
  }

  // Invalidate cache based on source change
  async invalidateBySource(source: string): Promise<void> {
    const dependencies = this.dependencies.get(source);
    if (!dependencies) return;

    for (const dependency of dependencies) {
      await this.invalidateDependency(dependency);
    }
  }

  // Invalidate specific dependency
  private async invalidateDependency(dependency: CacheDependency): Promise<void> {
    switch (dependency.invalidationType) {
      case 'cascade':
        await this.cascadeInvalidation(dependency.targets);
        break;
      case 'selective':
        await this.selectiveInvalidation(dependency.targets);
        break;
      case 'manual':
        // Manual invalidation requires explicit trigger
        break;
    }
  }

  // Cascade invalidation - clear all related cache entries
  private async cascadeInvalidation(targets: string[]): Promise<void> {
    for (const target of targets) {
      switch (target) {
        case 'circuitCache':
          monitoredCircuitCache.clear();
          break;
        case 'gateCache':
          monitoredGateCache.clear();
          break;
        case 'blochCache':
          monitoredBlochCache.clear();
          break;
        case 'settingsCache':
          // Clear all persistent caches
          await settingsManager.clearCache();
          break;
      }
      console.log(`🗑️ Cascade invalidated: ${target}`);
    }
  }

  // Selective invalidation - clear only specific entries
  private async selectiveInvalidation(targets: string[]): Promise<void> {
    // This would require more sophisticated cache introspection
    // For now, we'll implement basic pattern-based invalidation
    for (const target of targets) {
      if (target.includes('*')) {
        await this.patternInvalidation(target);
      }
    }
  }

  // Pattern-based invalidation using wildcards
  private async patternInvalidation(pattern: string): Promise<void> {
    // This is a simplified implementation
    // In a real system, you'd want more sophisticated pattern matching
    console.log(`🔍 Pattern invalidation for: ${pattern}`);
  }

  // Run all invalidation rules
  async runInvalidationRules(): Promise<void> {
    for (const rule of this.invalidationRules) {
      try {
        if (rule.condition()) {
          console.log(`⚡ Executing invalidation rule: ${rule.description}`);
          await rule.action();
        }
      } catch (error) {
        console.error(`Error executing invalidation rule ${rule.id}:`, error);
      }
    }
  }

  // Manual invalidation triggers
  async invalidateCircuitCache(): Promise<void> {
    monitoredCircuitCache.clear();
    console.log('🗑️ Circuit cache manually invalidated');
  }

  async invalidateGateCache(): Promise<void> {
    monitoredGateCache.clear();
    console.log('🗑️ Gate cache manually invalidated');
  }

  async invalidateBlochCache(): Promise<void> {
    monitoredBlochCache.clear();
    console.log('🗑️ Bloch cache manually invalidated');
  }

  async invalidateAllCaches(): Promise<void> {
    monitoredCircuitCache.clear();
    monitoredGateCache.clear();
    monitoredBlochCache.clear();
    await settingsManager.clearCache();
    console.log('🗑️ All caches invalidated');
  }

  // Smart invalidation based on circuit changes
  async invalidateCircuitRelated(circuitHash: string): Promise<void> {
    // Invalidate all circuit-related cache entries
    // This would require more sophisticated cache key tracking
    console.log(`🎯 Invalidating circuit-related cache for: ${circuitHash}`);
    monitoredCircuitCache.clear();
  }

  // Invalidate visualization cache when settings change
  async invalidateVisualizationCache(): Promise<void> {
    monitoredBlochCache.clear();
    console.log('🎯 Invalidated visualization cache due to settings change');
  }

  // Get invalidation statistics
  getInvalidationStats(): {
    rules: number;
    dependencies: number;
    lastRun: number;
  } {
    return {
      rules: this.invalidationRules.length,
      dependencies: Array.from(this.dependencies.values()).reduce((sum, deps) => sum + deps.length, 0),
      lastRun: Date.now(),
    };
  }
}

// Global invalidator instance
export const cacheInvalidator = CacheInvalidator.getInstance();

// Predefined invalidation rules
export const setupDefaultInvalidationRules = (): void => {
  // Rule 1: Clear circuit cache when switching tabs
  cacheInvalidator.registerRule({
    id: 'tab_switch_circuit',
    condition: () => {
      // This would need to be triggered from the tab change handler
      return false; // Placeholder
    },
    action: () => cacheInvalidator.invalidateCircuitCache(),
    description: 'Clear circuit cache on tab switch',
  });

  // Rule 2: Clear visualization cache when visualization settings change
  cacheInvalidator.registerRule({
    id: 'viz_settings_change',
    condition: () => {
      // This would need to be triggered when viz settings change
      return false; // Placeholder
    },
    action: () => cacheInvalidator.invalidateVisualizationCache(),
    description: 'Clear visualization cache when settings change',
  });

  // Rule 3: Periodic cleanup of expired entries
  cacheInvalidator.registerRule({
    id: 'periodic_cleanup',
    condition: () => {
      // Run cleanup every 5 minutes
      const lastCleanup = localStorage.getItem('cache_last_cleanup');
      const fiveMinutes = 5 * 60 * 1000;
      return !lastCleanup || Date.now() - parseInt(lastCleanup) > fiveMinutes;
    },
    action: async () => {
      localStorage.setItem('cache_last_cleanup', Date.now().toString());
      // Trigger cleanup in persistent cache
      await settingsManager.cleanupCache();
    },
    description: 'Periodic cleanup of expired cache entries',
  });

  // Register dependencies
  cacheInvalidator.registerDependency({
    source: 'circuit_change',
    targets: ['circuitCache', 'blochCache'],
    invalidationType: 'cascade',
  });

  cacheInvalidator.registerDependency({
    source: 'gate_change',
    targets: ['gateCache'],
    invalidationType: 'cascade',
  });

  cacheInvalidator.registerDependency({
    source: 'settings_change',
    targets: ['blochCache', 'settingsCache'],
    invalidationType: 'selective',
  });
};