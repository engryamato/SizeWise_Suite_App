/**
 * Configuration Service Interface
 * SizeWise Suite - Architectural Refactoring Priority Group
 * 
 * Core interface for centralized configuration management with environment-specific
 * settings, validation, type safety, and hot-reload capabilities. This interface
 * enables consistent configuration across all modules.
 * 
 * @fileoverview Configuration service interface definition
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

/**
 * Configuration environment types
 */
export enum ConfigurationEnvironment {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

/**
 * Configuration validation severity levels
 */
export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Configuration validation result
 */
export interface IConfigurationValidationResult {
  readonly isValid: boolean;
  readonly issues: Array<{
    readonly path: string;
    readonly severity: ValidationSeverity;
    readonly message: string;
    readonly expectedType?: string;
    readonly actualValue?: any;
  }>;
}

/**
 * Configuration change event
 */
export interface IConfigurationChangeEvent {
  readonly path: string;
  readonly oldValue: any;
  readonly newValue: any;
  readonly timestamp: number;
  readonly source: string;
}

/**
 * Configuration schema definition
 */
export interface IConfigurationSchema {
  readonly type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  readonly required?: boolean;
  readonly default?: any;
  readonly validation?: {
    readonly min?: number;
    readonly max?: number;
    readonly pattern?: string;
    readonly enum?: any[];
    readonly custom?: (value: any) => boolean;
  };
  readonly properties?: Record<string, IConfigurationSchema>;
  readonly items?: IConfigurationSchema;
  readonly description?: string;
}

/**
 * Configuration service interface
 * 
 * Defines the contract for centralized configuration management including
 * environment-specific settings, validation, and hot-reload capabilities.
 */
export interface IConfigurationService {
  /**
   * Initialize configuration service
   */
  initialize(environment: ConfigurationEnvironment): Promise<void>;

  /**
   * Get configuration value by path
   */
  get<T = any>(path: string, defaultValue?: T): T;

  /**
   * Set configuration value by path
   */
  set(path: string, value: any): Promise<void>;

  /**
   * Check if configuration path exists
   */
  has(path: string): boolean;

  /**
   * Delete configuration value by path
   */
  delete(path: string): Promise<boolean>;

  /**
   * Get all configuration as object
   */
  getAll(): Record<string, any>;

  /**
   * Load configuration from source
   */
  load(source: string | Record<string, any>): Promise<void>;

  /**
   * Save current configuration
   */
  save(): Promise<void>;

  /**
   * Reload configuration from source
   */
  reload(): Promise<void>;

  /**
   * Validate configuration against schema
   */
  validate(schema?: IConfigurationSchema): Promise<IConfigurationValidationResult>;

  /**
   * Register configuration schema
   */
  registerSchema(path: string, schema: IConfigurationSchema): void;

  /**
   * Get registered schema for path
   */
  getSchema(path: string): IConfigurationSchema | null;

  /**
   * Watch for configuration changes
   */
  watch(
    path: string,
    callback: (event: IConfigurationChangeEvent) => void
  ): () => void;

  /**
   * Stop watching configuration changes
   */
  unwatch(path: string): void;

  /**
   * Get current environment
   */
  getEnvironment(): ConfigurationEnvironment;

  /**
   * Set environment
   */
  setEnvironment(environment: ConfigurationEnvironment): Promise<void>;

  /**
   * Merge configuration with another configuration
   */
  merge(config: Record<string, any>): Promise<void>;

  /**
   * Reset configuration to defaults
   */
  reset(): Promise<void>;

  /**
   * Export configuration to JSON
   */
  export(): string;

  /**
   * Import configuration from JSON
   */
  import(json: string): Promise<void>;

  /**
   * Get configuration metadata
   */
  getMetadata(): {
    environment: ConfigurationEnvironment;
    lastModified: number;
    version: string;
    source: string;
  };
}

/**
 * Configuration provider interface
 */
export interface IConfigurationProvider {
  /**
   * Load configuration from provider
   */
  load(): Promise<Record<string, any>>;

