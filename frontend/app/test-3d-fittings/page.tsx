'use client';

/**
 * 3D Fittings Test Page
 * Comprehensive testing interface for the parametric 3D mesh system
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Separator } from '../../components/ui/separator';
import { FittingSelector } from '../../components/3d/FittingSelector';
import { FittingViewer } from '../../components/3d/FittingViewer';
import { 
  FittingType, 
  FittingResult, 
  FittingParams,
  ElbowParams,
  TransitionParams
} from '../../lib/3d-fittings/fitting-interfaces';
import { fittingFactory } from '../../lib/3d-fittings/fitting-factory';
import { validationSystem } from '../../lib/3d-fittings/validation-system';
import { 
  SMACNA_GAUGE_TABLE,
  MATERIAL_DISPLAY_NAMES,
  getRecommendedGauge
} from '../../lib/3d-fittings/smacna-gauge-tables';

export default function Test3DFittingsPage() {
  const [currentFitting, setCurrentFitting] = useState<FittingResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);

  // Handle fitting generation
  const handleFittingGenerate = useCallback(async (type: FittingType, params: FittingParams) => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log('Generating fitting:', type, params);
      
      // Validate parameters
      const validation = validationSystem.validateFitting(params);
      console.log('Validation result:', validation);
      
      if (!validation.isValid) {
        setError(`Validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      // Generate fitting
      const result = await fittingFactory.generateFitting(type, params);
      console.log('Generated fitting:', result);
      
      setCurrentFitting(result);
      
      // Add to test results
      setTestResults(prev => [...prev, {
        timestamp: new Date().toISOString(),
        type,
        params,
        result: {
          volume: result.volume,
          weight: result.weight,
          surfaceArea: result.surfaceArea,
          materialUsage: result.materialUsage
        },
        validation
      }]);

    } catch (err) {
      console.error('Fitting generation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Handle validation changes
  const handleValidationChange = useCallback((isValid: boolean, errors: string[]) => {
    setValidationErrors(errors);
  }, []);

  // Run comprehensive tests
  const runComprehensiveTests = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setTestResults([]);

    const testCases = [
      // Elbow tests
      {
        type: FittingType.ELBOW,
        params: {
          diameter: 12,
          bendRadius: 18,
          angle: 90,
          material: 'galvanized_steel',
          gauge: '26'
        } as ElbowParams
      },
      {
        type: FittingType.ELBOW,
        params: {
          diameter: 24,
          bendRadius: 36,
          angle: 45,
          material: 'aluminum',
          gauge: '22'
        } as ElbowParams
      },
      // Transition tests
      {
        type: FittingType.TRANSITION,
        params: {
          inletDiameter: 16,
          outletDiameter: 12,
          length: 12,
          type: 'concentric',
          material: 'stainless_steel',
          gauge: '24'
        } as TransitionParams
      },
      {
        type: FittingType.TRANSITION,
        params: {
          inletDiameter: 20,
          outletDiameter: 8,
          length: 24,
          type: 'eccentric',
          material: 'galvanized_steel',
          gauge: '20'
        } as TransitionParams
      }
    ];

    const results = [];

    for (const testCase of testCases) {
      try {
        console.log(`Testing ${testCase.type}:`, testCase.params);
        
        // Validate
        const validation = validationSystem.validateFitting(testCase.params);
        
        // Generate if valid
        let result = null;
        if (validation.isValid) {
          result = await fittingFactory.generateFitting(testCase.type, testCase.params);
        }

        results.push({
          timestamp: new Date().toISOString(),
          type: testCase.type,
          params: testCase.params,
          validation,
          result: result ? {
            volume: result.volume,
            weight: result.weight,
            surfaceArea: result.surfaceArea,
            materialUsage: result.materialUsage
          } : null,
          success: validation.isValid && result !== null
        });

      } catch (err) {
        console.error(`Test failed for ${testCase.type}:`, err);
        results.push({
          timestamp: new Date().toISOString(),
          type: testCase.type,
          params: testCase.params,
          error: err instanceof Error ? err.message : 'Unknown error',
          success: false
        });
      }
    }

    setTestResults(results);
    setIsGenerating(false);
  }, []);

  // Test SMACNA gauge tables
  const testSMACNAGaugeTables = useCallback(() => {
    console.log('Testing SMACNA Gauge Tables:');
    console.log('Gauge table:', SMACNA_GAUGE_TABLE);
    
    // Test recommendations
    const testDiameters = [8, 12, 18, 24, 36, 48];
    const testMaterials = ['galvanized_steel', 'aluminum', 'stainless_steel'] as const;
    
    testMaterials.forEach(material => {
      console.log(`\n${MATERIAL_DISPLAY_NAMES[material]} recommendations:`);
      testDiameters.forEach(diameter => {
        const rec = getRecommendedGauge(diameter, material);
        console.log(`  ${diameter}": recommended ${rec?.recommended}, minimum ${rec?.minimum}`);
      });
    });
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">3D Fittings Test Suite</h1>
        <Badge variant="outline">Parametric Mesh System</Badge>
      </div>

      <Tabs defaultValue="interactive" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="interactive">Interactive Test</TabsTrigger>
          <TabsTrigger value="automated">Automated Tests</TabsTrigger>
          <TabsTrigger value="validation">Validation Tests</TabsTrigger>
          <TabsTrigger value="data">Data Verification</TabsTrigger>
        </TabsList>

        {/* Interactive Testing */}
        <TabsContent value="interactive" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fitting Selector */}
            <FittingSelector
              onFittingGenerate={handleFittingGenerate}
              onValidationChange={handleValidationChange}
              disabled={isGenerating}
            />

            {/* 3D Viewer */}
            <FittingViewer
              fitting={currentFitting || undefined}
              width={500}
              height={400}
              showControls={true}
              showStats={true}
            />
          </div>

          {/* Status */}
          {isGenerating && (
            <Alert>
              <AlertDescription>Generating fitting...</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Automated Testing */}
        <TabsContent value="automated" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comprehensive Test Suite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runComprehensiveTests}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Running Tests...' : 'Run All Tests'}
              </Button>

              {testResults.length > 0 && (
                <div className="space-y-4">
                  <Separator />
                  <h3 className="text-lg font-semibold">Test Results</h3>
                  
                  <div className="grid gap-4">
                    {testResults.map((result, index) => (
                      <Card key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={result.success ? 'default' : 'destructive'}>
                              {result.type}
                            </Badge>
                            <Badge variant="outline">
                              {result.success ? 'PASS' : 'FAIL'}
                            </Badge>
                          </div>
                          
                          <div className="text-sm space-y-1">
                            <div><strong>Material:</strong> {MATERIAL_DISPLAY_NAMES[result.params.material as keyof typeof MATERIAL_DISPLAY_NAMES]}</div>
                            <div><strong>Gauge:</strong> {result.params.gauge}</div>
                            
                            {result.result && (
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>Volume: {result.result.volume.toFixed(2)} in³</div>
                                <div>Weight: {result.result.weight.toFixed(2)} lbs</div>
                                <div>Surface: {result.result.surfaceArea.toFixed(2)} in²</div>
                                <div>Material: {result.result.materialUsage.toFixed(2)} ft²</div>
                              </div>
                            )}
                            
                            {result.error && (
                              <div className="text-red-600 mt-2">Error: {result.error}</div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Testing */}
        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Validation System Test</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Test the validation system with various parameter combinations.
              </p>
              <Button onClick={() => console.log('Validation system:', validationSystem)}>
                Log Validation System
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Verification */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SMACNA Data Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Verify SMACNA gauge tables and recommendation system.
              </p>
              <Button onClick={testSMACNAGaugeTables}>
                Test SMACNA Tables
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
