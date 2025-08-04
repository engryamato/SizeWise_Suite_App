/**
 * KPI Cards Component for Analytics Dashboard
 * 
 * Displays key performance indicators in a card layout with trend indicators
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { 
  TrendingUp, TrendingDown, Zap, DollarSign, Leaf, 
  AlertTriangle, CheckCircle, Clock, BarChart3 
} from 'lucide-react';
import { AnalyticsData, KPIData } from '../types/AnalyticsTypes';

interface KPICardsProps {
  data: AnalyticsData | null;
  isLoading?: boolean;
}

/**
 * KPI Cards component
 */
export const KPICards: React.FC<KPICardsProps> = ({ data, isLoading = false }) => {
  // Handle loading state
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  // Generate KPI data from analytics data
  const kpis: KPIData[] = [
    {
      title: 'Energy Efficiency',
      value: `${data.energy.efficiency_score}%`,
      change: `${data.energy.consumption_trend > 0 ? '+' : ''}${data.energy.consumption_trend.toFixed(1)}%`,
      trend: data.energy.consumption_trend > 0 ? 'up' : data.energy.consumption_trend < 0 ? 'down' : 'stable',
      icon: 'zap',
      color: data.energy.efficiency_score >= 85 ? 'green' : data.energy.efficiency_score >= 70 ? 'yellow' : 'red'
    },
    {
      title: 'System Performance',
      value: `${data.performance.overall_score}%`,
      change: `${data.performance.system_reliability >= 95 ? '+' : ''}${(data.performance.system_reliability - 90).toFixed(1)}%`,
      trend: data.performance.system_reliability >= 95 ? 'up' : data.performance.system_reliability >= 90 ? 'stable' : 'down',
      icon: 'bar-chart',
      color: data.performance.overall_score >= 90 ? 'green' : data.performance.overall_score >= 75 ? 'yellow' : 'red'
    },
    {
      title: 'Cost Savings',
      value: `$${(data.financial.operational_savings / 1000).toFixed(1)}K`,
      change: `${data.financial.cost_trend > 0 ? '+' : ''}${data.financial.cost_trend.toFixed(1)}%`,
      trend: data.financial.cost_trend < 0 ? 'up' : data.financial.cost_trend > 0 ? 'down' : 'stable',
      icon: 'dollar-sign',
      color: data.financial.operational_savings >= 15000 ? 'green' : data.financial.operational_savings >= 10000 ? 'yellow' : 'red'
    },
    {
      title: 'Compliance Score',
      value: `${data.compliance.overall_score}%`,
      change: `${data.compliance.violations.length === 0 ? '+5.0' : `-${data.compliance.violations.length * 2}.0`}%`,
      trend: data.compliance.violations.length === 0 ? 'up' : data.compliance.violations.length <= 2 ? 'stable' : 'down',
      icon: 'check-circle',
      color: data.compliance.overall_score >= 95 ? 'green' : data.compliance.overall_score >= 85 ? 'yellow' : 'red'
    },
    {
      title: 'Carbon Footprint',
      value: `${data.energy.carbon_footprint.toFixed(1)} tons`,
      change: `${data.energy.renewable_percentage >= 30 ? '-' : '+'}${Math.abs(data.energy.renewable_percentage - 25).toFixed(1)}%`,
      trend: data.energy.renewable_percentage >= 30 ? 'up' : data.energy.renewable_percentage >= 20 ? 'stable' : 'down',
      icon: 'leaf',
      color: data.energy.carbon_footprint <= 3 ? 'green' : data.energy.carbon_footprint <= 5 ? 'yellow' : 'red'
    },
    {
      title: 'ROI',
      value: `${data.financial.roi.toFixed(1)}%`,
      change: `${data.financial.payback_period <= 3 ? '+' : '-'}${Math.abs(data.financial.payback_period - 3).toFixed(1)}%`,
      trend: data.financial.roi >= 15 ? 'up' : data.financial.roi >= 10 ? 'stable' : 'down',
      icon: 'trending-up',
      color: data.financial.roi >= 15 ? 'green' : data.financial.roi >= 10 ? 'yellow' : 'red'
    }
  ];

  /**
   * Get icon component for KPI
   */
  const getIcon = (iconName: string) => {
    const iconProps = { className: "h-5 w-5" };
    
    switch (iconName) {
      case 'zap':
        return <Zap {...iconProps} />;
      case 'bar-chart':
        return <BarChart3 {...iconProps} />;
      case 'dollar-sign':
        return <DollarSign {...iconProps} />;
      case 'check-circle':
        return <CheckCircle {...iconProps} />;
      case 'leaf':
        return <Leaf {...iconProps} />;
      case 'trending-up':
        return <TrendingUp {...iconProps} />;
      case 'alert-triangle':
        return <AlertTriangle {...iconProps} />;
      case 'clock':
        return <Clock {...iconProps} />;
      default:
        return <BarChart3 {...iconProps} />;
    }
  };

  /**
   * Get trend icon
   */
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  /**
   * Get color classes for KPI
   */
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          value: 'text-green-900 dark:text-green-100'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          value: 'text-yellow-900 dark:text-yellow-100'
        };
      case 'red':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          value: 'text-red-900 dark:text-red-100'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-200 dark:border-gray-800',
          icon: 'text-gray-600 dark:text-gray-400',
          value: 'text-gray-900 dark:text-gray-100'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {kpis.map((kpi, index) => {
        const colorClasses = getColorClasses(kpi.color);
        
        return (
          <Card 
            key={index} 
            className={`transition-all duration-200 hover:shadow-lg ${colorClasses.bg} ${colorClasses.border}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {kpi.title}
                  </p>
                  <p className={`text-2xl font-bold ${colorClasses.value}`}>
                    {kpi.value}
                  </p>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(kpi.trend)}
                    <span className={`text-xs font-medium ${
                      kpi.trend === 'up' ? 'text-green-600' : 
                      kpi.trend === 'down' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {kpi.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses.bg} ${colorClasses.icon}`}>
                  {getIcon(kpi.icon)}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default KPICards;
