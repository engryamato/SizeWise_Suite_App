/**
 * Snap Logic Application Coordinator
 * SizeWise Suite - Architectural Refactoring Priority Group
 * 
 * Main application coordinator that orchestrates all snap logic services
 * using dependency injection and clean architecture principles. Replaces
 * the monolithic SnapLogicSystem with a modular, maintainable approach.
 * 
 * @fileoverview Snap logic application coordinator
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import {
  IDependencyContainer,
  IConfigurationService,
  IEventBus,
  ISnapDetectionService,
  IDrawingService,
  IService,
  ServiceStatus,
  ILogger,
  IHealthCheck,
  HealthCheckResult
} from '../core/interfaces';

import { DependencyContainer, ContainerBuilder } from '../infrastructure/DependencyContainer';
import { ConfigurationService } from '../infrastructure/ConfigurationService';
import { SnapDetectionService } from '../services/SnapDetectionService';
import { DrawingService } from '../services/DrawingService';

/**
 * Application configuration interface
 */
export interface ISnapLogicApplicationConfig {
  enableSnapDetection: boolean;
  enableDrawing: boolean;
  enablePerformanceMonitoring: boolean;
  enableDebugMode: boolean;
  configurationProviders: string[];
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Default application configuration
 */
const DEFAULT_APP_CONFIG: ISnapLogicApplicationConfig = {
  enableSnapDetection: true,
  enableDrawing: true,
  enablePerformanceMonitoring: true,
  enableDebugMode: false,
  configurationProviders: ['memory'],
  logLevel: 'info'
};

/**
 * Application health check
 */
class SnapLogicHealthCheck implements IHealthCheck {
  constructor(
    private container: IDependencyContainer,
    private configService: IConfigurationService
  ) {}

  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check container health
      const containerStats = this.container.getStatistics();
      if (containerStats.errorCount > 0) {
        return {
          name: 'SnapLogicApplication',
          status: 'unhealthy',
          message: `Container has ${containerStats.errorCount} errors`,
          timestamp: Date.now(),
          duration: Date.now() - startTime
        };
      }

      // Check configuration service
      const configMetadata = this.configService.getMetadata();
      if (!configMetadata) {
        return {
          name: 'SnapLogicApplication',
          status: 'unhealthy',
          message: 'Configuration service not available',
          timestamp: Date.now(),
          duration: Date.now() - startTime
        };
      }

      // Check core services
      const snapService = this.container.tryResolve<ISnapDetectionService>('snapDetectionService');
      const drawingService = this.container.tryResolve<IDrawingService>('drawingService');

      if (!snapService || !drawingService) {
        return {
          name: 'SnapLogicApplication',
          status: 'degraded',
          message: 'Some core services are not available',
          timestamp: Date.now(),
          duration: Date.now() - startTime
        };
      }

      return {
        name: 'SnapLogicApplication',
        status: 'healthy',
        message: 'All systems operational',
        data: {
          containerStats,
          configMetadata,
          servicesAvailable: {
            snapDetection: !!snapService,
            drawing: !!drawingService
          }
        },
        timestamp: Date.now(),
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        name: 'SnapLogicApplication',
        status: 'unhealthy',
        message: `Health check failed: ${(error as Error).message}`,
        timestamp: Date.now(),
        duration: Date.now() - startTime
      };
    }
  }

  getName(): string {
    return 'SnapLogicApplication';
  }
}

/**
 * Main snap logic application coordinator
 */
export class SnapLogicApplication implements IService {
  private container: IDependencyContainer;
  private configService: IConfigurationService;
  private eventBus: IEventBus;
  private logger: ILogger;
  private healthCheck: IHealthCheck;
  private status: ServiceStatus = ServiceStatus.UNINITIALIZED;
  private config: ISnapLogicApplicationConfig;

  constructor(config?: Partial<ISnapLogicApplicationConfig>) {
    this.config = { ...DEFAULT_APP_CONFIG, ...config };
    this.container = new DependencyContainer();
    this.logger = console as any; // Simplified logger for demo
  }

  async initialize(): Promise<void> {
    try {
      this.status = ServiceStatus.INITIALIZING;
      this.logger.info('Initializing Snap Logic Application...');

      // Initialize configuration service
      await this.initializeConfiguration();

      // Set up dependency injection container
      await this.setupDependencyInjection();

      // Initialize event bus
      await this.initializeEventBus();

      // Initialize core services
      await this.initializeCoreServices();

      // Set up health check
      this.healthCheck = new SnapLogicHealthCheck(this.container, this.configService);

      this.status = ServiceStatus.INITIALIZED;
      this.logger.info('Snap Logic Application initialized successfully');

    } catch (error) {
      this.status = ServiceStatus.ERROR;
      this.logger.error('Failed to initialize Snap Logic Application:', error as Error);
      throw error;
    }
  }

