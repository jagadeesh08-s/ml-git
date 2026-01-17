// Persistent Cache Implementation
// Consolidated from persistentCache.ts - provides IndexedDB-based long-term storage

export interface PersistentCacheOptions {
  dbName?: string;
  dbVersion?: number;
  storeName?: string;
}

export class PersistentCache {
  private dbName: string;
  private dbVersion: number;
  private storeName: string;
  private db: IDBDatabase | null = null;

  constructor(options: PersistentCacheOptions = {}) {
    this.dbName = options.dbName || 'QuantumAppCache';
    this.dbVersion = options.dbVersion || 1;
    this.storeName = options.storeName || 'keyValueStore';
  }

  // Initialize IndexedDB
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName);
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('ttl', 'ttl', { unique: false });
        }
      };
    });
  }

  // Set a value in persistent cache
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const data = {
        value,
        timestamp: Date.now(),
        ttl: ttl || 7 * 24 * 60 * 60 * 1000, // Default 7 days
      };

      return new Promise((resolve, reject) => {
        const request = store.put(data, key);

        request.onsuccess = () => {
          console.log(`💾 Persisted cache: ${key}`);
          resolve();
        };

        request.onerror = () => {
          console.error('Failed to set persistent cache:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Persistent cache set error:', error);
      throw error;
    }
  }

  // Get a value from persistent cache
  async get(key: string): Promise<any | null> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.get(key);

        request.onsuccess = () => {
          const data = request.result;

          if (!data) {
            resolve(null);
            return;
          }

          // Check if expired
          if (Date.now() > data.timestamp + data.ttl) {
            // Clean up expired entry
            this.delete(key).catch(console.error);
            resolve(null);
            return;
          }

          resolve(data.value);
        };

        request.onerror = () => {
          console.error('Failed to get persistent cache:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Persistent cache get error:', error);
      return null;
    }
  }

  // Delete a value from persistent cache
  async delete(key: string): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.delete(key);

        request.onsuccess = () => {
          console.log(`🗑️ Deleted persistent cache: ${key}`);
          resolve();
        };

        request.onerror = () => {
          console.error('Failed to delete persistent cache:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Persistent cache delete error:', error);
      throw error;
    }
  }

  // Clear all persistent cache
  async clear(): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.clear();

        request.onsuccess = () => {
          console.log('🗑️ Cleared all persistent cache');
          resolve();
        };

        request.onerror = () => {
          console.error('Failed to clear persistent cache:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Persistent cache clear error:', error);
      throw error;
    }
  }

  // Get all keys in persistent cache
  async keys(): Promise<string[]> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.getAllKeys();

        request.onsuccess = () => {
          resolve(request.result as string[]);
        };

        request.onerror = () => {
          console.error('Failed to get persistent cache keys:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Persistent cache keys error:', error);
      return [];
    }
  }

  // Clean up expired entries
  async cleanup(): Promise<number> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.openCursor();
        let deletedCount = 0;

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const data = cursor.value;

            if (Date.now() > data.timestamp + data.ttl) {
              cursor.delete();
              deletedCount++;
            }

            cursor.continue();
          } else {
            console.log(`🧹 Cleaned up ${deletedCount} expired persistent cache entries`);
            resolve(deletedCount);
          }
        };

        request.onerror = () => {
          console.error('Failed to cleanup persistent cache:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Persistent cache cleanup error:', error);
      return 0;
    }
  }

  // Get cache statistics
  async getStats(): Promise<{
    size: number;
    keys: string[];
    lastCleanup: number;
  }> {
    try {
      const keys = await this.keys();
      return {
        size: keys.length,
        keys,
        lastCleanup: Date.now(), // Could store this in the DB for accuracy
      };
    } catch (error) {
      console.error('Persistent cache stats error:', error);
      return { size: 0, keys: [], lastCleanup: 0 };
    }
  }
}

// Cache key generators for persistent storage
export const PersistentCacheKeys = {
  // User settings and preferences
  userSettings: (userId?: string) => `user_settings_${userId || 'default'}`,

  // Tutorial progress tracking
  tutorialProgress: (tutorialId: string, userId?: string) =>
    `tutorial_progress_${tutorialId}_${userId || 'default'}`,

  // Custom circuit templates
  circuitTemplate: (templateId: string, userId?: string) =>
    `circuit_template_${templateId}_${userId || 'default'}`,

  // UI preferences
  uiPreferences: (userId?: string) => `ui_preferences_${userId || 'default'}`,

  // Visualization settings
  visualizationSettings: (userId?: string) => `viz_settings_${userId || 'default'}`,
};

// Settings persistence helpers
export class SettingsManager {
  private static instance: SettingsManager;
  private cache: PersistentCache;

  constructor() {
    this.cache = userSettingsCache;
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  // Save user settings
  async saveSettings(settings: Record<string, any>): Promise<void> {
    const key = PersistentCacheKeys.userSettings();
    await this.cache.set(key, settings, 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  // Load user settings
  async loadSettings(): Promise<Record<string, any> | null> {
    const key = PersistentCacheKeys.userSettings();
    return await this.cache.get(key);
  }

  // Save UI preferences
  async saveUIPreferences(preferences: Record<string, any>): Promise<void> {
    const key = PersistentCacheKeys.uiPreferences();
    await this.cache.set(key, preferences, 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  // Load UI preferences
  async loadUIPreferences(): Promise<Record<string, any> | null> {
    const key = PersistentCacheKeys.uiPreferences();
    return await this.cache.get(key);
  }

  // Save visualization settings
  async saveVisualizationSettings(settings: Record<string, any>): Promise<void> {
    const key = PersistentCacheKeys.visualizationSettings();
    await this.cache.set(key, settings, 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  // Load visualization settings
  async loadVisualizationSettings(): Promise<Record<string, any> | null> {
    const key = PersistentCacheKeys.visualizationSettings();
    return await this.cache.get(key);
  }

  // Public method to clear cache (for invalidation)
  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  // Public method to cleanup cache (for invalidation)
  async cleanupCache(): Promise<number> {
    return await this.cache.cleanup();
  }

  // Get stats
  async getStats(): Promise<{
    size: number;
    keys: string[];
    lastCleanup: number;
  }> {
    return await this.cache.getStats();
  }
}

// Global persistent cache instances
export const userSettingsCache = new PersistentCache({
  dbName: 'QuantumAppSettings',
  storeName: 'userSettings',
});

export const tutorialProgressCache = new PersistentCache({
  dbName: 'QuantumAppProgress',
  storeName: 'tutorialProgress',
});

export const circuitTemplatesCache = new PersistentCache({
  dbName: 'QuantumAppTemplates',
  storeName: 'circuitTemplates',
});

// Export singleton instance
export const settingsManager = SettingsManager.getInstance();