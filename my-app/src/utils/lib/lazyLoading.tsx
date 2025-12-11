// Lazy loading utilities for code splitting
import { lazy, ComponentType, Suspense } from 'react';
import LoadingSpinner from '@/components/atoms/LoadingSpinner';

/**
 * Create a lazy-loaded component with loading fallback
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyWrapper(props: any) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Preload a lazy component
 */
export function preloadLazyComponent(importFunc: () => Promise<any>) {
  importFunc();
}

