'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { securityService, SecurityEvent } from '@/lib/services/SecurityService';
import { format } from 'date-fns';

interface SecurityAuditDashboardProps {
  userId?: string;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highRiskEvents: number;
  mediumRiskEvents: number;
  lowRiskEvents: number;
  recentLogins: number;
  failedAttempts: number;
}

export const SecurityAuditDashboard: React.FC<SecurityAuditDashboardProps> = ({ userId }) => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    loadSecurityData();
  }, [loadSecurityData]);

  const loadSecurityData = useCallback(async () => {
    setLoading(true);
    try {
      const securityEvents = await securityService.getSecurityEvents(100);
      setEvents(securityEvents);
      calculateMetrics(securityEvents);
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoading(false);
    }
  }, [calculateMetrics]);

  const calculateMetrics = useCallback((events: SecurityEvent[]) => {
    const now = new Date();
    const timeRangeHours = {
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30,
      '90d': 24 * 90
    };

    const cutoffTime = new Date(now.getTime() - timeRangeHours[timeRange] * 60 * 60 * 1000);
    const filteredEvents = events.filter(event => new Date(event.timestamp) >= cutoffTime);

    const metrics: SecurityMetrics = {
      totalEvents: filteredEvents.length,
      criticalEvents: filteredEvents.filter(e => e.riskLevel === 'CRITICAL').length,
      highRiskEvents: filteredEvents.filter(e => e.riskLevel === 'HIGH').length,
      mediumRiskEvents: filteredEvents.filter(e => e.riskLevel === 'MEDIUM').length,
      lowRiskEvents: filteredEvents.filter(e => e.riskLevel === 'LOW').length,
      recentLogins: filteredEvents.filter(e => e.action === 'authentication_success').length,
      failedAttempts: filteredEvents.filter(e => e.action === 'authentication_failed').length,
    };

    setMetrics(metrics);
  }, [timeRange]);

  const getFilteredEvents = () => {
    if (filter === 'all') return events;
    return events.filter(event => event.riskLevel.toLowerCase() === filter);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'text-red-800 bg-red-100';
      case 'HIGH': return 'text-orange-800 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-800 bg-yellow-100';
      case 'LOW': return 'text-green-800 bg-green-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'authentication_success':
        return '✅';
      case 'authentication_failed':
        return '❌';
      case 'mfa_setup_initiated':
      case 'mfa_setup_verified':
        return '🔐';
      case 'password_changed':
        return '🔑';
      case 'logout':
        return '🚪';
      case 'permission_denied':
        return '🚫';
      case 'session_timeout':
        return '⏰';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading security data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Security Audit Dashboard</h2>
        
        <div className="flex space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <button
            onClick={loadSecurityData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalEvents}</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Events</p>
                <p className="text-2xl font-bold text-red-600">{metrics.criticalEvents}</p>
              </div>
              <div className="text-3xl">🚨</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Successful Logins</p>
                <p className="text-2xl font-bold text-green-600">{metrics.recentLogins}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed Attempts</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.failedAttempts}</p>
              </div>
              <div className="text-3xl">❌</div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Level Distribution */}
      {metrics && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Risk Level Distribution</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{metrics.criticalEvents}</div>
              <div className="text-sm text-gray-600">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.highRiskEvents}</div>
              <div className="text-sm text-gray-600">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{metrics.mediumRiskEvents}</div>
              <div className="text-sm text-gray-600">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.lowRiskEvents}</div>
              <div className="text-sm text-gray-600">Low</div>
            </div>
          </div>
        </div>
      )}

      {/* Event Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Events ({events.length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'critical' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Critical ({events.filter(e => e.riskLevel === 'CRITICAL').length})
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'high' 
                ? 'bg-orange-100 text-orange-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            High ({events.filter(e => e.riskLevel === 'HIGH').length})
          </button>
          <button
            onClick={() => setFilter('medium')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'medium' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Medium ({events.filter(e => e.riskLevel === 'MEDIUM').length})
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'low' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Low ({events.filter(e => e.riskLevel === 'LOW').length})
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Security Events</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredEvents().slice(0, 50).map((event) => (
                <tr key={event.eventId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getActionIcon(event.action)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {event.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-sm text-gray-500">{event.resourceType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.userId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(event.riskLevel)}`}>
                      {event.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.ipAddress}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {getFilteredEvents().length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No security events found for the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};
