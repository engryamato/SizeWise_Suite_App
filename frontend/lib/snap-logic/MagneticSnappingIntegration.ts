/**
 * Magnetic Snapping Integration
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Integrates magnetic snapping with existing drawing tools, handles modifier keys,
 * and provides cursor attraction logic for smooth user experience.
 */

import {
  SnapPoint,
  SnapResult,
  SnapConfig,
  DrawingTool,
  Room,
  Segment,
  Equipment,
  Centerline
} from '@/types/air-duct-sizer';
import { SnapLogicManager } from './SnapLogicManager';
import { SnapPointGenerator } from './SnapPointGenerator';
import {
  TouchGestureHandler,
  TouchGestureEvent,
  TouchGestureConfig,
  TouchGestureType
} from './system/TouchGestureHandler';

/**
 * Touch gesture callbacks interface
 */
export interface TouchGestureCallbacks {
  onTap?: (event: GestureEvent) => void;
  onLongPress?: (event: GestureEvent) => void;
  onPinch?: (event: GestureEvent) => void;
  onPan?: (event: GestureEvent) => void;
}

/**
 * Gesture event interface
 */
export interface GestureEvent {
  type: string;
  position: { x: number; y: number };
  timestamp: number;
  direction?: { x: number; y: number };
  touches?: Array<{ x: number; y: number }>;
  data?: any;
}

/**
 * Magnetic snapping configuration
 */
interface MagneticSnappingConfig {
  enabled: boolean;
  attractionThreshold: number; // pixels - distance at which cursor starts being attracted
  snapThreshold: number; // pixels - distance at which snapping occurs
  attractionStrength: number; // 0-1, how strongly cursor is pulled toward snap points
  smoothingFactor: number; // 0-1, smoothing for cursor movement
  enabledTools: DrawingTool[]; // Tools that support magnetic snapping
  modifierBehavior: {
    ctrl: 'disable' | 'override' | 'precision'; // Ctrl key behavior
    alt: 'disable' | 'override' | 'precision'; // Alt key behavior
    shift: 'disable' | 'override' | 'precision'; // Shift key behavior
  };
  // Touch gesture configuration
  touchGestures: {
    enabled: boolean;
    longPressOverride: boolean; // Long press to override snap
    twoFingerPan: boolean; // Two finger pan for viewport navigation
    swipeUndo: boolean; // Two finger swipe for undo/redo
    hapticFeedback: boolean; // Haptic feedback for touch interactions
  };
}

/**
 * Cursor attraction result
 */
interface CursorAttractionResult {
  originalPosition: { x: number; y: number };
  attractedPosition: { x: number; y: number };
  isAttracted: boolean;
  attractionStrength: number; // 0-1
  targetSnapPoint: SnapPoint | null;
}

/**
 * Default magnetic snapping configuration
 */
const DEFAULT_MAGNETIC_CONFIG: MagneticSnappingConfig = {
  enabled: true,
  attractionThreshold: 30,
  snapThreshold: 15,
  attractionStrength: 0.6,
  smoothingFactor: 0.3,
  enabledTools: ['pencil', 'duct', 'room', 'equipment'],
  modifierBehavior: {
    ctrl: 'disable',
    alt: 'precision',
    shift: 'override'
  },
  touchGestures: {
    enabled: true,
    longPressOverride: true,
    twoFingerPan: true,
    swipeUndo: true,
    hapticFeedback: true
  }
};

/**
 * Magnetic snapping integration manager
 */
export class MagneticSnappingIntegration {
  private snapManager: SnapLogicManager;
  private config: MagneticSnappingConfig;
  private currentTool: DrawingTool = 'select';
  private modifierKeys = { ctrl: false, alt: false, shift: false };
  private lastCursorPosition = { x: 0, y: 0 };
  private attractionHistory: { x: number; y: number }[] = [];

  // Touch gesture integration
  private touchGestureHandler: TouchGestureHandler | null = null;
  private isSnapOverrideActive = false; // Long press override state
  private touchElement: HTMLElement | null = null;

  // Touch gesture callbacks
  private touchCallbacks: TouchGestureCallbacks = {};

  constructor(
    snapManager: SnapLogicManager,
    config?: Partial<MagneticSnappingConfig>
  ) {
    this.snapManager = snapManager;
    this.config = { ...DEFAULT_MAGNETIC_CONFIG, ...config };
    this.setupEventListeners();
    this.initializeTouchGestures();
  }

