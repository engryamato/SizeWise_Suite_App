/**
 * React Hook for Memory Management in 3D Components
 * SizeWise Suite - Phase 4: Performance Optimization
 * 
 * Provides memory management capabilities for React components using Three.js
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { memoryManager, MemoryStats, DisposableResource } from '@/lib/3d/memory-manager';

export interface UseMemoryManagerOptions {
  enableMonitoring?: boolean;
  monitoringInterval?: number;
  autoCleanup?: boolean;
  maxMemoryMB?: number;
  onMemoryLeak?: (growthRate: number) => void;
}

export interface MemoryManagerHook {
  // Resource tracking
  track: <T extends DisposableResource>(resource: T, name?: string) => T;
  dispose: (resource: DisposableResource) => void;
  disposeAll: () => void;
  disposeMesh: (mesh: THREE.Mesh | THREE.Object3D) => void;
  
  // Memory monitoring
  memoryStats: MemoryStats | null;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  
  // Cleanup utilities
  forceCleanup: () => void;
  getMemoryReport: () => any;
  
  // Memory status
  memoryUsageMB: number;
  isMemoryHigh: boolean;
  growthRate: number;
}

export function useMemoryManager(options: UseMemoryManagerOptions = {}): MemoryManagerHook {
  const {
    enableMonitoring = true,
    monitoringInterval = 5000,
    autoCleanup = true,
    maxMemoryMB = 500,
    onMemoryLeak
  } = options;

  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [memoryUsageMB, setMemoryUsageMB] = useState(0);
  const [growthRate, setGrowthRate] = useState(0);
  
  const trackedResourcesRef = useRef<Set<DisposableResource>>(new Set());
  const monitoringIntervalRef = useRef<NodeJS.Timeout>();
  const lastCleanupRef = useRef<number>(0);

  // Track a resource for automatic cleanup
  const track = useCallback(<T extends DisposableResource>(resource: T, name?: string): T => {
    trackedResourcesRef.current.add(resource);
    return memoryManager.track(resource, name);
  }, []);

  // Dispose a specific resource
  const dispose = useCallback((resource: DisposableResource) => {
    trackedResourcesRef.current.delete(resource);
    memoryManager.dispose(resource);
  }, []);

  // Dispose all tracked resources
  const disposeAll = useCallback(() => {
    trackedResourcesRef.current.forEach(resource => {
      memoryManager.dispose(resource);
    });
    trackedResourcesRef.current.clear();
  }, []);

  // Dispose mesh with all components
  const disposeMesh = useCallback((mesh: THREE.Mesh | THREE.Object3D) => {
    memoryManager.disposeMesh(mesh);
  }, []);

  // Start memory monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    monitoringIntervalRef.current = setInterval(() => {
      const stats = memoryManager.getMemoryStats();
      const report = memoryManager.getMemoryReport();
      
      setMemoryStats(stats);
      setMemoryUsageMB(stats.totalMemoryMB);
      setGrowthRate(report.growthRate);
      
      // Check for memory issues
      if (stats.totalMemoryMB > maxMemoryMB && autoCleanup) {
        const now = Date.now();
        // Throttle cleanup to once per minute
        if (now - lastCleanupRef.current > 60000) {
          forceCleanup();
          lastCleanupRef.current = now;
        }
      }
      
      // Alert on memory leaks
      if (report.growthRate > 10 && onMemoryLeak) {
        onMemoryLeak(report.growthRate);
      }
    }, monitoringInterval);
  }, [isMonitoring, monitoringInterval, maxMemoryMB, autoCleanup, onMemoryLeak]);

  // Stop memory monitoring
  const stopMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = undefined;
    }
    setIsMonitoring(false);
  }, []);

  // Force cleanup
  const forceCleanup = useCallback(() => {
    memoryManager.forceCleanup();
    
    // Trigger garbage collection if available
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
  }, []);

  // Get memory report
  const getMemoryReport = useCallback(() => {
    return memoryManager.getMemoryReport();
  }, []);

  // Computed values
  const isMemoryHigh = memoryUsageMB > maxMemoryMB * 0.8; // 80% threshold

  // Setup and cleanup effects
  useEffect(() => {
    if (enableMonitoring) {
      startMonitoring();
    }
    
    return () => {
      stopMonitoring();
      disposeAll();
    };
  }, [enableMonitoring, startMonitoring, stopMonitoring, disposeAll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disposeAll();
    };
  }, [disposeAll]);

  return {
    // Resource tracking
    track,
    dispose,
    disposeAll,
    disposeMesh,
    
    // Memory monitoring
    memoryStats,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    
    // Cleanup utilities
    forceCleanup,
    getMemoryReport,
    
    // Memory status
    memoryUsageMB,
    isMemoryHigh,
    growthRate
  };
}

/**
 * Hook specifically for Three.js scene management
 */
export function useThreeMemoryManager(options: UseMemoryManagerOptions = {}) {
  const memoryHook = useMemoryManager(options);
  
  // Enhanced mesh creation with automatic tracking
  const createMesh = useCallback((
    geometry: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[]
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(geometry, material);
    
    // Track all components
    memoryHook.track(geometry, `geometry_${geometry.uuid}`);
    
    if (Array.isArray(material)) {
      material.forEach((mat, index) => {
        memoryHook.track(mat, `material_${mat.uuid}_${index}`);
      });
    } else {
      memoryHook.track(material, `material_${material.uuid}`);
    }
    
    return mesh;
  }, [memoryHook]);

  // Enhanced texture creation with tracking
  const createTexture = useCallback((
    image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    mapping?: THREE.Mapping,
    wrapS?: THREE.Wrapping,
    wrapT?: THREE.Wrapping
  ): THREE.Texture => {
    const texture = new THREE.Texture(image, mapping, wrapS, wrapT);
    return memoryHook.track(texture, `texture_${texture.uuid}`);
  }, [memoryHook]);

  // Enhanced geometry creation with tracking
  const createGeometry = useCallback(<T extends THREE.BufferGeometry>(
    geometryFactory: () => T
  ): T => {
    const geometry = geometryFactory();
    return memoryHook.track(geometry, `geometry_${geometry.type}_${geometry.uuid}`);
  }, [memoryHook]);

  // Enhanced material creation with tracking
  const createMaterial = useCallback(<T extends THREE.Material>(
    materialFactory: () => T
  ): T => {
    const material = materialFactory();
    return memoryHook.track(material, `material_${material.type}_${material.uuid}`);
  }, [memoryHook]);

  // Scene cleanup utility
  const cleanupScene = useCallback((scene: THREE.Scene) => {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        memoryHook.disposeMesh(object);
      }
    });
    
    // Clear the scene
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }
  }, [memoryHook]);

  return {
    ...memoryHook,
    
    // Enhanced creation methods
    createMesh,
    createTexture,
    createGeometry,
    createMaterial,
    cleanupScene
  };
}

/**
 * Hook for monitoring memory in development
 */
export function useMemoryDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const interval = setInterval(() => {
      const report = memoryManager.getMemoryReport();
      setDebugInfo(report);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return debugInfo;
}
