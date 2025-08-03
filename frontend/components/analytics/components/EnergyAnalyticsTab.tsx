/**
 * Energy Analytics Tab Component
 * 
 * Displays energy consumption, efficiency metrics, and cost analysis
 */

import React from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { Zap, TrendingUp, TrendingDown, Leaf } from 'lucide-react';
import { EnergyAnalytics } from '../types/AnalyticsTypes';

interface EnergyAnalyticsTabProps {
  data: EnergyAnalytics;
  isLoading?: boolean;
}

/**
 * Energy Analytics Tab component
 */
export const EnergyAnalyticsTab: React.FC<EnergyAnalyticsTabProps> = ({ 
  data, 
  isLoading = false 
}) => {
  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Prepare chart data
  const consumptionChartData = data.consumption_history.map(point => ({
    date: new Date(point.date).toLocaleDateString(),
    consumption: point.consumption,
    cost: point.cost,
    temperature: point.temperature
  }));

  const breakdownChartData = data.energy_breakdown.map(item => ({
    name: item.category,
    value: item.consumption,
    cost: item.cost,
    percentage: item.percentage
  }));

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
      {/* Energy Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Consumption</p>
                <p className="text-2xl font-bold">{data.total_consumption.toLocaleString()} kWh</p>
                <div className="flex items-center mt-1">
                  {data.consumption_trend < 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${data.consumption_trend < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(data.consumption_trend).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Efficiency Score</p>
                <p className="text-2xl font-bold">{data.efficiency_score}%</p>
                <Progress value={data.efficiency_score} className="mt-2" />
              </div>
              <div className="text-right">
                <Badge variant={data.efficiency_score >= 85 ? "default" : "secondary"}>
                  {data.efficiency_score >= 85 ? 'Excellent' : data.efficiency_score >= 70 ? 'Good' : 'Needs Improvement'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cost per kWh</p>
                <p className="text-2xl font-bold">${data.cost_per_kwh.toFixed(3)}</p>
                <p className="text-sm text-gray-500">Peak: ${data.peak_demand} kW</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Off-Peak Usage</p>
                <p className="text-lg font-semibold">{data.off_peak_usage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Carbon Footprint</p>
                <p className="text-2xl font-bold">{data.carbon_footprint.toFixed(1)} tons</p>
                <div className="flex items-center mt-1">
                  <Leaf className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">{data.renewable_percentage}% renewable</span>
                </div>
              </div>
              <div className="text-center">
                <Progress value={data.renewable_percentage} className="w-12 h-12 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consumption Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Energy Consumption Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={consumptionChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} ${name === 'consumption' ? 'kWh' : name === 'cost' ? '$' : '°F'}`,
                    name === 'consumption' ? 'Consumption' : name === 'cost' ? 'Cost' : 'Temperature'
                  ]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="consumption" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Energy Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Energy Consumption Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={breakdownChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {breakdownChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} kWh`, 'Consumption']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost Analysis Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={breakdownChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                <Legend />
                <Bar dataKey="cost" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Efficiency Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Efficiency Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Overall Efficiency</span>
                  <span className="text-sm text-gray-600">{data.efficiency_score}%</span>
                </div>
                <Progress value={data.efficiency_score} />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Renewable Energy</span>
                  <span className="text-sm text-gray-600">{data.renewable_percentage}%</span>
                </div>
                <Progress value={data.renewable_percentage} />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Off-Peak Usage</span>
                  <span className="text-sm text-gray-600">{data.off_peak_usage}%</span>
                </div>
                <Progress value={data.off_peak_usage} />
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Seasonal Variation</h4>
                <p className="text-sm text-gray-600">
                  Energy consumption varies by {data.seasonal_variation}% throughout the year, 
                  with peak usage during summer months.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnergyAnalyticsTab;
