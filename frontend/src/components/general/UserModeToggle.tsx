// Beginner/Advanced mode toggle with progressive disclosure
// Adapts UI complexity based on user expertise level

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Zap, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';

interface UserModeToggleProps {
  onModeChange: (mode: 'beginner' | 'advanced') => void;
  currentMode: 'beginner' | 'advanced';
  className?: string;
}

export const UserModeToggle: React.FC<UserModeToggleProps> = ({
  onModeChange,
  currentMode,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { announceToScreenReader } = useAccessibility();

  const modes = [
    {
      id: 'beginner' as const,
      label: 'Beginner Mode',
      icon: GraduationCap,
      description: 'Simplified interface with guided tutorials and explanations',
      features: [
        'Step-by-step tutorials',
        'Simplified controls',
        'Educational tooltips',
        'Basic quantum concepts',
        'Guided circuit building'
      ],
      color: 'bg-green-500'
    },
    {
      id: 'advanced' as const,
      icon: Zap,
      label: 'Advanced Mode',
      description: 'Full-featured interface for quantum researchers and experts',
      features: [
        'Complex circuit operations',
        'Advanced analytics',
        'Research tools',
        'Performance metrics',
        'Custom quantum algorithms'
      ],
      color: 'bg-purple-500'
    }
  ];

  const handleModeChange = (mode: 'beginner' | 'advanced') => {
    onModeChange(mode);
    announceToScreenReader(`Switched to ${mode} mode`);
    setIsExpanded(false);
  };

  const currentModeData = modes.find(m => m.id === currentMode);

  return (
    <div className={`relative ${className}`}>
      <Card className="border-border/50 bg-card/90 backdrop-blur-sm">
        <CardContent className="p-4">
          {/* Current Mode Display */}
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            className="w-full justify-between p-0 h-auto"
            aria-expanded={isExpanded}
            aria-label={`Current mode: ${currentMode}. Click to change mode.`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentModeData?.color || 'bg-gray-500'}`}>
                {currentModeData && <currentModeData.icon className="w-4 h-4 text-white" />}
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">{currentModeData?.label}</div>
                <div className="text-xs text-muted-foreground">
                  {currentModeData?.description}
                </div>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>

          {/* Expanded Mode Selection */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-3">
                  {modes.map((mode) => (
                    <motion.div
                      key={mode.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: mode.id === 'beginner' ? 0.1 : 0.2 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          currentMode === mode.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border/50 hover:border-primary/50'
                        }`}
                        onClick={() => handleModeChange(mode.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${mode.color}`}>
                              <mode.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-sm">{mode.label}</h3>
                                {currentMode === mode.id && (
                                  <Badge variant="secondary" className="text-xs px-2 py-0">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">
                                {mode.description}
                              </p>
                              <div className="space-y-1">
                                <div className="text-xs font-medium text-foreground">Features:</div>
                                <ul className="text-xs text-muted-foreground space-y-0.5">
                                  {mode.features.slice(0, 3).map((feature, index) => (
                                    <li key={index} className="flex items-center gap-1">
                                      <div className="w-1 h-1 bg-primary rounded-full flex-shrink-0" />
                                      {feature}
                                    </li>
                                  ))}
                                  {mode.features.length > 3 && (
                                    <li className="text-muted-foreground">
                                      +{mode.features.length - 3} more features
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}

                  {/* Mode Comparison */}
                  <div className="pt-2 border-t border-border/50">
                    <div className="text-xs text-muted-foreground text-center">
                      <Settings className="w-3 h-3 inline mr-1" />
                      Mode settings are saved automatically
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

// Hook for managing user mode preferences
export const useUserMode = () => {
  const [userMode, setUserMode] = useState<'beginner' | 'advanced'>(() => {
    // Load from localStorage or default to beginner
    const saved = localStorage.getItem('bloch-verse-user-mode');
    return (saved as 'beginner' | 'advanced') || 'beginner';
  });

  useEffect(() => {
    localStorage.setItem('bloch-verse-user-mode', userMode);
  }, [userMode]);

  const toggleMode = () => {
    setUserMode(prev => prev === 'beginner' ? 'advanced' : 'beginner');
  };

  return {
    userMode,
    setUserMode,
    toggleMode,
    isBeginner: userMode === 'beginner',
    isAdvanced: userMode === 'advanced'
  };
};

export default UserModeToggle;