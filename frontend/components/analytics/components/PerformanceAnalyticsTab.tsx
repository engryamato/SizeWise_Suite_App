/**
 * Performance Analytics Tab Component
 * 
 * Displays system performance metrics, reliability data, and operational insights
 */

import React from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { 
  BarChart3, Clock, CheckCircle, AlertTriangle, 
  TrendingUp, TrendingDown, Zap, Users 
} from 'lucide-react';
import { PerformanceMetrics } from '../types/AnalyticsTypes';

interface PerformanceAnalyticsTabProps {
  data: PerformanceMetrics;
  isLoading?: boolean;
}

/**
 * Performance Analytics Tab component
 */
export const PerformanceAnalyticsTab: React.FC<PerformanceAnalyticsTabProps> = ({ 
  data, 
  isLoading = false 
}) => {
  // Prepare radar chart data
  const radarData = [
    { subject: 'Overall Score', A: data.overall_score, fullMark: 100 },
    { subject: 'Efficiency', A: data.capacity_utilization, fullMark: 100 },
    { subject: 'Reliability', A: data.system_reliability, fullMark: 100 },
    { subject: 'Maintenance', A: data.maintenance_score, fullMark: 100 },
    { subject: 'Satisfaction', A: data.user_satisfaction, fullMark: 100 },
    { subject: 'Uptime', A: data.uptime_percentage, fullMark: 100 }
  ];

  // Prepare performance trend data (mock data for demonstration)
  const trendData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString(),
      overall: Math.floor(Math.random() * 10) + data.overall_score - 5,
      reliability: Math.floor(Math.random() * 8) + data.system_reliability - 4,
      efficiency: Math.floor(Math.random() * 12) + data.capacity_utilization - 6,
      satisfaction: Math.floor(Math.random() * 6) + data.user_satisfaction - 3
    };
  });

  // Performance metrics for bar chart
  const metricsData = [
    { name: 'Overall Score', value: data.overall_score, target: 90 },
    { name: 'Efficiency', value: data.capacity_utilization, target: 85 },
    { name: 'Reliability', value: data.system_reliability, target: 95 },
    { name: 'Maintenance', value: data.maintenance_score, target: 80 },
    { name: 'Satisfaction', value: data.user_satisfaction, target: 88 },
    { name: 'Uptime', value: data.uptime_percentage, target: 99 }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Score</p>
                <p className="text-2xl font-bold">{data.overall_score}%</p>
                <Badge variant={data.overall_score >= 90 ? "default" : "secondary"}>
                  {data.overall_score >= 90 ? 'Excellent' : data.overall_score >= 75 ? 'Good' : 'Needs Improvement'}
                </Badge>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Reliability</p>
                <p className="text-2xl font-bold">{data.system_reliability}%</p>
                <div className="flex items-center mt-1">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Stable</span>
                </div>
              </div>
              <div className="text-center">
                <Progress value={data.system_reliability} className="w-12 h-12 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Time</p>
                <p className="text-2xl font-bold">{data.response_time.toFixed(1)}s</p>
                <p className="text-sm text-gray-500">Avg: {data.throughput} req/min</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">User Satisfaction</p>
                <p className="text-2xl font-bold">{data.user_satisfaction}%</p>
                <div className="flex items-center mt-1">
                  <Users className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600">High</span>
                </div>
              </div>
              <div className="text-center">
                <Progress value={data.user_satisfaction} className="w-12 h-12 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Performance"
                  dataKey="A"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[60, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="overall" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Overall"
                />
                <Line 
                  type="monotone" 
                  dataKey="reliability" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Reliability"
                />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#ffc658" 
                  strokeWidth={2}
                  name="Efficiency"
                />
                <Line 
                  type="monotone" 
                  dataKey="satisfaction" 
                  stroke="#ff7300" 
                  strokeWidth={2}
                  name="Satisfaction"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Metrics vs Targets */}
        <Card>
          <CardHeader>
            <CardTitle>Performance vs Targets</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Current" />
                <Bar dataKey="target" fill="#82ca9d" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* System Health Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>System Health Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-sm text-gray-600">{data.uptime_percentage}%</span>
                </div>
                <Progress value={data.uptime_percentage} />
                <p className="text-xs text-gray-500 mt-1">
                  {((data.uptime_percentage / 100) * 24 * 30).toFixed(1)} hours this month
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Error Rate</span>
                  <span className="text-sm text-gray-600">{(data.error_rate * 100).toFixed(2)}%</span>
                </div>
                <Progress value={100 - (data.error_rate * 100)} />
                <p className="text-xs text-gray-500 mt-1">
                  {data.error_rate < 0.01 ? 'Excellent' : data.error_rate < 0.05 ? 'Good' : 'Needs attention'}
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Capacity Utilization</span>
                  <span className="text-sm text-gray-600">{data.capacity_utilization}%</span>
                </div>
                <Progress value={data.capacity_utilization} />
                <p className="text-xs text-gray-500 mt-1">
                  {data.capacity_utilization > 85 ? 'High utilization' : 'Optimal range'}
                </p>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Maintenance Score</h4>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{data.maintenance_score}%</span>
                  <Badge variant={data.maintenance_score >= 80 ? "default" : "destructive"}>
                    {data.maintenance_score >= 80 ? 'On Track' : 'Attention Needed'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Regular maintenance schedule is {data.maintenance_score >= 80 ? 'being followed' : 'behind schedule'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceAnalyticsTab;
