/**
 * SMACNA Validation Integration Example
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Comprehensive example showing how to integrate SMACNA standards validation
 * with the snap logic system for professional HVAC design compliance checking.
 * Demonstrates radius ratio validation, pressure drop calculations, and code
 * compliance reporting for engineering-grade ductwork design.
 * 
 * @fileoverview SMACNA validation integration example
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

'use client';

import React, { useState, useCallback } from 'react';
import { 
  SMACNAValidator,
  SMACNAStandard,
  DuctShape,
  PressureClass,
  DuctDimensions,
  SMACNAValidationResult
} from '@/lib/snap-logic';
import { Centerline } from '@/types/air-duct-sizer';

/**
 * Example component showing comprehensive SMACNA validation integration
 */
export const SMACNAValidationExample: React.FC = () => {
  const [validator, setValidator] = useState<SMACNAValidator>(
    new SMACNAValidator({
      standard: SMACNAStandard.HVAC_2019,
      pressureClass: PressureClass.LOW,
      enableStrictMode: false,
      enableOptimizationRecommendations: true,
      enablePressureDropCalculations: true,
      enableRadiusRatioValidation: true,
      enableVelocityValidation: true,
      enableAspectRatioValidation: true
    })
  );

  const [validationResults, setValidationResults] = useState<SMACNAValidationResult[]>([]);
  const [selectedStandard, setSelectedStandard] = useState<SMACNAStandard>(SMACNAStandard.HVAC_2019);
  const [selectedPressureClass, setSelectedPressureClass] = useState<PressureClass>(PressureClass.LOW);

  // Example test cases
  const testCases = [
    {
      name: 'Compliant Rectangular Duct',
      centerline: {
        id: 'test_rect_1',
        type: 'straight' as const,
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }]
      },
      ductDimensions: { width: 12, height: 8 },
      ductShape: DuctShape.RECTANGULAR,
      airflow: 1000
    },
    {
      name: 'Non-Compliant High Aspect Ratio',
      centerline: {
        id: 'test_rect_2',
        type: 'straight' as const,
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }]
      },
      ductDimensions: { width: 24, height: 4 }, // 6:1 aspect ratio (exceeds 4:1 limit)
      ductShape: DuctShape.RECTANGULAR,
      airflow: 1500
    },
    {
      name: 'Arc with Low Radius Ratio',
      centerline: {
        id: 'test_arc_1',
        type: 'arc' as const,
        points: [{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 0 }],
        radius: 6 // Low radius for 12" duct (0.5 ratio)
      },
      ductDimensions: { width: 12, height: 12 },
      ductShape: DuctShape.RECTANGULAR,
      airflow: 800
    },
    {
      name: 'High Velocity Round Duct',
      centerline: {
        id: 'test_round_1',
        type: 'straight' as const,
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }]
      },
      ductDimensions: { width: 0, height: 0, diameter: 6 }, // Small diameter
      ductShape: DuctShape.ROUND,
      airflow: 2000 // High airflow for small duct
    },
    {
      name: 'Compliant Round Duct with Arc',
      centerline: {
        id: 'test_round_2',
        type: 'arc' as const,
        points: [{ x: 0, y: 0 }, { x: 25, y: 25 }, { x: 50, y: 0 }],
        radius: 18 // Good radius for 18" duct
      },
      ductDimensions: { width: 0, height: 0, diameter: 18 },
      ductShape: DuctShape.ROUND,
      airflow: 1200
    }
  ];

  // Update validator configuration
  const updateValidatorConfig = useCallback(() => {
    const newValidator = new SMACNAValidator({
      standard: selectedStandard,
      pressureClass: selectedPressureClass,
      enableStrictMode: false,
      enableOptimizationRecommendations: true,
      enablePressureDropCalculations: true,
      enableRadiusRatioValidation: true,
      enableVelocityValidation: true,
      enableAspectRatioValidation: true
    });
    setValidator(newValidator);
  }, [selectedStandard, selectedPressureClass]);

  // Run validation test
  const runValidationTest = useCallback((testCase: typeof testCases[0]) => {
    try {
      const result = validator.validateCenterline(
        testCase.centerline as Centerline,
        testCase.ductDimensions,
        testCase.ductShape,
        testCase.airflow
      );

      setValidationResults(prev => [
        ...prev,
        {
          ...result,
          testName: testCase.name,
          timestamp: Date.now()
        } as SMACNAValidationResult & { testName: string; timestamp: number }
      ]);

    } catch (error) {
      console.error('Validation test failed:', error);
      setValidationResults(prev => [
        ...prev,
        {
          isCompliant: false,
          violations: [{
            code: 'TEST-ERROR',
            severity: 'critical' as const,
            description: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            standardReference: 'N/A',
            currentValue: 0,
            requiredValue: 0
          }],
          warnings: [],
          recommendations: [],
          calculatedValues: {},
          standardsApplied: [selectedStandard],
          testName: testCase.name,
          timestamp: Date.now()
        } as SMACNAValidationResult & { testName: string; timestamp: number }
      ]);
    }
  }, [validator, selectedStandard]);

  // Clear results
  const clearResults = useCallback(() => {
    setValidationResults([]);
  }, []);

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-800 bg-red-100';
      case 'major': return 'text-orange-800 bg-orange-100';
      case 'minor': return 'text-yellow-800 bg-yellow-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">SMACNA Validation Example</h1>
      
      {/* Configuration Controls */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Validation Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMACNA Standard
            </label>
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value as SMACNAStandard)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {Object.values(SMACNAStandard).map(standard => (
                <option key={standard} value={standard}>{standard}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pressure Class
            </label>
            <select
              value={selectedPressureClass}
              onChange={(e) => setSelectedPressureClass(e.target.value as PressureClass)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {Object.values(PressureClass).map(pressureClass => (
                <option key={pressureClass} value={pressureClass}>
                  {pressureClass.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={updateValidatorConfig}
              className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Update Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Test Cases */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Cases</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testCases.map((testCase, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-2">{testCase.name}</h3>
              <div className="text-sm text-gray-600 mb-3">
                <div>Shape: {testCase.ductShape}</div>
                <div>
                  Dimensions: {testCase.ductShape === DuctShape.ROUND 
                    ? `${testCase.ductDimensions.diameter}" diameter`
                    : `${testCase.ductDimensions.width}" × ${testCase.ductDimensions.height}"`
                  }
                </div>
                <div>Airflow: {testCase.airflow} CFM</div>
                <div>Type: {testCase.centerline.type}</div>
                {testCase.centerline.radius && (
                  <div>Radius: {testCase.centerline.radius}"</div>
                )}
              </div>
              <button
                onClick={() => runValidationTest(testCase)}
                className="w-full p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Run Validation
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Validation Results */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Validation Results</h2>
        
        {validationResults.length === 0 ? (
          <p className="text-gray-500 italic">No validation results yet. Run some test cases above!</p>
        ) : (
          validationResults.map((result, index) => {
            const typedResult = result as SMACNAValidationResult & { testName: string; timestamp: number };
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">{typedResult.testName}</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    typedResult.isCompliant 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {typedResult.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                  </div>
                </div>

                {/* Violations */}
                {typedResult.violations.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-red-700 mb-2">Violations</h4>
                    <div className="space-y-2">
                      {typedResult.violations.map((violation, vIndex) => (
                        <div key={vIndex} className={`p-3 rounded-md ${getSeverityColor(violation.severity)}`}>
                          <div className="font-medium">{violation.code}: {violation.description}</div>
                          <div className="text-sm mt-1">
                            Current: {violation.currentValue.toFixed(2)} | 
                            Required: {violation.requiredValue.toFixed(2)} | 
                            Reference: {violation.standardReference}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {typedResult.warnings.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-yellow-700 mb-2">Warnings</h4>
                    <div className="space-y-2">
                      {typedResult.warnings.map((warning, wIndex) => (
                        <div key={wIndex} className="p-3 rounded-md bg-yellow-100 text-yellow-800">
                          <div className="font-medium">{warning.code}: {warning.description}</div>
                          <div className="text-sm mt-1">
                            Recommendation: {warning.recommendation} | 
                            Reference: {warning.standardReference}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Calculated Values */}
                {Object.keys(typedResult.calculatedValues).length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-blue-700 mb-2">Calculated Values</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {Object.entries(typedResult.calculatedValues).map(([key, value]) => (
                        <div key={key} className="p-2 bg-blue-50 rounded text-sm">
                          <div className="font-medium text-blue-800">{key}</div>
                          <div className="text-blue-600">{value.toFixed(3)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {typedResult.recommendations.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-purple-700 mb-2">Recommendations</h4>
                    <div className="space-y-2">
                      {typedResult.recommendations.map((rec, rIndex) => (
                        <div key={rIndex} className="p-3 rounded-md bg-purple-50 text-purple-800">
                          <div className="font-medium">{rec.description}</div>
                          <div className="text-sm mt-1">
                            Benefit: {rec.benefit} | 
                            Implementation: {rec.implementation} | 
                            Priority: {rec.priority.toUpperCase()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-4">
                  Standards Applied: {typedResult.standardsApplied.join(', ')} | 
                  Tested: {new Date(typedResult.timestamp).toLocaleString()}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SMACNAValidationExample;
