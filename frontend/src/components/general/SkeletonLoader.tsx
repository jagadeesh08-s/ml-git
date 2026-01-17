import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonLoaderProps {
  type?: 'circuit' | 'bloch-sphere' | 'analytics' | 'tutorial' | 'general';
  className?: string;
}

const CircuitSkeleton: React.FC = () => (
  <Card className="border-2 border-primary/20 bg-card/90 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <Skeleton className="h-96 w-full rounded-3xl" />
          <div className="flex gap-4">
            <Skeleton className="h-14 flex-1 rounded-2xl" />
            <Skeleton className="h-14 w-32 rounded-2xl" />
          </div>
        </div>
        <div className="lg:col-span-5 space-y-6">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const BlochSphereSkeleton: React.FC = () => (
  <Card className="border-gray-800/20 bg-gray-900/50 backdrop-blur-sm rounded-2xl">
    <CardHeader className="pb-2">
      <Skeleton className="h-5 w-24" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-64 w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-18" />
      </div>
    </CardContent>
  </Card>
);

const AnalyticsSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-gray-700/50 bg-gray-800/30">
          <CardContent className="p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card className="border-gray-700/50 bg-gray-800/30">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full rounded-lg" />
      </CardContent>
    </Card>
  </div>
);

const TutorialSkeleton: React.FC = () => (
  <div className="space-y-6">
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border-muted/20">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full rounded-lg mb-4" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const GeneralSkeleton: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  </div>
);

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'general',
  className = ''
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'circuit':
        return <CircuitSkeleton />;
      case 'bloch-sphere':
        return <BlochSphereSkeleton />;
      case 'analytics':
        return <AnalyticsSkeleton />;
      case 'tutorial':
        return <TutorialSkeleton />;
      default:
        return <GeneralSkeleton />;
    }
  };

  return (
    <div className={`animate-pulse ${className}`}>
      {renderSkeleton()}
    </div>
  );
};

export default SkeletonLoader;