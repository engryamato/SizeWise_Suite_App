'use client';

/**
 * 3D Fitting Viewer Component
 * Displays generated 3D duct fittings using Three.js
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { FittingResult, FittingType } from '../../lib/3d-fittings/fitting-interfaces';
import { useThreeMemoryManager } from '@/lib/hooks/useMemoryManager';

interface FittingViewerProps {
  fitting?: FittingResult;
  width?: number;
  height?: number;
  showControls?: boolean;
  showStats?: boolean;
  className?: string;
}

export function FittingViewer({
  fitting,
  width = 400,
  height = 300,
  showControls = true,
  showStats = true,
  className = ''
}: FittingViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null); // OrbitControls
  const currentMeshRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memory management
  const memoryManager = useThreeMemoryManager({
    enableMonitoring: true,
    autoCleanup: true,
    maxMemoryMB: 100,
    onMemoryLeak: (growthRate) => {
      console.warn(`Memory leak detected in FittingViewer: ${growthRate.toFixed(2)} MB/hour`);
    }
  });

  // Initialize Three.js scene
  const initializeScene = useCallback(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(30, 30, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x8bb7f0, 0.2);
    fillLight.position.set(-50, 0, -50);
    scene.add(fillLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(100, 20, 0x888888, 0xcccccc);
    scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(20);
    scene.add(axesHelper);

    // Add to DOM
    mountRef.current.appendChild(renderer.domElement);

    // Initialize controls (would need to import OrbitControls)
    // For now, we'll implement basic mouse controls
    setupBasicControls(camera, renderer.domElement);

    // Start render loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      renderer.render(scene, camera);
    };
    animate();

  }, [width, height]);

  // Basic mouse controls (simplified version of OrbitControls)
  const setupBasicControls = useCallback((camera: THREE.PerspectiveCamera, domElement: HTMLElement) => {
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      targetX += deltaX * 0.01;
      targetY += deltaY * 0.01;

      // Rotate camera around origin
      const radius = camera.position.length();
      camera.position.x = radius * Math.sin(targetX) * Math.cos(targetY);
      camera.position.y = radius * Math.sin(targetY);
      camera.position.z = radius * Math.cos(targetX) * Math.cos(targetY);
      camera.lookAt(0, 0, 0);

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onWheel = (event: WheelEvent) => {
      const scale = event.deltaY > 0 ? 1.1 : 0.9;
      camera.position.multiplyScalar(scale);
      camera.position.clampLength(10, 200);
    };

    domElement.addEventListener('mousedown', onMouseDown);
    domElement.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('mousemove', onMouseMove);
    domElement.addEventListener('wheel', onWheel);

    // Store cleanup function
    controlsRef.current = {
      update: () => {},
      dispose: () => {
        domElement.removeEventListener('mousedown', onMouseDown);
        domElement.removeEventListener('mouseup', onMouseUp);
        domElement.removeEventListener('mousemove', onMouseMove);
        domElement.removeEventListener('wheel', onWheel);
      }
    };
  }, []);

  // Load fitting into scene
  const loadFitting = useCallback(async (fittingResult: FittingResult) => {
    if (!sceneRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Remove previous mesh using memory manager
      if (currentMeshRef.current) {
        sceneRef.current.remove(currentMeshRef.current);
        memoryManager.disposeMesh(currentMeshRef.current);
      }

      // Add new mesh
      const mesh = fittingResult.mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      sceneRef.current.add(mesh);
      currentMeshRef.current = mesh;

      // Center and scale the fitting
      const box = new THREE.Box3().setFromObject(mesh);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      // Center the mesh
      mesh.position.sub(center);
      
      // Scale camera distance based on fitting size
      if (cameraRef.current) {
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2;
        cameraRef.current.position.normalize().multiplyScalar(distance);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fitting');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset camera view
  const resetView = useCallback(() => {
    if (!cameraRef.current || !currentMeshRef.current) return;

    const box = new THREE.Box3().setFromObject(currentMeshRef.current);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;

    cameraRef.current.position.set(distance, distance, distance);
    cameraRef.current.lookAt(0, 0, 0);
  }, []);

  // Export fitting as image
  const exportImage = useCallback(() => {
    if (!rendererRef.current) return;

    const link = document.createElement('a');
    link.download = `fitting-${Date.now()}.png`;
    link.href = rendererRef.current.domElement.toDataURL();
    link.click();
  }, []);

  // Initialize scene on mount
  useEffect(() => {
    initializeScene();

    return () => {
      // Cleanup using memory manager
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (currentMeshRef.current) {
        memoryManager.disposeMesh(currentMeshRef.current);
      }
      if (rendererRef.current) {
        if (mountRef.current && rendererRef.current.domElement.parentNode) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
        memoryManager.dispose(rendererRef.current);
      }
      // Dispose all tracked resources
      memoryManager.disposeAll();
    };
  }, [initializeScene]);

  // Load fitting when it changes
  useEffect(() => {
    if (fitting) {
      loadFitting(fitting);
    }
  }, [fitting, loadFitting]);

  // Handle resize
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current) return;

    rendererRef.current.setSize(width, height);
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
  }, [width, height]);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>3D Fitting Viewer</CardTitle>
          {fitting && (
            <Badge variant="secondary">
              {fitting.type.charAt(0).toUpperCase() + fitting.type.slice(1)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 3D Viewport */}
          <div 
            ref={mountRef} 
            className="border rounded-lg overflow-hidden bg-gray-50"
            style={{ width, height }}
          />

          {/* Loading/Error States */}
          {isLoading && (
            <div className="text-center text-sm text-gray-500">
              Loading fitting...
            </div>
          )}
          
          {error && (
            <div className="text-center text-sm text-red-500">
              Error: {error}
            </div>
          )}

          {/* Controls */}
          {showControls && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetView}>
                Reset View
              </Button>
              <Button variant="outline" size="sm" onClick={exportImage}>
                Export Image
              </Button>
            </div>
          )}

          {/* Fitting Stats */}
          {showStats && fitting && (
            <div className="space-y-2">
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Volume:</span>
                  <span className="ml-2">{fitting.volume.toFixed(2)} in³</span>
                </div>
                <div>
                  <span className="font-medium">Weight:</span>
                  <span className="ml-2">{fitting.weight.toFixed(2)} lbs</span>
                </div>
                <div>
                  <span className="font-medium">Surface Area:</span>
                  <span className="ml-2">{fitting.surfaceArea.toFixed(2)} in²</span>
                </div>
                <div>
                  <span className="font-medium">Material Usage:</span>
                  <span className="ml-2">{fitting.materialUsage.toFixed(2)} ft²</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
