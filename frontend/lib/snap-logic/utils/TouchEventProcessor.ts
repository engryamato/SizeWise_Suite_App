/**
 * Touch Event Processor Utility
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Comprehensive touch event processing utilities for converting touch gestures
 * into drawing actions, viewport navigation, and snap logic interactions.
 * Optimized for professional HVAC design workflows on touch devices.
 * 
 * @fileoverview Touch event processing utilities for canvas integration
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

import { TouchGestureEvent, TouchGestureType } from '../system/TouchGestureHandler';

/**
 * Touch processing configuration
 */
export interface TouchProcessingConfig {
  // Gesture sensitivity
  longPressSnapOverride: boolean;     // Enable long press for snap override
  twoFingerNavigation: boolean;       // Enable two-finger navigation
  swipeUndoRedo: boolean;            // Enable swipe for undo/redo
  doubleTapZoom: boolean;            // Enable double tap zoom
  
  // Timing settings
  snapOverrideDuration: number;       // How long snap override lasts (ms)
  feedbackDuration: number;          // Visual feedback duration (ms)
  gestureTimeout: number;            // Gesture timeout (ms)
  
  // Sensitivity settings
  panSensitivity: number;            // Pan sensitivity multiplier
  zoomSensitivity: number;           // Zoom sensitivity multiplier
  swipeVelocityThreshold: number;    // Minimum swipe velocity
  
  // Visual feedback
  showGestureFeedback: boolean;      // Show visual gesture feedback
  showActiveGestureIndicator: boolean; // Show active gesture indicator
  hapticFeedback: boolean;           // Enable haptic feedback
}

/**
 * Default touch processing configuration
 */
export const DEFAULT_TOUCH_CONFIG: TouchProcessingConfig = {
  longPressSnapOverride: true,
  twoFingerNavigation: true,
  swipeUndoRedo: true,
  doubleTapZoom: true,
  
  snapOverrideDuration: 3000,        // 3 seconds
  feedbackDuration: 500,             // 500ms
  gestureTimeout: 1000,              // 1 second
  
  panSensitivity: 1.0,
  zoomSensitivity: 1.0,
  swipeVelocityThreshold: 0.5,
  
  showGestureFeedback: true,
  showActiveGestureIndicator: true,
  hapticFeedback: true
};

/**
 * Touch action types
 */
export type TouchActionType = 
  | 'draw'
  | 'select'
  | 'pan'
  | 'zoom'
  | 'snapOverride'
  | 'undo'
  | 'redo'
  | 'debugToggle'
  | 'zoomToFit';

/**
 * Touch action result
 */
export interface TouchActionResult {
  type: TouchActionType;
  position?: { x: number; y: number };
  delta?: { x: number; y: number };
  scale?: number;
  data?: any;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

/**
 * Touch feedback data
 */
export interface TouchFeedbackData {
  visible: boolean;
  position: { x: number; y: number };
  type: 'tap' | 'longPress' | 'pan' | 'zoom' | 'swipe';
  intensity: number;
  color?: string;
  size?: number;
  duration?: number;
}

/**
 * Touch event processor class
 */
export class TouchEventProcessor {
  private config: TouchProcessingConfig;
  private activeGesture: TouchGestureType | null = null;
  private gestureStartTime: number = 0;
  private snapOverrideActive: boolean = false;
  private snapOverrideTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<TouchProcessingConfig>) {
    this.config = { ...DEFAULT_TOUCH_CONFIG, ...config };
  }

  /**
   * Process touch gesture event and return action result
   */
  processGestureEvent(event: TouchGestureEvent): TouchActionResult | null {
    this.activeGesture = event.type;
    this.gestureStartTime = event.timestamp;

    switch (event.type) {
      case 'tap':
        return this.processTap(event);
      
      case 'longPress':
        return this.processLongPress(event);
      
      case 'doubleTap':
        return this.processDoubleTap(event);
      
      case 'twoFingerPan':
        return this.processTwoFingerPan(event);
      
      case 'twoFingerPinch':
        return this.processPinch(event);
      
      case 'swipeLeft':
        return this.processSwipeLeft(event);
      
      case 'swipeRight':
        return this.processSwipeRight(event);
      
      case 'threeFingerTap':
        return this.processThreeFingerTap(event);
      
      default:
        return null;
    }
  }

  /**
   * Process tap gesture
   */
  private processTap(event: TouchGestureEvent): TouchActionResult {
    return {
      type: 'draw',
      position: event.position,
      preventDefault: true
    };
  }

  /**
   * Process long press gesture (snap override)
   */
  private processLongPress(event: TouchGestureEvent): TouchActionResult {
    if (!this.config.longPressSnapOverride) {
      return { type: 'select', position: event.position };
    }

    // Activate snap override
    this.activateSnapOverride();

    return {
      type: 'snapOverride',
      position: event.position,
      data: { active: true, duration: this.config.snapOverrideDuration },
      preventDefault: true
    };
  }

  /**
   * Process double tap gesture (zoom to fit)
   */
  private processDoubleTap(event: TouchGestureEvent): TouchActionResult {
    if (!this.config.doubleTapZoom) {
      return { type: 'select', position: event.position };
    }

    return {
      type: 'zoomToFit',
      position: event.position,
      preventDefault: true
    };
  }

  /**
   * Process two finger pan gesture
   */
  private processTwoFingerPan(event: TouchGestureEvent): TouchActionResult {
    if (!this.config.twoFingerNavigation || !event.deltaPosition) {
      return { type: 'select', position: event.position };
    }

    const adjustedDelta = {
      x: event.deltaPosition.x * this.config.panSensitivity,
      y: event.deltaPosition.y * this.config.panSensitivity
    };

    return {
      type: 'pan',
      position: event.position,
      delta: adjustedDelta,
      scale: event.scale,
      preventDefault: true,
      stopPropagation: true
    };
  }

