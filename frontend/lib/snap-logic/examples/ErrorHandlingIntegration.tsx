/**
 * Error Handling Integration Example
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Comprehensive example showing how to integrate the error handling system
 * with existing snap logic components, debug collection, and touch gesture
 * handling for professional HVAC design workflows.
 * 
 * @fileoverview Error handling integration example
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  ErrorHandler,
  ErrorNotificationSystem,
  ErrorBoundary,
  SnapLogicError,
  ErrorCategory,
  ErrorSeverity,
  DebugCollector,
  TouchGestureHandler,
  SnapLogicCanvas
} from '@/lib/snap-logic';

/**
 * Example component showing comprehensive error handling integration
 */
export const ErrorHandlingIntegrationExample: React.FC = () => {
  const [errorHandler, setErrorHandler] = useState<ErrorHandler | null>(null);
  const [debugCollector, setDebugCollector] = useState<DebugCollector | null>(null);
  const [touchGestureHandler, setTouchGestureHandler] = useState<TouchGestureHandler | null>(null);

  // Initialize error handling system
  useEffect(() => {
    // Create debug collector
    const debugCollectorInstance = new DebugCollector({
      enabled: true,
      maxEvents: 1000,
      collectPerformance: true,
      collectErrorTracking: true,
      verboseLogging: true
    });

    // Create error handler
    const errorHandlerInstance = new ErrorHandler({
      enableErrorReporting: true,
      enableAutoRecovery: true,
      maxRetryAttempts: 3,
      showUserNotifications: true,
      enableDebugIntegration: true,
      verboseLogging: true,
      enableGracefulDegradation: true,
      fallbackStrategies: {
        [ErrorCategory.SNAP_LOGIC]: () => console.log('Snap logic fallback'),
        [ErrorCategory.PERFORMANCE]: () => console.log('Performance fallback'),
        [ErrorCategory.VALIDATION]: () => console.log('Validation fallback'),
        [ErrorCategory.CENTERLINE]: () => console.log('Centerline fallback'),
        [ErrorCategory.GEOMETRY]: () => console.log('Geometry fallback'),
        [ErrorCategory.SPATIAL_INDEX]: () => console.log('Spatial index fallback'),
        [ErrorCategory.TOUCH_GESTURE]: () => console.log('Touch gesture fallback'),
        [ErrorCategory.USER_INPUT]: () => console.log('User input fallback'),
        [ErrorCategory.UI_COMPONENT]: () => console.log('UI component fallback'),
        [ErrorCategory.CACHE]: () => console.log('Cache fallback'),
        [ErrorCategory.STORAGE]: () => console.log('Storage fallback'),
        [ErrorCategory.NETWORK]: () => console.log('Network fallback'),
        [ErrorCategory.SMACNA_VALIDATION]: () => console.log('SMACNA validation fallback'),
        [ErrorCategory.FITTING_CALCULATION]: () => console.log('Fitting calculation fallback'),
        [ErrorCategory.BRANCH_ANALYSIS]: () => console.log('Branch analysis fallback'),
        [ErrorCategory.DEBUG_COLLECTION]: () => console.log('Debug collection fallback'),
        [ErrorCategory.PERFORMANCE_MONITORING]: () => console.log('Performance monitoring fallback'),
        [ErrorCategory.CONFIGURATION]: () => console.log('Configuration fallback'),
        [ErrorCategory.INITIALIZATION]: () => console.log('Initialization fallback'),
        [ErrorCategory.UNKNOWN]: () => console.log('Unknown error fallback')
      }
    });

    // Connect error handler with debug collector
    errorHandlerInstance.setDebugCollector(debugCollectorInstance);

    // Create touch gesture handler with error handling
    const touchHandler = new TouchGestureHandler({
      enableLongPress: true,
      enableTwoFingerGestures: true,
      enableSwipeGestures: true,
      hapticFeedback: true
    });

    // Add error handling to touch gesture handler
    touchHandler.on('error', (error) => {
      errorHandlerInstance.handleError(
        new SnapLogicError(
          error.message || 'Touch gesture error',
          ErrorCategory.TOUCH_GESTURE,
          ErrorSeverity.LOW,
          {
            component: 'TouchGestureHandler',
            operation: 'gesture_recognition',
            touchDevice: true,
            metadata: { gestureType: error.gestureType }
          }
        )
      );
    });

    // Add error listeners for monitoring
    errorHandlerInstance.addErrorListener((error) => {
      console.log('[ErrorHandling] Error occurred:', error);
      
      // Log to debug collector
      debugCollectorInstance.logError(error, error.context, 'error');
    });

    errorHandlerInstance.addNotificationListener((notification) => {
      console.log('[ErrorHandling] Notification:', notification);
    });

    setErrorHandler(errorHandlerInstance);
    setDebugCollector(debugCollectorInstance);
    setTouchGestureHandler(touchHandler);

    // Cleanup
    return () => {
      errorHandlerInstance.dispose();
      debugCollectorInstance.destroy();
      touchHandler.dispose();
    };
  }, []);

  // Example error simulation functions
  const simulateSnapLogicError = useCallback(() => {
    if (!errorHandler) return;

    const error = new SnapLogicError(
      'Failed to find snap points in the specified area',
      ErrorCategory.SNAP_LOGIC,
      ErrorSeverity.MEDIUM,
      {
        component: 'SnapLogicManager',
        operation: 'findSnapPoints',
        parameters: { position: { x: 100, y: 200 }, distance: 20 },
        snapLogicEnabled: true,
        activeTool: 'pencil'
      },
      {
        recoverable: true,
        userVisible: true,
        reportToServer: false
      }
    );

    errorHandler.handleError(error);
  }, [errorHandler]);

  const simulatePerformanceError = useCallback(() => {
    if (!errorHandler) return;

    const error = new SnapLogicError(
      'Snap query took longer than expected (>500ms)',
      ErrorCategory.PERFORMANCE,
      ErrorSeverity.HIGH,
      {
        component: 'SnapLogicManager',
        operation: 'querySnapPoints',
        performanceScore: 45,
        memoryUsage: 150,
        metadata: { queryTime: 750, snapPointCount: 5000 }
      },
      {
        recoverable: true,
        userVisible: true,
        reportToServer: true
      }
    );

    errorHandler.handleError(error);
  }, [errorHandler]);

  const simulateTouchGestureError = useCallback(() => {
    if (!errorHandler) return;

    const error = new SnapLogicError(
      'Touch gesture recognition failed',
      ErrorCategory.TOUCH_GESTURE,
      ErrorSeverity.LOW,
      {
        component: 'TouchGestureHandler',
        operation: 'recognizeGesture',
        touchDevice: true,
        metadata: { gestureType: 'longPress', touchCount: 1 }
      },
      {
        recoverable: true,
        userVisible: false,
        reportToServer: false
      }
    );

    errorHandler.handleError(error);
  }, [errorHandler]);

  const simulateCriticalError = useCallback(() => {
    if (!errorHandler) return;

    const error = new SnapLogicError(
      'Critical system failure: Unable to initialize snap logic system',
      ErrorCategory.INITIALIZATION,
      ErrorSeverity.CRITICAL,
      {
        component: 'SnapLogicSystem',
        operation: 'initialize',
        metadata: { reason: 'Memory allocation failed' }
      },
      {
        recoverable: false,
        userVisible: true,
        reportToServer: true
      }
    );

    errorHandler.handleError(error);
  }, [errorHandler]);

  const simulateValidationError = useCallback(() => {
    if (!errorHandler) return;

    const error = new SnapLogicError(
      'SMACNA validation failed: Radius ratio exceeds maximum allowed value',
      ErrorCategory.SMACNA_VALIDATION,
      ErrorSeverity.MEDIUM,
      {
        component: 'SMACNAValidator',
        operation: 'validateRadius',
        parameters: { radius: 150, ductSize: 200 },
        metadata: { 
          radiusRatio: 0.75, 
          maxAllowed: 0.5,
          smacnaStandard: 'HVAC-2019'
        }
      },
      {
        recoverable: true,
        userVisible: true,
        reportToServer: false
      }
    );

    errorHandler.handleError(error);
  }, [errorHandler]);

  // Example component that might throw errors
  const ErrorProneComponent: React.FC = () => {
    const [shouldThrow, setShouldThrow] = useState(false);

    if (shouldThrow) {
      throw new Error('Simulated React component error');
    }

    return (
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Error Prone Component</h3>
        <p className="text-gray-600 mb-4">
          This component can throw errors to test the ErrorBoundary.
        </p>
        <button
          onClick={() => setShouldThrow(true)}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Throw Error
        </button>
      </div>
    );
  };

  if (!errorHandler) {
    return <div>Initializing error handling system...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Error Handling Integration Example</h1>
      
      {/* Error simulation controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <button
          onClick={simulateSnapLogicError}
          className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Simulate Snap Logic Error
        </button>
        
        <button
          onClick={simulatePerformanceError}
          className="p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Simulate Performance Error
        </button>
        
        <button
          onClick={simulateTouchGestureError}
          className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Simulate Touch Error
        </button>
        
        <button
          onClick={simulateValidationError}
          className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Simulate Validation Error
        </button>
        
        <button
          onClick={simulateCriticalError}
          className="p-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Simulate Critical Error
        </button>
      </div>

      {/* Error boundary example */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Error Boundary Example</h2>
        <ErrorBoundary
          errorHandler={errorHandler}
          showErrorDetails={true}
          enableRecovery={true}
          component="ErrorHandlingExample"
        >
          <ErrorProneComponent />
        </ErrorBoundary>
      </div>

      {/* Debug information */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Error History</h3>
            <div className="text-sm text-gray-600">
              Total Errors: {errorHandler.getErrorHistory().length}
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Active Notifications</h3>
            <div className="text-sm text-gray-600">
              Active: {errorHandler.getActiveNotifications().length}
            </div>
          </div>
        </div>
      </div>

      {/* Error notification system */}
      <ErrorNotificationSystem
        errorHandler={errorHandler}
        position="top-right"
        maxNotifications={5}
        enableHapticFeedback={true}
      />
    </div>
  );
};

export default ErrorHandlingIntegrationExample;
