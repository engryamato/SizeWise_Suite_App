/**
 * Touch Gesture Handler System
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Comprehensive touch gesture support for mobile and tablet devices including
 * long-press for snap override, two-finger gestures for pan/zoom, and swipe
 * gestures for undo/redo. Optimized for professional HVAC design workflows.
 * 
 * @fileoverview Touch gesture handler for mobile and tablet optimization
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 * 
 * @example Basic Usage
 * ```typescript
 * const touchHandler = new TouchGestureHandler({
 *   enableLongPress: true,
 *   enableTwoFingerGestures: true,
 *   enableSwipeGestures: true,
 *   hapticFeedback: true
 * });
 * 
 * // Attach to canvas element
 * touchHandler.attachToElement(canvasElement);
 * 
 * // Listen for gesture events
 * touchHandler.on('longPress', (event) => {
 *   console.log('Long press detected - override snap');
 * });
 * 
 * touchHandler.on('twoFingerPan', (event) => {
 *   console.log('Two finger pan - navigate view');
 * });
 * ```
 */

import { EventEmitter } from 'events';

/**
 * Touch gesture types
 */
export type TouchGestureType = 
  | 'tap'
  | 'longPress'
  | 'doubleTap'
  | 'twoFingerPan'
  | 'twoFingerPinch'
  | 'twoFingerRotate'
  | 'swipeLeft'
  | 'swipeRight'
  | 'swipeUp'
  | 'swipeDown'
  | 'threeFingerTap'
  | 'fourFingerTap';

/**
 * Touch gesture event data
 */
export interface TouchGestureEvent {
  type: TouchGestureType;
  originalEvent: TouchEvent;
  position: { x: number; y: number };
  deltaPosition?: { x: number; y: number };
  scale?: number;
  rotation?: number;
  velocity?: { x: number; y: number };
  duration?: number;
  fingerCount: number;
  timestamp: number;
}

/**
 * Touch gesture configuration
 */
export interface TouchGestureConfig {
  // Gesture enablement
  enableLongPress: boolean;           // Enable long-press for snap override
  enableTwoFingerGestures: boolean;   // Enable two-finger pan/zoom
  enableSwipeGestures: boolean;       // Enable swipe for undo/redo
  enableMultiFingerTaps: boolean;     // Enable 3+ finger taps
  
  // Timing thresholds
  longPressDelay: number;             // Long press delay (ms)
  doubleTapDelay: number;             // Double tap max delay (ms)
  swipeMinVelocity: number;           // Minimum swipe velocity (px/ms)
  
  // Distance thresholds
  tapMaxDistance: number;             // Maximum tap movement (px)
  swipeMinDistance: number;           // Minimum swipe distance (px)
  panMinDistance: number;             // Minimum pan distance (px)
  
  // Feedback settings
  hapticFeedback: boolean;            // Enable haptic feedback
  visualFeedback: boolean;            // Enable visual feedback
  audioFeedback: boolean;             // Enable audio feedback
  
  // Performance settings
  throttleDelay: number;              // Gesture throttling delay (ms)
  enablePassiveListeners: boolean;    // Use passive event listeners
  preventDefaultBehavior: boolean;    // Prevent default touch behaviors
}

/**
 * Default touch gesture configuration
 */
const DEFAULT_TOUCH_CONFIG: TouchGestureConfig = {
  enableLongPress: true,
  enableTwoFingerGestures: true,
  enableSwipeGestures: true,
  enableMultiFingerTaps: true,
  
  longPressDelay: 500,               // 500ms for long press
  doubleTapDelay: 300,               // 300ms for double tap
  swipeMinVelocity: 0.5,             // 0.5 px/ms minimum swipe velocity
  
  tapMaxDistance: 10,                // 10px maximum tap movement
  swipeMinDistance: 50,              // 50px minimum swipe distance
  panMinDistance: 5,                 // 5px minimum pan distance
  
  hapticFeedback: true,
  visualFeedback: true,
  audioFeedback: false,
  
  throttleDelay: 16,                 // 60fps throttling
  enablePassiveListeners: true,
  preventDefaultBehavior: true
};

