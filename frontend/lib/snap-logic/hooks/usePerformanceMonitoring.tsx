/**
 * Performance Monitoring React Hook
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * React hook for real-time performance monitoring, alerting,
 * budget enforcement, and dashboard management.
 * 
 * @fileoverview Performance monitoring React hook
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import {
  IPerformanceMonitoringService,
  PerformanceMetric,
  PerformanceMetricType,
  PerformanceAlert,
  PerformanceBudget,
  PerformanceDashboard,
  PerformanceReport,
  PerformanceMetricSummary,
  TriggeredAlert,
  BudgetViolation,
  TimeRange,
  DashboardType,
  PerformanceMonitoringConfig
} from '../core/interfaces/IPerformanceMonitoringService';

/**
 * Performance monitoring context interface
 */
interface PerformanceMonitoringContextValue {
  performanceService: IPerformanceMonitoringService;
}

/**
 * Performance monitoring context
 */
const PerformanceMonitoringContext = createContext<PerformanceMonitoringContextValue | null>(null);

/**
 * Performance monitoring provider component
 */
export const PerformanceMonitoringProvider: React.FC<{
  children: React.ReactNode;
  performanceService: IPerformanceMonitoringService;
  config?: PerformanceMonitoringConfig;
}> = ({ children, performanceService, config }) => {
  useEffect(() => {
    performanceService.initialize(config);
  }, [performanceService, config]);

  return (
    <PerformanceMonitoringContext.Provider value={{ performanceService }}>
      {children}
    </PerformanceMonitoringContext.Provider>
  );
};

/**
 * Hook return type
 */
export interface UsePerformanceMonitoringReturn {
  // Service access
  service: IPerformanceMonitoringService;

  // Metrics
  recordMetric: (metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) => Promise<string>;
  getMetrics: (type: PerformanceMetricType, timeRange: TimeRange) => Promise<PerformanceMetric[]>;
  getMetricSummary: (type: PerformanceMetricType, timeRange: TimeRange) => Promise<PerformanceMetricSummary>;

  // Alerts
  alerts: PerformanceAlert[];
  triggeredAlerts: TriggeredAlert[];
  createAlert: (alert: Omit<PerformanceAlert, 'id'>) => Promise<string>;
  acknowledgeAlert: (alertId: string, userId: string) => Promise<void>;

  // Budgets
  budgets: PerformanceBudget[];
  budgetViolations: BudgetViolation[];
  createBudget: (budget: Omit<PerformanceBudget, 'id'>) => Promise<string>;
  checkBudgetViolations: () => Promise<BudgetViolation[]>;

  // Dashboards
  dashboards: PerformanceDashboard[];
  createDashboard: (dashboard: Omit<PerformanceDashboard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  getDashboard: (dashboardId: string) => Promise<PerformanceDashboard>;

  // Reports
  generateReport: (title: string, timeRange: TimeRange) => Promise<PerformanceReport>;

  // Monitoring control
  monitoringStatus: {
    isRunning: boolean;
    uptime: number;
    metricsCollected: number;
    alertsTriggered: number;
    budgetViolations: number;
  } | null;
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;

  // State
  isLoading: boolean;
  error: string | null;
}

/**
 * Main usePerformanceMonitoring hook
 */
export const usePerformanceMonitoring = (): UsePerformanceMonitoringReturn => {
  const context = useContext(PerformanceMonitoringContext);
  
  if (!context) {
    throw new Error('usePerformanceMonitoring must be used within a PerformanceMonitoringProvider');
  }

  const { performanceService } = context;

  // State management
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredAlert[]>([]);
  const [budgets, setBudgets] = useState<PerformanceBudget[]>([]);
  const [budgetViolations, setBudgetViolations] = useState<BudgetViolation[]>([]);
  const [dashboards, setDashboards] = useState<PerformanceDashboard[]>([]);
  const [monitoringStatus, setMonitoringStatus] = useState<{
    isRunning: boolean;
    uptime: number;
    metricsCollected: number;
    alertsTriggered: number;
    budgetViolations: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadPerformanceData();
  }, []);

