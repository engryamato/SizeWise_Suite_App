# Microservices Infrastructure Guide

## Overview

The SizeWise Suite microservices infrastructure provides a robust foundation for distributed HVAC calculation services with service discovery, circuit breaker patterns, load balancing, and API gateway functionality.

## Architecture Components

### Service Registry

Central registry for service discovery and health monitoring.

```typescript
import { ServiceRegistry } from '@/lib/services/ServiceRegistry';

const registry = new ServiceRegistry();

// Register a service
registry.registerService({
  id: 'hvac-calculation-service',
  name: 'HVAC Calculation Service',
  url: 'http://localhost:3001',
  version: '1.0.0',
  health: 'healthy',
  lastHealthCheck: Date.now(),
  metadata: {
    type: 'calculation',
    capabilities: ['air-duct-sizing', 'pressure-drop', 'heat-transfer'],
    region: 'us-east-1'
  }
});
```

### Circuit Breaker

Fault tolerance mechanism that prevents cascading failures.

```typescript
import { CircuitBreaker } from '@/lib/services/ServiceRegistry';

const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,     // Open after 5 failures
  recoveryTimeout: 60000,  // Try recovery after 60 seconds
  monitoringPeriod: 30000  // Monitor for 30 seconds
});

// Execute operation with circuit breaker protection
const result = await circuitBreaker.execute(async () => {
  return await fetch('/api/calculation');
});
```

### API Gateway

Request routing and load balancing with rate limiting.

```typescript
import { APIGateway } from '@/lib/services/ServiceRegistry';

const gateway = new APIGateway(serviceRegistry);

// Configure load balancing
gateway.setLoadBalancingStrategy('round-robin');

// Set rate limits
gateway.setRateLimit(100, 60000); // 100 requests per minute

// Route requests
const response = await gateway.routeRequest('/api/calculations/duct-size', {
  method: 'POST',
  body: JSON.stringify({ airflow: 2000, velocity: 1200 })
});
```

## React Hook Integration

### useMicroservices Hook

```typescript
import { useMicroservices } from '@/lib/hooks/useMicroservices';

function ServiceManagementComponent() {
  const {
    discoverServices,
    callService,
    routeRequest,
    getServiceHealth,
    setLoadBalancingStrategy,
    serviceMetrics,
    gatewayMetrics,
    systemHealth,
    isInitialized,
    error
  } = useMicroservices({
    enableHealthMonitoring: true,
    healthCheckInterval: 30000,
    enableCircuitBreaker: true,
    loadBalancingStrategy: 'least-connections'
  });

  const handleCalculation = async () => {
    try {
      // Discover available calculation services
      const services = discoverServices({ type: 'calculation' });
      
      if (services.length === 0) {
        throw new Error('No calculation services available');
      }

      // Call service directly
      const result = await callService('hvac-calculation-service', '/api/duct-size', {
        method: 'POST',
        body: JSON.stringify({
          airflow: 2000,
          velocity: 1200,
          frictionFactor: 0.02
        })
      });

      return result;
    } catch (error) {
      console.error('Service call failed:', error);
      throw error;
    }
  };

  return (
    <div>
      <h3>System Health: {systemHealth.status}</h3>
      <p>Healthy Services: {systemHealth.healthyPercentage}%</p>
      <p>Total Services: {systemHealth.totalServices}</p>
      <p>Average Response Time: {serviceMetrics.averageResponseTime}ms</p>
      
      <button onClick={handleCalculation}>
        Perform Calculation
      </button>
    </div>
  );
}
```

## Service Discovery

### Service Registration

```typescript
// Register multiple service instances
const services = [
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
  }
];

services.forEach(service => registry.registerService(service));
```

### Service Discovery Patterns

```typescript
// Discover by service type
const calculationServices = registry.discoverServices({
  type: 'calculation'
});

// Discover by health status
const healthyServices = registry.discoverServices({
  healthStatus: 'healthy'
});

// Discover by region
const eastServices = registry.discoverServices({
  region: 'us-east'
});

// Complex discovery criteria
const availableServices = registry.discoverServices({
  type: 'calculation',
  healthStatus: 'healthy',
  capabilities: ['air-duct-sizing']
});
```

## Health Monitoring

### Automatic Health Checks

