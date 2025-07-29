'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface BackupJob {
  id: string;
  name: string;
  type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL' | 'SNAPSHOT' | 'CONTINUOUS';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  schedule: string;
  retention_days: number;
  last_run?: string;
  next_run?: string;
  size_bytes: number;
  duration_seconds: number;
  error_message?: string;
}

interface BackupRecord {
  id: string;
  job_id: string;
  type: string;
  start_time: string;
  end_time?: string;
  status: string;
  size_bytes: number;
  files_count: number;
  compression_ratio: number;
  error_message?: string;
}

interface RecoveryPlan {
  id: string;
  name: string;
  description: string;
  disaster_types: string[];
  recovery_objectives: {
    RTO: number;
    RPO: number;
  };
  procedures: string[];
  last_test?: string;
  test_results?: {
    success_rate: number;
    issues_found: string[];
  };
}

interface BackupStatus {
  jobs: {
    total: number;
    active: number;
    completed: number;
    failed: number;
  };
  backups: {
    total: number;
    total_size_bytes: number;
    total_size_gb: number;
  };
  recovery_plans: number;
  recovery_operations: number;
  last_updated: string;
}

export const DisasterRecoveryDashboard: React.FC = () => {
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [backupRecords, setBackupRecords] = useState<BackupRecord[]>([]);
  const [recoveryPlans, setRecoveryPlans] = useState<RecoveryPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'backups' | 'recovery' | 'monitoring'>('overview');
  const [runningJob, setRunningJob] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load backup status
      const statusResponse = await fetch('/api/disaster-recovery/status');
      const statusData = await statusResponse.json();
      setStatus(statusData);

      // Load backup jobs
      const jobsResponse = await fetch('/api/disaster-recovery/jobs');
      const jobsData = await jobsResponse.json();
      setBackupJobs(jobsData.jobs || []);

      // Load backup records
      const recordsResponse = await fetch('/api/disaster-recovery/records');
      const recordsData = await recordsResponse.json();
      setBackupRecords(recordsData.records || []);

      // Load recovery plans
      const plansResponse = await fetch('/api/disaster-recovery/plans');
      const plansData = await plansResponse.json();
      setRecoveryPlans(plansData.plans || []);

    } catch (error) {
      console.error('Failed to load disaster recovery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runBackupJob = async (jobId: string) => {
    setRunningJob(jobId);
    try {
      const response = await fetch(`/api/disaster-recovery/jobs/${jobId}/run`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Backup job started successfully!');
        loadDashboardData(); // Refresh data
      } else {
        alert(`Backup job failed: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to start backup job');
    } finally {
      setRunningJob(null);
    }
  };

  const testRecoveryPlan = async (planId: string) => {
    try {
      const response = await fetch(`/api/disaster-recovery/plans/${planId}/test`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Recovery plan test completed with ${result.success_rate}% success rate`);
        loadDashboardData(); // Refresh data
      } else {
        alert('Recovery plan test failed');
      }
    } catch (error) {
      alert('Failed to test recovery plan');
    }
  };

  const validateBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/disaster-recovery/backups/${backupId}/validate`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.valid) {
        alert('Backup validation successful!');
      } else {
        alert(`Backup validation failed: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to validate backup');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-800 bg-green-100';
      case 'RUNNING': return 'text-blue-800 bg-blue-100';
      case 'PENDING': return 'text-yellow-800 bg-yellow-100';
      case 'FAILED': return 'text-red-800 bg-red-100';
      case 'CANCELLED': return 'text-gray-800 bg-gray-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'FULL': return '💾';
      case 'INCREMENTAL': return '📈';
      case 'DIFFERENTIAL': return '📊';
      case 'SNAPSHOT': return '📸';
      case 'CONTINUOUS': return '🔄';
      default: return '💾';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading disaster recovery dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Disaster Recovery & Backup</h1>
          <p className="text-gray-600 mt-1">
            Enterprise backup strategies and disaster recovery management
          </p>
        </div>
        
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Status Cards */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-blue-600">{status.jobs.active}</p>
                <p className="text-xs text-gray-500">{status.jobs.total} total jobs</p>
              </div>
              <div className="text-3xl">🔄</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Backups</p>
                <p className="text-2xl font-bold text-green-600">{status.backups.total}</p>
                <p className="text-xs text-gray-500">{status.backups.total_size_gb} GB</p>
              </div>
              <div className="text-3xl">💾</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recovery Plans</p>
                <p className="text-2xl font-bold text-purple-600">{status.recovery_plans}</p>
                <p className="text-xs text-gray-500">Ready for testing</p>
              </div>
              <div className="text-3xl">🛡️</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed Jobs</p>
                <p className="text-2xl font-bold text-red-600">{status.jobs.failed}</p>
                <p className="text-xs text-gray-500">Need attention</p>
              </div>
              <div className="text-3xl">⚠️</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'backups', name: 'Backup Jobs', icon: '💾' },
            { id: 'recovery', name: 'Recovery Plans', icon: '🛡️' },
            { id: 'monitoring', name: 'Monitoring', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Backup Activity */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Backup Activity</h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {backupRecords.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getTypeIcon(record.type)}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {backupJobs.find(j => j.id === record.job_id)?.name || 'Unknown Job'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(record.start_time), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatBytes(record.size_bytes)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recovery Plan Status */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recovery Plan Status</h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {recoveryPlans.map((plan) => (
                  <div key={plan.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{plan.name}</h4>
                      <span className="text-sm text-gray-500">
                        RTO: {plan.recovery_objectives.RTO}h | RPO: {plan.recovery_objectives.RPO}h
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {plan.last_test 
                          ? `Last tested: ${format(new Date(plan.last_test), 'MMM dd, yyyy')}`
                          : 'Never tested'
                        }
                      </div>
                      
                      <button
                        onClick={() => testRecoveryPlan(plan.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Test Plan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'backups' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Backup Jobs</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backupJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getTypeIcon(job.type)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{job.name}</div>
                          <div className="text-sm text-gray-500">Retention: {job.retention_days} days</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {job.last_run 
                        ? format(new Date(job.last_run), 'MMM dd, yyyy HH:mm')
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatBytes(job.size_bytes)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => runBackupJob(job.id)}
                        disabled={runningJob === job.id || job.status === 'RUNNING'}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 mr-3"
                      >
                        {runningJob === job.id ? 'Running...' : 'Run Now'}
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        Configure
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'recovery' && (
        <div className="space-y-6">
          {recoveryPlans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg shadow border">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => testRecoveryPlan(plan.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Test Plan
                    </button>
                    <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                      Execute
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Recovery Objectives</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Recovery Time Objective (RTO):</span>
                        <span className="font-medium">{plan.recovery_objectives.RTO} hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Recovery Point Objective (RPO):</span>
                        <span className="font-medium">{plan.recovery_objectives.RPO} hours</span>
                      </div>
                    </div>
                    
                    <h4 className="font-medium text-gray-900 mt-6 mb-3">Disaster Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {plan.disaster_types.map((type) => (
                        <span key={type} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          {type.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Recovery Procedures</h4>
                    <ol className="space-y-2 text-sm">
                      {plan.procedures.map((procedure, index) => (
                        <li key={index} className="flex">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                            {index + 1}
                          </span>
                          <span className="text-gray-700">{procedure}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
                
                {plan.test_results && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Last Test Results</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Success Rate: {plan.test_results.success_rate}%
                      </span>
                      <span className="text-sm text-gray-500">
                        {plan.last_test && format(new Date(plan.last_test), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    
                    {plan.test_results.issues_found.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-red-800 mb-1">Issues Found:</p>
                        <ul className="text-sm text-red-700 space-y-1">
                          {plan.test_results.issues_found.map((issue, index) => (
                            <li key={index}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Backup Monitoring</h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {backupRecords.slice(0, 9).map((record) => (
                <div key={record.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{getTypeIcon(record.type)}</span>
                      <h4 className="font-medium text-gray-900">
                        {backupJobs.find(j => j.id === record.job_id)?.name || 'Unknown'}
                      </h4>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>Size: {formatBytes(record.size_bytes)}</div>
                    <div>Files: {record.files_count.toLocaleString()}</div>
                    <div>Compression: {(record.compression_ratio * 100).toFixed(1)}%</div>
                    <div>Date: {format(new Date(record.start_time), 'MMM dd, yyyy')}</div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => validateBackup(record.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Validate
                    </button>
                    <button className="text-green-600 hover:text-green-800 text-sm">
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
