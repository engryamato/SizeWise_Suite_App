/**
 * Service Registry for SizeWise Suite
 * 
 * Implements microservices preparation with:
 * - Service discovery and registration
 * - Health monitoring and status tracking
 * - Load balancing and failover
 * - Circuit breaker patterns
 * - API gateway preparation
 * - Service mesh readiness
 */

// =============================================================================
// Service Registry Types and Interfaces
// =============================================================================

export interface ServiceEndpoint {
  id: string;
  name: string;
  version: string;
  url: string;
  protocol: 'http' | 'https' | 'ws' | 'wss';
  port?: number;
  path?: string;
  health: ServiceHealth;
  metadata: ServiceMetadata;
  lastHeartbeat: Date;
  registeredAt: Date;
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  uptime: number;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  timestamp: Date;
  duration: number;
}

export interface ServiceMetadata {
  tags: string[];
  environment: 'development' | 'staging' | 'production';
  region?: string;
  datacenter?: string;
  capabilities: string[];
  dependencies: string[];
  resources: {
    cpu: number;
    memory: number;
    storage: number;
  };
}

export interface ServiceRegistryConfig {
  healthCheckInterval: number;
  heartbeatTimeout: number;
  maxRetries: number;
  circuitBreakerThreshold: number;
  loadBalancingStrategy: 'round-robin' | 'least-connections' | 'weighted' | 'random';
  enableMetrics: boolean;
  enableTracing: boolean;
}

// =============================================================================
// Circuit Breaker Implementation
// =============================================================================

export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private nextAttempt = 0;

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private monitoringPeriod: number = 10000 // 10 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'half-open';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'half-open') {
      this.state = 'closed';
    }
    this.successCount++;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }

  getState(): string {
    return this.state;
  }

  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// =============================================================================
// Service Registry Implementation
// =============================================================================

