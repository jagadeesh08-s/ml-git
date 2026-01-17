const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `bloch-verse-${CACHE_VERSION}`;
const STATIC_CACHE = `bloch-verse-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `bloch-verse-dynamic-${CACHE_VERSION}`;
const API_CACHE = `bloch-verse-api-${CACHE_VERSION}`;
const QUANTUM_CACHE = `bloch-verse-quantum-${CACHE_VERSION}`;
const STALE_WHILE_REVALIDATE_CACHE = `bloch-verse-stale-${CACHE_VERSION}`;

// Cache configuration
const CACHE_CONFIG = {
  static: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 100,
  },
  dynamic: {
    maxAge: 60 * 60 * 1000, // 1 hour
    maxEntries: 50,
  },
  api: {
    maxAge: 30 * 60 * 1000, // 30 minutes
    maxEntries: 200,
  },
  quantum: {
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
    maxEntries: 100,
  },
  staleWhileRevalidate: {
    maxAge: 15 * 60 * 1000, // 15 minutes
    maxEntries: 50,
  },
};

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/placeholder.svg',
  // Add other static assets as needed
];

// Quantum-related API endpoints
const QUANTUM_ENDPOINTS = [
  '/api/simulate',
  '/api/circuit',
  '/api/gates',
  '/api/state',
  'quantum_executor',
];

// Frequently changing content (stale-while-revalidate)
const STALE_WHILE_REVALIDATE_URLS = [
  '/api/user/preferences',
  '/api/tutorial/progress',
];

// Performance monitoring
const performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  errors: 0,
  lastCleanup: Date.now(),
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing version', CACHE_VERSION);
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Initialize performance metrics
      initializePerformanceMetrics(),
    ])
  );
  self.skipWaiting();
});

// Initialize performance metrics storage
async function initializePerformanceMetrics() {
  try {
    const metrics = await getPerformanceMetrics();
    if (!metrics) {
      await setPerformanceMetrics(performanceMetrics);
    }
  } catch (error) {
    console.error('Failed to initialize performance metrics:', error);
  }
}

// Activate event - clean up old caches and initialize
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating version', CACHE_VERSION);
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      // Initialize background sync
      initializeBackgroundSync(),
      // Periodic cleanup
      scheduleCacheCleanup(),
    ])
  );
  self.clients.claim();
});

// Clean up old cache versions
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, QUANTUM_CACHE, STALE_WHILE_REVALIDATE_CACHE];

  const cleanupPromises = cacheNames.map((cacheName) => {
    if (!validCaches.includes(cacheName)) {
      console.log('Service Worker: Deleting old cache:', cacheName);
      return caches.delete(cacheName);
    }
  });

  await Promise.all(cleanupPromises);
}

// Initialize background sync
async function initializeBackgroundSync() {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    console.log('Service Worker: Background sync supported');
  }
}

// Schedule periodic cache cleanup
async function scheduleCacheCleanup() {
  setInterval(async () => {
    await cleanupExpiredEntries();
    await enforceCacheLimits();
  }, 30 * 60 * 1000); // Every 30 minutes
}

// Fetch event - advanced caching strategies
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);
  const isAPI = url.pathname.includes('/api/') || url.href.includes('quantum_executor');
  const isQuantumEndpoint = QUANTUM_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint));
  const isStaleWhileRevalidate = STALE_WHILE_REVALIDATE_URLS.some(staleUrl => url.pathname.includes(staleUrl));

  // Performance monitoring
  performanceMetrics.networkRequests++;

  if (isQuantumEndpoint) {
    // Quantum simulation results - Network-first with cache fallback
    event.respondWith(handleQuantumRequest(event.request));
  } else if (isAPI && !isStaleWhileRevalidate) {
    // General API requests - Network-first
    event.respondWith(handleAPINetworkFirst(event.request));
  } else if (isStaleWhileRevalidate) {
    // Frequently changing content - Stale-while-revalidate
    event.respondWith(handleStaleWhileRevalidate(event.request));
  } else {
    // Static assets - Cache-first
    event.respondWith(handleStaticCacheFirst(event.request));
  }
});

// Handle quantum simulation requests (Network-first)
async function handleQuantumRequest(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful quantum responses
      const cache = await caches.open(QUANTUM_CACHE);
      await cache.put(request, networkResponse.clone());

      // Update performance metrics
      performanceMetrics.cacheMisses++;

      return networkResponse;
    } else {
      // Handle specific HTTP error codes
      console.warn('Quantum request failed with status:', networkResponse.status);
      performanceMetrics.errors++;

      // For server errors, try cache if available
      if (networkResponse.status >= 500) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          console.log('Serving stale quantum data due to server error');
          performanceMetrics.cacheHits++;
          return cachedResponse;
        }
      }
    }
  } catch (error) {
    console.warn('Quantum network request failed:', error);
    performanceMetrics.errors++;

    // Network failure - try cache with exponential backoff retry
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      performanceMetrics.cacheHits++;
      return cachedResponse;
    }

    // Implement retry logic for critical quantum requests
    if (isCriticalQuantumRequest(request)) {
      return handleQuantumRequestWithRetry(request, 3);
    }
  }

  // Return error response with helpful message
  return new Response(JSON.stringify({
    error: 'Quantum simulation unavailable',
    message: 'Unable to perform quantum computation. Please check your connection and try again.',
    offline: true,
    timestamp: Date.now()
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Check if request is critical (e.g., real-time simulation)
function isCriticalQuantumRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/api/simulate') ||
         url.searchParams.has('realtime') ||
         request.headers.get('priority') === 'high';
}

// Handle quantum requests with exponential backoff retry
async function handleQuantumRequestWithRetry(request, maxRetries, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Retry attempt ${attempt} for quantum request`);
      const response = await fetch(request);

      if (response.ok) {
        // Cache successful response
        const cache = await caches.open(QUANTUM_CACHE);
        await cache.put(request, response.clone());
        return response;
      }

      // Don't retry client errors
      if (response.status >= 400 && response.status < 500) {
        break;
      }
    } catch (error) {
      console.warn(`Quantum request retry ${attempt} failed:`, error);
    }

    // Wait before next retry with exponential backoff
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }

  // All retries failed, try cache one more time
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  return new Response(JSON.stringify({
    error: 'Quantum simulation failed after retries',
    message: 'Unable to perform quantum computation after multiple attempts.',
    offline: true,
    timestamp: Date.now()
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Handle API requests (Network-first)
async function handleAPINetworkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      await cache.put(request, networkResponse.clone());
      performanceMetrics.cacheMisses++;
      return networkResponse;
    }
  } catch (error) {
    console.warn('API network request failed:', error);
    performanceMetrics.errors++;
  }

  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    return cachedResponse;
  }

  return new Response(JSON.stringify({ error: 'API unavailable' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Handle stale-while-revalidate requests
async function handleStaleWhileRevalidate(request) {
  const cache = await caches.open(STALE_WHILE_REVALIDATE_CACHE);
  const cachedResponse = await cache.match(request);

  // Return cached version immediately if available
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch((error) => {
    console.warn('Stale-while-revalidate network request failed:', error);
    performanceMetrics.errors++;
    return cachedResponse; // Return cached if network fails
  });

  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    // Return cached, but update in background
    fetchPromise.then(() => {}).catch(() => {});
    return cachedResponse;
  }

  // No cache, wait for network
  performanceMetrics.cacheMisses++;
  return fetchPromise;
}

// Handle static assets (Cache-first)
async function handleStaticCacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, networkResponse.clone());
      performanceMetrics.cacheMisses++;
      return networkResponse;
    } else {
      console.warn('Static asset fetch failed with status:', networkResponse.status);
      performanceMetrics.errors++;
    }
  } catch (error) {
    console.warn('Static asset fetch failed:', error);
    performanceMetrics.errors++;

    // For network failures, try to serve degraded experience
    if (request.destination === 'document') {
      const fallbackResponse = await caches.match('/index.html');
      if (fallbackResponse) {
        console.log('Serving offline fallback for document');
        return fallbackResponse;
      }
    }

    // For images, serve a placeholder
    if (request.destination === 'image') {
      return serveImagePlaceholder();
    }

    // For stylesheets, serve minimal styles
    if (request.destination === 'style') {
      return serveMinimalStyles();
    }
  }

  return new Response('Resource not available', {
    status: 404,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Serve placeholder image for failed image requests
function serveImagePlaceholder() {
  const svg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#f3f4f6"/>
    <text x="50" y="50" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="sans-serif" font-size="12">Offline</text>
  </svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache'
    }
  });
}

