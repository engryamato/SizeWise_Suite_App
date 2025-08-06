/**
 * Drawing Service Interface
 * SizeWise Suite - Architectural Refactoring Priority Group
 * 
 * Core interface for centerline drawing functionality, defining the contract
 * for drawing operations, state management, and SMACNA compliance validation.
 * This interface enables loose coupling and better testability.
 * 
 * @fileoverview Drawing service interface definition
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import { Point2D, Centerline } from '@/types/air-duct-sizer';
import { ISnapPoint, ISnapResult } from './ISnapDetectionService';

/**
 * Drawing tool types
 */
export enum DrawingToolType {
  SELECT = 'select',
  PENCIL = 'pencil',
  ARC = 'arc',
  STRAIGHT = 'straight',
  SEGMENTED = 'segmented',
  BRANCH = 'branch',
  ERASER = 'eraser'
}

/**
 * Drawing mode types
 */
export enum DrawingMode {
  SINGLE = 'single',
  CONTINUOUS = 'continuous',
  SNAP_TO_GRID = 'snap_to_grid',
  FREE_FORM = 'free_form'
}

/**
 * Centerline drawing state
 */
export enum DrawingState {
  IDLE = 'idle',
  DRAWING = 'drawing',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ERROR = 'error'
}

/**
 * Drawing validation result
 */
export interface IDrawingValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
  readonly smacnaCompliant: boolean;
  readonly suggestions: string[];
}

/**
 * Drawing configuration
 */
export interface IDrawingConfig {
  readonly defaultTool: DrawingToolType;
  readonly defaultMode: DrawingMode;
  readonly autoSnap: boolean;
  readonly validateSMACNA: boolean;
  readonly showPreview: boolean;
  readonly enableUndo: boolean;
  readonly maxUndoSteps: number;
  readonly smoothingEnabled: boolean;
  readonly smoothingTolerance: number;
  readonly minSegmentLength: number;
  readonly maxSegmentLength: number;
}

/**
 * Drawing context information
 */
export interface IDrawingContext {
  readonly currentTool: DrawingToolType;
  readonly currentMode: DrawingMode;
  readonly state: DrawingState;
  readonly activeSnapPoint: ISnapPoint | null;
  readonly lastSnapResult: ISnapResult | null;
  readonly previewPoints: Point2D[];
  readonly isSnapping: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

/**
 * Drawing operation result
 */
export interface IDrawingOperationResult {
  readonly success: boolean;
  readonly centerlineId?: string;
  readonly centerline?: Centerline;
  readonly validationResult?: IDrawingValidationResult;
  readonly error?: string;
  readonly warnings?: string[];
}

/**
 * Drawing service interface
 * 
 * Defines the contract for centerline drawing functionality including
 * drawing operations, state management, and validation.
 */
export interface IDrawingService {
  /**
   * Start a new drawing operation
   */
  startDrawing(
    startPoint: Point2D,
    tool?: DrawingToolType,
    mode?: DrawingMode
  ): Promise<IDrawingOperationResult>;

  /**
   * Add a point to the current drawing
   */
  addPoint(point: Point2D): Promise<IDrawingOperationResult>;

  /**
   * Complete the current drawing
   */
  completeDrawing(): Promise<IDrawingOperationResult>;

  /**
   * Cancel the current drawing
   */
  cancelDrawing(): Promise<void>;

  /**
   * Pause the current drawing
   */
  pauseDrawing(): Promise<void>;

  /**
   * Resume a paused drawing
   */
  resumeDrawing(): Promise<void>;

  /**
   * Set the active drawing tool
   */
  setTool(tool: DrawingToolType): Promise<void>;

  /**
   * Set the drawing mode
   */
  setMode(mode: DrawingMode): Promise<void>;

  /**
   * Get current drawing context
   */
  getContext(): Promise<IDrawingContext>;

  /**
   * Get current drawing state
   */
  getState(): Promise<DrawingState>;

  /**
   * Undo the last drawing operation
   */
  undo(): Promise<IDrawingOperationResult>;

