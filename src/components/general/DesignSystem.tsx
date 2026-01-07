// Bloch Verse Design System - Standardized UI Components and Patterns
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from './LoadingSpinner';
import {
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Lightbulb,
  Zap,
  Target,
  TrendingUp,
  Clock,
  Users,
  Activity
} from 'lucide-react';

// Standardized spacing system
export const SPACING = {
  xs: 'space-y-2',
  sm: 'space-y-4',
  md: 'space-y-6',
  lg: 'space-y-8',
  xl: 'space-y-12'
} as const;

// Standardized section layouts
export const SECTION_LAYOUTS = {
  grid: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
  sidebar: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
  fullWidth: 'w-full',
  centered: 'max-w-4xl mx-auto'
} as const;

// Standardized card variants
interface StandardCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: 'default' | 'quantum' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export const StandardCard: React.FC<StandardCardProps> = ({
  title,
  description,
  children,
  variant = 'default',
  icon,
  className,
  headerAction
}) => {
  const variantStyles = {
    default: 'border-muted/20',
    quantum: 'border-primary/20 bg-primary/5',
    success: 'border-green-500/20 bg-green-500/5',
    warning: 'border-yellow-500/20 bg-yellow-500/5',
    error: 'border-red-500/20 bg-red-500/5'
  };

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

// Standardized status indicators
interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'loading';
  message: string;
  description?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  description,
  className
}) => {
  const statusConfig = {
    success: {
      icon: CheckCircle,
      variant: 'default' as const,
      className: 'border-green-500/20 bg-green-500/5 text-green-700'
    },
    warning: {
      icon: AlertTriangle,
      variant: 'default' as const,
      className: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-700'
    },
    error: {
      icon: XCircle,
      variant: 'destructive' as const,
      className: 'border-red-500/20 bg-red-500/5'
    },
    info: {
      icon: Info,
      variant: 'default' as const,
      className: 'border-blue-500/20 bg-blue-500/5 text-blue-700'
    },
    loading: {
      icon: () => <LoadingSpinner size="sm" variant="quantum" showText={false} />,
      variant: 'default' as const,
      className: 'border-primary/20 bg-primary/5'
    }
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <Alert className={cn(config.className, className)}>
      <IconComponent className="h-4 w-4" />
      <AlertDescription>
        <div className="font-medium">{message}</div>
        {description && <div className="text-sm mt-1 opacity-90">{description}</div>}
      </AlertDescription>
    </Alert>
  );
};

// Standardized metric display
interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  trend,
  trendValue,
  icon,
  className
}) => {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-muted-foreground'
  };

  return (
    <Card className={cn('border-muted/20', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold">{value}</p>
              {trend && trendValue && (
                <Badge variant="outline" className={cn('text-xs', trendColors[trend])}>
                  {trend === 'up' && '+'}{trendValue}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {icon && (
            <div className="text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Standardized action buttons
interface ActionButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className
}) => {
  const variantStyles = {
    primary: 'bg-primary hover:bg-primary/90',
    secondary: 'bg-secondary hover:bg-secondary/80',
    danger: 'bg-destructive hover:bg-destructive/90',
    success: 'bg-green-600 hover:bg-green-700'
  };

  return (
    <Button
      size={size === 'md' ? 'default' : size}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(variantStyles[variant], className)}
    >
      {loading && <LoadingSpinner size="sm" variant="default" showText={false} className="mr-2" />}
      {children}
    </Button>
  );
};

// Standardized section headers
interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

// Standardized empty states
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={cn('text-center py-12', className)}>
      {icon && (
        <div className="mx-auto w-12 h-12 text-muted-foreground mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

// Standardized tab content wrapper
interface TabContentProps {
  children: React.ReactNode;
  spacing?: keyof typeof SPACING;
  layout?: keyof typeof SECTION_LAYOUTS;
  className?: string;
}

export const TabContent: React.FC<TabContentProps> = ({
  children,
  spacing = 'md',
  layout = 'grid',
  className
}) => {
  return (
    <div className={cn(SPACING[spacing], SECTION_LAYOUTS[layout], className)}>
      {children}
    </div>
  );
};

// Export common icons for consistency
export const ICONS = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
  help: HelpCircle,
  lightbulb: Lightbulb,
  quantum: Zap,
  target: Target,
  trending: TrendingUp,
  clock: Clock,
  users: Users,
  activity: Activity
} as const;

// Export color schemes for consistency
export const COLORS = {
  quantum: {
    primary: 'text-primary',
    secondary: 'text-primary/70',
    background: 'bg-primary/5',
    border: 'border-primary/20'
  },
  success: {
    primary: 'text-green-600',
    secondary: 'text-green-500',
    background: 'bg-green-500/5',
    border: 'border-green-500/20'
  },
  warning: {
    primary: 'text-yellow-600',
    secondary: 'text-yellow-500',
    background: 'bg-yellow-500/5',
    border: 'border-yellow-500/20'
  },
  error: {
    primary: 'text-red-600',
    secondary: 'text-red-500',
    background: 'bg-red-500/5',
    border: 'border-red-500/20'
  }
} as const;