  async start(): Promise<void> {
    try {
      if (this.status !== ServiceStatus.INITIALIZED) {
        throw new Error('Application must be initialized before starting');
      }

      this.status = ServiceStatus.STARTING;
      this.logger.info('Starting Snap Logic Application...');

      // Start all registered services
      const services = this.container.resolveByTag<IService>('service');
      for (const service of services) {
        if (service.getStatus() === ServiceStatus.INITIALIZED) {
          await service.start();
        }
      }

      this.status = ServiceStatus.RUNNING;
      this.logger.info('Snap Logic Application started successfully');

    } catch (error) {
      this.status = ServiceStatus.ERROR;
      this.logger.error('Failed to start Snap Logic Application:', error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      this.status = ServiceStatus.STOPPING;
      this.logger.info('Stopping Snap Logic Application...');

      // Stop all registered services
      const services = this.container.resolveByTag<IService>('service');
      for (const service of services) {
        if (service.getStatus() === ServiceStatus.RUNNING) {
          await service.stop();
        }
      }

      this.status = ServiceStatus.STOPPED;
      this.logger.info('Snap Logic Application stopped successfully');

    } catch (error) {
      this.status = ServiceStatus.ERROR;
      this.logger.error('Failed to stop Snap Logic Application:', error as Error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    try {
      if (this.status === ServiceStatus.RUNNING) {
        await this.stop();
      }

      // Dispose of all services
      const services = this.container.resolveByTag<IService>('service');
      for (const service of services) {
        await service.dispose();
      }

      // Dispose of container
      this.container.dispose();

      this.status = ServiceStatus.DISPOSED;
      this.logger.info('Snap Logic Application disposed successfully');

    } catch (error) {
      this.logger.error('Error during disposal:', error as Error);
    }
  }

  getStatus(): ServiceStatus {
    return this.status;
  }

  getName(): string {
    return 'SnapLogicApplication';
  }

  getVersion(): string {
    return '2.0.0';
  }

  /**
   * Get dependency injection container
   */
  getContainer(): IDependencyContainer {
    return this.container;
  }

  /**
   * Get configuration service
   */
  getConfigurationService(): IConfigurationService {
    return this.configService;
  }

  /**
   * Get event bus
   */
  getEventBus(): IEventBus {
    return this.eventBus;
  }

  /**
   * Get snap detection service
   */
  getSnapDetectionService(): ISnapDetectionService {
    return this.container.resolve<ISnapDetectionService>('snapDetectionService');
  }

  /**
   * Get drawing service
   */
  getDrawingService(): IDrawingService {
    return this.container.resolve<IDrawingService>('drawingService');
  }

  /**
   * Get health check
   */
  getHealthCheck(): IHealthCheck {
    return this.healthCheck;
  }

  /**
   * Get application statistics
   */
  getStatistics(): {
    status: ServiceStatus;
    uptime: number;
    containerStats: any;
    configMetadata: any;
    healthStatus: string;
  } {
    return {
      status: this.status,
      uptime: Date.now(), // Simplified uptime calculation
      containerStats: this.container.getStatistics(),
      configMetadata: this.configService.getMetadata(),
      healthStatus: 'unknown' // Would be populated by health check
    };
  }

  // Private initialization methods
  private async initializeConfiguration(): Promise<void> {
    // Create configuration providers based on config
    const providers: any[] = []; // Simplified for demo
    
    this.configService = new ConfigurationService(providers);
    await this.configService.initialize('development' as any);
  }

  private async setupDependencyInjection(): Promise<void> {
    const builder = new ContainerBuilder();

    // Register configuration service
    builder.addInstance('configurationService', this.configService);

    // Register logger
    builder.addInstance('logger', this.logger);

    // Register core services
    if (this.config.enableSnapDetection) {
      builder.addTransient('snapDetectionService', SnapDetectionService);
    }

    if (this.config.enableDrawing) {
      builder.addTransient('drawingService', DrawingService);
    }

    // Build container
    this.container = builder.build();
  }

  private async initializeEventBus(): Promise<void> {
    // Create event bus (simplified implementation)
    this.eventBus = {
      subscribe: () => ({ id: '', eventType: '', handler: () => {}, unsubscribe: () => {} } as any),
      unsubscribe: () => false,
      publish: async () => ({ eventId: '', success: true, handlerCount: 0, successfulHandlers: 0, failedHandlers: 0, errors: [], publishTime: 0, totalTime: 0 }),
      emit: async () => ({ eventId: '', success: true, handlerCount: 0, successfulHandlers: 0, failedHandlers: 0, errors: [], publishTime: 0, totalTime: 0 }),
      hasSubscribers: () => false,
      getSubscriberCount: () => 0,
      dispose: () => {}
    } as any;

    // Register event bus in container
    this.container.registerInstance('eventBus', this.eventBus);
  }

  private async initializeCoreServices(): Promise<void> {
    // Initialize services that implement IService interface
    const services = this.container.resolveByTag<IService>('service');
    
    for (const service of services) {
      await service.initialize();
    }
  }
}

/**
 * Application factory for creating configured instances
 */
export class SnapLogicApplicationFactory {
  /**
   * Create application with default configuration
   */
  static createDefault(): SnapLogicApplication {
    return new SnapLogicApplication();
  }

  /**
   * Create application with custom configuration
   */
  static createWithConfig(config: Partial<ISnapLogicApplicationConfig>): SnapLogicApplication {
    return new SnapLogicApplication(config);
  }

  /**
   * Create application for development environment
   */
  static createForDevelopment(): SnapLogicApplication {
    return new SnapLogicApplication({
      enableDebugMode: true,
      logLevel: 'debug',
      enablePerformanceMonitoring: true
    });
  }

  /**
   * Create application for production environment
   */
  static createForProduction(): SnapLogicApplication {
    return new SnapLogicApplication({
      enableDebugMode: false,
      logLevel: 'warn',
      enablePerformanceMonitoring: true
    });
  }

  /**
   * Create application for testing environment
   */
  static createForTesting(): SnapLogicApplication {
    return new SnapLogicApplication({
      enableDebugMode: true,
      logLevel: 'error',
      enablePerformanceMonitoring: false
    });
  }
}
