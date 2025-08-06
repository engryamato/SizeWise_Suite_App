/**
 * Snap Detection Service Tests
 * SizeWise Suite - Architectural Refactoring Priority Group
 * 
 * Comprehensive test suite for the refactored SnapDetectionService
 * ensuring functionality, performance, and reliability.
 * 
 * @fileoverview Snap detection service tests
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import { SnapDetectionService } from '../services/SnapDetectionService';
import {
  ISnapPoint,
  ISnapResult,
  SnapPointType,
  SnapPriority,
  ISpatialQueryOptions
} from '../core/interfaces';
import { Point2D } from '@/types/air-duct-sizer';

// Mock implementations for testing
class MockCache {
  private cache = new Map<string, any>();

  async get(key: string): Promise<any> {
    return this.cache.get(key) || null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.cache.set(key, value);
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async size(): Promise<number> {
    return this.cache.size;
  }
}

class MockLogger {
  debug = jest.fn();
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
}

describe('SnapDetectionService', () => {
  let service: SnapDetectionService;
  let mockCache: MockCache;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockCache = new MockCache();
    mockLogger = new MockLogger();
    service = new SnapDetectionService(
      undefined, // spatial index
      mockCache as any,
      mockLogger as any
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', async () => {
      const config = await service.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.snapThreshold).toBe(10);
      expect(config.magneticThreshold).toBe(20);
    });

    it('should be enabled by default', async () => {
      const enabled = await service.isEnabled();
      expect(enabled).toBe(true);
    });
  });

  describe('Snap Point Management', () => {
    const testSnapPoint: ISnapPoint = {
      id: 'test-snap-1',
      type: SnapPointType.ENDPOINT,
      position: { x: 100, y: 100 },
      priority: SnapPriority.HIGH,
      elementId: 'element-1',
      elementType: 'centerline',
      isActive: true
    };

    it('should add snap point successfully', async () => {
      await service.addSnapPoint(testSnapPoint);
      
      const retrievedPoint = await service.getSnapPoint(testSnapPoint.id);
      expect(retrievedPoint).toEqual(testSnapPoint);
    });

    it('should remove snap point successfully', async () => {
      await service.addSnapPoint(testSnapPoint);
      
      const removed = await service.removeSnapPoint(testSnapPoint.id);
      expect(removed).toBe(true);
      
      const retrievedPoint = await service.getSnapPoint(testSnapPoint.id);
      expect(retrievedPoint).toBeNull();
    });

    it('should update snap point successfully', async () => {
      await service.addSnapPoint(testSnapPoint);
      
      const updates = { isActive: false };
      const updated = await service.updateSnapPoint(testSnapPoint.id, updates);
      expect(updated).toBe(true);
      
      const retrievedPoint = await service.getSnapPoint(testSnapPoint.id);
      expect(retrievedPoint?.isActive).toBe(false);
    });

    it('should return all snap points', async () => {
      await service.addSnapPoint(testSnapPoint);
      await service.addSnapPoint({
        ...testSnapPoint,
        id: 'test-snap-2',
        position: { x: 200, y: 200 }
      });
      
      const allPoints = await service.getAllSnapPoints();
      expect(allPoints).toHaveLength(2);
    });

    it('should clear all snap points', async () => {
      await service.addSnapPoint(testSnapPoint);
      await service.clearSnapPoints();
      
      const allPoints = await service.getAllSnapPoints();
      expect(allPoints).toHaveLength(0);
    });
  });

  describe('Snap Detection', () => {
    const snapPoint: ISnapPoint = {
      id: 'snap-1',
      type: SnapPointType.ENDPOINT,
      position: { x: 100, y: 100 },
      priority: SnapPriority.HIGH,
      elementId: 'element-1',
      elementType: 'centerline',
      isActive: true
    };

    beforeEach(async () => {
      await service.addSnapPoint(snapPoint);
    });

    it('should detect snap when within threshold', async () => {
      const testPosition: Point2D = { x: 105, y: 105 }; // 5 units away
      
      const result = await service.findClosestSnapPoint(testPosition);
      
      expect(result.isSnapped).toBe(true);
      expect(result.snapPoint).toEqual(snapPoint);
      expect(result.distance).toBeCloseTo(7.07, 2); // sqrt(5^2 + 5^2)
    });

    it('should not detect snap when outside threshold', async () => {
      const testPosition: Point2D = { x: 120, y: 120 }; // 20+ units away
      
      const result = await service.findClosestSnapPoint(testPosition);
      
      expect(result.isSnapped).toBe(false);
      expect(result.snapPoint).toBeNull();
    });

    it('should return original position when no snap detected', async () => {
      const testPosition: Point2D = { x: 200, y: 200 };
      
      const result = await service.findClosestSnapPoint(testPosition);
      
      expect(result.adjustedPosition).toEqual(testPosition);
    });

    it('should respect priority weighting', async () => {
      // Add a lower priority snap point closer to test position
      const lowPriorityPoint: ISnapPoint = {
        id: 'snap-2',
        type: SnapPointType.GRID,
        position: { x: 102, y: 102 },
        priority: SnapPriority.LOW,
        elementId: 'element-2',
        elementType: 'grid',
        isActive: true
      };
      
      await service.addSnapPoint(lowPriorityPoint);
      
      const testPosition: Point2D = { x: 103, y: 103 };
      const result = await service.findClosestSnapPoint(testPosition);
      
      // Should prefer high priority point despite being farther
      expect(result.snapPoint?.id).toBe(snapPoint.id);
    });

    it('should exclude specified types', async () => {
      const testPosition: Point2D = { x: 105, y: 105 };
      const options: ISpatialQueryOptions = {
        excludeTypes: [SnapPointType.ENDPOINT]
      };
      
      const result = await service.findClosestSnapPoint(testPosition, options);
      
      expect(result.isSnapped).toBe(false);
    });

    it('should respect radius filter', async () => {
      const testPosition: Point2D = { x: 105, y: 105 };
      const options: ISpatialQueryOptions = {
        center: testPosition,
        radius: 5 // Smaller than distance to snap point
      };
      
      const result = await service.findClosestSnapPoint(testPosition, options);
      
      expect(result.isSnapped).toBe(false);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', async () => {
      const newConfig = {
        snapThreshold: 15,
        magneticThreshold: 25
      };
      
      await service.updateConfig(newConfig);
      
      const config = await service.getConfig();
      expect(config.snapThreshold).toBe(15);
      expect(config.magneticThreshold).toBe(25);
    });

    it('should enable/disable service', async () => {
      await service.setEnabled(false);
      expect(await service.isEnabled()).toBe(false);
      
      await service.setEnabled(true);
      expect(await service.isEnabled()).toBe(true);
    });

    it('should not detect snaps when disabled', async () => {
      const snapPoint: ISnapPoint = {
        id: 'snap-1',
        type: SnapPointType.ENDPOINT,
        position: { x: 100, y: 100 },
        priority: SnapPriority.HIGH,
        elementId: 'element-1',
        elementType: 'centerline',
        isActive: true
      };
      
      await service.addSnapPoint(snapPoint);
      await service.setEnabled(false);
      
      const testPosition: Point2D = { x: 105, y: 105 };
      const result = await service.findClosestSnapPoint(testPosition);
      
      expect(result.isSnapped).toBe(false);
    });
  });

  describe('Performance and Statistics', () => {
    it('should provide statistics', async () => {
      const snapPoint: ISnapPoint = {
        id: 'snap-1',
        type: SnapPointType.ENDPOINT,
        position: { x: 100, y: 100 },
        priority: SnapPriority.HIGH,
        elementId: 'element-1',
        elementType: 'centerline',
        isActive: true
      };
      
      await service.addSnapPoint(snapPoint);
      
      const stats = await service.getStatistics();
      
      expect(stats.totalSnapPoints).toBe(1);
      expect(stats.activeSnapPoints).toBe(1);
      expect(typeof stats.averageDetectionTime).toBe('number');
      expect(typeof stats.cacheHitRate).toBe('number');
    });

    it('should validate integrity', async () => {
      const snapPoint: ISnapPoint = {
        id: 'snap-1',
        type: SnapPointType.ENDPOINT,
        position: { x: 100, y: 100 },
        priority: SnapPriority.HIGH,
        elementId: 'element-1',
        elementType: 'centerline',
        isActive: true
      };
      
      await service.addSnapPoint(snapPoint);
      
      const validation = await service.validateIntegrity();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should optimize spatial index', async () => {
      await expect(service.optimizeSpatialIndex()).resolves.not.toThrow();
    });
  });

  describe('Caching', () => {
    it('should cache detection results', async () => {
      const snapPoint: ISnapPoint = {
        id: 'snap-1',
        type: SnapPointType.ENDPOINT,
        position: { x: 100, y: 100 },
        priority: SnapPriority.HIGH,
        elementId: 'element-1',
        elementType: 'centerline',
        isActive: true
      };
      
      await service.addSnapPoint(snapPoint);
      
      const testPosition: Point2D = { x: 105, y: 105 };
      
      // First call should miss cache
      await service.findClosestSnapPoint(testPosition);
      
      // Second call should hit cache
      await service.findClosestSnapPoint(testPosition);
      
      // Verify cache was used (simplified check)
      expect(await mockCache.size()).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid snap point gracefully', async () => {
      const invalidPoint = {
        id: '',
        type: SnapPointType.ENDPOINT,
        position: { x: 100, y: 100 },
        priority: SnapPriority.HIGH,
        elementId: 'element-1',
        elementType: 'centerline',
        isActive: true
      } as ISnapPoint;
      
      await expect(service.addSnapPoint(invalidPoint)).resolves.not.toThrow();
    });

    it('should handle removal of non-existent snap point', async () => {
      const removed = await service.removeSnapPoint('non-existent');
      expect(removed).toBe(false);
    });

    it('should handle update of non-existent snap point', async () => {
      const updated = await service.updateSnapPoint('non-existent', { isActive: false });
      expect(updated).toBe(false);
    });
  });
});
