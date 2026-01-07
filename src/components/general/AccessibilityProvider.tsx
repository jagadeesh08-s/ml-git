// Enhanced Accessibility Provider for Bloch Verse
// Provides comprehensive accessibility features across all components

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AccessibilityContextType {
  // Screen reader settings
  screenReaderEnabled: boolean;
  setScreenReaderEnabled: (enabled: boolean) => void;

  // High contrast mode
  highContrastMode: boolean;
  setHighContrastMode: (enabled: boolean) => void;

  // Reduced motion
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;

  // Font size scaling
  fontScale: number;
  setFontScale: (scale: number) => void;

  // Keyboard navigation
  keyboardNavigation: boolean;
  setKeyboardNavigation: (enabled: boolean) => void;

  // Focus management
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  setFocusToElement: (elementId: string) => void;

  // Skip links
  skipLinks: Array<{ id: string; label: string; href: string }>;
  addSkipLink: (id: string, label: string, href: string) => void;
  removeSkipLink: (id: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  // State management
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);
  const [skipLinks, setSkipLinks] = useState<Array<{ id: string; label: string; href: string }>>([]);

  // Screen reader announcement system
  const [announcements, setAnnouncements] = useState<Array<{ message: string; priority: 'polite' | 'assertive' }>>([]);

  // Initialize accessibility settings from user preferences
  useEffect(() => {
    // Check for system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    setReducedMotion(prefersReducedMotion);
    setHighContrastMode(prefersHighContrast);

    // Load saved preferences
    const savedSettings = localStorage.getItem('bloch-verse-accessibility');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setScreenReaderEnabled(settings.screenReaderEnabled || false);
        setHighContrastMode(settings.highContrastMode || prefersHighContrast);
        setReducedMotion(settings.reducedMotion || prefersReducedMotion);
        setFontScale(settings.fontScale || 1);
        setKeyboardNavigation(settings.keyboardNavigation || false);
      } catch (error) {
        console.warn('Failed to load accessibility settings:', error);
      }
    }

    // Set up keyboard navigation detection
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setKeyboardNavigation(true);
      }
    };

    const handleMouseDown = () => {
      setKeyboardNavigation(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    const settings = {
      screenReaderEnabled,
      highContrastMode,
      reducedMotion,
      fontScale,
      keyboardNavigation
    };
    localStorage.setItem('bloch-verse-accessibility', JSON.stringify(settings));
  }, [screenReaderEnabled, highContrastMode, reducedMotion, fontScale, keyboardNavigation]);

  // Apply accessibility styles to document
  useEffect(() => {
    const root = document.documentElement;

    // High contrast mode
    if (highContrastMode) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
    }

    // Font scaling
    root.style.setProperty('--font-scale', fontScale.toString());
  }, [highContrastMode, reducedMotion, fontScale]);

  // Screen reader announcement function
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncements(prev => [...prev, { message, priority }]);

    // Clear announcement after it's been read
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(ann => ann.message !== message));
    }, 1000);
  };

  // Focus management
  const setFocusToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      announceToScreenReader(`Focused on ${element.getAttribute('aria-label') || element.textContent || 'element'}`);
    }
  };

  // Skip link management
  const addSkipLink = (id: string, label: string, href: string) => {
    setSkipLinks(prev => {
      const existing = prev.find(link => link.id === id);
      if (existing) {
        return prev.map(link => link.id === id ? { id, label, href } : link);
      }
      return [...prev, { id, label, href }];
    });
  };

  const removeSkipLink = (id: string) => {
    setSkipLinks(prev => prev.filter(link => link.id !== id));
  };

  const contextValue: AccessibilityContextType = {
    screenReaderEnabled,
    setScreenReaderEnabled,
    highContrastMode,
    setHighContrastMode,
    reducedMotion,
    setReducedMotion,
    fontScale,
    setFontScale,
    keyboardNavigation,
    setKeyboardNavigation,
    announceToScreenReader,
    setFocusToElement,
    skipLinks,
    addSkipLink,
    removeSkipLink
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {/* Skip Links */}
      <div className="sr-only focus-within:not-sr-only">
        {skipLinks.map(link => (
          <a
            key={link.id}
            href={link.href}
            className="fixed top-4 left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Screen Reader Announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcements
          .filter(ann => ann.priority === 'polite')
          .map((ann, index) => (
            <div key={index}>{ann.message}</div>
          ))}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {announcements
          .filter(ann => ann.priority === 'assertive')
          .map((ann, index) => (
            <div key={index}>{ann.message}</div>
          ))}
      </div>

      {/* High contrast mode styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .high-contrast {
            --background: hsl(0 0% 0%);
            --foreground: hsl(0 0% 100%);
            --muted: hsl(0 0% 15%);
            --muted-foreground: hsl(0 0% 85%);
            --border: hsl(0 0% 30%);
          }

          /* Font scaling */
          * {
            font-size: calc(1rem * var(--font-scale, 1));
          }

          /* Focus indicators for keyboard navigation */
          *:focus-visible {
            outline: 2px solid hsl(var(--ring));
            outline-offset: 2px;
          }

          /* Screen reader only content */
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }

          .sr-only.focus-within:not-sr-only {
            position: static;
            width: auto;
            height: auto;
            padding: initial;
            margin: initial;
            overflow: visible;
            clip: auto;
            white-space: normal;
          }
        `
      }} />

      {children}
    </AccessibilityContext.Provider>
  );
};

// Custom hook for using accessibility context
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Accessible wrapper component
interface AccessibleWrapperProps {
  children: ReactNode;
  role?: string;
  label?: string;
  description?: string;
  className?: string;
  tabIndex?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const AccessibleWrapper: React.FC<AccessibleWrapperProps> = ({
  children,
  role,
  label,
  description,
  className,
  tabIndex,
  onFocus,
  onBlur
}) => {
  const { keyboardNavigation, announceToScreenReader } = useAccessibility();

  const handleFocus = () => {
    if (keyboardNavigation && label) {
      announceToScreenReader(`Entered ${label}`);
    }
    onFocus?.();
  };

  const handleBlur = () => {
    onBlur?.();
  };

  return (
    <div
      role={role}
      aria-label={label}
      aria-description={description}
      className={cn(className)}
      tabIndex={tabIndex}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
    </div>
  );
};

// Accessible button component
interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  className,
  ariaLabel,
  ariaDescription
}) => {
  const { announceToScreenReader } = useAccessibility();

  const handleClick = () => {
    if (ariaLabel) {
      announceToScreenReader(`${ariaLabel} activated`);
    }
    onClick();
  };

  const variantClasses = {
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
    danger: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-description={ariaDescription}
      aria-disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {loading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
};

// Keyboard navigation hook
export const useKeyboardNavigation = () => {
  const { keyboardNavigation, setFocusToElement } = useAccessibility();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle common keyboard shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '1':
          case '2':
          case '3':
          case '4':
            event.preventDefault();
            // Tab switching logic would go here
            break;
          case '/':
            event.preventDefault();
            // Focus search would go here
            break;
        }
      }

      // Arrow key navigation for focusable elements
      if (keyboardNavigation) {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element);

        switch (event.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            event.preventDefault();
            const nextIndex = (currentIndex + 1) % focusableElements.length;
            (focusableElements[nextIndex] as HTMLElement).focus();
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            event.preventDefault();
            const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
            (focusableElements[prevIndex] as HTMLElement).focus();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardNavigation]);

  return { keyboardNavigation, setFocusToElement };
};

export default AccessibilityProvider;