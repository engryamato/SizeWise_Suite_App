/**
 * Lazy Air Duct Sizer Component - Refactored
 * 
 * Refactored to use the consolidated LoadingStates components
 * to eliminate duplicate loading and error UI patterns.
 */

import React, { Suspense, lazy, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench } from 'lucide-react';
import { 
  ErrorDisplay, 
  LoadingSpinner, 
  ProgressLoader, 
  LoadingOverlay,
  useLoadingState 
} from '@/components/ui/LoadingStates';

// =============================================================================
// Lazy Component Imports
// =============================================================================

// Main air duct sizer page (heavy component)
const AirDuctSizerPage = lazy(() => 
  import('../../app/air-duct-sizer/page').then(module => ({
    default: module.default
  }))
);

// =============================================================================
// Types and Interfaces
// =============================================================================

interface LazyLoadErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface LazyAirDuctSizerProps {
  enableProgressiveLoading?: boolean;
  showLoadingProgress?: boolean;
}

interface ComponentLoaderProps {
  message?: string;
  progress?: number;
}

// =============================================================================
// Error Boundary Component (Refactored)
// =============================================================================

class LazyLoadErrorBoundary extends React.Component<
  LazyLoadErrorBoundaryProps,
  { hasError: boolean; error?: Error }
> {
  constructor(props: LazyLoadErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyAirDuctSizer Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorDisplay
          title="Failed to Load Component"
          message="Please refresh the page to try again."
          error={this.state.error}
          onRetry={() => window.location.reload()}
          retryLabel="Refresh Page"
          variant="full"
          showDetails={process.env.NODE_ENV === 'development'}
        />
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// Progressive Loading Hook (Refactored)
// =============================================================================

interface ProgressiveLoadingState {
  loadingStage: 'idle' | 'core' | 'heavy' | 'complete';
  progress: number;
}

const useProgressiveLoading = (): ProgressiveLoadingState => {
  const [loadingStage, setLoadingStage] = useState<ProgressiveLoadingState['loadingStage']>('idle');
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

    if (loadingStage === 'idle') {
      loadComponents();
    }
  }, [loadingStage]);

  return { loadingStage, progress };
};

// =============================================================================
// Component Loader (Refactored)
// =============================================================================

const ComponentLoader: React.FC<ComponentLoaderProps> = ({ 
  message = 'Loading...', 
  progress 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] space-y-6 p-8"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Wrench className="w-12 h-12 text-blue-500" />
        </motion.div>
        
        {/* Enhanced loading indicator using consolidated LoadingSpinner */}
        <div className="absolute -bottom-2 -right-2">
          <LoadingSpinner size="sm" color="primary" />
        </div>
      </div>

      <div className="text-center space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {message}
        </h3>
        
        {progress !== undefined && (
          <div className="w-64">
            <ProgressLoader 
              progress={progress} 
              showPercentage 
              variant="linear"
            />
          </div>
        )}
        
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Preparing HVAC calculation tools...
        </p>
      </div>
    </motion.div>
  );
};

// =============================================================================
// Main Lazy Air Duct Sizer Component (Refactored)
// =============================================================================

export const LazyAirDuctSizer: React.FC<LazyAirDuctSizerProps> = ({
  enableProgressiveLoading = true,
  showLoadingProgress = true
}) => {
  const { loadingStage, progress } = useProgressiveLoading();
  const { isLoading, error, setLoading, setError } = useLoadingState();

  // Handle component loading errors
  const handleLoadingError = (error: Error) => {
    console.error('Component loading error:', error);
    setError(error.message);
    setLoading(false);
  };

  // Show progressive loading if enabled
  if (enableProgressiveLoading && loadingStage !== 'complete') {
    return (
      <ComponentLoader 
        message="Initializing HVAC calculation engine..."
        progress={showLoadingProgress ? progress : undefined}
      />
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <ErrorDisplay
        title="Loading Error"
        message={error}
        onRetry={() => {
          setError(null);
          window.location.reload();
        }}
        variant="full"
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
        <AnimatePresence mode="wait">
          <motion.div
            key="air-duct-sizer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AirDuctSizerPage />
          </motion.div>
        </AnimatePresence>
      </Suspense>
    </LazyLoadErrorBoundary>
  );
};

// =============================================================================
// Enhanced Lazy Loader with Overlay Support
// =============================================================================

export const LazyAirDuctSizerWithOverlay: React.FC<LazyAirDuctSizerProps & {
  children?: React.ReactNode;
}> = ({ children, ...props }) => {
  const { loadingStage, progress } = useProgressiveLoading();
  const isLoading = loadingStage !== 'complete';

  return (
    <LoadingOverlay
      isLoading={isLoading}
      message="Loading HVAC Tools..."
      progress={props.showLoadingProgress ? progress : undefined}
    >
      {children || <LazyAirDuctSizer {...props} />}
    </LoadingOverlay>
  );
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Preload Air Duct Sizer components
 */
export const preloadAirDuctSizer = async (): Promise<void> => {
  try {
    await import('../../app/air-duct-sizer/page');
    await import('../../lib/services/DynamicHVACModules');
    
    if (typeof WebGLRenderingContext !== 'undefined') {
      await import('../3d/Canvas3D');
    }
    
    await import('../pdf/PDFImport');
  } catch (error) {
    console.warn('Failed to preload Air Duct Sizer components:', error);
  }
};

/**
 * Check if Air Duct Sizer can be loaded
 */
export const canLoadAirDuctSizer = (): boolean => {
  // Check for required browser features
  const hasWebGL = typeof WebGLRenderingContext !== 'undefined';
  const hasWorkers = typeof Worker !== 'undefined';
  const hasLocalStorage = typeof Storage !== 'undefined';
  
  return hasWebGL && hasWorkers && hasLocalStorage;
};

// =============================================================================
// Export default component
// =============================================================================

export default LazyAirDuctSizer;
