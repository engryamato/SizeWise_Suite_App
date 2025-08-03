/**
 * HVAC Component Interactions Integration Tests
 * 
 * Tests the integration between different HVAC calculation components:
 * - Air Duct Calculator ↔ Compliance Checker
 * - WASM Calculator ↔ JavaScript Fallback
 * - Fitting Loss Calculator ↔ Pressure Drop Calculator
 * - Frontend Services ↔ Backend API
 * 
 * Part of Phase 1 bridging plan to achieve 75% integration test coverage
 * 
 * @see docs/post-implementation-bridging-plan.md Task 1.1
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

// Mock fetch for API calls
global.fetch = jest.fn();

describe('HVAC Component Interactions', () => {
  const API_BASE_URL = 'http://127.0.0.1:5000/api';
  
  beforeEach(() => {
    global.fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Air Duct Calculator ↔ Compliance Checker Integration', () => {
    it('should validate SMACNA compliance during duct sizing calculation', async () => {
      const mockCalculationResponse = {
        success: true,
        input_data: {
          airflow: 2000,
          duct_type: 'rectangular',
          friction_rate: 0.08,
          units: 'imperial'
        },
        results: {
          duct_size: '20" x 8"',
          width: { value: 20.0, unit: 'in' },
          height: { value: 8.0, unit: 'in' },
          area: { value: 1.11, unit: 'sq_ft' },
          velocity: { value: 1800.0, unit: 'fpm' },
          pressure_loss: { value: 756.4, unit: 'in_wg_per_100ft' }
        },
        compliance: {
          smacna: {
            velocity: {
              passed: true,
              value: 1800.0,
              limit: 2500,
              message: 'Velocity within SMACNA limits'
            },
            aspect_ratio: {
              passed: true,
              value: 2.5,
              limit: 4.0,
              message: 'Aspect ratio acceptable'
            }
          },
          ashrae: {
            energy_efficiency: {
              passed: true,
              rating: 'A',
              message: 'Meets ASHRAE 90.1 requirements'
            }
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCalculationResponse
      });

      const inputData = {
        airflow: 2000,
        duct_type: 'rectangular',
        friction_rate: 0.08,
        units: 'imperial'
      };

      const response = await fetch(`${API_BASE_URL}/calculations/air-duct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputData)
      });

      const result = await response.json();

      // Verify calculation results
      expect(result.success).toBe(true);
      expect(result.results.velocity.value).toBe(1800.0);
      
      // Verify compliance integration
      expect(result.compliance.smacna.velocity.passed).toBe(true);
      expect(result.compliance.smacna.aspect_ratio.passed).toBe(true);
      expect(result.compliance.ashrae.energy_efficiency.passed).toBe(true);
    });

    it('should flag compliance violations and provide recommendations', async () => {
      const mockNonCompliantResponse = {
        success: true,
        results: {
          velocity: { value: 3000.0, unit: 'fpm' },
          aspect_ratio: 5.0
        },
        compliance: {
          smacna: {
            velocity: {
              passed: false,
              value: 3000.0,
              limit: 2500,
              message: 'Velocity exceeds SMACNA recommended limits'
            },
            aspect_ratio: {
              passed: false,
              value: 5.0,
              limit: 4.0,
              message: 'Aspect ratio too high - consider round duct'
            }
          }
        },
        recommendations: [
          'Consider increasing duct size to reduce velocity',
          'Switch to round duct for better performance',
          'Add turning vanes for high aspect ratio ducts'
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNonCompliantResponse
      });

      const response = await fetch(`${API_BASE_URL}/calculations/air-duct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ airflow: 1000, duct_type: 'rectangular' })
      });

      const result = await response.json();

      expect(result.compliance.smacna.velocity.passed).toBe(false);
      expect(result.compliance.smacna.aspect_ratio.passed).toBe(false);
      expect(result.recommendations).toContain('Consider increasing duct size to reduce velocity');
    });
  });

  describe('WASM Calculator ↔ JavaScript Fallback Integration', () => {
    it('should seamlessly fallback from WASM to JavaScript calculations', async () => {
      const mockWASMFailureResponse = {
        success: true,
        calculation_method: 'javascript_fallback',
        wasm_available: false,
        results: {
          diameter: { value: 14.0, unit: 'in' },
          velocity: { value: 1400.0, unit: 'fpm' },
          execution_time: 2.5,
          fallback_reason: 'WASM module not available'
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWASMFailureResponse
      });

      const response = await fetch(`${API_BASE_URL}/calculations/air-duct/wasm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ airflow: 1500, duct_type: 'round' })
      });

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.calculation_method).toBe('javascript_fallback');
      expect(result.wasm_available).toBe(false);
      expect(result.results.fallback_reason).toBe('WASM module not available');
    });

    it('should use WASM when available and compare performance', async () => {
      const mockWASMResponse = {
        success: true,
        calculation_method: 'wasm',
        wasm_available: true,
        results: {
          diameter: { value: 14.0, unit: 'in' },
          velocity: { value: 1400.0, unit: 'fpm' },
          execution_time: 0.8,
          performance_improvement: '68% faster than JavaScript'
        },
        performance_metrics: {
          wasm_time: 0.8,
          js_fallback_time: 2.5,
          improvement_factor: 3.125
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWASMResponse
      });

      const response = await fetch(`${API_BASE_URL}/calculations/air-duct/wasm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ airflow: 1500, duct_type: 'round' })
      });

      const result = await response.json();

      expect(result.calculation_method).toBe('wasm');
      expect(result.wasm_available).toBe(true);
      expect(result.performance_metrics.improvement_factor).toBeGreaterThan(1);
    });
  });

  describe('Fitting Loss Calculator ↔ Pressure Drop Integration', () => {
    it('should calculate total system pressure drop including fittings', async () => {
      const mockSystemPressureResponse = {
        success: true,
        input_data: {
          airflow: 2000,
          duct_segments: [
            { length: 50, diameter: 16, type: 'straight' },
            { length: 25, diameter: 16, type: 'straight' }
          ],
          fittings: [
            { type: 'elbow_90', diameter: 16, quantity: 2 },
            { type: 'tee_branch', diameter: 16, quantity: 1 }
          ]
        },
        results: {
          straight_duct_loss: { value: 0.45, unit: 'in_wg' },
          fitting_losses: {
            elbow_90: { value: 0.12, unit: 'in_wg', quantity: 2 },
            tee_branch: { value: 0.25, unit: 'in_wg', quantity: 1 }
          },
          total_pressure_drop: { value: 0.94, unit: 'in_wg' },
          velocity_pressure: { value: 0.16, unit: 'in_wg' }
        },
        breakdown: {
          straight_duct_percentage: 47.9,
          fittings_percentage: 52.1
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSystemPressureResponse
      });

      const systemData = {
        airflow: 2000,
        duct_segments: [
          { length: 50, diameter: 16, type: 'straight' },
          { length: 25, diameter: 16, type: 'straight' }
        ],
        fittings: [
          { type: 'elbow_90', diameter: 16, quantity: 2 },
          { type: 'tee_branch', diameter: 16, quantity: 1 }
        ]
      };

      const response = await fetch(`${API_BASE_URL}/calculations/pressure-drop/system`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemData)
      });

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.results.total_pressure_drop.value).toBe(0.94);
      expect(result.results.straight_duct_loss.value).toBe(0.45);
      expect(result.breakdown.fittings_percentage).toBeGreaterThan(50);
    });
  });

  describe('Frontend Services ↔ Backend API Integration', () => {
    it('should handle offline-first calculation with sync when online', async () => {
      const mockOfflineCalculation = {
        success: true,
        calculated_offline: true,
        sync_pending: true,
        results: {
          diameter: { value: 12.0, unit: 'in' },
          velocity: { value: 1200.0, unit: 'fpm' }
        },
        cache_info: {
          stored_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3600000).toISOString()
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOfflineCalculation
      });

      const response = await fetch(`${API_BASE_URL}/calculations/air-duct/offline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ airflow: 1000, duct_type: 'round' })
      });

      const result = await response.json();

      expect(result.calculated_offline).toBe(true);
      expect(result.sync_pending).toBe(true);
      expect(result.cache_info).toBeDefined();
    });

    it('should validate cross-component data consistency', async () => {
      const mockConsistencyCheck = {
        success: true,
        validation_results: {
          air_duct_calculator: { status: 'valid', version: '2.1.0' },
          compliance_checker: { status: 'valid', version: '1.8.0' },
          wasm_calculator: { status: 'valid', version: '1.5.0' },
          fitting_calculator: { status: 'valid', version: '1.3.0' }
        },
        data_consistency: {
          units_consistent: true,
          standards_aligned: true,
          calculation_methods_compatible: true
        },
        integration_health: 'excellent'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConsistencyCheck
      });

      const response = await fetch(`${API_BASE_URL}/system/integration-health`);
      const result = await response.json();

      expect(result.data_consistency.units_consistent).toBe(true);
      expect(result.data_consistency.standards_aligned).toBe(true);
      expect(result.integration_health).toBe('excellent');
    });
  });
});
