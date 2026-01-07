// Interactive onboarding tutorial system with step-by-step guidance
// Progressive disclosure of features based on user expertise

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle,
  Lightbulb,
  Target,
  BookOpen,
  Zap,
  SkipForward
} from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  targetElement?: string; // CSS selector for highlighting
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  interactive?: boolean;
  actionRequired?: string;
  prerequisites?: string[];
}

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (tutorialId: string) => void;
  tutorialId: string;
  userMode: 'beginner' | 'advanced';
}

const TUTORIALS = {
  beginner: {
    id: 'beginner-basics',
    title: 'Quantum Computing Basics',
    description: 'Learn the fundamentals of quantum computing with interactive examples',
    estimatedTime: '15 minutes',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Quantum State Visualizer!',
        description: 'Your journey into quantum computing starts here',
        content: (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🌌</div>
              <h3 className="text-xl font-bold mb-2">Welcome to Quantum Computing!</h3>
              <p className="text-muted-foreground">
                Quantum State Visualizer is your interactive guide to understanding quantum mechanics through visualization.
                We'll start with the basics and build up to complex quantum circuits.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                What you'll learn:
              </h4>
              <ul className="space-y-1 text-sm">
                <li>• Quantum bits (qubits) and their states</li>
                <li>• Bloch sphere visualization</li>
                <li>• Basic quantum gates</li>
                <li>• Building simple quantum circuits</li>
              </ul>
            </div>
          </div>
        ),
        position: 'center' as const
      },
      {
        id: 'bloch-sphere-intro',
        title: 'The Bloch Sphere',
        description: 'Understanding quantum states visually',
        content: (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">⚛️</div>
              <h3 className="text-lg font-bold">The Bloch Sphere</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Every qubit can be represented as a point on the surface of a sphere.
              This 3D visualization makes quantum states intuitive to understand.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                <div className="font-semibold text-blue-600 mb-1">North Pole (|0⟩)</div>
                <div>Represents the |0⟩ state</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                <div className="font-semibold text-red-600 mb-1">South Pole (|1⟩)</div>
                <div>Represents the |1⟩ state</div>
              </div>
            </div>
          </div>
        ),
        targetElement: '[data-tutorial="bloch-sphere"]',
        position: 'right' as const
      },
      {
        id: 'first-gate',
        title: 'Your First Quantum Gate',
        description: 'Applying the Hadamard gate',
        content: (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">🔄</div>
              <h3 className="text-lg font-bold">The Hadamard Gate</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              The Hadamard gate (H) creates superposition - it takes a qubit from |0⟩ and puts it into an equal mixture of |0⟩ and |1⟩.
            </p>
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded p-4">
              <div className="font-mono text-center mb-2">H|0⟩ = (|0⟩ + |1⟩)/√2</div>
              <div className="text-sm text-center text-muted-foreground">
                This creates a superposition state on the X-axis of the Bloch sphere
              </div>
            </div>
          </div>
        ),
        targetElement: '[data-tutorial="gate-hadamard"]',
        position: 'top' as const,
        interactive: true,
        actionRequired: 'Click the Hadamard gate to apply it'
      },
      {
        id: 'circuit-building',
        title: 'Building Circuits',
        description: 'Combining gates to create quantum algorithms',
        content: (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">🔗</div>
              <h3 className="text-lg font-bold">Circuit Building</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Quantum circuits are sequences of gates applied to qubits.
              Drag gates from the palette onto the circuit canvas to build your quantum algorithm.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Start with initial qubit states</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Apply quantum gates in sequence</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Observe how states evolve</span>
              </div>
            </div>
          </div>
        ),
        targetElement: '[data-tutorial="circuit-canvas"]',
        position: 'left' as const
      },
      {
        id: 'simulation',
        title: 'Running Simulations',
        description: 'Execute your quantum circuit and see the results',
        content: (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">▶️</div>
              <h3 className="text-lg font-bold">Circuit Simulation</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Click the "Run Simulation" button to execute your quantum circuit.
              Watch as the Bloch sphere updates to show the final quantum state.
            </p>
            <div className="bg-green-500/10 border border-green-500/20 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <Play className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-600">Pro Tip</span>
              </div>
              <p className="text-sm">
                Try different gate combinations and observe how they transform quantum states!
              </p>
            </div>
          </div>
        ),
        targetElement: '[data-tutorial="simulate-button"]',
        position: 'bottom' as const,
        interactive: true,
        actionRequired: 'Click "Run Simulation" to execute your circuit'
      }
    ] as TutorialStep[]
  },
  advanced: {
    id: 'advanced-deep-dive',
    title: 'Advanced Quantum Techniques',
    description: 'Master complex quantum algorithms and analysis tools',
    estimatedTime: '25 minutes',
    steps: [
      {
        id: 'entanglement-intro',
        title: 'Quantum Entanglement',
        description: 'Understanding correlated quantum systems',
        content: (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🔗</div>
              <h3 className="text-xl font-bold">Quantum Entanglement</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Entanglement creates correlations between qubits that cannot be explained by classical physics.
              Measuring one entangled qubit instantly determines the state of its partner.
            </p>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded p-4">
              <div className="font-mono text-center mb-2">|Φ⁺⟩ = (|00⟩ + |11⟩)/√2</div>
              <div className="text-sm text-center text-muted-foreground">
                Bell state demonstrating perfect correlation
              </div>
            </div>
          </div>
        ),
        position: 'center' as const
      }
    ] as TutorialStep[]
  }
};

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  isOpen,
  onClose,
  onComplete,
  tutorialId,
  userMode
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const { announceToScreenReader } = useAccessibility();

  const tutorial = TUTORIALS[userMode];
  const steps = tutorial?.steps || [];
  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (isOpen && currentStepData) {
      announceToScreenReader(`Tutorial step: ${currentStepData.title}. ${currentStepData.description}`);
    }
  }, [isOpen, currentStep, currentStepData, announceToScreenReader]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
    } else {
      // Tutorial completed
      onComplete(tutorialId);
      onClose();
    }
  }, [currentStep, steps.length, tutorialId, onComplete, onClose]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    onComplete(tutorialId);
    onClose();
  }, [tutorialId, onComplete, onClose]);

  if (!isOpen || !tutorial) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-2xl"
        >
          <Card className="border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
            {/* Header */}
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                  aria-label="Close tutorial"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Step {currentStep + 1} of {steps.length}</span>
                  <span>{tutorial.estimatedTime}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardHeader>

            {/* Content */}
            <CardContent className="min-h-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStepData?.content}
                </motion.div>
              </AnimatePresence>
            </CardContent>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 pt-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkip}
                  className="flex items-center gap-2"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip Tutorial
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Complete
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook for managing tutorial state
export const useTutorial = () => {
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('bloch-verse-completed-tutorials');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [currentTutorial, setCurrentTutorial] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('bloch-verse-completed-tutorials', JSON.stringify([...completedTutorials]));
  }, [completedTutorials]);

  const startTutorial = (tutorialId: string) => {
    setCurrentTutorial(tutorialId);
  };

  const completeTutorial = (tutorialId: string) => {
    setCompletedTutorials(prev => new Set([...prev, tutorialId]));
    setCurrentTutorial(null);
  };

  const isTutorialCompleted = (tutorialId: string) => {
    return completedTutorials.has(tutorialId);
  };

  return {
    completedTutorials,
    currentTutorial,
    startTutorial,
    completeTutorial,
    isTutorialCompleted
  };
};

export default OnboardingTutorial;