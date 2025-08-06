/**
 * Dependency Injection Container Interface
 * SizeWise Suite - Architectural Refactoring Priority Group
 * 
 * Core interface for dependency injection container with service registration,
 * lifecycle management, and configuration binding. This interface enables
 * loose coupling and better testability throughout the system.
 * 
 * @fileoverview Dependency injection container interface definition
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

/**
 * Service lifecycle types
 */
export enum ServiceLifetime {
  SINGLETON = 'singleton',
  TRANSIENT = 'transient',
  SCOPED = 'scoped'
}

/**
 * Service registration options
 */
export interface IServiceRegistrationOptions {
  readonly lifetime: ServiceLifetime;
  readonly factory?: (...args: any[]) => any;
  readonly dependencies?: string[];
  readonly configuration?: Record<string, any>;
  readonly tags?: string[];
  readonly lazy?: boolean;
  readonly dispose?: (instance: any) => void;
}

/**
 * Service descriptor
 */
export interface IServiceDescriptor {
  readonly name: string;
  readonly type: any;
  readonly implementation?: any;
  readonly options: IServiceRegistrationOptions;
  readonly registeredAt: number;
}

/**
 * Service resolution context
 */
export interface IResolutionContext {
  readonly requestId: string;
  readonly parentContext?: IResolutionContext;
  readonly resolvedServices: Map<string, any>;
  readonly resolutionPath: string[];
  readonly timestamp: number;
}

/**
 * Service resolution result
 */
export interface IResolutionResult<T = any> {
  readonly success: boolean;
  readonly instance?: T;
  readonly error?: Error;
  readonly resolutionTime: number;
  readonly context: IResolutionContext;
}

/**
 * Dependency injection container interface
 * 
 * Defines the contract for dependency injection functionality including
 * service registration, resolution, and lifecycle management.
 */
export interface IDependencyContainer {
  /**
   * Register a service with the container
   */
  register<T>(
    name: string,
    type: new (...args: any[]) => T,
    options?: Partial<IServiceRegistrationOptions>
  ): void;

  /**
   * Register a service with implementation
   */
  registerImplementation<T>(
    name: string,
    implementation: T,
    options?: Partial<IServiceRegistrationOptions>
  ): void;

  /**
   * Register a service with factory function
   */
  registerFactory<T>(
    name: string,
    factory: (container: IDependencyContainer) => T,
    options?: Partial<IServiceRegistrationOptions>
  ): void;

  /**
   * Register a service instance (singleton)
   */
  registerInstance<T>(name: string, instance: T): void;

  /**
   * Resolve a service by name
   */
  resolve<T>(name: string): T;

  /**
   * Try to resolve a service (returns null if not found)
   */
  tryResolve<T>(name: string): T | null;

  /**
   * Resolve a service with detailed result
   */
  resolveWithResult<T>(name: string): IResolutionResult<T>;

  /**
   * Resolve all services with a specific tag
   */
  resolveByTag<T>(tag: string): T[];

  /**
   * Check if a service is registered
   */
  isRegistered(name: string): boolean;

  /**
   * Unregister a service
   */
  unregister(name: string): boolean;

  /**
   * Get service descriptor
   */
  getDescriptor(name: string): IServiceDescriptor | null;

  /**
   * Get all registered service names
   */
  getRegisteredServices(): string[];

  /**
   * Get services by tag
   */
  getServicesByTag(tag: string): IServiceDescriptor[];

  /**
   * Create a child container (scoped)
   */
  createChildContainer(): IDependencyContainer;

  /**
   * Get parent container
   */
  getParent(): IDependencyContainer | null;

  /**
   * Dispose of container and all singleton instances
   */
  dispose(): void;

  /**
   * Validate container configuration
   */
  validate(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };

  /**
   * Get container statistics
   */
  getStatistics(): {
    registeredServices: number;
    singletonInstances: number;
    resolutionCount: number;
    averageResolutionTime: number;
    errorCount: number;
  };
}

/**
 * Service decorator metadata
 */
export interface IServiceMetadata {
  readonly name?: string;
  readonly lifetime?: ServiceLifetime;
  readonly dependencies?: string[];
  readonly tags?: string[];
  readonly configuration?: Record<string, any>;
}

