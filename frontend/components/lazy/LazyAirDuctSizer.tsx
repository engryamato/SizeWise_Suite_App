/**
 * Lazy Air Duct Sizer Component
 * 
 * Implements dynamic loading for the air duct sizer page with proper
 * loading states, error boundaries, and progressive enhancement.
 */

import React, { Suspense, lazy, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle, Wrench } from 'lucide-react';

// =============================================================================
// Lazy Component Imports
// =============================================================================

// Main air duct sizer page (heavy component)
const AirDuctSizerPage = lazy(() => 
  import('../../app/air-duct-sizer/page').then(module => ({
    default: module.default
  }))
);

// 3D Canvas component (Three.js - very heavy)
const Canvas3D = lazy(() => 
  import('../3d/Canvas3D').then(module => ({
    default: module.Canvas3D
  }))
);

// PDF Import component (PDF.js - heavy)
const PDFImport = lazy(() => 
  import('../pdf/PDFImport').then(module => ({
    default: module.PDFImport
  }))
);

// =============================================================================
// Loading Components
// =============================================================================

/**
 * Loading spinner for heavy components
 */
const ComponentLoader: React.FC<{ 
  message?: string;
  progress?: number;
}> = ({ message = "Loading HVAC tools...", progress }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="relative"
    >
      <Loader2 className="w-12 h-12 text-blue-500" />
      <Wrench className="w-6 h-6 text-orange-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
    </motion.div>
    
    <div className="text-center space-y-2">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {message}
      </p>
      
      {progress !== undefined && (
        <div className="w-64 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
          <motion.div
            className="bg-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </div>
  </div>
);

/**
 * Error boundary for lazy loaded components
 */
class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy load error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Failed to Load Component
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// Progressive Loading Hook
// =============================================================================

/**
 * Hook for progressive component loading with preloading
 */
function useProgressiveLoading() {
  const [loadingStage, setLoadingStage] = useState<'initial' | 'core' | 'heavy' | 'complete'>('initial');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadComponents = async () => {
      try {
        // Stage 1: Load core components (20%)
        setLoadingStage('core');
        setProgress(20);
        
        // Preload critical modules
        await import('../../lib/services/DynamicHVACModules');
        setProgress(40);

        // Stage 2: Load heavy components (60%)
        setLoadingStage('heavy');
        
        // Preload 3D components if WebGL is supported
        if (typeof WebGLRenderingContext !== 'undefined') {
          await import('../3d/Canvas3D');
          setProgress(70);
        }

        // Preload PDF components
        await import('../pdf/PDFImport');
        setProgress(90);

        // Stage 3: Complete (100%)
        setLoadingStage('complete');
        setProgress(100);

      } catch (error) {
        console.error('Progressive loading failed:', error);
        setLoadingStage('complete'); // Continue anyway
        setProgress(100);
      }
    };

    loadComponents();
  }, []);

  return { loadingStage, progress };
}

// =============================================================================
// Main Lazy Air Duct Sizer Component
// =============================================================================

export interface LazyAirDuctSizerProps {
  enableProgressiveLoading?: boolean;
  showLoadingProgress?: boolean;
}

export const LazyAirDuctSizer: React.FC<LazyAirDuctSizerProps> = ({
  enableProgressiveLoading = true,
  showLoadingProgress = true
}) => {
  const { loadingStage, progress } = useProgressiveLoading();

  // Show progressive loading if enabled
  if (enableProgressiveLoading && loadingStage !== 'complete') {
    return (
      <ComponentLoader 
        message="Initializing HVAC calculation engine..."
        progress={showLoadingProgress ? progress : undefined}
      />
    );
  }

  return (
    <LazyLoadErrorBoundary>
      <Suspense 
        fallback={
          <ComponentLoader 
            message="Loading Air Duct Sizer..."
            progress={showLoadingProgress ? 85 : undefined}
          />
        }
      >
        <AirDuctSizerPage />
      </Suspense>
    </LazyLoadErrorBoundary>
  );
};

// =============================================================================
// Individual Lazy Component Wrappers
// =============================================================================

/**
 * Lazy wrapper for 3D Canvas component
 */
export const LazyCanvas3D: React.FC<any> = (props) => (
  <LazyLoadErrorBoundary>
    <Suspense fallback={<ComponentLoader message="Loading 3D workspace..." />}>
      <Canvas3D {...props} />
    </Suspense>
  </LazyLoadErrorBoundary>
);

/**
 * Lazy wrapper for PDF Import component
 */
export const LazyPDFImport: React.FC<any> = (props) => (
  <LazyLoadErrorBoundary>
    <Suspense fallback={<ComponentLoader message="Loading PDF tools..." />}>
      <PDFImport {...props} />
    </Suspense>
  </LazyLoadErrorBoundary>
);

// =============================================================================
// Export
// =============================================================================

export default LazyAirDuctSizer;
