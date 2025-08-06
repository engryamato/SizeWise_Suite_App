/**
 * Configuration Service Implementation
 * SizeWise Suite - Architectural Refactoring Priority Group
 * 
 * Centralized configuration management with environment-specific settings,
 * validation, type safety, and hot-reload capabilities. Provides consistent
 * configuration across all modules.
 * 
 * @fileoverview Configuration service implementation
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import {
  IConfigurationService,
  IConfigurationProvider,
  IConfigurationSchema,
  IConfigurationValidationResult,
  IConfigurationChangeEvent,
  ConfigurationEnvironment,
  ValidationSeverity,
  ConfigurationEventType,
  IConfigurationEvent,
  IConfigurationEventManager,
  IConfigurationEventSubscription,
  ConfigurationEventHandler,
  IConfigurationCache
} from '../core/interfaces';

/**
 * Configuration event manager implementation
 */
class ConfigurationEventManager implements IConfigurationEventManager {
  private subscriptions: Map<ConfigurationEventType, IConfigurationEventSubscription[]> = new Map();
  private subscriptionIdCounter = 0;

  subscribe(
    eventType: ConfigurationEventType,
    handler: ConfigurationEventHandler
  ): IConfigurationEventSubscription {
    const subscription: IConfigurationEventSubscription = {
      id: `config_sub_${++this.subscriptionIdCounter}`,
      eventType,
      handler,
      unsubscribe: () => this.unsubscribe(subscription)
    };

    const subscriptions = this.subscriptions.get(eventType) || [];
    subscriptions.push(subscription);
    this.subscriptions.set(eventType, subscriptions);

    return subscription;
  }

  unsubscribe(subscription: IConfigurationEventSubscription): void {
    const subscriptions = this.subscriptions.get(subscription.eventType);
    if (subscriptions) {
      const index = subscriptions.indexOf(subscription);
      if (index !== -1) {
        subscriptions.splice(index, 1);
      }
    }
  }

  emit(event: IConfigurationEvent): void {
    const subscriptions = this.subscriptions.get(event.type) || [];
    subscriptions.forEach(subscription => {
      try {
        subscription.handler(event);
      } catch (error) {
        console.error('Error in configuration event handler:', error);
      }
    });
  }

  clearSubscriptions(): void {
    this.subscriptions.clear();
  }
}

/**
 * Simple in-memory configuration cache
 */
class ConfigurationCache implements IConfigurationCache {
  private cache: Map<string, { value: any; expiry?: number }> = new Map();
  private hitCount = 0;
  private missCount = 0;
  private evictionCount = 0;

  get(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) {
      this.missCount++;
      return undefined;
    }

    if (entry.expiry && Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.evictionCount++;
      this.missCount++;
      return undefined;
    }

    this.hitCount++;
    return entry.value;
  }

  set(key: string, value: any, ttl?: number): void {
    const entry: { value: any; expiry?: number } = { value };
    if (ttl && ttl > 0) {
      entry.expiry = Date.now() + ttl;
    }
    this.cache.set(key, entry);
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
  }

  getStatistics() {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      hitRate: total > 0 ? this.hitCount / total : 0,
      missRate: total > 0 ? this.missCount / total : 0,
      evictionCount: this.evictionCount
    };
  }
}

/**
 * Configuration service implementation
 */
export class ConfigurationService implements IConfigurationService {
  private config: Record<string, any> = {};
  private schemas: Map<string, IConfigurationSchema> = new Map();
  private watchers: Map<string, ((event: IConfigurationChangeEvent) => void)[]> = new Map();
  private providers: IConfigurationProvider[] = [];
  private environment: ConfigurationEnvironment = ConfigurationEnvironment.DEVELOPMENT;
  private eventManager: IConfigurationEventManager = new ConfigurationEventManager();
  private cache: IConfigurationCache = new ConfigurationCache();
  private lastModified = Date.now();
  private version = '1.0.0';
  private source = 'memory';

  constructor(providers: IConfigurationProvider[] = []) {
    this.providers = providers;
  }

  async initialize(environment: ConfigurationEnvironment): Promise<void> {
    this.environment = environment;
    
    // Load configuration from all providers
    for (const provider of this.providers) {
      try {
        const providerConfig = await provider.load();
        this.merge(providerConfig);
        this.source = provider.getName();
      } catch (error) {
        console.error(`Failed to load configuration from provider ${provider.getName()}:`, error);
      }
    }

    // Set up watchers for providers that support it
    this.providers.forEach(provider => {
      if (provider.supportsWatching()) {
        provider.startWatching(() => this.reload());
      }
    });

    this.eventManager.emit({
      type: ConfigurationEventType.INITIALIZED,
      timestamp: Date.now(),
      data: { environment, config: this.config },
      source: 'ConfigurationService'
    });
  }

  get<T = any>(path: string, defaultValue?: T): T {
    const cachedValue = this.cache.get(path);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const value = this.getValueByPath(path) ?? defaultValue;
    this.cache.set(path, value, 60000); // Cache for 1 minute
    return value;
  }