  /**
   * Save configuration to provider
   */
  save(config: Record<string, any>): Promise<void>;

  /**
   * Check if provider supports watching
   */
  supportsWatching(): boolean;

  /**
   * Start watching for changes
   */
  startWatching(callback: () => void): void;

  /**
   * Stop watching for changes
   */
  stopWatching(): void;

  /**
   * Get provider name
   */
  getName(): string;
}

/**
 * File-based configuration provider
 */
export interface IFileConfigurationProvider extends IConfigurationProvider {
  /**
   * Set file path
   */
  setFilePath(path: string): void;

  /**
   * Get file path
   */
  getFilePath(): string;
}

/**
 * Environment variable configuration provider
 */
export interface IEnvironmentConfigurationProvider extends IConfigurationProvider {
  /**
   * Set environment variable prefix
   */
  setPrefix(prefix: string): void;

  /**
   * Get environment variable prefix
   */
  getPrefix(): string;
}

/**
 * Remote configuration provider
 */
export interface IRemoteConfigurationProvider extends IConfigurationProvider {
  /**
   * Set remote endpoint
   */
  setEndpoint(endpoint: string): void;

  /**
   * Get remote endpoint
   */
  getEndpoint(): string;

  /**
   * Set authentication headers
   */
  setAuthHeaders(headers: Record<string, string>): void;
}

/**
 * Configuration factory interface
 */
export interface IConfigurationServiceFactory {
  /**
   * Create configuration service with providers
   */
  createService(providers: IConfigurationProvider[]): IConfigurationService;

  /**
   * Create file provider
   */
  createFileProvider(filePath: string): IFileConfigurationProvider;

  /**
   * Create environment provider
   */
  createEnvironmentProvider(prefix?: string): IEnvironmentConfigurationProvider;

  /**
   * Create remote provider
   */
  createRemoteProvider(endpoint: string): IRemoteConfigurationProvider;

  /**
   * Create memory provider
   */
  createMemoryProvider(initialConfig?: Record<string, any>): IConfigurationProvider;
}

/**
 * Configuration event types
 */
export enum ConfigurationEventType {
  INITIALIZED = 'initialized',
  LOADED = 'loaded',
  SAVED = 'saved',
  RELOADED = 'reloaded',
  VALUE_CHANGED = 'value_changed',
  SCHEMA_REGISTERED = 'schema_registered',
  VALIDATION_COMPLETED = 'validation_completed',
  ENVIRONMENT_CHANGED = 'environment_changed',
  ERROR = 'error'
}

/**
 * Configuration event data
 */
export interface IConfigurationEvent {
  readonly type: ConfigurationEventType;
  readonly timestamp: number;
  readonly data: any;
  readonly source: string;
}

/**
 * Configuration event handler function type
 */
export type ConfigurationEventHandler = (event: IConfigurationEvent) => void;

/**
 * Configuration event subscription interface
 */
export interface IConfigurationEventSubscription {
  readonly id: string;
  readonly eventType: ConfigurationEventType;
  readonly handler: ConfigurationEventHandler;
  unsubscribe(): void;
}

/**
 * Event management interface for configuration
 */
export interface IConfigurationEventManager {
  /**
   * Subscribe to configuration events
   */
  subscribe(
    eventType: ConfigurationEventType,
    handler: ConfigurationEventHandler
  ): IConfigurationEventSubscription;

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscription: IConfigurationEventSubscription): void;

  /**
   * Emit an event
   */
  emit(event: IConfigurationEvent): void;

  /**
   * Clear all subscriptions
   */
  clearSubscriptions(): void;
}

/**
 * Configuration caching interface
 */
export interface IConfigurationCache {
  /**
   * Get cached value
   */
  get(key: string): any;

  /**
   * Set cached value
   */
  set(key: string, value: any, ttl?: number): void;

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean;

  /**
   * Delete cached value
   */
  delete(key: string): boolean;

  /**
   * Clear all cached values
   */
  clear(): void;

  /**
   * Get cache statistics
   */
  getStatistics(): {
    size: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
  };
}
