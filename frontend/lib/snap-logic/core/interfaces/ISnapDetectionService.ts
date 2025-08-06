/**
 * Snap Detection Service Interface
 * SizeWise Suite - Architectural Refactoring Priority Group
 * 
 * Core interface for snap detection functionality, defining the contract
 * for snap point detection, priority management, and spatial queries.
 * This interface enables loose coupling and better testability.
 * 
 * @fileoverview Snap detection service interface definition
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import { Point2D } from '@/types/air-duct-sizer';

/**
 * Snap point type enumeration
 */
export enum SnapPointType {
  ENDPOINT = 'endpoint',
  CENTERLINE = 'centerline',
  MIDPOINT = 'midpoint',
  INTERSECTION = 'intersection',
  GRID = 'grid',
  CUSTOM = 'custom'
}

/**
 * Snap point priority levels
 */
export enum SnapPriority {
  HIGHEST = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4,
  LOWEST = 5
}

/**
 * Snap point definition
 */
export interface ISnapPoint {
  readonly id: string;
  readonly type: SnapPointType;
  readonly position: Point2D;
  readonly priority: SnapPriority;
  readonly elementId: string;
  readonly elementType: string;
  readonly metadata?: Record<string, any>;
  readonly isActive: boolean;
}

/**
 * Snap detection result
 */
export interface ISnapResult {
  readonly isSnapped: boolean;
  readonly snapPoint: ISnapPoint | null;
  readonly distance: number;
  readonly adjustedPosition: Point2D;
  readonly confidence: number;
  readonly timestamp: number;
}

/**
 * Snap detection configuration
 */
export interface ISnapDetectionConfig {
  enabled: boolean;
  snapThreshold: number;
  magneticThreshold: number;
  priorityWeighting: boolean;
  excludeTypes: SnapPointType[];
  maxSnapPoints: number;
  spatialOptimization: boolean;
}

/**
 * Spatial query options
 */
export interface ISpatialQueryOptions {
  readonly bounds?: {
    readonly min: Point2D;
    readonly max: Point2D;
  };
  readonly radius?: number;
  readonly center?: Point2D;
  readonly maxResults?: number;
  readonly excludeTypes?: SnapPointType[];
  readonly minPriority?: SnapPriority;
}

/**
 * Snap detection service interface
 * 
 * Defines the contract for snap detection functionality including
 * snap point management, spatial queries, and detection algorithms.
 */
export interface ISnapDetectionService {
  /**
   * Find the closest snap point to a given position
   */
  findClosestSnapPoint(
    position: Point2D,
    options?: ISpatialQueryOptions
  ): Promise<ISnapResult>;

  /**
   * Find all snap points within a specified area
   */
  findSnapPointsInArea(
    options: ISpatialQueryOptions
  ): Promise<ISnapPoint[]>;

  /**
   * Add a snap point to the detection system
   */
  addSnapPoint(snapPoint: ISnapPoint): Promise<void>;

  /**
   * Remove a snap point from the detection system
   */
  removeSnapPoint(id: string): Promise<boolean>;

  /**
   * Update an existing snap point
   */
  updateSnapPoint(id: string, updates: Partial<ISnapPoint>): Promise<boolean>;

  /**
   * Get a snap point by ID
   */
  getSnapPoint(id: string): Promise<ISnapPoint | null>;

  /**
   * Get all snap points
   */
  getAllSnapPoints(): Promise<ISnapPoint[]>;

  /**
   * Clear all snap points
   */
  clearSnapPoints(): Promise<void>;

  /**
   * Update detection configuration
   */
  updateConfig(config: Partial<ISnapDetectionConfig>): Promise<void>;

  /**
   * Get current configuration
   */
  getConfig(): Promise<ISnapDetectionConfig>;

  /**
   * Enable/disable snap detection
   */
  setEnabled(enabled: boolean): Promise<void>;

  /**
   * Check if snap detection is enabled
   */
  isEnabled(): Promise<boolean>;

