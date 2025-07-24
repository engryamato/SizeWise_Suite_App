/**
 * Service Provider Context
 *
 * React context provider that manages service layer dependency injection
 * for components. Integrates with existing service layer architecture
 * and supports both offline (Phase 1) and SaaS (Phase 2) modes.
 *
 * @see docs/refactoring/component-architecture-specification.md
 * @see docs/implementation/saas-readiness/service-layer-architecture.md
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { ServiceContainer, ServiceContextValue } from '../hooks/useServiceIntegration';
import { createOfflineServiceContainer } from '../services/OfflineServiceContainer';

// =============================================================================
// Service Context
// =============================================================================

/**
 * Service context for dependency injection
 */
const ServiceContext = createContext<ServiceContextValue | null>(null);

/**
 * Hook to access service context
 */
export function useServiceContext(): ServiceContextValue {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServiceContext must be used within a ServiceProvider');
  }
  return context;
}

// =============================================================================
// Service Provider Props
// =============================================================================

export interface ServiceProviderProps {
  /** Child components */
  children: ReactNode;
  /** Service container (injected from app initialization) */
  services?: ServiceContainer;
  /** Operating mode (offline or cloud) */
  mode?: 'offline' | 'cloud';
  /** Configuration options */
  config?: ServiceProviderConfig;
}

export interface ServiceProviderConfig {
  /** Enable service caching */
  enableCaching?: boolean;
  /** Cache timeout in milliseconds */
  cacheTimeout?: number;
  /** Enable error retry */
  enableRetry?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
}

// =============================================================================
// Service Provider Component
// =============================================================================

/**
 * Service provider component that manages service layer integration
 */
export function ServiceProvider({ 
  children, 
  services, 
  mode = 'offline',
  config = {}
}: ServiceProviderProps) {
  const [serviceContainer, setServiceContainer] = useState<ServiceContainer | null>(services || null);
  const [loading, setLoading] = useState(!services);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(!!services);

  // Default configuration
  const defaultConfig: ServiceProviderConfig = {
    enableCaching: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    enableRetry: true,
    maxRetries: 3,
    retryDelay: 1000,
    ...config
  };

  /**
   * Initialize services if not provided
   */
  useEffect(() => {
    if (!services && !initialized) {
      initializeServices();
    }
  }, [services, initialized, initializeServices]);

  /**
   * Initialize service container based on mode
   */
  async function initializeServices() {
    setLoading(true);
    setError(null);

    try {
      // This would be replaced with actual service initialization
      // based on the existing service layer architecture
      const container = await createServiceContainer(mode, defaultConfig);
      setServiceContainer(container);
      setInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize services';
      setError(errorMessage);
      console.error('Service initialization failed:', err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Create service container based on mode
   */
  async function createServiceContainer(
    mode: 'offline' | 'cloud',
    config: ServiceProviderConfig
  ): Promise<ServiceContainer> {
    if (mode === 'offline') {
      // Initialize real offline services with SQLite database
      console.log('🔧 Creating offline service container...');
      const offlineServices = await createOfflineServiceContainer();

      // Map to ServiceContainer interface
      return {
        projectService: offlineServices.projectService,
        calculationService: offlineServices.calculationService,
        validationService: offlineServices.validationService,
        exportService: offlineServices.exportService,
        tierService: offlineServices.tierService,
        featureManager: offlineServices.featureManager
      };
    } else {
      // Cloud mode not implemented for Phase 1
      throw new Error('Cloud mode not available in Phase 1 offline desktop version');
    }
  }

  // Note: Placeholder functions removed - now using real offline service implementations

  // Context value (memoized to prevent unnecessary re-renders)
  const contextValue: ServiceContextValue = useMemo(() => ({
    services: serviceContainer!,
    loading,
    error,
    initialized
  }), [serviceContainer, loading, error, initialized]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing services...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Initialization Failed</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={initializeServices}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Provide services to children
  return (
    <ServiceContext.Provider value={contextValue}>
      {children}
    </ServiceContext.Provider>
  );
}

// =============================================================================
// Service Provider HOC
// =============================================================================

/**
 * Higher-order component for service injection
 */
export function withServices<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function WithServicesComponent(props: P) {
    return (
      <ServiceProvider>
        <Component {...props} />
      </ServiceProvider>
    );
  };
}

// =============================================================================
// Service Provider Utilities
// =============================================================================

/**
 * Hook for service health checking
 */
export function useServiceHealth() {
  const { services, loading, error, initialized } = useServiceContext();
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'unhealthy'>('healthy');

  useEffect(() => {
    if (!initialized || loading) {
      setHealthStatus('degraded');
    } else if (error) {
      setHealthStatus('unhealthy');
    } else {
      setHealthStatus('healthy');
    }
  }, [initialized, loading, error]);

  return {
    status: healthStatus,
    services,
    loading,
    error,
    initialized
  };
}

/**
 * Hook for service metrics and monitoring
 */
export function useServiceMetrics() {
  const [metrics, setMetrics] = useState({
    requestCount: 0,
    errorCount: 0,
    averageResponseTime: 0,
    lastRequestTime: null as Date | null
  });

  // This would integrate with actual monitoring in production
  const recordRequest = (duration: number, success: boolean) => {
    setMetrics(prev => ({
      requestCount: prev.requestCount + 1,
      errorCount: success ? prev.errorCount : prev.errorCount + 1,
      averageResponseTime: (prev.averageResponseTime + duration) / 2,
      lastRequestTime: new Date()
    }));
  };

  return {
    metrics,
    recordRequest
  };
}
