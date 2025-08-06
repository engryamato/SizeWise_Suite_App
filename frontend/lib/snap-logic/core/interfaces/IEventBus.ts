/**
 * Event Bus Interface
 * SizeWise Suite - Architectural Refactoring Priority Group
 * 
 * Core interface for standardized event handling across all modules with
 * type-safe event contracts, subscription management, and error handling
 * for reliable inter-module communication.
 * 
 * @fileoverview Event bus interface definition
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

/**
 * Event priority levels
 */
export enum EventPriority {
  HIGHEST = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
  LOWEST = 5
}

/**
 * Event delivery modes
 */
export enum EventDeliveryMode {
  SYNC = 'sync',
  ASYNC = 'async',
  DEFERRED = 'deferred'
}

/**
 * Base event interface
 */
export interface IBaseEvent {
  readonly id: string;
  readonly type: string;
  readonly timestamp: number;
  readonly source: string;
  readonly priority: EventPriority;
  readonly deliveryMode: EventDeliveryMode;
  readonly metadata?: Record<string, any>;
}

/**
 * Event with typed data
 */
export interface IEvent<TData = any> extends IBaseEvent {
  readonly data: TData;
}

/**
 * Event handler function type
 */
export type EventHandler<TData = any> = (event: IEvent<TData>) => void | Promise<void>;

/**
 * Event handler with error handling
 */
export type SafeEventHandler<TData = any> = (
  event: IEvent<TData>
) => Promise<{
  success: boolean;
  error?: Error;
  result?: any;
}>;

/**
 * Event subscription options
 */
export interface IEventSubscriptionOptions {
  readonly priority?: EventPriority;
  readonly once?: boolean;
  readonly filter?: (event: IBaseEvent) => boolean;
  readonly errorHandler?: (error: Error, event: IBaseEvent) => void;
  readonly timeout?: number;
  readonly retryCount?: number;
  readonly retryDelay?: number;
}

/**
 * Event subscription interface
 */
export interface IEventSubscription {
  readonly id: string;
  readonly eventType: string;
  readonly handler: EventHandler;
  readonly options: IEventSubscriptionOptions;
  readonly subscribedAt: number;
  readonly callCount: number;
  readonly lastCalled?: number;
  readonly isActive: boolean;
  unsubscribe(): void;
}

/**
 * Event publication options
 */
export interface IEventPublicationOptions {
  readonly priority?: EventPriority;
  readonly deliveryMode?: EventDeliveryMode;
  readonly timeout?: number;
  readonly retryOnFailure?: boolean;
  readonly maxRetries?: number;
  readonly retryDelay?: number;
  readonly waitForHandlers?: boolean;
}

/**
 * Event publication result
 */
export interface IEventPublicationResult {
  readonly eventId: string;
  readonly success: boolean;
  readonly handlerCount: number;
  readonly successfulHandlers: number;
  readonly failedHandlers: number;
  readonly errors: Error[];
  readonly publishTime: number;
  readonly totalTime: number;
}

/**
 * Event bus interface
 * 
 * Defines the contract for event-driven communication between modules
 * with type safety, error handling, and performance monitoring.
 */
export interface IEventBus {
  /**
   * Subscribe to events of a specific type
   */
  subscribe<TData = any>(
    eventType: string,
    handler: EventHandler<TData>,
    options?: IEventSubscriptionOptions
  ): IEventSubscription;

  /**
   * Subscribe to events with safe error handling
   */
  subscribeSafe<TData = any>(
    eventType: string,
    handler: SafeEventHandler<TData>,
    options?: IEventSubscriptionOptions
  ): IEventSubscription;

  /**
   * Subscribe to multiple event types
   */
  subscribeMultiple<TData = any>(
    eventTypes: string[],
    handler: EventHandler<TData>,
    options?: IEventSubscriptionOptions
  ): IEventSubscription[];

  /**
   * Subscribe to events matching a pattern
   */
  subscribePattern<TData = any>(
    pattern: string | RegExp,
    handler: EventHandler<TData>,
    options?: IEventSubscriptionOptions
  ): IEventSubscription;

