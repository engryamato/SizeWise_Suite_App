/**
 * Performance Monitoring Service Implementation
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * Real-time metrics collection, performance alerting, budget enforcement,
 * and comprehensive monitoring dashboards implementation.
 * 
 * @fileoverview Performance monitoring service implementation
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import {
  IPerformanceMonitoringService,
  IPerformanceCollector,
  IAlertManager,
  IBudgetManager,
  PerformanceMetric,
  PerformanceMetricType,
  PerformanceAlert,
  PerformanceBudget,
  PerformanceDashboard,
  PerformanceReport,
  PerformanceMetricSummary,
  TriggeredAlert,
  BudgetViolation,
  AlertSeverity,
  TimeRange,
  PerformanceMonitoringConfig,
  AlertChannel,
  DashboardType
} from '../core/interfaces/IPerformanceMonitoringService';

import { ILogger } from '../core/interfaces';

/**
 * Performance Collector for Snap Logic Services
 */
export class SnapLogicPerformanceCollector implements IPerformanceCollector {
  private isCollecting = false;
  private collectionInterval: NodeJS.Timeout | null = null;

  constructor(
    private logger: ILogger,
    private snapDetectionService: any,
    private smacnaValidator: any,
    private accessibilityService: any,
    private pwaService: any,
    private transactionManager: any
  ) {}

