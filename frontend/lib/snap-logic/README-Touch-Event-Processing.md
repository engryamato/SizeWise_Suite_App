# Touch Event Processing System

## Overview

The Touch Event Processing System provides comprehensive touch gesture support for the SizeWise Suite snap logic system, optimized for professional HVAC design workflows on tablets and mobile devices. This system converts touch gestures into drawing actions, viewport navigation, and snap logic interactions with advanced visual feedback and haptic responses.

## Key Features

### Comprehensive Touch Gesture Support
- **Long-press Snap Override**: Long press to temporarily disable snapping for precise positioning
- **Two-finger Navigation**: Pan and zoom viewport with two-finger gestures
- **Swipe Undo/Redo**: Swipe left/right for quick undo/redo operations
- **Multi-finger Gestures**: Three-finger tap for debug mode, four-finger for advanced features
- **Tap and Double-tap**: Single tap for drawing/selection, double tap for zoom-to-fit

### Professional Touch Optimization
- **Haptic Feedback**: Advanced haptic patterns for different gesture types
- **Visual Feedback**: Real-time visual feedback with gesture-specific animations
- **Gesture Recognition**: Intelligent gesture recognition with configurable sensitivity
- **Touch Device Detection**: Automatic touch device detection and adaptive UI
- **Performance Optimization**: Throttled events and efficient touch tracking

### Canvas Integration
- **Mouse Event Compatibility**: Seamless compatibility with existing mouse events
- **Touch-specific UI**: Adaptive UI components for touch devices
- **Gesture Indicators**: Real-time gesture status and instruction display
- **Conflict Prevention**: Intelligent prevention of mouse/touch event conflicts

## Architecture

### Core Components

#### 1. TouchGestureHandler (`TouchGestureHandler.ts`)
Low-level touch gesture detection and event emission.

**Features:**
- Comprehensive gesture recognition
- Configurable sensitivity and timing
- Event emitter pattern for gesture events
- Performance-optimized touch tracking
- Haptic feedback integration

**Usage:**
```typescript
import { TouchGestureHandler } from '@/lib/snap-logic';

const touchHandler = new TouchGestureHandler({
  enableLongPress: true,
  enableTwoFingerGestures: true,
  enableSwipeGestures: true,
  hapticFeedback: true,
  longPressDelay: 500,
  tapMaxDistance: 15
});

touchHandler.attachToElement(canvasElement);
touchHandler.on('longPress', handleLongPress);
touchHandler.on('twoFingerPan', handlePan);
```

#### 2. TouchEventProcessor (`TouchEventProcessor.ts`)
High-level touch event processing and action generation.

**Features:**
- Touch gesture to action conversion
- Configurable gesture behavior
- Visual feedback generation
- Snap override management
- Action result generation

**Usage:**
```typescript
import { TouchEventProcessor } from '@/lib/snap-logic';

const processor = new TouchEventProcessor({
  longPressSnapOverride: true,
  twoFingerNavigation: true,
  swipeUndoRedo: true,
  showGestureFeedback: true
});

const actionResult = processor.processGestureEvent(gestureEvent);
const feedback = processor.generateTouchFeedback(gestureEvent);
```

#### 3. Enhanced SnapLogicCanvas (`SnapLogicCanvas.tsx`)
Canvas component with comprehensive touch event integration.

**Features:**
- Touch gesture handler integration
- Visual feedback rendering
- Touch device detection
- Adaptive UI components
- Mouse/touch event coordination

## Touch Gesture Types

### Primary Gestures

#### Long Press (Snap Override)
```typescript
// Long press activates snap override for precise positioning
touchHandler.on('longPress', (event: TouchGestureEvent) => {
  snapManager.setSnapEnabled(false);
  showVisualFeedback('longPress', event.position);
  triggerHapticFeedback([100, 50, 100]); // Double pulse
});
```

#### Two-finger Pan (Viewport Navigation)
```typescript
// Two-finger pan for smooth viewport navigation
touchHandler.on('twoFingerPan', (event: TouchGestureEvent) => {
  if (event.deltaPosition) {
    viewport.pan(event.deltaPosition.x, event.deltaPosition.y);
    if (event.scale && event.scale !== 1) {
      viewport.zoom(event.scale, event.position);
    }
  }
});
```

