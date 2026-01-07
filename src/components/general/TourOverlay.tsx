import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, SkipForward, Sparkles, Target, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useTour, TourStep } from '@/contexts/TourContext';

interface TourOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const TourOverlay: React.FC<TourOverlayProps> = ({ isVisible, onClose }) => {
  const { currentTour, currentStepIndex, nextStep, previousStep, skipTour } = useTour();
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStep = currentTour?.steps[currentStepIndex];

  // Find and track the target element
  useEffect(() => {
    if (!currentStep?.target || !isVisible) {
      setTargetElement(null);
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const element = document.querySelector(currentStep.target);
      if (element) {
        setTargetElement(element);
        setTargetRect(element.getBoundingClientRect());
        return true;
      }
      return false;
    };

    // Try to find immediately
    if (!findTarget()) {
      // If not found, try a few more times with increasing delay
      let attempts = 0;
      const maxAttempts = 50;

      const retryFind = () => {
        attempts++;
        if (attempts >= maxAttempts) {
          console.warn(`Tour target element not found after ${maxAttempts} attempts: ${currentStep.target}`);
          // Fallback to center of screen
          setTargetElement(null);
          setTargetRect({
            top: window.innerHeight / 2 - 50,
            left: window.innerWidth / 2 - 150,
            width: 300,
            height: 100,
            bottom: window.innerHeight / 2 + 50,
            right: window.innerWidth / 2 + 150,
            x: window.innerWidth / 2 - 150,
            y: window.innerHeight / 2 - 50,
            toJSON: () => ({})
          });
          return;
        }

        setTimeout(() => {
          if (!findTarget()) {
            retryFind();
          }
        }, 200); // Wait 200ms between attempts
      };

      retryFind();
    }

    // Update position on scroll or resize
    const updatePosition = () => {
      if (targetElement) {
        setTargetRect(targetElement.getBoundingClientRect());
      }
    };

    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [currentStep?.target, isVisible]);

  // Handle step actions
  useEffect(() => {
    if (!currentStep || !targetElement) return;

    if (currentStep.action === 'click' && currentStep.actionTarget) {
      const actionElement = document.querySelector(currentStep.actionTarget);
      if (actionElement) {
        const handleClick = (e: Event) => {
          // Prevent default if needed and advance tour
          setTimeout(() => nextStep(), currentStep.waitTime || 500);
        };
        actionElement.addEventListener('click', handleClick);
        return () => actionElement.removeEventListener('click', handleClick);
      }
    } else if (currentStep.action === 'wait' && currentStep.waitTime) {
      const timer = setTimeout(() => nextStep(), currentStep.waitTime);
      return () => clearTimeout(timer);
    }
  }, [currentStep, targetElement, nextStep]);

  if (!isVisible || !currentTour || !currentStep) {
    return null;
  }

  // Show tour even if target element not found yet - use fallback position
  const rectToUse = targetRect || {
    top: window.innerHeight / 2 - 50,
    left: window.innerWidth / 2 - 150,
    width: 300,
    height: 100,
    bottom: window.innerHeight / 2 + 50,
    right: window.innerWidth / 2 + 150,
    x: window.innerWidth / 2 - 150,
    y: window.innerHeight / 2 - 50,
    toJSON: () => ({})
  };

  const progress = ((currentStepIndex + 1) / currentTour.steps.length) * 100;

  // Calculate tooltip position
  const getTooltipPosition = () => {
    const padding = 16;
    const tooltipWidth = 360;
    const tooltipHeight = 200;

    let top = rectToUse.top - tooltipHeight - padding;
    let left = rectToUse.left + (rectToUse.width / 2) - (tooltipWidth / 2);

    // Adjust if tooltip would go off screen
    if (top < padding) {
      top = rectToUse.bottom + padding;
    }
    if (left < padding) {
      left = padding;
    }
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }

    return { top, left };
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed inset-0 z-50 pointer-events-none"
      >
        {/* Clear transparent backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-transparent"
        />

        {/* Clear highlight with subtle shadow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: [0.8, 1.05, 1],
            transition: { duration: 0.6, ease: "easeOut" }
          }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle ${Math.max(rectToUse.width, rectToUse.height) + 40}px at ${rectToUse.left + rectToUse.width / 2}px ${rectToUse.top + rectToUse.height / 2}px, transparent 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.6) 100%)`
          }}
        />

        {/* Clean highlighted element border */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: [0.8, 1.05, 1],
            transition: { duration: 0.4, ease: "easeOut" }
          }}
          className="absolute border-3 border-primary rounded-lg shadow-lg"
          style={{
            top: rectToUse.top - 8,
            left: rectToUse.left - 8,
            width: rectToUse.width + 16,
            height: rectToUse.height + 16,
          }}
        />


        {/* Enhanced Tooltip with beautiful design */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.4, ease: "easeOut" }
          }}
          exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
          className="absolute pointer-events-auto z-10"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: 360,
          }}
        >
          <Card className="bg-card/95 backdrop-blur-xl border-2 border-primary/30 shadow-xl rounded-2xl overflow-hidden">
            {/* Decorative top border */}
            <div className="h-1 bg-gradient-to-r from-primary via-accent to-secondary" />

            <CardContent className="p-6 space-y-5">
              {/* Enhanced Header with icon */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {currentStep.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                        Step {currentStepIndex + 1} of {currentTour.steps.length}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Sparkles className="w-3 h-3" />
                        Interactive Guide
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-muted/80 rounded-lg transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Enhanced Progress bar with animation */}
              <div className="space-y-3">
                <div className="relative">
                  <Progress
                    value={progress}
                    className="h-3 bg-muted/50"
                  />
                  <motion.div
                    className="absolute top-0 left-0 h-3 bg-gradient-to-r from-primary to-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">
                    {Math.round(progress)}% complete
                  </span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{currentTour.estimatedTime} min estimated</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Content with better typography */}
              <div className="space-y-4">
                <div className="text-sm leading-relaxed text-foreground/90 font-medium">
                  {currentStep.description}
                </div>
                {currentStep.content && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 border border-muted/20"
                  >
                    {currentStep.content}
                  </motion.div>
                )}
              </div>

              {/* Enhanced Action hint with icon */}
              {currentStep.action && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20 flex items-center gap-3"
                >
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Target className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-primary/90 font-medium">
                    {currentStep.action === 'click' && 'Click on the highlighted element to continue'}
                    {currentStep.action === 'type' && 'Type in the highlighted field to continue'}
                    {currentStep.action === 'scroll' && 'Scroll to see more content'}
                    {currentStep.action === 'wait' && 'Please wait...'}
                  </span>
                </motion.div>
              )}

              {/* Enhanced Navigation with better styling */}
              <div className="flex items-center justify-between pt-3 border-t border-muted/20">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={previousStep}
                    disabled={currentStepIndex === 0}
                    className="pointer-events-auto border-muted/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 rounded-lg"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  {currentStep.canSkip !== false && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={skipTour}
                      className="pointer-events-auto text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200"
                    >
                      <SkipForward className="h-4 w-4 mr-1" />
                      Skip Tour
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="pointer-events-auto border-muted/40 hover:border-red-500/40 hover:bg-red-500/5 text-muted-foreground hover:text-red-600 transition-all duration-200 rounded-lg"
                  >
                    Close Tour
                  </Button>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={nextStep}
                      size="sm"
                      className="pointer-events-auto bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-4"
                    >
                      {currentStepIndex === currentTour.steps.length - 1 ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Complete Tour</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>Next</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TourOverlay;