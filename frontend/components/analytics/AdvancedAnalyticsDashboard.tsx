/**
 * Advanced Analytics Dashboard for SizeWise Suite
 * 
 * Comprehensive analytics and reporting system for project performance,
 * energy efficiency, and compliance tracking.
 * 
 * Features:
 * - Real-time performance metrics
 * - Energy efficiency analytics
 * - Compliance tracking and reporting
 * - Cost analysis and ROI calculations
 * - Predictive analytics and forecasting
 * - Interactive data visualizations
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  TrendingUp, TrendingDown, Zap, DollarSign, Leaf, 
  AlertTriangle, CheckCircle, Clock, BarChart3, 
  Download, Filter, Calendar, Settings 
} from 'lucide-react';

// Types for analytics data
interface AnalyticsData {
  performance: PerformanceMetrics;
  energy: EnergyAnalytics;
  compliance: ComplianceData;
  financial: FinancialAnalytics;
  projects: ProjectAnalytics[];
  trends: TrendData[];
  forecasts: ForecastData;
}

interface PerformanceMetrics {
  overall_score: number;
  efficiency_rating: string;
  capacity_utilization: number;
  system_reliability: number;
  maintenance_score: number;
  user_satisfaction: number;
  response_time: number;
  uptime_percentage: number;
}

interface EnergyAnalytics {
  total_consumption: number;
  consumption_trend: number;
  efficiency_improvement: number;
  carbon_footprint: number;
  renewable_percentage: number;
  cost_per_kwh: number;
  peak_demand: number;
  load_factor: number;
  monthly_data: MonthlyEnergyData[];
  hourly_profile: HourlyEnergyData[];
}

interface MonthlyEnergyData {
  month: string;
  consumption: number;
  cost: number;
  efficiency: number;
  carbon_emissions: number;
}

interface HourlyEnergyData {
  hour: number;
  consumption: number;
  demand: number;
  cost: number;
}

interface ComplianceData {
  overall_status: 'compliant' | 'warning' | 'non_compliant';
  standards: ComplianceStandard[];
  certifications: Certification[];
  audit_score: number;
  last_audit_date: string;
  next_audit_date: string;
  violations: Violation[];
}

interface ComplianceStandard {
  name: string;
  status: 'compliant' | 'warning' | 'non_compliant';
  score: number;
  requirements_met: number;
  total_requirements: number;
  last_checked: string;
}

interface Certification {
  name: string;
  status: 'active' | 'expiring' | 'expired';
  expiry_date: string;
  renewal_required: boolean;
}

interface Violation {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  standard: string;
  date_identified: string;
  status: 'open' | 'in_progress' | 'resolved';
  remediation_plan: string;
}

interface FinancialAnalytics {
  total_project_value: number;
  cost_savings: number;
  roi: number;
  payback_period: number;
  operational_costs: number;
  maintenance_costs: number;
  energy_costs: number;
  cost_breakdown: CostBreakdown[];
  savings_trend: SavingsTrend[];
}

interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: number;
}

interface SavingsTrend {
  period: string;
  savings: number;
  cumulative_savings: number;
  roi: number;
}

interface ProjectAnalytics {
  id: string;
  name: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  completion_percentage: number;
  budget_utilization: number;
  timeline_adherence: number;
  quality_score: number;
  risk_level: 'low' | 'medium' | 'high';
  team_size: number;
  start_date: string;
  expected_completion: string;
}

interface TrendData {
  metric: string;
  current_value: number;
  previous_value: number;
  trend_percentage: number;
  trend_direction: 'up' | 'down' | 'stable';
  data_points: { date: string; value: number }[];
}

interface ForecastData {
  energy_consumption: { period: string; predicted: number; confidence: number }[];
  cost_projections: { period: string; projected_cost: number; savings: number }[];
  performance_trends: { metric: string; forecast: number; trend: string }[];
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['energy', 'performance', 'financial']);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const loadAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call - replace with actual data fetching
      const data = await fetchAnalyticsData(selectedTimeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeRange]);

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Calculate key performance indicators
  const kpis = useMemo(() => {
    if (!analyticsData) return null;

    return {
      energy_efficiency: {
        value: analyticsData.energy.efficiency_improvement,
        trend: analyticsData.energy.efficiency_improvement > 0 ? 'up' : 'down',
        label: 'Energy Efficiency Improvement'
      },
      cost_savings: {
        value: analyticsData.financial.cost_savings,
        trend: analyticsData.financial.cost_savings > 0 ? 'up' : 'down',
        label: 'Annual Cost Savings'
      },
      system_performance: {
        value: analyticsData.performance.overall_score,
        trend: analyticsData.performance.overall_score > 80 ? 'up' : 'down',
        label: 'System Performance Score'
      },
      compliance_score: {
        value: analyticsData.compliance.audit_score,
        trend: analyticsData.compliance.audit_score > 90 ? 'up' : 'down',
        label: 'Compliance Score'
      }
    };
  }, [analyticsData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load analytics data</p>
        <Button onClick={loadAnalyticsData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
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
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(kpis).map(([key, kpi]) => (
            <Card key={key}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {key === 'cost_savings' ? `$${kpi.value.toLocaleString()}` : 
                       key.includes('score') || key.includes('efficiency') ? `${kpi.value}%` : 
                       kpi.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-2 rounded-full ${
                    kpi.trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {kpi.trend === 'up' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="energy">Energy</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Energy Consumption Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                  Energy Consumption Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.energy.monthly_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="consumption" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { metric: 'Efficiency', value: analyticsData.performance.overall_score },
                    { metric: 'Reliability', value: analyticsData.performance.system_reliability },
                    { metric: 'Maintenance', value: analyticsData.performance.maintenance_score },
                    { metric: 'Satisfaction', value: analyticsData.performance.user_satisfaction },
                    { metric: 'Uptime', value: analyticsData.performance.uptime_percentage },
                    { metric: 'Response', value: 100 - analyticsData.performance.response_time }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Performance" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Project Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Project Portfolio Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.projects.slice(0, 6).map((project) => (
                  <div key={project.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <Badge variant={
                        project.status === 'completed' ? 'default' :
                        project.status === 'in_progress' ? 'secondary' :
                        project.status === 'planning' ? 'outline' : 'destructive'
                      }>
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{project.completion_percentage}%</span>
                        </div>
                        <Progress value={project.completion_percentage} className="h-2" />
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Budget: {project.budget_utilization}%</span>
                        <span>Quality: {project.quality_score}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Energy Tab */}
        <TabsContent value="energy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Energy Cost Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Energy Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.energy.monthly_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="cost" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="consumption" stackId="2" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Load Profile */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Load Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.energy.hourly_profile}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="consumption" fill="#3B82F6" />
                    <Bar dataKey="demand" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Energy Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Consumption</p>
                    <p className="text-xl font-bold">{analyticsData.energy.total_consumption.toLocaleString()} kWh</p>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Carbon Footprint</p>
                    <p className="text-xl font-bold">{analyticsData.energy.carbon_footprint.toLocaleString()} kg CO₂</p>
                  </div>
                  <Leaf className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Renewable %</p>
                    <p className="text-xl font-bold">{analyticsData.energy.renewable_percentage}%</p>
                  </div>
                  <Leaf className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cost per kWh</p>
                    <p className="text-xl font-bold">${analyticsData.energy.cost_per_kwh.toFixed(3)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>System Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.trends.filter(t => t.metric.includes('performance'))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="current_value" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="previous_value" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall Score</span>
                      <span>{analyticsData.performance.overall_score}%</span>
                    </div>
                    <Progress value={analyticsData.performance.overall_score} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>System Reliability</span>
                      <span>{analyticsData.performance.system_reliability}%</span>
                    </div>
                    <Progress value={analyticsData.performance.system_reliability} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Capacity Utilization</span>
                      <span>{analyticsData.performance.capacity_utilization}%</span>
                    </div>
                    <Progress value={analyticsData.performance.capacity_utilization} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>User Satisfaction</span>
                      <span>{analyticsData.performance.user_satisfaction}%</span>
                    </div>
                    <Progress value={analyticsData.performance.user_satisfaction} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.compliance.standards.map((standard, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{standard.name}</h4>
                        <p className="text-sm text-gray-600">
                          {standard.requirements_met}/{standard.total_requirements} requirements met
                        </p>
                      </div>
                      <Badge variant={
                        standard.status === 'compliant' ? 'default' :
                        standard.status === 'warning' ? 'secondary' : 'destructive'
                      }>
                        {standard.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Violations and Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                  Active Violations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.compliance.violations.filter(v => v.status !== 'resolved').map((violation) => (
                    <div key={violation.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{violation.description}</h4>
                        <Badge variant={
                          violation.severity === 'critical' ? 'destructive' :
                          violation.severity === 'high' ? 'secondary' : 'outline'
                        }>
                          {violation.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{violation.standard}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Identified: {new Date(violation.date_identified).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.financial.cost_breakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {analyticsData.financial.cost_breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Savings Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Savings Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.financial.savings_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="savings" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="cumulative_savings" stackId="2" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Project Value</p>
                    <p className="text-xl font-bold">${analyticsData.financial.total_project_value.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Annual Savings</p>
                    <p className="text-xl font-bold">${analyticsData.financial.cost_savings.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">ROI</p>
                    <p className="text-xl font-bold">{analyticsData.financial.roi.toFixed(1)}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Payback Period</p>
                    <p className="text-xl font-bold">{analyticsData.financial.payback_period.toFixed(1)} years</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Mock data fetching function
async function fetchAnalyticsData(timeRange: string): Promise<AnalyticsData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock data - replace with actual API call
  return {
    performance: {
      overall_score: 87,
      efficiency_rating: 'A+',
      capacity_utilization: 78,
      system_reliability: 94,
      maintenance_score: 82,
      user_satisfaction: 91,
      response_time: 2.3,
      uptime_percentage: 99.2
    },
    energy: {
      total_consumption: 125000,
      consumption_trend: -8.5,
      efficiency_improvement: 12.3,
      carbon_footprint: 45000,
      renewable_percentage: 35,
      cost_per_kwh: 0.125,
      peak_demand: 850,
      load_factor: 0.72,
      monthly_data: [
        { month: 'Jan', consumption: 10500, cost: 1312, efficiency: 85, carbon_emissions: 3780 },
        { month: 'Feb', consumption: 9800, cost: 1225, efficiency: 87, carbon_emissions: 3528 },
        { month: 'Mar', consumption: 10200, cost: 1275, efficiency: 86, carbon_emissions: 3672 },
        { month: 'Apr', consumption: 9500, cost: 1187, efficiency: 89, carbon_emissions: 3420 },
        { month: 'May', consumption: 10800, cost: 1350, efficiency: 84, carbon_emissions: 3888 },
        { month: 'Jun', consumption: 11200, cost: 1400, efficiency: 83, carbon_emissions: 4032 }
      ],
      hourly_profile: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        consumption: Math.random() * 500 + 200,
        demand: Math.random() * 400 + 150,
        cost: Math.random() * 60 + 20
      }))
    },
    compliance: {
      overall_status: 'compliant' as const,
      standards: [
        { name: 'ASHRAE 90.1', status: 'compliant' as const, score: 95, requirements_met: 19, total_requirements: 20, last_checked: '2024-01-15' },
        { name: 'IECC 2021', status: 'compliant' as const, score: 92, requirements_met: 23, total_requirements: 25, last_checked: '2024-01-10' },
        { name: 'LEED v4.1', status: 'warning' as const, score: 78, requirements_met: 31, total_requirements: 40, last_checked: '2024-01-05' }
      ],
      certifications: [
        { name: 'ENERGY STAR', status: 'active' as const, expiry_date: '2025-06-30', renewal_required: false },
        { name: 'LEED Gold', status: 'expiring' as const, expiry_date: '2024-12-31', renewal_required: true }
      ],
      audit_score: 89,
      last_audit_date: '2024-01-01',
      next_audit_date: '2024-07-01',
      violations: [
        {
          id: '1',
          severity: 'medium' as const,
          description: 'Ventilation rate below minimum requirement in Zone 3',
          standard: 'ASHRAE 62.1',
          date_identified: '2024-01-20',
          status: 'in_progress' as const,
          remediation_plan: 'Adjust damper settings and increase fan speed'
        }
      ]
    },
    financial: {
      total_project_value: 2500000,
      cost_savings: 125000,
      roi: 15.8,
      payback_period: 6.3,
      operational_costs: 450000,
      maintenance_costs: 75000,
      energy_costs: 180000,
      cost_breakdown: [
        { category: 'Energy', amount: 180000, percentage: 40, trend: -5.2 },
        { category: 'Maintenance', amount: 75000, percentage: 17, trend: 2.1 },
        { category: 'Operations', amount: 120000, percentage: 27, trend: -1.8 },
        { category: 'Other', amount: 70000, percentage: 16, trend: 0.5 }
      ],
      savings_trend: [
        { period: 'Q1', savings: 28000, cumulative_savings: 28000, roi: 12.5 },
        { period: 'Q2', savings: 32000, cumulative_savings: 60000, roi: 14.2 },
        { period: 'Q3', savings: 35000, cumulative_savings: 95000, roi: 15.1 },
        { period: 'Q4', savings: 30000, cumulative_savings: 125000, roi: 15.8 }
      ]
    },
    projects: [
      {
        id: '1',
        name: 'HVAC System Upgrade - Building A',
        status: 'in_progress' as const,
        completion_percentage: 75,
        budget_utilization: 68,
        timeline_adherence: 92,
        quality_score: 88,
        risk_level: 'low' as const,
        team_size: 8,
        start_date: '2024-01-15',
        expected_completion: '2024-03-30'
      },
      {
        id: '2',
        name: 'Energy Management System Implementation',
        status: 'completed' as const,
        completion_percentage: 100,
        budget_utilization: 95,
        timeline_adherence: 98,
        quality_score: 94,
        risk_level: 'low' as const,
        team_size: 5,
        start_date: '2023-11-01',
        expected_completion: '2024-01-31'
      }
    ],
    trends: [
      {
        metric: 'Energy Efficiency',
        current_value: 87,
        previous_value: 82,
        trend_percentage: 6.1,
        trend_direction: 'up' as const,
        data_points: []
      },
      {
        metric: 'System Performance',
        current_value: 94,
        previous_value: 91,
        trend_percentage: 3.3,
        trend_direction: 'up' as const,
        data_points: []
      }
    ],
    forecasts: {
      energy_consumption: [
        { period: 'Next Month', predicted: 10200, confidence: 0.85 },
        { period: 'Next Quarter', predicted: 31500, confidence: 0.78 },
        { period: 'Next Year', predicted: 118000, confidence: 0.65 }
      ],
      cost_projections: [
        { period: 'Next Month', projected_cost: 1275, savings: 125 },
        { period: 'Next Quarter', projected_cost: 3937, savings: 393 },
        { period: 'Next Year', projected_cost: 14750, savings: 1475 }
      ],
      performance_trends: [
        { metric: 'Overall Efficiency', forecast: 89, trend: 'improving' },
        { metric: 'System Reliability', forecast: 96, trend: 'stable' },
        { metric: 'User Satisfaction', forecast: 93, trend: 'improving' }
      ]
    }
  };
}

export default AdvancedAnalyticsDashboard;