  /**
   * Subscribe once to an event
   */
  once<TData = any>(
    eventType: string,
    handler: EventHandler<TData>,
    options?: Omit<IEventSubscriptionOptions, 'once'>
  ): IEventSubscription;

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscription: IEventSubscription): boolean;

  /**
   * Unsubscribe all handlers for an event type
   */
  unsubscribeAll(eventType: string): number;

  /**
   * Unsubscribe all handlers from all events
   */
  clear(): void;

  /**
   * Publish an event
   */
  publish<TData = any>(
    eventType: string,
    data: TData,
    options?: IEventPublicationOptions
  ): Promise<IEventPublicationResult>;

  /**
   * Publish an event synchronously
   */
  publishSync<TData = any>(
    eventType: string,
    data: TData,
    options?: Omit<IEventPublicationOptions, 'deliveryMode'>
  ): IEventPublicationResult;

  /**
   * Publish an event and wait for all handlers to complete
   */
  publishAndWait<TData = any>(
    eventType: string,
    data: TData,
    timeout?: number
  ): Promise<IEventPublicationResult>;

  /**
   * Emit a pre-constructed event
   */
  emit(event: IEvent): Promise<IEventPublicationResult>;

  /**
   * Check if there are any subscribers for an event type
   */
  hasSubscribers(eventType: string): boolean;

  /**
   * Get subscriber count for an event type
   */
  getSubscriberCount(eventType: string): number;

  /**
   * Get all active subscriptions
   */
  getSubscriptions(): IEventSubscription[];

  /**
   * Get subscriptions for a specific event type
   */
  getSubscriptionsForEvent(eventType: string): IEventSubscription[];

  /**
   * Wait for a specific event to be published
   */
  waitFor<TData = any>(
    eventType: string,
    timeout?: number,
    filter?: (event: IEvent<TData>) => boolean
  ): Promise<IEvent<TData>>;

  /**
   * Create a filtered event bus
   */
  createFilteredBus(filter: (event: IBaseEvent) => boolean): IEventBus;

  /**
   * Create a namespaced event bus
   */
  createNamespacedBus(namespace: string): IEventBus;

  /**
   * Get event bus statistics
   */
  getStatistics(): {
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalEvents: number;
    eventsPerSecond: number;
    averageHandlerTime: number;
    errorRate: number;
    memoryUsage: number;
  };

  /**
   * Enable/disable event bus
   */
  setEnabled(enabled: boolean): void;

  /**
   * Check if event bus is enabled
   */
  isEnabled(): boolean;

  /**
   * Dispose of event bus and clean up resources
   */
  dispose(): void;
}

/**
 * Event middleware interface
 */
export interface IEventMiddleware {
  /**
   * Process event before publication
   */
  beforePublish?(event: IEvent): IEvent | Promise<IEvent>;

  /**
   * Process event after publication
   */
  afterPublish?(
    event: IEvent,
    result: IEventPublicationResult
  ): void | Promise<void>;

  /**
   * Process event before handler execution
   */
  beforeHandle?(
    event: IEvent,
    subscription: IEventSubscription
  ): IEvent | Promise<IEvent>;

  /**
   * Process event after handler execution
   */
  afterHandle?(
    event: IEvent,
    subscription: IEventSubscription,
    result: any,
    error?: Error
  ): void | Promise<void>;

  /**
   * Get middleware name
   */
  getName(): string;

  /**
   * Get middleware priority
   */
  getPriority(): number;
}

/**
 * Event bus factory interface
 */
export interface IEventBusFactory {
  /**
   * Create a new event bus
   */
  createEventBus(): IEventBus;

  /**
   * Create event bus with middleware
   */
  createEventBusWithMiddleware(middleware: IEventMiddleware[]): IEventBus;

  /**
   * Create event bus with configuration
   */
  createEventBusWithConfig(config: IEventBusConfig): IEventBus;
}

/**
 * Event bus configuration
 */
export interface IEventBusConfig {
  readonly maxSubscriptions?: number;
  readonly defaultTimeout?: number;
  readonly enableMetrics?: boolean;
  readonly enableLogging?: boolean;
  readonly errorHandling?: {
    readonly retryCount?: number;
    readonly retryDelay?: number;
    readonly continueOnError?: boolean;
  };
  readonly performance?: {
    readonly maxEventHistory?: number;
    readonly metricsInterval?: number;
    readonly enableProfiling?: boolean;
  };
  readonly middleware?: IEventMiddleware[];
}

/**
 * Event store interface for event sourcing
 */
export interface IEventStore {
  /**
   * Store an event
   */
  store(event: IEvent): Promise<void>;

  /**
   * Retrieve events by type
   */
  getEvents(eventType: string, fromTimestamp?: number): Promise<IEvent[]>;

  /**
   * Retrieve events by source
   */
  getEventsBySource(source: string, fromTimestamp?: number): Promise<IEvent[]>;

  /**
   * Retrieve all events in time range
   */
  getEventsInRange(
    startTimestamp: number,
    endTimestamp: number
  ): Promise<IEvent[]>;

  /**
   * Clear stored events
   */
  clear(): Promise<void>;

  /**
   * Get event count
   */
  getEventCount(): Promise<number>;
}

/**
 * Event replay interface
 */
export interface IEventReplay {
  /**
   * Replay events from store
   */
  replay(
    eventBus: IEventBus,
    filter?: (event: IEvent) => boolean
  ): Promise<void>;

  /**
   * Replay events in time range
   */
  replayTimeRange(
    eventBus: IEventBus,
    startTimestamp: number,
    endTimestamp: number
  ): Promise<void>;

  /**
   * Replay events by type
   */
  replayEventType(eventBus: IEventBus, eventType: string): Promise<void>;
}
