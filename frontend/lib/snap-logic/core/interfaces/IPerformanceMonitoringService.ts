/**
 * Performance Monitoring Service Interfaces
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * Real-time metrics collection, performance alerting, budget enforcement,
 * and comprehensive monitoring dashboards for snap logic services.
 * 
 * @fileoverview Performance monitoring service interfaces
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

/**
 * Performance metric types
 */
export enum PerformanceMetricType {
  RESPONSE_TIME = 'response_time',
  THROUGHPUT = 'throughput',
  ERROR_RATE = 'error_rate',
  MEMORY_USAGE = 'memory_usage',
  CPU_USAGE = 'cpu_usage',
  CACHE_HIT_RATE = 'cache_hit_rate',
  ACCESSIBILITY_SCORE = 'accessibility_score',
  SMACNA_VALIDATION_TIME = 'smacna_validation_time',
  SNAP_DETECTION_LATENCY = 'snap_detection_latency',
  TRANSACTION_DURATION = 'transaction_duration',
  OFFLINE_SYNC_TIME = 'offline_sync_time',
  PWA_LOAD_TIME = 'pwa_load_time'
}

/**
 * Performance alert severity levels
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

/**
 * Performance budget types
 */
export enum BudgetType {
  RESPONSE_TIME_BUDGET = 'response_time_budget',
  MEMORY_BUDGET = 'memory_budget',
  BUNDLE_SIZE_BUDGET = 'bundle_size_budget',
  ACCESSIBILITY_BUDGET = 'accessibility_budget',
  ERROR_RATE_BUDGET = 'error_rate_budget'
}

/**
 * Monitoring dashboard types
 */
export enum DashboardType {
  OVERVIEW = 'overview',
  SNAP_LOGIC = 'snap_logic',
  ACCESSIBILITY = 'accessibility',
  PWA_PERFORMANCE = 'pwa_performance',
  SMACNA_COMPLIANCE = 'smacna_compliance',
  TIER_USAGE = 'tier_usage',
  TRANSACTION_MONITORING = 'transaction_monitoring'
}

/**
 * Performance metric data point
 */
export interface PerformanceMetric {
  id: string;
  type: PerformanceMetricType;
  value: number;
  unit: string;
  timestamp: Date;
  source: string;
  tags: Record<string, string>;
  metadata?: Record<string, any>;
}

/**
 * Performance alert configuration
 */
export interface PerformanceAlert {
  id: string;
  name: string;
  description: string;
  metricType: PerformanceMetricType;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  severity: AlertSeverity;
  enabled: boolean;
  cooldownPeriod: number; // Minutes
  notificationChannels: string[];
  conditions?: AlertCondition[];
}

/**
 * Alert condition for complex rules
 */
export interface AlertCondition {
  metricType: PerformanceMetricType;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  timeWindow: number; // Minutes
  aggregation: 'avg' | 'max' | 'min' | 'sum' | 'count';
}

/**
 * Performance budget configuration
 */
export interface PerformanceBudget {
  id: string;
  name: string;
  type: BudgetType;
  limit: number;
  unit: string;
  enabled: boolean;
  alertOnViolation: boolean;
  violationThreshold: number; // Percentage over budget
  description: string;
  tags: string[];
}

/**
 * Performance budget violation
 */
export interface BudgetViolation {
  budgetId: string;
  budgetName: string;
  currentValue: number;
  budgetLimit: number;
  violationPercentage: number;
  timestamp: Date;
  source: string;
  severity: AlertSeverity;
  recommendations: string[];
}

/**
 * Performance dashboard configuration
 */
export interface PerformanceDashboard {
  id: string;
  name: string;
  type: DashboardType;
  description: string;
  widgets: DashboardWidget[];
  refreshInterval: number; // Seconds
  timeRange: TimeRange;
  filters: DashboardFilter[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dashboard widget configuration
 */
export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'gauge' | 'heatmap';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: WidgetConfig;
  dataSource: DataSourceConfig;
}

/**
 * Widget configuration
 */
export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  aggregation?: 'avg' | 'max' | 'min' | 'sum' | 'count';
  timeWindow?: number; // Minutes
  thresholds?: { value: number; color: string; label: string }[];
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

/**
 * Data source configuration
 */
export interface DataSourceConfig {
  metricTypes: PerformanceMetricType[];
  filters: Record<string, string>;
  groupBy?: string[];
  timeRange: TimeRange;
}

/**
 * Time range for queries
 */
export interface TimeRange {
  start: Date;
  end: Date;
  preset?: 'last_hour' | 'last_day' | 'last_week' | 'last_month' | 'custom';
}

/**
 * Dashboard filter
 */
export interface DashboardFilter {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'nin' | 'contains';
  value: any;
  label: string;
}

/**
 * Performance report
 */
export interface PerformanceReport {
  id: string;
  title: string;
  description: string;
  timeRange: TimeRange;
  metrics: PerformanceMetricSummary[];
  budgetViolations: BudgetViolation[];
  alerts: TriggeredAlert[];
  recommendations: string[];
  generatedAt: Date;
  generatedBy: string;
}

/**
 * Performance metric summary
 */
export interface PerformanceMetricSummary {
  metricType: PerformanceMetricType;
  average: number;
  minimum: number;
  maximum: number;
  percentile95: number;
  percentile99: number;
  count: number;
  unit: string;
  trend: 'improving' | 'degrading' | 'stable';
  trendPercentage: number;
}

/**
 * Triggered alert
 */
export interface TriggeredAlert {
  alertId: string;
  alertName: string;
  severity: AlertSeverity;
  triggeredAt: Date;
  resolvedAt?: Date;
  currentValue: number;
  threshold: number;
  message: string;
  source: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceMonitoringConfig {
  enabled: boolean;
  collectionInterval: number; // Milliseconds
  retentionPeriod: number; // Days
  maxMetricsPerBatch: number;
  enableRealTimeAlerts: boolean;
  enableBudgetEnforcement: boolean;
  defaultDashboards: DashboardType[];
  alertChannels: AlertChannel[];
}

/**
 * Alert notification channel
 */
export interface AlertChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
}

/**
 * Main Performance Monitoring Service interface
 */
export interface IPerformanceMonitoringService {
  /**
   * Initialize performance monitoring
   */
  initialize(config?: PerformanceMonitoringConfig): Promise<void>;

