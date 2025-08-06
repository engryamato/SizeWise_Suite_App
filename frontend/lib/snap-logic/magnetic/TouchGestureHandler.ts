/**
 * Touch Gesture Handler
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Handles touch gestures for mobile and tablet devices including long-press
 * for snap override, two-finger gestures for pan/zoom, and swipe-based undo/redo.
 * 
 * @fileoverview Touch gesture recognition and handling for snap logic system
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 * 
 * @example Basic Usage
 * ```typescript
 * const gestureHandler = new TouchGestureHandler({
 *   onLongPress: (position) => console.log('Long press at:', position),
 *   onTwoFingerPan: (delta) => console.log('Pan delta:', delta),
 *   onSwipe: (direction) => console.log('Swipe:', direction)
 * });
 * 
 * // Attach to canvas element
 * gestureHandler.attachToElement(canvasElement);
 * ```
 */

/**
 * Touch gesture types
 */
export type TouchGestureType = 
  | 'tap'
  | 'long_press'
  | 'two_finger_pan'
  | 'two_finger_swipe'
  | 'pinch'
  | 'double_tap';

/**
 * Swipe direction
 */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Touch point information
 */
export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

/**
 * Gesture event data
 */
export interface GestureEvent {
  type: TouchGestureType;
  position: { x: number; y: number };
  touches: TouchPoint[];
  delta?: { x: number; y: number };
  scale?: number;
  direction?: SwipeDirection;
  duration?: number;
}

/**
 * Touch gesture configuration
 */
export interface TouchGestureConfig {
  longPressDelay: number; // ms
  longPressThreshold: number; // pixels
  swipeThreshold: number; // pixels
  swipeVelocityThreshold: number; // pixels/ms
  twoFingerThreshold: number; // pixels
  doubleTapDelay: number; // ms
  doubleTapThreshold: number; // pixels
  enableHapticFeedback: boolean;
}

/**
 * Gesture event callbacks
 */
export interface TouchGestureCallbacks {
  onTap?: (event: GestureEvent) => void;
  onLongPress?: (event: GestureEvent) => void;
  onTwoFingerPan?: (event: GestureEvent) => void;
  onTwoFingerSwipe?: (event: GestureEvent) => void;
  onPinch?: (event: GestureEvent) => void;
  onDoubleTap?: (event: GestureEvent) => void;
  onGestureStart?: (event: GestureEvent) => void;
  onGestureEnd?: (event: GestureEvent) => void;
}

/**
 * Default touch gesture configuration
 */
const DEFAULT_TOUCH_CONFIG: TouchGestureConfig = {
  longPressDelay: 500, // 500ms
  longPressThreshold: 10, // 10 pixels
  swipeThreshold: 50, // 50 pixels
  swipeVelocityThreshold: 0.5, // 0.5 pixels/ms
  twoFingerThreshold: 20, // 20 pixels
  doubleTapDelay: 300, // 300ms
  doubleTapThreshold: 20, // 20 pixels
  enableHapticFeedback: true
};

/**
 * Touch gesture handler for snap logic system
 */
export class TouchGestureHandler {
  private config: TouchGestureConfig;
  private callbacks: TouchGestureCallbacks;
  private element: HTMLElement | null = null;
  
  // Touch tracking
  private activeTouches: Map<number, TouchPoint> = new Map();
  private gestureStartTime: number = 0;
  private gestureStartPosition: { x: number; y: number } | null = null;
  private lastTapTime: number = 0;
  private lastTapPosition: { x: number; y: number } | null = null;
  
  // Timers
  private longPressTimer: NodeJS.Timeout | null = null;
  private doubleTapTimer: NodeJS.Timeout | null = null;
  
  // State tracking
  private isLongPressActive = false;
  private isTwoFingerGesture = false;
  private initialPinchDistance = 0;
  private lastPanPosition: { x: number; y: number } | null = null;

  constructor(callbacks: TouchGestureCallbacks = {}, config?: Partial<TouchGestureConfig>) {
    this.callbacks = callbacks;
    this.config = { ...DEFAULT_TOUCH_CONFIG, ...config };
  }

  /**
   * Attach gesture handler to DOM element
   */
  attachToElement(element: HTMLElement): void {
    if (this.element) {
      this.detachFromElement();
    }

    this.element = element;
    this.setupEventListeners();
  }

  /**
   * Detach gesture handler from current element
   */
  detachFromElement(): void {
    if (!this.element) return;

    this.removeEventListeners();
    this.element = null;
    this.cleanup();
  }

  /**
   * Setup touch event listeners
   */
  private setupEventListeners(): void {
    if (!this.element) return;

    // Touch events
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

    // Prevent default touch behaviors
    this.element.addEventListener('contextmenu', this.preventDefault.bind(this));
    this.element.addEventListener('selectstart', this.preventDefault.bind(this));
  }

  /**
   * Remove touch event listeners
   */
  private removeEventListeners(): void {
    if (!this.element) return;

    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    this.element.removeEventListener('contextmenu', this.preventDefault.bind(this));
    this.element.removeEventListener('selectstart', this.preventDefault.bind(this));
  }

