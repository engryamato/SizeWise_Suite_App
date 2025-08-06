/**
 * Backward Compatibility Tests
 * SizeWise Suite - Architectural Refactoring Priority Group
 * 
 * Tests to ensure that existing code using legacy exports continues
 * to function during the migration period without breaking changes.
 * 
 * @fileoverview Backward compatibility tests
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

// Test both legacy and new exports
import LegacySuite, { 
  SnapLogicManager,
  SnapLogicSystem,
  CenterlineDrawingManager,
  VERSION as LEGACY_VERSION
} from '../../index';

import RefactoredSuite, {
  SizeWiseSnapLogicSuite,
  SnapLogicFacade,
  SnapLogicMigrationHelper,
  VERSION as REFACTORED_VERSION,
  REFACTORED_FEATURES
} from '../../refactored-index';

import { Point2D } from '@/types/air-duct-sizer';

describe('Backward Compatibility', () => {
  describe('Legacy Export Availability', () => {
    it('should export all legacy components', () => {
      // Verify legacy classes are still available
      expect(SnapLogicManager).toBeDefined();
      expect(SnapLogicSystem).toBeDefined();
      expect(CenterlineDrawingManager).toBeDefined();
      expect(LegacySuite).toBeDefined();
      
      // Verify legacy version is available
      expect(LEGACY_VERSION).toBeDefined();
      expect(typeof LEGACY_VERSION).toBe('string');
    });

    it('should export all refactored components', () => {
      // Verify refactored classes are available
      expect(SizeWiseSnapLogicSuite).toBeDefined();
      expect(SnapLogicFacade).toBeDefined();
      expect(SnapLogicMigrationHelper).toBeDefined();
      expect(RefactoredSuite).toBeDefined();
      
      // Verify refactored version and features
      expect(REFACTORED_VERSION).toBeDefined();
      expect(REFACTORED_FEATURES).toBeDefined();
      expect(typeof REFACTORED_VERSION).toBe('string');
    });

    it('should maintain version compatibility', () => {
      // Both versions should be defined and different
      expect(LEGACY_VERSION).toBeDefined();
      expect(REFACTORED_VERSION).toBeDefined();
      expect(REFACTORED_VERSION).not.toBe(LEGACY_VERSION);
      
      // Refactored version should indicate it's refactored
      expect(REFACTORED_VERSION).toContain('refactored');
    });
  });

  describe('Legacy API Compatibility', () => {
    let legacySuite: any;

    beforeEach(() => {
      // Initialize legacy suite
      legacySuite = new LegacySuite();
    });

    afterEach(() => {
      if (legacySuite && typeof legacySuite.dispose === 'function') {
        legacySuite.dispose();
      }
    });

    it('should maintain legacy constructor signature', () => {
      expect(() => new LegacySuite()).not.toThrow();
      expect(() => new LegacySuite({})).not.toThrow();
    });

    it('should maintain legacy method signatures', () => {
      // Test that legacy methods exist and are callable
      expect(typeof legacySuite.getSnapLogicSystem).toBe('function');
      expect(typeof legacySuite.getPerformanceMonitor).toBe('function');
      expect(typeof legacySuite.getErrorHandler).toBe('function');
      expect(typeof legacySuite.dispose).toBe('function');
    });

    it('should return expected legacy objects', () => {
      const snapLogicSystem = legacySuite.getSnapLogicSystem();
      const performanceMonitor = legacySuite.getPerformanceMonitor();
      const errorHandler = legacySuite.getErrorHandler();

      expect(snapLogicSystem).toBeDefined();
      expect(performanceMonitor).toBeDefined();
      expect(errorHandler).toBeDefined();
    });
  });

  describe('Migration Helper Functionality', () => {
    it('should provide migration status', () => {
      const migrationStatus = SnapLogicMigrationHelper.getMigrationStatus();
      
      expect(migrationStatus).toBeDefined();
      expect(migrationStatus.isLegacyInUse).toBeDefined();
      expect(migrationStatus.recommendations).toBeDefined();
      expect(migrationStatus.migrationSteps).toBeDefined();
      
      expect(Array.isArray(migrationStatus.recommendations)).toBe(true);
      expect(Array.isArray(migrationStatus.migrationSteps)).toBe(true);
    });

    it('should migrate from legacy configuration', () => {
      const legacyConfig = {
        enablePerformanceMonitoring: true,
        debugMode: false,
        logLevel: 'info'
      };

      const migratedApp = SnapLogicMigrationHelper.migrateFromLegacy(legacyConfig);
      
      expect(migratedApp).toBeDefined();
      expect(migratedApp).toBeInstanceOf(SizeWiseSnapLogicSuite);
    });
  });

  describe('Facade Pattern Compatibility', () => {
    let facade: SnapLogicFacade;

    beforeEach(async () => {
      facade = new SnapLogicFacade({
        enableSnapDetection: true,
        enableDrawing: true
      });
      await facade.initialize();
    });

    afterEach(async () => {
      if (facade) {
        await facade.dispose();
      }
    });

    it('should provide simplified interface', () => {
      expect(typeof facade.getSnapDetection).toBe('function');
      expect(typeof facade.getDrawing).toBe('function');
      expect(typeof facade.getConfiguration).toBe('function');
      expect(typeof facade.getEventBus).toBe('function');
      expect(typeof facade.getHealthStatus).toBe('function');
      expect(typeof facade.getStatistics).toBe('function');
    });

    it('should work with legacy-style usage patterns', async () => {
      // Test legacy-style snap detection usage
      const snapService = facade.getSnapDetection();
      
      // Add snap point (legacy style)
      await snapService.addSnapPoint({
        id: 'legacy-test-snap',
        type: 'endpoint' as any,
        position: { x: 100, y: 100 },
        priority: 2 as any,
        elementId: 'element-1',
        elementType: 'centerline',
        isActive: true
      });

      // Find snap point (legacy style)
      const result = await snapService.findClosestSnapPoint({ x: 105, y: 105 });
      
      expect(result.isSnapped).toBe(true);
      expect(result.snapPoint).toBeDefined();
    });

    it('should handle legacy error patterns', async () => {
      const drawingService = facade.getDrawing();
      
      // Test legacy error handling
      const result = await drawingService.completeDrawing();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Dual Export System', () => {
    it('should allow both legacy and refactored usage simultaneously', async () => {
      // Initialize both systems
      const legacySuite = new LegacySuite();
      const refactoredSuite = new RefactoredSuite();
      
      try {
        await refactoredSuite.initialize();
        
        // Both should be functional
        expect(legacySuite.getSnapLogicSystem()).toBeDefined();
        expect(refactoredSuite.getSnapDetection()).toBeDefined();
        
        // Both should provide similar functionality
        const legacySystem = legacySuite.getSnapLogicSystem();
        const refactoredSnap = refactoredSuite.getSnapDetection();
        
        expect(typeof legacySystem.addSnapPoint).toBe('function');
        expect(typeof refactoredSnap.addSnapPoint).toBe('function');
        
      } finally {
        legacySuite.dispose();
        await refactoredSuite.dispose();
      }
    });

    it('should maintain consistent data structures', async () => {
      const refactoredSuite = new RefactoredSuite();
      await refactoredSuite.initialize();
      
      try {
        const snapService = refactoredSuite.getSnapDetection();
        
        // Test that data structures are compatible
        const snapPoint = {
          id: 'compatibility-test',
          type: 'endpoint' as any,
          position: { x: 50, y: 50 },
          priority: 1 as any,
          elementId: 'element-1',
          elementType: 'centerline',
          isActive: true
        };
        
        await snapService.addSnapPoint(snapPoint);
        const retrieved = await snapService.getSnapPoint(snapPoint.id);
        
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(snapPoint.id);
        expect(retrieved?.position).toEqual(snapPoint.position);
        
      } finally {
        await refactoredSuite.dispose();
      }
    });
  });

  describe('Configuration Compatibility', () => {
    it('should accept legacy configuration formats', () => {
      // Test legacy configuration format
      const legacyConfig = {
        snapThreshold: 10,
        magneticThreshold: 20,
        enableDebugMode: false,
        performanceOptimization: true
      };

      expect(() => new LegacySuite(legacyConfig)).not.toThrow();
    });

    it('should accept refactored configuration formats', () => {
      // Test refactored configuration format
      const refactoredConfig = {
        enableSnapDetection: true,
        enableDrawing: true,
        enablePerformanceMonitoring: true,
        enableDebugMode: false,
        logLevel: 'info' as const
      };

      expect(() => new RefactoredSuite(refactoredConfig)).not.toThrow();
    });

    it('should provide configuration migration', () => {
      const legacyConfig = {
        snapThreshold: 15,
        debugMode: true,
        performanceOptimization: false
      };

      const migratedApp = SnapLogicMigrationHelper.migrateFromLegacy(legacyConfig);
      expect(migratedApp).toBeDefined();
    });
  });

  describe('Event System Compatibility', () => {
    it('should maintain event compatibility during transition', async () => {
      const refactoredSuite = new RefactoredSuite();
      await refactoredSuite.initialize();
      
      try {
        const eventBus = refactoredSuite.getEventBus();
        let eventReceived = false;
        
        // Test legacy-style event handling
        eventBus.subscribe('legacy_event', () => {
          eventReceived = true;
        });
        
        await eventBus.publish('legacy_event', { data: 'test' });
        expect(eventReceived).toBe(true);
        
      } finally {
        await refactoredSuite.dispose();
      }
    });
  });

  describe('Performance Compatibility', () => {
    it('should maintain similar performance characteristics', async () => {
      const legacySuite = new LegacySuite();
      const refactoredSuite = new RefactoredSuite();
      
      try {
        await refactoredSuite.initialize();
        
        // Test basic operation performance
        const startTime = performance.now();
        
        // Perform similar operations on both systems
        const legacySystem = legacySuite.getSnapLogicSystem();
        const refactoredSnap = refactoredSuite.getSnapDetection();
        
        // Add snap points to both
        const snapPoint = {
          id: 'perf-test',
          type: 'endpoint' as any,
          position: { x: 100, y: 100 },
          priority: 1 as any,
          elementId: 'element-1',
          elementType: 'centerline',
          isActive: true
        };
        
        if (typeof legacySystem.addSnapPoint === 'function') {
          await legacySystem.addSnapPoint(snapPoint);
        }
        await refactoredSnap.addSnapPoint(snapPoint);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Should complete quickly (under 100ms)
        expect(duration).toBeLessThan(100);
        
      } finally {
        legacySuite.dispose();
        await refactoredSuite.dispose();
      }
    });
  });
});
