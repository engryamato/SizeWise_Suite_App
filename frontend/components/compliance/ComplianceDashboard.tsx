'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface ComplianceFramework {
  name: string;
  overall_score: number;
  compliance_percentage: number;
  critical_gaps: number;
  last_assessment: string;
  next_assessment: string;
}

interface ComplianceAssessment {
  id: string;
  requirement_id: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'UNDER_REVIEW';
  score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assessment_date: string;
}

interface ComplianceDashboardData {
  overview: {
    overall_score: number;
    frameworks_assessed: number;
    total_requirements: number;
    total_assessments: number;
    last_updated: string;
  };
  frameworks: Record<string, ComplianceFramework>;
  recent_assessments: ComplianceAssessment[];
  critical_gaps: string[];
  upcoming_reviews: Array<{
    requirement_id: string;
    next_review_date: string;
    risk_level: string;
  }>;
}

export const ComplianceDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<ComplianceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/compliance/dashboard');
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load compliance dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 80) return 'bg-yellow-100';
    if (score >= 70) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT': return 'text-green-800 bg-green-100';
      case 'PARTIALLY_COMPLIANT': return 'text-yellow-800 bg-yellow-100';
      case 'NON_COMPLIANT': return 'text-red-800 bg-red-100';
      case 'UNDER_REVIEW': return 'text-blue-800 bg-blue-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-800 bg-green-100';
      case 'MEDIUM': return 'text-yellow-800 bg-yellow-100';
      case 'HIGH': return 'text-orange-800 bg-orange-100';
      case 'CRITICAL': return 'text-red-800 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const exportReport = async (framework: string) => {
    try {
      const response = await fetch(`/api/compliance/export/${framework}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'json' })
      });
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${framework}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading compliance dashboard...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center p-8 text-gray-500">
        Failed to load compliance dashboard data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Last updated: {format(new Date(dashboardData.overview.last_updated), 'MMM dd, yyyy HH:mm')}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Frameworks</option>
            {Object.keys(dashboardData.frameworks).map(framework => (
              <option key={framework} value={framework}>{framework}</option>
            ))}
          </select>
          
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(dashboardData.overview.overall_score)}`}>
                {dashboardData.overview.overall_score.toFixed(1)}%
              </p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Frameworks</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardData.overview.frameworks_assessed}</p>
            </div>
            <div className="text-4xl">🛡️</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Requirements</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardData.overview.total_requirements}</p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Gaps</p>
              <p className="text-3xl font-bold text-red-600">{dashboardData.critical_gaps.length}</p>
            </div>
            <div className="text-4xl">🚨</div>
          </div>
        </div>
      </div>

      {/* Framework Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(dashboardData.frameworks).map(([name, framework]) => (
          <div key={name} className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                <p className={`text-2xl font-bold ${getScoreColor(framework.overall_score)}`}>
                  {framework.overall_score.toFixed(1)}%
                </p>
              </div>
              <button
                onClick={() => exportReport(name)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Export
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Compliance</span>
                <span className="font-medium">{framework.compliance_percentage.toFixed(1)}%</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Critical Gaps</span>
                <span className={`font-medium ${framework.critical_gaps > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {framework.critical_gaps}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Next Review</span>
                <span className="font-medium">
                  {format(new Date(framework.next_assessment), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    framework.overall_score >= 90 ? 'bg-green-500' :
                    framework.overall_score >= 80 ? 'bg-yellow-500' :
                    framework.overall_score >= 70 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${framework.overall_score}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Assessments */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Assessments</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requirement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.recent_assessments.slice(0, 10).map((assessment) => (
                <tr key={assessment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {assessment.requirement_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assessment.status)}`}>
                      {assessment.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${getScoreColor(assessment.score)}`}>
                        {assessment.score.toFixed(1)}%
                      </span>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            assessment.score >= 90 ? 'bg-green-500' :
                            assessment.score >= 80 ? 'bg-yellow-500' :
                            assessment.score >= 70 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${assessment.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(assessment.risk_level)}`}>
                      {assessment.risk_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(assessment.assessment_date), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Gaps */}
      {dashboardData.critical_gaps.length > 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="text-red-500 mr-2">🚨</span>
              Critical Gaps Requiring Attention
            </h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {dashboardData.critical_gaps.slice(0, 5).map((gap, index) => (
                <div key={index} className="flex items-start p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-red-500 mr-3 mt-0.5">⚠️</div>
                  <div className="text-sm text-red-800">{gap}</div>
                </div>
              ))}
            </div>
            
            {dashboardData.critical_gaps.length > 5 && (
              <div className="mt-4 text-sm text-gray-600">
                And {dashboardData.critical_gaps.length - 5} more critical gaps...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Reviews */}
      {dashboardData.upcoming_reviews.length > 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="text-yellow-500 mr-2">📅</span>
              Upcoming Reviews (Next 30 Days)
            </h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {dashboardData.upcoming_reviews.map((review, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{review.requirement_id}</div>
                    <div className="text-xs text-gray-600">
                      Due: {format(new Date(review.next_review_date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(review.risk_level)}`}>
                    {review.risk_level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
