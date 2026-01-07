import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  content: ReactNode;
  action?: 'click' | 'type' | 'scroll' | 'wait';
  actionTarget?: string; // Optional specific element for action
  waitTime?: number; // Time to wait before proceeding (in ms)
  canSkip?: boolean;
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
  targetAudience: 'new-users' | 'returning-users' | 'advanced-users';
  estimatedTime: number; // in minutes
}

interface TourContextType {
  currentTour: Tour | null;
  currentStepIndex: number;
  isActive: boolean;
  completedTours: Set<string>;
  startTour: (tour: Tour) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  endTour: () => void;
  goToStep: (stepIndex: number) => void;
  markTourCompleted: (tourId: string) => void;
  isTourCompleted: (tourId: string) => boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [currentTour, setCurrentTour] = useState<Tour | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completedTours, setCompletedTours] = useState<Set<string>>(new Set());

  // Load completed tours from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('completed-tours');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedTours(new Set(parsed));
      } catch (error) {
        console.error('Failed to parse completed tours:', error);
      }
    }
  }, []);

  // Save completed tours to localStorage
  useEffect(() => {
    localStorage.setItem('completed-tours', JSON.stringify([...completedTours]));
  }, [completedTours]);

  const startTour = (tour: Tour) => {
    setCurrentTour(tour);
    setCurrentStepIndex(0);
    setIsActive(true);
  };

  const nextStep = () => {
    if (!currentTour) return;

    if (currentStepIndex < currentTour.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      endTour();
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const skipTour = () => {
    setIsActive(false);
    setCurrentTour(null);
    setCurrentStepIndex(0);
  };

  const endTour = () => {
    if (currentTour) {
      markTourCompleted(currentTour.id);
    }
    setIsActive(false);
    setCurrentTour(null);
    setCurrentStepIndex(0);
  };

  const goToStep = (stepIndex: number) => {
    if (currentTour && stepIndex >= 0 && stepIndex < currentTour.steps.length) {
      setCurrentStepIndex(stepIndex);
    }
  };

  const markTourCompleted = (tourId: string) => {
    setCompletedTours(prev => new Set([...prev, tourId]));
  };

  const isTourCompleted = (tourId: string) => {
    return completedTours.has(tourId);
  };

  const value: TourContextType = {
    currentTour,
    currentStepIndex,
    isActive,
    completedTours,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    endTour,
    goToStep,
    markTourCompleted,
    isTourCompleted,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
};