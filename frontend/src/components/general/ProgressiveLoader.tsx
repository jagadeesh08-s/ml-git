// Progressive loading component with code splitting and lazy loading
// Implements virtual scrolling and progressive enhancement

import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Lazy load heavy components
const BlochSphere3D = lazy(() => import('@/components/core/BlochSphere'));
const CircuitBuilder = lazy(() => import('@/components/core/CircuitBuilder'));
const CodeEditor = lazy(() => import('@/components/tools/CodeEditor'));
const AdvancedVisualization = lazy(() => import('@/components/advanced/AdvancedVisualization'));
const QuantumAnalytics = lazy(() => import('@/components/advanced/QuantumAnalytics'));

interface ProgressiveLoaderProps {
  component: string;
  props?: any;
  fallback?: React.ReactNode;
  priority?: 'low' | 'medium' | 'high';
  className?: string;
}

interface LoadingState {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  progress: number;
  error: string | null;
}

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  component,
  props = {},
  fallback,
  priority = 'medium',
  className = ''
}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    status: 'idle',
    progress: 0,
    error: null
  });

  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);

  // Component mapping
  const componentMap: { [key: string]: React.ComponentType<any> } = {
    BlochSphere3D,
    CircuitBuilder,
    CodeEditor,
    AdvancedVisualization,
    QuantumAnalytics
  };

  // Loading priorities determine when to start loading
  const priorityDelays = {
    high: 0,
    medium: 100,
    low: 500
  };

  useEffect(() => {
    if (!componentMap[component]) {
      setLoadingState({
        status: 'error',
        progress: 0,
        error: `Component "${component}" not found`
      });
      return;
    }

    // Delay loading based on priority
    const delay = priorityDelays[priority];
    const timeoutId = setTimeout(() => {
      setLoadingState(prev => ({ ...prev, status: 'loading', progress: 10 }));

      // Simulate progressive loading
      const progressInterval = setInterval(() => {
        setLoadingState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 20, 90)
        }));
      }, 100);

      // Load component (already lazy loaded, just set it)
      setComponent(() => componentMap[component]);
      clearInterval(progressInterval);
      setLoadingState({
        status: 'loaded',
        progress: 100,
        error: null
      });
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [component, priority]);

  // Default fallback
  const defaultFallback = (
    <Card className={`border-border/50 bg-card/50 backdrop-blur-sm ${className}`}>
      <CardContent className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-8 h-8 text-primary mx-auto" />
          </motion.div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">
              Loading {component.replace(/([A-Z])/g, ' $1').toLowerCase()}...
            </div>
            <Progress value={loadingState.progress} className="w-32 mx-auto" />
            <div className="text-xs text-muted-foreground">
              {loadingState.progress.toFixed(0)}% complete
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Error state
  if (loadingState.status === 'error') {
    return (
      <Card className={`border-destructive/50 bg-destructive/5 ${className}`}>
        <CardContent className="flex items-center justify-center p-8">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Failed to load component</div>
                <div className="text-sm text-muted-foreground">
                  {loadingState.error}
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-primary hover:underline"
                >
                  Reload page
                </button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loadingState.status === 'loading' || !Component) {
    return fallback || defaultFallback;
  }

  // Success state
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        <Suspense fallback={fallback || defaultFallback}>
          <Component {...props} />
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

// Virtual scrolling component for large lists
interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = ''
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Progressive enhancement hook
export const useProgressiveEnhancement = () => {
  const [capabilities, setCapabilities] = useState({
    webgl: false,
    webWorkers: false,
    webgl2: false,
    offscreenCanvas: false,
    sharedArrayBuffer: false
  });

  useEffect(() => {
    // Detect browser capabilities
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const gl2 = canvas.getContext('webgl2');

    setCapabilities({
      webgl: !!gl,
      webWorkers: typeof Worker !== 'undefined',
      webgl2: !!gl2,
      offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined'
    });
  }, []);

  return capabilities;
};

export default ProgressiveLoader;