/**
 * Touch point tracking
 */
interface TouchPoint {
  id: number;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  startTime: number;
  lastMoveTime: number;
  velocity: { x: number; y: number };
}

/**
 * Gesture state tracking
 */
interface GestureState {
  isActive: boolean;
  type: TouchGestureType | null;
  startTime: number;
  lastEventTime: number;
  touchPoints: Map<number, TouchPoint>;
  longPressTimer: NodeJS.Timeout | null;
  doubleTapTimer: NodeJS.Timeout | null;
  lastTapTime: number;
  lastTapPosition: { x: number; y: number } | null;
}

/**
 * Touch gesture handler class
 */
export class TouchGestureHandler extends EventEmitter {
  private config: TouchGestureConfig;
  private element: HTMLElement | null = null;
  private gestureState: GestureState;
  private isEnabled = true;
  private throttleTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<TouchGestureConfig>) {
    super();
    this.config = { ...DEFAULT_TOUCH_CONFIG, ...config };
    this.gestureState = this.createInitialGestureState();
  }

  /**
   * Attach touch gesture handler to an element
   */
  attachToElement(element: HTMLElement): void {
    if (this.element) {
      this.detachFromElement();
    }

    this.element = element;
    this.addEventListeners();
  }

  /**
   * Detach touch gesture handler from current element
   */
  detachFromElement(): void {
    if (this.element) {
      this.removeEventListeners();
      this.element = null;
    }
  }

  /**
   * Enable/disable touch gesture handling
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.resetGestureState();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TouchGestureConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): TouchGestureConfig {
    return { ...this.config };
  }

  /**
   * Check if device supports touch
   */
  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Check if device supports haptic feedback
   */
  static supportsHapticFeedback(): boolean {
    return 'vibrate' in navigator;
  }

  /**
   * Trigger haptic feedback
   */
  private triggerHapticFeedback(pattern: number | number[] = 50): void {
    if (this.config.hapticFeedback && TouchGestureHandler.supportsHapticFeedback()) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Create initial gesture state
   */
  private createInitialGestureState(): GestureState {
    return {
      isActive: false,
      type: null,
      startTime: 0,
      lastEventTime: 0,
      touchPoints: new Map(),
      longPressTimer: null,
      doubleTapTimer: null,
      lastTapTime: 0,
      lastTapPosition: null
    };
  }

  /**
   * Reset gesture state
   */
  private resetGestureState(): void {
    if (this.gestureState.longPressTimer) {
      clearTimeout(this.gestureState.longPressTimer);
    }
    if (this.gestureState.doubleTapTimer) {
      clearTimeout(this.gestureState.doubleTapTimer);
    }
    this.gestureState = this.createInitialGestureState();
  }

  /**
   * Add event listeners to element
   */
  private addEventListeners(): void {
    if (!this.element) return;

    const options = {
      passive: this.config.enablePassiveListeners && !this.config.preventDefaultBehavior,
      capture: false
    };

    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), options);
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), options);
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), options);
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), options);
  }

  /**
   * Remove event listeners from element
   */
  private removeEventListeners(): void {
    if (!this.element) return;

    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
  }

  /**
   * Handle touch start event
   */
  private handleTouchStart(event: TouchEvent): void {
    if (!this.isEnabled) return;

    if (this.config.preventDefaultBehavior) {
      event.preventDefault();
    }

    const now = Date.now();
    this.gestureState.startTime = now;
    this.gestureState.lastEventTime = now;

    // Track touch points
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchPoint: TouchPoint = {
        id: touch.identifier,
        startPosition: { x: touch.clientX, y: touch.clientY },
        currentPosition: { x: touch.clientX, y: touch.clientY },
        startTime: now,
        lastMoveTime: now,
        velocity: { x: 0, y: 0 }
      };
      this.gestureState.touchPoints.set(touch.identifier, touchPoint);
    }

    // Handle gesture recognition based on finger count
    const fingerCount = this.gestureState.touchPoints.size;

    if (fingerCount === 1) {
      this.handleSingleFingerStart(event);
    } else if (fingerCount === 2) {
      this.handleTwoFingerStart(event);
    } else if (fingerCount >= 3) {
      this.handleMultiFingerStart(event);
    }
  }

  /**
   * Handle touch move event
   */
  private handleTouchMove(event: TouchEvent): void {
    if (!this.isEnabled || this.gestureState.touchPoints.size === 0) return;

    if (this.config.preventDefaultBehavior) {
      event.preventDefault();
    }

    // Throttle move events for performance
    if (this.throttleTimer) return;

    this.throttleTimer = setTimeout(() => {
      this.throttleTimer = null;
    }, this.config.throttleDelay);

    const now = Date.now();
    this.gestureState.lastEventTime = now;

    // Update touch points
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchPoint = this.gestureState.touchPoints.get(touch.identifier);
      
      if (touchPoint) {
        const deltaTime = now - touchPoint.lastMoveTime;
        const deltaX = touch.clientX - touchPoint.currentPosition.x;
        const deltaY = touch.clientY - touchPoint.currentPosition.y;

        // Calculate velocity
        if (deltaTime > 0) {
          touchPoint.velocity.x = deltaX / deltaTime;
          touchPoint.velocity.y = deltaY / deltaTime;
        }

        touchPoint.currentPosition = { x: touch.clientX, y: touch.clientY };
        touchPoint.lastMoveTime = now;
      }
    }

    // Handle gesture updates
    const fingerCount = this.gestureState.touchPoints.size;

    if (fingerCount === 1) {
      this.handleSingleFingerMove(event);
    } else if (fingerCount === 2) {
      this.handleTwoFingerMove(event);
    }
  }

  /**
   * Handle touch end event
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isEnabled) return;

    if (this.config.preventDefaultBehavior) {
      event.preventDefault();
    }

    const now = Date.now();

    // Remove ended touch points
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.gestureState.touchPoints.delete(touch.identifier);
    }

    // Handle gesture completion
    if (this.gestureState.touchPoints.size === 0) {
      this.handleGestureEnd(event, now);
    }
  }

  /**
   * Handle touch cancel event
   */
  private handleTouchCancel(event: TouchEvent): void {
    if (!this.isEnabled) return;

    this.resetGestureState();
  }

  /**
   * Handle single finger start
   */
  private handleSingleFingerStart(event: TouchEvent): void {
    if (!this.config.enableLongPress) return;

    // Start long press timer
    this.gestureState.longPressTimer = setTimeout(() => {
      this.handleLongPress(event);
    }, this.config.longPressDelay);
  }

  /**
   * Handle single finger move
   */
  private handleSingleFingerMove(event: TouchEvent): void {
    const touch = event.touches[0];
    const touchPoint = this.gestureState.touchPoints.get(touch.identifier);
    
    if (!touchPoint) return;

    // Check if movement exceeds tap threshold
    const distance = this.calculateDistance(
      touchPoint.startPosition,
      touchPoint.currentPosition
    );

    if (distance > this.config.tapMaxDistance) {
      // Cancel long press if moving too much
      if (this.gestureState.longPressTimer) {
        clearTimeout(this.gestureState.longPressTimer);
        this.gestureState.longPressTimer = null;
      }
    }
  }

  /**
   * Handle two finger start
   */
  private handleTwoFingerStart(event: TouchEvent): void {
    if (!this.config.enableTwoFingerGestures) return;

    this.gestureState.isActive = true;
    this.gestureState.type = 'twoFingerPan';

    // Cancel any single finger gestures
    if (this.gestureState.longPressTimer) {
      clearTimeout(this.gestureState.longPressTimer);
      this.gestureState.longPressTimer = null;
    }
  }

  /**
   * Handle two finger move
   */
  private handleTwoFingerMove(event: TouchEvent): void {
    if (!this.config.enableTwoFingerGestures || event.touches.length !== 2) return;

    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    
    const touchPoint1 = this.gestureState.touchPoints.get(touch1.identifier);
    const touchPoint2 = this.gestureState.touchPoints.get(touch2.identifier);

    if (!touchPoint1 || !touchPoint2) return;

    // Calculate center point
    const centerX = (touch1.clientX + touch2.clientX) / 2;
    const centerY = (touch1.clientY + touch2.clientY) / 2;

    // Calculate previous center point
    const prevCenterX = (touchPoint1.startPosition.x + touchPoint2.startPosition.x) / 2;
    const prevCenterY = (touchPoint1.startPosition.y + touchPoint2.startPosition.y) / 2;

    // Calculate pan delta
    const deltaX = centerX - prevCenterX;
    const deltaY = centerY - prevCenterY;

    // Calculate scale (pinch/zoom)
    const currentDistance = this.calculateDistance(
      { x: touch1.clientX, y: touch1.clientY },
      { x: touch2.clientX, y: touch2.clientY }
    );
    
    const startDistance = this.calculateDistance(
      touchPoint1.startPosition,
      touchPoint2.startPosition
    );

    const scale = startDistance > 0 ? currentDistance / startDistance : 1;

    // Emit two finger pan/zoom event
    this.emitGestureEvent({
      type: 'twoFingerPan',
      originalEvent: event,
      position: { x: centerX, y: centerY },
      deltaPosition: { x: deltaX, y: deltaY },
      scale,
      fingerCount: 2,
      timestamp: Date.now()
    });
  }

  /**
   * Handle multi finger start
   */
  private handleMultiFingerStart(event: TouchEvent): void {
    if (!this.config.enableMultiFingerTaps) return;

    const fingerCount = event.touches.length;
    
    if (fingerCount === 3) {
      this.gestureState.type = 'threeFingerTap';
    } else if (fingerCount === 4) {
      this.gestureState.type = 'fourFingerTap';
    }
  }

  /**
   * Handle long press gesture
   */
  private handleLongPress(event: TouchEvent): void {
    this.triggerHapticFeedback([100, 50, 100]); // Double pulse for long press

    this.emitGestureEvent({
      type: 'longPress',
      originalEvent: event,
      position: this.getTouchPosition(event.touches[0]),
      duration: Date.now() - this.gestureState.startTime,
      fingerCount: 1,
      timestamp: Date.now()
    });
  }

  /**
   * Handle gesture end
   */
  private handleGestureEnd(event: TouchEvent, endTime: number): void {
    const duration = endTime - this.gestureState.startTime;
    const touch = event.changedTouches[0];
    const position = this.getTouchPosition(touch);

    // Determine gesture type based on state and movement
    if (this.gestureState.type === 'threeFingerTap' || this.gestureState.type === 'fourFingerTap') {
      this.handleMultiFingerTap(event, this.gestureState.type);
    } else if (duration < this.config.longPressDelay) {
      this.handleTapOrSwipe(event, position, duration);
    }

    this.resetGestureState();
  }

  /**
   * Handle tap or swipe gesture
   */
  private handleTapOrSwipe(event: TouchEvent, position: { x: number; y: number }, duration: number): void {
    const touchPoint = Array.from(this.gestureState.touchPoints.values())[0];
    if (!touchPoint) return;

    const distance = this.calculateDistance(touchPoint.startPosition, position);
    const velocity = Math.sqrt(
      touchPoint.velocity.x * touchPoint.velocity.x + 
      touchPoint.velocity.y * touchPoint.velocity.y
    );

    // Check for swipe gesture
    if (this.config.enableSwipeGestures && 
        distance >= this.config.swipeMinDistance && 
        velocity >= this.config.swipeMinVelocity) {
      this.handleSwipeGesture(event, touchPoint, position);
    } else if (distance <= this.config.tapMaxDistance) {
      this.handleTapGesture(event, position);
    }
  }

  /**
   * Handle swipe gesture
   */
  private handleSwipeGesture(event: TouchEvent, touchPoint: TouchPoint, endPosition: { x: number; y: number }): void {
    const deltaX = endPosition.x - touchPoint.startPosition.x;
    const deltaY = endPosition.y - touchPoint.startPosition.y;

    let swipeType: TouchGestureType;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      swipeType = deltaX > 0 ? 'swipeRight' : 'swipeLeft';
    } else {
      swipeType = deltaY > 0 ? 'swipeDown' : 'swipeUp';
    }

    this.triggerHapticFeedback(30); // Short pulse for swipe

    this.emitGestureEvent({
      type: swipeType,
      originalEvent: event,
      position: endPosition,
      deltaPosition: { x: deltaX, y: deltaY },
      velocity: touchPoint.velocity,
      fingerCount: 1,
      timestamp: Date.now()
    });
  }

  /**
   * Handle tap gesture
   */
  private handleTapGesture(event: TouchEvent, position: { x: number; y: number }): void {
    const now = Date.now();
    const timeSinceLastTap = now - this.gestureState.lastTapTime;

    // Check for double tap
    if (timeSinceLastTap < this.config.doubleTapDelay && 
        this.gestureState.lastTapPosition &&
        this.calculateDistance(position, this.gestureState.lastTapPosition) <= this.config.tapMaxDistance) {
      
      // Clear double tap timer
      if (this.gestureState.doubleTapTimer) {
        clearTimeout(this.gestureState.doubleTapTimer);
        this.gestureState.doubleTapTimer = null;
      }

      this.triggerHapticFeedback(20); // Quick pulse for double tap

      this.emitGestureEvent({
        type: 'doubleTap',
        originalEvent: event,
        position,
        fingerCount: 1,
        timestamp: now
      });

      this.gestureState.lastTapTime = 0;
      this.gestureState.lastTapPosition = null;
    } else {
      // Single tap - wait for potential double tap
      this.gestureState.lastTapTime = now;
      this.gestureState.lastTapPosition = position;

      this.gestureState.doubleTapTimer = setTimeout(() => {
        this.triggerHapticFeedback(10); // Very short pulse for single tap

        this.emitGestureEvent({
          type: 'tap',
          originalEvent: event,
          position,
          fingerCount: 1,
          timestamp: now
        });

        this.gestureState.lastTapTime = 0;
        this.gestureState.lastTapPosition = null;
      }, this.config.doubleTapDelay);
    }
  }

  /**
   * Handle multi finger tap
   */
  private handleMultiFingerTap(event: TouchEvent, gestureType: 'threeFingerTap' | 'fourFingerTap'): void {
    const fingerCount = gestureType === 'threeFingerTap' ? 3 : 4;
    
    this.triggerHapticFeedback(fingerCount === 3 ? [50, 30, 50] : [50, 30, 50, 30, 50]);

    // Calculate center position of all touches
    let centerX = 0;
    let centerY = 0;
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      centerX += touch.clientX;
      centerY += touch.clientY;
    }
    centerX /= event.changedTouches.length;
    centerY /= event.changedTouches.length;

    this.emitGestureEvent({
      type: gestureType,
      originalEvent: event,
      position: { x: centerX, y: centerY },
      fingerCount,
      timestamp: Date.now()
    });
  }

  /**
   * Emit gesture event
   */
  private emitGestureEvent(gestureEvent: TouchGestureEvent): void {
    this.emit('gesture', gestureEvent);
    this.emit(gestureEvent.type, gestureEvent);
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    const deltaX = point2.x - point1.x;
    const deltaY = point2.y - point1.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  /**
   * Get touch position from touch object
   */
  private getTouchPosition(touch: Touch): { x: number; y: number } {
    return { x: touch.clientX, y: touch.clientY };
  }

  /**
   * Dispose of the touch gesture handler
   */
  dispose(): void {
    this.detachFromElement();
    this.resetGestureState();
    this.removeAllListeners();
  }
}
