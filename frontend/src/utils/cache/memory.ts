// Memory Cache Implementation
// Consolidated from cache.ts - provides in-memory caching with TTL and size management

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  hits: number;
  size: number; // Size in bytes for memory management
}

export interface CacheOptions {
  maxSize?: number; // Maximum cache size in bytes
  defaultTTL?: number; // Default TTL in milliseconds
  maxEntries?: number; // Maximum number of entries
}

export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      maxSize: options.maxSize || 50 * 1024 * 1024, // 50MB default
      defaultTTL: options.defaultTTL || 30 * 60 * 1000, // 30 minutes default
      maxEntries: options.maxEntries || 1000,
    };
  }

  // Generate cache key from various inputs
  generateKey(...inputs: any[]): string {
    return inputs
      .map(input => {
        if (typeof input === 'object' && input !== null) {
          return JSON.stringify(input, Object.keys(input).sort());
        }
        return String(input);
      })
      .join('_');
  }

  // Set cache entry with automatic size calculation
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.options.defaultTTL;

    // Calculate approximate size in bytes
    const size = this.calculateSize(data);

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: entryTTL,
      hits: 0,
      size,
    };

    // Check if we need to evict entries
    this.evictIfNeeded(size);

    this.cache.set(key, entry);
  }

  // Get cache entry if not expired
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hits++;

    return entry.data;
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Delete specific entry
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear all entries
  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats(): {
    entries: number;
    totalSize: number;
    hitRate: number;
    totalHits: number;
    totalRequests: number;
  } {
    let totalSize = 0;
    let totalHits = 0;
    const entries = this.cache.size;

    for (const entry of this.cache.values()) {
      totalSize += entry.size;
      totalHits += entry.hits;
    }

    // Calculate hit rate (this is approximate)
    const totalRequests = totalHits + (entries * 0.1); // Rough estimate
    const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

    return {
      entries,
      totalSize,
      hitRate: Math.round(hitRate * 100) / 100,
      totalHits,
      totalRequests: Math.round(totalRequests),
    };
  }

  // Evict entries if cache is getting too large
  private evictIfNeeded(newEntrySize: number): void {
    if (this.cache.size >= this.options.maxEntries) {
      this.evictLRU();
    }

    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }

    if (totalSize + newEntrySize > this.options.maxSize) {
      this.evictBySize(totalSize + newEntrySize - this.options.maxSize);
    }
  }

  // Evict least recently used entries
  private evictLRU(): void {
    // Sort by hits and timestamp, remove lowest scoring entries
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => {
      const scoreA = a[1].hits / (Date.now() - a[1].timestamp + 1);
      const scoreB = b[1].hits / (Date.now() - b[1].timestamp + 1);
      return scoreA - scoreB;
    });

    const toRemove = Math.ceil(this.options.maxEntries * 0.1); // Remove 10%
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  // Evict entries to free up space
  private evictBySize(targetReduction: number): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].size - b[1].size);

    let freedSize = 0;
    for (const [key] of entries) {
      if (freedSize >= targetReduction) break;
      const size = this.cache.get(key)?.size || 0;
      this.cache.delete(key);
      freedSize += size;
    }
  }

  // Calculate approximate size of data in bytes
  private calculateSize(data: T): number {
    try {
      const str = JSON.stringify(data);
      return new Blob([str]).size;
    } catch {
      return 1000; // Default size estimate
    }
  }
}

// Cache key generators for specific use cases
export const CacheKeys = {
  // Circuit simulation results
  circuitSimulation: (circuit: any, initialState: any, settings?: any) =>
    `circuit_${circuit?.numQubits || 0}_${circuit?.gates?.length || 0}_${JSON.stringify(initialState)}_${JSON.stringify(settings)}`,

  // Gate matrix calculations
  gateMatrix: (gateName: string, parameters?: any[]) =>
    `gate_${gateName}_${JSON.stringify(parameters || [])}`,

  // Bloch sphere visualization
  blochSphere: (vector: any, settings?: any) =>
    `bloch_${JSON.stringify(vector)}_${JSON.stringify(settings)}`,

  // User settings
  userSettings: (userId?: string) =>
    `settings_${userId || 'default'}`,

  // Tutorial progress
  tutorialProgress: (tutorialId: string, userId?: string) =>
    `tutorial_${tutorialId}_${userId || 'default'}`,
};

// Cache performance monitoring
export class CacheMonitor {
  private static instance: CacheMonitor;
  private metrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0,
  };

  static getInstance(): CacheMonitor {
    if (!CacheMonitor.instance) {
      CacheMonitor.instance = new CacheMonitor();
    }
    return CacheMonitor.instance;
  }

  recordHit(): void {
    this.metrics.hits++;
  }

  recordMiss(): void {
    this.metrics.misses++;
  }

  recordSet(): void {
    this.metrics.sets++;
  }

  recordEviction(): void {
    this.metrics.evictions++;
  }

  getMetrics(): typeof this.metrics & { hitRate: number } {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      hitRate: total > 0 ? this.metrics.hits / total : 0,
    };
  }

  reset(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
    };
  }
}

// Export singleton instance
export const cacheMonitor = CacheMonitor.getInstance();

// Enhanced cache wrapper with monitoring
export class MonitoredCache<T = any> extends MemoryCache<T> {
  set(key: string, data: T, ttl?: number): void {
    super.set(key, data, ttl);
    cacheMonitor.recordSet();
  }

  get(key: string): T | null {
    const result = super.get(key);
    if (result !== null) {
      cacheMonitor.recordHit();
    } else {
      cacheMonitor.recordMiss();
    }
    return result;
  }
}

// Global cache instances for different data types
export const circuitCache = new MemoryCache<any>({
  maxSize: 20 * 1024 * 1024, // 20MB for circuit results
  defaultTTL: 60 * 60 * 1000, // 1 hour
  maxEntries: 200,
});

export const gateCache = new MemoryCache<any>({
  maxSize: 5 * 1024 * 1024, // 5MB for gate matrices
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
  maxEntries: 500,
});

export const blochCache = new MemoryCache<any>({
  maxSize: 10 * 1024 * 1024, // 10MB for visualization data
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  maxEntries: 300,
});

export const settingsCache = new MemoryCache<any>({
  maxSize: 1 * 1024 * 1024, // 1MB for settings
  defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxEntries: 50,
});

// Create monitored instances
export const monitoredCircuitCache = new MonitoredCache<any>({
  maxSize: 20 * 1024 * 1024,
  defaultTTL: 60 * 60 * 1000,
  maxEntries: 200,
});

export const monitoredGateCache = new MonitoredCache<any>({
  maxSize: 5 * 1024 * 1024,
  defaultTTL: 24 * 60 * 60 * 1000,
  maxEntries: 500,
});

export const monitoredBlochCache = new MonitoredCache<any>({
  maxSize: 10 * 1024 * 1024,
  defaultTTL: 30 * 60 * 1000,
  maxEntries: 300,
});

export const monitoredSettingsCache = new MonitoredCache<any>({
  maxSize: 1 * 1024 * 1024,
  defaultTTL: 7 * 24 * 60 * 60 * 1000,
  maxEntries: 50,
});