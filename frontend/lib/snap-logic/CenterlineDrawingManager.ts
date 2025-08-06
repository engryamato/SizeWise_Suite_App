/**
 * Centerline Drawing Manager
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Manages the centerline drawing process with pencil tool integration,
 * snap logic, and real-time validation according to SMACNA standards.
 */

import { 
  Centerline, 
  CenterlinePoint, 
  CenterlineType,
  CenterlineDrawingState,
  SnapPoint,
  SnapResult
} from '@/types/air-duct-sizer';
import { CenterlineUtils } from './CenterlineUtils';
import { SnapLogicManager } from './SnapLogicManager';

/**
 * Drawing modes for centerline creation
 */
export type CenterlineDrawingMode = 'point-to-point' | 'continuous' | 'arc-guided';

/**
 * Drawing configuration
 */
export interface CenterlineDrawingConfig {
  mode: CenterlineDrawingMode;
  defaultType: CenterlineType;
  autoSnap: boolean;
  showPreview: boolean;
  validateSMACNA: boolean;
  minSegmentLength: number; // pixels
  maxPoints: number;
}

/**
 * Drawing event types
 */
export type CenterlineDrawingEvent = 
  | 'drawing_started'
  | 'point_added'
  | 'point_removed'
  | 'drawing_completed'
  | 'drawing_cancelled'
  | 'validation_warning'
  | 'snap_engaged'
  | 'snap_disengaged';

/**
 * Event callback type
 */
export type CenterlineDrawingEventCallback = (
  event: CenterlineDrawingEvent,
  data: {
    centerline?: Centerline;
    point?: CenterlinePoint;
    snapResult?: SnapResult;
    warnings?: string[];
  }
) => void;

/**
 * Default drawing configuration
 */
const DEFAULT_DRAWING_CONFIG: CenterlineDrawingConfig = {
  mode: 'point-to-point',
  defaultType: 'arc',
  autoSnap: true,
  showPreview: true,
  validateSMACNA: true,
  minSegmentLength: 20,
  maxPoints: 50
};

/**
 * Centerline drawing manager
 */
export class CenterlineDrawingManager {
  private config: CenterlineDrawingConfig;
  private snapManager: SnapLogicManager;
  private drawingState: CenterlineDrawingState;
  private eventCallbacks: Map<CenterlineDrawingEvent, CenterlineDrawingEventCallback[]> = new Map();
  private centerlineCounter = 0;

  constructor(
    snapManager: SnapLogicManager,
    config?: Partial<CenterlineDrawingConfig>
  ) {
    this.snapManager = snapManager;
    this.config = { ...DEFAULT_DRAWING_CONFIG, ...config };
    this.drawingState = {
      isActive: false,
      currentCenterline: null,
      previewPoint: null,
      snapTarget: null
    };
  }

  /**
   * Start drawing a new centerline
   */
  startDrawing(
    startPoint: { x: number; y: number },
    type?: CenterlineType
  ): Centerline {
    const centerlineType = type || this.config.defaultType;
    const centerlineId = `centerline_${Date.now()}_${++this.centerlineCounter}`;
    
    const initialPoint: CenterlinePoint = {
      x: startPoint.x,
      y: startPoint.y
    };

    const centerline = CenterlineUtils.createCenterline(centerlineId, centerlineType, initialPoint);
    
    this.drawingState = {
      isActive: true,
      currentCenterline: centerline,
      previewPoint: null,
      snapTarget: null
    };

    this.emitEvent('drawing_started', { centerline });
    
    return centerline;
  }

  /**
   * Add a point to the current centerline
   */
  addPoint(position: { x: number; y: number }): boolean {
    if (!this.drawingState.isActive || !this.drawingState.currentCenterline) {
      return false;
    }

    let finalPosition = position;

    // Apply snapping if enabled
    if (this.config.autoSnap) {
      const snapResult = this.snapManager.findClosestSnapPoint(position);
      if (snapResult.isSnapped && snapResult.snapPoint) {
        finalPosition = snapResult.snapPoint.position;
        this.drawingState.snapTarget = snapResult.snapPoint;
        this.emitEvent('snap_engaged', { snapResult });
      } else {
        this.drawingState.snapTarget = null;
        this.emitEvent('snap_disengaged', {});
      }
    }

    // Check minimum segment length
    const currentCenterline = this.drawingState.currentCenterline;
    if (currentCenterline.points.length > 0) {
      const lastPoint = currentCenterline.points[currentCenterline.points.length - 1];
      const distance = Math.sqrt(
        Math.pow(finalPosition.x - lastPoint.x, 2) + 
        Math.pow(finalPosition.y - lastPoint.y, 2)
      );

      if (distance < this.config.minSegmentLength) {
        return false; // Point too close to last point
      }
    }

    // Check maximum points limit
    if (currentCenterline.points.length >= this.config.maxPoints) {
      this.completeDrawing();
      return false;
    }

    const newPoint: CenterlinePoint = {
      x: finalPosition.x,
      y: finalPosition.y
    };

    // Add tangent information for arc-based centerlines
    if (currentCenterline.type === 'arc' && currentCenterline.points.length > 0) {
      const lastPoint = currentCenterline.points[currentCenterline.points.length - 1];
      newPoint.tangent = {
        x: finalPosition.x - lastPoint.x,
        y: finalPosition.y - lastPoint.y
      };
    }

    this.drawingState.currentCenterline = CenterlineUtils.addPoint(currentCenterline, newPoint);

    this.emitEvent('point_added', { 
      centerline: this.drawingState.currentCenterline,
      point: newPoint
    });

    // Emit validation warnings if any
    if (this.config.validateSMACNA && this.drawingState.currentCenterline.warnings.length > 0) {
      this.emitEvent('validation_warning', {
        centerline: this.drawingState.currentCenterline,
        warnings: this.drawingState.currentCenterline.warnings
      });
    }

    return true;
  }