```typescript
// Start health monitoring
registry.startHealthMonitoring(30000); // Check every 30 seconds

// Custom health check endpoint
const healthStatus = await registry.checkServiceHealth('hvac-calc-1');
console.log(`Service health: ${healthStatus}`);

// Stop health monitoring
registry.stopHealthMonitoring();
```

### Health Status Types

- **healthy**: Service is responding normally
- **degraded**: Service is responding but with issues
- **unhealthy**: Service is not responding or failing

### Health Check Configuration

```typescript
const healthCheckConfig = {
  endpoint: '/health',
  timeout: 5000,
  retries: 3,
  interval: 30000
};
```

## Circuit Breaker Patterns

### Circuit States

1. **Closed**: Normal operation, requests pass through
2. **Open**: Circuit is open, requests fail immediately
3. **Half-Open**: Testing if service has recovered

### Configuration Options

```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures before opening
  recoveryTimeout: number;     // Time before attempting recovery
  monitoringPeriod: number;    // Period for monitoring failures
  successThreshold?: number;   // Successes needed to close circuit
}
```

### Usage Patterns

```typescript
// Wrap service calls with circuit breaker
const protectedServiceCall = async (serviceId: string, endpoint: string) => {
  const circuitBreaker = getCircuitBreakerForService(serviceId);
  
  return await circuitBreaker.execute(async () => {
    const service = registry.getService(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }
    
    const response = await fetch(`${service.url}${endpoint}`);
    if (!response.ok) {
      throw new Error(`Service call failed: ${response.status}`);
    }
    
    return response.json();
  });
};
```

## Load Balancing Strategies

### Round Robin

Distributes requests evenly across available services.

```typescript
gateway.setLoadBalancingStrategy('round-robin');
```

### Least Connections

Routes requests to the service with the fewest active connections.

```typescript
gateway.setLoadBalancingStrategy('least-connections');
```

### Weighted

Routes requests based on service capacity weights.

```typescript
gateway.setLoadBalancingStrategy('weighted');

// Configure service weights
gateway.setServiceWeight('hvac-calc-1', 3); // Higher capacity
gateway.setServiceWeight('hvac-calc-2', 1); // Lower capacity
```

### Random

Randomly selects from available healthy services.

```typescript
gateway.setLoadBalancingStrategy('random');
```

## Rate Limiting

### Configuration

```typescript
// Set global rate limit
gateway.setRateLimit(1000, 60000); // 1000 requests per minute

// Set per-service rate limits
gateway.setServiceRateLimit('hvac-calc-1', 500, 60000); // 500 requests per minute

// Set per-endpoint rate limits
gateway.setEndpointRateLimit('/api/calculations/complex', 100, 60000);
```

### Rate Limiting Algorithms

- **Token Bucket**: Allows bursts up to bucket capacity
- **Fixed Window**: Fixed number of requests per time window
- **Sliding Window**: More accurate rate limiting with sliding time window

## Error Handling and Resilience

### Retry Strategies

```typescript
const retryConfig = {
  maxRetries: 3,
  backoffStrategy: 'exponential', // 'linear', 'exponential', 'fixed'
  baseDelay: 1000,
  maxDelay: 10000
};

const result = await callServiceWithRetry(serviceId, endpoint, options, retryConfig);
```

### Fallback Mechanisms

```typescript
const callServiceWithFallback = async (primaryService: string, fallbackService: string, endpoint: string) => {
  try {
    return await callService(primaryService, endpoint);
  } catch (primaryError) {
    console.warn(`Primary service ${primaryService} failed, trying fallback:`, primaryError);
    
    try {
      return await callService(fallbackService, endpoint);
    } catch (fallbackError) {
      console.error(`Both primary and fallback services failed:`, fallbackError);
      throw new Error('All services unavailable');
    }
  }
};
```

### Timeout Management

```typescript
const timeoutConfig = {
  connectionTimeout: 5000,  // 5 seconds to establish connection
  requestTimeout: 30000,    // 30 seconds for request completion
  keepAliveTimeout: 60000   // 60 seconds for keep-alive
};
```

## Performance Monitoring

### Metrics Collection

