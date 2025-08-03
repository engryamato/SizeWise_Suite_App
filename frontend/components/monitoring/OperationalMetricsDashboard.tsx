/**
 * Operational Metrics Dashboard for SizeWise Suite
 * 
 * Comprehensive real-time monitoring dashboard that displays:
 * - System health and performance metrics
 * - HVAC calculation performance and accuracy
 * - User engagement and feature usage
 * - Offline-first sync performance
 * - Historical trend analysis
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Activity, Server, Zap, Users, Database, Wifi, WifiOff,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Clock, BarChart3, Gauge, Monitor, Settings, RefreshCw
} from 'lucide-react';

interface SystemHealth {
  overall_status: 'healthy' | 'warning' | 'critical';
  summary: {
    healthy: number;
    warning: number;
    critical: number;
    total: number;
  };
  checks: Array<{
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    duration_ms?: number;
  }>;
}

interface MetricsSummary {
  system_metrics: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
  };
  application_metrics: {
    request_rate: number;
    avg_response_time: number;
    error_rate: number;
  };
  hvac_metrics: {
    calculations_per_hour: number;
    avg_calculation_time: number;
    accuracy_score: number;
  };
}

interface DashboardData {
  timestamp: string;
  system_health: SystemHealth;
  metrics_summary: MetricsSummary;
  key_metrics: Record<string, any>;
}

const OperationalMetricsDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/system/overview');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    fetchDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchDashboardData, autoRefresh, refreshInterval]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  // Format metrics for display
  const formatMetric = (value: number, unit: string = '', decimals: number = 1) => {
    if (typeof value !== 'number') return 'N/A';
    return `${value.toFixed(decimals)}${unit}`;
  };

  // Chart colors
  const chartColors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#8B5CF6'
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load monitoring dashboard: {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="ml-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No dashboard data available</AlertDescription>
      </Alert>
    );
  }

  const { system_health, metrics_summary } = dashboardData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operational Metrics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time system health and performance monitoring
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Auto-refresh:</span>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {getStatusIcon(system_health.overall_status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {system_health.overall_status}
            </div>
            <p className="text-xs text-gray-600">
              {system_health.summary.healthy}/{system_health.summary.total} checks healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Server className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMetric(metrics_summary.system_metrics.cpu_usage, '%')}
            </div>
            <Progress 
              value={metrics_summary.system_metrics.cpu_usage} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Database className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMetric(metrics_summary.system_metrics.memory_usage, '%')}
            </div>
            <Progress 
              value={metrics_summary.system_metrics.memory_usage} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HVAC Calculations</CardTitle>
            <Zap className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMetric(metrics_summary.hvac_metrics.calculations_per_hour, '', 0)}
            </div>
            <p className="text-xs text-gray-600">per hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="hvac">HVAC Metrics</TabsTrigger>
          <TabsTrigger value="health">Health Checks</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Application Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Application Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Request Rate</span>
                  <span className="font-medium">
                    {formatMetric(metrics_summary.application_metrics.request_rate, ' req/s')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                  <span className="font-medium">
                    {formatMetric(metrics_summary.application_metrics.avg_response_time, 'ms')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Error Rate</span>
                  <span className="font-medium">
                    {formatMetric(metrics_summary.application_metrics.error_rate, '%', 2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* HVAC Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gauge className="h-5 w-5 mr-2" />
                  HVAC Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Calculations/Hour</span>
                  <span className="font-medium">
                    {formatMetric(metrics_summary.hvac_metrics.calculations_per_hour, '', 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Calculation Time</span>
                  <span className="font-medium">
                    {formatMetric(metrics_summary.hvac_metrics.avg_calculation_time, 's')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Accuracy Score</span>
                  <span className="font-medium">
                    {formatMetric(metrics_summary.hvac_metrics.accuracy_score, '%')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Resource Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU Usage</span>
                      <span>{formatMetric(metrics_summary.system_metrics.cpu_usage, '%')}</span>
                    </div>
                    <Progress value={metrics_summary.system_metrics.cpu_usage} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>{formatMetric(metrics_summary.system_metrics.memory_usage, '%')}</span>
                    </div>
                    <Progress value={metrics_summary.system_metrics.memory_usage} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Disk Usage</span>
                      <span>{formatMetric(metrics_summary.system_metrics.disk_usage, '%')}</span>
                    </div>
                    <Progress value={metrics_summary.system_metrics.disk_usage} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-600">
                  <Monitor className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Real-time charts will be displayed here</p>
                  <p className="text-sm">Connect to live metrics stream</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* HVAC Metrics Tab */}
        <TabsContent value="hvac" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Calculation Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-600">
                  <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>HVAC calculation metrics will be displayed here</p>
                  <p className="text-sm">Including accuracy trends and performance analysis</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Offline Sync Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-600">
                  <Wifi className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Offline sync metrics will be displayed here</p>
                  <p className="text-sm">Including sync success rates and data transfer efficiency</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Health Checks Tab */}
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Health Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {system_health.checks.map((check, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <div className="font-medium">{check.name}</div>
                        <div className="text-sm text-gray-600">{check.message}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={check.status === 'healthy' ? 'default' : 'destructive'}>
                        {check.status}
                      </Badge>
                      {check.duration_ms && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatMetric(check.duration_ms, 'ms', 0)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(dashboardData.timestamp).toLocaleString()}
        {autoRefresh && (
          <span className="ml-2">
            • Auto-refreshing every {refreshInterval / 1000}s
          </span>
        )}
      </div>
    </div>
  );
};

export default OperationalMetricsDashboard;
