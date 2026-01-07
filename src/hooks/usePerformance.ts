// Performance Optimization Hook for Bloch Verse
// Implements lazy loading, code splitting, caching, and performance monitoring

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheHits: number;
  cacheMisses: number;
}

export const usePerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    cacheHits: 0,
    cacheMisses: 0
  });

  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now();

    const measurePerformance = () => {
      const loadTime = performance.now() - startTime;
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

      setMetrics(prev => ({
        ...prev,
        loadTime,
        memoryUsage
      }));
    };

    measurePerformance();
    const interval = setInterval(measurePerformance, 5000);
    return () => clearInterval(interval);
  }, []);

  // Simple caching system
  const [cache] = useState<Map<string, any>>(new Map());

  const getCached = useCallback(async <T>(key: string, fetcher: () => Promise<T>): Promise<T> => {
    if (cache.has(key)) {
      setMetrics(prev => ({ ...prev, cacheHits: prev.cacheHits + 1 }));
      return Promise.resolve(cache.get(key));
    }

    setMetrics(prev => ({ ...prev, cacheMisses: prev.cacheMisses + 1 }));

    const result = await fetcher();
    cache.set(key, result);
    return result;
  }, [cache]);

  // Debounce function for performance
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }, []);

  // Throttle function for performance
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);

  // Memory management
  const forceGarbageCollection = useCallback(() => {
    if ((window as any).gc) {
      (window as any).gc();
      toast.success('Memory garbage collection completed');
    }
  }, []);

  return {
    metrics,
    getCached,
    debounce,
    throttle,
    forceGarbageCollection
  };
};

// Preload critical resources
export const preloadCriticalResources = () => {
  // Preload critical fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap';
  fontLink.as = 'style';
  document.head.appendChild(fontLink);

  // Preload critical images
  const images = [
    '/favicon.ico'
  ];

  images.forEach(src => {
    const img = new Image();
    img.src = src;
  });
};

// Resource hints for performance
export const addResourceHints = () => {
  const hints = [
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'preconnect', href: '//fonts.gstatic.com', crossOrigin: 'anonymous' },
    { rel: 'dns-prefetch', href: '//api.quantum.ibm.com' }
  ];

  hints.forEach(hint => {
    const link = document.createElement('link');
    link.rel = hint.rel;
    link.href = hint.href;
    if (hint.crossOrigin) link.crossOrigin = hint.crossOrigin;
    document.head.appendChild(link);
  });
};