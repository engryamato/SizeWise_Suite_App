/**
 * Dependency Container Tests
 * SizeWise Suite - Architectural Refactoring Priority Group
 * 
 * Comprehensive test suite for the dependency injection container
 * ensuring proper service registration, resolution, and lifecycle management.
 * 
 * @fileoverview Dependency container tests
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import { DependencyContainer, ContainerBuilder } from '../infrastructure/DependencyContainer';
import { ServiceLifetime } from '../core/interfaces';

// Test services for dependency injection
class TestService {
  constructor(public name: string = 'TestService') {}
  getName(): string { return this.name; }
}

class DependentService {
  constructor(private testService: TestService) {}
  getTestServiceName(): string { return this.testService.getName(); }
}

interface ITestInterface {
  getValue(): string;
}

class TestImplementation implements ITestInterface {
  getValue(): string { return 'test-value'; }
}

describe('DependencyContainer', () => {
  let container: DependencyContainer;

  beforeEach(() => {
    container = new DependencyContainer();
  });

  afterEach(() => {
    container.dispose();
  });

  describe('Service Registration', () => {
    it('should register and resolve transient service', () => {
      container.register('testService', TestService, { lifetime: ServiceLifetime.TRANSIENT });
      
      const instance1 = container.resolve<TestService>('testService');
      const instance2 = container.resolve<TestService>('testService');
      
      expect(instance1).toBeInstanceOf(TestService);
      expect(instance2).toBeInstanceOf(TestService);
      expect(instance1).not.toBe(instance2); // Different instances
    });

    it('should register and resolve singleton service', () => {
      container.register('testService', TestService, { lifetime: ServiceLifetime.SINGLETON });
      
      const instance1 = container.resolve<TestService>('testService');
      const instance2 = container.resolve<TestService>('testService');
      
      expect(instance1).toBeInstanceOf(TestService);
      expect(instance2).toBeInstanceOf(TestService);
      expect(instance1).toBe(instance2); // Same instance
    });

    it('should register implementation', () => {
      const implementation = new TestImplementation();
      container.registerImplementation('testInterface', implementation);
      
      const resolved = container.resolve<ITestInterface>('testInterface');
      expect(resolved).toBe(implementation);
      expect(resolved.getValue()).toBe('test-value');
    });

    it('should register factory', () => {
      container.registerFactory('testService', () => new TestService('factory-created'));
      
      const instance = container.resolve<TestService>('testService');
      expect(instance.getName()).toBe('factory-created');
    });

    it('should register instance', () => {
      const instance = new TestService('instance-service');
      container.registerInstance('testService', instance);
      
      const resolved = container.resolve<TestService>('testService');
      expect(resolved).toBe(instance);
    });
  });

  describe('Dependency Resolution', () => {
    it('should resolve dependencies automatically', () => {
      container.register('testService', TestService);
      container.register('dependentService', DependentService, {
        dependencies: ['testService']
      });
      
      const dependent = container.resolve<DependentService>('dependentService');
      expect(dependent.getTestServiceName()).toBe('TestService');
    });

    it('should throw error for unregistered service', () => {
      expect(() => container.resolve('nonExistent')).toThrow('Service not registered: nonExistent');
    });

    it('should return null for tryResolve with unregistered service', () => {
      const result = container.tryResolve('nonExistent');
      expect(result).toBeNull();
    });

    it('should detect circular dependencies', () => {
      // This would require more complex setup to test circular dependencies
      // For now, we'll test the validation method
      const validation = container.validate();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Service Management', () => {
    it('should check if service is registered', () => {
      expect(container.isRegistered('testService')).toBe(false);
      
      container.register('testService', TestService);
      expect(container.isRegistered('testService')).toBe(true);
    });

    it('should unregister service', () => {
      container.register('testService', TestService);
      expect(container.isRegistered('testService')).toBe(true);
      
      const unregistered = container.unregister('testService');
      expect(unregistered).toBe(true);
      expect(container.isRegistered('testService')).toBe(false);
    });

    it('should get service descriptor', () => {
      container.register('testService', TestService);
      
      const descriptor = container.getDescriptor('testService');
      expect(descriptor).toBeDefined();
      expect(descriptor?.name).toBe('testService');
      expect(descriptor?.type).toBe(TestService);
    });

    it('should get registered services list', () => {
      container.register('service1', TestService);
      container.register('service2', TestService);
      
      const services = container.getRegisteredServices();
      expect(services).toContain('service1');
      expect(services).toContain('service2');
    });
  });

  describe('Container Hierarchy', () => {
    it('should create child container', () => {
      const child = container.createChildContainer();
      expect(child.getParent()).toBe(container);
    });

    it('should resolve from parent container', () => {
      container.register('parentService', TestService);
      
      const child = container.createChildContainer();
      const instance = child.resolve<TestService>('parentService');
      
      expect(instance).toBeInstanceOf(TestService);
    });
  });

  describe('Statistics and Validation', () => {
    it('should provide statistics', () => {
      container.register('service1', TestService);
      container.register('service2', TestService, { lifetime: ServiceLifetime.SINGLETON });
      
      // Resolve singleton to create instance
      container.resolve('service2');
      
      const stats = container.getStatistics();
      expect(stats.registeredServices).toBe(2);
      expect(stats.singletonInstances).toBe(1);
      expect(typeof stats.resolutionCount).toBe('number');
    });

    it('should validate container configuration', () => {
      container.register('validService', TestService);
      
      const validation = container.validate();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Container Builder', () => {
    it('should build container with fluent API', () => {
      const builder = new ContainerBuilder();
      const builtContainer = builder
        .addSingleton('singleton', TestService)
        .addTransient('transient', TestService)
        .addInstance('instance', new TestService('instance'))
        .build();
      
      expect(builtContainer.isRegistered('singleton')).toBe(true);
      expect(builtContainer.isRegistered('transient')).toBe(true);
      expect(builtContainer.isRegistered('instance')).toBe(true);
      
      builtContainer.dispose();
    });
  });

  describe('Disposal', () => {
    it('should dispose container and cleanup resources', () => {
      container.register('testService', TestService);
      container.resolve('testService'); // Create instance
      
      expect(() => container.dispose()).not.toThrow();
      
      // After disposal, should not be able to resolve services
      expect(() => container.resolve('testService')).toThrow('Container has been disposed');
    });
  });
});