#### Swipe Gestures (Undo/Redo)
```typescript
// Swipe left for undo
touchHandler.on('swipeLeft', (event: TouchGestureEvent) => {
  undoRedoManager.undo();
  showVisualFeedback('swipe', event.position);
  triggerHapticFeedback(30);
});

// Swipe right for redo
touchHandler.on('swipeRight', (event: TouchGestureEvent) => {
  undoRedoManager.redo();
  showVisualFeedback('swipe', event.position);
  triggerHapticFeedback(30);
});
```

### Secondary Gestures

#### Tap and Double Tap
```typescript
// Single tap for drawing/selection
touchHandler.on('tap', (event: TouchGestureEvent) => {
  const worldPos = screenToWorld(event.position.x, event.position.y);
  handleDrawingAction(worldPos);
});

// Double tap for zoom to fit
touchHandler.on('doubleTap', (event: TouchGestureEvent) => {
  viewport.zoomToFit();
  showVisualFeedback('tap', event.position);
});
```

#### Multi-finger Gestures
```typescript
// Three-finger tap for debug mode
touchHandler.on('threeFingerTap', (event: TouchGestureEvent) => {
  debugManager.toggleDebugMode();
  triggerHapticFeedback([50, 30, 50, 30, 50]);
});
```

## Visual Feedback System

### Gesture-specific Visual Feedback
```typescript
const feedbackStyles = {
  tap: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderColor: 'rgb(59, 130, 246)',
    size: 30
  },
  longPress: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderColor: 'rgb(239, 68, 68)',
    size: 50
  },
  pan: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    borderColor: 'rgb(34, 197, 94)',
    size: 40
  },
  zoom: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    borderColor: 'rgb(168, 85, 247)',
    size: 60
  },
  swipe: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderColor: 'rgb(245, 158, 11)',
    size: 35
  }
};
```

### Touch Device Indicators
```typescript
// Touch mode indicator
<div className="absolute top-4 right-4 z-50">
  <div className="bg-blue-100 border border-blue-300 rounded-lg px-3 py-2">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
      <span className="text-blue-700 font-medium">Touch Mode</span>
    </div>
    <div className="text-xs text-blue-600 mt-1">
      {snapOverrideActive ? 'Snap Override Active' : 'Touch Gestures Enabled'}
    </div>
  </div>
</div>
```

### Gesture Instructions
```typescript
// Comprehensive gesture instructions for touch devices
<div className="absolute bottom-20 left-4 z-50 bg-black/90 text-white px-4 py-3 rounded-lg">
  <div className="font-medium mb-2 text-blue-300">Touch Gestures:</div>
  <div className="space-y-1">
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
      <span>Long press: Override snap</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
      <span>Two fingers: Pan/zoom view</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
      <span>Swipe left/right: Undo/redo</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
      <span>Tap: Select/draw</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
      <span>Double tap: Zoom to fit</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
      <span>Three fingers: Debug mode</span>
    </div>
  </div>
</div>
```

## Configuration

### TouchGestureHandler Configuration
```typescript
interface TouchGestureConfig {
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
}
```

### TouchEventProcessor Configuration
```typescript
interface TouchProcessingConfig {
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
```

## Device-Specific Optimizations

### Tablet Optimization
```typescript
const tabletConfig = {
  longPressDelay: 400,              // Shorter delay for tablets
  tapMaxDistance: 20,               // Larger tap tolerance
  swipeMinDistance: 60,             // Longer swipe distance
  panSensitivity: 1.2,              // Higher pan sensitivity
  zoomSensitivity: 1.1,             // Slightly higher zoom sensitivity
  hapticFeedback: true,             // Full haptic feedback
  visualFeedback: true              // Full visual feedback
};
```

### Mobile Phone Optimization
```typescript
const mobileConfig = {
  longPressDelay: 600,              // Longer delay for smaller screens
  tapMaxDistance: 15,               // Smaller tap tolerance
  swipeMinDistance: 40,             // Shorter swipe distance
  panSensitivity: 0.8,              // Lower pan sensitivity
  zoomSensitivity: 0.9,             // Lower zoom sensitivity
  hapticFeedback: true,             // Essential for mobile
  visualFeedback: true              // Essential for mobile
};
```

### Desktop Touch Screen Optimization
```typescript
const desktopTouchConfig = {
  longPressDelay: 500,              // Standard delay
  tapMaxDistance: 25,               // Larger tolerance for desktop
  swipeMinDistance: 80,             // Longer swipe for desktop
  panSensitivity: 1.5,              // Higher sensitivity for desktop
  zoomSensitivity: 1.3,             // Higher zoom sensitivity
  hapticFeedback: false,            // Usually not available
  visualFeedback: true              // Important for desktop touch
};
```

