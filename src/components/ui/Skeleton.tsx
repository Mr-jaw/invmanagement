import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Could implement wave animation with CSS
    none: ''
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Optimized pre-built skeleton components for common use cases
export const ProductCardSkeleton: React.FC = React.memo(() => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
    <Skeleton variant="rectangular" className="h-48 mb-4" />
    <Skeleton variant="text" className="h-6 mb-2" />
    <Skeleton variant="text" className="h-4 mb-4 w-3/4" />
    <Skeleton variant="text" className="h-8 w-24" />
  </div>
));

export const CategoryCardSkeleton: React.FC = React.memo(() => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
    <Skeleton variant="rectangular" className="h-32 mb-4" />
    <Skeleton variant="text" className="h-6 mb-2" />
    <Skeleton variant="text" className="h-4 mb-4" />
    <div className="flex justify-between">
      <Skeleton variant="text" className="h-4 w-20" />
      <Skeleton variant="text" className="h-4 w-16" />
    </div>
  </div>
));

export const ReviewCardSkeleton: React.FC = React.memo(() => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
    <div className="flex items-start space-x-4">
      <Skeleton variant="circular" className="w-12 h-12" />
      <div className="flex-1">
        <Skeleton variant="text" className="h-5 mb-2 w-32" />
        <Skeleton variant="text" className="h-4 mb-3 w-24" />
        <Skeleton variant="text" className="h-4 mb-2" />
        <Skeleton variant="text" className="h-4 w-3/4" />
      </div>
    </div>
  </div>
));

// Fast loading skeleton for immediate display
export const FastLoadingSkeleton: React.FC = React.memo(() => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
  </div>
));

ProductCardSkeleton.displayName = 'ProductCardSkeleton';
CategoryCardSkeleton.displayName = 'CategoryCardSkeleton';
ReviewCardSkeleton.displayName = 'ReviewCardSkeleton';
FastLoadingSkeleton.displayName = 'FastLoadingSkeleton';