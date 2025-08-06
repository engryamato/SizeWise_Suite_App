/**
 * Performance Regression Tests
 * SizeWise Suite - Architectural Refactoring Priority Group
 * 
 * Performance benchmarks to ensure the refactored architecture
 * doesn't introduce performance regressions compared to legacy implementation.
 * 
 * @fileoverview Performance regression tests
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import { SnapDetectionService } from '../../services/SnapDetectionService';
import { DrawingService } from '../../services/DrawingService';
import { SizeWiseSnapLogicSuite } from '../../refactored-index';
import { SnapPointType, SnapPriority, DrawingToolType } from '../../core/interfaces';
import { Point2D } from '@/types/air-duct-sizer';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  SNAP_DETECTION: 10,      // Single snap detection should be under 10ms
  BULK_SNAP_ADD: 1000,     // Adding 1000 snap points should be under 1s
  DRAWING_OPERATION: 5,     // Single drawing operation should be under 5ms
  SYSTEM_INITIALIZATION: 2000, // System init should be under 2s
  MEMORY_USAGE_MB: 50      // Memory usage should be under 50MB for basic operations
};

// Mock implementations for performance testing
class MockCache {
  private cache = new Map<string, any>();
  async get(key: string): Promise<any> { return this.cache.get(key) || null; }
  async set(key: string, value: any): Promise<void> { this.cache.set(key, value); }
  async has(key: string): Promise<boolean> { return this.cache.has(key); }
  async delete(key: string): Promise<boolean> { return this.cache.delete(key); }
  async clear(): Promise<void> { this.cache.clear(); }
  async size(): Promise<number> { return this.cache.size; }
}

class MockLogger {
  debug = jest.fn();
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
}

// Simple memory usage measurement
function getMemoryUsage(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed / 1024 / 1024; // MB
  }
  return 0; // Browser environment
}

// Performance measurement utility
async function measurePerformance<T>(
  operation: () => Promise<T>,
  description: string
): Promise<{ result: T; duration: number; memoryDelta: number }> {
  const startMemory = getMemoryUsage();
  const startTime = performance.now();
  
  const result = await operation();
  
  const endTime = performance.now();
  const endMemory = getMemoryUsage();
  
  const duration = endTime - startTime;
  const memoryDelta = endMemory - startMemory;
  
  console.log(`${description}: ${duration.toFixed(2)}ms, Memory: ${memoryDelta.toFixed(2)}MB`);
  
  return { result, duration, memoryDelta };
}

describe('Performance Regression Tests', () => {
  describe('Snap Detection Performance', () => {
    let service: SnapDetectionService;
    let mockCache: MockCache;
    let mockLogger: MockLogger;

    beforeEach(() => {
      mockCache = new MockCache();
      mockLogger = new MockLogger();
      service = new SnapDetectionService(
        undefined,
        mockCache as any,
        mockLogger as any
      );
    });

    it('should detect snaps within performance threshold', async () => {
      // Add test snap points
      const snapPoints = Array.from({ length: 100 }, (_, i) => ({
        id: `perf-snap-${i}`,
        type: SnapPointType.ENDPOINT,
        position: { x: i * 10, y: i * 10 },
        priority: SnapPriority.HIGH,
        elementId: `element-${i}`,
        elementType: 'centerline',
        isActive: true
      }));

      for (const snapPoint of snapPoints) {
        await service.addSnapPoint(snapPoint);
      }

      // Measure snap detection performance
      const testPosition: Point2D = { x: 250, y: 250 };
      
      const { duration } = await measurePerformance(
        () => service.findClosestSnapPoint(testPosition),
        'Snap Detection (100 points)'
      );

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SNAP_DETECTION);
    });

    it('should add snap points efficiently', async () => {
      const snapPoints = Array.from({ length: 1000 }, (_, i) => ({
        id: `bulk-snap-${i}`,
        type: SnapPointType.GRID,
        position: { x: (i % 100) * 10, y: Math.floor(i / 100) * 10 },
        priority: SnapPriority.MEDIUM,
        elementId: `element-${i}`,
        elementType: 'grid',
        isActive: true
      }));

      const { duration } = await measurePerformance(
        async () => {
          for (const snapPoint of snapPoints) {
            await service.addSnapPoint(snapPoint);
          }
        },
        'Bulk Snap Point Addition (1000 points)'
      );

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_SNAP_ADD);
    });

    it('should maintain performance with spatial optimization', async () => {
      // Add many snap points
      const snapPoints = Array.from({ length: 500 }, (_, i) => ({
        id: `spatial-snap-${i}`,
        type: SnapPointType.CENTERLINE,
        position: { x: Math.random() * 1000, y: Math.random() * 1000 },
        priority: SnapPriority.MEDIUM,
        elementId: `element-${i}`,
        elementType: 'centerline',
        isActive: true
      }));

      for (const snapPoint of snapPoints) {
        await service.addSnapPoint(snapPoint);
      }

      // Optimize spatial index
      await service.optimizeSpatialIndex();

      // Test multiple detections
      const detectionPromises = Array.from({ length: 50 }, (_, i) => 
        service.findClosestSnapPoint({ 
          x: Math.random() * 1000, 
          y: Math.random() * 1000 
        })
      );

      const { duration } = await measurePerformance(
        () => Promise.all(detectionPromises),
        'Batch Snap Detection (50 queries, 500 points)'
      );

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SNAP_DETECTION * 50);
    });
  });

  describe('Drawing Service Performance', () => {
    let drawingService: DrawingService;
    let snapService: SnapDetectionService;

    beforeEach(() => {
      const mockCache = new MockCache();
      const mockLogger = new MockLogger();
      
      snapService = new SnapDetectionService(
        undefined,
        mockCache as any,
        mockLogger as any
      );

      // Mock repository for drawing service
      const mockRepository = {
        get: jest.fn().mockResolvedValue(null),
        getAll: jest.fn().mockResolvedValue([]),
        add: jest.fn().mockResolvedValue('test-id'),
        update: jest.fn().mockResolvedValue(true),
        delete: jest.fn().mockResolvedValue(true),
        exists: jest.fn().mockResolvedValue(false),
        count: jest.fn().mockResolvedValue(0),
        clear: jest.fn().mockResolvedValue(undefined)
      };

      drawingService = new DrawingService(
        snapService,
        mockRepository as any,
        mockLogger as any
      );
    });

    it('should perform drawing operations efficiently', async () => {
      // Start drawing
      const { duration: startDuration } = await measurePerformance(
        () => drawingService.startDrawing({ x: 0, y: 0 }, DrawingToolType.PENCIL),
        'Start Drawing'
      );

      expect(startDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.DRAWING_OPERATION);

      // Add multiple points
      const points: Point2D[] = Array.from({ length: 100 }, (_, i) => ({
        x: i * 5,
        y: Math.sin(i * 0.1) * 50
      }));

      const { duration: addPointsDuration } = await measurePerformance(
        async () => {
          for (const point of points) {
            await drawingService.addPoint(point);
          }
        },
        'Add 100 Drawing Points'
      );

      expect(addPointsDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.DRAWING_OPERATION * 100);

      // Complete drawing
      const { duration: completeDuration } = await measurePerformance(
        () => drawingService.completeDrawing(),
        'Complete Drawing'
      );

      expect(completeDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.DRAWING_OPERATION * 10);
    });

    it('should handle undo/redo operations efficiently', async () => {
      // Perform some drawing operations
      await drawingService.startDrawing({ x: 0, y: 0 });
      
      for (let i = 0; i < 50; i++) {
        await drawingService.addPoint({ x: i * 10, y: i * 10 });
      }

      // Test undo performance
      const { duration: undoDuration } = await measurePerformance(
        async () => {
          for (let i = 0; i < 25; i++) {
            await drawingService.undo();
          }
        },
        'Undo 25 Operations'
      );

      expect(undoDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.DRAWING_OPERATION * 25);

      // Test redo performance
      const { duration: redoDuration } = await measurePerformance(
        async () => {
          for (let i = 0; i < 25; i++) {
            await drawingService.redo();
          }
        },
        'Redo 25 Operations'
      );

      expect(redoDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.DRAWING_OPERATION * 25);
    });
  });

  describe('System Integration Performance', () => {
    it('should initialize system within performance threshold', async () => {
      const { duration, memoryDelta } = await measurePerformance(
        async () => {
          const suite = new SizeWiseSnapLogicSuite({
            enableSnapDetection: true,
            enableDrawing: true,
            enablePerformanceMonitoring: true
          });
          
          await suite.initialize();
          await suite.dispose();
          
          return suite;
        },
        'System Initialization and Disposal'
      );

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SYSTEM_INITIALIZATION);
      expect(memoryDelta).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE_MB);
    });

    it('should handle concurrent operations efficiently', async () => {
      const suite = new SizeWiseSnapLogicSuite();
      await suite.initialize();

      try {
        const snapService = suite.getSnapDetection();
        const drawingService = suite.getDrawing();

        // Concurrent snap point additions and detections
        const concurrentOperations = [
          // Add snap points concurrently
          ...Array.from({ length: 10 }, (_, i) =>
            snapService.addSnapPoint({
              id: `concurrent-snap-${i}`,
              type: SnapPointType.ENDPOINT,
              position: { x: i * 20, y: i * 20 },
              priority: SnapPriority.HIGH,
              elementId: `element-${i}`,
              elementType: 'centerline',
              isActive: true
            })
          ),
          // Perform detections concurrently
          ...Array.from({ length: 10 }, (_, i) =>
            snapService.findClosestSnapPoint({ x: i * 15, y: i * 15 })
          ),
          // Start multiple drawings concurrently
          ...Array.from({ length: 5 }, (_, i) =>
            drawingService.startDrawing({ x: i * 30, y: i * 30 })
              .then(() => drawingService.cancelDrawing())
          )
        ];

        const { duration } = await measurePerformance(
          () => Promise.all(concurrentOperations),
          'Concurrent Operations (25 operations)'
        );

        expect(duration).toBeLessThan(1000); // Should complete within 1 second

      } finally {
        await suite.dispose();
      }
    });

    it('should maintain performance under stress', async () => {
      const suite = new SizeWiseSnapLogicSuite();
      await suite.initialize();

      try {
        const snapService = suite.getSnapDetection();

        // Stress test: Add many snap points and perform many detections
        const stressOperations = async () => {
          // Add 1000 snap points
          for (let i = 0; i < 1000; i++) {
            await snapService.addSnapPoint({
              id: `stress-snap-${i}`,
              type: SnapPointType.GRID,
              position: { 
                x: (i % 50) * 20, 
                y: Math.floor(i / 50) * 20 
              },
              priority: SnapPriority.MEDIUM,
              elementId: `element-${i}`,
              elementType: 'grid',
              isActive: true
            });
          }

          // Perform 500 detections
          const detectionPromises = Array.from({ length: 500 }, (_, i) =>
            snapService.findClosestSnapPoint({
              x: Math.random() * 1000,
              y: Math.random() * 1000
            })
          );

          await Promise.all(detectionPromises);
        };

        const { duration, memoryDelta } = await measurePerformance(
          stressOperations,
          'Stress Test (1000 adds + 500 detections)'
        );

        expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
        expect(memoryDelta).toBeLessThan(100); // Should use less than 100MB additional memory

      } finally {
        await suite.dispose();
      }
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not leak memory during normal operations', async () => {
      const initialMemory = getMemoryUsage();
      
      // Perform multiple cycles of operations
      for (let cycle = 0; cycle < 5; cycle++) {
        const suite = new SizeWiseSnapLogicSuite();
        await suite.initialize();
        
        const snapService = suite.getSnapDetection();
        
        // Add and remove snap points
        for (let i = 0; i < 100; i++) {
          await snapService.addSnapPoint({
            id: `memory-test-${cycle}-${i}`,
            type: SnapPointType.ENDPOINT,
            position: { x: i, y: i },
            priority: SnapPriority.MEDIUM,
            elementId: `element-${i}`,
            elementType: 'centerline',
            isActive: true
          });
        }
        
        await snapService.clearSnapPoints();
        await suite.dispose();
      }

      const finalMemory = getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      console.log(`Memory increase after 5 cycles: ${memoryIncrease.toFixed(2)}MB`);
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10);
    });
  });
});
