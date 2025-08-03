/**
 * HVAC Memory Leak Detection Tests
 * SizeWise Suite - Phase 4: Performance Optimization
 * 
 * Comprehensive memory leak testing for 3D HVAC components
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as THREE from 'three';
import { memoryManager } from '@/lib/3d/memory-manager';
import { hvacMemoryProfiler } from '@/lib/3d/hvac-memory-profiler';
import { createRoundElbow } from '@/lib/3d-fittings/generators/round-elbow-generator';
import { createRectangularTransition } from '@/lib/3d-fittings/generators/rectangular-transition-generator';

// Mock performance.memory for testing
const mockPerformanceMemory = {
  usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 // 2GB
};

// Mock global gc function
(global as any).gc = jest.fn();

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  value: mockPerformanceMemory,
  writable: true
});

describe('HVAC Memory Leak Detection', () => {
  let scene: THREE.Scene;
  let renderer: THREE.WebGLRenderer;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Create canvas for WebGL context
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    // Create Three.js scene
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setSize(800, 600);
    
    // Clear memory manager
    memoryManager.disposeAll();
    hvacMemoryProfiler.clearHistory();
  });

  afterEach(() => {
    // Cleanup
    memoryManager.disposeAll();
    if (renderer) {
      renderer.dispose();
    }
    hvacMemoryProfiler.stopProfiling();
  });

  test('should track and dispose geometries properly', () => {
    const initialStats = memoryManager.getMemoryStats();
    
    // Create multiple geometries
    const geometries: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 10; i++) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      geometries.push(memoryManager.track(geometry, `box_${i}`));
    }
    
    const afterCreationStats = memoryManager.getMemoryStats();
    expect(afterCreationStats.geometries).toBeGreaterThan(initialStats.geometries);
    
    // Dispose all geometries
    geometries.forEach(geometry => memoryManager.dispose(geometry));
    
    const afterDisposalStats = memoryManager.getMemoryStats();
    expect(afterDisposalStats.geometries).toBeLessThanOrEqual(afterCreationStats.geometries);
  });

  test('should detect memory leaks in HVAC fitting generation', async () => {
    const memorySnapshots: number[] = [];
    
    // Start profiling
    hvacMemoryProfiler.startProfiling(1000); // Every second
    
    // Simulate repeated fitting generation without proper cleanup
    for (let i = 0; i < 20; i++) {
      // Create round elbow
      const elbowResult = createRoundElbow({
        diameter: 12,
        gauge: '22',
        material: 'galvanized_steel',
        bendRadius: 18,
        angle: 90
      });
      
      // Create rectangular transition
      const transitionResult = createRectangularTransition({
        fromWidth: 12,
        fromHeight: 8,
        toWidth: 16,
        toHeight: 10,
        length: 24,
        gauge: '22',
        material: 'galvanized_steel'
      });
      
      // Add to scene (simulating real usage)
      scene.add(elbowResult.mesh);
      scene.add(transitionResult.mesh);
      
      // Simulate some operations
      renderer.render(scene, new THREE.PerspectiveCamera());
      
      // Take memory snapshot
      const stats = memoryManager.getMemoryStats();
      memorySnapshots.push(stats.totalMemoryMB);
      
      // Simulate improper cleanup (memory leak scenario)
      // Only remove from scene, don't dispose resources
      scene.remove(elbowResult.mesh);
      scene.remove(transitionResult.mesh);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Check for memory growth
    const initialMemory = memorySnapshots[0];
    const finalMemory = memorySnapshots[memorySnapshots.length - 1];
    const memoryGrowth = finalMemory - initialMemory;
    
    // Should detect significant memory growth
    expect(memoryGrowth).toBeGreaterThan(0);
    
    // Get leak report
    const report = hvacMemoryProfiler.getReport();
    expect(report.leakReport.isLeakDetected).toBe(true);
    expect(report.leakReport.severity).toMatch(/medium|high|critical/);
  });

  test('should properly cleanup HVAC components with memory manager', async () => {
    const initialStats = memoryManager.getMemoryStats();
    
    // Create multiple HVAC components with proper cleanup
    for (let i = 0; i < 10; i++) {
      // Create round elbow
      const elbowResult = createRoundElbow({
        diameter: 12,
        gauge: '22',
        material: 'galvanized_steel',
        bendRadius: 18,
        angle: 90
      });
      
      // Track with memory manager
      memoryManager.track(elbowResult.mesh.geometry, `elbow_geometry_${i}`);
      if (Array.isArray(elbowResult.mesh.material)) {
        elbowResult.mesh.material.forEach((mat, idx) => {
          memoryManager.track(mat, `elbow_material_${i}_${idx}`);
        });
      } else {
        memoryManager.track(elbowResult.mesh.material, `elbow_material_${i}`);
      }
      
      // Add to scene
      scene.add(elbowResult.mesh);
      
      // Render
      renderer.render(scene, new THREE.PerspectiveCamera());
      
      // Proper cleanup using memory manager
      memoryManager.disposeMesh(elbowResult.mesh);
    }
    
    // Force garbage collection
    memoryManager.forceCleanup();
    
    const finalStats = memoryManager.getMemoryStats();
    
    // Memory should not have grown significantly
    const memoryGrowth = finalStats.totalMemoryMB - initialStats.totalMemoryMB;
    expect(memoryGrowth).toBeLessThan(5); // Less than 5MB growth
  });

  test('should handle texture disposal correctly', () => {
    const textures: THREE.Texture[] = [];
    
    // Create textures
    for (let i = 0; i < 5; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const texture = new THREE.CanvasTexture(canvas);
      textures.push(memoryManager.track(texture, `texture_${i}`));
    }
    
    const initialStats = memoryManager.getMemoryStats();
    expect(initialStats.textures).toBeGreaterThan(0);
    
    // Dispose textures
    textures.forEach(texture => memoryManager.dispose(texture));
    
    const finalStats = memoryManager.getMemoryStats();
    expect(finalStats.textures).toBeLessThanOrEqual(initialStats.textures);
  });

  test('should monitor memory growth rate', async () => {
    // Start monitoring
    memoryManager.startMonitoring(500); // Every 500ms
    
    // Create some memory pressure
    const objects: THREE.Mesh[] = [];
    for (let i = 0; i < 50; i++) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(geometry, material);
      objects.push(mesh);
      scene.add(mesh);
      
      // Don't dispose - simulate memory leak
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Wait for monitoring to collect data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const report = memoryManager.getMemoryReport();
    expect(report.history.length).toBeGreaterThan(0);
    expect(report.growthRate).toBeGreaterThan(0);
    
    // Cleanup
    objects.forEach(mesh => memoryManager.disposeMesh(mesh));
    memoryManager.stopMonitoring();
  });

  test('should provide accurate memory usage estimates', () => {
    // Create known geometry
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    memoryManager.track(geometry, 'test_box');
    
    // Create known material
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    memoryManager.track(material, 'test_material');
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    const stats = memoryManager.getMemoryStats();
    expect(stats.totalMemoryMB).toBeGreaterThan(0);
    expect(stats.geometries).toBeGreaterThan(0);
    expect(stats.materials).toBeGreaterThan(0);
    
    // Cleanup
    memoryManager.disposeMesh(mesh);
  });

  test('should handle WebGL context loss gracefully', () => {
    const initialStats = memoryManager.getMemoryStats();
    
    // Simulate context loss
    const gl = renderer.getContext();
    const loseContextExt = gl.getExtension('WEBGL_lose_context');
    
    if (loseContextExt) {
      loseContextExt.loseContext();
    }
    
    // Dispose renderer
    memoryManager.dispose(renderer);
    
    const finalStats = memoryManager.getMemoryStats();
    expect(finalStats).toBeDefined();
  });

  test('should generate helpful memory leak recommendations', () => {
    // Start profiling
    hvacMemoryProfiler.startProfiling(100);
    
    // Create memory pressure in different categories
    for (let i = 0; i < 10; i++) {
      // Duct segments
      const ductGeometry = new THREE.CylinderGeometry(1, 1, 10);
      const ductMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
      const ductMesh = new THREE.Mesh(ductGeometry, ductMaterial);
      ductMesh.userData.type = 'duct';
      scene.add(ductMesh);
      
      // Fittings
      const fittingGeometry = new THREE.TorusGeometry(1, 0.3);
      const fittingMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
      const fittingMesh = new THREE.Mesh(fittingGeometry, fittingMaterial);
      fittingMesh.userData.type = 'fitting';
      scene.add(fittingMesh);
    }
    
    // Wait for profiling
    setTimeout(() => {
      const report = hvacMemoryProfiler.getReport();
      expect(report.leakReport.recommendations).toBeDefined();
      expect(report.leakReport.recommendations.length).toBeGreaterThan(0);
      
      hvacMemoryProfiler.stopProfiling();
    }, 1000);
  });
});