export class ServiceRegistry {
  private services = new Map<string, ServiceEndpoint>();
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private healthCheckInterval?: NodeJS.Timeout;
  private config: ServiceRegistryConfig;
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    circuitBreakerTrips: 0
  };

  constructor(config: Partial<ServiceRegistryConfig> = {}) {
    this.config = {
      healthCheckInterval: 30000, // 30 seconds
      heartbeatTimeout: 60000, // 1 minute
      maxRetries: 3,
      circuitBreakerThreshold: 5,
      loadBalancingStrategy: 'round-robin',
      enableMetrics: true,
      enableTracing: false,
      ...config
    };

    this.startHealthChecking();
    this.registerCoreServices();
  }

  // =============================================================================
  // Service Registration and Discovery
  // =============================================================================

  registerService(service: Omit<ServiceEndpoint, 'registeredAt' | 'lastHeartbeat'>): void {
    const endpoint: ServiceEndpoint = {
      ...service,
      registeredAt: new Date(),
      lastHeartbeat: new Date()
    };

    this.services.set(service.id, endpoint);
    this.circuitBreakers.set(service.id, new CircuitBreaker(
      this.config.circuitBreakerThreshold,
      60000, // 1 minute timeout
      10000  // 10 second monitoring
    ));

    console.log(`Service registered: ${service.name} (${service.id})`);
  }

  unregisterService(serviceId: string): void {
    this.services.delete(serviceId);
    this.circuitBreakers.delete(serviceId);
    console.log(`Service unregistered: ${serviceId}`);
  }

  discoverServices(serviceName?: string, tags?: string[]): ServiceEndpoint[] {
    const allServices = Array.from(this.services.values());
    
    let filtered = allServices;
    
    if (serviceName) {
      filtered = filtered.filter(service => service.name === serviceName);
    }
    
    if (tags && tags.length > 0) {
      filtered = filtered.filter(service => 
        tags.every(tag => service.metadata.tags.includes(tag))
      );
    }
    
    // Filter out unhealthy services
    return filtered.filter(service => 
      service.health.status === 'healthy' || service.health.status === 'degraded'
    );
  }

  getService(serviceId: string): ServiceEndpoint | undefined {
    return this.services.get(serviceId);
  }

  // =============================================================================
  // Load Balancing and Service Selection
  // =============================================================================

  selectService(serviceName: string, tags?: string[]): ServiceEndpoint | null {
    const availableServices = this.discoverServices(serviceName, tags);
    
    if (availableServices.length === 0) {
      return null;
    }

    switch (this.config.loadBalancingStrategy) {
      case 'round-robin':
        return this.roundRobinSelection(availableServices);
      case 'least-connections':
        return this.leastConnectionsSelection(availableServices);
      case 'weighted':
        return this.weightedSelection(availableServices);
      case 'random':
        return this.randomSelection(availableServices);
      default:
        return availableServices[0];
    }
  }

  private roundRobinSelection(services: ServiceEndpoint[]): ServiceEndpoint {
    // Simple round-robin implementation
    const index = this.metrics.totalRequests % services.length;
    return services[index];
  }

  private leastConnectionsSelection(services: ServiceEndpoint[]): ServiceEndpoint {
    // For now, select based on response time as a proxy for connections
    return services.reduce((best, current) => 
      current.health.responseTime < best.health.responseTime ? current : best
    );
  }

  private weightedSelection(services: ServiceEndpoint[]): ServiceEndpoint {
    // Weight based on health status and response time
    const weights = services.map(service => {
      let weight = 1;
      if (service.health.status === 'healthy') weight *= 2;
      if (service.health.responseTime < 100) weight *= 1.5;
      return weight;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < services.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return services[i];
      }
    }

    return services[0];
  }

  private randomSelection(services: ServiceEndpoint[]): ServiceEndpoint {
    const index = Math.floor(Math.random() * services.length);
    return services[index];
  }

  // =============================================================================
  // Circuit Breaker Integration
  // =============================================================================

  async callService<T>(
    serviceId: string,
    operation: (endpoint: ServiceEndpoint) => Promise<T>
  ): Promise<T> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    const circuitBreaker = this.circuitBreakers.get(serviceId);
    if (!circuitBreaker) {
      throw new Error(`Circuit breaker not found for service: ${serviceId}`);
    }

    this.metrics.totalRequests++;
    const startTime = Date.now();

    try {
      const result = await circuitBreaker.execute(() => operation(service));
      
      this.metrics.successfulRequests++;
      this.updateResponseTime(Date.now() - startTime);
      this.updateServiceHealth(serviceId, true, Date.now() - startTime);
      
      return result;
    } catch (error) {
      this.metrics.failedRequests++;
      this.updateServiceHealth(serviceId, false, Date.now() - startTime);
      
      if (circuitBreaker.getState() === 'open') {
        this.metrics.circuitBreakerTrips++;
      }
      
      throw error;
    }
  }

  // =============================================================================
  // Health Monitoring
  // =============================================================================

  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [serviceId, service] of this.services) {
        await this.performHealthCheck(serviceId, service);
      }
    }, this.config.healthCheckInterval);
  }

  private async performHealthCheck(serviceId: string, service: ServiceEndpoint): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Perform actual health check (simplified for demo)
      const response = await this.pingService(service);
      const duration = Date.now() - startTime;
      
      const healthCheck: HealthCheck = {
        name: 'ping',
        status: response ? 'pass' : 'fail',
        message: response ? 'Service responding' : 'Service not responding',
        timestamp: new Date(),
        duration
      };

      this.updateServiceHealthStatus(serviceId, healthCheck);
      
    } catch (error) {
      const healthCheck: HealthCheck = {
        name: 'ping',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        duration: Date.now() - startTime
      };

      this.updateServiceHealthStatus(serviceId, healthCheck);
    }
  }

  private async pingService(service: ServiceEndpoint): Promise<boolean> {
    // Simplified ping implementation
    // In a real implementation, this would make an actual HTTP request
    try {
      const url = `${service.protocol}://${service.url}${service.path || '/health'}`;
      const response = await fetch(url, { 
        method: 'GET',
        timeout: 5000 
      } as any);
      return response.ok;
    } catch {
      return false;
    }
  }

  private updateServiceHealth(serviceId: string, success: boolean, responseTime: number): void {
    const service = this.services.get(serviceId);
    if (!service) return;

    service.health.responseTime = responseTime;
    service.health.lastCheck = new Date();
    service.lastHeartbeat = new Date();

    if (success) {
      service.health.errorRate = Math.max(0, service.health.errorRate - 0.1);
    } else {
      service.health.errorRate = Math.min(1, service.health.errorRate + 0.1);
    }

    // Update health status based on error rate
    if (service.health.errorRate < 0.1) {
      service.health.status = 'healthy';
    } else if (service.health.errorRate < 0.5) {
      service.health.status = 'degraded';
    } else {
      service.health.status = 'unhealthy';
    }
  }

  private updateServiceHealthStatus(serviceId: string, healthCheck: HealthCheck): void {
    const service = this.services.get(serviceId);
    if (!service) return;

    service.health.checks = [healthCheck, ...service.health.checks.slice(0, 9)]; // Keep last 10 checks
    service.health.lastCheck = healthCheck.timestamp;
    service.lastHeartbeat = new Date();

    // Update overall health status
    const recentChecks = service.health.checks.slice(0, 5);
    const failedChecks = recentChecks.filter(check => check.status === 'fail').length;
    
    if (failedChecks === 0) {
      service.health.status = 'healthy';
    } else if (failedChecks < 3) {
      service.health.status = 'degraded';
    } else {
      service.health.status = 'unhealthy';
    }
  }

  private updateResponseTime(responseTime: number): void {
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime + responseTime) / 2;
  }

  // =============================================================================
  // Core Services Registration
  // =============================================================================

  private registerCoreServices(): void {
    // Register core SizeWise services for microservices preparation
    
    // HVAC Calculation Service
    this.registerService({
      id: 'hvac-calc-service',
      name: 'hvac-calculation',
      version: '1.0.0',
      url: 'localhost',
      protocol: 'http',
      port: 3001,
      path: '/api/calculations',
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 50,
        errorRate: 0,
        uptime: 100,
        checks: []
      },
      metadata: {
        tags: ['calculation', 'hvac', 'core'],
        environment: 'development',
        capabilities: ['air-duct-sizing', 'load-calculation', 'energy-analysis'],
        dependencies: ['database-service'],
        resources: {
          cpu: 0.5,
          memory: 512,
          storage: 100
        }
      }
    });

    // Project Management Service
    this.registerService({
      id: 'project-mgmt-service',
      name: 'project-management',
      version: '1.0.0',
      url: 'localhost',
      protocol: 'http',
      port: 3002,
      path: '/api/projects',
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 30,
        errorRate: 0,
        uptime: 100,
        checks: []
      },
      metadata: {
        tags: ['project', 'management', 'core'],
        environment: 'development',
        capabilities: ['project-crud', 'collaboration', 'version-control'],
        dependencies: ['database-service', 'auth-service'],
        resources: {
          cpu: 0.3,
          memory: 256,
          storage: 500
        }
      }
    });

    // Database Service
    this.registerService({
      id: 'database-service',
      name: 'database',
      version: '1.0.0',
      url: 'localhost',
      protocol: 'http',
      port: 3003,
      path: '/api/data',
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 20,
        errorRate: 0,
        uptime: 100,
        checks: []
      },
      metadata: {
        tags: ['database', 'storage', 'infrastructure'],
        environment: 'development',
        capabilities: ['postgresql', 'mongodb', 'caching'],
        dependencies: [],
        resources: {
          cpu: 1.0,
          memory: 1024,
          storage: 2000
        }
      }
    });
  }

  // =============================================================================
  // Public API
  // =============================================================================

  getMetrics() {
    return {
      ...this.metrics,
      registeredServices: this.services.size,
      healthyServices: Array.from(this.services.values())
        .filter(s => s.health.status === 'healthy').length,
      circuitBreakers: Array.from(this.circuitBreakers.entries())
        .map(([id, cb]) => ({ serviceId: id, ...cb.getMetrics() }))
    };
  }

  getAllServices(): ServiceEndpoint[] {
    return Array.from(this.services.values());
  }

  getServiceHealth(serviceId: string): ServiceHealth | undefined {
    return this.services.get(serviceId)?.health;
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

// =============================================================================
// API Gateway for Microservices
// =============================================================================

export interface RouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  serviceName: string;
  targetPath?: string;
  middleware?: string[];
  rateLimit?: {
    requests: number;
    window: number; // in milliseconds
  };
  authentication?: boolean;
  timeout?: number;
}

