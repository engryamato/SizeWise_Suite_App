'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ERROR' | 'MAINTENANCE';
  endpoint_url: string;
  last_sync?: string;
  error_message?: string;
}

interface IntegrationStats {
  sso_providers: number;
  erp_connections: number;
  cad_integrations: number;
  api_endpoints: number;
  total_integrations: number;
  last_updated: string;
}

interface SSOProvider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  auto_provision: boolean;
}

export const IntegrationDashboard: React.FC = () => {
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [ssoProviders, setSsoProviders] = useState<SSOProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sso' | 'erp' | 'cad' | 'api'>('overview');
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrationData();
  }, []);

  const loadIntegrationData = async () => {
    setLoading(true);
    try {
      // Load integration statistics
      const statsResponse = await fetch('/api/integrations/status');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Load integrations list
      const integrationsResponse = await fetch('/api/integrations');
      const integrationsData = await integrationsResponse.json();
      setIntegrations(integrationsData.integrations || []);

      // Load SSO providers
      const ssoResponse = await fetch('/api/integrations/sso/providers');
      const ssoData = await ssoResponse.json();
      setSsoProviders(ssoData.providers || []);

    } catch (error) {
      console.error('Failed to load integration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (integrationId: string) => {
    setTestingConnection(integrationId);
    try {
      const response = await fetch(`/api/integrations/${integrationId}/test`, {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        alert('Connection test successful!');
      } else {
        alert(`Connection test failed: ${result.error}`);
      }
    } catch (error) {
      alert('Connection test failed');
    } finally {
      setTestingConnection(null);
    }
  };

  const syncERPData = async (connectionId: string, dataType: string) => {
    try {
      const response = await fetch(`/api/integrations/erp/${connectionId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_type: dataType })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`${dataType} sync completed successfully!`);
        loadIntegrationData(); // Refresh data
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      alert('Sync failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-800 bg-green-100';
      case 'INACTIVE': return 'text-gray-800 bg-gray-100';
      case 'PENDING': return 'text-yellow-800 bg-yellow-100';
      case 'ERROR': return 'text-red-800 bg-red-100';
      case 'MAINTENANCE': return 'text-blue-800 bg-blue-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('SSO')) return '🔐';
    if (type.includes('ERP')) return '🏢';
    if (type.includes('CAD')) return '📐';
    if (type.includes('API')) return '🔌';
    return '⚙️';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading integration dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enterprise Integration Hub</h1>
          <p className="text-gray-600 mt-1">
            Manage SSO, ERP, CAD, and API integrations
          </p>
        </div>
        
        <button
          onClick={loadIntegrationData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">SSO Providers</p>
                <p className="text-2xl font-bold text-blue-600">{stats.sso_providers}</p>
              </div>
              <div className="text-3xl">🔐</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ERP Systems</p>
                <p className="text-2xl font-bold text-green-600">{stats.erp_connections}</p>
              </div>
              <div className="text-3xl">🏢</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CAD Tools</p>
                <p className="text-2xl font-bold text-purple-600">{stats.cad_integrations}</p>
              </div>
              <div className="text-3xl">📐</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Endpoints</p>
                <p className="text-2xl font-bold text-orange-600">{stats.api_endpoints}</p>
              </div>
              <div className="text-3xl">🔌</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_integrations}</p>
              </div>
              <div className="text-3xl">⚙️</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'sso', name: 'SSO Providers', icon: '🔐' },
            { id: 'erp', name: 'ERP Systems', icon: '🏢' },
            { id: 'cad', name: 'CAD Tools', icon: '📐' },
            { id: 'api', name: 'API Management', icon: '🔌' }
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
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Integrations</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Integration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Sync
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {integrations.map((integration) => (
                    <tr key={integration.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{getTypeIcon(integration.type)}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{integration.name}</div>
                            <div className="text-sm text-gray-500">{integration.endpoint_url}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {integration.type.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(integration.status)}`}>
                          {integration.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {integration.last_sync 
                          ? format(new Date(integration.last_sync), 'MMM dd, yyyy HH:mm')
                          : 'Never'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => testConnection(integration.id)}
                          disabled={testingConnection === integration.id}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                          {testingConnection === integration.id ? 'Testing...' : 'Test'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sso' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">SSO Providers</h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ssoProviders.map((provider) => (
                  <div key={provider.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">🔐</span>
                        <h4 className="font-medium text-gray-900">{provider.name}</h4>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        provider.enabled ? 'text-green-800 bg-green-100' : 'text-gray-800 bg-gray-100'
                      }`}>
                        {provider.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>Type: {provider.type.replace('SSO_', '')}</div>
                      <div>Auto Provision: {provider.auto_provision ? 'Yes' : 'No'}</div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        Configure
                      </button>
                      <button className="text-green-600 hover:text-green-800 text-sm">
                        Test Login
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'erp' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">ERP System Integrations</h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">🏢</span>
                      <h4 className="font-medium text-gray-900">SAP ERP</h4>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-green-800 bg-green-100">
                      Connected
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div>Host: erp.company.com</div>
                    <div>Database: PRD</div>
                    <div>Sync Frequency: Every hour</div>
                    <div>Last Sync: 15 minutes ago</div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => syncERPData('erp_sap', 'projects')}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Sync Projects
                    </button>
                    <button
                      onClick={() => syncERPData('erp_sap', 'customers')}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Sync Customers
                    </button>
                    <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cad' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">CAD Software Integrations</h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">📐</span>
                      <h4 className="font-medium text-gray-900">AutoCAD Integration</h4>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-green-800 bg-green-100">
                      Active
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div>Plugin Version: 2024.1</div>
                    <div>Supported Formats: DWG, DXF, DWF</div>
                    <div>Auto Import: Enabled</div>
                    <div>Unit Conversion: Enabled</div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                      Import Drawing
                    </button>
                    <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                      Export Calculations
                    </button>
                    <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                      Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">API Management</h3>
            </div>
            
            <div className="p-6">
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🔌</div>
                <h4 className="text-lg font-medium mb-2">API Endpoints</h4>
                <p>Manage external API integrations and webhooks</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add API Endpoint
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
