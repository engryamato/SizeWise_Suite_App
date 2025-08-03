/**
 * Analytics Types for SizeWise Suite
 * 
 * Comprehensive type definitions for analytics and reporting system
 */

// Main analytics data structure
export interface AnalyticsData {
  performance: PerformanceMetrics;
  energy: EnergyAnalytics;
  compliance: ComplianceData;
  financial: FinancialAnalytics;
  projects: ProjectAnalytics[];
  trends: TrendData[];
  forecasts: ForecastData;
}

// Performance metrics
export interface PerformanceMetrics {
  overall_score: number;
  efficiency_rating: string;
  capacity_utilization: number;
  system_reliability: number;
  maintenance_score: number;
  user_satisfaction: number;
  response_time: number;
  uptime_percentage: number;
  error_rate: number;
  throughput: number;
}

// Energy analytics
export interface EnergyAnalytics {
  total_consumption: number;
  consumption_trend: number;
  efficiency_score: number;
  cost_per_kwh: number;
  carbon_footprint: number;
  renewable_percentage: number;
  peak_demand: number;
  off_peak_usage: number;
  seasonal_variation: number;
  energy_breakdown: EnergyBreakdown[];
  consumption_history: ConsumptionDataPoint[];
}

export interface EnergyBreakdown {
  category: string;
  consumption: number;
  percentage: number;
  cost: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ConsumptionDataPoint {
  date: string;
  consumption: number;
  cost: number;
  temperature?: number;
  occupancy?: number;
}

// Compliance data
export interface ComplianceData {
  overall_score: number;
  ashrae_compliance: number;
  energy_code_compliance: number;
  safety_compliance: number;
  environmental_compliance: number;
  violations: ComplianceViolation[];
  certifications: Certification[];
  audit_results: AuditResult[];
}

export interface ComplianceViolation {
  id: string;
  type: 'energy' | 'safety' | 'environmental' | 'building_code';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  detected_date: string;
  status: 'open' | 'in_progress' | 'resolved';
  remediation_plan?: string;
  estimated_cost?: number;
}

export interface Certification {
  name: string;
  status: 'active' | 'expired' | 'pending';
  expiry_date: string;
  issuing_authority: string;
  score?: number;
}

export interface AuditResult {
  audit_type: string;
  date: string;
  score: number;
  findings: string[];
  recommendations: string[];
}

// Financial analytics
export interface FinancialAnalytics {
  total_cost: number;
  cost_trend: number;
  roi: number;
  payback_period: number;
  operational_savings: number;
  maintenance_costs: number;
  energy_costs: number;
  capital_expenditure: number;
  cost_breakdown: CostBreakdown[];
  savings_opportunities: SavingsOpportunity[];
}

export interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  budget_variance?: number;
}

export interface SavingsOpportunity {
  id: string;
  description: string;
  potential_savings: number;
  implementation_cost: number;
  payback_period: number;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

// Project analytics
export interface ProjectAnalytics {
  id: string;
  name: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  progress: number;
  budget: number;
  actual_cost: number;
  estimated_completion: string;
  energy_impact: number;
  roi_projection: number;
  risk_level: 'low' | 'medium' | 'high';
  milestones: ProjectMilestone[];
}

export interface ProjectMilestone {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  due_date: string;
  completion_date?: string;
  progress: number;
}

// Trend data
export interface TrendData {
  metric: string;
  current_value: number;
  previous_value: number;
  trend_percentage: number;
  trend_direction: 'up' | 'down' | 'stable';
  data_points: TrendDataPoint[];
}

export interface TrendDataPoint {
  date: string;
  value: number;
  target?: number;
  benchmark?: number;
}

// Forecast data
export interface ForecastData {
  energy_consumption: ForecastPoint[];
  cost_projections: CostProjection[];
  performance_trends: PerformanceForecast[];
}

export interface ForecastPoint {
  period: string;
  predicted: number;
  confidence: number;
  lower_bound?: number;
  upper_bound?: number;
}

export interface CostProjection {
  period: string;
  projected_cost: number;
  savings: number;
  confidence?: number;
}

export interface PerformanceForecast {
  metric: string;
  forecast: number;
  trend: 'improving' | 'stable' | 'declining';
  confidence?: number;
}

// Chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  category?: string;
  target?: number;
  benchmark?: number;
}

export interface KPIData {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
}

// Filter and configuration types
export interface AnalyticsFilters {
  timeRange: string;
  metrics: string[];
  projects?: string[];
  categories?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface AnalyticsConfig {
  refreshInterval: number;
  autoRefresh: boolean;
  defaultTimeRange: string;
  defaultMetrics: string[];
  chartColors: string[];
  thresholds: {
    performance: number;
    energy: number;
    compliance: number;
    financial: number;
  };
}

// Export utility types
export type MetricType = 'performance' | 'energy' | 'compliance' | 'financial';
export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'custom';
export type TrendDirection = 'up' | 'down' | 'stable';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'failed';