  async collectMetrics(): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];
    const timestamp = new Date();

    try {
      // Collect snap detection metrics
      const snapMetrics = await this.collectSnapDetectionMetrics(timestamp);
      metrics.push(...snapMetrics);

      // Collect SMACNA validation metrics
      const smacnaMetrics = await this.collectSMACNAMetrics(timestamp);
      metrics.push(...smacnaMetrics);

      // Collect accessibility metrics
      const accessibilityMetrics = await this.collectAccessibilityMetrics(timestamp);
      metrics.push(...accessibilityMetrics);

      // Collect PWA metrics
      const pwaMetrics = await this.collectPWAMetrics(timestamp);
      metrics.push(...pwaMetrics);

      // Collect transaction metrics
      const transactionMetrics = await this.collectTransactionMetrics(timestamp);
      metrics.push(...transactionMetrics);

      // Collect system metrics
      const systemMetrics = await this.collectSystemMetrics(timestamp);
      metrics.push(...systemMetrics);

    } catch (error) {
      this.logger.error('Failed to collect performance metrics', error as Error);
    }

    return metrics;
  }

  getName(): string {
    return 'SnapLogicPerformanceCollector';
  }

  getSupportedMetrics(): PerformanceMetricType[] {
    return [
      PerformanceMetricType.SNAP_DETECTION_LATENCY,
      PerformanceMetricType.SMACNA_VALIDATION_TIME,
      PerformanceMetricType.ACCESSIBILITY_SCORE,
      PerformanceMetricType.PWA_LOAD_TIME,
      PerformanceMetricType.OFFLINE_SYNC_TIME,
      PerformanceMetricType.TRANSACTION_DURATION,
      PerformanceMetricType.CACHE_HIT_RATE,
      PerformanceMetricType.MEMORY_USAGE,
      PerformanceMetricType.ERROR_RATE
    ];
  }

  async startCollection(interval: number): Promise<void> {
    if (this.isCollecting) return;

    this.isCollecting = true;
    this.collectionInterval = setInterval(async () => {
      const metrics = await this.collectMetrics();
      // Metrics would be sent to the monitoring service
      this.logger.debug(`Collected ${metrics.length} performance metrics`);
    }, interval);

    this.logger.info(`Started performance collection with ${interval}ms interval`);
  }

  async stopCollection(): Promise<void> {
    if (!this.isCollecting) return;

    this.isCollecting = false;
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    this.logger.info('Stopped performance collection');
  }

  private async collectSnapDetectionMetrics(timestamp: Date): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];

    try {
      // Measure snap detection latency
      const startTime = performance.now();
      // Simulate snap detection operation
      await new Promise(resolve => setTimeout(resolve, 1));
      const endTime = performance.now();

      metrics.push({
        id: this.generateMetricId(),
        type: PerformanceMetricType.SNAP_DETECTION_LATENCY,
        value: endTime - startTime,
        unit: 'ms',
        timestamp,
        source: 'snap-detection-service',
        tags: { service: 'snap-detection', operation: 'detect' }
      });

    } catch (error) {
      this.logger.warn('Failed to collect snap detection metrics', error as Error);
    }

    return metrics;
  }

  private async collectSMACNAMetrics(timestamp: Date): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];

    try {
      // Measure SMACNA validation time
      const startTime = performance.now();
      // Simulate SMACNA validation
      await new Promise(resolve => setTimeout(resolve, 5));
      const endTime = performance.now();

      metrics.push({
        id: this.generateMetricId(),
        type: PerformanceMetricType.SMACNA_VALIDATION_TIME,
        value: endTime - startTime,
        unit: 'ms',
        timestamp,
        source: 'smacna-validator',
        tags: { service: 'smacna', operation: 'validate' }
      });

    } catch (error) {
      this.logger.warn('Failed to collect SMACNA metrics', error as Error);
    }

    return metrics;
  }

  private async collectAccessibilityMetrics(timestamp: Date): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];

    try {
      // Simulate accessibility score calculation
      const accessibilityScore = Math.random() * 100;

      metrics.push({
        id: this.generateMetricId(),
        type: PerformanceMetricType.ACCESSIBILITY_SCORE,
        value: accessibilityScore,
        unit: 'score',
        timestamp,
        source: 'accessibility-service',
        tags: { service: 'accessibility', type: 'wcag-score' }
      });

    } catch (error) {
      this.logger.warn('Failed to collect accessibility metrics', error as Error);
    }

    return metrics;
  }

  private async collectPWAMetrics(timestamp: Date): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];

    try {
      // Collect PWA load time
      const loadTime = performance.timing?.loadEventEnd - performance.timing?.navigationStart || 0;

      metrics.push({
        id: this.generateMetricId(),
        type: PerformanceMetricType.PWA_LOAD_TIME,
        value: loadTime,
        unit: 'ms',
        timestamp,
        source: 'pwa-service',
        tags: { service: 'pwa', type: 'load-time' }
      });

      // Collect cache hit rate
      const cacheStats = await this.pwaService?.getCacheStats();
      if (cacheStats) {
        metrics.push({
          id: this.generateMetricId(),
          type: PerformanceMetricType.CACHE_HIT_RATE,
          value: cacheStats.hitRate,
          unit: 'percentage',
          timestamp,
          source: 'pwa-service',
          tags: { service: 'pwa', type: 'cache-performance' }
        });
      }

    } catch (error) {
      this.logger.warn('Failed to collect PWA metrics', error as Error);
    }

    return metrics;
  }

  private async collectTransactionMetrics(timestamp: Date): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];

    try {
      // Simulate transaction duration measurement
      const transactionDuration = Math.random() * 100 + 10;

      metrics.push({
        id: this.generateMetricId(),
        type: PerformanceMetricType.TRANSACTION_DURATION,
        value: transactionDuration,
        unit: 'ms',
        timestamp,
        source: 'transaction-manager',
        tags: { service: 'transaction', type: 'atomic-operation' }
      });

    } catch (error) {
      this.logger.warn('Failed to collect transaction metrics', error as Error);
    }

    return metrics;
  }

  private async collectSystemMetrics(timestamp: Date): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];

    try {
      // Collect memory usage
      if ((performance as any).memory) {
        const memoryInfo = (performance as any).memory;
        metrics.push({
          id: this.generateMetricId(),
          type: PerformanceMetricType.MEMORY_USAGE,
          value: memoryInfo.usedJSHeapSize / 1024 / 1024, // Convert to MB
          unit: 'MB',
          timestamp,
          source: 'system',
          tags: { service: 'system', type: 'memory' }
        });
      }

      // Collect error rate (simulated)
      const errorRate = Math.random() * 5; // 0-5% error rate
      metrics.push({
        id: this.generateMetricId(),
        type: PerformanceMetricType.ERROR_RATE,
        value: errorRate,
        unit: 'percentage',
        timestamp,
        source: 'system',
        tags: { service: 'system', type: 'errors' }
      });

    } catch (error) {
      this.logger.warn('Failed to collect system metrics', error as Error);
    }

    return metrics;
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Alert Manager Implementation
 */
export class AlertManager implements IAlertManager {
  private alerts: Map<string, PerformanceAlert> = new Map();
  private triggeredAlerts: Map<string, TriggeredAlert> = new Map();
  private alertCooldowns: Map<string, Date> = new Map();

  constructor(private logger: ILogger) {}

