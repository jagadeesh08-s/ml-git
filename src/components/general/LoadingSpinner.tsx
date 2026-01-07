// Enhanced Loading Spinner with multiple variants and accessibility
import React from 'react';
import { Loader2, Zap, Atom, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'quantum' | 'pulse' | 'dots' | 'ring';
  text?: string;
  className?: string;
  showText?: boolean;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  text = 'Loading...',
  className,
  showText = true,
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'quantum':
        return (
          <div className="relative">
            <Atom className={cn("animate-spin text-primary", sizeClasses[size])} />
            <div className="absolute inset-0 animate-ping">
              <Zap className={cn("text-primary/50", sizeClasses[size])} />
            </div>
          </div>
        );

      case 'pulse':
        return (
          <div className={cn("rounded-full bg-primary animate-pulse", sizeClasses[size])} />
        );

      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-primary animate-bounce",
                  size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );

      case 'ring':
        return (
          <div className={cn("relative", sizeClasses[size])}>
            <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"></div>
          </div>
        );

      default:
        return (
          <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
        );
    }
  };

  const content = (
    <div className={cn("flex flex-col items-center justify-center space-y-3", className)}>
      <div
        role="status"
        aria-label={text}
        className="flex items-center justify-center"
      >
        {renderSpinner()}
      </div>
      {showText && (
        <p className={cn("text-muted-foreground font-medium", textSizeClasses[size])}>
          {text}
        </p>
      )}
      <span className="sr-only">{text}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;