export interface GatewayMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  rateLimitedRequests: number;
  timeouts: number;
}

export class APIGateway {
  private routes = new Map<string, RouteConfig>();
  private serviceRegistry: ServiceRegistry;
  private rateLimiters = new Map<string, { count: number; resetTime: number }>();
  private metrics: GatewayMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    rateLimitedRequests: 0,
    timeouts: 0
  };

  constructor(serviceRegistry: ServiceRegistry) {
    this.serviceRegistry = serviceRegistry;
    this.setupDefaultRoutes();
  }

  // =============================================================================
  // Route Management
  // =============================================================================

  addRoute(route: RouteConfig): void {
    const key = `${route.method}:${route.path}`;
    this.routes.set(key, route);
  }

  removeRoute(method: string, path: string): void {
    const key = `${method}:${path}`;
    this.routes.delete(key);
  }

  // =============================================================================
  // Request Routing and Processing
  // =============================================================================

  async routeRequest(
    method: string,
    path: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Find matching route
      const route = this.findRoute(method, path);
      if (!route) {
        throw new Error(`Route not found: ${method} ${path}`);
      }

      // Apply rate limiting
      if (route.rateLimit && !this.checkRateLimit(route)) {
        this.metrics.rateLimitedRequests++;
        throw new Error('Rate limit exceeded');
      }

      // Select service instance
      const service = this.serviceRegistry.selectService(route.serviceName);
      if (!service) {
        throw new Error(`No healthy service found: ${route.serviceName}`);
      }

      // Execute request with circuit breaker
      const result = await this.serviceRegistry.callService(
        service.id,
        async (endpoint) => {
          return await this.executeRequest(endpoint, route, body, headers);
        }
      );

      this.metrics.successfulRequests++;
      this.updateLatency(Date.now() - startTime);

      return result;

    } catch (error) {
      this.metrics.failedRequests++;
      this.updateLatency(Date.now() - startTime);
      throw error;
    }
  }

  private findRoute(method: string, path: string): RouteConfig | undefined {
    const exactKey = `${method}:${path}`;
    const exactMatch = this.routes.get(exactKey);

    if (exactMatch) {
      return exactMatch;
    }

    // Pattern matching for dynamic routes
    for (const [key, route] of this.routes) {
      if (key.startsWith(`${method}:`)) {
        const routePath = key.substring(method.length + 1);
        if (this.matchPath(routePath, path)) {
          return route;
        }
      }
    }

    return undefined;
  }

  private matchPath(routePath: string, requestPath: string): boolean {
    // Simple pattern matching - can be enhanced with more sophisticated routing
    const routeSegments = routePath.split('/');
    const requestSegments = requestPath.split('/');

    if (routeSegments.length !== requestSegments.length) {
      return false;
    }

    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];
      const requestSegment = requestSegments[i];

      if (routeSegment.startsWith(':')) {
        // Dynamic segment - matches any value
        continue;
      }

      if (routeSegment !== requestSegment) {
        return false;
      }
    }

    return true;
  }

  private checkRateLimit(route: RouteConfig): boolean {
    if (!route.rateLimit) return true;

    const key = `${route.method}:${route.path}`;
    const now = Date.now();
    const limiter = this.rateLimiters.get(key);

    if (!limiter || now > limiter.resetTime) {
      this.rateLimiters.set(key, {
        count: 1,
        resetTime: now + route.rateLimit.window
      });
      return true;
    }

    if (limiter.count >= route.rateLimit.requests) {
      return false;
    }

    limiter.count++;
    return true;
  }

  private async executeRequest(
    endpoint: ServiceEndpoint,
    route: RouteConfig,
    body?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    const targetPath = route.targetPath || route.path;
    const url = `${endpoint.protocol}://${endpoint.url}:${endpoint.port}${targetPath}`;

    const requestOptions: RequestInit = {
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body && route.method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    // Add timeout
    const timeout = route.timeout || 30000; // 30 seconds default
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      this.metrics.timeouts++;
    }, timeout);

    requestOptions.signal = controller.signal;

    try {
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Service error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private updateLatency(latency: number): void {
    this.metrics.averageLatency =
      (this.metrics.averageLatency + latency) / 2;
  }

  // =============================================================================
  // Default Routes Setup
  // =============================================================================

  private setupDefaultRoutes(): void {
    // HVAC Calculation routes
    this.addRoute({
      path: '/api/calculations/air-duct',
      method: 'POST',
      serviceName: 'hvac-calculation',
      targetPath: '/api/calculations/air-duct',
      authentication: true,
      timeout: 10000,
      rateLimit: { requests: 100, window: 60000 } // 100 requests per minute
    });

    this.addRoute({
      path: '/api/calculations/load',
      method: 'POST',
      serviceName: 'hvac-calculation',
      targetPath: '/api/calculations/load',
      authentication: true,
      timeout: 15000,
      rateLimit: { requests: 50, window: 60000 }
    });

    // Project Management routes
    this.addRoute({
      path: '/api/projects',
      method: 'GET',
      serviceName: 'project-management',
      authentication: true,
      rateLimit: { requests: 200, window: 60000 }
    });

    this.addRoute({
      path: '/api/projects',
      method: 'POST',
      serviceName: 'project-management',
      authentication: true,
      rateLimit: { requests: 20, window: 60000 }
    });

    this.addRoute({
      path: '/api/projects/:id',
      method: 'GET',
      serviceName: 'project-management',
      authentication: true,
      rateLimit: { requests: 500, window: 60000 }
    });

    this.addRoute({
      path: '/api/projects/:id',
      method: 'PUT',
      serviceName: 'project-management',
      authentication: true,
      rateLimit: { requests: 50, window: 60000 }
    });

    // Database routes
    this.addRoute({
      path: '/api/data/sync',
      method: 'POST',
      serviceName: 'database',
      authentication: true,
      timeout: 30000,
      rateLimit: { requests: 10, window: 60000 }
    });
  }

  // =============================================================================
  // Public API
  // =============================================================================

  getMetrics(): GatewayMetrics {
    return { ...this.metrics };
  }

  getRoutes(): RouteConfig[] {
    return Array.from(this.routes.values());
  }

  getServiceRegistry(): ServiceRegistry {
    return this.serviceRegistry;
  }
}