  async evaluateAlerts(metrics: PerformanceMetric[]): Promise<TriggeredAlert[]> {
    const newTriggeredAlerts: TriggeredAlert[] = [];

    for (const alert of this.alerts.values()) {
      if (!alert.enabled) continue;

      // Check cooldown
      const lastTriggered = this.alertCooldowns.get(alert.id);
      if (lastTriggered && Date.now() - lastTriggered.getTime() < alert.cooldownPeriod * 60 * 1000) {
        continue;
      }

      // Find relevant metrics
      const relevantMetrics = metrics.filter(m => m.type === alert.metricType);
      
      for (const metric of relevantMetrics) {
        if (this.evaluateAlertCondition(alert, metric)) {
          const triggeredAlert: TriggeredAlert = {
            alertId: alert.id,
            alertName: alert.name,
            severity: alert.severity,
            triggeredAt: new Date(),
            currentValue: metric.value,
            threshold: alert.threshold,
            message: `${alert.name}: ${metric.value}${metric.unit} ${alert.operator} ${alert.threshold}${metric.unit}`,
            source: metric.source,
            acknowledged: false
          };

          newTriggeredAlerts.push(triggeredAlert);
          this.triggeredAlerts.set(triggeredAlert.alertId, triggeredAlert);
          this.alertCooldowns.set(alert.id, new Date());

          this.logger.warn(`Alert triggered: ${alert.name}`, { alert: triggeredAlert });
        }
      }
    }

    return newTriggeredAlerts;
  }

  async sendNotification(alert: TriggeredAlert, channels: AlertChannel[]): Promise<void> {
    for (const channel of channels) {
      if (!channel.enabled) continue;

      try {
        await this.sendToChannel(alert, channel);
        this.logger.info(`Alert notification sent via ${channel.type}`, { alertId: alert.alertId });
      } catch (error) {
        this.logger.error(`Failed to send alert via ${channel.type}`, error as Error);
      }
    }
  }

  async processAlertRules(): Promise<void> {
    // Process complex alert rules with multiple conditions
    for (const alert of this.alerts.values()) {
      if (alert.conditions && alert.conditions.length > 0) {
        // Evaluate complex conditions
        // Implementation would check time windows and aggregations
        this.logger.debug(`Processing complex alert rules for ${alert.name}`);
      }
    }
  }

  async addAlert(alert: PerformanceAlert): Promise<void> {
    this.alerts.set(alert.id, alert);
  }

  async removeAlert(alertId: string): Promise<boolean> {
    return this.alerts.delete(alertId);
  }

  async getAlert(alertId: string): Promise<PerformanceAlert | null> {
    return this.alerts.get(alertId) || null;
  }

  async getAllAlerts(): Promise<PerformanceAlert[]> {
    return Array.from(this.alerts.values());
  }

  getTriggeredAlerts(): TriggeredAlert[] {
    return Array.from(this.triggeredAlerts.values());
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alert = this.triggeredAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date();
      this.triggeredAlerts.set(alertId, alert);
    }
  }

  private evaluateAlertCondition(alert: PerformanceAlert, metric: PerformanceMetric): boolean {
    switch (alert.operator) {
      case 'gt': return metric.value > alert.threshold;
      case 'gte': return metric.value >= alert.threshold;
      case 'lt': return metric.value < alert.threshold;
      case 'lte': return metric.value <= alert.threshold;
      case 'eq': return metric.value === alert.threshold;
      default: return false;
    }
  }

  private async sendToChannel(alert: TriggeredAlert, channel: AlertChannel): Promise<void> {
    switch (channel.type) {
      case 'email':
        // Implementation would send email
        this.logger.info(`Email alert sent: ${alert.message}`);
        break;
      case 'slack':
        // Implementation would send Slack message
        this.logger.info(`Slack alert sent: ${alert.message}`);
        break;
      case 'webhook':
        // Implementation would call webhook
        this.logger.info(`Webhook alert sent: ${alert.message}`);
        break;
      case 'sms':
        // Implementation would send SMS
        this.logger.info(`SMS alert sent: ${alert.message}`);
        break;
    }
  }
}

/**
 * Budget Manager Implementation
 */
export class BudgetManager implements IBudgetManager {
  private budgets: Map<string, PerformanceBudget> = new Map();
  private violations: Map<string, BudgetViolation> = new Map();

  constructor(private logger: ILogger) {}

