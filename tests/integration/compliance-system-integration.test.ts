/**
 * Compliance System Integration Tests
 * 
 * Tests integration between compliance checking and HVAC calculations:
 * - SMACNA standards validation
 * - ASHRAE compliance checking
 * - NFPA 96 grease duct compliance
 * - Multi-standard validation workflows
 * 
 * Part of Phase 1 bridging plan for comprehensive integration testing
 * 
 * @see docs/post-implementation-bridging-plan.md Task 1.1
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Compliance System Integration', () => {
  const API_BASE_URL = 'http://127.0.0.1:5000/api';
  
  beforeEach(() => {
    global.fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('SMACNA Standards Integration', () => {
    it('should validate velocity limits during air duct calculations', async () => {
      const mockSMACNAValidation = {
        success: true,
        standard: 'SMACNA',
        validation_results: {
          velocity_check: {
            passed: true,
            actual_velocity: 1800,
            max_allowed: 2500,
            application_type: 'supply_air',
            severity: 'compliant'
          },
          aspect_ratio_check: {
            passed: true,
            actual_ratio: 2.5,
            max_recommended: 4.0,
            efficiency_impact: 'minimal'
          },
          gauge_requirements: {
            passed: true,
            required_gauge: 26,
            recommended_gauge: 24,
            pressure_class: 'low'
          }
        },
        recommendations: [
          'Consider 24 gauge for improved durability',
          'Velocity is optimal for energy efficiency'
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSMACNAValidation
      });

      const calculationData = {
        airflow: 2000,
        duct_type: 'rectangular',
        width: 20,
        height: 8,
        velocity: 1800,
        application: 'supply_air'
      };

      const response = await fetch(`${API_BASE_URL}/compliance/smacna/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calculationData)
      });

      const result = await response.json();

      expect(result.validation_results.velocity_check.passed).toBe(true);
      expect(result.validation_results.aspect_ratio_check.passed).toBe(true);
      expect(result.validation_results.gauge_requirements.passed).toBe(true);
    });

    it('should handle SMACNA violations with corrective recommendations', async () => {
      const mockSMACNAViolation = {
        success: true,
        standard: 'SMACNA',
        validation_results: {
          velocity_check: {
            passed: false,
            actual_velocity: 3200,
            max_allowed: 2500,
            application_type: 'supply_air',
            severity: 'major_violation',
            noise_concern: true
          },
          aspect_ratio_check: {
            passed: false,
            actual_ratio: 6.0,
            max_recommended: 4.0,
            efficiency_impact: 'significant'
          }
        },
        violations: [
          {
            type: 'velocity_exceeded',
            severity: 'major',
            impact: 'Excessive noise and energy consumption'
          },
          {
            type: 'aspect_ratio_exceeded',
            severity: 'moderate',
            impact: 'Reduced airflow efficiency'
          }
        ],
        corrective_actions: [
          'Increase duct size to reduce velocity below 2500 FPM',
          'Consider round duct or reduce aspect ratio to 4:1 maximum',
          'Add sound attenuation if velocity cannot be reduced'
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSMACNAViolation
      });

      const violationData = {
        airflow: 2000,
        duct_type: 'rectangular',
        width: 24,
        height: 4,
        velocity: 3200,
        application: 'supply_air'
      };

      const response = await fetch(`${API_BASE_URL}/compliance/smacna/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(violationData)
      });

      const result = await response.json();

      expect(result.validation_results.velocity_check.passed).toBe(false);
      expect(result.violations).toHaveLength(2);
      expect(result.corrective_actions).toContain('Increase duct size to reduce velocity below 2500 FPM');
    });
  });

  describe('ASHRAE Standards Integration', () => {
    it('should validate energy efficiency requirements', async () => {
      const mockASHRAEValidation = {
        success: true,
        standard: 'ASHRAE_90.1',
        validation_results: {
          energy_efficiency: {
            passed: true,
            efficiency_rating: 'A',
            power_consumption: 2.5, // kW
            benchmark_power: 3.2,
            savings_percentage: 21.9
          },
          fan_efficiency: {
            passed: true,
            actual_efficiency: 0.85,
            minimum_required: 0.75,
            motor_type: 'premium_efficiency'
          },
          duct_leakage: {
            passed: true,
            leakage_class: 'Seal_Class_A',
            max_allowed_leakage: 4.0,
            actual_leakage: 2.1
          }
        },
        compliance_level: 'exceeds_requirements',
        energy_savings: {
          annual_kwh_savings: 1825,
          annual_cost_savings: 182.50,
          carbon_reduction_lbs: 1278
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockASHRAEValidation
      });

      const systemData = {
        fan_power: 2.5,
        fan_efficiency: 0.85,
        duct_leakage_class: 'Seal_Class_A',
        system_type: 'VAV',
        building_type: 'office'
      };

      const response = await fetch(`${API_BASE_URL}/compliance/ashrae/energy-efficiency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemData)
      });

      const result = await response.json();

      expect(result.validation_results.energy_efficiency.passed).toBe(true);
      expect(result.compliance_level).toBe('exceeds_requirements');
      expect(result.energy_savings.annual_kwh_savings).toBeGreaterThan(0);
    });
  });

  describe('NFPA 96 Grease Duct Integration', () => {
    it('should validate grease duct design compliance', async () => {
      const mockNFPAValidation = {
        success: true,
        standard: 'NFPA_96',
        validation_results: {
          velocity_requirements: {
            passed: true,
            actual_velocity: 1800,
            minimum_required: 1500,
            duct_type: 'grease_exhaust'
          },
          material_compliance: {
            passed: true,
            material: 'stainless_steel_304',
            gauge: 18,
            welded_construction: true
          },
          access_requirements: {
            passed: true,
            access_panels: 'adequate',
            cleaning_access: 'compliant',
            inspection_ports: 'present'
          },
          fire_safety: {
            passed: true,
            fire_dampers: 'installed',
            suppression_system: 'compatible',
            clearances: 'adequate'
          }
        },
        safety_rating: 'fully_compliant',
        inspection_requirements: {
          frequency: 'quarterly',
          next_inspection: '2025-11-03',
          certification_required: true
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNFPAValidation
      });

      const greaseSystemData = {
        exhaust_airflow: 3000,
        duct_velocity: 1800,
        material: 'stainless_steel_304',
        gauge: 18,
        cooking_equipment_type: 'commercial_fryer',
        building_occupancy: 'restaurant'
      };

      const response = await fetch(`${API_BASE_URL}/compliance/nfpa96/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(greaseSystemData)
      });

      const result = await response.json();

      expect(result.validation_results.velocity_requirements.passed).toBe(true);
      expect(result.validation_results.material_compliance.passed).toBe(true);
      expect(result.safety_rating).toBe('fully_compliant');
    });
  });

  describe('Multi-Standard Validation Workflow', () => {
    it('should validate against multiple standards simultaneously', async () => {
      const mockMultiStandardValidation = {
        success: true,
        standards_checked: ['SMACNA', 'ASHRAE_90.1', 'NFPA_96'],
        overall_compliance: 'compliant',
        validation_summary: {
          smacna: {
            status: 'compliant',
            score: 95,
            critical_issues: 0
          },
          ashrae: {
            status: 'compliant',
            score: 88,
            critical_issues: 0
          },
          nfpa96: {
            status: 'compliant',
            score: 92,
            critical_issues: 0
          }
        },
        composite_score: 91.7,
        certification_eligible: true,
        recommendations: [
          'Consider upgrading to premium efficiency motors for ASHRAE compliance',
          'Document quarterly inspection schedule for NFPA 96 compliance'
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMultiStandardValidation
      });

      const systemDesign = {
        system_type: 'commercial_kitchen_exhaust',
        airflow: 4000,
        duct_type: 'rectangular',
        material: 'stainless_steel',
        application: 'grease_exhaust',
        building_type: 'restaurant',
        standards_required: ['SMACNA', 'ASHRAE_90.1', 'NFPA_96']
      };

      const response = await fetch(`${API_BASE_URL}/compliance/multi-standard/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemDesign)
      });

      const result = await response.json();

      expect(result.overall_compliance).toBe('compliant');
      expect(result.composite_score).toBeGreaterThan(90);
      expect(result.certification_eligible).toBe(true);
      expect(result.validation_summary.smacna.critical_issues).toBe(0);
    });

    it('should prioritize critical violations across standards', async () => {
      const mockCriticalViolations = {
        success: true,
        overall_compliance: 'non_compliant',
        critical_violations: [
          {
            standard: 'NFPA_96',
            violation: 'insufficient_velocity',
            severity: 'critical',
            safety_impact: 'fire_hazard',
            immediate_action_required: true
          },
          {
            standard: 'SMACNA',
            violation: 'excessive_velocity',
            severity: 'major',
            safety_impact: 'noise_vibration',
            immediate_action_required: false
          }
        ],
        action_plan: {
          immediate: ['Increase exhaust velocity to meet NFPA 96 minimum'],
          short_term: ['Redesign ductwork to balance velocity requirements'],
          long_term: ['Consider variable speed controls for optimization']
        },
        compliance_timeline: '30_days_maximum'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCriticalViolations
      });

      const problematicDesign = {
        system_type: 'commercial_kitchen_exhaust',
        exhaust_velocity: 1200, // Below NFPA 96 minimum
        supply_velocity: 3000,  // Above SMACNA recommendation
        standards_required: ['SMACNA', 'NFPA_96']
      };

      const response = await fetch(`${API_BASE_URL}/compliance/multi-standard/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(problematicDesign)
      });

      const result = await response.json();

      expect(result.overall_compliance).toBe('non_compliant');
      expect(result.critical_violations).toHaveLength(2);
      expect(result.critical_violations[0].immediate_action_required).toBe(true);
      expect(result.compliance_timeline).toBe('30_days_maximum');
    });
  });
});
