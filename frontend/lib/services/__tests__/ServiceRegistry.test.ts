/**
 * ServiceRegistry Test Suite
 * 
 * Comprehensive tests for microservices infrastructure including:
 * - Service registration and discovery
 * - Health monitoring and status tracking
 * - Circuit breaker patterns and fault tolerance
 * - Load balancing strategies
 * - API gateway functionality
 * - Service lifecycle management
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  ServiceRegistry, 
  CircuitBreaker, 
  APIGateway,
  ServiceEndpoint,
  ServiceHealth,
  LoadBalancingStrategy 
} from '../ServiceRegistry';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('ServiceRegistry', () => {
  let serviceRegistry: ServiceRegistry;

  beforeEach(() => {
    serviceRegistry = new ServiceRegistry();
    jest.clearAllMocks();
  });

  afterEach(() => {
    serviceRegistry.shutdown();
  });

  // =============================================================================
  // Service Registration Tests
  // =============================================================================

  describe('Service Registration', () => {
    it('should register a new service', () => {
      const service: ServiceEndpoint = {
        id: 'test-service',
        name: 'Test Service',
        url: 'http://localhost:3001',
        version: '1.0.0',
        health: 'healthy',
        lastHealthCheck: Date.now(),
        metadata: {
          type: 'calculation',
          capabilities: ['air-duct-sizing']
        }
      };

      serviceRegistry.registerService(service);
      const registeredService = serviceRegistry.getService('test-service');

      expect(registeredService).toEqual(service);
    });

    it('should update existing service registration', () => {
      const service: ServiceEndpoint = {
        id: 'test-service',
        name: 'Test Service',
        url: 'http://localhost:3001',
        version: '1.0.0',
        health: 'healthy',
        lastHealthCheck: Date.now()
      };

      serviceRegistry.registerService(service);

      const updatedService = {
        ...service,
        version: '1.1.0',
        health: 'degraded' as ServiceHealth
      };

      serviceRegistry.registerService(updatedService);
      const result = serviceRegistry.getService('test-service');

      expect(result?.version).toBe('1.1.0');
      expect(result?.health).toBe('degraded');
    });

    it('should unregister services', () => {
      const service: ServiceEndpoint = {
        id: 'test-service',
        name: 'Test Service',
        url: 'http://localhost:3001',
        version: '1.0.0',
        health: 'healthy',
        lastHealthCheck: Date.now()
      };

      serviceRegistry.registerService(service);
      expect(serviceRegistry.getService('test-service')).toBeDefined();

      serviceRegistry.unregisterService('test-service');
      expect(serviceRegistry.getService('test-service')).toBeNull();
    });
  });

  // =============================================================================
  // Service Discovery Tests
  // =============================================================================

  describe('Service Discovery', () => {
    beforeEach(() => {
      // Register test services
      const services: ServiceEndpoint[] = [
        {
          id: 'hvac-calc-1',
          name: 'HVAC Calculation Service',
          url: 'http://localhost:3001',
          version: '1.0.0',
          health: 'healthy',
          lastHealthCheck: Date.now(),
          metadata: { type: 'calculation', region: 'us-east' }
        },
        {
          id: 'hvac-calc-2',
          name: 'HVAC Calculation Service',
          url: 'http://localhost:3002',
          version: '1.0.0',
          health: 'healthy',
          lastHealthCheck: Date.now(),
          metadata: { type: 'calculation', region: 'us-west' }
        },
        {
          id: 'project-mgmt',
          name: 'Project Management Service',
          url: 'http://localhost:3003',
          version: '1.0.0',
          health: 'degraded',
          lastHealthCheck: Date.now(),
          metadata: { type: 'management' }
        }
      ];

      services.forEach(service => serviceRegistry.registerService(service));
    });

    it('should discover services by type', () => {
      const calculationServices = serviceRegistry.discoverServices({
        type: 'calculation'
      });

      expect(calculationServices).toHaveLength(2);
      expect(calculationServices.every(s => s.metadata?.type === 'calculation')).toBe(true);
    });

    it('should discover healthy services only', () => {
      const healthyServices = serviceRegistry.discoverServices({
        healthStatus: 'healthy'
      });

      expect(healthyServices).toHaveLength(2);
      expect(healthyServices.every(s => s.health === 'healthy')).toBe(true);
    });

    it('should discover services by region', () => {
      const eastServices = serviceRegistry.discoverServices({
        region: 'us-east'
      });

      expect(eastServices).toHaveLength(1);
      expect(eastServices[0].metadata?.region).toBe('us-east');
    });

    it('should return all services when no criteria specified', () => {
      const allServices = serviceRegistry.discoverServices();
      expect(allServices).toHaveLength(3);
    });
  });

  // =============================================================================
  // Health Monitoring Tests
  // =============================================================================

  describe('Health Monitoring', () => {
    beforeEach(() => {
      const service: ServiceEndpoint = {
        id: 'test-service',
        name: 'Test Service',
        url: 'http://localhost:3001',
        version: '1.0.0',
        health: 'healthy',
        lastHealthCheck: Date.now()
      };
      serviceRegistry.registerService(service);
    });

    it('should perform health checks', async () => {
      // Mock successful health check
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy', uptime: 12345 })
      });

      const health = await serviceRegistry.checkServiceHealth('test-service');

      expect(health).toBe('healthy');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/health',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle failed health checks', async () => {
      // Mock failed health check
      (global.fetch as any).mockRejectedValueOnce(new Error('Connection failed'));

      const health = await serviceRegistry.checkServiceHealth('test-service');

      expect(health).toBe('unhealthy');
    });

    it('should update service health status', async () => {
      // Mock degraded health check
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'degraded', uptime: 12345 })
      });

      await serviceRegistry.checkServiceHealth('test-service');
      const service = serviceRegistry.getService('test-service');

      expect(service?.health).toBe('degraded');
    });

    it('should start and stop health monitoring', async () => {
      const monitoringSpy = jest.spyOn(serviceRegistry as any, 'performHealthChecks');
      
      serviceRegistry.startHealthMonitoring(100); // 100ms interval
      
      // Wait for at least one health check
      await new Promise(resolve => setTimeout(resolve, 150));
      
      serviceRegistry.stopHealthMonitoring();
      
      expect(monitoringSpy).toHaveBeenCalled();
    });
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 1000,
      monitoringPeriod: 500
    });
  });

  // =============================================================================
  // Circuit Breaker State Tests
  // =============================================================================

  describe('Circuit Breaker States', () => {
    it('should start in closed state', () => {
      expect(circuitBreaker.getState()).toBe('closed');
    });

    it('should transition to open state after failures', async () => {
      const failingOperation = async () => {
        throw new Error('Operation failed');
      };

      // Trigger failures to reach threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getState()).toBe('open');
    });

    it('should transition to half-open state after recovery timeout', async () => {
      const failingOperation = async () => {
        throw new Error('Operation failed');
      };

      // Trigger failures to open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getState()).toBe('open');

      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Next call should transition to half-open
      try {
        await circuitBreaker.execute(failingOperation);
      } catch (error) {
        // Expected to fail
      }

      expect(circuitBreaker.getState()).toBe('half-open');
    });

    it('should close circuit after successful operation in half-open state', async () => {
      const failingOperation = async () => {
        throw new Error('Operation failed');
      };

      const successfulOperation = async () => {
        return 'success';
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }

      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Execute successful operation to close circuit
      const result = await circuitBreaker.execute(successfulOperation);

      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('closed');
    });
  });

  // =============================================================================
  // Circuit Breaker Metrics Tests
  // =============================================================================

  describe('Circuit Breaker Metrics', () => {
    it('should track success and failure counts', async () => {
      const successfulOperation = async () => 'success';
      const failingOperation = async () => {
        throw new Error('Operation failed');
      };

      // Execute successful operations
      await circuitBreaker.execute(successfulOperation);
      await circuitBreaker.execute(successfulOperation);

      // Execute failing operations
      try {
        await circuitBreaker.execute(failingOperation);
      } catch (error) {
        // Expected to fail
      }

      const metrics = circuitBreaker.getMetrics();

      expect(metrics.successCount).toBe(2);
      expect(metrics.failureCount).toBe(1);
      expect(metrics.totalRequests).toBe(3);
    });

    it('should calculate success rate', async () => {
      const successfulOperation = async () => 'success';
      const failingOperation = async () => {
        throw new Error('Operation failed');
      };

      // 3 successes, 1 failure = 75% success rate
      await circuitBreaker.execute(successfulOperation);
      await circuitBreaker.execute(successfulOperation);
      await circuitBreaker.execute(successfulOperation);

      try {
        await circuitBreaker.execute(failingOperation);
      } catch (error) {
        // Expected to fail
      }

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.successRate).toBe(0.75);
    });
  });
});

describe('APIGateway', () => {
  let apiGateway: APIGateway;
  let serviceRegistry: ServiceRegistry;

  beforeEach(() => {
    serviceRegistry = new ServiceRegistry();
    apiGateway = new APIGateway(serviceRegistry);

    // Register test services
    serviceRegistry.registerService({
      id: 'hvac-calc',
      name: 'HVAC Calculation Service',
      url: 'http://localhost:3001',
      version: '1.0.0',
      health: 'healthy',
      lastHealthCheck: Date.now(),
      metadata: { type: 'calculation' }
    });

    serviceRegistry.registerService({
      id: 'project-mgmt',
      name: 'Project Management Service',
      url: 'http://localhost:3002',
      version: '1.0.0',
      health: 'healthy',
      lastHealthCheck: Date.now(),
      metadata: { type: 'management' }
    });
  });

  afterEach(() => {
    serviceRegistry.shutdown();
  });

  // =============================================================================
  // Request Routing Tests
  // =============================================================================

  describe('Request Routing', () => {
    it('should route requests to correct service', async () => {
      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: 'calculation complete' })
      });

      const response = await apiGateway.routeRequest('/api/calculations/duct-size', {
        method: 'POST',
        body: JSON.stringify({ airflow: 2000 }),
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/calculations/duct-size',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ airflow: 2000 })
        })
      );
    });

    it('should handle routing errors gracefully', async () => {
      const response = await apiGateway.routeRequest('/api/unknown/endpoint', {
        method: 'GET'
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  // =============================================================================
  // Load Balancing Tests
  // =============================================================================

  describe('Load Balancing', () => {
    beforeEach(() => {
      // Register multiple instances of the same service
      serviceRegistry.registerService({
        id: 'hvac-calc-2',
        name: 'HVAC Calculation Service',
        url: 'http://localhost:3003',
        version: '1.0.0',
        health: 'healthy',
        lastHealthCheck: Date.now(),
        metadata: { type: 'calculation' }
      });
    });

    it('should distribute requests using round-robin strategy', async () => {
      apiGateway.setLoadBalancingStrategy('round-robin');

      // Mock responses
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ server: 'instance-1' })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ server: 'instance-2' })
        });

      // Make two requests
      await apiGateway.routeRequest('/api/calculations/test', { method: 'GET' });
      await apiGateway.routeRequest('/api/calculations/test', { method: 'GET' });

      // Verify requests went to different instances
      expect(global.fetch).toHaveBeenNthCalledWith(1,
        'http://localhost:3001/api/calculations/test',
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenNthCalledWith(2,
        'http://localhost:3003/api/calculations/test',
        expect.any(Object)
      );
    });

    it('should handle least-connections load balancing', async () => {
      apiGateway.setLoadBalancingStrategy('least-connections');

      // Mock response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: 'success' })
      });

      const response = await apiGateway.routeRequest('/api/calculations/test', {
        method: 'GET'
      });

      expect(response.ok).toBe(true);
    });
  });

  // =============================================================================
  // Rate Limiting Tests
  // =============================================================================

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Set a low rate limit for testing
      apiGateway.setRateLimit(2, 1000); // 2 requests per second

      // Mock responses
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ result: 'success' })
      });

      // Make requests up to the limit
      const response1 = await apiGateway.routeRequest('/api/test', { method: 'GET' });
      const response2 = await apiGateway.routeRequest('/api/test', { method: 'GET' });
      const response3 = await apiGateway.routeRequest('/api/test', { method: 'GET' });

      expect(response1.ok).toBe(true);
      expect(response2.ok).toBe(true);
      expect(response3.status).toBe(429); // Too Many Requests
    });

    it('should reset rate limit after time window', async () => {
      apiGateway.setRateLimit(1, 100); // 1 request per 100ms

      // Mock response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ result: 'success' })
      });

      // First request should succeed
      const response1 = await apiGateway.routeRequest('/api/test', { method: 'GET' });
      expect(response1.ok).toBe(true);

      // Second request should be rate limited
      const response2 = await apiGateway.routeRequest('/api/test', { method: 'GET' });
      expect(response2.status).toBe(429);

      // Wait for rate limit to reset
      await new Promise(resolve => setTimeout(resolve, 150));

      // Third request should succeed
      const response3 = await apiGateway.routeRequest('/api/test', { method: 'GET' });
      expect(response3.ok).toBe(true);
    });
  });
});
