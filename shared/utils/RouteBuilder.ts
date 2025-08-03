/**
 * API Route Builder Utility
 * 
 * Consolidates route configuration logic that was duplicated across
 * ServiceRegistry, backend routes, and API configuration files.
 */

export interface RouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  serviceName: string;
  targetPath?: string;
  authentication?: boolean;
  timeout?: number;
  rateLimit?: {
    requests: number;
    window: number; // in milliseconds
  };
  caching?: {
    enabled: boolean;
    ttl?: number; // in seconds
    key?: string;
  };
  validation?: {
    schema?: string;
    required?: boolean;
  };
  middleware?: string[];
  description?: string;
}

export interface RouteSet {
  name: string;
  baseUrl: string;
  routes: RouteConfig[];
  defaultConfig?: Partial<RouteConfig>;
}

export interface RouteGroup {
  prefix: string;
  routes: RouteConfig[];
  middleware?: string[];
  authentication?: boolean;
}

/**
 * Route Builder for creating standardized API route configurations
 */
export class RouteBuilder {
  
  /**
   * Create HVAC calculation route with standard configuration
   */
  static createHVACRoute(
    endpoint: string, 
    options: Partial<RouteConfig> = {}
  ): RouteConfig {
    const defaults: Partial<RouteConfig> = {
      method: 'POST',
      serviceName: 'hvac-calculation',
      authentication: true,
      timeout: 15000,
      rateLimit: { requests: 100, window: 60000 }, // 100 requests per minute
      caching: { enabled: true, ttl: 3600 }, // 1 hour cache
      validation: { required: true },
      middleware: ['input_validator', 'rate_limiter']
    };

    return {
      path: `/api/calculations/${endpoint}`,
      targetPath: `/api/calculations/${endpoint}`,
      description: `HVAC ${endpoint} calculation endpoint`,
      ...defaults,
      ...options
    };
  }

  /**
   * Create project management route with standard configuration
   */
  static createProjectRoute(
    endpoint: string,
    method: RouteConfig['method'] = 'GET',
    options: Partial<RouteConfig> = {}
  ): RouteConfig {
    const defaults: Partial<RouteConfig> = {
      serviceName: 'project-management',
      authentication: true,
      timeout: 10000,
      rateLimit: { requests: 200, window: 60000 }, // 200 requests per minute
      middleware: ['auth_validator']
    };

    // Different defaults based on method
    if (method === 'GET') {
      defaults.caching = { enabled: true, ttl: 1800 }; // 30 minutes
    } else {
      defaults.validation = { required: true };
    }

    return {
      path: `/api/projects${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`,
      method,
      description: `Project ${method.toLowerCase()} endpoint for ${endpoint}`,
      ...defaults,
      ...options
    };
  }

  /**
   * Create authentication route with standard configuration
   */
  static createAuthRoute(
    endpoint: string,
    options: Partial<RouteConfig> = {}
  ): RouteConfig {
    const defaults: Partial<RouteConfig> = {
      method: 'POST',
      serviceName: 'authentication',
      authentication: false, // Auth routes don't require auth
      timeout: 5000,
      rateLimit: { requests: 10, window: 60000 }, // 10 requests per minute (stricter)
      validation: { required: true },
      middleware: ['input_validator', 'rate_limiter', 'security_headers']
    };

    return {
      path: `/api/auth/${endpoint}`,
      targetPath: `/api/auth/${endpoint}`,
      description: `Authentication ${endpoint} endpoint`,
      ...defaults,
      ...options
    };
  }

  /**
   * Create file upload route with standard configuration
   */
  static createUploadRoute(
    endpoint: string,
    options: Partial<RouteConfig> = {}
  ): RouteConfig {
    const defaults: Partial<RouteConfig> = {
      method: 'POST',
      serviceName: 'file-management',
      authentication: true,
      timeout: 30000, // Longer timeout for uploads
      rateLimit: { requests: 20, window: 60000 }, // 20 uploads per minute
      middleware: ['auth_validator', 'file_validator', 'virus_scanner']
    };

    return {
      path: `/api/upload/${endpoint}`,
      targetPath: `/api/upload/${endpoint}`,
      description: `File upload endpoint for ${endpoint}`,
      ...defaults,
      ...options
    };
  }

  /**
   * Build a complete route set with multiple routes
   */
  static buildRouteSet(
    name: string,
    baseUrl: string,
    routes: RouteConfig[],
    defaultConfig?: Partial<RouteConfig>
  ): RouteSet {
    const processedRoutes = routes.map(route => ({
      ...defaultConfig,
      ...route
    }));

    return {
      name,
      baseUrl,
      routes: processedRoutes,
      defaultConfig
    };
  }

  /**
   * Create route group with shared configuration
   */
  static createRouteGroup(
    prefix: string,
    routes: Omit<RouteConfig, 'path'>[],
    groupConfig: {
      middleware?: string[];
      authentication?: boolean;
      rateLimit?: RouteConfig['rateLimit'];
    } = {}
  ): RouteGroup {
    const processedRoutes: RouteConfig[] = routes.map(route => ({
      ...route,
      path: `${prefix}${route.targetPath || ''}`,
      middleware: [...(groupConfig.middleware || []), ...(route.middleware || [])],
      authentication: groupConfig.authentication ?? route.authentication,
      rateLimit: groupConfig.rateLimit || route.rateLimit
    }));

    return {
      prefix,
      routes: processedRoutes,
      middleware: groupConfig.middleware,
      authentication: groupConfig.authentication
    };
  }