  /**
   * Redo the last undone operation
   */
  redo(): Promise<IDrawingOperationResult>;

  /**
   * Clear undo/redo history
   */
  clearHistory(): Promise<void>;

  /**
   * Validate a centerline
   */
  validateCenterline(centerline: Centerline): Promise<IDrawingValidationResult>;

  /**
   * Get preview points for current drawing
   */
  getPreviewPoints(): Promise<Point2D[]>;

  /**
   * Update drawing configuration
   */
  updateConfig(config: Partial<IDrawingConfig>): Promise<void>;

  /**
   * Get current configuration
   */
  getConfig(): Promise<IDrawingConfig>;

  /**
   * Get all centerlines
   */
  getAllCenterlines(): Promise<Centerline[]>;

  /**
   * Get centerline by ID
   */
  getCenterline(id: string): Promise<Centerline | null>;

  /**
   * Delete a centerline
   */
  deleteCenterline(id: string): Promise<boolean>;

  /**
   * Update a centerline
   */
  updateCenterline(id: string, updates: Partial<Centerline>): Promise<boolean>;

  /**
   * Get drawing statistics
   */
  getStatistics(): Promise<{
    totalCenterlines: number;
    totalLength: number;
    averageLength: number;
    validCenterlines: number;
    smacnaCompliantCenterlines: number;
  }>;
}

/**
 * Drawing event types
 */
export enum DrawingEventType {
  DRAWING_STARTED = 'drawing_started',
  DRAWING_COMPLETED = 'drawing_completed',
  DRAWING_CANCELLED = 'drawing_cancelled',
  DRAWING_PAUSED = 'drawing_paused',
  DRAWING_RESUMED = 'drawing_resumed',
  POINT_ADDED = 'point_added',
  TOOL_CHANGED = 'tool_changed',
  MODE_CHANGED = 'mode_changed',
  CENTERLINE_CREATED = 'centerline_created',
  CENTERLINE_UPDATED = 'centerline_updated',
  CENTERLINE_DELETED = 'centerline_deleted',
  VALIDATION_COMPLETED = 'validation_completed',
  UNDO_PERFORMED = 'undo_performed',
  REDO_PERFORMED = 'redo_performed'
}

/**
 * Drawing event data
 */
export interface IDrawingEvent {
  readonly type: DrawingEventType;
  readonly timestamp: number;
  readonly data: any;
  readonly context: IDrawingContext;
}

/**
 * Drawing event handler function type
 */
export type DrawingEventHandler = (event: IDrawingEvent) => void;

/**
 * Drawing event subscription interface
 */
export interface IDrawingEventSubscription {
  readonly id: string;
  readonly eventType: DrawingEventType;
  readonly handler: DrawingEventHandler;
  unsubscribe(): void;
}

/**
 * Event management interface for drawing
 */
export interface IDrawingEventManager {
  /**
   * Subscribe to drawing events
   */
  subscribe(
    eventType: DrawingEventType,
    handler: DrawingEventHandler
  ): IDrawingEventSubscription;

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscription: IDrawingEventSubscription): void;

  /**
   * Emit an event
   */
  emit(event: IDrawingEvent): void;

  /**
   * Clear all subscriptions
   */
  clearSubscriptions(): void;
}

/**
 * Drawing service factory interface
 */
export interface IDrawingServiceFactory {
  /**
   * Create a new drawing service instance
   */
  createService(config?: Partial<IDrawingConfig>): IDrawingService;

  /**
   * Get default configuration
   */
  getDefaultConfig(): IDrawingConfig;
}

/**
 * Drawing performance metrics
 */
export interface IDrawingMetrics {
  readonly operationCount: number;
  readonly averageOperationTime: number;
  readonly validationTime: number;
  readonly undoRedoOperations: number;
  readonly memoryUsage: number;
  readonly errorCount: number;
}

/**
 * Performance monitoring interface for drawing
 */
export interface IDrawingPerformanceMonitor {
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
  getMetrics(): IDrawingMetrics;

  /**
   * Reset metrics
   */
  resetMetrics(): void;
}
