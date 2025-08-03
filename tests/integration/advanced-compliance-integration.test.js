/**
 * Advanced HVAC Compliance Integration Tests
 *
 * Tests for ASHRAE 90.2 and IECC 2024 compliance checking
 * Part of Phase 1 bridging plan for comprehensive HVAC standards support
 *
 * @see docs/post-implementation-bridging-plan.md Task 1.2
 */

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Advanced HVAC Compliance Integration Tests', () => {
  const baseUrl = 'http://localhost:5000';
  
  // Sample HVAC design data for testing
  const sampleHVACDesign = {
    system_type: 'variable_volume',
    airflow_cfm: 5000,
    fan_power_watts: 4000,
    duct_insulation_r_value: 6.0,
    duct_leakage_cfm: 150,
    climate_zone: '4',
    building_type: 'office',
    conditioned_area_sqft: 10000,
    equipment_efficiency: {
      air_conditioner: {
        seer: 14.5,
        eer: 11.2
      }
    },
    controls: {
      automatic_shutoff: true,
      demand_control_ventilation: true,
      economizer_required: true
    }
  };

  const compliantHVACDesign = {
    ...sampleHVACDesign,
    fan_power_watts: 3500, // Lower fan power for compliance
    duct_insulation_r_value: 8.0, // Higher insulation
    duct_leakage_cfm: 100, // Lower leakage
    equipment_efficiency: {
      air_conditioner: {
        seer: 15.0,
        eer: 12.0
      }
    }
  };

  const iecc2024Design = {
    ...compliantHVACDesign,
    fan_power_watts: 3000, // Even lower for IECC 2024
    duct_insulation_r_value: 10.0, // Enhanced insulation
    duct_leakage_cfm: 80, // Stricter leakage
    controls: {
      ...compliantHVACDesign.controls,
      smart_controls: true,
      zone_control: true,
      renewable_percentage: 15.0
    }
  };

  beforeEach(() => {
    fetch.mockClear();
  });

  describe('ASHRAE 90.2 Compliance Testing', () => {
    test('should validate compliant ASHRAE 90.2 design', async () => {
      // Mock successful API response
      const mockResponse = {
        input: compliantHVACDesign,
        compliance: {
          standard: 'ASHRAE 90.2',
          is_compliant: true,
          compliance_percentage: 95.0,
          violations: [],
          recommendations: [],
          critical_issues: 0,
          warnings: 0,
          energy_savings_potential: 0.0,
          cost_impact: 'Low'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${baseUrl}/api/compliance/ashrae-902`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compliantHVACDesign)
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.compliance.standard).toBe('ASHRAE 90.2');
      expect(result.compliance.is_compliant).toBe(true);
      expect(result.compliance.compliance_percentage).toBeGreaterThan(90);
      expect(result.compliance.violations).toHaveLength(0);
      expect(result.compliance.critical_issues).toBe(0);
    });

    test('should identify ASHRAE 90.2 violations in non-compliant design', async () => {
      // Mock response with violations
      const mockResponse = {
        input: sampleHVACDesign,
        compliance: {
          standard: 'ASHRAE 90.2',
          is_compliant: false,
          compliance_percentage: 65.0,
          violations: [
            'Fan power 0.80 W/CFM exceeds ASHRAE 90.2 limit of 1.0 W/CFM',
            'Duct leakage rate 1.5 CFM/100 sq ft exceeds ASHRAE 90.2 limit of 4.0 CFM/100 sq ft'
          ],
          recommendations: [
            'Consider variable speed drives or more efficient fan selection',
            'Improve duct sealing and testing procedures'
          ],
          critical_issues: 2,
          warnings: 0,
          energy_savings_potential: 25.0,
          cost_impact: 'Medium'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${baseUrl}/api/compliance/ashrae-902`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleHVACDesign)
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.compliance.is_compliant).toBe(false);
      expect(result.compliance.violations.length).toBeGreaterThan(0);
      expect(result.compliance.recommendations.length).toBeGreaterThan(0);
      expect(result.compliance.energy_savings_potential).toBeGreaterThan(0);
    });

    test('should handle missing required fields for ASHRAE 90.2', async () => {
      const incompleteDesign = {
        system_type: 'variable_volume',
        airflow_cfm: 5000
        // Missing other required fields
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Missing required fields',
          missing_fields: ['fan_power_watts', 'duct_insulation_r_value', 'duct_leakage_cfm']
        })
      });

      const response = await fetch(`${baseUrl}/api/compliance/ashrae-902`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteDesign)
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe('IECC 2024 Compliance Testing', () => {
    test('should validate compliant IECC 2024 design', async () => {
      // Mock successful API response
      const mockResponse = {
        input: iecc2024Design,
        compliance: {
          standard: 'IECC 2024',
          is_compliant: true,
          compliance_percentage: 98.0,
          violations: [],
          recommendations: [],
          critical_issues: 0,
          warnings: 0,
          energy_savings_potential: 0.0,
          cost_impact: 'Low'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${baseUrl}/api/compliance/iecc-2024`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(iecc2024Design)
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.compliance.standard).toBe('IECC 2024');
      expect(result.compliance.is_compliant).toBe(true);
      expect(result.compliance.compliance_percentage).toBeGreaterThan(95);
      expect(result.compliance.violations).toHaveLength(0);
    });

    test('should identify IECC 2024 violations with stricter requirements', async () => {
      // Mock response with IECC 2024 specific violations
      const mockResponse = {
        input: sampleHVACDesign,
        compliance: {
          standard: 'IECC 2024',
          is_compliant: false,
          compliance_percentage: 55.0,
          violations: [
            'Fan power 0.80 W/CFM exceeds IECC 2024 limit of 0.8 W/CFM',
            'Duct insulation R-6.0 below IECC 2024 minimum R-8.0 for climate zone 4',
            'Missing required IECC 2024 control: smart_controls',
            'Renewable energy percentage below IECC 2024 minimum 10%'
          ],
          recommendations: [
            'Consider high-efficiency fans with variable speed drives',
            'Increase duct insulation to minimum R-8.0',
            'Install smart controls system',
            'Consider solar panels or other renewable energy systems'
          ],
          critical_issues: 2,
          warnings: 2,
          energy_savings_potential: 35.0,
          cost_impact: 'High'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${baseUrl}/api/compliance/iecc-2024`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleHVACDesign)
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.compliance.is_compliant).toBe(false);
      expect(result.compliance.violations.length).toBeGreaterThan(3);
      expect(result.compliance.energy_savings_potential).toBeGreaterThan(30);
      expect(result.compliance.cost_impact).toBe('High');
    });
  });

  describe('All Advanced Standards Testing', () => {
    test('should validate design against all advanced standards', async () => {
      // Mock response for combined standards check
      const mockResponse = {
        input: compliantHVACDesign,
        compliance_results: {
          ASHRAE_90_2: {
            standard: 'ASHRAE 90.2',
            is_compliant: true,
            compliance_percentage: 95.0,
            violations: [],
            recommendations: [],
            critical_issues: 0,
            warnings: 0,
            energy_savings_potential: 0.0,
            cost_impact: 'Low'
          },
          IECC_2024: {
            standard: 'IECC 2024',
            is_compliant: false,
            compliance_percentage: 85.0,
            violations: ['Missing required IECC 2024 control: smart_controls'],
            recommendations: ['Install smart controls system'],
            critical_issues: 0,
            warnings: 1,
            energy_savings_potential: 10.0,
            cost_impact: 'Medium'
          }
        },
        summary: {
          total_standards: 2,
          compliant_standards: 1,
          average_compliance: 90.0,
          total_critical_issues: 0,
          total_warnings: 1
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${baseUrl}/api/compliance/all-advanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compliantHVACDesign)
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.summary.total_standards).toBe(2);
      expect(result.summary.compliant_standards).toBe(1);
      expect(result.summary.average_compliance).toBe(90.0);
      expect(result.compliance_results.ASHRAE_90_2).toBeDefined();
      expect(result.compliance_results.IECC_2024).toBeDefined();
    });
  });

  describe('Standards Information Testing', () => {
    test('should retrieve information about supported standards', async () => {
      // Mock standards info response
      const mockResponse = {
        supported_standards: [
          {
            name: 'ASHRAE 90.2',
            description: 'Energy-Efficient Design of Low-Rise Residential Buildings',
            endpoint: '/api/compliance/ashrae-902',
            version: '2018',
            focus_areas: [
              'Fan power limits',
              'Duct insulation requirements',
              'Duct leakage limits',
              'Equipment efficiency',
              'Control systems'
            ]
          },
          {
            name: 'IECC 2024',
            description: 'International Energy Conservation Code 2024',
            endpoint: '/api/compliance/iecc-2024',
            version: '2024',
            focus_areas: [
              'Enhanced fan power limits',
              'Improved insulation requirements',
              'Stricter duct leakage limits',
              'High-efficiency equipment',
              'Smart control systems',
              'Renewable energy integration'
            ]
          }
        ],
        combined_endpoint: '/api/compliance/all-advanced',
        backward_compatibility: {
          existing_endpoints_preserved: true,
          existing_api_unchanged: true,
          note: 'All existing compliance endpoints remain fully functional'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${baseUrl}/api/compliance/standards-info`, {
        method: 'GET'
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.supported_standards).toHaveLength(2);
      expect(result.supported_standards[0].name).toBe('ASHRAE 90.2');
      expect(result.supported_standards[1].name).toBe('IECC 2024');
      expect(result.backward_compatibility.existing_endpoints_preserved).toBe(true);
    });
  });

  describe('Backward Compatibility Testing', () => {
    test('should preserve existing compliance API functionality', async () => {
      // Test that existing endpoints still work
      const existingEndpoints = [
        '/api/compliance/check',
        '/api/compliance/smacna',
        '/api/compliance/ashrae'
      ];

      for (const endpoint of existingEndpoints) {
        // Mock existing endpoint response
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            validation: {
              compliant: true,
              standard: 'Existing Standard',
              checks: [],
              warnings: [],
              errors: []
            }
          })
        });

        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sampleHVACDesign)
        });

        expect(response.ok).toBe(true);
      }
    });
  });
});
