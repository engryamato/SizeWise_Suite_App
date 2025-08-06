/**
 * Core Interfaces Export Module
 * SizeWise Suite - Architectural Refactoring Priority Group
 * 
 * Central export module for all core interfaces defining contracts
 * between modules in the refactored architecture. These interfaces
 * enable loose coupling, better testability, and maintainability.
 * 
 * @fileoverview Core interfaces export module
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

// ===== SNAP DETECTION SERVICE =====
export type {
  ISnapPoint,
  ISnapResult,
  ISnapDetectionConfig,
  ISpatialQueryOptions,
  ISnapDetectionService,
  ISnapDetectionEvent,
  ISnapDetectionEventSubscription,
  ISnapDetectionEventManager,
  ISnapDetectionServiceFactory,
  ISnapDetectionMetrics,
  ISnapDetectionPerformanceMonitor,
  SnapDetectionEventHandler
} from './ISnapDetectionService';

export {
  SnapPointType,
  SnapPriority,
  SnapDetectionEventType
} from './ISnapDetectionService';

// ===== DRAWING SERVICE =====
export type {
  IDrawingValidationResult,
  IDrawingConfig,
  IDrawingContext,
  IDrawingOperationResult,
  IDrawingService,
  IDrawingEvent,
  IDrawingEventSubscription,
  IDrawingEventManager,
  IDrawingServiceFactory,
  IDrawingMetrics,
  IDrawingPerformanceMonitor,
  DrawingEventHandler
} from './IDrawingService';

export {
  DrawingToolType,
  DrawingMode,
  DrawingState,
  DrawingEventType
} from './IDrawingService';

// ===== CONFIGURATION SERVICE =====
export type {
  IConfigurationValidationResult,
  IConfigurationChangeEvent,
  IConfigurationSchema,
  IConfigurationService,
  IConfigurationProvider,
  IFileConfigurationProvider,
  IEnvironmentConfigurationProvider,
  IRemoteConfigurationProvider,
  IConfigurationServiceFactory,
  IConfigurationEvent,
  IConfigurationEventSubscription,
  IConfigurationEventManager,
  IConfigurationCache,
  ConfigurationEventHandler
} from './IConfigurationService';

export {
  ConfigurationEnvironment,
  ValidationSeverity,
  ConfigurationEventType
} from './IConfigurationService';

// ===== DEPENDENCY INJECTION =====
export type {
  IServiceRegistrationOptions,
  IServiceDescriptor,
  IResolutionContext,
  IResolutionResult,
  IDependencyContainer,
  IServiceMetadata,
  IInjectableDecorator,
  IInjectDecorator,
  IConfigurationDecorator,
  IContainerBuilder,
  IContainerModule,
  IContainerFactory,
  IServiceInterceptor,
  IContainerEvent,
  IContainerEventSubscription,
  IContainerEventManager,
  ContainerEventHandler
} from './IDependencyContainer';

export {
  ServiceLifetime,
  ContainerEventType
} from './IDependencyContainer';

// ===== EVENT BUS =====
export type {
  IBaseEvent,
  IEvent,
  IEventSubscriptionOptions,
  IEventSubscription,
  IEventPublicationOptions,
  IEventPublicationResult,
  IEventBus,
  IEventMiddleware,
  IEventBusFactory,
  IEventBusConfig,
  IEventStore,
  IEventReplay,
  EventHandler,
  SafeEventHandler
} from './IEventBus';

export {
  EventPriority,
  EventDeliveryMode
} from './IEventBus';

// ===== COMMON TYPES =====

/**
 * Generic service interface
 */
export interface IService {
  /**
   * Initialize the service
   */
  initialize(): Promise<void>;

  /**
   * Start the service
   */
  start(): Promise<void>;

  /**
   * Stop the service
   */
  stop(): Promise<void>;

  /**
   * Dispose of service resources
   */
  dispose(): Promise<void>;

  /**
   * Get service status
   */
  getStatus(): ServiceStatus;

  /**
   * Get service name
   */
  getName(): string;

  /**
   * Get service version
   */
  getVersion(): string;
}