  /**
   * Handle touch start event
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();

    const touches = Array.from(event.touches);
    const timestamp = Date.now();

    // Update active touches
    for (const touch of touches) {
      const touchPoint: TouchPoint = {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        timestamp
      };
      this.activeTouches.set(touch.identifier, touchPoint);
    }

    // Handle gesture start
    if (touches.length === 1) {
      this.handleSingleTouchStart(touches[0], timestamp);
    } else if (touches.length === 2) {
      this.handleTwoFingerStart(touches, timestamp);
    }

    // Emit gesture start event
    this.emitGestureEvent('tap', {
      position: this.getTouchCenter(touches),
      touches: Array.from(this.activeTouches.values())
    });

    this.callbacks.onGestureStart?.({
      type: 'tap',
      position: this.getTouchCenter(touches),
      touches: Array.from(this.activeTouches.values())
    });
  }

  /**
   * Handle single touch start
   */
  private handleSingleTouchStart(touch: Touch, timestamp: number): void {
    const position = { x: touch.clientX, y: touch.clientY };
    
    this.gestureStartTime = timestamp;
    this.gestureStartPosition = position;
    this.isLongPressActive = false;
    this.isTwoFingerGesture = false;

    // Start long press timer
    this.longPressTimer = setTimeout(() => {
      if (this.activeTouches.size === 1 && !this.isLongPressActive) {
        this.handleLongPress(position);
      }
    }, this.config.longPressDelay);

    // Check for double tap
    if (this.lastTapTime && this.lastTapPosition) {
      const timeDiff = timestamp - this.lastTapTime;
      const distance = this.calculateDistance(position, this.lastTapPosition);

      if (timeDiff <= this.config.doubleTapDelay && distance <= this.config.doubleTapThreshold) {
        this.handleDoubleTap(position);
        this.lastTapTime = 0;
        this.lastTapPosition = null;
        return;
      }
    }
  }

  /**
   * Handle two finger gesture start
   */
  private handleTwoFingerStart(touches: Touch[], timestamp: number): void {
    this.clearTimers();
    this.isTwoFingerGesture = true;
    this.gestureStartTime = timestamp;
    
    // Calculate initial pinch distance
    if (touches.length >= 2) {
      this.initialPinchDistance = this.calculateDistance(
        { x: touches[0].clientX, y: touches[0].clientY },
        { x: touches[1].clientX, y: touches[1].clientY }
      );
      this.lastPanPosition = this.getTouchCenter(touches);
    }
  }

  /**
   * Handle touch move event
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();

    const touches = Array.from(event.touches);
    const timestamp = Date.now();

    // Update active touches
    for (const touch of touches) {
      const touchPoint: TouchPoint = {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        timestamp
      };
      this.activeTouches.set(touch.identifier, touchPoint);
    }

    // Handle movement based on touch count
    if (touches.length === 1) {
      this.handleSingleTouchMove(touches[0]);
    } else if (touches.length === 2) {
      this.handleTwoFingerMove(touches);
    }
  }

  /**
   * Handle single touch move
   */
  private handleSingleTouchMove(touch: Touch): void {
    if (!this.gestureStartPosition) return;

    const currentPosition = { x: touch.clientX, y: touch.clientY };
    const distance = this.calculateDistance(this.gestureStartPosition, currentPosition);

    // Cancel long press if moved too far
    if (distance > this.config.longPressThreshold) {
      this.clearTimers();
    }
  }

  /**
   * Handle two finger move
   */
  private handleTwoFingerMove(touches: Touch[]): void {
    if (touches.length < 2 || !this.lastPanPosition) return;

    const currentCenter = this.getTouchCenter(touches);
    const currentDistance = this.calculateDistance(
      { x: touches[0].clientX, y: touches[0].clientY },
      { x: touches[1].clientX, y: touches[1].clientY }
    );

    // Calculate pan delta
    const panDelta = {
      x: currentCenter.x - this.lastPanPosition.x,
      y: currentCenter.y - this.lastPanPosition.y
    };

    // Emit two finger pan event
    if (Math.abs(panDelta.x) > 1 || Math.abs(panDelta.y) > 1) {
      this.emitGestureEvent('two_finger_pan', {
        position: currentCenter,
        touches: Array.from(this.activeTouches.values()),
        delta: panDelta
      });

      this.callbacks.onTwoFingerPan?.({
        type: 'two_finger_pan',
        position: currentCenter,
        touches: Array.from(this.activeTouches.values()),
        delta: panDelta
      });
    }

    // Calculate pinch scale
    if (this.initialPinchDistance > 0) {
      const scale = currentDistance / this.initialPinchDistance;
      
      this.emitGestureEvent('pinch', {
        position: currentCenter,
        touches: Array.from(this.activeTouches.values()),
        scale
      });

      this.callbacks.onPinch?.({
        type: 'pinch',
        position: currentCenter,
        touches: Array.from(this.activeTouches.values()),
        scale
      });
    }

    this.lastPanPosition = currentCenter;
  }

