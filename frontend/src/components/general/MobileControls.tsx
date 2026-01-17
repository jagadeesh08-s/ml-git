// Mobile-optimized touch controls for 3D Bloch sphere manipulation
// Provides intuitive gesture-based interaction for mobile devices

import React, { useRef, useState, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { RotateCcw, ZoomIn, ZoomOut, Move3D, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface MobileControlsProps {
  onRotate: (deltaX: number, deltaY: number) => void;
  onZoom: (delta: number) => void;
  onPan: (deltaX: number, deltaY: number) => void;
  onReset: () => void;
  className?: string;
}

interface TouchState {
  isDragging: boolean;
  lastTouchX: number;
  lastTouchY: number;
  touchCount: number;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onRotate,
  onZoom,
  onPan,
  onReset,
  className = ''
}) => {
  const [touchState, setTouchState] = useState<TouchState>({
    isDragging: false,
    lastTouchX: 0,
    lastTouchY: 0,
    touchCount: 0
  });

  const [controlMode, setControlMode] = useState<'rotate' | 'pan' | 'zoom'>('rotate');
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touches = e.touches;

    setTouchState(prev => ({
      ...prev,
      isDragging: true,
      lastTouchX: touches[0].clientX,
      lastTouchY: touches[0].clientY,
      touchCount: touches.length
    }));
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchState.isDragging) return;

    const touches = e.touches;
    const currentX = touches[0].clientX;
    const currentY = touches[0].clientY;

    const deltaX = currentX - touchState.lastTouchX;
    const deltaY = currentY - touchState.lastTouchY;

    // Handle different touch gestures
    if (touches.length === 1) {
      // Single touch - rotate or pan based on mode
      if (controlMode === 'rotate') {
        onRotate(deltaX * 0.01, deltaY * 0.01);
      } else if (controlMode === 'pan') {
        onPan(deltaX * 0.005, deltaY * 0.005);
      }
    } else if (touches.length === 2) {
      // Two finger pinch - zoom
      const touch1 = touches[0];
      const touch2 = touches[1];
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      // Store initial distance for comparison
      if (!containerRef.current?.dataset.initialDistance) {
        containerRef.current!.dataset.initialDistance = currentDistance.toString();
        return;
      }

      const initialDistance = parseFloat(containerRef.current!.dataset.initialDistance);
      const deltaDistance = currentDistance - initialDistance;

      onZoom(deltaDistance * 0.01);
      containerRef.current!.dataset.initialDistance = currentDistance.toString();
    }

    setTouchState(prev => ({
      ...prev,
      lastTouchX: currentX,
      lastTouchY: currentY,
      touchCount: touches.length
    }));
  }, [touchState, controlMode, onRotate, onPan, onZoom]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setTouchState(prev => ({
      ...prev,
      isDragging: false,
      touchCount: 0
    }));

    // Clear initial distance
    if (containerRef.current) {
      delete containerRef.current.dataset.initialDistance;
    }
  }, []);

  // Control mode buttons
  const controlModes = [
    { id: 'rotate' as const, icon: Move3D, label: 'Rotate' },
    { id: 'pan' as const, icon: Hand, label: 'Pan' },
    { id: 'zoom' as const, icon: ZoomIn, label: 'Zoom' }
  ];

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}>
      <Card className="bg-card/90 backdrop-blur-md border-border/50 shadow-lg">
        <CardContent className="p-4">
          {/* Touch gesture hints */}
          <div className="mb-4 text-center">
            <div className="text-sm font-medium text-foreground mb-2">
              Touch Controls
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Single finger: {controlMode === 'rotate' ? 'Rotate sphere' : 'Pan view'}</div>
              <div>• Two fingers: Pinch to zoom</div>
              <div>• Double tap: Reset view</div>
            </div>
          </div>

          {/* Control mode selector */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {controlModes.map(({ id, icon: Icon, label }) => (
              <Button
                key={id}
                variant={controlMode === id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setControlMode(id)}
                className="flex items-center gap-2 px-3 py-2"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>

          {/* Quick action buttons */}
          <div className="flex items-center justify-center gap-3">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-xs">Reset</span>
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onZoom(0.5)}
                className="flex items-center gap-2 px-4 py-2"
              >
                <ZoomIn className="w-4 h-4" />
                <span className="text-xs">+</span>
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onZoom(-0.5)}
                className="flex items-center gap-2 px-4 py-2"
              >
                <ZoomOut className="w-4 h-4" />
                <span className="text-xs">-</span>
              </Button>
            </motion.div>
          </div>

          {/* Touch area overlay */}
          <div
            ref={containerRef}
            className="absolute inset-0 -z-10"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            style={{ touchAction: 'none' }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileControls;