/**
 * Validation Integration Example
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Comprehensive example showing how to integrate input validation and sanitization
 * with the snap logic system, error handling, and touch gesture processing for
 * professional HVAC design workflows.
 * 
 * @fileoverview Validation integration example
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  SnapLogicManager,
  ErrorHandler,
  ValidationUtils,
  InputSanitizer,
  TouchGestureHandler,
  DebugCollector
} from '@/lib/snap-logic';
import { SnapPoint, Centerline, Point2D } from '@/types/air-duct-sizer';

/**
 * Example component showing comprehensive validation integration
 */
export const ValidationIntegrationExample: React.FC = () => {
  const [snapLogicManager, setSnapLogicManager] = useState<SnapLogicManager | null>(null);
  const [errorHandler, setErrorHandler] = useState<ErrorHandler | null>(null);
  const [inputSanitizer, setInputSanitizer] = useState<InputSanitizer | null>(null);
  const [validationResults, setValidationResults] = useState<string[]>([]);

  // Initialize validation system
  useEffect(() => {
    // Create error handler
    const errorHandlerInstance = new ErrorHandler({
      enableErrorReporting: true,
      enableAutoRecovery: true,
      showUserNotifications: true,
      enableDebugIntegration: true,
      verboseLogging: true
    });

    // Create input sanitizer
    const inputSanitizerInstance = new InputSanitizer({
      enableXSSProtection: true,
      enableSQLInjectionProtection: true,
      enableDataNormalization: true,
      enableCoordinateNormalization: true,
      enablePrecisionNormalization: true,
      enableVerboseLogging: true
    });

    // Create snap logic manager
    const snapManagerInstance = new SnapLogicManager({
      enabled: true,
      snapThreshold: 15,
      magneticThreshold: 25,
      showVisualFeedback: true
    });

    // Connect error handler
    snapManagerInstance.setErrorHandler(errorHandlerInstance);

    setErrorHandler(errorHandlerInstance);
    setInputSanitizer(inputSanitizerInstance);
    setSnapLogicManager(snapManagerInstance);

    // Cleanup
    return () => {
      errorHandlerInstance.dispose();
      inputSanitizerInstance.dispose();
    };
  }, []);

  // Example validation functions
  const validateAndAddSnapPoint = useCallback((rawSnapPoint: any) => {
    if (!snapLogicManager) return;

    try {
      // Validate snap point
      const validation = ValidationUtils.validateSnapPoint(rawSnapPoint, 'user input');
      
      if (validation.isValid && validation.sanitizedValue) {
        snapLogicManager.addSnapPoint(validation.sanitizedValue);
        setValidationResults(prev => [
          ...prev,
          `✅ Snap point added successfully: ${validation.sanitizedValue.id}`
        ]);
      } else {
        setValidationResults(prev => [
          ...prev,
          `❌ Snap point validation failed: ${validation.errors.join(', ')}`
        ]);
      }

      if (validation.warnings.length > 0) {
        setValidationResults(prev => [
          ...prev,
          `⚠️ Warnings: ${validation.warnings.join(', ')}`
        ]);
      }

    } catch (error) {
      setValidationResults(prev => [
        ...prev,
        `💥 Exception: ${error instanceof Error ? error.message : 'Unknown error'}`
      ]);
    }
  }, [snapLogicManager]);

  const validateAndQuerySnapPoint = useCallback((rawPosition: any) => {
    if (!snapLogicManager) return;

    try {
      // Validate position
      const validation = ValidationUtils.validatePoint2D(rawPosition, 'query position');
      
      if (validation.isValid && validation.sanitizedValue) {
        const result = snapLogicManager.findClosestSnapPoint(validation.sanitizedValue);
        setValidationResults(prev => [
          ...prev,
          `🎯 Query result: ${result.isSnapped ? `Snapped to ${result.snapPoint?.type} at distance ${result.distance.toFixed(2)}` : 'No snap found'}`
        ]);
      } else {
        setValidationResults(prev => [
          ...prev,
          `❌ Position validation failed: ${validation.errors.join(', ')}`
        ]);
      }

    } catch (error) {
      setValidationResults(prev => [
        ...prev,
        `💥 Query exception: ${error instanceof Error ? error.message : 'Unknown error'}`
      ]);
    }
  }, [snapLogicManager]);

  const validateAndSanitizeString = useCallback((rawString: string) => {
    if (!inputSanitizer) return;

    try {
      const result = inputSanitizer.sanitizeString(rawString);
      
      setValidationResults(prev => [
        ...prev,
        `🧹 String sanitization: ${result.modified ? 'Modified' : 'No changes'}`
      ]);

      if (result.actions.length > 0) {
        setValidationResults(prev => [
          ...prev,
          `🔧 Actions: ${result.actions.join(', ')}`
        ]);
      }

      if (result.warnings.length > 0) {
        setValidationResults(prev => [
          ...prev,
          `⚠️ Warnings: ${result.warnings.join(', ')}`
        ]);
      }

    } catch (error) {
      setValidationResults(prev => [
        ...prev,
        `💥 Sanitization exception: ${error instanceof Error ? error.message : 'Unknown error'}`
      ]);
    }
  }, [inputSanitizer]);

  // Test data examples
  const testValidSnapPoint = useCallback(() => {
    validateAndAddSnapPoint({
      id: 'test_valid_1',
      type: 'endpoint',
      position: { x: 100, y: 200 },
      priority: 1
    });
  }, [validateAndAddSnapPoint]);

  const testInvalidSnapPoint = useCallback(() => {
    validateAndAddSnapPoint({
      id: '', // Invalid empty ID
      type: 'invalid_type', // Invalid type
      position: { x: 'not_a_number', y: null }, // Invalid coordinates
      priority: -1 // Invalid priority
    });
  }, [validateAndAddSnapPoint]);

  const testExtremeCoordinates = useCallback(() => {
    validateAndAddSnapPoint({
      id: 'test_extreme',
      type: 'centerline',
      position: { x: 999999999, y: -999999999 }, // Extreme coordinates
      priority: 2
    });
  }, [validateAndAddSnapPoint]);

  const testValidQuery = useCallback(() => {
    validateAndQuerySnapPoint({ x: 105, y: 205 });
  }, [validateAndQuerySnapPoint]);

  const testInvalidQuery = useCallback(() => {
    validateAndQuerySnapPoint({ x: NaN, y: Infinity });
  }, [validateAndQuerySnapPoint]);

  const testMaliciousString = useCallback(() => {
    validateAndSanitizeString('<script>alert("XSS")</script>DROP TABLE users;--');
  }, [validateAndSanitizeString]);

  const testNormalString = useCallback(() => {
    validateAndSanitizeString('Normal HVAC duct name with spaces   and   extra   whitespace');
  }, [validateAndSanitizeString]);

  const clearResults = useCallback(() => {
    setValidationResults([]);
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Validation Integration Example</h1>
      
      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="space-y-2">
          <h3 className="font-semibold text-green-700">Valid Inputs</h3>
          <button
            onClick={testValidSnapPoint}
            className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Add Valid Snap Point
          </button>
          <button
            onClick={testValidQuery}
            className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Valid Position Query
          </button>
          <button
            onClick={testNormalString}
            className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Normal String Sanitization
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-red-700">Invalid Inputs</h3>
          <button
            onClick={testInvalidSnapPoint}
            className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Add Invalid Snap Point
          </button>
          <button
            onClick={testInvalidQuery}
            className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Invalid Position Query
          </button>
          <button
            onClick={testMaliciousString}
            className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Malicious String Input
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-orange-700">Edge Cases</h3>
          <button
            onClick={testExtremeCoordinates}
            className="w-full p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Extreme Coordinates
          </button>
          <button
            onClick={clearResults}
            className="w-full p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Validation Results */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Validation Results</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {validationResults.length === 0 ? (
            <p className="text-gray-500 italic">No validation results yet. Try the buttons above!</p>
          ) : (
            validationResults.map((result, index) => (
              <div
                key={index}
                className={`p-2 rounded text-sm font-mono ${
                  result.startsWith('✅') ? 'bg-green-100 text-green-800' :
                  result.startsWith('❌') ? 'bg-red-100 text-red-800' :
                  result.startsWith('⚠️') ? 'bg-yellow-100 text-yellow-800' :
                  result.startsWith('💥') ? 'bg-red-200 text-red-900' :
                  result.startsWith('🎯') ? 'bg-blue-100 text-blue-800' :
                  result.startsWith('🧹') ? 'bg-purple-100 text-purple-800' :
                  result.startsWith('🔧') ? 'bg-indigo-100 text-indigo-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Snap Logic Manager</h3>
          <div className="text-sm text-blue-700">
            Status: {snapLogicManager ? '✅ Active' : '❌ Not initialized'}
            {snapLogicManager && (
              <div className="mt-2">
                <div>Snap Points: {snapLogicManager.getSnapStatistics().totalSnapPoints}</div>
                <div>Config: {snapLogicManager.getConfig().enabled ? 'Enabled' : 'Disabled'}</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Error Handler</h3>
          <div className="text-sm text-green-700">
            Status: {errorHandler ? '✅ Active' : '❌ Not initialized'}
            {errorHandler && (
              <div className="mt-2">
                <div>Errors: {errorHandler.getErrorHistory().length}</div>
                <div>Notifications: {errorHandler.getActiveNotifications().length}</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2">Input Sanitizer</h3>
          <div className="text-sm text-purple-700">
            Status: {inputSanitizer ? '✅ Active' : '❌ Not initialized'}
            {inputSanitizer && (
              <div className="mt-2">
                <div>Statistics: {Object.keys(inputSanitizer.getStatistics()).length} types</div>
                <div>Config: {inputSanitizer.getConfig().enableXSSProtection ? 'Secure' : 'Basic'}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationIntegrationExample;