```typescript
// Service registry metrics
const serviceMetrics = registry.getMetrics();
console.log({
  totalServices: serviceMetrics.totalServices,
  healthyServices: serviceMetrics.healthyServices,
  unhealthyServices: serviceMetrics.unhealthyServices,
  averageResponseTime: serviceMetrics.averageResponseTime
});

// API gateway metrics
const gatewayMetrics = gateway.getMetrics();
console.log({
  totalRequests: gatewayMetrics.totalRequests,
  successfulRequests: gatewayMetrics.successfulRequests,
  failedRequests: gatewayMetrics.failedRequests,
  averageResponseTime: gatewayMetrics.averageResponseTime,
  rateLimitedRequests: gatewayMetrics.rateLimitedRequests
});

// Circuit breaker metrics
const circuitMetrics = circuitBreaker.getMetrics();
console.log({
  successCount: circuitMetrics.successCount,
  failureCount: circuitMetrics.failureCount,
  totalRequests: circuitMetrics.totalRequests,
  successRate: circuitMetrics.successRate
});
```

### Performance Dashboard

```typescript
function MicroservicesMonitoringDashboard() {
  const { serviceMetrics, gatewayMetrics, systemHealth } = useMicroservices();

  return (
    <div className="monitoring-dashboard">
      <div className="metric-card">
        <h3>System Health</h3>
        <div className={`status-indicator ${systemHealth.status}`}>
          {systemHealth.status.toUpperCase()}
        </div>
        <p>Healthy: {systemHealth.healthyPercentage}%</p>
        <p>Total Services: {systemHealth.totalServices}</p>
      </div>

      <div className="metric-card">
        <h3>Request Metrics</h3>
        <p>Total Requests: {gatewayMetrics.totalRequests}</p>
        <p>Success Rate: {((gatewayMetrics.successfulRequests / gatewayMetrics.totalRequests) * 100).toFixed(1)}%</p>
        <p>Avg Response Time: {gatewayMetrics.averageResponseTime}ms</p>
      </div>

      <div className="metric-card">
        <h3>Service Performance</h3>
        <p>Healthy Services: {serviceMetrics.healthyServices}</p>
        <p>Unhealthy Services: {serviceMetrics.unhealthyServices}</p>
        <p>Avg Response Time: {serviceMetrics.averageResponseTime}ms</p>
      </div>
    </div>
  );
}
```

## Best Practices

### Service Design

1. **Stateless Services**: Design services to be stateless for better scalability
2. **Health Endpoints**: Implement comprehensive health check endpoints
3. **Graceful Degradation**: Handle partial failures gracefully
4. **Idempotency**: Ensure operations can be safely retried

### Configuration Management

```typescript
// Environment-specific configuration
const microservicesConfig = {
  development: {
    healthCheckInterval: 10000,
    circuitBreakerThreshold: 3,
    requestTimeout: 10000
  },
  production: {
    healthCheckInterval: 30000,
    circuitBreakerThreshold: 5,
    requestTimeout: 5000
  }
};
```

### Security Considerations

```typescript
// Add authentication headers
const authenticatedRequest = async (endpoint: string, options: RequestInit) => {
  const token = await getAuthToken();
  
  return await routeRequest(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
```

## Troubleshooting

### Common Issues

1. **Service Discovery Failures**: Check service registration and network connectivity
2. **Circuit Breaker Stuck Open**: Review failure thresholds and recovery timeouts
3. **Load Balancing Issues**: Verify service health and capacity settings
4. **Rate Limiting**: Monitor request patterns and adjust limits

### Debug Mode

```typescript
const { enableDebugMode, getDebugInfo } = useMicroservices();

// Enable debug logging
enableDebugMode(true);

// Get debug information
const debugInfo = getDebugInfo();
console.log('Service registry state:', debugInfo.serviceRegistry);
console.log('Circuit breaker states:', debugInfo.circuitBreakers);
console.log('Gateway routing table:', debugInfo.routingTable);
```

## Related Documentation

- [Genuine Enhancements Integration Guide](./GENUINE_ENHANCEMENTS_INTEGRATION_GUIDE.md)
- [Advanced Caching API Reference](./ADVANCED_CACHING_API.md)
- [WebAssembly Integration Assessment](../architecture/WEBASSEMBLY_INTEGRATION_ASSESSMENT.md)