  /**
   * Record performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<string>;

  /**
   * Record multiple metrics
   */
  recordMetrics(metrics: Omit<PerformanceMetric, 'id' | 'timestamp'>[]): Promise<string[]>;

  /**
   * Get metrics by type and time range
   */
  getMetrics(
    metricType: PerformanceMetricType,
    timeRange: TimeRange,
    filters?: Record<string, string>
  ): Promise<PerformanceMetric[]>;

  /**
   * Get metric summary
   */
  getMetricSummary(
    metricType: PerformanceMetricType,
    timeRange: TimeRange,
    filters?: Record<string, string>
  ): Promise<PerformanceMetricSummary>;

  /**
   * Create performance alert
   */
  createAlert(alert: Omit<PerformanceAlert, 'id'>): Promise<string>;

  /**
   * Update performance alert
   */
  updateAlert(alertId: string, updates: Partial<PerformanceAlert>): Promise<void>;

  /**
   * Delete performance alert
   */
  deleteAlert(alertId: string): Promise<boolean>;

  /**
   * Get all alerts
   */
  getAlerts(): Promise<PerformanceAlert[]>;

  /**
   * Get triggered alerts
   */
  getTriggeredAlerts(timeRange?: TimeRange): Promise<TriggeredAlert[]>;

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, userId: string): Promise<void>;

  /**
   * Create performance budget
   */
  createBudget(budget: Omit<PerformanceBudget, 'id'>): Promise<string>;

  /**
   * Update performance budget
   */
  updateBudget(budgetId: string, updates: Partial<PerformanceBudget>): Promise<void>;

  /**
   * Delete performance budget
   */
  deleteBudget(budgetId: string): Promise<boolean>;

  /**
   * Get all budgets
   */
  getBudgets(): Promise<PerformanceBudget[]>;

  /**
   * Check budget violations
   */
  checkBudgetViolations(): Promise<BudgetViolation[]>;

  /**
   * Create dashboard
   */
  createDashboard(dashboard: Omit<PerformanceDashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;

  /**
   * Update dashboard
   */
  updateDashboard(dashboardId: string, updates: Partial<PerformanceDashboard>): Promise<void>;

  /**
   * Delete dashboard
   */
  deleteDashboard(dashboardId: string): Promise<boolean>;

  /**
   * Get dashboard
   */
  getDashboard(dashboardId: string): Promise<PerformanceDashboard>;

  /**
   * Get all dashboards
   */
  getDashboards(type?: DashboardType): Promise<PerformanceDashboard[]>;

  /**
   * Generate performance report
   */
  generateReport(
    title: string,
    timeRange: TimeRange,
    metricTypes?: PerformanceMetricType[]
  ): Promise<PerformanceReport>;

  /**
   * Start real-time monitoring
   */
  startRealTimeMonitoring(): Promise<void>;

  /**
   * Stop real-time monitoring
   */
  stopRealTimeMonitoring(): Promise<void>;

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): Promise<{
    isRunning: boolean;
    uptime: number;
    metricsCollected: number;
    alertsTriggered: number;
    budgetViolations: number;
  }>;
}

/**
 * Performance collector interface for different services
 */
export interface IPerformanceCollector {
  /**
   * Collect metrics from service
   */
  collectMetrics(): Promise<PerformanceMetric[]>;

  /**
   * Get collector name
   */
  getName(): string;

  /**
   * Get supported metric types
   */
  getSupportedMetrics(): PerformanceMetricType[];

  /**
   * Start collecting
   */
  startCollection(interval: number): Promise<void>;

  /**
   * Stop collecting
   */
  stopCollection(): Promise<void>;
}

/**
 * Alert manager interface
 */
export interface IAlertManager {
  /**
   * Evaluate alerts against metrics
   */
  evaluateAlerts(metrics: PerformanceMetric[]): Promise<TriggeredAlert[]>;

  /**
   * Send alert notification
   */
  sendNotification(alert: TriggeredAlert, channels: AlertChannel[]): Promise<void>;

  /**
   * Process alert rules
   */
  processAlertRules(): Promise<void>;
}

/**
 * Budget manager interface
 */
export interface IBudgetManager {
  /**
   * Evaluate budgets against current metrics
   */
  evaluateBudgets(): Promise<BudgetViolation[]>;

  /**
   * Enforce budget limits
   */
  enforceBudgets(): Promise<void>;

  /**
   * Get budget status
   */
  getBudgetStatus(): Promise<Record<string, { status: 'ok' | 'warning' | 'violation'; usage: number }>>;
}
