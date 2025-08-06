/**
 * Dependency Injection Container Implementation
 * SizeWise Suite - Architectural Refactoring Priority Group
 * 
 * Comprehensive dependency injection container with service registration,
 * lifecycle management, and configuration binding. Enables loose coupling
 * and better testability throughout the system.
 * 
 * @fileoverview Dependency injection container implementation
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import {
  IDependencyContainer,
  IServiceRegistrationOptions,
  IServiceDescriptor,
  IResolutionContext,
  IResolutionResult,
  ServiceLifetime,
  ContainerEventType,
  IContainerEvent,
  IContainerEventManager,
  IContainerEventSubscription,
  ContainerEventHandler
} from '../core/interfaces';

/**
 * Container event manager implementation
 */
class ContainerEventManager implements IContainerEventManager {
  private subscriptions: Map<ContainerEventType, IContainerEventSubscription[]> = new Map();
  private subscriptionIdCounter = 0;

  subscribe(
    eventType: ContainerEventType,
    handler: ContainerEventHandler
  ): IContainerEventSubscription {
    const subscription: IContainerEventSubscription = {
      id: `sub_${++this.subscriptionIdCounter}`,
      eventType,
      handler,
      unsubscribe: () => this.unsubscribe(subscription)
    };

    const subscriptions = this.subscriptions.get(eventType) || [];
    subscriptions.push(subscription);
    this.subscriptions.set(eventType, subscriptions);

    return subscription;
  }

  unsubscribe(subscription: IContainerEventSubscription): void {
    const subscriptions = this.subscriptions.get(subscription.eventType);
    if (subscriptions) {
      const index = subscriptions.indexOf(subscription);
      if (index !== -1) {
        subscriptions.splice(index, 1);
      }
    }
  }

  emit(event: IContainerEvent): void {
    const subscriptions = this.subscriptions.get(event.type) || [];
    subscriptions.forEach(subscription => {
      try {
        subscription.handler(event);
      } catch (error) {
        console.error('Error in container event handler:', error);
      }
    });
  }

  clearSubscriptions(): void {
    this.subscriptions.clear();
  }
}

/**
 * Dependency injection container implementation
 */
export class DependencyContainer implements IDependencyContainer {
  private services: Map<string, IServiceDescriptor> = new Map();
  private instances: Map<string, any> = new Map();
  private parent: IDependencyContainer | null = null;
  private children: Set<IDependencyContainer> = new Set();
  private eventManager: IContainerEventManager = new ContainerEventManager();
  private disposed = false;
  private resolutionCount = 0;
  private totalResolutionTime = 0;
  private errorCount = 0;

  constructor(parent?: IDependencyContainer) {
    this.parent = parent || null;
    if (this.parent) {
      (this.parent as DependencyContainer).children.add(this);
    }
  }

  register<T>(
    name: string,
    type: new (...args: any[]) => T,
    options: Partial<IServiceRegistrationOptions> = {}
  ): void {
    this.ensureNotDisposed();

    const descriptor: IServiceDescriptor = {
      name,
      type,
      options: {
        lifetime: ServiceLifetime.TRANSIENT,
        dependencies: [],
        tags: [],
        lazy: false,
        ...options
      },
      registeredAt: Date.now()
    };

    this.services.set(name, descriptor);

    this.eventManager.emit({
      type: ContainerEventType.SERVICE_REGISTERED,
      timestamp: Date.now(),
      serviceName: name,
      data: descriptor
    });
  }

  registerImplementation<T>(
    name: string,
    implementation: T,
    options: Partial<IServiceRegistrationOptions> = {}
  ): void {
    this.ensureNotDisposed();

    const descriptor: IServiceDescriptor = {
      name,
      type: null,
      implementation,
      options: {
        lifetime: ServiceLifetime.SINGLETON,
        dependencies: [],
        tags: [],
        lazy: false,
        ...options
      },
      registeredAt: Date.now()
    };

    this.services.set(name, descriptor);
    
    if (descriptor.options.lifetime === ServiceLifetime.SINGLETON) {
      this.instances.set(name, implementation);
    }

    this.eventManager.emit({
      type: ContainerEventType.SERVICE_REGISTERED,
      timestamp: Date.now(),
      serviceName: name,
      data: descriptor
    });
  }

  registerFactory<T>(
    name: string,
    factory: (container: IDependencyContainer) => T,
    options: Partial<IServiceRegistrationOptions> = {}
  ): void {
    this.ensureNotDisposed();

    const descriptor: IServiceDescriptor = {
      name,
      type: null,
      options: {
        lifetime: ServiceLifetime.TRANSIENT,
        factory,
        dependencies: [],
        tags: [],
        lazy: false,
        ...options
      },
      registeredAt: Date.now()
    };

    this.services.set(name, descriptor);

    this.eventManager.emit({
      type: ContainerEventType.SERVICE_REGISTERED,
      timestamp: Date.now(),
      serviceName: name,
      data: descriptor
    });
  }

  registerInstance<T>(name: string, instance: T): void {
    this.registerImplementation(name, instance, {
      lifetime: ServiceLifetime.SINGLETON
    });
  }