  async evaluateBudgets(): Promise<BudgetViolation[]> {
    const violations: BudgetViolation[] = [];

    for (const budget of this.budgets.values()) {
      if (!budget.enabled) continue;

      try {
        const currentValue = await this.getCurrentBudgetValue(budget);
        const violationPercentage = ((currentValue - budget.limit) / budget.limit) * 100;

        if (currentValue > budget.limit && violationPercentage >= budget.violationThreshold) {
          const violation: BudgetViolation = {
            budgetId: budget.id,
            budgetName: budget.name,
            currentValue,
            budgetLimit: budget.limit,
            violationPercentage,
            timestamp: new Date(),
            source: 'budget-manager',
            severity: this.calculateViolationSeverity(violationPercentage),
            recommendations: this.generateRecommendations(budget, violationPercentage)
          };

          violations.push(violation);
          this.violations.set(budget.id, violation);

          this.logger.warn(`Budget violation detected: ${budget.name}`, { violation });
        }
      } catch (error) {
        this.logger.error(`Failed to evaluate budget ${budget.name}`, error as Error);
      }
    }

    return violations;
  }

  async enforceBudgets(): Promise<void> {
    for (const budget of this.budgets.values()) {
      if (!budget.enabled) continue;

      const violation = this.violations.get(budget.id);
      if (violation && violation.severity === AlertSeverity.CRITICAL) {
        // Implement budget enforcement actions
        await this.enforceBudgetLimit(budget, violation);
      }
    }
  }

  async getBudgetStatus(): Promise<Record<string, { status: 'ok' | 'warning' | 'violation'; usage: number }>> {
    const status: Record<string, { status: 'ok' | 'warning' | 'violation'; usage: number }> = {};

    for (const budget of this.budgets.values()) {
      const currentValue = await this.getCurrentBudgetValue(budget);
      const usagePercentage = (currentValue / budget.limit) * 100;

      let budgetStatus: 'ok' | 'warning' | 'violation' = 'ok';
      if (usagePercentage > 100) {
        budgetStatus = 'violation';
      } else if (usagePercentage > 80) {
        budgetStatus = 'warning';
      }

      status[budget.id] = {
        status: budgetStatus,
        usage: usagePercentage
      };
    }

    return status;
  }

  async addBudget(budget: PerformanceBudget): Promise<void> {
    this.budgets.set(budget.id, budget);
  }

  async removeBudget(budgetId: string): Promise<boolean> {
    this.violations.delete(budgetId);
    return this.budgets.delete(budgetId);
  }

  async getBudget(budgetId: string): Promise<PerformanceBudget | null> {
    return this.budgets.get(budgetId) || null;
  }

  async getAllBudgets(): Promise<PerformanceBudget[]> {
    return Array.from(this.budgets.values());
  }

  getBudgetViolations(): BudgetViolation[] {
    return Array.from(this.violations.values());
  }

  private async getCurrentBudgetValue(budget: PerformanceBudget): Promise<number> {
    // Implementation would fetch current metrics based on budget type
    switch (budget.type) {
      case 'response_time_budget':
        return Math.random() * 1000; // Simulated response time
      case 'memory_budget':
        return (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0;
      case 'bundle_size_budget':
        return Math.random() * 5000; // Simulated bundle size in KB
      case 'accessibility_budget':
        return Math.random() * 100; // Simulated accessibility score
      case 'error_rate_budget':
        return Math.random() * 10; // Simulated error rate percentage
      default:
        return 0;
    }
  }

  private calculateViolationSeverity(violationPercentage: number): AlertSeverity {
    if (violationPercentage > 50) return AlertSeverity.CRITICAL;
    if (violationPercentage > 25) return AlertSeverity.WARNING;
    return AlertSeverity.INFO;
  }

  private generateRecommendations(budget: PerformanceBudget, violationPercentage: number): string[] {
    const recommendations: string[] = [];

    switch (budget.type) {
      case 'response_time_budget':
        recommendations.push('Optimize database queries');
        recommendations.push('Implement caching strategies');
        recommendations.push('Review API endpoint performance');
        break;
      case 'memory_budget':
        recommendations.push('Review memory leaks');
        recommendations.push('Optimize data structures');
        recommendations.push('Implement garbage collection tuning');
        break;
      case 'bundle_size_budget':
        recommendations.push('Enable code splitting');
        recommendations.push('Remove unused dependencies');
        recommendations.push('Implement tree shaking');
        break;
      case 'accessibility_budget':
        recommendations.push('Fix WCAG compliance issues');
        recommendations.push('Improve keyboard navigation');
        recommendations.push('Enhance screen reader support');
        break;
      case 'error_rate_budget':
        recommendations.push('Review error handling');
        recommendations.push('Implement better validation');
        recommendations.push('Add monitoring and alerting');
        break;
    }

    return recommendations;
  }

  private async enforceBudgetLimit(budget: PerformanceBudget, violation: BudgetViolation): Promise<void> {
    this.logger.warn(`Enforcing budget limit for ${budget.name}`, { budget, violation });

    // Implementation would take corrective actions based on budget type
    switch (budget.type) {
      case 'response_time_budget':
        // Could implement request throttling
        break;
      case 'memory_budget':
        // Could trigger garbage collection
        break;
      case 'bundle_size_budget':
        // Could disable non-critical features
        break;
    }
  }
}

/**
 * Main Performance Monitoring Service Implementation
 */
export class PerformanceMonitoringService implements IPerformanceMonitoringService {
  private config: PerformanceMonitoringConfig;
  private collectors: Map<string, IPerformanceCollector> = new Map();
  private alertManager: IAlertManager;
  private budgetManager: IBudgetManager;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private dashboards: Map<string, PerformanceDashboard> = new Map();
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(private logger: ILogger) {
    this.alertManager = new AlertManager(logger);
    this.budgetManager = new BudgetManager(logger);
  }

