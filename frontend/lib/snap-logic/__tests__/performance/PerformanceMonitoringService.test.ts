/**
 * Performance Monitoring Service Tests
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * Comprehensive test suite for real-time metrics collection, performance alerting,
 * budget enforcement, and monitoring dashboards.
 * 
 * @fileoverview Performance monitoring service tests
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import {
  PerformanceMonitoringService,
  SnapLogicPerformanceCollector,
  AlertManager,
  BudgetManager
} from '../../services/PerformanceMonitoringService';
import {
  PerformanceMetricType,
  AlertSeverity,
  BudgetType,
  DashboardType,
  GenerationStatus
} from '../../core/interfaces/IPerformanceMonitoringService';

// Mock logger
class MockLogger {
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
  debug = jest.fn();
}

describe('PerformanceMonitoringService', () => {
  let service: PerformanceMonitoringService;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    service = new PerformanceMonitoringService(mockLogger as any);
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', async () => {
      await service.initialize();

      expect(mockLogger.info).toHaveBeenCalledWith('Performance monitoring service initialized successfully');
    });

    it('should initialize with custom configuration', async () => {
      const config = {
        enabled: true,
        collectionInterval: 60000,
        retentionPeriod: 7,
        maxMetricsPerBatch: 50,
        enableRealTimeAlerts: true,
        enableBudgetEnforcement: true,
        defaultDashboards: [DashboardType.OVERVIEW],
        alertChannels: []
      };

      await service.initialize(config);

      expect(mockLogger.info).toHaveBeenCalledWith('Performance monitoring service initialized successfully');
    });
  });

  describe('Metric Recording', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should record single metric', async () => {
      const metric = {
        type: PerformanceMetricType.RESPONSE_TIME,
        value: 150,
        unit: 'ms',
        source: 'test-service',
        tags: { operation: 'test' }
      };

      const metricId = await service.recordMetric(metric);

      expect(metricId).toBeDefined();
      expect(metricId).toMatch(/^metric_\d+_[a-z0-9]+$/);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Recorded metric: response_time = 150ms')
      );
    });

    it('should record multiple metrics', async () => {
      const metrics = [
        {
          type: PerformanceMetricType.RESPONSE_TIME,
          value: 150,
          unit: 'ms',
          source: 'test-service',
          tags: { operation: 'test1' }
        },
        {
          type: PerformanceMetricType.THROUGHPUT,
          value: 100,
          unit: 'req/s',
          source: 'test-service',
          tags: { operation: 'test2' }
        }
      ];

      const metricIds = await service.recordMetrics(metrics);

      expect(metricIds).toHaveLength(2);
      expect(metricIds.every(id => id.match(/^metric_\d+_[a-z0-9]+$/))).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith('Recorded 2 metrics');
    });

    it('should get metrics by type and time range', async () => {
      const metric = {
        type: PerformanceMetricType.RESPONSE_TIME,
        value: 150,
        unit: 'ms',
        source: 'test-service',
        tags: { operation: 'test' }
      };

      await service.recordMetric(metric);

      const timeRange = {
        start: new Date(Date.now() - 60000),
        end: new Date()
      };

      const metrics = await service.getMetrics(PerformanceMetricType.RESPONSE_TIME, timeRange);

      expect(metrics).toHaveLength(1);
      expect(metrics[0].type).toBe(PerformanceMetricType.RESPONSE_TIME);
      expect(metrics[0].value).toBe(150);
    });

    it('should get metric summary', async () => {
      const metrics = [
        { type: PerformanceMetricType.RESPONSE_TIME, value: 100, unit: 'ms', source: 'test', tags: {} },
        { type: PerformanceMetricType.RESPONSE_TIME, value: 150, unit: 'ms', source: 'test', tags: {} },
        { type: PerformanceMetricType.RESPONSE_TIME, value: 200, unit: 'ms', source: 'test', tags: {} }
      ];

      for (const metric of metrics) {
        await service.recordMetric(metric);
      }

      const timeRange = {
        start: new Date(Date.now() - 60000),
        end: new Date()
      };

      const summary = await service.getMetricSummary(PerformanceMetricType.RESPONSE_TIME, timeRange);

      expect(summary.metricType).toBe(PerformanceMetricType.RESPONSE_TIME);
      expect(summary.count).toBe(3);
      expect(summary.average).toBe(150);
      expect(summary.minimum).toBe(100);
      expect(summary.maximum).toBe(200);
    });
  });

  describe('Alert Management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should create performance alert', async () => {
      const alert = {
        name: 'High Response Time',
        description: 'Alert when response time exceeds threshold',
        metricType: PerformanceMetricType.RESPONSE_TIME,
        threshold: 500,
        operator: 'gt' as const,
        severity: AlertSeverity.WARNING,
        enabled: true,
        cooldownPeriod: 5,
        notificationChannels: ['email']
      };

      const alertId = await service.createAlert(alert);

      expect(alertId).toBeDefined();
      expect(alertId).toMatch(/^alert_\d+_[a-z0-9]+$/);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Created performance alert: High Response Time')
      );
    });

    it('should update performance alert', async () => {
      const alert = {
        name: 'High Response Time',
        description: 'Alert when response time exceeds threshold',
        metricType: PerformanceMetricType.RESPONSE_TIME,
        threshold: 500,
        operator: 'gt' as const,
        severity: AlertSeverity.WARNING,
        enabled: true,
        cooldownPeriod: 5,
        notificationChannels: ['email']
      };

      const alertId = await service.createAlert(alert);
      await service.updateAlert(alertId, { threshold: 600 });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Updated performance alert: ${alertId}`)
      );
    });

    it('should delete performance alert', async () => {
      const alert = {
        name: 'High Response Time',
        description: 'Alert when response time exceeds threshold',
        metricType: PerformanceMetricType.RESPONSE_TIME,
        threshold: 500,
        operator: 'gt' as const,
        severity: AlertSeverity.WARNING,
        enabled: true,
        cooldownPeriod: 5,
        notificationChannels: ['email']
      };

      const alertId = await service.createAlert(alert);
      const deleted = await service.deleteAlert(alertId);

      expect(deleted).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Deleted performance alert: ${alertId}`)
      );
    });

    it('should get all alerts', async () => {
      const alert1 = {
        name: 'High Response Time',
        description: 'Alert when response time exceeds threshold',
        metricType: PerformanceMetricType.RESPONSE_TIME,
        threshold: 500,
        operator: 'gt' as const,
        severity: AlertSeverity.WARNING,
        enabled: true,
        cooldownPeriod: 5,
        notificationChannels: ['email']
      };

      const alert2 = {
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds threshold',
        metricType: PerformanceMetricType.ERROR_RATE,
        threshold: 5,
        operator: 'gt' as const,
        severity: AlertSeverity.CRITICAL,
        enabled: true,
        cooldownPeriod: 10,
        notificationChannels: ['slack']
      };

      await service.createAlert(alert1);
      await service.createAlert(alert2);

      const alerts = await service.getAlerts();

      expect(alerts).toHaveLength(2);
      expect(alerts.map(a => a.name)).toContain('High Response Time');
      expect(alerts.map(a => a.name)).toContain('High Error Rate');
    });

    it('should acknowledge alert', async () => {
      const alert = {
        name: 'High Response Time',
        description: 'Alert when response time exceeds threshold',
        metricType: PerformanceMetricType.RESPONSE_TIME,
        threshold: 500,
        operator: 'gt' as const,
        severity: AlertSeverity.WARNING,
        enabled: true,
        cooldownPeriod: 5,
        notificationChannels: ['email']
      };

      const alertId = await service.createAlert(alert);
      await service.acknowledgeAlert(alertId, 'user123');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Alert acknowledged: ${alertId} by user123`)
      );
    });
  });

  describe('Budget Management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should create performance budget', async () => {
      const budget = {
        name: 'Response Time Budget',
        type: BudgetType.RESPONSE_TIME_BUDGET,
        limit: 300,
        unit: 'ms',
        enabled: true,
        alertOnViolation: true,
        violationThreshold: 10,
        description: 'Keep response times under 300ms',
        tags: ['performance']
      };

      const budgetId = await service.createBudget(budget);

      expect(budgetId).toBeDefined();
      expect(budgetId).toMatch(/^budget_\d+_[a-z0-9]+$/);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Created performance budget: Response Time Budget')
      );
    });

    it('should update performance budget', async () => {
      const budget = {
        name: 'Response Time Budget',
        type: BudgetType.RESPONSE_TIME_BUDGET,
        limit: 300,
        unit: 'ms',
        enabled: true,
        alertOnViolation: true,
        violationThreshold: 10,
        description: 'Keep response times under 300ms',
        tags: ['performance']
      };

      const budgetId = await service.createBudget(budget);
      await service.updateBudget(budgetId, { limit: 250 });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Updated performance budget: ${budgetId}`)
      );
    });

    it('should delete performance budget', async () => {
      const budget = {
        name: 'Response Time Budget',
        type: BudgetType.RESPONSE_TIME_BUDGET,
        limit: 300,
        unit: 'ms',
        enabled: true,
        alertOnViolation: true,
        violationThreshold: 10,
        description: 'Keep response times under 300ms',
        tags: ['performance']
      };

      const budgetId = await service.createBudget(budget);
      const deleted = await service.deleteBudget(budgetId);

      expect(deleted).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Deleted performance budget: ${budgetId}`)
      );
    });

    it('should check budget violations', async () => {
      const budget = {
        name: 'Response Time Budget',
        type: BudgetType.RESPONSE_TIME_BUDGET,
        limit: 300,
        unit: 'ms',
        enabled: true,
        alertOnViolation: true,
        violationThreshold: 10,
        description: 'Keep response times under 300ms',
        tags: ['performance']
      };

      await service.createBudget(budget);
      const violations = await service.checkBudgetViolations();

      expect(Array.isArray(violations)).toBe(true);
    });
  });

  describe('Dashboard Management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should create dashboard', async () => {
      const dashboard = {
        name: 'Test Dashboard',
        type: DashboardType.OVERVIEW,
        description: 'Test dashboard for monitoring',
        widgets: [],
        refreshInterval: 30,
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date(),
          preset: 'last_day' as const
        },
        filters: [],
        isPublic: true,
        createdBy: 'test-user'
      };

      const dashboardId = await service.createDashboard(dashboard);

      expect(dashboardId).toBeDefined();
      expect(dashboardId).toMatch(/^dashboard_\d+_[a-z0-9]+$/);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Created performance dashboard: Test Dashboard')
      );
    });

    it('should get dashboard', async () => {
      const dashboard = {
        name: 'Test Dashboard',
        type: DashboardType.OVERVIEW,
        description: 'Test dashboard for monitoring',
        widgets: [],
        refreshInterval: 30,
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date(),
          preset: 'last_day' as const
        },
        filters: [],
        isPublic: true,
        createdBy: 'test-user'
      };

      const dashboardId = await service.createDashboard(dashboard);
      const retrievedDashboard = await service.getDashboard(dashboardId);

      expect(retrievedDashboard.id).toBe(dashboardId);
      expect(retrievedDashboard.name).toBe('Test Dashboard');
      expect(retrievedDashboard.type).toBe(DashboardType.OVERVIEW);
    });

    it('should get dashboards by type', async () => {
      const dashboard1 = {
        name: 'Overview Dashboard',
        type: DashboardType.OVERVIEW,
        description: 'Overview dashboard',
        widgets: [],
        refreshInterval: 30,
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date(),
          preset: 'last_day' as const
        },
        filters: [],
        isPublic: true,
        createdBy: 'test-user'
      };

      const dashboard2 = {
        name: 'Snap Logic Dashboard',
        type: DashboardType.SNAP_LOGIC,
        description: 'Snap logic dashboard',
        widgets: [],
        refreshInterval: 30,
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date(),
          preset: 'last_day' as const
        },
        filters: [],
        isPublic: true,
        createdBy: 'test-user'
      };

      await service.createDashboard(dashboard1);
      await service.createDashboard(dashboard2);

      const overviewDashboards = await service.getDashboards(DashboardType.OVERVIEW);
      const snapLogicDashboards = await service.getDashboards(DashboardType.SNAP_LOGIC);

      expect(overviewDashboards).toHaveLength(1);
      expect(snapLogicDashboards).toHaveLength(1);
      expect(overviewDashboards[0].name).toBe('Overview Dashboard');
      expect(snapLogicDashboards[0].name).toBe('Snap Logic Dashboard');
    });
  });

  describe('Report Generation', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should generate performance report', async () => {
      // Record some metrics first
      const metrics = [
        { type: PerformanceMetricType.RESPONSE_TIME, value: 150, unit: 'ms', source: 'test', tags: {} },
        { type: PerformanceMetricType.THROUGHPUT, value: 100, unit: 'req/s', source: 'test', tags: {} },
        { type: PerformanceMetricType.ERROR_RATE, value: 2, unit: '%', source: 'test', tags: {} }
      ];

      for (const metric of metrics) {
        await service.recordMetric(metric);
      }

      const timeRange = {
        start: new Date(Date.now() - 60000),
        end: new Date()
      };

      const report = await service.generateReport('Test Report', timeRange);

      expect(report.id).toBeDefined();
      expect(report.title).toBe('Test Report');
      expect(report.timeRange).toEqual(timeRange);
      expect(report.metrics.length).toBeGreaterThan(0);
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.generatedBy).toBe('system');
    });
  });

  describe('Real-time Monitoring', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should start real-time monitoring', async () => {
      await service.startRealTimeMonitoring();

      expect(mockLogger.info).toHaveBeenCalledWith('Real-time performance monitoring started');
    });

    it('should stop real-time monitoring', async () => {
      await service.startRealTimeMonitoring();
      await service.stopRealTimeMonitoring();

      expect(mockLogger.info).toHaveBeenCalledWith('Real-time performance monitoring stopped');
    });

    it('should get monitoring status', async () => {
      const status = await service.getMonitoringStatus();

      expect(status).toBeDefined();
      expect(typeof status.isRunning).toBe('boolean');
      expect(typeof status.uptime).toBe('number');
      expect(typeof status.metricsCollected).toBe('number');
      expect(typeof status.alertsTriggered).toBe('number');
      expect(typeof status.budgetViolations).toBe('number');
    });
  });
});

describe('SnapLogicPerformanceCollector', () => {
  let collector: SnapLogicPerformanceCollector;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    collector = new SnapLogicPerformanceCollector(
      mockLogger as any,
      {} as any, // snapDetectionService
      {} as any, // smacnaValidator
      {} as any, // accessibilityService
      { getCacheStats: jest.fn().mockResolvedValue({ hitRate: 85 }) } as any, // pwaService
      {} as any  // transactionManager
    );
  });

  describe('Metric Collection', () => {
    it('should collect metrics from all services', async () => {
      const metrics = await collector.collectMetrics();

      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
      
      // Check that different metric types are collected
      const metricTypes = metrics.map(m => m.type);
      expect(metricTypes).toContain(PerformanceMetricType.SNAP_DETECTION_LATENCY);
      expect(metricTypes).toContain(PerformanceMetricType.SMACNA_VALIDATION_TIME);
      expect(metricTypes).toContain(PerformanceMetricType.ACCESSIBILITY_SCORE);
      expect(metricTypes).toContain(PerformanceMetricType.CACHE_HIT_RATE);
    });

    it('should get collector name', () => {
      const name = collector.getName();
      expect(name).toBe('SnapLogicPerformanceCollector');
    });

    it('should get supported metrics', () => {
      const supportedMetrics = collector.getSupportedMetrics();
      
      expect(Array.isArray(supportedMetrics)).toBe(true);
      expect(supportedMetrics).toContain(PerformanceMetricType.SNAP_DETECTION_LATENCY);
      expect(supportedMetrics).toContain(PerformanceMetricType.SMACNA_VALIDATION_TIME);
      expect(supportedMetrics).toContain(PerformanceMetricType.ACCESSIBILITY_SCORE);
      expect(supportedMetrics).toContain(PerformanceMetricType.PWA_LOAD_TIME);
    });

    it('should start and stop collection', async () => {
      await collector.startCollection(1000);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Started performance collection with 1000ms interval')
      );

      await collector.stopCollection();
      expect(mockLogger.info).toHaveBeenCalledWith('Stopped performance collection');
    });
  });
});

describe('AlertManager', () => {
  let alertManager: AlertManager;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    alertManager = new AlertManager(mockLogger as any);
  });

  describe('Alert Evaluation', () => {
    it('should evaluate alerts against metrics', async () => {
      const alert = {
        id: 'test-alert',
        name: 'High Response Time',
        description: 'Alert when response time exceeds threshold',
        metricType: PerformanceMetricType.RESPONSE_TIME,
        threshold: 500,
        operator: 'gt' as const,
        severity: AlertSeverity.WARNING,
        enabled: true,
        cooldownPeriod: 5,
        notificationChannels: ['email']
      };

      alertManager.addAlert(alert);

      const metrics = [
        {
          id: 'metric1',
          type: PerformanceMetricType.RESPONSE_TIME,
          value: 600,
          unit: 'ms',
          timestamp: new Date(),
          source: 'test-service',
          tags: {}
        }
      ];

      const triggeredAlerts = await alertManager.evaluateAlerts(metrics);

      expect(triggeredAlerts).toHaveLength(1);
      expect(triggeredAlerts[0].alertId).toBe('test-alert');
      expect(triggeredAlerts[0].severity).toBe(AlertSeverity.WARNING);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Alert triggered: High Response Time'),
        expect.any(Object)
      );
    });

    it('should not trigger alert when threshold not exceeded', async () => {
      const alert = {
        id: 'test-alert',
        name: 'High Response Time',
        description: 'Alert when response time exceeds threshold',
        metricType: PerformanceMetricType.RESPONSE_TIME,
        threshold: 500,
        operator: 'gt' as const,
        severity: AlertSeverity.WARNING,
        enabled: true,
        cooldownPeriod: 5,
        notificationChannels: ['email']
      };

      alertManager.addAlert(alert);

      const metrics = [
        {
          id: 'metric1',
          type: PerformanceMetricType.RESPONSE_TIME,
          value: 400,
          unit: 'ms',
          timestamp: new Date(),
          source: 'test-service',
          tags: {}
        }
      ];

      const triggeredAlerts = await alertManager.evaluateAlerts(metrics);

      expect(triggeredAlerts).toHaveLength(0);
    });

    it('should respect cooldown period', async () => {
      const alert = {
        id: 'test-alert',
        name: 'High Response Time',
        description: 'Alert when response time exceeds threshold',
        metricType: PerformanceMetricType.RESPONSE_TIME,
        threshold: 500,
        operator: 'gt' as const,
        severity: AlertSeverity.WARNING,
        enabled: true,
        cooldownPeriod: 5,
        notificationChannels: ['email']
      };

      alertManager.addAlert(alert);

      const metrics = [
        {
          id: 'metric1',
          type: PerformanceMetricType.RESPONSE_TIME,
          value: 600,
          unit: 'ms',
          timestamp: new Date(),
          source: 'test-service',
          tags: {}
        }
      ];

      // First evaluation should trigger alert
      const firstTrigger = await alertManager.evaluateAlerts(metrics);
      expect(firstTrigger).toHaveLength(1);

      // Second evaluation should not trigger due to cooldown
      const secondTrigger = await alertManager.evaluateAlerts(metrics);
      expect(secondTrigger).toHaveLength(0);
    });
  });
});

describe('BudgetManager', () => {
  let budgetManager: BudgetManager;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    budgetManager = new BudgetManager(mockLogger as any);
  });

  describe('Budget Evaluation', () => {
    it('should evaluate budgets and detect violations', async () => {
      const budget = {
        id: 'test-budget',
        name: 'Response Time Budget',
        type: BudgetType.RESPONSE_TIME_BUDGET,
        limit: 300,
        unit: 'ms',
        enabled: true,
        alertOnViolation: true,
        violationThreshold: 10,
        description: 'Keep response times under 300ms',
        tags: ['performance']
      };

      budgetManager.addBudget(budget);

      const violations = await budgetManager.evaluateBudgets();

      expect(Array.isArray(violations)).toBe(true);
    });

    it('should get budget status', async () => {
      const budget = {
        id: 'test-budget',
        name: 'Response Time Budget',
        type: BudgetType.RESPONSE_TIME_BUDGET,
        limit: 300,
        unit: 'ms',
        enabled: true,
        alertOnViolation: true,
        violationThreshold: 10,
        description: 'Keep response times under 300ms',
        tags: ['performance']
      };

      budgetManager.addBudget(budget);

      const status = await budgetManager.getBudgetStatus();

      expect(status).toBeDefined();
      expect(status['test-budget']).toBeDefined();
      expect(status['test-budget'].status).toMatch(/^(ok|warning|violation)$/);
      expect(typeof status['test-budget'].usage).toBe('number');
    });
  });
});
