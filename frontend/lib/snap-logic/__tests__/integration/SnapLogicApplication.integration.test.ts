/**
 * Snap Logic Application Integration Tests
 * SizeWise Suite - Architectural Refactoring Priority Group
 * 
 * Integration tests for the complete refactored architecture
 * ensuring all components work together correctly.
 * 
 * @fileoverview Integration tests for snap logic application
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import { SnapLogicApplication, SnapLogicApplicationFactory } from '../../application/SnapLogicApplication';
import { SizeWiseSnapLogicSuite } from '../../refactored-index';
import { SnapPointType, SnapPriority, DrawingToolType, DrawingMode } from '../../core/interfaces';
import { Point2D } from '@/types/air-duct-sizer';

describe('SnapLogicApplication Integration', () => {
  let application: SnapLogicApplication;

  beforeEach(async () => {
    application = SnapLogicApplicationFactory.createForTesting();
    await application.initialize();
    await application.start();
  });

  afterEach(async () => {
    if (application) {
      await application.dispose();
    }
  });

  describe('Service Integration', () => {
    it('should integrate snap detection and drawing services', async () => {
      const snapService = application.getSnapDetectionService();
      const drawingService = application.getDrawingService();

      // Add a snap point
      const snapPoint = {
        id: 'integration-snap-1',
        type: SnapPointType.ENDPOINT,
        position: { x: 100, y: 100 },
        priority: SnapPriority.HIGH,
        elementId: 'element-1',
        elementType: 'centerline',
        isActive: true
      };

      await snapService.addSnapPoint(snapPoint);

      // Start drawing near the snap point
      const startPoint: Point2D = { x: 105, y: 105 };
      const drawingResult = await drawingService.startDrawing(
        startPoint,
        DrawingToolType.PENCIL,
        DrawingMode.CONTINUOUS
      );

      expect(drawingResult.success).toBe(true);

      // Verify snap detection works during drawing
      const snapResult = await snapService.findClosestSnapPoint(startPoint);
      expect(snapResult.isSnapped).toBe(true);
      expect(snapResult.snapPoint?.id).toBe(snapPoint.id);
    });

    it('should handle configuration changes across services', async () => {
      const configService = application.getConfigurationService();
      const snapService = application.getSnapDetectionService();

      // Update snap threshold through configuration
      await configService.set('snap.threshold', 15);
      await snapService.updateConfig({ snapThreshold: 15 });

      const config = await snapService.getConfig();
      expect(config.snapThreshold).toBe(15);
    });

    it('should provide health status for all services', async () => {
      const healthCheck = application.getHealthCheck();
      const health = await healthCheck.check();

      expect(health.status).toBe('healthy');
      expect(health.name).toBe('SnapLogicApplication');
      expect(health.data).toBeDefined();
    });
  });

  describe('Event Bus Integration', () => {
    it('should handle events between services', async () => {
      const eventBus = application.getEventBus();
      let eventReceived = false;

      // Subscribe to events
      eventBus.subscribe('test_event', () => {
        eventReceived = true;
      });

      // Publish event
      await eventBus.publish('test_event', { message: 'test' });

      expect(eventReceived).toBe(true);
    });
  });

  describe('Dependency Injection Integration', () => {
    it('should resolve all services through container', async () => {
      const container = application.getContainer();

      expect(container.isRegistered('snapDetectionService')).toBe(true);
      expect(container.isRegistered('drawingService')).toBe(true);
      expect(container.isRegistered('configurationService')).toBe(true);

      const snapService = container.tryResolve('snapDetectionService');
      const drawingService = container.tryResolve('drawingService');

      expect(snapService).toBeDefined();
      expect(drawingService).toBeDefined();
    });

    it('should maintain service statistics', async () => {
      const stats = application.getStatistics();

      expect(stats.status).toBeDefined();
      expect(stats.containerStats).toBeDefined();
      expect(stats.configMetadata).toBeDefined();
    });
  });
});

describe('SizeWiseSnapLogicSuite Integration', () => {
  let suite: SizeWiseSnapLogicSuite;

  beforeEach(async () => {
    suite = new SizeWiseSnapLogicSuite({
      enableSnapDetection: true,
      enableDrawing: true,
      enablePerformanceMonitoring: true,
      enableDebugMode: false
    });
    await suite.initialize();
  });

  afterEach(async () => {
    if (suite) {
      await suite.dispose();
    }
  });

  describe('Complete Workflow Integration', () => {
    it('should support complete snap and draw workflow', async () => {
      const snapService = suite.getSnapDetection();
      const drawingService = suite.getDrawing();

      // 1. Add snap points
      const snapPoint = {
        id: 'workflow-snap-1',
        type: SnapPointType.ENDPOINT,
        position: { x: 50, y: 50 },
        priority: SnapPriority.HIGH,
        elementId: 'element-1',
        elementType: 'centerline',
        isActive: true
      };

      await snapService.addSnapPoint(snapPoint);

      // 2. Start drawing
      const startResult = await drawingService.startDrawing(
        { x: 52, y: 52 },
        DrawingToolType.PENCIL
      );
      expect(startResult.success).toBe(true);

      // 3. Add points to drawing
      const addResult = await drawingService.addPoint({ x: 100, y: 100 });
      expect(addResult.success).toBe(true);

      // 4. Complete drawing
      const completeResult = await drawingService.completeDrawing();
      expect(completeResult.success).toBe(true);
      expect(completeResult.centerlineId).toBeDefined();

      // 5. Verify centerline was created
      const centerlines = await drawingService.getAllCenterlines();
      expect(centerlines.length).toBe(1);
      expect(centerlines[0].id).toBe(completeResult.centerlineId);
    });

    it('should maintain performance during complex operations', async () => {
      const snapService = suite.getSnapDetection();

      // Add multiple snap points
      const snapPoints = Array.from({ length: 100 }, (_, i) => ({
        id: `perf-snap-${i}`,
        type: SnapPointType.GRID,
        position: { x: i * 10, y: i * 10 },
        priority: SnapPriority.MEDIUM,
        elementId: `element-${i}`,
        elementType: 'grid',
        isActive: true
      }));

      const startTime = performance.now();

      for (const snapPoint of snapPoints) {
        await snapService.addSnapPoint(snapPoint);
      }

      const addTime = performance.now() - startTime;

      // Test detection performance
      const detectionStartTime = performance.now();
      const result = await snapService.findClosestSnapPoint({ x: 250, y: 250 });
      const detectionTime = performance.now() - detectionStartTime;

      expect(result.isSnapped).toBe(true);
      expect(addTime).toBeLessThan(1000); // Should add 100 points in under 1 second
      expect(detectionTime).toBeLessThan(50); // Should detect in under 50ms
    });

    it('should handle error scenarios gracefully', async () => {
      const drawingService = suite.getDrawing();

      // Try to complete drawing without starting
      const result = await drawingService.completeDrawing();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Try to add point without starting drawing
      const addResult = await drawingService.addPoint({ x: 100, y: 100 });
      expect(addResult.success).toBe(false);
    });
  });

  describe('Configuration Integration', () => {
    it('should apply configuration changes across all services', async () => {
      const configService = suite.getConfiguration();
      const snapService = suite.getSnapDetection();

      // Update configuration
      await configService.set('snap.enabled', false);
      await snapService.setEnabled(false);

      // Verify configuration is applied
      expect(await snapService.isEnabled()).toBe(false);

      // Test that snap detection is disabled
      await snapService.addSnapPoint({
        id: 'config-test-snap',
        type: SnapPointType.ENDPOINT,
        position: { x: 100, y: 100 },
        priority: SnapPriority.HIGH,
        elementId: 'element-1',
        elementType: 'centerline',
        isActive: true
      });

      const result = await snapService.findClosestSnapPoint({ x: 105, y: 105 });
      expect(result.isSnapped).toBe(false);
    });
  });

  describe('Health and Monitoring Integration', () => {
    it('should provide comprehensive health status', async () => {
      const health = await suite.getHealthStatus();

      expect(health.status).toBe('healthy');
      expect(health.duration).toBeGreaterThan(0);
      expect(health.timestamp).toBeGreaterThan(0);
    });

    it('should provide system statistics', async () => {
      const stats = suite.getStatistics();

      expect(stats.status).toBeDefined();
      expect(stats.containerStats).toBeDefined();
      expect(stats.configMetadata).toBeDefined();
    });
  });
});