  async initialize(config?: PerformanceMonitoringConfig): Promise<void> {
    try {
      this.config = config || this.getDefaultConfig();

      // Initialize default dashboards
      await this.createDefaultDashboards();

      // Start monitoring if enabled
      if (this.config.enabled) {
        await this.startRealTimeMonitoring();
      }

      this.logger.info('Performance monitoring service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize performance monitoring service', error as Error);
      throw error;
    }
  }

  async recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<string> {
    const id = this.generateMetricId();
    const fullMetric: PerformanceMetric = {
      ...metric,
      id,
      timestamp: new Date()
    };

    this.metrics.set(id, fullMetric);

    // Evaluate alerts
    await this.alertManager.evaluateAlerts([fullMetric]);

    this.logger.debug(`Recorded metric: ${metric.type} = ${metric.value}${metric.unit}`);
    return id;
  }

  async recordMetrics(metrics: Omit<PerformanceMetric, 'id' | 'timestamp'>[]): Promise<string[]> {
    const ids: string[] = [];
    const fullMetrics: PerformanceMetric[] = [];

    for (const metric of metrics) {
      const id = this.generateMetricId();
      const fullMetric: PerformanceMetric = {
        ...metric,
        id,
        timestamp: new Date()
      };

      this.metrics.set(id, fullMetric);
      fullMetrics.push(fullMetric);
      ids.push(id);
    }

    // Evaluate alerts for all metrics
    await this.alertManager.evaluateAlerts(fullMetrics);

    this.logger.debug(`Recorded ${metrics.length} metrics`);
    return ids;
  }

  async getMetrics(
    metricType: PerformanceMetricType,
    timeRange: TimeRange,
    filters?: Record<string, string>
  ): Promise<PerformanceMetric[]> {
    const filteredMetrics = Array.from(this.metrics.values()).filter(metric => {
      // Filter by type
      if (metric.type !== metricType) return false;

      // Filter by time range
      if (metric.timestamp < timeRange.start || metric.timestamp > timeRange.end) return false;

      // Apply additional filters
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (metric.tags[key] !== value) return false;
        }
      }

      return true;
    });

    return filteredMetrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getMetricSummary(
    metricType: PerformanceMetricType,
    timeRange: TimeRange,
    filters?: Record<string, string>
  ): Promise<PerformanceMetricSummary> {
    const metrics = await this.getMetrics(metricType, timeRange, filters);

    if (metrics.length === 0) {
      return {
        metricType,
        average: 0,
        minimum: 0,
        maximum: 0,
        percentile95: 0,
        percentile99: 0,
        count: 0,
        unit: '',
        trend: 'stable',
        trendPercentage: 0
      };
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);

    return {
      metricType,
      average: sum / values.length,
      minimum: values[0],
      maximum: values[values.length - 1],
      percentile95: this.calculatePercentile(values, 95),
      percentile99: this.calculatePercentile(values, 99),
      count: values.length,
      unit: metrics[0].unit,
      trend: this.calculateTrend(metrics),
      trendPercentage: this.calculateTrendPercentage(metrics)
    };
  }

  async createAlert(alert: Omit<PerformanceAlert, 'id'>): Promise<string> {
    const id = this.generateAlertId();
    const fullAlert: PerformanceAlert = { ...alert, id };

    await this.alertManager.addAlert(fullAlert);
    this.logger.info(`Created performance alert: ${alert.name}`);

    return id;
  }