// Serve minimal styles for failed stylesheet requests
function serveMinimalStyles() {
  const minimalCSS = `
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f9fafb; color: #374151; }
    .offline-notice { text-align: center; padding: 40px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; margin: 20px 0; }
    .offline-notice h2 { color: #92400e; margin: 0 0 10px 0; }
    .offline-notice p { margin: 0; color: #78350f; }
  `;

  return new Response(minimalCSS, {
    headers: {
      'Content-Type': 'text/css',
      'Cache-Control': 'no-cache'
    }
  });
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);

  if (event.tag === 'quantum-computation-sync') {
    event.waitUntil(doQuantumComputationSync());
  } else if (event.tag === 'circuit-save-sync') {
    event.waitUntil(doCircuitSaveSync());
  } else if (event.tag === 'tutorial-progress-sync') {
    event.waitUntil(doTutorialProgressSync());
  }
});

// Background sync for quantum computations
async function doQuantumComputationSync() {
  console.log('Service Worker: Processing quantum computation sync');

  try {
    // Get pending computations from IndexedDB or similar storage
    const pendingComputations = await getPendingQuantumComputations();

    for (const computation of pendingComputations) {
      try {
        const response = await fetch(computation.url, {
          method: computation.method || 'POST',
          headers: computation.headers || {},
          body: JSON.stringify(computation.data),
        });

        if (response.ok) {
          // Mark as completed and cache result
          await markComputationCompleted(computation.id);
          const result = await response.json();
          await cacheQuantumResult(computation.cacheKey, result);
        } else {
          console.warn('Quantum computation sync failed:', response.status);
        }
      } catch (error) {
        console.error('Quantum computation sync error:', error);
        // Could implement retry logic here
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Background sync for circuit saves
async function doCircuitSaveSync() {
  console.log('Service Worker: Processing circuit save sync');

  try {
    const pendingSaves = await getPendingCircuitSaves();

    for (const save of pendingSaves) {
      try {
        const response = await fetch('/api/circuits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(save.data),
        });

        if (response.ok) {
          await markCircuitSaveCompleted(save.id);
        }
      } catch (error) {
        console.error('Circuit save sync failed:', error);
      }
    }
  } catch (error) {
    console.error('Circuit save sync error:', error);
  }
}

// Background sync for tutorial progress
async function doTutorialProgressSync() {
  console.log('Service Worker: Processing tutorial progress sync');

  try {
    const pendingProgress = await getPendingTutorialProgress();

    for (const progress of pendingProgress) {
      try {
        const response = await fetch('/api/tutorial/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(progress.data),
        });

        if (response.ok) {
          await markTutorialProgressCompleted(progress.id);
        }
      } catch (error) {
        console.error('Tutorial progress sync failed:', error);
      }
    }
  } catch (error) {
    console.error('Tutorial progress sync error:', error);
  }
}

// Helper functions for background sync (would need IndexedDB implementation)
async function getPendingQuantumComputations() {
  // Placeholder - would retrieve from IndexedDB
  return [];
}

async function getPendingCircuitSaves() {
  // Placeholder - would retrieve from IndexedDB
  return [];
}

async function getPendingTutorialProgress() {
  // Placeholder - would retrieve from IndexedDB
  return [];
}

async function markComputationCompleted(id) {
  // Placeholder - would update IndexedDB
}

async function markCircuitSaveCompleted(id) {
  // Placeholder - would update IndexedDB
}

async function markTutorialProgressCompleted(id) {
  // Placeholder - would update IndexedDB
}

async function cacheQuantumResult(cacheKey, result) {
  const cache = await caches.open(QUANTUM_CACHE);
  const response = new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
  await cache.put(new Request(cacheKey), response);
}

// Cache management and cleanup functions
async function cleanupExpiredEntries() {
  const now = Date.now();
  const cachesToClean = [
    { name: DYNAMIC_CACHE, maxAge: CACHE_CONFIG.dynamic.maxAge },
    { name: API_CACHE, maxAge: CACHE_CONFIG.api.maxAge },
    { name: QUANTUM_CACHE, maxAge: CACHE_CONFIG.quantum.maxAge },
    { name: STALE_WHILE_REVALIDATE_CACHE, maxAge: CACHE_CONFIG.staleWhileRevalidate.maxAge },
  ];

  for (const cacheConfig of cachesToClean) {
    try {
      const cache = await caches.open(cacheConfig.name);
      const keys = await cache.keys();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const date = response.headers.get('date');
          if (date) {
            const responseTime = new Date(date).getTime();
            if (now - responseTime > cacheConfig.maxAge) {
              await cache.delete(request);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error cleaning cache ${cacheConfig.name}:`, error);
    }
  }

  performanceMetrics.lastCleanup = now;
  await setPerformanceMetrics(performanceMetrics);
}

async function enforceCacheLimits() {
  const cacheLimits = [
    { name: STATIC_CACHE, maxEntries: CACHE_CONFIG.static.maxEntries },
    { name: DYNAMIC_CACHE, maxEntries: CACHE_CONFIG.dynamic.maxEntries },
    { name: API_CACHE, maxEntries: CACHE_CONFIG.api.maxEntries },
    { name: QUANTUM_CACHE, maxEntries: CACHE_CONFIG.quantum.maxEntries },
    { name: STALE_WHILE_REVALIDATE_CACHE, maxEntries: CACHE_CONFIG.staleWhileRevalidate.maxEntries },
  ];

  for (const limit of cacheLimits) {
    try {
      const cache = await caches.open(limit.name);
      const keys = await cache.keys();

      if (keys.length > limit.maxEntries) {
        // Remove oldest entries (simple LRU approximation)
        const entriesToRemove = keys.length - limit.maxEntries;
        for (let i = 0; i < entriesToRemove; i++) {
          await cache.delete(keys[i]);
        }
      }
    } catch (error) {
      console.error(`Error enforcing cache limit for ${limit.name}:`, error);
    }
  }
}

// Performance metrics storage (using Cache API as simple storage)
async function getPerformanceMetrics() {
  try {
    const cache = await caches.open('bloch-verse-metrics');
    const response = await cache.match('metrics');
    if (response) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error getting performance metrics:', error);
  }
  return null;
}

async function setPerformanceMetrics(metrics) {
  try {
    const cache = await caches.open('bloch-verse-metrics');
    const response = new Response(JSON.stringify(metrics), {
      headers: { 'Content-Type': 'application/json' },
    });
    await cache.put('metrics', response);
  } catch (error) {
    console.error('Error setting performance metrics:', error);
  }
}

// Manual cache refresh endpoint
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_REFRESH') {
    handleCacheRefresh(event.data.cacheType).then(() => {
      event.ports[0].postMessage({ success: true });
    }).catch((error) => {
      event.ports[0].postMessage({ success: false, error: error.message });
    });
  } else if (event.data && event.data.type === 'GET_METRICS') {
    getPerformanceMetrics().then((metrics) => {
      event.ports[0].postMessage({ metrics });
    });
  }
});

async function handleCacheRefresh(cacheType) {
  try {
    const cacheNames = {
      static: STATIC_CACHE,
      dynamic: DYNAMIC_CACHE,
      api: API_CACHE,
      quantum: QUANTUM_CACHE,
      stale: STALE_WHILE_REVALIDATE_CACHE,
      all: null,
    };

    if (cacheType === 'all') {
      const allCaches = await caches.keys();
      await Promise.all(allCaches.map(name => caches.delete(name)));
      console.log('Service Worker: All caches cleared');

      // Reinitialize caches with static assets
      await initializeStaticCache();
    } else {
      const cacheName = cacheNames[cacheType];
      if (cacheName) {
        await caches.delete(cacheName);
        console.log(`Service Worker: Cache ${cacheType} cleared`);

        // Reinitialize static cache if cleared
        if (cacheType === 'static') {
          await initializeStaticCache();
        }
      }
    }

    // Reset performance metrics after cache refresh
    performanceMetrics.cacheHits = 0;
    performanceMetrics.cacheMisses = 0;
    performanceMetrics.errors = 0;
    await setPerformanceMetrics(performanceMetrics);

  } catch (error) {
    console.error('Error during cache refresh:', error);
    throw new Error(`Cache refresh failed: ${error.message}`);
  }
}

// Initialize static cache with essential assets
async function initializeStaticCache() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(STATIC_ASSETS);
    console.log('Service Worker: Static cache reinitialized');
  } catch (error) {
    console.error('Failed to reinitialize static cache:', error);
  }
}

// Handle service worker errors gracefully
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
  performanceMetrics.errors++;
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
  performanceMetrics.errors++;
  event.preventDefault(); // Prevent the default handler
});

// Periodic health check
setInterval(async () => {
  try {
    // Verify cache integrity
    const cacheNames = await caches.keys();
    const expectedCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, QUANTUM_CACHE, STALE_WHILE_REVALIDATE_CACHE];

    for (const expectedCache of expectedCaches) {
      if (!cacheNames.includes(expectedCache)) {
        console.warn(`Cache ${expectedCache} is missing, reinitializing...`);
        if (expectedCache === STATIC_CACHE) {
          await initializeStaticCache();
        } else {
          await caches.open(expectedCache);
        }
      }
    }

    // Clean up any orphaned caches
    const orphanedCaches = cacheNames.filter(name =>
      name.startsWith('bloch-verse') &&
      !expectedCaches.includes(name) &&
      !name.includes('metrics')
    );

    if (orphanedCaches.length > 0) {
      console.log('Cleaning up orphaned caches:', orphanedCaches);
      await Promise.all(orphanedCaches.map(name => caches.delete(name)));
    }

  } catch (error) {
    console.error('Health check failed:', error);
  }
}, 5 * 60 * 1000); // Every 5 minutes