  /**
   * Setup keyboard event listeners for modifier keys
   */
  private setupEventListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown.bind(this));
      window.addEventListener('keyup', this.handleKeyUp.bind(this));
      window.addEventListener('blur', this.resetModifierKeys.bind(this));
    }
  }

  /**
   * Initialize touch gesture handling
   */
  private initializeTouchGestures(): void {
    if (!this.config.touchGestures.enabled || !TouchGestureHandler.isTouchDevice()) {
      return;
    }

    // Create touch gesture handler with new API
    this.touchGestureHandler = new TouchGestureHandler({
      enableLongPress: this.config.touchGestures.longPressOverride,
      enableTwoFingerGestures: this.config.touchGestures.twoFingerPan,
      enableSwipeGestures: this.config.touchGestures.swipeUndo,
      hapticFeedback: this.config.touchGestures.hapticFeedback,
      longPressDelay: 500,
      tapMaxDistance: 15,
      swipeMinDistance: 60,
      panMinDistance: 25
    });

    // Setup event listeners for touch gestures
    this.touchGestureHandler.on('longPress', this.handleTouchLongPress.bind(this));
    this.touchGestureHandler.on('twoFingerPan', this.handleTouchTwoFingerPan.bind(this));
    this.touchGestureHandler.on('swipeLeft', this.handleTouchSwipeLeft.bind(this));
    this.touchGestureHandler.on('swipeRight', this.handleTouchSwipeRight.bind(this));
    this.touchGestureHandler.on('tap', this.handleTouchTap.bind(this));
    this.touchGestureHandler.on('doubleTap', this.handleTouchDoubleTap.bind(this));
    this.touchGestureHandler.on('threeFingerTap', this.handleThreeFingerTap.bind(this));
  }

  /**
   * Attach touch gesture handler to DOM element
   */
  attachToElement(element: HTMLElement): void {
    this.touchElement = element;

    if (this.touchGestureHandler && this.config.touchGestures.enabled) {
      this.touchGestureHandler.attachToElement(element);
    }
  }

  /**
   * Detach touch gesture handler from current element
   */
  detachFromElement(): void {
    if (this.touchGestureHandler) {
      this.touchGestureHandler.detachFromElement();
    }
    this.touchElement = null;
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    this.modifierKeys.ctrl = event.ctrlKey;
    this.modifierKeys.alt = event.altKey;
    this.modifierKeys.shift = event.shiftKey;
    
    this.updateSnapManagerModifiers();
  }

  /**
   * Handle keyup events
   */
  private handleKeyUp(event: KeyboardEvent): void {
    this.modifierKeys.ctrl = event.ctrlKey;
    this.modifierKeys.alt = event.altKey;
    this.modifierKeys.shift = event.shiftKey;
    
    this.updateSnapManagerModifiers();
  }

  /**
   * Reset modifier keys (on window blur)
   */
  private resetModifierKeys(): void {
    this.modifierKeys = { ctrl: false, alt: false, shift: false };
    this.updateSnapManagerModifiers();
  }

  /**
   * Update snap manager with current modifier key states
   */
  private updateSnapManagerModifiers(): void {
    this.snapManager.updateModifierKeys(this.modifierKeys);
    
    // Apply modifier behaviors
    const isSnapDisabled = this.isSnapDisabledByModifiers();
    this.snapManager.setSnapEnabled(this.config.enabled && !isSnapDisabled);
  }

  /**
   * Check if snapping is disabled by modifier keys or touch override
   */
  private isSnapDisabledByModifiers(): boolean {
    return this.isSnapOverrideActive ||
           (this.modifierKeys.ctrl && this.config.modifierBehavior.ctrl === 'disable') ||
           (this.modifierKeys.alt && this.config.modifierBehavior.alt === 'disable') ||
           (this.modifierKeys.shift && this.config.modifierBehavior.shift === 'disable');
  }

  /**
   * Handle touch long press gesture (snap override)
   */
  private handleTouchLongPress(event: TouchGestureEvent): void {
    if (!this.config.touchGestures.longPressOverride) return;

    this.isSnapOverrideActive = true;
    this.snapManager.setSnapEnabled(false);

    // Trigger haptic feedback
    if (this.config.touchGestures.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]); // Triple vibration for snap override
    }

    console.debug('Touch: Snap override activated via long press');
  }

  /**
   * Handle touch two-finger pan gesture (viewport navigation)
   */
  private handleTouchTwoFingerPan(event: TouchGestureEvent): void {
    if (!this.config.touchGestures.twoFingerPan || !event.deltaPosition) return;

    // Emit viewport pan event for canvas to handle
    if (this.touchElement) {
      const panEvent = new CustomEvent('touch-viewport-pan', {
        detail: {
          deltaX: event.deltaPosition.x,
          deltaY: event.deltaPosition.y,
          position: event.position,
          scale: event.scale || 1
        }
      });
      this.touchElement.dispatchEvent(panEvent);
    }
  }

  /**
   * Handle touch swipe gesture (undo/redo)
   */
  private handleTouchSwipe(event: GestureEvent): void {
    if (!this.config.touchGestures.swipeUndo || !event.direction) return;

    // Emit undo/redo events based on swipe direction
    if (this.touchElement) {
      let action: 'undo' | 'redo' | null = null;

      if (event.direction && event.direction.x < -0.5) {
        action = 'undo';
      } else if (event.direction && event.direction.x > 0.5) {
        action = 'redo';
      }

      if (action) {
        const actionEvent = new CustomEvent(`touch-${action}`, {
          detail: {
            direction: event.direction,
            position: event.position
          }
        });
        this.touchElement.dispatchEvent(actionEvent);

        // Haptic feedback for undo/redo
        if (this.config.touchGestures.hapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate(action === 'undo' ? 100 : [50, 50]); // Different patterns for undo/redo
        }
      }
    }
  }

  /**
   * Handle touch tap gesture
   */
  private handleTouchTap(event: GestureEvent): void {
    // Convert touch position to world coordinates and process as click
    if (this.touchElement) {
      const clickEvent = new CustomEvent('touch-click', {
        detail: {
          position: event.position,
          isSnapOverrideActive: this.isSnapOverrideActive
        }
      });
      this.touchElement.dispatchEvent(clickEvent);
    }
  }

  /**
   * Handle touch gesture start
   */
  private handleTouchGestureStart(event: GestureEvent): void {
    // Reset snap override state on new gesture
    if (event.touches.length === 1) {
      // Single touch - maintain current override state
    } else {
      // Multi-touch - disable snap override
      this.isSnapOverrideActive = false;
      this.snapManager.setSnapEnabled(this.config.enabled);
    }
  }

  /**
   * Handle touch gesture end
   */
  private handleTouchGestureEnd(event: GestureEvent): void {
    // Reset snap override state when all touches end
    if (event.touches.length === 0) {
      this.isSnapOverrideActive = false;
      this.snapManager.setSnapEnabled(this.config.enabled && !this.isSnapDisabledByModifiers());
    }
  }

  /**
   * Set current drawing tool
   */
  setCurrentTool(tool: DrawingTool): void {
    this.currentTool = tool;
  }

  /**
   * Check if magnetic snapping is enabled for current tool
   */
  isEnabledForCurrentTool(): boolean {
    return this.config.enabled && 
           this.config.enabledTools.includes(this.currentTool) &&
           !this.isSnapDisabledByModifiers();
  }

  /**
   * Update snap points from project elements
   */
  updateSnapPointsFromProject(
    rooms: Room[],
    segments: Segment[],
    equipment: Equipment[],
    centerlines: Centerline[]
  ): void {
    // Clear existing snap points
    this.snapManager.clearSnapPoints();

    // Generate snap points for each element type
    rooms.forEach(room => {
      const snapPoints = SnapPointGenerator.generateRoomSnapPoints(room);
      snapPoints.forEach(point => this.snapManager.addSnapPoint(point));
    });

    segments.forEach(segment => {
      const snapPoints = SnapPointGenerator.generateSegmentSnapPoints(segment);
      snapPoints.forEach(point => this.snapManager.addSnapPoint(point));
    });

    equipment.forEach(equip => {
      const snapPoints = SnapPointGenerator.generateEquipmentSnapPoints(equip);
      snapPoints.forEach(point => this.snapManager.addSnapPoint(point));
    });

    centerlines.forEach(centerline => {
      const snapPoints = SnapPointGenerator.generateCenterlineSnapPoints(centerline);
      snapPoints.forEach(point => this.snapManager.addSnapPoint(point));
    });

    // Generate intersection points
    const intersectionPoints = SnapPointGenerator.generateIntersectionSnapPoints(segments, centerlines);
    intersectionPoints.forEach(point => this.snapManager.addSnapPoint(point));
  }

  /**
   * Process cursor movement with magnetic attraction
   */
  processCursorMovement(
    rawPosition: { x: number; y: number },
    viewport: { x: number; y: number; scale: number }
  ): CursorAttractionResult {
    // Convert screen coordinates to world coordinates
    const worldPosition = {
      x: (rawPosition.x - viewport.x) / viewport.scale,
      y: (rawPosition.y - viewport.y) / viewport.scale
    };

    this.lastCursorPosition = worldPosition;

    if (!this.isEnabledForCurrentTool()) {
      return {
        originalPosition: worldPosition,
        attractedPosition: worldPosition,
        isAttracted: false,
        attractionStrength: 0,
        targetSnapPoint: null
      };
    }

    // Find closest snap point
    const snapResult = this.snapManager.findClosestSnapPoint(worldPosition);
    
    if (!snapResult.snapPoint || snapResult.distance > this.config.attractionThreshold) {
      return {
        originalPosition: worldPosition,
        attractedPosition: worldPosition,
        isAttracted: false,
        attractionStrength: 0,
        targetSnapPoint: null
      };
    }

    // Calculate attraction
    const attractionResult = this.calculateCursorAttraction(worldPosition, snapResult);
    
    // Apply smoothing
    const smoothedPosition = this.applyCursorSmoothing(attractionResult.attractedPosition);

    return {
      ...attractionResult,
      attractedPosition: smoothedPosition
    };
  }

  /**
   * Calculate cursor attraction toward snap point
   */
  private calculateCursorAttraction(
    cursorPosition: { x: number; y: number },
    snapResult: SnapResult
  ): CursorAttractionResult {
    if (!snapResult.snapPoint) {
      return {
        originalPosition: cursorPosition,
        attractedPosition: cursorPosition,
        isAttracted: false,
        attractionStrength: 0,
        targetSnapPoint: null
      };
    }

    const snapPoint = snapResult.snapPoint;
    const distance = snapResult.distance;

    // Calculate attraction strength based on distance
    let attractionStrength = 0;
    
    if (distance <= this.config.snapThreshold) {
      // Full snap - cursor jumps to snap point
      attractionStrength = 1;
    } else if (distance <= this.config.attractionThreshold) {
      // Magnetic attraction - cursor is pulled toward snap point
      const normalizedDistance = (distance - this.config.snapThreshold) / 
                                (this.config.attractionThreshold - this.config.snapThreshold);
      attractionStrength = (1 - normalizedDistance) * this.config.attractionStrength;
    }

    // Apply precision mode if modifier key is pressed
    if (this.isPrecisionModeActive()) {
      attractionStrength *= 0.3; // Reduce attraction in precision mode
    }

    // Calculate attracted position
    const attractedPosition = {
      x: cursorPosition.x + (snapPoint.position.x - cursorPosition.x) * attractionStrength,
      y: cursorPosition.y + (snapPoint.position.y - cursorPosition.y) * attractionStrength
    };

    return {
      originalPosition: cursorPosition,
      attractedPosition,
      isAttracted: attractionStrength > 0,
      attractionStrength,
      targetSnapPoint: snapPoint
    };
  }

  /**
   * Check if precision mode is active
   */
  private isPrecisionModeActive(): boolean {
    return (this.modifierKeys.ctrl && this.config.modifierBehavior.ctrl === 'precision') ||
           (this.modifierKeys.alt && this.config.modifierBehavior.alt === 'precision') ||
           (this.modifierKeys.shift && this.config.modifierBehavior.shift === 'precision');
  }

  /**
   * Apply cursor smoothing to reduce jitter
   */
  private applyCursorSmoothing(position: { x: number; y: number }): { x: number; y: number } {
    if (this.config.smoothingFactor === 0) {
      return position;
    }

    // Add to history
    this.attractionHistory.push(position);
    
    // Keep only recent history
    const maxHistoryLength = 5;
    if (this.attractionHistory.length > maxHistoryLength) {
      this.attractionHistory = this.attractionHistory.slice(-maxHistoryLength);
    }

    // Calculate smoothed position
    if (this.attractionHistory.length === 1) {
      return position;
    }

    const smoothingFactor = this.config.smoothingFactor;
    const previousPosition = this.attractionHistory[this.attractionHistory.length - 2];

    return {
      x: previousPosition.x + (position.x - previousPosition.x) * (1 - smoothingFactor),
      y: previousPosition.y + (position.y - previousPosition.y) * (1 - smoothingFactor)
    };
  }

  /**
   * Get snap result for current cursor position
   */
  getCurrentSnapResult(): SnapResult | null {
    if (!this.isEnabledForCurrentTool()) {
      return null;
    }

    return this.snapManager.findClosestSnapPoint(this.lastCursorPosition);
  }

  /**
   * Force snap to specific point
   */
  forceSnapToPoint(snapPointId: string): { x: number; y: number } | null {
    const snapPoints = Array.from(this.snapManager['snapPoints'].values());
    const targetPoint = snapPoints.find(point => point.id === snapPointId);
    
    if (!targetPoint) {
      return null;
    }

    return { ...targetPoint.position };
  }

  /**
   * Get all snap points within cursor attraction range
   */
  getSnapPointsInAttractionRange(): SnapPoint[] {
    if (!this.isEnabledForCurrentTool()) {
      return [];
    }

    const snapResult = this.snapManager.findClosestSnapPoint(this.lastCursorPosition);
    
    if (!snapResult.snapPoint || snapResult.distance > this.config.attractionThreshold) {
      return [];
    }

    // Find all snap points within attraction threshold
    const allSnapPoints = Array.from(this.snapManager['snapPoints'].values());
    return allSnapPoints.filter(point => {
      const distance = Math.sqrt(
        Math.pow(point.position.x - this.lastCursorPosition.x, 2) +
        Math.pow(point.position.y - this.lastCursorPosition.y, 2)
      );
      return distance <= this.config.attractionThreshold;
    });
  }

  /**
   * Update magnetic snapping configuration
   */
  updateConfig(newConfig: Partial<MagneticSnappingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): MagneticSnappingConfig {
    return { ...this.config };
  }

  /**
   * Get current modifier key states
   */
  getModifierKeys(): { ctrl: boolean; alt: boolean; shift: boolean } {
    return { ...this.modifierKeys };
  }

  /**
   * Get touch gesture support status
   */
  isTouchGestureSupported(): boolean {
    return TouchGestureHandler.isTouchDevice();
  }

  /**
   * Get current touch override state
   */
  isSnapOverrideActiveFromTouch(): boolean {
    return this.isSnapOverrideActive;
  }

  /**
   * Update touch gesture configuration
   */
  updateTouchGestureConfig(config: Partial<MagneticSnappingConfig['touchGestures']>): void {
    this.config.touchGestures = { ...this.config.touchGestures, ...config };

    if (this.touchGestureHandler) {
      this.touchGestureHandler.updateConfig({
        hapticFeedback: this.config.touchGestures.hapticFeedback
      });
    }
  }

  /**
   * Handle touch swipe left gesture (undo)
   */
  private handleTouchSwipeLeft(event: TouchGestureEvent): void {
    if (!this.config.touchGestures.swipeUndo) return;

    // Emit undo event
    if (this.touchElement) {
      const undoEvent = new CustomEvent('touch-undo', {
        detail: { position: event.position, velocity: event.velocity }
      });
      this.touchElement.dispatchEvent(undoEvent);
    }

    console.log('Touch swipe left - undo action');
  }

  /**
   * Handle touch swipe right gesture (redo)
   */
  private handleTouchSwipeRight(event: TouchGestureEvent): void {
    if (!this.config.touchGestures.swipeUndo) return;

    // Emit redo event
    if (this.touchElement) {
      const redoEvent = new CustomEvent('touch-redo', {
        detail: { position: event.position, velocity: event.velocity }
      });
      this.touchElement.dispatchEvent(redoEvent);
    }

    console.log('Touch swipe right - redo action');
  }

  /**
   * Handle touch double tap gesture
   */
  private handleTouchDoubleTap(event: TouchGestureEvent): void {
    // Emit double tap event for zoom or tool selection
    if (this.touchElement) {
      const doubleTapEvent = new CustomEvent('touch-double-tap', {
        detail: { position: event.position }
      });
      this.touchElement.dispatchEvent(doubleTapEvent);
    }

    console.log('Touch double tap');
  }

  /**
   * Handle three finger tap gesture (debug mode toggle)
   */
  private handleThreeFingerTap(event: TouchGestureEvent): void {
    // Emit debug mode toggle event
    if (this.touchElement) {
      const debugToggleEvent = new CustomEvent('touch-debug-toggle', {
        detail: { position: event.position }
      });
      this.touchElement.dispatchEvent(debugToggleEvent);
    }

    console.log('Three finger tap - debug mode toggle');
  }

  /**
   * Cleanup event listeners and touch gestures
   */
  destroy(): void {
    // Cleanup keyboard event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown.bind(this));
      window.removeEventListener('keyup', this.handleKeyUp.bind(this));
      window.removeEventListener('blur', this.resetModifierKeys.bind(this));
    }

    // Cleanup touch gesture handler
    if (this.touchGestureHandler) {
      this.touchGestureHandler.dispose();
      this.touchGestureHandler = null;
    }

    // Reset state
    this.isSnapOverrideActive = false;
    this.touchElement = null;
  }
}