  async updateAlert(alertId: string, updates: Partial<PerformanceAlert>): Promise<void> {
    const alert = await this.alertManager.getAlert(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    const updatedAlert = { ...alert, ...updates };
    await this.alertManager.addAlert(updatedAlert);
    this.logger.info(`Updated performance alert: ${alertId}`);
  }

  async deleteAlert(alertId: string): Promise<boolean> {
    const deleted = await this.alertManager.removeAlert(alertId);
    if (deleted) {
      this.logger.info(`Deleted performance alert: ${alertId}`);
    }
    return deleted;
  }

  async getAlerts(): Promise<PerformanceAlert[]> {
    return await this.alertManager.getAllAlerts();
  }

  async getTriggeredAlerts(timeRange?: TimeRange): Promise<TriggeredAlert[]> {
    let alerts = this.alertManager.getTriggeredAlerts();

    if (timeRange) {
      alerts = alerts.filter(alert =>
        alert.triggeredAt >= timeRange.start && alert.triggeredAt <= timeRange.end
      );
    }

    return alerts;
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    await this.alertManager.acknowledgeAlert(alertId, userId);
    this.logger.info(`Alert acknowledged: ${alertId} by ${userId}`);
  }

  async createBudget(budget: Omit<PerformanceBudget, 'id'>): Promise<string> {
    const id = this.generateBudgetId();
    const fullBudget: PerformanceBudget = { ...budget, id };

    await this.budgetManager.addBudget(fullBudget);
    this.logger.info(`Created performance budget: ${budget.name}`);

    return id;
  }

  async updateBudget(budgetId: string, updates: Partial<PerformanceBudget>): Promise<void> {
    const budget = await this.budgetManager.getBudget(budgetId);
    if (!budget) {
      throw new Error(`Budget not found: ${budgetId}`);
    }

    const updatedBudget = { ...budget, ...updates };
    await this.budgetManager.addBudget(updatedBudget);
    this.logger.info(`Updated performance budget: ${budgetId}`);
  }

  async deleteBudget(budgetId: string): Promise<boolean> {
    const deleted = await this.budgetManager.removeBudget(budgetId);
    if (deleted) {
      this.logger.info(`Deleted performance budget: ${budgetId}`);
    }
    return deleted;
  }

  async getBudgets(): Promise<PerformanceBudget[]> {
    return await this.budgetManager.getAllBudgets();
  }

  async checkBudgetViolations(): Promise<BudgetViolation[]> {
    return await this.budgetManager.evaluateBudgets();
  }

  async createDashboard(dashboard: Omit<PerformanceDashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = this.generateDashboardId();
    const now = new Date();
    const fullDashboard: PerformanceDashboard = {
      ...dashboard,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.dashboards.set(id, fullDashboard);
    this.logger.info(`Created performance dashboard: ${dashboard.name}`);

    return id;
  }

  async updateDashboard(dashboardId: string, updates: Partial<PerformanceDashboard>): Promise<void> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }

    const updatedDashboard = {
      ...dashboard,
      ...updates,
      updatedAt: new Date()
    };

    this.dashboards.set(dashboardId, updatedDashboard);
    this.logger.info(`Updated performance dashboard: ${dashboardId}`);
  }

  async deleteDashboard(dashboardId: string): Promise<boolean> {
    const deleted = this.dashboards.delete(dashboardId);
    if (deleted) {
      this.logger.info(`Deleted performance dashboard: ${dashboardId}`);
    }
    return deleted;
  }