  /**
   * Generate Express.js route handlers from route configuration
   */
  static generateExpressRoutes(routes: RouteConfig[]): string {
    return routes.map(route => {
      const middlewareStr = route.middleware?.map(m => `${m}, `).join('') || '';
      const authStr = route.authentication ? 'authenticate, ' : '';
      const validationStr = route.validation?.required ? `validate('${route.validation.schema || 'default'}'), ` : '';
      
      return `router.${route.method.toLowerCase()}('${route.path}', ${authStr}${middlewareStr}${validationStr}handler);`;
    }).join('\n');
  }

  /**
   * Generate OpenAPI/Swagger documentation from routes
   */
  static generateOpenAPISpec(routeSet: RouteSet): object {
    const paths: Record<string, any> = {};

    routeSet.routes.forEach(route => {
      if (!paths[route.path]) {
        paths[route.path] = {};
      }

      paths[route.path][route.method.toLowerCase()] = {
        summary: route.description || `${route.method} ${route.path}`,
        tags: [route.serviceName],
        security: route.authentication ? [{ bearerAuth: [] }] : [],
        parameters: route.method === 'GET' ? [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 10 }
          }
        ] : [],
        requestBody: ['POST', 'PUT', 'PATCH'].includes(route.method) ? {
          required: route.validation?.required || false,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${route.validation?.schema || 'DefaultRequest'}` }
            }
          }
        } : undefined,
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' }
        }
      };
    });

    return {
      openapi: '3.0.0',
      info: {
        title: `${routeSet.name} API`,
        version: '1.0.0'
      },
      servers: [{ url: routeSet.baseUrl }],
      paths
    };
  }
}

/**
 * Pre-defined route configurations for common SizeWise services
 */
export const StandardRoutes = {
  /**
   * HVAC calculation routes
   */
  hvac: [
    RouteBuilder.createHVACRoute('air-duct'),
    RouteBuilder.createHVACRoute('grease-duct'),
    RouteBuilder.createHVACRoute('engine-exhaust'),
    RouteBuilder.createHVACRoute('boiler-vent'),
    RouteBuilder.createHVACRoute('load-calculation', {
      timeout: 20000, // Longer timeout for complex calculations
      rateLimit: { requests: 50, window: 60000 }
    })
  ],

  /**
   * Project management routes
   */
  projects: [
    RouteBuilder.createProjectRoute('', 'GET'), // List projects
    RouteBuilder.createProjectRoute('', 'POST'), // Create project
    RouteBuilder.createProjectRoute('/:id', 'GET'), // Get project
    RouteBuilder.createProjectRoute('/:id', 'PUT'), // Update project
    RouteBuilder.createProjectRoute('/:id', 'DELETE'), // Delete project
    RouteBuilder.createProjectRoute('/:id/rooms', 'GET'), // Get project rooms
    RouteBuilder.createProjectRoute('/:id/segments', 'GET') // Get project segments
  ],

  /**
   * Authentication routes
   */
  auth: [
    RouteBuilder.createAuthRoute('login'),
    RouteBuilder.createAuthRoute('register'),
    RouteBuilder.createAuthRoute('refresh'),
    RouteBuilder.createAuthRoute('logout'),
    RouteBuilder.createAuthRoute('forgot-password'),
    RouteBuilder.createAuthRoute('reset-password')
  ],

  /**
   * File management routes
   */
  files: [
    RouteBuilder.createUploadRoute('pdf'),
    RouteBuilder.createUploadRoute('image'),
    RouteBuilder.createUploadRoute('3d-model'),
    RouteBuilder.createProjectRoute('/files', 'GET', { serviceName: 'file-management' }),
    RouteBuilder.createProjectRoute('/files/:id', 'DELETE', { serviceName: 'file-management' })
  ]
};

/**
 * Route validation utilities
 */
export const RouteValidation = {
  /**
   * Validate route configuration
   */
  validateRoute: (route: RouteConfig): string[] => {
    const errors: string[] = [];

    if (!route.path) errors.push('Path is required');
    if (!route.method) errors.push('Method is required');
    if (!route.serviceName) errors.push('Service name is required');
    
    if (route.path && !route.path.startsWith('/')) {
      errors.push('Path must start with /');
    }

    if (route.rateLimit) {
      if (route.rateLimit.requests <= 0) errors.push('Rate limit requests must be positive');
      if (route.rateLimit.window <= 0) errors.push('Rate limit window must be positive');
    }

    if (route.timeout && route.timeout <= 0) {
      errors.push('Timeout must be positive');
    }

    return errors;
  },

  /**
   * Validate route set
   */
  validateRouteSet: (routeSet: RouteSet): string[] => {
    const errors: string[] = [];

    if (!routeSet.name) errors.push('Route set name is required');
    if (!routeSet.baseUrl) errors.push('Base URL is required');

    routeSet.routes.forEach((route, index) => {
      const routeErrors = RouteValidation.validateRoute(route);
      routeErrors.forEach(error => {
        errors.push(`Route ${index}: ${error}`);
      });
    });

    return errors;
  }
};
