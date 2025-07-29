/**
 * useMicroservices Hook Test Suite
 * 
 * Tests for React integration of microservices infrastructure including:
 * - Service discovery and registration
 * - Health monitoring integration
 * - Circuit breaker patterns
 * - Load balancing strategies
 * - API gateway routing
 * - Real-time service status updates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMicroservices } from '../useMicroservices';

// Mock the ServiceRegistry and related classes
vi.mock('../../services/ServiceRegistry', () => ({
  ServiceRegistry: vi.fn().mockImplementation(() => ({
    registerService: vi.fn(),
    unregisterService: vi.fn(),
    getService: vi.fn().mockReturnValue(null),
    discoverServices: vi.fn().mockReturnValue([]),
    checkServiceHealth: vi.fn().mockResolvedValue('healthy'),
    startHealthMonitoring: vi.fn(),
    stopHealthMonitoring: vi.fn(),
    shutdown: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({
      totalServices: 0,
      healthyServices: 0,
      unhealthyServices: 0,
      averageResponseTime: 0
    })
  })),
  APIGateway: vi.fn().mockImplementation(() => ({
    routeRequest: vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: 'success' })
    }),
    setLoadBalancingStrategy: vi.fn(),
    setRateLimit: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      rateLimitedRequests: 0
    })
  })),
  CircuitBreaker: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue('success'),
    getState: vi.fn().mockReturnValue('closed'),
    getMetrics: vi.fn().mockReturnValue({
      successCount: 0,
      failureCount: 0,
      totalRequests: 0,
      successRate: 1
    }),
    reset: vi.fn()
  }))
}));

describe('useMicroservices Hook', () => {
  let mockServiceRegistry: any;
  let mockAPIGateway: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Get the mocked instances
    const { ServiceRegistry, APIGateway } = require('../../services/ServiceRegistry');
    mockServiceRegistry = new ServiceRegistry();
    mockAPIGateway = new APIGateway();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // =============================================================================
  // Hook Initialization Tests
  // =============================================================================

  describe('Hook Initialization', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => useMicroservices());

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.discoverServices).toBe('function');
      expect(typeof result.current.callService).toBe('function');
      expect(typeof result.current.routeRequest).toBe('function');
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        enableHealthMonitoring: true,
        healthCheckInterval: 5000,
        enableCircuitBreaker: true,
        loadBalancingStrategy: 'least-connections' as const
      };

      const { result } = renderHook(() => useMicroservices(customConfig));

      expect(result.current.isInitialized).toBe(true);
      expect(mockServiceRegistry.startHealthMonitoring).toHaveBeenCalledWith(5000);
    });

    it('should handle initialization errors gracefully', () => {
      // Mock initialization error
      const { ServiceRegistry } = require('../../services/ServiceRegistry');
      ServiceRegistry.mockImplementationOnce(() => {
        throw new Error('Initialization failed');
      });

      const { result } = renderHook(() => useMicroservices());

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  // =============================================================================
  // Service Discovery Tests
  // =============================================================================

  describe('Service Discovery', () => {
    it('should discover services by criteria', async () => {
      const mockServices = [
        {
          id: 'hvac-calc-1',
          name: 'HVAC Calculation Service',
          url: 'http://localhost:3001',
          version: '1.0.0',
          health: 'healthy' as const,
          lastHealthCheck: Date.now(),
          metadata: { type: 'calculation' }
        }
      ];

      mockServiceRegistry.discoverServices.mockReturnValue(mockServices);

      const { result } = renderHook(() => useMicroservices());

      let discoveredServices: any;
      await act(async () => {
        discoveredServices = result.current.discoverServices({ type: 'calculation' });
      });

      expect(mockServiceRegistry.discoverServices).toHaveBeenCalledWith({ type: 'calculation' });
      expect(discoveredServices).toEqual(mockServices);
    });

    it('should return empty array when no services found', async () => {
      mockServiceRegistry.discoverServices.mockReturnValue([]);

      const { result } = renderHook(() => useMicroservices());

      let discoveredServices: any;
      await act(async () => {
        discoveredServices = result.current.discoverServices({ type: 'nonexistent' });
      });

      expect(discoveredServices).toEqual([]);
    });
  });

  // =============================================================================
  // Service Health Monitoring Tests
  // =============================================================================

  describe('Service Health Monitoring', () => {
    it('should check service health', async () => {
      mockServiceRegistry.checkServiceHealth.mockResolvedValue('healthy');

      const { result } = renderHook(() => useMicroservices());

      let healthStatus: any;
      await act(async () => {
        healthStatus = await result.current.getServiceHealth('test-service');
      });

      expect(mockServiceRegistry.checkServiceHealth).toHaveBeenCalledWith('test-service');
      expect(healthStatus).toBe('healthy');
    });

    it('should handle health check failures', async () => {
      mockServiceRegistry.checkServiceHealth.mockResolvedValue('unhealthy');

      const { result } = renderHook(() => useMicroservices());

      let healthStatus: any;
      await act(async () => {
        healthStatus = await result.current.getServiceHealth('failing-service');
      });

      expect(healthStatus).toBe('unhealthy');
    });

    it('should provide real-time health status updates', async () => {
      const { result } = renderHook(() => useMicroservices({
        enableHealthMonitoring: true,
        healthCheckInterval: 100
      }));

      // Simulate health status change
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(mockServiceRegistry.startHealthMonitoring).toHaveBeenCalled();
    });
  });

  // =============================================================================
  // Service Communication Tests
  // =============================================================================

  describe('Service Communication', () => {
    it('should call services directly', async () => {
      const mockService = {
        id: 'test-service',
        name: 'Test Service',
        url: 'http://localhost:3001',
        version: '1.0.0',
        health: 'healthy' as const,
        lastHealthCheck: Date.now()
      };

      mockServiceRegistry.getService.mockReturnValue(mockService);

      // Mock fetch for direct service call
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ result: 'success' })
      });

      const { result } = renderHook(() => useMicroservices());

      let response: any;
      await act(async () => {
        response = await result.current.callService('test-service', '/api/test', {
          method: 'POST',
          body: JSON.stringify({ data: 'test' })
        });
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ data: 'test' })
        })
      );
      expect(response.ok).toBe(true);
    });

    it('should handle service not found errors', async () => {
      mockServiceRegistry.getService.mockReturnValue(null);

      const { result } = renderHook(() => useMicroservices());

      await act(async () => {
        try {
          await result.current.callService('nonexistent-service', '/api/test');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Service not found');
        }
      });
    });
  });

  // =============================================================================
  // API Gateway Integration Tests
  // =============================================================================

  describe('API Gateway Integration', () => {
    it('should route requests through API gateway', async () => {
      const { result } = renderHook(() => useMicroservices());

      let response: any;
      await act(async () => {
        response = await result.current.routeRequest('/api/calculations/duct-size', {
          method: 'POST',
          body: JSON.stringify({ airflow: 2000 })
        });
      });

      expect(mockAPIGateway.routeRequest).toHaveBeenCalledWith(
        '/api/calculations/duct-size',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ airflow: 2000 })
        })
      );
      expect(response.ok).toBe(true);
    });

    it('should handle routing errors', async () => {
      mockAPIGateway.routeRequest.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      });

      const { result } = renderHook(() => useMicroservices());

      let response: any;
      await act(async () => {
        response = await result.current.routeRequest('/api/unknown/endpoint');
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  // =============================================================================
  // Load Balancing Tests
  // =============================================================================

  describe('Load Balancing', () => {
    it('should set load balancing strategy', async () => {
      const { result } = renderHook(() => useMicroservices());

      await act(async () => {
        result.current.setLoadBalancingStrategy('round-robin');
      });

      expect(mockAPIGateway.setLoadBalancingStrategy).toHaveBeenCalledWith('round-robin');
    });

    it('should handle different load balancing strategies', async () => {
      const { result } = renderHook(() => useMicroservices());

      const strategies = ['round-robin', 'least-connections', 'weighted', 'random'] as const;

      for (const strategy of strategies) {
        await act(async () => {
          result.current.setLoadBalancingStrategy(strategy);
        });

        expect(mockAPIGateway.setLoadBalancingStrategy).toHaveBeenCalledWith(strategy);
      }
    });
  });

  // =============================================================================
  // Performance Metrics Tests
  // =============================================================================

  describe('Performance Metrics', () => {
    it('should provide service registry metrics', () => {
      const mockMetrics = {
        totalServices: 5,
        healthyServices: 4,
        unhealthyServices: 1,
        averageResponseTime: 150
      };

      mockServiceRegistry.getMetrics.mockReturnValue(mockMetrics);

      const { result } = renderHook(() => useMicroservices());

      expect(result.current.serviceMetrics).toEqual(mockMetrics);
    });

    it('should provide API gateway metrics', () => {
      const mockMetrics = {
        totalRequests: 1000,
        successfulRequests: 950,
        failedRequests: 50,
        averageResponseTime: 200,
        rateLimitedRequests: 10
      };

      mockAPIGateway.getMetrics.mockReturnValue(mockMetrics);

      const { result } = renderHook(() => useMicroservices());

      expect(result.current.gatewayMetrics).toEqual(mockMetrics);
    });

    it('should calculate overall system health', () => {
      mockServiceRegistry.getMetrics.mockReturnValue({
        totalServices: 10,
        healthyServices: 8,
        unhealthyServices: 2,
        averageResponseTime: 150
      });

      const { result } = renderHook(() => useMicroservices());

      expect(result.current.systemHealth).toEqual({
        status: 'degraded', // 80% healthy services
        healthyPercentage: 80,
        totalServices: 10,
        averageResponseTime: 150
      });
    });
  });

  // =============================================================================
  // Error Handling Tests
  // =============================================================================

  describe('Error Handling', () => {
    it('should handle service communication errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      mockServiceRegistry.getService.mockReturnValue({
        id: 'test-service',
        url: 'http://localhost:3001',
        health: 'healthy'
      });

      const { result } = renderHook(() => useMicroservices());

      await act(async () => {
        try {
          await result.current.callService('test-service', '/api/test');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Network error');
        }
      });
    });

    it('should handle service discovery errors', async () => {
      mockServiceRegistry.discoverServices.mockImplementation(() => {
        throw new Error('Discovery failed');
      });

      const { result } = renderHook(() => useMicroservices());

      await act(async () => {
        try {
          result.current.discoverServices({ type: 'calculation' });
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });
    });
  });

  // =============================================================================
  // Hook Lifecycle Tests
  // =============================================================================

  describe('Hook Lifecycle', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useMicroservices({
        enableHealthMonitoring: true
      }));

      unmount();

      expect(mockServiceRegistry.stopHealthMonitoring).toHaveBeenCalled();
      expect(mockServiceRegistry.shutdown).toHaveBeenCalled();
    });

    it('should handle configuration updates', async () => {
      const { result, rerender } = renderHook(
        ({ config }) => useMicroservices(config),
        {
          initialProps: { 
            config: { enableHealthMonitoring: false } 
          }
        }
      );

      expect(result.current.isInitialized).toBe(true);

      // Update configuration
      rerender({ 
        config: { 
          enableHealthMonitoring: true, 
          healthCheckInterval: 2000 
        } 
      });

      await waitFor(() => {
        expect(mockServiceRegistry.startHealthMonitoring).toHaveBeenCalledWith(2000);
      });
    });
  });
});