  /**
   * Handle touch end event
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();

    const timestamp = Date.now();
    const remainingTouches = Array.from(event.touches);

    // Remove ended touches
    const allTouches = Array.from(event.changedTouches);
    for (const touch of allTouches) {
      this.activeTouches.delete(touch.identifier);
    }

    // Handle gesture end based on remaining touches
    if (remainingTouches.length === 0) {
      this.handleGestureEnd(timestamp);
    } else if (remainingTouches.length === 1 && this.isTwoFingerGesture) {
      // Transition from two finger to single finger
      this.isTwoFingerGesture = false;
      this.handleSingleTouchStart(remainingTouches[0], timestamp);
    }
  }

  /**
   * Handle gesture end
   */
  private handleGestureEnd(timestamp: number): void {
    this.clearTimers();

    if (!this.gestureStartPosition || !this.gestureStartTime) {
      this.cleanup();
      return;
    }

    const duration = timestamp - this.gestureStartTime;
    const position = this.gestureStartPosition;

    // Handle tap if not long press and not two finger gesture
    if (!this.isLongPressActive && !this.isTwoFingerGesture && duration < this.config.longPressDelay) {
      this.handleTap(position, timestamp);
    }

    // Check for swipe gesture
    if (this.isTwoFingerGesture && this.lastPanPosition) {
      this.checkForSwipe(position, this.lastPanPosition, duration);
    }

    // Emit gesture end event
    this.callbacks.onGestureEnd?.({
      type: 'tap',
      position,
      touches: [],
      duration
    });

    this.cleanup();
  }

  /**
   * Handle touch cancel event
   */
  private handleTouchCancel(event: TouchEvent): void {
    this.clearTimers();
    this.activeTouches.clear();
    this.cleanup();
  }

  /**
   * Handle tap gesture
   */
  private handleTap(position: { x: number; y: number }, timestamp: number): void {
    this.lastTapTime = timestamp;
    this.lastTapPosition = position;

    this.emitGestureEvent('tap', {
      position,
      touches: []
    });

    this.callbacks.onTap?.({
      type: 'tap',
      position,
      touches: []
    });
  }

  /**
   * Handle long press gesture
   */
  private handleLongPress(position: { x: number; y: number }): void {
    this.isLongPressActive = true;

    // Trigger haptic feedback if available
    if (this.config.enableHapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }

    this.emitGestureEvent('long_press', {
      position,
      touches: Array.from(this.activeTouches.values())
    });

    this.callbacks.onLongPress?.({
      type: 'long_press',
      position,
      touches: Array.from(this.activeTouches.values())
    });
  }

  /**
   * Handle double tap gesture
   */
  private handleDoubleTap(position: { x: number; y: number }): void {
    this.clearTimers();

    this.emitGestureEvent('double_tap', {
      position,
      touches: []
    });

    this.callbacks.onDoubleTap?.({
      type: 'double_tap',
      position,
      touches: []
    });
  }

  /**
   * Check for swipe gesture
   */
  private checkForSwipe(
    startPosition: { x: number; y: number },
    endPosition: { x: number; y: number },
    duration: number
  ): void {
    const deltaX = endPosition.x - startPosition.x;
    const deltaY = endPosition.y - startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / duration;

    if (distance >= this.config.swipeThreshold && velocity >= this.config.swipeVelocityThreshold) {
      let direction: SwipeDirection;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      this.emitGestureEvent('two_finger_swipe', {
        position: endPosition,
        touches: [],
        direction,
        delta: { x: deltaX, y: deltaY }
      });

      this.callbacks.onTwoFingerSwipe?.({
        type: 'two_finger_swipe',
        position: endPosition,
        touches: [],
        direction,
        delta: { x: deltaX, y: deltaY }
      });
    }
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get center point of multiple touches
   */
  private getTouchCenter(touches: Touch[]): { x: number; y: number } {
    if (touches.length === 0) return { x: 0, y: 0 };

    const sum = touches.reduce(
      (acc, touch) => ({
        x: acc.x + touch.clientX,
        y: acc.y + touch.clientY
      }),
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / touches.length,
      y: sum.y / touches.length
    };
  }

  /**
   * Emit gesture event (for debugging/logging)
   */
  private emitGestureEvent(type: TouchGestureType, data: Partial<GestureEvent>): void {
    // This can be used for debugging or analytics
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Touch Gesture: ${type}`, data);
    }
  }

  /**
   * Prevent default event behavior
   */
  private preventDefault(event: Event): void {
    event.preventDefault();
  }

  /**
   * Clear all active timers
   */
  private clearTimers(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (this.doubleTapTimer) {
      clearTimeout(this.doubleTapTimer);
      this.doubleTapTimer = null;
    }
  }

  /**
   * Cleanup gesture state
   */
  private cleanup(): void {
    this.gestureStartTime = 0;
    this.gestureStartPosition = null;
    this.isLongPressActive = false;
    this.isTwoFingerGesture = false;
    this.initialPinchDistance = 0;
    this.lastPanPosition = null;
  }

  /**
   * Update gesture configuration
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
   * Check if touch gestures are supported
   */
  static isSupported(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Destroy gesture handler and cleanup resources
   */
  destroy(): void {
    this.detachFromElement();
    this.clearTimers();
    this.activeTouches.clear();
  }
}