/**
 * Injectable decorator interface
 */
export interface IInjectableDecorator {
  (metadata?: IServiceMetadata): ClassDecorator;
}

/**
 * Inject decorator interface
 */
export interface IInjectDecorator {
  (serviceName: string): ParameterDecorator;
}

/**
 * Configuration decorator interface
 */
export interface IConfigurationDecorator {
  (configPath: string): ParameterDecorator;
}

/**
 * Container builder interface
 */
export interface IContainerBuilder {
  /**
   * Add service registration
   */
  addService<T>(
    name: string,
    type: new (...args: any[]) => T,
    options?: Partial<IServiceRegistrationOptions>
  ): IContainerBuilder;

  /**
   * Add singleton service
   */
  addSingleton<T>(
    name: string,
    type: new (...args: any[]) => T
  ): IContainerBuilder;

  /**
   * Add transient service
   */
  addTransient<T>(
    name: string,
    type: new (...args: any[]) => T
  ): IContainerBuilder;

  /**
   * Add scoped service
   */
  addScoped<T>(
    name: string,
    type: new (...args: any[]) => T
  ): IContainerBuilder;

  /**
   * Add factory service
   */
  addFactory<T>(
    name: string,
    factory: (container: IDependencyContainer) => T,
    lifetime?: ServiceLifetime
  ): IContainerBuilder;

  /**
   * Add instance
   */
  addInstance<T>(name: string, instance: T): IContainerBuilder;

  /**
   * Configure service
   */
  configure<T>(
    name: string,
    configuration: Record<string, any>
  ): IContainerBuilder;

  /**
   * Add module
   */
  addModule(module: IContainerModule): IContainerBuilder;

  /**
   * Build container
   */
  build(): IDependencyContainer;
}

/**
 * Container module interface
 */
export interface IContainerModule {
  /**
   * Configure services in the container
   */
  configure(builder: IContainerBuilder): void;

  /**
   * Get module name
   */
  getName(): string;

  /**
   * Get module dependencies
   */
  getDependencies(): string[];
}

/**
 * Container factory interface
 */
export interface IContainerFactory {
  /**
   * Create a new container
   */
  createContainer(): IDependencyContainer;

  /**
   * Create a container builder
   */
  createBuilder(): IContainerBuilder;

  /**
   * Create container from configuration
   */
  createFromConfiguration(config: Record<string, any>): IDependencyContainer;
}

/**
 * Service interceptor interface
 */
export interface IServiceInterceptor {
  /**
   * Intercept service resolution
   */
  intercept<T>(
    serviceName: string,
    instance: T,
    context: IResolutionContext
  ): T;

  /**
   * Get interceptor name
   */
  getName(): string;

  /**
   * Check if interceptor applies to service
   */
  appliesTo(serviceName: string): boolean;
}

/**
 * Container event types
 */
export enum ContainerEventType {
  SERVICE_REGISTERED = 'service_registered',
  SERVICE_UNREGISTERED = 'service_unregistered',
  SERVICE_RESOLVED = 'service_resolved',
  SERVICE_RESOLUTION_FAILED = 'service_resolution_failed',
  CONTAINER_DISPOSED = 'container_disposed',
  CHILD_CONTAINER_CREATED = 'child_container_created'
}

/**
 * Container event data
 */
export interface IContainerEvent {
  readonly type: ContainerEventType;
  readonly timestamp: number;
  readonly serviceName?: string;
  readonly data?: any;
  readonly error?: Error;
}

/**
 * Container event handler function type
 */
export type ContainerEventHandler = (event: IContainerEvent) => void;

/**
 * Container event subscription interface
 */
export interface IContainerEventSubscription {
  readonly id: string;
  readonly eventType: ContainerEventType;
  readonly handler: ContainerEventHandler;
  unsubscribe(): void;
}

/**
 * Event management interface for container
 */
export interface IContainerEventManager {
  /**
   * Subscribe to container events
   */
  subscribe(
    eventType: ContainerEventType,
    handler: ContainerEventHandler
  ): IContainerEventSubscription;

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscription: IContainerEventSubscription): void;

  /**
   * Emit an event
   */
  emit(event: IContainerEvent): void;

  /**
   * Clear all subscriptions
   */
  clearSubscriptions(): void;
}
