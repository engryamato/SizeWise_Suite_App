'use client';

/**
 * Refactored 3D Fittings Test Page
 * Test interface for the new parametric fitting generators with auto-selection
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Separator } from '../../components/ui/separator';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

// Import the new refactored system
import {
  DuctNode,
  autoSelectElbow,
  autoSelectFitting,
  getRecommendedFittingParams,
  validateFittingCompatibility,
  batchGenerateFittings,
  createRoundElbow,
  createRectangularSquareThroatElbow,
  fittingRegistry,
  getRegistryStats,
  getAvailableFittings,
  DuctShapeType,
  FittingType
} from '../../lib/3d-fittings';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export default function TestRefactoredFittingsPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('registry');
  const [isRunning, setIsRunning] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Test data
  const [roundDuctNode, setRoundDuctNode] = useState<DuctNode | null>(null);
  const [rectDuctNode, setRectDuctNode] = useState<DuctNode | null>(null);

  useEffect(() => {
    // Initialize test duct nodes
    try {
      const roundNode = new DuctNode({
        id: 'round-test-1',
        shapeType: 'round',
        dimensions: { diameter: 12 },
        material: { type: 'galvanized_steel', gauge: '22' },
        systemProperties: { velocity: 1500, pressure: 2.5 },
        position: { x: 0, y: 0, z: 0 }
      });

      const rectNode = new DuctNode({
        id: 'rect-test-1',
        shapeType: 'rectangular',
        dimensions: { width: 24, height: 12 },
        material: { type: 'aluminum', gauge: '20' },
        systemProperties: { velocity: 1200, pressure: 1.8 },
        position: { x: 10, y: 0, z: 0 }
      });

      setRoundDuctNode(roundNode);
      setRectDuctNode(rectNode);
    } catch (error) {
      console.error('Failed to initialize test nodes:', error);
    }
  }, []);

  const addTestResult = useCallback((result: TestResult) => {
    setTestResults(prev => [...prev, { ...result, timestamp: Date.now() } as any]);
  }, []);

  const clearResults = useCallback(() => {
    setTestResults([]);
  }, []);

  // Test registry functionality
  const testRegistry = useCallback(async () => {
    setIsRunning(true);
    try {
      // Test registry stats
      const stats = getRegistryStats();
      addTestResult({
        success: true,
        message: 'Registry Stats Retrieved',
        data: stats
      });

      // Test available fittings
      const roundFittings = getAvailableFittings('round');
      const rectFittings = getAvailableFittings('rectangular');
      
      addTestResult({
        success: true,
        message: 'Available Fittings Retrieved',
        data: { round: roundFittings, rectangular: rectFittings }
      });

    } catch (error) {
      addTestResult({
        success: false,
        message: 'Registry Test Failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    setIsRunning(false);
  }, [addTestResult]);

  // Test duct node functionality
  const testDuctNodes = useCallback(async () => {
    setIsRunning(true);
    try {
      if (!roundDuctNode || !rectDuctNode) {
        throw new Error('Test nodes not initialized');
      }

      // Test node properties
      const roundArea = roundDuctNode.getCrossSectionalArea();
      const rectArea = rectDuctNode.getCrossSectionalArea();
      const roundPerimeter = roundDuctNode.getPerimeter();
      const rectPerimeter = rectDuctNode.getPerimeter();

      addTestResult({
        success: true,
        message: 'Node Properties Calculated',
        data: {
          round: { area: roundArea, perimeter: roundPerimeter },
          rectangular: { area: rectArea, perimeter: rectPerimeter }
        }
      });

      // Test compatibility
      const compatibility = validateFittingCompatibility(roundDuctNode, rectDuctNode, FittingType.ELBOW);
      addTestResult({
        success: true,
        message: 'Compatibility Check Completed',
        data: compatibility
      });

    } catch (error) {
      addTestResult({
        success: false,
        message: 'Duct Node Test Failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    setIsRunning(false);
  }, [roundDuctNode, rectDuctNode, addTestResult]);

  // Test auto-selection
  const testAutoSelection = useCallback(async () => {
    setIsRunning(true);
    try {
      if (!roundDuctNode || !rectDuctNode) {
        throw new Error('Test nodes not initialized');
      }

      // Test round elbow auto-selection
      const roundElbowResult = autoSelectElbow(roundDuctNode, { angle: 90, bendRadius: 18 });
      addTestResult({
        success: true,
        message: 'Round Elbow Auto-Selected',
        data: {
          fittingType: roundElbowResult.fittingType,
          shapeType: roundElbowResult.shapeType,
          parameters: roundElbowResult.parameters
        }
      });

      // Test rectangular elbow auto-selection
      const rectElbowResult = autoSelectElbow(rectDuctNode, { legLength: 30 });
      addTestResult({
        success: true,
        message: 'Rectangular Elbow Auto-Selected',
        data: {
          fittingType: rectElbowResult.fittingType,
          shapeType: rectElbowResult.shapeType,
          parameters: rectElbowResult.parameters
        }
      });

      // Test recommendations
      const roundRecommendations = getRecommendedFittingParams(roundDuctNode, FittingType.ELBOW);
      const rectRecommendations = getRecommendedFittingParams(rectDuctNode, FittingType.ELBOW);

      addTestResult({
        success: true,
        message: 'Fitting Recommendations Generated',
        data: {
          round: roundRecommendations,
          rectangular: rectRecommendations
        }
      });

    } catch (error) {
      addTestResult({
        success: false,
        message: 'Auto-Selection Test Failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    setIsRunning(false);
  }, [roundDuctNode, rectDuctNode, addTestResult]);

  // Test 3D generation
  const test3DGeneration = useCallback(async () => {
    setIsRunning(true);
    try {
      // Initialize 3D scene if not already done
      if (!sceneRef.current && mountRef.current) {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);

        const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
        camera.position.set(50, 50, 50);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(800, 600);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        mountRef.current.appendChild(renderer.domElement);
        sceneRef.current = scene;
        rendererRef.current = renderer;
      }

      if (!sceneRef.current) {
        throw new Error('Failed to initialize 3D scene');
      }

      // Clear previous meshes
      const meshesToRemove = sceneRef.current.children.filter(child => child.userData.isTestMesh);
      meshesToRemove.forEach(mesh => sceneRef.current!.remove(mesh));

      // Test round elbow generation
      const roundElbow = createRoundElbow({
        diameter: 12,
        gauge: '22',
        material: 'galvanized_steel',
        bendRadius: 18,
        angle: 90
      });
      roundElbow.position.set(-20, 0, 0);
      roundElbow.userData.isTestMesh = true;
      sceneRef.current.add(roundElbow);

      // Test rectangular elbow generation
      const rectElbow = createRectangularSquareThroatElbow({
        width: 24,
        height: 12,
        gauge: '20',
        material: 'aluminum',
        legLength: 30
      });
      rectElbow.position.set(20, 0, 0);
      rectElbow.userData.isTestMesh = true;
      sceneRef.current.add(rectElbow);

      // Render the scene
      if (rendererRef.current) {
        rendererRef.current.render(sceneRef.current, new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000));
      }

      addTestResult({
        success: true,
        message: '3D Meshes Generated Successfully',
        data: {
          roundElbow: 'Generated at position (-20, 0, 0)',
          rectElbow: 'Generated at position (20, 0, 0)'
        }
      });

    } catch (error) {
      addTestResult({
        success: false,
        message: '3D Generation Test Failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    setIsRunning(false);
  }, [addTestResult]);

  // Test batch generation
  const testBatchGeneration = useCallback(async () => {
    setIsRunning(true);
    try {
      if (!roundDuctNode || !rectDuctNode) {
        throw new Error('Test nodes not initialized');
      }

      const nodes = [roundDuctNode, rectDuctNode];
      const configs = [
        { nodeIndex: 0, fittingType: FittingType.ELBOW, params: { angle: 45 } },
        { nodeIndex: 1, fittingType: FittingType.ELBOW, params: { legLength: 25 } }
      ];

      const results = batchGenerateFittings(nodes, configs);

      addTestResult({
        success: true,
        message: 'Batch Generation Completed',
        data: {
          generatedCount: results.length,
          results: results.map(r => ({
            fittingType: r.fittingType,
            shapeType: r.shapeType,
            nodeId: r.metadata.nodeId
          }))
        }
      });

    } catch (error) {
      addTestResult({
        success: false,
        message: 'Batch Generation Test Failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    setIsRunning(false);
  }, [roundDuctNode, rectDuctNode, addTestResult]);

  const runAllTests = useCallback(async () => {
    clearResults();
    await testRegistry();
    await testDuctNodes();
    await testAutoSelection();
    await test3DGeneration();
    await testBatchGeneration();
  }, [testRegistry, testDuctNodes, testAutoSelection, test3DGeneration, testBatchGeneration, clearResults]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Refactored Parametric 3D Fittings Test</h1>
        <p className="text-muted-foreground">
          Test interface for the new auto-selection and registry system
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={testRegistry} disabled={isRunning}>
                Test Registry
              </Button>
              <Button onClick={testDuctNodes} disabled={isRunning}>
                Test Duct Nodes
              </Button>
              <Button onClick={testAutoSelection} disabled={isRunning}>
                Test Auto-Selection
              </Button>
              <Button onClick={test3DGeneration} disabled={isRunning}>
                Test 3D Generation
              </Button>
              <Button onClick={testBatchGeneration} disabled={isRunning}>
                Test Batch Generation
              </Button>
              <Button onClick={runAllTests} disabled={isRunning} className="col-span-2">
                Run All Tests
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Button onClick={clearResults} variant="outline" className="w-full">
                Clear Results
              </Button>
              <Badge variant="secondary">
                Total Results: {testResults.length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 3D Viewer */}
        <Card>
          <CardHeader>
            <CardTitle>3D Viewer</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={mountRef} 
              className="w-full h-96 border border-gray-300 rounded-lg overflow-hidden"
              style={{ minHeight: '400px' }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No test results yet. Run some tests to see results here.
              </p>
            ) : (
              testResults.map((result, index) => (
                <Alert key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{result.message}</span>
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      
                      {result.error && (
                        <div className="text-red-600 text-sm">
                          Error: {result.error}
                        </div>
                      )}
                      
                      {result.data && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-blue-600">View Data</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
