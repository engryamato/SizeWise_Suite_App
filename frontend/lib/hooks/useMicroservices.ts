/**
 * React Hook for Microservices Integration
 * 
 * Provides React integration for microservices architecture with:
 * - Service registry management
 * - API gateway routing
 * - Circuit breaker monitoring
 * - Health status tracking
 * - Load balancing strategies
 * - Performance metrics
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  ServiceRegistry, 
  APIGateway, 
  ServiceEndpoint, 
  ServiceHealth,
  CircuitBreaker 
} from '../services/ServiceRegistry';

// =============================================================================
// Hook Types and Interfaces
// =============================================================================

export interface MicroservicesConfig {
  enableHealthMonitoring?: boolean;
  healthCheckInterval?: number;
  enableMetrics?: boolean;
  metricsInterval?: number;
  loadBalancingStrategy?: 'round-robin' | 'least-connections' | 'weighted' | 'random';
  circuitBreakerThreshold?: number;
}

export interface MicroservicesHookReturn {
  // Service management
  serviceRegistry: ServiceRegistry | null;
  apiGateway: APIGateway | null;
  
  // Service operations
  discoverServices: (serviceName?: string, tags?: string[]) => ServiceEndpoint[];
  getServiceHealth: (serviceId: string) => ServiceHealth | undefined;
  callService: <T>(serviceId: string, operation: (endpoint: ServiceEndpoint) => Promise<T>) => Promise<T>;
  
  // API Gateway operations
  routeRequest: (method: string, path: string, body?: any, headers?: Record<string, string>) => Promise<any>;
  
  // Monitoring and metrics
  serviceMetrics: ServiceMetrics;
  gatewayMetrics: GatewayMetrics;
  healthStatus: HealthStatus;
  
  // State management
  isReady: boolean;
  error: Error | null;
  
  // Advanced features
  getCircuitBreakerStatus: (serviceId: string) => CircuitBreakerStatus | null;
  getLoadBalancingRecommendations: () => LoadBalancingRecommendation[];
  optimizeServiceRouting: () => Promise<void>;
}

export interface ServiceMetrics {
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  unhealthyServices: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  circuitBreakerTrips: number;
}

export interface GatewayMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  rateLimitedRequests: number;
  timeouts: number;
}

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: Array<{
    id: string;
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    responseTime: number;
    errorRate: number;
  }>;
}

export interface CircuitBreakerStatus {
  serviceId: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
}

export interface LoadBalancingRecommendation {
  type: 'strategy' | 'scaling' | 'health';
  severity: 'low' | 'medium' | 'high';
  message: string;
  action?: () => Promise<void>;
}

// =============================================================================
// Microservices Hook Implementation
// =============================================================================

export function useMicroservices(config: MicroservicesConfig = {}): MicroservicesHookReturn {
  const [serviceRegistry, setServiceRegistry] = useState<ServiceRegistry | null>(null);
  const [apiGateway, setApiGateway] = useState<APIGateway | null>(null);
  const [serviceMetrics, setServiceMetrics] = useState<ServiceMetrics>({
    totalServices: 0,
    healthyServices: 0,
    degradedServices: 0,
    unhealthyServices: 0,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    circuitBreakerTrips: 0
  });
  const [gatewayMetrics, setGatewayMetrics] = useState<GatewayMetrics>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    rateLimitedRequests: 0,
    timeouts: 0
  });
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    overall: 'healthy',
    services: []
  });
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const healthIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // =============================================================================
  // Service Initialization
  // =============================================================================

  useEffect(() => {
    try {
      const registry = new ServiceRegistry({
        healthCheckInterval: config.healthCheckInterval || 30000,
        loadBalancingStrategy: config.loadBalancingStrategy || 'round-robin',
        circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
        enableMetrics: config.enableMetrics !== false,
        enableTracing: false
      });

      const gateway = new APIGateway(registry);

      setServiceRegistry(registry);
      setApiGateway(gateway);
      setIsReady(true);
      setError(null);

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize microservices'));
      setIsReady(false);
    }
  }, [config]);

  // =============================================================================
  // Metrics Monitoring
  // =============================================================================

  useEffect(() => {
    if (!serviceRegistry || !apiGateway || !config.enableMetrics) return;

    const interval = config.metricsInterval || 5000; // 5 seconds default

    metricsIntervalRef.current = setInterval(() => {
      try {
        // Update service metrics
        const registryMetrics = serviceRegistry.getMetrics();
        setServiceMetrics({
          totalServices: registryMetrics.registeredServices,
          healthyServices: registryMetrics.healthyServices,
          degradedServices: 0, // Calculate from service statuses
          unhealthyServices: registryMetrics.registeredServices - registryMetrics.healthyServices,
          totalRequests: registryMetrics.totalRequests,
          successfulRequests: registryMetrics.successfulRequests,
          failedRequests: registryMetrics.failedRequests,
          averageResponseTime: registryMetrics.averageResponseTime,
          circuitBreakerTrips: registryMetrics.circuitBreakerTrips
        });

        // Update gateway metrics
        const gwMetrics = apiGateway.getMetrics();
        setGatewayMetrics(gwMetrics);

      } catch (err) {
        console.warn('Failed to update microservices metrics:', err);
      }
    }, interval);

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [serviceRegistry, apiGateway, config.enableMetrics, config.metricsInterval]);

  // =============================================================================
  // Health Monitoring
  // =============================================================================

  useEffect(() => {
    if (!serviceRegistry || !config.enableHealthMonitoring) return;

    const interval = config.healthCheckInterval || 30000; // 30 seconds default

    healthIntervalRef.current = setInterval(() => {
      try {
        const services = serviceRegistry.getAllServices();
        const healthServices = services.map(service => ({
          id: service.id,
          name: service.name,
          status: service.health.status,
          responseTime: service.health.responseTime,
          errorRate: service.health.errorRate
        }));

        // Calculate overall health
        const healthyCount = healthServices.filter(s => s.status === 'healthy').length;
        const degradedCount = healthServices.filter(s => s.status === 'degraded').length;
        const unhealthyCount = healthServices.filter(s => s.status === 'unhealthy').length;

        let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        if (unhealthyCount > 0) {
          overall = 'unhealthy';
        } else if (degradedCount > 0) {
          overall = 'degraded';
        }

        setHealthStatus({
          overall,
          services: healthServices
        });

      } catch (err) {
        console.warn('Failed to update health status:', err);
      }
    }, interval);

    return () => {
      if (healthIntervalRef.current) {
        clearInterval(healthIntervalRef.current);
      }
    };
  }, [serviceRegistry, config.enableHealthMonitoring, config.healthCheckInterval]);

  // =============================================================================
  // Service Operations
  // =============================================================================

  const discoverServices = useCallback((serviceName?: string, tags?: string[]): ServiceEndpoint[] => {
    if (!serviceRegistry) return [];
    try {
      return serviceRegistry.discoverServices(serviceName, tags);
    } catch (err) {
      console.warn('Service discovery failed:', err);
      return [];
    }
  }, [serviceRegistry]);

  const getServiceHealth = useCallback((serviceId: string): ServiceHealth | undefined => {
    if (!serviceRegistry) return undefined;
    try {
      return serviceRegistry.getServiceHealth(serviceId);
    } catch (err) {
      console.warn('Get service health failed:', err);
      return undefined;
    }
  }, [serviceRegistry]);

  const callService = useCallback(async <T>(
    serviceId: string,
    operation: (endpoint: ServiceEndpoint) => Promise<T>
  ): Promise<T> => {
    if (!serviceRegistry) {
      throw new Error('Service registry not initialized');
    }
    return await serviceRegistry.callService(serviceId, operation);
  }, [serviceRegistry]);

  const routeRequest = useCallback(async (
    method: string,
    path: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<any> => {
    if (!apiGateway) {
      throw new Error('API gateway not initialized');
    }
    return await apiGateway.routeRequest(method, path, body, headers);
  }, [apiGateway]);

  // =============================================================================
  // Advanced Features
  // =============================================================================

  const getCircuitBreakerStatus = useCallback((serviceId: string): CircuitBreakerStatus | null => {
    if (!serviceRegistry) return null;
    
    try {
      const metrics = serviceRegistry.getMetrics();
      const cbMetrics = metrics.circuitBreakers.find(cb => cb.serviceId === serviceId);
      
      if (!cbMetrics) return null;
      
      return {
        serviceId,
        state: cbMetrics.state as 'closed' | 'open' | 'half-open',
        failureCount: cbMetrics.failureCount,
        successCount: cbMetrics.successCount,
        lastFailureTime: cbMetrics.lastFailureTime
      };
    } catch (err) {
      console.warn('Get circuit breaker status failed:', err);
      return null;
    }
  }, [serviceRegistry]);

  const getLoadBalancingRecommendations = useCallback((): LoadBalancingRecommendation[] => {
    if (!serviceRegistry) return [];
    
    const recommendations: LoadBalancingRecommendation[] = [];
    const services = serviceRegistry.getAllServices();
    
    // Check for uneven load distribution
    const responseTimes = services.map(s => s.health.responseTime);
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    
    if (maxResponseTime > avgResponseTime * 2) {
      recommendations.push({
        type: 'strategy',
        severity: 'medium',
        message: 'Uneven load distribution detected. Consider switching to least-connections strategy.',
      });
    }
    
    // Check for unhealthy services
    const unhealthyServices = services.filter(s => s.health.status === 'unhealthy');
    if (unhealthyServices.length > 0) {
      recommendations.push({
        type: 'health',
        severity: 'high',
        message: `${unhealthyServices.length} unhealthy services detected. Consider scaling or investigation.`,
      });
    }
    
    // Check for high error rates
    const highErrorServices = services.filter(s => s.health.errorRate > 0.1);
    if (highErrorServices.length > 0) {
      recommendations.push({
        type: 'scaling',
        severity: 'medium',
        message: `${highErrorServices.length} services with high error rates. Consider horizontal scaling.`,
      });
    }
    
    return recommendations;
  }, [serviceRegistry]);

  const optimizeServiceRouting = useCallback(async (): Promise<void> => {
    if (!serviceRegistry) return;
    
    try {
      // Implement routing optimization logic
      const recommendations = getLoadBalancingRecommendations();
      
      // Log recommendations for now - in a real implementation,
      // this could automatically apply optimizations
      recommendations.forEach(rec => {
        console.log(`Optimization recommendation: ${rec.message}`);
      });
      
    } catch (err) {
      console.warn('Service routing optimization failed:', err);
    }
  }, [serviceRegistry, getLoadBalancingRecommendations]);

  // =============================================================================
  // Cleanup
  // =============================================================================

  useEffect(() => {
    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
      if (healthIntervalRef.current) {
        clearInterval(healthIntervalRef.current);
      }
      if (serviceRegistry) {
        serviceRegistry.destroy();
      }
    };
  }, [serviceRegistry]);

  // =============================================================================
  // Return Hook Interface
  // =============================================================================

  return {
    // Service management
    serviceRegistry,
    apiGateway,
    
    // Service operations
    discoverServices,
    getServiceHealth,
    callService,
    
    // API Gateway operations
    routeRequest,
    
    // Monitoring and metrics
    serviceMetrics,
    gatewayMetrics,
    healthStatus,
    
    // State management
    isReady,
    error,
    
    // Advanced features
    getCircuitBreakerStatus,
    getLoadBalancingRecommendations,
    optimizeServiceRouting
  };
}