/**
 * Service status enumeration
 */
export enum ServiceStatus {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error',
  DISPOSED = 'disposed'
}

/**
 * Generic repository interface
 */
export interface IRepository<T, TKey = string> {
  /**
   * Get entity by key
   */
  get(key: TKey): Promise<T | null>;

  /**
   * Get all entities
   */
  getAll(): Promise<T[]>;

  /**
   * Add entity
   */
  add(entity: T): Promise<TKey>;

  /**
   * Update entity
   */
  update(key: TKey, entity: Partial<T>): Promise<boolean>;

  /**
   * Delete entity
   */
  delete(key: TKey): Promise<boolean>;

  /**
   * Check if entity exists
   */
  exists(key: TKey): Promise<boolean>;

  /**
   * Get entity count
   */
  count(): Promise<number>;

  /**
   * Clear all entities
   */
  clear(): Promise<void>;
}

/**
 * Generic factory interface
 */
export interface IFactory<T> {
  /**
   * Create instance
   */
  create(...args: any[]): T;

  /**
   * Create instance with configuration
   */
  createWithConfig(config: Record<string, any>): T;

  /**
   * Get factory name
   */
  getName(): string;
}

/**
 * Disposable interface
 */
export interface IDisposable {
  /**
   * Dispose of resources
   */
  dispose(): void | Promise<void>;

  /**
   * Check if disposed
   */
  isDisposed(): boolean;
}

/**
 * Configurable interface
 */
export interface IConfigurable<TConfig = Record<string, any>> {
  /**
   * Update configuration
   */
  updateConfig(config: Partial<TConfig>): void | Promise<void>;

  /**
   * Get current configuration
   */
  getConfig(): TConfig;

  /**
   * Validate configuration
   */
  validateConfig(config: Partial<TConfig>): boolean;
}

/**
 * Observable interface
 */
export interface IObservable<T> {
  /**
   * Subscribe to changes
   */
  subscribe(observer: (value: T) => void): () => void;

  /**
   * Get current value
   */
  getValue(): T;

  /**
   * Set value
   */
  setValue(value: T): void;
}

/**
 * Logger interface
 */
export interface ILogger {
  /**
   * Log debug message
   */
  debug(message: string, ...args: any[]): void;

  /**
   * Log info message
   */
  info(message: string, ...args: any[]): void;

  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void;

  /**
   * Log error message
   */
  error(message: string, error?: Error, ...args: any[]): void;

  /**
   * Create child logger
   */
  createChild(name: string): ILogger;
}

/**
 * Performance metrics interface
 */
export interface IPerformanceMetrics {
  readonly operationCount: number;
  readonly averageTime: number;
  readonly minTime: number;
  readonly maxTime: number;
  readonly totalTime: number;
  readonly errorCount: number;
  readonly successRate: number;
  readonly timestamp: number;
}

/**
 * Health check interface
 */
export interface IHealthCheck {
  /**
   * Check health status
   */
  check(): Promise<HealthCheckResult>;

  /**
   * Get health check name
   */
  getName(): string;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  readonly name: string;
  readonly status: 'healthy' | 'unhealthy' | 'degraded';
  readonly message?: string;
  readonly data?: Record<string, any>;
  readonly timestamp: number;
  readonly duration: number;
}

/**
 * Cache interface
 */
export interface ICache<TKey = string, TValue = any> {
  /**
   * Get value from cache
   */
  get(key: TKey): Promise<TValue | null>;

  /**
   * Set value in cache
   */
  set(key: TKey, value: TValue, ttl?: number): Promise<void>;

  /**
   * Check if key exists
   */
  has(key: TKey): Promise<boolean>;

  /**
   * Delete value from cache
   */
  delete(key: TKey): Promise<boolean>;

  /**
   * Clear all cache entries
   */
  clear(): Promise<void>;

  /**
   * Get cache size
   */
  size(): Promise<number>;

  /**
   * Get cache statistics
   */
  getStatistics(): Promise<{
    hitCount: number;
    missCount: number;
    hitRate: number;
    evictionCount: number;
    size: number;
  }>;
}