  resolve<T>(name: string): T {
    const result = this.resolveWithResult<T>(name);
    if (!result.success) {
      throw result.error || new Error(`Failed to resolve service: ${name}`);
    }
    return result.instance!;
  }

  tryResolve<T>(name: string): T | null {
    const result = this.resolveWithResult<T>(name);
    return result.success ? result.instance! : null;
  }

  resolveWithResult<T>(name: string): IResolutionResult<T> {
    const startTime = Date.now();
    const context: IResolutionContext = {
      requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      resolvedServices: new Map(),
      resolutionPath: [name],
      timestamp: startTime
    };

    try {
      const instance = this.resolveInternal<T>(name, context);
      const resolutionTime = Date.now() - startTime;
      
      this.resolutionCount++;
      this.totalResolutionTime += resolutionTime;

      this.eventManager.emit({
        type: ContainerEventType.SERVICE_RESOLVED,
        timestamp: Date.now(),
        serviceName: name,
        data: { resolutionTime, context }
      });

      return {
        success: true,
        instance,
        resolutionTime,
        context
      };
    } catch (error) {
      const resolutionTime = Date.now() - startTime;
      this.errorCount++;

      this.eventManager.emit({
        type: ContainerEventType.SERVICE_RESOLUTION_FAILED,
        timestamp: Date.now(),
        serviceName: name,
        error: error as Error,
        data: { resolutionTime, context }
      });

      return {
        success: false,
        error: error as Error,
        resolutionTime,
        context
      };
    }
  }

  private resolveInternal<T>(name: string, context: IResolutionContext): T {
    this.ensureNotDisposed();

    // Check for circular dependencies
    if (context.resolutionPath.filter(p => p === name).length > 1) {
      throw new Error(`Circular dependency detected: ${context.resolutionPath.join(' -> ')} -> ${name}`);
    }

    // Check if already resolved in this context
    if (context.resolvedServices.has(name)) {
      return context.resolvedServices.get(name);
    }

    // Try to resolve from this container
    const descriptor = this.services.get(name);
    if (descriptor) {
      const instance = this.createInstance<T>(descriptor, context);
      context.resolvedServices.set(name, instance);
      return instance;
    }

    // Try to resolve from parent container
    if (this.parent) {
      return this.parent.resolve<T>(name);
    }

    throw new Error(`Service not registered: ${name}`);
  }

  private createInstance<T>(descriptor: IServiceDescriptor, context: IResolutionContext): T {
    // Check for singleton instance
    if (descriptor.options.lifetime === ServiceLifetime.SINGLETON && this.instances.has(descriptor.name)) {
      return this.instances.get(descriptor.name);
    }

    let instance: T;

    if (descriptor.implementation) {
      instance = descriptor.implementation;
    } else if (descriptor.options.factory) {
      instance = descriptor.options.factory(this);
    } else if (descriptor.type) {
      // Resolve dependencies
      const dependencies = this.resolveDependencies(descriptor.options.dependencies || [], context);
      instance = new descriptor.type(...dependencies);
    } else {
      throw new Error(`Cannot create instance for service: ${descriptor.name}`);
    }

    // Store singleton instance
    if (descriptor.options.lifetime === ServiceLifetime.SINGLETON) {
      this.instances.set(descriptor.name, instance);
    }

    return instance;
  }

  private resolveDependencies(dependencies: string[], context: IResolutionContext): any[] {
    return dependencies.map(dep => {
      const newContext: IResolutionContext = {
        ...context,
        resolutionPath: [...context.resolutionPath, dep]
      };
      return this.resolveInternal(dep, newContext);
    });
  }

  resolveByTag<T>(tag: string): T[] {
    const services = Array.from(this.services.values())
      .filter(descriptor => descriptor.options.tags?.includes(tag));
    
    return services.map(descriptor => this.resolve<T>(descriptor.name));
  }

  isRegistered(name: string): boolean {
    return this.services.has(name) || (this.parent?.isRegistered(name) ?? false);
  }

  unregister(name: string): boolean {
    const descriptor = this.services.get(name);
    if (!descriptor) {
      return false;
    }

    // Dispose singleton instance if exists
    if (this.instances.has(name)) {
      const instance = this.instances.get(name);
      if (descriptor.options.dispose && typeof descriptor.options.dispose === 'function') {
        descriptor.options.dispose(instance);
      }
      this.instances.delete(name);
    }

    this.services.delete(name);

    this.eventManager.emit({
      type: ContainerEventType.SERVICE_UNREGISTERED,
      timestamp: Date.now(),
      serviceName: name,
      data: descriptor
    });

    return true;
  }

  getDescriptor(name: string): IServiceDescriptor | null {
    return this.services.get(name) || null;
  }

  getRegisteredServices(): string[] {
    const services = Array.from(this.services.keys());
    if (this.parent) {
      services.push(...this.parent.getRegisteredServices());
    }
    return [...new Set(services)];
  }

  getServicesByTag(tag: string): IServiceDescriptor[] {
    return Array.from(this.services.values())
      .filter(descriptor => descriptor.options.tags?.includes(tag));
  }