  async set(path: string, value: any): Promise<void> {
    const oldValue = this.getValueByPath(path);
    this.setValueByPath(path, value);
    this.cache.delete(path); // Invalidate cache
    this.lastModified = Date.now();

    const changeEvent: IConfigurationChangeEvent = {
      path,
      oldValue,
      newValue: value,
      timestamp: this.lastModified,
      source: 'ConfigurationService'
    };

    // Notify watchers
    const watchers = this.watchers.get(path) || [];
    watchers.forEach(watcher => {
      try {
        watcher(changeEvent);
      } catch (error) {
        console.error('Error in configuration watcher:', error);
      }
    });

    this.eventManager.emit({
      type: ConfigurationEventType.VALUE_CHANGED,
      timestamp: Date.now(),
      data: changeEvent,
      source: 'ConfigurationService'
    });
  }

  has(path: string): boolean {
    return this.getValueByPath(path) !== undefined;
  }

  async delete(path: string): Promise<boolean> {
    if (!this.has(path)) {
      return false;
    }

    const oldValue = this.getValueByPath(path);
    this.deleteValueByPath(path);
    this.cache.delete(path);
    this.lastModified = Date.now();

    const changeEvent: IConfigurationChangeEvent = {
      path,
      oldValue,
      newValue: undefined,
      timestamp: this.lastModified,
      source: 'ConfigurationService'
    };

    // Notify watchers
    const watchers = this.watchers.get(path) || [];
    watchers.forEach(watcher => {
      try {
        watcher(changeEvent);
      } catch (error) {
        console.error('Error in configuration watcher:', error);
      }
    });

    return true;
  }

  getAll(): Record<string, any> {
    return JSON.parse(JSON.stringify(this.config));
  }

  async load(source: string | Record<string, any>): Promise<void> {
    if (typeof source === 'string') {
      // Load from file or URL
      try {
        const response = await fetch(source);
        const config = await response.json();
        this.config = config;
      } catch (error) {
        throw new Error(`Failed to load configuration from ${source}: ${(error as Error).message}`);
      }
    } else {
      this.config = { ...source };
    }

    this.cache.clear();
    this.lastModified = Date.now();

    this.eventManager.emit({
      type: ConfigurationEventType.LOADED,
      timestamp: Date.now(),
      data: { source, config: this.config },
      source: 'ConfigurationService'
    });
  }

  async save(): Promise<void> {
    // Save to all providers that support saving
    for (const provider of this.providers) {
      try {
        await provider.save(this.config);
      } catch (error) {
        console.error(`Failed to save configuration to provider ${provider.getName()}:`, error);
      }
    }

    this.eventManager.emit({
      type: ConfigurationEventType.SAVED,
      timestamp: Date.now(),
      data: { config: this.config },
      source: 'ConfigurationService'
    });
  }

  async reload(): Promise<void> {
    const oldConfig = { ...this.config };
    this.config = {};
    this.cache.clear();

    // Reload from all providers
    for (const provider of this.providers) {
      try {
        const providerConfig = await provider.load();
        this.merge(providerConfig);
      } catch (error) {
        console.error(`Failed to reload configuration from provider ${provider.getName()}:`, error);
      }
    }

    this.lastModified = Date.now();

    this.eventManager.emit({
      type: ConfigurationEventType.RELOADED,
      timestamp: Date.now(),
      data: { oldConfig, newConfig: this.config },
      source: 'ConfigurationService'
    });
  }

  async validate(schema?: IConfigurationSchema): Promise<IConfigurationValidationResult> {
    const issues: IConfigurationValidationResult['issues'] = [];

    if (schema) {
      this.validateObject(this.config, schema, '', issues);
    } else {
      // Validate against all registered schemas
      this.schemas.forEach((schemaObj, path) => {
        const value = this.getValueByPath(path);
        if (value !== undefined) {
          this.validateValue(value, schemaObj, path, issues);
        }
      });
    }

    const result: IConfigurationValidationResult = {
      isValid: issues.filter(issue => issue.severity === ValidationSeverity.ERROR).length === 0,
      issues
    };

    this.eventManager.emit({
      type: ConfigurationEventType.VALIDATION_COMPLETED,
      timestamp: Date.now(),
      data: result,
      source: 'ConfigurationService'
    });

    return result;
  }

  registerSchema(path: string, schema: IConfigurationSchema): void {
    this.schemas.set(path, schema);

    this.eventManager.emit({
      type: ConfigurationEventType.SCHEMA_REGISTERED,
      timestamp: Date.now(),
      data: { path, schema },
      source: 'ConfigurationService'
    });
  }

  getSchema(path: string): IConfigurationSchema | null {
    return this.schemas.get(path) || null;
  }

