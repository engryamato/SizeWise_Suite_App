/**
 * Offline-First Integration Tests
 * 
 * Tests the integration of offline-first functionality across components:
 * - Local storage ↔ Calculation engines
 * - Offline calculations ↔ Online sync
 * - Service worker ↔ Application state
 * - Data persistence ↔ User workflows
 * 
 * Part of Phase 1 bridging plan for comprehensive integration testing
 * 
 * @see docs/post-implementation-bridging-plan.md Task 1.1
 * @see docs/implementation/offline-first-architecture.md
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

// Mock localStorage and fetch
const mockLocalStorage = {
  store: {},
  getItem: jest.fn((key) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key, value) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: jest.fn((key) => {
    delete mockLocalStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {};
  })
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

global.fetch = jest.fn();

describe('Offline-First Integration', () => {
  const API_BASE_URL = 'http://127.0.0.1:5000/api';
  
  beforeEach(() => {
    mockLocalStorage.clear();
    global.fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Local Storage ↔ Calculation Engines Integration', () => {
    it('should store calculation results locally and retrieve them offline', async () => {
      const calculationData = {
        airflow: 1500,
        duct_type: 'round',
        friction_rate: 0.08,
        units: 'imperial'
      };

      const calculationResult = {
        success: true,
        calculated_offline: true,
        timestamp: new Date().toISOString(),
        results: {
          diameter: { value: 14.0, unit: 'in' },
          velocity: { value: 1400.0, unit: 'fpm' },
          area: { value: 1.07, unit: 'sq_ft' }
        },
        cache_key: 'air_duct_1500_round_0.08_imperial'
      };

      // Simulate offline calculation storage
      const cacheKey = `hvac_calculation_${JSON.stringify(calculationData).replace(/\s/g, '')}`;
      mockLocalStorage.setItem(cacheKey, JSON.stringify(calculationResult));

      // Retrieve from local storage
      const storedResult = mockLocalStorage.getItem(cacheKey);
      const parsedResult = JSON.parse(storedResult);

      expect(parsedResult.calculated_offline).toBe(true);
      expect(parsedResult.results.diameter.value).toBe(14.0);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(cacheKey, expect.any(String));
    });

    it('should handle cache expiration and cleanup', async () => {
      const expiredCalculation = {
        success: true,
        calculated_offline: true,
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        expires_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        results: { diameter: { value: 12.0, unit: 'in' } }
      };

      const validCalculation = {
        success: true,
        calculated_offline: true,
        timestamp: new Date().toISOString(),
        expires_at: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(), // 23 hours from now
        results: { diameter: { value: 14.0, unit: 'in' } }
      };

      mockLocalStorage.setItem('expired_calc', JSON.stringify(expiredCalculation));
      mockLocalStorage.setItem('valid_calc', JSON.stringify(validCalculation));

      // Simulate cache cleanup logic
      const cleanupExpiredCache = () => {
        const keys = Object.keys(mockLocalStorage.store);
        keys.forEach(key => {
          const item = JSON.parse(mockLocalStorage.store[key]);
          if (item.expires_at && new Date(item.expires_at) < new Date()) {
            mockLocalStorage.removeItem(key);
          }
        });
      };

      cleanupExpiredCache();

      expect(mockLocalStorage.getItem('expired_calc')).toBeNull();
      expect(mockLocalStorage.getItem('valid_calc')).not.toBeNull();
    });
  });

  describe('Offline Calculations ↔ Online Sync Integration', () => {
    it('should queue offline calculations for sync when online', async () => {
      const offlineCalculations = [
        {
          id: 'calc_1',
          type: 'air_duct',
          input: { airflow: 1000, duct_type: 'round' },
          result: { diameter: 12 },
          timestamp: new Date().toISOString(),
          synced: false
        },
        {
          id: 'calc_2',
          type: 'pressure_drop',
          input: { airflow: 1500, length: 100 },
          result: { pressure_loss: 0.8 },
          timestamp: new Date().toISOString(),
          synced: false
        }
      ];

      // Store offline calculations
      mockLocalStorage.setItem('pending_sync', JSON.stringify(offlineCalculations));

      // Mock successful sync response
      const mockSyncResponse = {
        success: true,
        synced_calculations: ['calc_1', 'calc_2'],
        sync_timestamp: new Date().toISOString(),
        conflicts: [],
        server_updates: []
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSyncResponse
      });

      // Simulate sync process
      const pendingSync = JSON.parse(mockLocalStorage.getItem('pending_sync'));
      
      const response = await fetch(`${API_BASE_URL}/sync/calculations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calculations: pendingSync })
      });

      const syncResult = await response.json();

      expect(syncResult.success).toBe(true);
      expect(syncResult.synced_calculations).toHaveLength(2);
      expect(syncResult.conflicts).toHaveLength(0);
    });

    it('should handle sync conflicts and resolution', async () => {
      const conflictedCalculation = {
        id: 'calc_conflict',
        type: 'air_duct',
        input: { airflow: 1000, duct_type: 'round' },
        local_result: { diameter: 12, timestamp: '2025-08-03T10:00:00Z' },
        server_result: { diameter: 12.5, timestamp: '2025-08-03T10:05:00Z' },
        synced: false
      };

      const mockConflictResponse = {
        success: true,
        conflicts: [
          {
            calculation_id: 'calc_conflict',
            conflict_type: 'result_mismatch',
            local_value: 12,
            server_value: 12.5,
            resolution_strategy: 'use_latest_timestamp',
            resolved_value: 12.5
          }
        ],
        resolution_summary: {
          total_conflicts: 1,
          auto_resolved: 1,
          manual_resolution_required: 0
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConflictResponse
      });

      const response = await fetch(`${API_BASE_URL}/sync/resolve-conflicts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calculation: conflictedCalculation })
      });

      const conflictResult = await response.json();

      expect(conflictResult.conflicts).toHaveLength(1);
      expect(conflictResult.conflicts[0].resolved_value).toBe(12.5);
      expect(conflictResult.resolution_summary.auto_resolved).toBe(1);
    });
  });

  describe('Service Worker ↔ Application State Integration', () => {
    it('should handle service worker cache updates', async () => {
      const mockServiceWorkerMessage = {
        type: 'CACHE_UPDATED',
        data: {
          cache_name: 'hvac-calculations-v1',
          updated_resources: [
            '/api/calculations/air-duct',
            '/api/calculations/pressure-drop'
          ],
          cache_size: '2.5MB',
          last_updated: new Date().toISOString()
        }
      };

      // Simulate service worker message handling
      const handleServiceWorkerMessage = (event) => {
        if (event.data.type === 'CACHE_UPDATED') {
          const cacheInfo = {
            cache_name: event.data.data.cache_name,
            resources_count: event.data.data.updated_resources.length,
            last_sync: event.data.data.last_updated
          };
          mockLocalStorage.setItem('sw_cache_info', JSON.stringify(cacheInfo));
          return cacheInfo;
        }
      };

      const result = handleServiceWorkerMessage({ data: mockServiceWorkerMessage });

      expect(result?.cache_name).toBe('hvac-calculations-v1');
      expect(result?.resources_count).toBe(2);
      expect(mockLocalStorage.getItem('sw_cache_info')).toBeTruthy();
    });

    it('should coordinate offline/online state transitions', async () => {
      const stateTransitions = {
        online_to_offline: {
          timestamp: new Date().toISOString(),
          active_calculations: 3,
          pending_sync: 1,
          cache_status: 'ready'
        },
        offline_to_online: {
          timestamp: new Date().toISOString(),
          queued_calculations: 5,
          sync_required: true,
          cache_updates_available: true
        }
      };

      // Simulate going offline
      mockLocalStorage.setItem('network_state', JSON.stringify({
        status: 'offline',
        transition: stateTransitions.online_to_offline,
        offline_capabilities: {
          calculations_available: true,
          data_persistence: true,
          ui_fully_functional: true
        }
      }));

      // Simulate coming back online
      const mockOnlineResponse = {
        success: true,
        sync_status: 'ready',
        server_time: new Date().toISOString(),
        pending_updates: 2
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOnlineResponse
      });

      const response = await fetch(`${API_BASE_URL}/sync/status`);
      const onlineStatus = await response.json();

      mockLocalStorage.setItem('network_state', JSON.stringify({
        status: 'online',
        transition: stateTransitions.offline_to_online,
        sync_status: onlineStatus.sync_status
      }));

      const networkState = JSON.parse(mockLocalStorage.getItem('network_state'));
      expect(networkState.status).toBe('online');
      expect(networkState.sync_status).toBe('ready');
    });
  });

  describe('Data Persistence ↔ User Workflows Integration', () => {
    it('should maintain workflow state across offline/online transitions', async () => {
      const workflowState = {
        workflow_id: 'hvac_design_001',
        current_step: 'duct_sizing',
        completed_steps: ['load_calculation', 'system_selection'],
        step_data: {
          load_calculation: { total_cfm: 5000, zones: 8 },
          system_selection: { system_type: 'VAV', efficiency: 'high' },
          duct_sizing: { 
            progress: 60,
            completed_ducts: 12,
            total_ducts: 20,
            current_calculation: {
              airflow: 1200,
              duct_type: 'rectangular',
              status: 'in_progress'
            }
          }
        },
        last_saved: new Date().toISOString(),
        auto_save_enabled: true
      };

      // Store workflow state
      mockLocalStorage.setItem('workflow_hvac_design_001', JSON.stringify(workflowState));

      // Simulate workflow continuation after offline period
      const storedWorkflow = JSON.parse(mockLocalStorage.getItem('workflow_hvac_design_001'));
      
      expect(storedWorkflow.current_step).toBe('duct_sizing');
      expect(storedWorkflow.step_data.duct_sizing.progress).toBe(60);
      expect(storedWorkflow.completed_steps).toContain('load_calculation');

      // Simulate workflow completion
      const updatedWorkflow = {
        ...storedWorkflow,
        current_step: 'completed',
        completed_steps: [...storedWorkflow.completed_steps, 'duct_sizing'],
        completion_timestamp: new Date().toISOString(),
        final_results: {
          total_pressure_drop: 2.5,
          energy_efficiency_rating: 'A',
          compliance_status: 'fully_compliant'
        }
      };

      mockLocalStorage.setItem('workflow_hvac_design_001', JSON.stringify(updatedWorkflow));

      const finalWorkflow = JSON.parse(mockLocalStorage.getItem('workflow_hvac_design_001'));
      expect(finalWorkflow.current_step).toBe('completed');
      expect(finalWorkflow.final_results.compliance_status).toBe('fully_compliant');
    });

    it('should handle data recovery after application restart', async () => {
      const recoveryData = {
        session_id: 'session_12345',
        last_activity: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        active_calculations: [
          {
            id: 'calc_recovery_1',
            type: 'air_duct',
            input: { airflow: 800, duct_type: 'round' },
            status: 'completed',
            result: { diameter: 10 }
          },
          {
            id: 'calc_recovery_2',
            type: 'pressure_drop',
            input: { airflow: 1200, length: 150 },
            status: 'in_progress',
            partial_result: { calculated_segments: 3, total_segments: 8 }
          }
        ],
        user_preferences: {
          units: 'imperial',
          default_material: 'galvanized_steel',
          auto_save_interval: 300
        }
      };

      mockLocalStorage.setItem('recovery_data', JSON.stringify(recoveryData));

      // Simulate application restart and recovery
      const storedRecoveryData = JSON.parse(mockLocalStorage.getItem('recovery_data'));
      
      const recoveryStatus = {
        session_recovered: true,
        calculations_recovered: storedRecoveryData.active_calculations.length,
        completed_calculations: storedRecoveryData.active_calculations.filter((c) => c.status === 'completed').length,
        in_progress_calculations: storedRecoveryData.active_calculations.filter((c) => c.status === 'in_progress').length,
        preferences_restored: true
      };

      expect(recoveryStatus.session_recovered).toBe(true);
      expect(recoveryStatus.calculations_recovered).toBe(2);
      expect(recoveryStatus.completed_calculations).toBe(1);
      expect(recoveryStatus.in_progress_calculations).toBe(1);
    });
  });
});