  // Setup periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        alertsData,
        triggeredAlertsData,
        budgetsData,
        budgetViolationsData,
        dashboardsData,
        statusData
      ] = await Promise.all([
        performanceService.getAlerts(),
        performanceService.getTriggeredAlerts(),
        performanceService.getBudgets(),
        performanceService.checkBudgetViolations(),
        performanceService.getDashboards(),
        performanceService.getMonitoringStatus()
      ]);

      setAlerts(alertsData);
      setTriggeredAlerts(triggeredAlertsData);
      setBudgets(budgetsData);
      setBudgetViolations(budgetViolationsData);
      setDashboards(dashboardsData);
      setMonitoringStatus(statusData);

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async (): Promise<void> => {
    try {
      const [
        triggeredAlertsData,
        budgetViolationsData,
        statusData
      ] = await Promise.all([
        performanceService.getTriggeredAlerts(),
        performanceService.checkBudgetViolations(),
        performanceService.getMonitoringStatus()
      ]);

      setTriggeredAlerts(triggeredAlertsData);
      setBudgetViolations(budgetViolationsData);
      setMonitoringStatus(statusData);

    } catch (err) {
      console.warn('Failed to refresh performance data:', err);
    }
  };

  // Metrics
  const recordMetric = useCallback(async (
    metric: Omit<PerformanceMetric, 'id' | 'timestamp'>
  ): Promise<string> => {
    try {
      return await performanceService.recordMetric(metric);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [performanceService]);

  const getMetrics = useCallback(async (
    type: PerformanceMetricType,
    timeRange: TimeRange
  ): Promise<PerformanceMetric[]> => {
    try {
      return await performanceService.getMetrics(type, timeRange);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [performanceService]);

  const getMetricSummary = useCallback(async (
    type: PerformanceMetricType,
    timeRange: TimeRange
  ): Promise<PerformanceMetricSummary> => {
    try {
      return await performanceService.getMetricSummary(type, timeRange);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [performanceService]);

  // Alerts
  const createAlert = useCallback(async (
    alert: Omit<PerformanceAlert, 'id'>
  ): Promise<string> => {
    try {
      const alertId = await performanceService.createAlert(alert);
      const updatedAlerts = await performanceService.getAlerts();
      setAlerts(updatedAlerts);
      return alertId;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [performanceService]);

  const acknowledgeAlert = useCallback(async (
    alertId: string,
    userId: string
  ): Promise<void> => {
    try {
      await performanceService.acknowledgeAlert(alertId, userId);
      const updatedTriggeredAlerts = await performanceService.getTriggeredAlerts();
      setTriggeredAlerts(updatedTriggeredAlerts);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [performanceService]);

  // Budgets
  const createBudget = useCallback(async (
    budget: Omit<PerformanceBudget, 'id'>
  ): Promise<string> => {
    try {
      const budgetId = await performanceService.createBudget(budget);
      const updatedBudgets = await performanceService.getBudgets();
      setBudgets(updatedBudgets);
      return budgetId;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [performanceService]);

  const checkBudgetViolations = useCallback(async (): Promise<BudgetViolation[]> => {
    try {
      const violations = await performanceService.checkBudgetViolations();
      setBudgetViolations(violations);
      return violations;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [performanceService]);

  // Dashboards
  const createDashboard = useCallback(async (
    dashboard: Omit<PerformanceDashboard, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    try {
      const dashboardId = await performanceService.createDashboard(dashboard);
      const updatedDashboards = await performanceService.getDashboards();
      setDashboards(updatedDashboards);
      return dashboardId;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [performanceService]);

  const getDashboard = useCallback(async (
    dashboardId: string
  ): Promise<PerformanceDashboard> => {
    try {
      return await performanceService.getDashboard(dashboardId);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [performanceService]);

  // Reports
  const generateReport = useCallback(async (
    title: string,
    timeRange: TimeRange
  ): Promise<PerformanceReport> => {
    try {
      return await performanceService.generateReport(title, timeRange);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [performanceService]);

  // Monitoring control
  const startMonitoring = useCallback(async (): Promise<void> => {
    try {
      await performanceService.startRealTimeMonitoring();
      const status = await performanceService.getMonitoringStatus();
      setMonitoringStatus(status);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [performanceService]);

  const stopMonitoring = useCallback(async (): Promise<void> => {
    try {
      await performanceService.stopRealTimeMonitoring();
      const status = await performanceService.getMonitoringStatus();
      setMonitoringStatus(status);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [performanceService]);

  return {
    // Service access
    service: performanceService,

    // Metrics
    recordMetric,
    getMetrics,
    getMetricSummary,

    // Alerts
    alerts,
    triggeredAlerts,
    createAlert,
    acknowledgeAlert,

    // Budgets
    budgets,
    budgetViolations,
    createBudget,
    checkBudgetViolations,

    // Dashboards
    dashboards,
    createDashboard,
    getDashboard,

    // Reports
    generateReport,

    // Monitoring control
    monitoringStatus,
    startMonitoring,
    stopMonitoring,

    // State
    isLoading,
    error
  };
};

/**
 * Hook for metric recording with automatic tagging
 */
export const useMetricRecording = (source: string, defaultTags: Record<string, string> = {}) => {
  const { recordMetric } = usePerformanceMonitoring();

  const recordWithDefaults = useCallback(async (
    type: PerformanceMetricType,
    value: number,
    unit: string,
    additionalTags: Record<string, string> = {}
  ): Promise<string> => {
    return await recordMetric({
      type,
      value,
      unit,
      source,
      tags: { ...defaultTags, ...additionalTags }
    });
  }, [recordMetric, source, defaultTags]);

  return { recordMetric: recordWithDefaults };
};

/**
 * Hook for dashboard management
 */
export const useDashboard = (dashboardId?: string) => {
  const { getDashboard, dashboards } = usePerformanceMonitoring();
  const [dashboard, setDashboard] = useState<PerformanceDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (dashboardId) {
      loadDashboard(dashboardId);
    }
  }, [dashboardId]);

  const loadDashboard = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      const dashboardData = await getDashboard(id);
      setDashboard(dashboardData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    dashboard,
    dashboards,
    isLoading,
    refreshDashboard: dashboardId ? () => loadDashboard(dashboardId) : undefined
  };
};