  /**
   * Process pinch gesture (zoom)
   */
  private processPinch(event: TouchGestureEvent): TouchActionResult {
    if (!this.config.twoFingerNavigation || !event.scale) {
      return { type: 'select', position: event.position };
    }

    const adjustedScale = 1 + ((event.scale - 1) * this.config.zoomSensitivity);

    return {
      type: 'zoom',
      position: event.position,
      scale: adjustedScale,
      preventDefault: true,
      stopPropagation: true
    };
  }

  /**
   * Process swipe left gesture (undo)
   */
  private processSwipeLeft(event: TouchGestureEvent): TouchActionResult {
    if (!this.config.swipeUndoRedo) {
      return { type: 'select', position: event.position };
    }

    // Check velocity threshold
    const velocity = event.velocity ? 
      Math.sqrt(event.velocity.x * event.velocity.x + event.velocity.y * event.velocity.y) : 0;
    
    if (velocity < this.config.swipeVelocityThreshold) {
      return { type: 'select', position: event.position };
    }

    return {
      type: 'undo',
      position: event.position,
      data: { velocity: event.velocity },
      preventDefault: true
    };
  }

  /**
   * Process swipe right gesture (redo)
   */
  private processSwipeRight(event: TouchGestureEvent): TouchActionResult {
    if (!this.config.swipeUndoRedo) {
      return { type: 'select', position: event.position };
    }

    // Check velocity threshold
    const velocity = event.velocity ? 
      Math.sqrt(event.velocity.x * event.velocity.x + event.velocity.y * event.velocity.y) : 0;
    
    if (velocity < this.config.swipeVelocityThreshold) {
      return { type: 'select', position: event.position };
    }

    return {
      type: 'redo',
      position: event.position,
      data: { velocity: event.velocity },
      preventDefault: true
    };
  }

  /**
   * Process three finger tap gesture (debug toggle)
   */
  private processThreeFingerTap(event: TouchGestureEvent): TouchActionResult {
    return {
      type: 'debugToggle',
      position: event.position,
      preventDefault: true
    };
  }

  /**
   * Generate touch feedback data for gesture
   */
  generateTouchFeedback(event: TouchGestureEvent): TouchFeedbackData | null {
    if (!this.config.showGestureFeedback) return null;

    const feedbackMap: Record<TouchGestureType, Partial<TouchFeedbackData>> = {
      tap: { type: 'tap', intensity: 0.5, color: '#3b82f6', size: 30 },
      longPress: { type: 'longPress', intensity: 1.0, color: '#ef4444', size: 50 },
      doubleTap: { type: 'tap', intensity: 0.8, color: '#8b5cf6', size: 40 },
      twoFingerPan: { type: 'pan', intensity: 0.7, color: '#22c55e', size: 40 },
      twoFingerPinch: { type: 'zoom', intensity: 0.8, color: '#a855f7', size: 60 },
      twoFingerRotate: { type: 'zoom', intensity: 0.6, color: '#06b6d4', size: 50 },
      swipeLeft: { type: 'swipe', intensity: 0.8, color: '#f59e0b', size: 35 },
      swipeRight: { type: 'swipe', intensity: 0.8, color: '#f59e0b', size: 35 },
      swipeUp: { type: 'swipe', intensity: 0.6, color: '#84cc16', size: 30 },
      swipeDown: { type: 'swipe', intensity: 0.6, color: '#84cc16', size: 30 },
      threeFingerTap: { type: 'tap', intensity: 1.0, color: '#6b7280', size: 60 },
      fourFingerTap: { type: 'tap', intensity: 1.0, color: '#374151', size: 70 }
    };

    const feedbackConfig = feedbackMap[event.type];
    if (!feedbackConfig) return null;

    return {
      visible: true,
      position: event.position,
      type: feedbackConfig.type || 'tap',
      intensity: feedbackConfig.intensity || 0.5,
      color: feedbackConfig.color,
      size: feedbackConfig.size,
      duration: this.config.feedbackDuration
    };
  }

  /**
   * Activate snap override with timer
   */
  private activateSnapOverride(): void {
    this.snapOverrideActive = true;

    // Clear existing timer
    if (this.snapOverrideTimer) {
      clearTimeout(this.snapOverrideTimer);
    }

    // Set timer to deactivate snap override
    this.snapOverrideTimer = setTimeout(() => {
      this.snapOverrideActive = false;
      this.snapOverrideTimer = null;
    }, this.config.snapOverrideDuration);
  }

  /**
   * Check if snap override is active
   */
  isSnapOverrideActive(): boolean {
    return this.snapOverrideActive;
  }

  /**
   * Manually deactivate snap override
   */
  deactivateSnapOverride(): void {
    this.snapOverrideActive = false;
    if (this.snapOverrideTimer) {
      clearTimeout(this.snapOverrideTimer);
      this.snapOverrideTimer = null;
    }
  }

  /**
   * Get current active gesture
   */
  getActiveGesture(): TouchGestureType | null {
    return this.activeGesture;
  }

  /**
   * Clear active gesture
   */
  clearActiveGesture(): void {
    this.activeGesture = null;
    this.gestureStartTime = 0;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TouchProcessingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): TouchProcessingConfig {
    return { ...this.config };
  }

  /**
   * Dispose of the processor
   */
  dispose(): void {
    if (this.snapOverrideTimer) {
      clearTimeout(this.snapOverrideTimer);
      this.snapOverrideTimer = null;
    }
    this.clearActiveGesture();
    this.snapOverrideActive = false;
  }
}