  /**
   * Get detection statistics
   */
  getStatistics(): Promise<{
    totalSnapPoints: number;
    activeSnapPoints: number;
    lastDetectionTime: number;
    averageDetectionTime: number;
    cacheHitRate: number;
  }>;

  /**
   * Optimize spatial indexing
   */
  optimizeSpatialIndex(): Promise<void>;

  /**
   * Validate snap point data integrity
   */
  validateIntegrity(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}

/**
 * Snap detection event types
 */
export enum SnapDetectionEventType {
  SNAP_POINT_ADDED = 'snap_point_added',
  SNAP_POINT_REMOVED = 'snap_point_removed',
  SNAP_POINT_UPDATED = 'snap_point_updated',
  SNAP_DETECTED = 'snap_detected',
  SNAP_LOST = 'snap_lost',
  CONFIG_UPDATED = 'config_updated',
  SPATIAL_INDEX_OPTIMIZED = 'spatial_index_optimized'
}

/**
 * Snap detection event data
 */
export interface ISnapDetectionEvent {
  readonly type: SnapDetectionEventType;
  readonly timestamp: number;
  readonly data: any;
  readonly source: string;
}

/**
 * Event handler function type
 */
export type SnapDetectionEventHandler = (event: ISnapDetectionEvent) => void;

/**
 * Event subscription interface
 */
export interface ISnapDetectionEventSubscription {
  readonly id: string;
  readonly eventType: SnapDetectionEventType;
  readonly handler: SnapDetectionEventHandler;
  unsubscribe(): void;
}

/**
 * Event management interface for snap detection
 */
export interface ISnapDetectionEventManager {
  /**
   * Subscribe to snap detection events
   */
  subscribe(
    eventType: SnapDetectionEventType,
    handler: SnapDetectionEventHandler
  ): ISnapDetectionEventSubscription;

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscription: ISnapDetectionEventSubscription): void;

  /**
   * Emit an event
   */
  emit(event: ISnapDetectionEvent): void;

  /**
   * Clear all subscriptions
   */
  clearSubscriptions(): void;

  /**
   * Get active subscription count
   */
  getSubscriptionCount(): number;
}

/**
 * Snap detection service factory interface
 */
export interface ISnapDetectionServiceFactory {
  /**
   * Create a new snap detection service instance
   */
  createService(config?: Partial<ISnapDetectionConfig>): ISnapDetectionService;

  /**
   * Create service with custom spatial indexing
   */
  createServiceWithSpatialIndex(
    spatialIndexType: 'quadtree' | 'rtree' | 'grid',
    config?: Partial<ISnapDetectionConfig>
  ): ISnapDetectionService;

  /**
   * Get default configuration
   */
  getDefaultConfig(): ISnapDetectionConfig;
}

/**
 * Snap detection performance metrics
 */
export interface ISnapDetectionMetrics {
  detectionCount: number;
  averageDetectionTime: number;
  maxDetectionTime: number;
  minDetectionTime: number;
  cacheHitRate: number;
  spatialIndexEfficiency: number;
  memoryUsage: number;
  errorCount: number;
}

/**
 * Performance monitoring interface for snap detection
 */
export interface ISnapDetectionPerformanceMonitor {
  /**
   * Start performance monitoring
   */
  startMonitoring(): void;

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void;

  /**
   * Get current metrics
   */
  getMetrics(): ISnapDetectionMetrics;

  /**
   * Reset metrics
   */
  resetMetrics(): void;

  /**
   * Set performance thresholds
   */
  setThresholds(thresholds: {
    maxDetectionTime?: number;
    minCacheHitRate?: number;
    maxMemoryUsage?: number;
  }): void;

  /**
   * Check if performance is within acceptable limits
   */
  isPerformanceAcceptable(): boolean;

  /**
   * Record a detection operation time
   */
  recordDetection(time: number): void;

  /**
   * Record a cache hit
   */
  recordCacheHit(): void;

  /**
   * Record a cache miss
   */
  recordCacheMiss(): void;

  /**
   * Record an error
   */
  recordError(): void;
}