  watch(path: string, callback: (event: IConfigurationChangeEvent) => void): () => void {
    const watchers = this.watchers.get(path) || [];
    watchers.push(callback);
    this.watchers.set(path, watchers);

    return () => {
      const currentWatchers = this.watchers.get(path) || [];
      const index = currentWatchers.indexOf(callback);
      if (index !== -1) {
        currentWatchers.splice(index, 1);
        if (currentWatchers.length === 0) {
          this.watchers.delete(path);
        } else {
          this.watchers.set(path, currentWatchers);
        }
      }
    };
  }

  unwatch(path: string): void {
    this.watchers.delete(path);
  }

  getEnvironment(): ConfigurationEnvironment {
    return this.environment;
  }

  async setEnvironment(environment: ConfigurationEnvironment): Promise<void> {
    const oldEnvironment = this.environment;
    this.environment = environment;

    this.eventManager.emit({
      type: ConfigurationEventType.ENVIRONMENT_CHANGED,
      timestamp: Date.now(),
      data: { oldEnvironment, newEnvironment: environment },
      source: 'ConfigurationService'
    });

    // Reload configuration for new environment
    await this.reload();
  }

  async merge(config: Record<string, any>): Promise<void> {
    this.deepMerge(this.config, config);
    this.cache.clear();
    this.lastModified = Date.now();
  }

  async reset(): Promise<void> {
    this.config = {};
    this.cache.clear();
    this.watchers.clear();
    this.lastModified = Date.now();
  }

  export(): string {
    return JSON.stringify(this.config, null, 2);
  }

  async import(json: string): Promise<void> {
    try {
      const config = JSON.parse(json);
      await this.load(config);
    } catch (error) {
      throw new Error(`Failed to import configuration: ${(error as Error).message}`);
    }
  }

  getMetadata() {
    return {
      environment: this.environment,
      lastModified: this.lastModified,
      version: this.version,
      source: this.source
    };
  }

  // Private helper methods
  private getValueByPath(path: string): any {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  private setValueByPath(path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((obj, key) => {
      if (!(key in obj)) {
        obj[key] = {};
      }
      return obj[key];
    }, this.config);
    target[lastKey] = value;
  }

  private deleteValueByPath(path: string): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((obj, key) => obj?.[key], this.config);
    if (target) {
      delete target[lastKey];
    }
  }

  private deepMerge(target: any, source: any): void {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) {
          target[key] = {};
        }
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  private validateObject(obj: any, schema: IConfigurationSchema, path: string, issues: IConfigurationValidationResult['issues']): void {
    if (schema.type === 'object' && schema.properties) {
      Object.entries(schema.properties).forEach(([key, propSchema]) => {
        const propPath = path ? `${path}.${key}` : key;
        const value = obj[key];
        
        if (value !== undefined) {
          this.validateValue(value, propSchema, propPath, issues);
        } else if (propSchema.required) {
          issues.push({
            path: propPath,
            severity: ValidationSeverity.ERROR,
            message: `Required property '${key}' is missing`,
            expectedType: propSchema.type
          });
        }
      });
    }
  }

  private validateValue(value: any, schema: IConfigurationSchema, path: string, issues: IConfigurationValidationResult['issues']): void {
    // Type validation
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== schema.type) {
      issues.push({
        path,
        severity: ValidationSeverity.ERROR,
        message: `Expected type '${schema.type}' but got '${actualType}'`,
        expectedType: schema.type,
        actualValue: value
      });
      return;
    }

    // Custom validation
    if (schema.validation?.custom && !schema.validation.custom(value)) {
      issues.push({
        path,
        severity: ValidationSeverity.ERROR,
        message: 'Custom validation failed',
        actualValue: value
      });
    }

    // Enum validation
    if (schema.validation?.enum && !schema.validation.enum.includes(value)) {
      issues.push({
        path,
        severity: ValidationSeverity.ERROR,
        message: `Value must be one of: ${schema.validation.enum.join(', ')}`,
        actualValue: value
      });
    }

    // Range validation for numbers
    if (schema.type === 'number') {
      if (schema.validation?.min !== undefined && value < schema.validation.min) {
        issues.push({
          path,
          severity: ValidationSeverity.ERROR,
          message: `Value must be at least ${schema.validation.min}`,
          actualValue: value
        });
      }
      if (schema.validation?.max !== undefined && value > schema.validation.max) {
        issues.push({
          path,
          severity: ValidationSeverity.ERROR,
          message: `Value must be at most ${schema.validation.max}`,
          actualValue: value
        });
      }
    }

    // Pattern validation for strings
    if (schema.type === 'string' && schema.validation?.pattern) {
      const regex = new RegExp(schema.validation.pattern);
      if (!regex.test(value)) {
        issues.push({
          path,
          severity: ValidationSeverity.ERROR,
          message: `Value does not match pattern: ${schema.validation.pattern}`,
          actualValue: value
        });
      }
    }

    // Recursive validation for objects and arrays
    if (schema.type === 'object' && schema.properties) {
      this.validateObject(value, schema, path, issues);
    } else if (schema.type === 'array' && schema.items) {
      value.forEach((item: any, index: number) => {
        this.validateValue(item, schema.items!, `${path}[${index}]`, issues);
      });
    }
  }
}