  async getDashboard(dashboardId: string): Promise<PerformanceDashboard> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }
    return dashboard;
  }

  async getDashboards(type?: DashboardType): Promise<PerformanceDashboard[]> {
    let dashboards = Array.from(this.dashboards.values());

    if (type) {
      dashboards = dashboards.filter(d => d.type === type);
    }

    return dashboards;
  }

  async generateReport(
    title: string,
    timeRange: TimeRange,
    metricTypes?: PerformanceMetricType[]
  ): Promise<PerformanceReport> {
    const reportId = this.generateReportId();
    const types = metricTypes || Object.values(PerformanceMetricType);

    const metrics: PerformanceMetricSummary[] = [];
    for (const type of types) {
      const summary = await this.getMetricSummary(type, timeRange);
      if (summary.count > 0) {
        metrics.push(summary);
      }
    }

    const budgetViolations = await this.checkBudgetViolations();
    const alerts = await this.getTriggeredAlerts(timeRange);

    const recommendations = this.generateReportRecommendations(metrics, budgetViolations, alerts);

    return {
      id: reportId,
      title,
      description: `Performance report for ${timeRange.start.toISOString()} to ${timeRange.end.toISOString()}`,
      timeRange,
      metrics,
      budgetViolations,
      alerts,
      recommendations,
      generatedAt: new Date(),
      generatedBy: 'system'
    };
  }

  async startRealTimeMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Start collectors
    for (const collector of this.collectors.values()) {
      await collector.startCollection(this.config.collectionInterval);
    }

    // Start periodic evaluation
    this.monitoringInterval = setInterval(async () => {
      try {
        // Collect metrics from all collectors
        const allMetrics: PerformanceMetric[] = [];
        for (const collector of this.collectors.values()) {
          const metrics = await collector.collectMetrics();
          allMetrics.push(...metrics);
        }

        // Record collected metrics
        if (allMetrics.length > 0) {
          await this.recordMetrics(allMetrics.map(m => ({
            type: m.type,
            value: m.value,
            unit: m.unit,
            source: m.source,
            tags: m.tags,
            metadata: m.metadata
          })));
        }

        // Evaluate budgets
        await this.budgetManager.evaluateBudgets();

        // Process alert rules
        await this.alertManager.processAlertRules();

      } catch (error) {
        this.logger.error('Error during real-time monitoring', error as Error);
      }
    }, this.config.collectionInterval);

    this.logger.info('Real-time performance monitoring started');
  }

  async stopRealTimeMonitoring(): Promise<void> {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    // Stop collectors
    for (const collector of this.collectors.values()) {
      await collector.stopCollection();
    }

    // Stop monitoring interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.logger.info('Real-time performance monitoring stopped');
  }

  async getMonitoringStatus(): Promise<{
    isRunning: boolean;
    uptime: number;
    metricsCollected: number;
    alertsTriggered: number;
    budgetViolations: number;
  }> {
    const alertsTriggered = this.alertManager.getTriggeredAlerts().length;
    const budgetViolations = this.budgetManager.getBudgetViolations().length;

    return {
      isRunning: this.isMonitoring,
      uptime: this.isMonitoring ? Date.now() - (this.config as any).startTime || 0 : 0,
      metricsCollected: this.metrics.size,
      alertsTriggered,
      budgetViolations
    };
  }

  // Collector management
  addCollector(collector: IPerformanceCollector): void {
    this.collectors.set(collector.getName(), collector);
    this.logger.info(`Added performance collector: ${collector.getName()}`);
  }

  removeCollector(collectorName: string): boolean {
    const removed = this.collectors.delete(collectorName);
    if (removed) {
      this.logger.info(`Removed performance collector: ${collectorName}`);
    }
    return removed;
  }

  // Private helper methods
  private getDefaultConfig(): PerformanceMonitoringConfig {
    return {
      enabled: true,
      collectionInterval: 30000, // 30 seconds
      retentionPeriod: 30, // 30 days
      maxMetricsPerBatch: 100,
      enableRealTimeAlerts: true,
      enableBudgetEnforcement: true,
      defaultDashboards: [
        DashboardType.OVERVIEW,
        DashboardType.SNAP_LOGIC,
        DashboardType.ACCESSIBILITY,
        DashboardType.PWA_PERFORMANCE
      ],
      alertChannels: []
    };
  }

  private async createDefaultDashboards(): Promise<void> {
    for (const type of this.config.defaultDashboards) {
      await this.createDefaultDashboard(type);
    }
  }

  private async createDefaultDashboard(type: DashboardType): Promise<void> {
    const dashboard = this.getDefaultDashboardConfig(type);
    await this.createDashboard(dashboard);
  }

  private getDefaultDashboardConfig(type: DashboardType): Omit<PerformanceDashboard, 'id' | 'createdAt' | 'updatedAt'> {
    const baseConfig = {
      type,
      refreshInterval: 30,
      timeRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date(),
        preset: 'last_day' as const
      },
      filters: [],
      isPublic: true,
      createdBy: 'system'
    };

    switch (type) {
      case DashboardType.OVERVIEW:
        return {
          ...baseConfig,
          name: 'Performance Overview',
          description: 'High-level performance metrics across all services',
          widgets: [
            {
              id: 'response-time-chart',
              type: 'chart',
              title: 'Response Time Trends',
              position: { x: 0, y: 0, width: 6, height: 4 },
              config: { chartType: 'line', aggregation: 'avg', timeWindow: 60 },
              dataSource: {
                metricTypes: [PerformanceMetricType.RESPONSE_TIME],
                filters: {},
                timeRange: baseConfig.timeRange
              }
            },
            {
              id: 'error-rate-gauge',
              type: 'gauge',
              title: 'Error Rate',
              position: { x: 6, y: 0, width: 3, height: 4 },
              config: { thresholds: [{ value: 5, color: 'red', label: 'High' }] },
              dataSource: {
                metricTypes: [PerformanceMetricType.ERROR_RATE],
                filters: {},
                timeRange: baseConfig.timeRange
              }
            }
          ]
        };

      case DashboardType.SNAP_LOGIC:
        return {
          ...baseConfig,
          name: 'Snap Logic Performance',
          description: 'Performance metrics for snap detection and related services',
          widgets: [
            {
              id: 'snap-detection-latency',
              type: 'chart',
              title: 'Snap Detection Latency',
              position: { x: 0, y: 0, width: 6, height: 4 },
              config: { chartType: 'line', aggregation: 'avg' },
              dataSource: {
                metricTypes: [PerformanceMetricType.SNAP_DETECTION_LATENCY],
                filters: {},
                timeRange: baseConfig.timeRange
              }
            }
          ]
        };

      case DashboardType.ACCESSIBILITY:
        return {
          ...baseConfig,
          name: 'Accessibility Performance',
          description: 'WCAG compliance and accessibility metrics',
          widgets: [
            {
              id: 'accessibility-score',
              type: 'gauge',
              title: 'Accessibility Score',
              position: { x: 0, y: 0, width: 6, height: 4 },
              config: { thresholds: [{ value: 80, color: 'green', label: 'Good' }] },
              dataSource: {
                metricTypes: [PerformanceMetricType.ACCESSIBILITY_SCORE],
                filters: {},
                timeRange: baseConfig.timeRange
              }
            }
          ]
        };

      case DashboardType.PWA_PERFORMANCE:
        return {
          ...baseConfig,
          name: 'PWA Performance',
          description: 'Progressive Web App performance and caching metrics',
          widgets: [
            {
              id: 'pwa-load-time',
              type: 'chart',
              title: 'PWA Load Time',
              position: { x: 0, y: 0, width: 6, height: 4 },
              config: { chartType: 'line', aggregation: 'avg' },
              dataSource: {
                metricTypes: [PerformanceMetricType.PWA_LOAD_TIME],
                filters: {},
                timeRange: baseConfig.timeRange
              }
            },
            {
              id: 'cache-hit-rate',
              type: 'gauge',
              title: 'Cache Hit Rate',
              position: { x: 6, y: 0, width: 3, height: 4 },
              config: { thresholds: [{ value: 80, color: 'green', label: 'Good' }] },
              dataSource: {
                metricTypes: [PerformanceMetricType.CACHE_HIT_RATE],
                filters: {},
                timeRange: baseConfig.timeRange
              }
            }
          ]
        };

      default:
        return {
          ...baseConfig,
          name: `${type} Dashboard`,
          description: `Default dashboard for ${type}`,
          widgets: []
        };
    }
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  private calculateTrend(metrics: PerformanceMetric[]): 'improving' | 'degrading' | 'stable' {
    if (metrics.length < 2) return 'stable';

    const midpoint = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, midpoint);
    const secondHalf = metrics.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length;

    const changePercentage = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (changePercentage > 5) return 'degrading';
    if (changePercentage < -5) return 'improving';
    return 'stable';
  }

  private calculateTrendPercentage(metrics: PerformanceMetric[]): number {
    if (metrics.length < 2) return 0;

    const midpoint = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, midpoint);
    const secondHalf = metrics.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length;

    return ((secondAvg - firstAvg) / firstAvg) * 100;
  }

  private generateReportRecommendations(
    metrics: PerformanceMetricSummary[],
    violations: BudgetViolation[],
    alerts: TriggeredAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // Analyze metrics for recommendations
    for (const metric of metrics) {
      if (metric.trend === 'degrading' && metric.trendPercentage > 10) {
        recommendations.push(`${metric.metricType} is degrading by ${metric.trendPercentage.toFixed(1)}% - investigate performance issues`);
      }
    }

    // Add budget violation recommendations
    for (const violation of violations) {
      recommendations.push(...violation.recommendations);
    }

    // Add alert-based recommendations
    const criticalAlerts = alerts.filter(a => a.severity === AlertSeverity.CRITICAL);
    if (criticalAlerts.length > 0) {
      recommendations.push(`${criticalAlerts.length} critical alerts detected - immediate attention required`);
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBudgetId(): string {
    return `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDashboardId(): string {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