## Integration with Existing Systems

### Snap Logic Integration
```typescript
// Touch gestures integrate seamlessly with snap logic
const handleTouchLongPress = (event: TouchGestureEvent) => {
  // Temporarily disable snapping
  snapManager.setSnapEnabled(false);
  
  // Set timer to re-enable snapping
  setTimeout(() => {
    snapManager.setSnapEnabled(true);
  }, 3000);
};
```

### Viewport Integration
```typescript
// Touch navigation integrates with viewport system
const handleTouchTwoFingerPan = (event: TouchGestureEvent) => {
  if (event.deltaPosition) {
    viewport.pan(event.deltaPosition.x, event.deltaPosition.y);
  }
  
  if (event.scale && event.scale !== 1) {
    viewport.zoom(event.scale, event.position);
  }
};
```

### Undo/Redo Integration
```typescript
// Touch swipes integrate with undo/redo system
const handleTouchSwipe = (direction: 'left' | 'right') => {
  if (direction === 'left') {
    undoRedoManager.undo();
  } else {
    undoRedoManager.redo();
  }
};
```

## Performance Considerations

### Event Throttling
```typescript
// Touch events are throttled for performance
const throttleDelay = 16; // 60fps throttling

// Passive event listeners for better performance
const options = {
  passive: !preventDefaultBehavior,
  capture: false
};
```

### Memory Management
```typescript
// Proper cleanup of touch handlers
useEffect(() => {
  return () => {
    if (touchGestureHandler) {
      touchGestureHandler.dispose();
    }
    if (touchEventProcessor) {
      touchEventProcessor.dispose();
    }
  };
}, []);
```

### Touch State Management
```typescript
// Efficient touch state management
const [touchState, setTouchState] = useState({
  isProcessingTouch: false,
  activeGesture: null,
  preventMouseEvents: false,
  touchFeedback: null
});
```

## Best Practices

### Touch Device Detection
```typescript
// Reliable touch device detection
const isTouchDevice = TouchGestureHandler.isTouchDevice();

// Adaptive UI based on touch capability
if (isTouchDevice) {
  // Show touch-specific UI elements
  // Enable touch gesture handlers
  // Adjust UI spacing for touch
}
```

### Gesture Conflict Prevention
```typescript
// Prevent mouse/touch event conflicts
const handleMouseEvent = (event: MouseEvent) => {
  if (touchState.preventMouseEvents || touchState.isProcessingTouch) {
    return; // Skip mouse event if touch is active
  }
  // Process mouse event normally
};
```

### Haptic Feedback Patterns
```typescript
// Professional haptic feedback patterns
const hapticPatterns = {
  tap: 10,                    // Quick pulse
  longPress: [100, 50, 100],  // Double pulse for confirmation
  swipe: 30,                  // Medium pulse for action
  error: [50, 50, 50, 50, 50], // Multiple pulses for error
  success: [100, 30, 50]      // Success pattern
};
```

## Troubleshooting

### Common Issues

#### Touch Events Not Recognized
```typescript
// Ensure proper touch action CSS
style={{
  touchAction: 'none',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none'
}}
```

#### Mouse/Touch Conflicts
```typescript
// Implement proper event coordination
const [touchActive, setTouchActive] = useState(false);

const handleTouchStart = () => {
  setTouchActive(true);
  setTimeout(() => setTouchActive(false), 100);
};

const handleMouseEvent = (event) => {
  if (touchActive) return; // Skip if touch is active
  // Process mouse event
};
```

#### Performance Issues
```typescript
// Use throttling for touch move events
const throttledTouchMove = useCallback(
  throttle((event) => {
    // Process touch move
  }, 16), // 60fps
  []
);
```

## Future Enhancements

Planned improvements for the touch event processing system:

1. **Advanced Gesture Recognition**: Machine learning-based gesture recognition
2. **Pressure Sensitivity**: Support for pressure-sensitive touch devices
3. **Multi-touch Drawing**: Advanced multi-touch drawing capabilities
4. **Gesture Customization**: User-customizable gesture mappings
5. **Accessibility Features**: Enhanced accessibility for touch interactions
6. **Performance Analytics**: Touch performance monitoring and optimization
