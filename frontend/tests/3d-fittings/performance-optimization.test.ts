/**
 * Performance Optimization Tests
 * Tests for mesh generation performance optimization and memory usage
 */

import { fittingFactory } from '../../lib/3d-fittings/fitting-factory';
import { PerformanceOptimizer, OptimizationOptions } from '../../lib/3d-fittings/performance-optimizer';
import { FittingType, ElbowParams, TransitionParams } from '../../lib/3d-fittings/fitting-interfaces';

describe('Performance Optimization Tests', () => {
  let performanceOptimizer: PerformanceOptimizer;

  beforeEach(() => {
    performanceOptimizer = PerformanceOptimizer.getInstance();
    performanceOptimizer.clearCaches();
  });

  describe('Mesh Generation Optimization', () => {
    test('should optimize parameters for draft quality', () => {
      const originalParams: ElbowParams = {
        material: 'galvanized_steel',
        gauge: '24',
        diameter: 12,
        bendRadius: 18,
        angle: 90,
        radialSegments: 32,
        tubularSegments: 64
      };

      const optimizedParams = performanceOptimizer.optimizeMeshGeneration(
        originalParams,
        FittingType.ELBOW,
        { qualityLevel: 'draft' }
      );

      // Draft quality should reduce segment counts
      expect(optimizedParams.radialSegments).toBeLessThan(originalParams.radialSegments!);
      expect(optimizedParams.tubularSegments).toBeLessThan(originalParams.tubularSegments!);
      expect(optimizedParams.radialSegments).toBeGreaterThanOrEqual(8);
      expect(optimizedParams.tubularSegments).toBeGreaterThanOrEqual(16);
    });

    test('should optimize parameters for ultra quality', () => {
      const originalParams: ElbowParams = {
        material: 'galvanized_steel',
        gauge: '24',
        diameter: 12,
        bendRadius: 18,
        angle: 90,
        radialSegments: 32,
        tubularSegments: 64
      };

      const optimizedParams = performanceOptimizer.optimizeMeshGeneration(
        originalParams,
        FittingType.ELBOW,
        { qualityLevel: 'ultra' }
      );

      // Ultra quality should increase segment counts
      expect(optimizedParams.radialSegments).toBeGreaterThan(originalParams.radialSegments!);
      expect(optimizedParams.tubularSegments).toBeGreaterThan(originalParams.tubularSegments!);
    });

    test('should optimize based on diameter size', () => {
      const smallDiameterParams: ElbowParams = {
        material: 'galvanized_steel',
        gauge: '24',
        diameter: 4, // Small diameter
        bendRadius: 6,
        angle: 90,
        radialSegments: 32,
        tubularSegments: 64
      };

      const largeDiameterParams: ElbowParams = {
        material: 'galvanized_steel',
        gauge: '24',
        diameter: 48, // Large diameter
        bendRadius: 72,
        angle: 90,
        radialSegments: 32,
        tubularSegments: 64
      };

      const smallOptimized = performanceOptimizer.optimizeMeshGeneration(
        smallDiameterParams,
        FittingType.ELBOW,
        { qualityLevel: 'standard' }
      );

      const largeOptimized = performanceOptimizer.optimizeMeshGeneration(
        largeDiameterParams,
        FittingType.ELBOW,
        { qualityLevel: 'standard' }
      );

      // Small diameter should have fewer segments than large diameter
      expect(smallOptimized.radialSegments).toBeLessThan(largeOptimized.radialSegments!);
    });
  });

  describe('Mesh Optimization', () => {
    test('should optimize mesh geometry', async () => {
      const params: ElbowParams = {
        material: 'galvanized_steel',
        gauge: '24',
        diameter: 12,
        bendRadius: 18,
        angle: 90
      };

      const result = await fittingFactory.generateFitting(FittingType.ELBOW, params);
      const originalVertexCount = result.mesh.geometry.attributes.position.count;

      const optimizedMesh = performanceOptimizer.optimizeMesh(result.mesh, {
        targetVertexCount: Math.floor(originalVertexCount * 0.7),
        enableGeometryMerging: true
      });

      const optimizedVertexCount = optimizedMesh.geometry.attributes.position.count;
      expect(optimizedVertexCount).toBeLessThanOrEqual(originalVertexCount);
    });

    test('should create LOD mesh when enabled', async () => {
      const params: ElbowParams = {
        material: 'galvanized_steel',
        gauge: '24',
        diameter: 12,
        bendRadius: 18,
        angle: 90
      };

      const result = await fittingFactory.generateFitting(FittingType.ELBOW, params);
      
      const lodMesh = performanceOptimizer.optimizeMesh(result.mesh, {
        enableLOD: true
      });

      // LOD mesh should be created (different type)
      expect(lodMesh).toBeDefined();
      expect(lodMesh.type).toBe('LOD');
    });

    test('should merge vertices when enabled', async () => {
      const params: ElbowParams = {
        material: 'galvanized_steel',
        gauge: '24',
        diameter: 12,
        bendRadius: 18,
        angle: 90
      };

      const result = await fittingFactory.generateFitting(FittingType.ELBOW, params);
      const originalVertexCount = result.mesh.geometry.attributes.position.count;

      const optimizedMesh = performanceOptimizer.optimizeMesh(result.mesh, {
        enableGeometryMerging: true
      });

      // Vertex merging might reduce vertex count (depends on geometry)
      const optimizedVertexCount = optimizedMesh.geometry.attributes.position.count;
      expect(optimizedVertexCount).toBeLessThanOrEqual(originalVertexCount);
    });
  });

  describe('Performance Metrics', () => {
    test('should calculate accurate performance metrics', async () => {
      const params: ElbowParams = {
        material: 'galvanized_steel',
        gauge: '24',
        diameter: 12,
        bendRadius: 18,
        angle: 90
      };

      const result = await fittingFactory.generateFitting(FittingType.ELBOW, params);
      const metrics = performanceOptimizer.calculateMetrics(result.mesh, 100);

      expect(metrics.generationTime).toBe(100);
      expect(metrics.vertexCount).toBeGreaterThan(0);
      expect(metrics.triangleCount).toBeGreaterThan(0);
      expect(metrics.memoryUsage).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(metrics.optimizationLevel);
    });

    test('should estimate memory usage correctly', async () => {
      const smallParams: ElbowParams = {
        material: 'galvanized_steel',
        gauge: '24',
        diameter: 6,
        bendRadius: 9,
        angle: 90,
        radialSegments: 16,
        tubularSegments: 32
      };

      const largeParams: ElbowParams = {
        material: 'galvanized_steel',
        gauge: '24',
        diameter: 24,
        bendRadius: 36,
        angle: 90,
        radialSegments: 64,
        tubularSegments: 128
      };

      const smallResult = await fittingFactory.generateFitting(FittingType.ELBOW, smallParams);
      const largeResult = await fittingFactory.generateFitting(FittingType.ELBOW, largeParams);

      const smallMetrics = performanceOptimizer.calculateMetrics(smallResult.mesh, 50);
      const largeMetrics = performanceOptimizer.calculateMetrics(largeResult.mesh, 200);

      // Large mesh should use more memory
      expect(largeMetrics.memoryUsage).toBeGreaterThan(smallMetrics.memoryUsage);
      expect(largeMetrics.vertexCount).toBeGreaterThan(smallMetrics.vertexCount);
    });
  });

  describe('Factory Integration', () => {
    test('should generate optimized fitting with quality levels', async () => {
      const params: ElbowParams = {
        material: 'galvanized_steel',
        gauge: '24',
        diameter: 12,
        bendRadius: 18,
        angle: 90
      };

      const draftResult = await fittingFactory.generateOptimizedFitting(
        FittingType.ELBOW,
        params,
        'draft'
      );

      const ultraResult = await fittingFactory.generateOptimizedFitting(
        FittingType.ELBOW,
        params,
        'ultra'
      );

      expect(draftResult.performanceMetrics).toBeDefined();
      expect(ultraResult.performanceMetrics).toBeDefined();

      // Draft should have fewer vertices than ultra
      expect(draftResult.performanceMetrics.vertexCount).toBeLessThan(
        ultraResult.performanceMetrics.vertexCount
      );
    });

    test('should provide performance statistics', () => {
      const stats = fittingFactory.getPerformanceStats();
      
      expect(stats).toHaveProperty('geometries');
      expect(stats).toHaveProperty('materials');
      expect(stats).toHaveProperty('instances');
      expect(typeof stats.geometries).toBe('number');
      expect(typeof stats.materials).toBe('number');
      expect(typeof stats.instances).toBe('number');
    });

    test('should clear performance caches', () => {
      fittingFactory.clearPerformanceCaches();
      const stats = fittingFactory.getPerformanceStats();
      
      expect(stats.geometries).toBe(0);
      expect(stats.materials).toBe(0);
      expect(stats.instances).toBe(0);
    });
  });

  describe('Performance Benchmarks', () => {
    test('should generate fittings within performance thresholds', async () => {
      const testCases = [
        { diameter: 6, expectedTime: 200 },
        { diameter: 12, expectedTime: 300 },
        { diameter: 24, expectedTime: 500 },
        { diameter: 48, expectedTime: 1000 }
      ];

      for (const testCase of testCases) {
        const params: ElbowParams = {
          material: 'galvanized_steel',
          gauge: '24',
          diameter: testCase.diameter,
          bendRadius: testCase.diameter * 1.5,
          angle: 90
        };

        const startTime = Date.now();
        const result = await fittingFactory.generateOptimizedFitting(
          FittingType.ELBOW,
          params,
          'standard'
        );
        const endTime = Date.now();
        const actualTime = endTime - startTime;

        expect(result).toBeDefined();
        expect(result.performanceMetrics).toBeDefined();
        expect(actualTime).toBeGreaterThan(0);
        expect(actualTime).toBeLessThan(testCase.expectedTime);
      }
    });

    test('should handle memory efficiently for multiple fittings', async () => {
      const fittingCount = 10;
      const results = [];

      for (let i = 0; i < fittingCount; i++) {
        const params: ElbowParams = {
          material: 'galvanized_steel',
          gauge: '24',
          diameter: 12 + i,
          bendRadius: 18 + i,
          angle: 90
        };

        const result = await fittingFactory.generateOptimizedFitting(
          FittingType.ELBOW,
          params,
          'standard'
        );

        results.push(result);
      }

      // All fittings should be generated successfully
      expect(results).toHaveLength(fittingCount);
      results.forEach(result => {
        expect(result.performanceMetrics.memoryUsage).toBeLessThan(10); // Less than 10MB each
      });
    });
  });
});