  /**
   * Remove the last point from the current centerline
   */
  removeLastPoint(): boolean {
    if (!this.drawingState.isActive || 
        !this.drawingState.currentCenterline ||
        this.drawingState.currentCenterline.points.length === 0) {
      return false;
    }

    const removedPoint = this.drawingState.currentCenterline.points[
      this.drawingState.currentCenterline.points.length - 1
    ];

    this.drawingState.currentCenterline = CenterlineUtils.removeLastPoint(
      this.drawingState.currentCenterline
    );

    this.emitEvent('point_removed', {
      centerline: this.drawingState.currentCenterline,
      point: removedPoint
    });

    return true;
  }

  /**
   * Update preview point for visual feedback
   */
  updatePreview(position: { x: number; y: number }): void {
    if (!this.drawingState.isActive) return;

    let previewPosition = position;

    // Apply snapping for preview
    if (this.config.autoSnap) {
      const snapResult = this.snapManager.findClosestSnapPoint(position);
      if (snapResult.isSnapped && snapResult.snapPoint) {
        previewPosition = snapResult.snapPoint.position;
        this.drawingState.snapTarget = snapResult.snapPoint;
      } else {
        this.drawingState.snapTarget = null;
      }
    }

    this.drawingState.previewPoint = {
      x: previewPosition.x,
      y: previewPosition.y
    };
  }

  /**
   * Complete the current centerline drawing
   */
  completeDrawing(): Centerline | null {
    if (!this.drawingState.isActive || !this.drawingState.currentCenterline) {
      return null;
    }

    const completedCenterline = CenterlineUtils.completeCenterline(
      this.drawingState.currentCenterline
    );

    this.drawingState = {
      isActive: false,
      currentCenterline: null,
      previewPoint: null,
      snapTarget: null
    };

    this.emitEvent('drawing_completed', { centerline: completedCenterline });

    return completedCenterline;
  }

  /**
   * Cancel the current centerline drawing
   */
  cancelDrawing(): void {
    const cancelledCenterline = this.drawingState.currentCenterline;

    this.drawingState = {
      isActive: false,
      currentCenterline: null,
      previewPoint: null,
      snapTarget: null
    };

    this.emitEvent('drawing_cancelled', { centerline: cancelledCenterline });
  }

  /**
   * Toggle centerline type between arc and segmented
   */
  toggleCenterlineType(): void {
    if (!this.drawingState.currentCenterline) return;

    const currentType = this.drawingState.currentCenterline.type;
    const newType: CenterlineType = currentType === 'arc' ? 'segmented' : 'arc';

    if (newType === 'arc') {
      this.drawingState.currentCenterline = CenterlineUtils.convertToArc(
        this.drawingState.currentCenterline
      );
    } else {
      this.drawingState.currentCenterline = CenterlineUtils.convertToSegmented(
        this.drawingState.currentCenterline
      );
    }

    // Update configuration default
    this.config.defaultType = newType;
  }

  /**
   * Get current drawing state
   */
  getDrawingState(): CenterlineDrawingState {
    return { ...this.drawingState };
  }

  /**
   * Check if currently drawing
   */
  isDrawing(): boolean {
    return this.drawingState.isActive;
  }

  /**
   * Get current centerline
   */
  getCurrentCenterline(): Centerline | null {
    return this.drawingState.currentCenterline;
  }

  /**
   * Get preview point
   */
  getPreviewPoint(): CenterlinePoint | null {
    return this.drawingState.previewPoint;
  }

  /**
   * Get current snap target
   */
  getSnapTarget(): SnapPoint | null {
    return this.drawingState.snapTarget;
  }

  /**
   * Update drawing configuration
   */
  updateConfig(newConfig: Partial<CenterlineDrawingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): CenterlineDrawingConfig {
    return { ...this.config };
  }

  /**
   * Register event callback
   */
  on(event: CenterlineDrawingEvent, callback: CenterlineDrawingEventCallback): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  /**
   * Unregister event callback
   */
  off(event: CenterlineDrawingEvent, callback: CenterlineDrawingEventCallback): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to registered callbacks
   */
  private emitEvent(
    event: CenterlineDrawingEvent,
    data: Parameters<CenterlineDrawingEventCallback>[1]
  ): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(event, data));
    }
  }
}