  createChildContainer(): IDependencyContainer {
    return new DependencyContainer(this);
  }

  getParent(): IDependencyContainer | null {
    return this.parent;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    // Dispose all singleton instances
    this.instances.forEach((instance, name) => {
      const descriptor = this.services.get(name);
      if (descriptor?.options.dispose && typeof descriptor.options.dispose === 'function') {
        try {
          descriptor.options.dispose(instance);
        } catch (error) {
          console.error(`Error disposing service ${name}:`, error);
        }
      }
    });

    // Dispose child containers
    this.children.forEach(child => {
      try {
        child.dispose();
      } catch (error) {
        console.error('Error disposing child container:', error);
      }
    });

    // Remove from parent
    if (this.parent) {
      (this.parent as DependencyContainer).children.delete(this);
    }

    // Clear all data
    this.services.clear();
    this.instances.clear();
    this.children.clear();
    this.eventManager.clearSubscriptions();

    this.disposed = true;

    this.eventManager.emit({
      type: ContainerEventType.CONTAINER_DISPOSED,
      timestamp: Date.now()
    });
  }

  validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for missing dependencies
    this.services.forEach((descriptor, name) => {
      if (descriptor.options.dependencies) {
        descriptor.options.dependencies.forEach(dep => {
          if (!this.isRegistered(dep)) {
            errors.push(`Service '${name}' depends on unregistered service '${dep}'`);
          }
        });
      }
    });

    // Check for potential circular dependencies
    this.services.forEach((descriptor, name) => {
      try {
        this.checkCircularDependencies(name, new Set());
      } catch (error) {
        errors.push(`Circular dependency detected for service '${name}': ${(error as Error).message}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private checkCircularDependencies(serviceName: string, visited: Set<string>): void {
    if (visited.has(serviceName)) {
      throw new Error(`Circular dependency: ${Array.from(visited).join(' -> ')} -> ${serviceName}`);
    }

    const descriptor = this.services.get(serviceName);
    if (descriptor?.options.dependencies) {
      visited.add(serviceName);
      descriptor.options.dependencies.forEach(dep => {
        this.checkCircularDependencies(dep, new Set(visited));
      });
      visited.delete(serviceName);
    }
  }

  getStatistics() {
    return {
      registeredServices: this.services.size,
      singletonInstances: this.instances.size,
      resolutionCount: this.resolutionCount,
      averageResolutionTime: this.resolutionCount > 0 ? this.totalResolutionTime / this.resolutionCount : 0,
      errorCount: this.errorCount
    };
  }

  private ensureNotDisposed(): void {
    if (this.disposed) {
      throw new Error('Container has been disposed');
    }
  }

  // Event management methods
  onServiceRegistered(handler: ContainerEventHandler): IContainerEventSubscription {
    return this.eventManager.subscribe(ContainerEventType.SERVICE_REGISTERED, handler);
  }

  onServiceResolved(handler: ContainerEventHandler): IContainerEventSubscription {
    return this.eventManager.subscribe(ContainerEventType.SERVICE_RESOLVED, handler);
  }

  onServiceResolutionFailed(handler: ContainerEventHandler): IContainerEventSubscription {
    return this.eventManager.subscribe(ContainerEventType.SERVICE_RESOLUTION_FAILED, handler);
  }
}

/**
 * Container builder implementation
 */
export class ContainerBuilder {
  private container: DependencyContainer = new DependencyContainer();

  addService<T>(
    name: string,
    type: new (...args: any[]) => T,
    options?: Partial<IServiceRegistrationOptions>
  ): ContainerBuilder {
    this.container.register(name, type, options);
    return this;
  }

  addSingleton<T>(name: string, type: new (...args: any[]) => T): ContainerBuilder {
    return this.addService(name, type, { lifetime: ServiceLifetime.SINGLETON });
  }

  addTransient<T>(name: string, type: new (...args: any[]) => T): ContainerBuilder {
    return this.addService(name, type, { lifetime: ServiceLifetime.TRANSIENT });
  }

  addScoped<T>(name: string, type: new (...args: any[]) => T): ContainerBuilder {
    return this.addService(name, type, { lifetime: ServiceLifetime.SCOPED });
  }

  addFactory<T>(
    name: string,
    factory: (container: IDependencyContainer) => T,
    lifetime: ServiceLifetime = ServiceLifetime.TRANSIENT
  ): ContainerBuilder {
    this.container.registerFactory(name, factory, { lifetime });
    return this;
  }

  addInstance<T>(name: string, instance: T): ContainerBuilder {
    this.container.registerInstance(name, instance);
    return this;
  }

  build(): IDependencyContainer {
    return this.container;
  }
}

/**
 * Container factory implementation
 */
export class ContainerFactory {
  static createContainer(): IDependencyContainer {
    return new DependencyContainer();
  }

  static createBuilder(): ContainerBuilder {
    return new ContainerBuilder();
  }

  static createFromConfiguration(config: Record<string, any>): IDependencyContainer {
    const builder = new ContainerBuilder();

    // Process configuration and register services
    // This would be implemented based on specific configuration format

    return builder.build();
  }
}
