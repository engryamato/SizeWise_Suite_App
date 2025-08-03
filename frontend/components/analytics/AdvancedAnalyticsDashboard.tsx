/**
 * Advanced Analytics Dashboard for SizeWise Suite
 *
 * Refactored modular analytics dashboard with improved separation of concerns
 *
 * Features:
 * - Real-time performance metrics
 * - Energy efficiency analytics
 * - Compliance tracking and reporting
 * - Cost analysis and ROI calculations
 * - Predictive analytics and forecasting
 * - Interactive data visualizations
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Download, Filter, Calendar, Settings, RefreshCw
} from 'lucide-react';

// Import modular components
import { useAnalyticsData } from './hooks/useAnalyticsData';
import { KPICards } from './components/KPICards';
import { EnergyAnalyticsTab } from './components/EnergyAnalyticsTab';
import { PerformanceAnalyticsTab } from './components/PerformanceAnalyticsTab';
import { AnalyticsFilters } from './types/AnalyticsTypes';

interface AdvancedAnalyticsDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Advanced Analytics Dashboard - Refactored modular component
 */
const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  className = '',
  autoRefresh = false,
  refreshInterval = 300000
}) => {
  // Use custom hook for data management
  const {
    data: analyticsData,
    isLoading,
    error,
    filters,
    setFilters,
    refresh,
    lastUpdated
  } = useAnalyticsData({
    autoRefresh,
    refreshInterval,
    initialFilters: {
      timeRange: '30d',
      metrics: ['energy', 'performance', 'financial']
    }
  });

  const [activeTab, setActiveTab] = useState('overview');

  // Handle filter changes
  const handleTimeRangeChange = useCallback((timeRange: string) => {
    setFilters({ timeRange });
  }, [setFilters]);

  const handleMetricsChange = useCallback((metrics: string[]) => {
    setFilters({ metrics });
  }, [setFilters]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mt-2 animate-pulse"></div>
          </div>
          <div className="flex space-x-3">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
        <KPICards data={null} isLoading={true} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="h-12 w-12 text-red-500 mx-auto mb-4">⚠️</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={refresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // No data state
  if (!analyticsData) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="h-12 w-12 text-gray-400 mx-auto mb-4">📊</div>
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <select
            value={filters.timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Select time range for analytics data"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <KPICards data={analyticsData} isLoading={isLoading} />

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="energy">Energy</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EnergyAnalyticsTab data={analyticsData.energy} isLoading={isLoading} />
            <PerformanceAnalyticsTab data={analyticsData.performance} isLoading={isLoading} />
          </div>
        </TabsContent>

        {/* Energy Tab */}
        <TabsContent value="energy" className="space-y-6">
          <EnergyAnalyticsTab data={analyticsData.energy} isLoading={isLoading} />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <PerformanceAnalyticsTab data={analyticsData.performance} isLoading={isLoading} />
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600">Compliance analytics coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default AdvancedAnalyticsDashboard;
