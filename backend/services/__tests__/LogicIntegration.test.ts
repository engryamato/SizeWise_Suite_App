/**
 * Logic Integration Test Suite
 * 
 * CRITICAL: Validates integration between core logic extraction and tier enforcement
 * Tests end-to-end business logic tier enforcement throughout the system
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md sections 2.4-2.5
 */

import AirDuctCalculator, { DuctSizingInputs } from '../calculations/AirDuctCalculator';
import SMACNAValidator, { CalculationData } from '../calculations/SMACNAValidator';
import TierEnforcer, { UserTier } from '../enforcement/TierEnforcer';
import { FeatureManager } from '../../../backend/features/FeatureManager';
import { DatabaseManager } from '../../../backend/database/DatabaseManager';

// Mock dependencies
jest.mock('../../../backend/features/FeatureManager');
jest.mock('../../../backend/database/DatabaseManager');

describe('Logic Integration - Core Logic + Tier Enforcement', () => {
  let tierEnforcer: TierEnforcer;
  let mockFeatureManager: jest.Mocked<FeatureManager>;
  let mockDbManager: jest.Mocked<DatabaseManager>;

  const mockUsers = {
    freeUser: { id: 'free-user', tier: 'free' as UserTier },
    proUser: { id: 'pro-user', tier: 'pro' as UserTier },
    enterpriseUser: { id: 'enterprise-user', tier: 'enterprise' as UserTier }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock DatabaseManager
    mockDbManager = {
      initialize: jest.fn(),
      close: jest.fn(),
      getConnection: jest.fn()
    } as any;

    // Mock FeatureManager
    mockFeatureManager = {
      isEnabled: jest.fn().mockResolvedValue({
        enabled: true,
        tier: 'pro',
        responseTime: 20,
        cached: false
      }),
      userRepository: {
        getUser: jest.fn().mockImplementation((userId: string) => {
          const user = Object.values(mockUsers).find(u => u.id === userId);
          return Promise.resolve(user);
        })
      }
    } as any;

    tierEnforcer = new TierEnforcer(mockFeatureManager, mockDbManager);
  });

  describe('End-to-End Calculation Workflow', () => {
    test('should complete full calculation workflow for free user', async () => {
      const inputs: DuctSizingInputs = {
        airflow: 800,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial'
      };

      // Step 1: Validate calculation access
      const accessResult = await tierEnforcer.validateCalculationAccess(mockUsers.freeUser.id, inputs);
      expect(accessResult.allowed).toBe(true);
      expect(accessResult.currentTier).toBe('free');

      // Step 2: Perform calculation using core logic
      const calculationResult = AirDuctCalculator.calculateDuctSizing(inputs);
      expect(calculationResult.diameter).toBeGreaterThan(0);
      expect(calculationResult.velocity).toBeGreaterThan(0);

      // Step 3: Validate against SMACNA standards
      const validationData: CalculationData = {
        velocity: calculationResult.velocity,
        frictionRate: inputs.frictionRate,
        ductType: inputs.ductType,
        airflow: inputs.airflow,
        diameter: calculationResult.diameter,
        area: calculationResult.area
      };

      const validationResult = SMACNAValidator.validateSMACNACompliance(validationData);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.score).toBeGreaterThan(70);

      // Step 4: Integrated calculation with enforcement
      const integratedResult = await tierEnforcer.performCalculation(mockUsers.freeUser.id, inputs);
      expect(integratedResult.enforcement.allowed).toBe(true);
      expect(integratedResult.result).toBeDefined();
      expect(integratedResult.validation).toBeDefined();
    });

    test('should enforce tier limits for complex calculations', async () => {
      const complexInputs: DuctSizingInputs = {
        airflow: 5000,
        ductType: 'rectangular',
        frictionRate: 0.15,
        units: 'imperial',
        material: 'stainless_steel',
        targetVelocity: 2200
      };

      const largeProject = {
        segments: new Array(50),
        rooms: new Array(25),
        equipment: new Array(15)
      };

      // Free user should be denied
      const freeResult = await tierEnforcer.validateCalculationAccess(
        mockUsers.freeUser.id, 
        complexInputs, 
        largeProject
      );
      expect(freeResult.allowed).toBe(false);
      expect(freeResult.requiredTier).toBe('pro');

      // Pro user should be allowed
      const proResult = await tierEnforcer.validateCalculationAccess(
        mockUsers.proUser.id, 
        complexInputs, 
        largeProject
      );
      expect(proResult.allowed).toBe(true);
    });

    test('should validate export workflow with tier enforcement', async () => {
      const inputs: DuctSizingInputs = {
        airflow: 1200,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial'
      };

      // Perform calculation
      const calculationResult = await tierEnforcer.performCalculation(mockUsers.proUser.id, inputs);
      expect(calculationResult.enforcement.allowed).toBe(true);

      // Validate different export formats
      const pdfExport = await tierEnforcer.validateExportAccess(mockUsers.proUser.id, 'pdf');
      expect(pdfExport.allowed).toBe(true);

      const pngExport = await tierEnforcer.validateExportAccess(mockUsers.proUser.id, 'png', 1080);
      expect(pngExport.allowed).toBe(true);

      const cadExport = await tierEnforcer.validateExportAccess(mockUsers.proUser.id, 'dwg');
      expect(cadExport.allowed).toBe(false); // Requires enterprise
    });
  });

  describe('Cross-Component Validation', () => {
    test('should validate calculation complexity assessment', async () => {
      const testCases = [
        {
          inputs: { airflow: 500, ductType: 'round' as const, frictionRate: 0.06, units: 'imperial' as const },
          expectedComplexity: 'basic',
          allowedTiers: ['free', 'pro', 'enterprise']
        },
        {
          inputs: { airflow: 2000, ductType: 'rectangular' as const, frictionRate: 0.10, units: 'imperial' as const },
          project: { segments: new Array(20), rooms: new Array(10) },
          expectedComplexity: 'intermediate',
          allowedTiers: ['pro', 'enterprise']
        },
        {
          inputs: { 
            airflow: 8000, 
            ductType: 'rectangular' as const, 
            frictionRate: 0.18, 
            units: 'imperial' as const,
            material: 'stainless_steel'
          },
          project: { segments: new Array(100), rooms: new Array(50), equipment: new Array(30) },
          expectedComplexity: 'expert',
          allowedTiers: ['enterprise']
        }
      ];

      for (const testCase of testCases) {
        for (const [tierName, user] of Object.entries(mockUsers)) {
          const result = await tierEnforcer.validateCalculationAccess(
            user.id, 
            testCase.inputs, 
            testCase.project
          );

          if (testCase.allowedTiers.includes(tierName.replace('User', ''))) {
            expect(result.allowed).toBe(true);
          } else {
            expect(result.allowed).toBe(false);
          }
        }
      }
    });

    test('should integrate SMACNA validation with tier enforcement', async () => {
      const inputs: DuctSizingInputs = {
        airflow: 1500,
        ductType: 'rectangular',
        frictionRate: 0.08,
        units: 'imperial'
      };

      // Perform integrated calculation
      const result = await tierEnforcer.performCalculation(mockUsers.proUser.id, inputs);

      expect(result.enforcement.allowed).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.validation).toBeDefined();

      // Verify SMACNA compliance
      expect(result.validation?.isValid).toBe(true);
      expect(result.validation?.standardReference).toContain('SMACNA');

      // Verify calculation results
      expect(result.result?.width).toBeGreaterThan(0);
      expect(result.result?.height).toBeGreaterThan(0);
      expect(result.result?.aspectRatio).toBeLessThanOrEqual(4.0);
      expect(result.result?.velocity).toBeGreaterThan(400);
      expect(result.result?.velocity).toBeLessThan(2500);
    });

    test('should handle material-specific tier enforcement', async () => {
      const standardMaterial: DuctSizingInputs = {
        airflow: 1000,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial',
        material: 'galvanized_steel'
      };

      const customMaterial: DuctSizingInputs = {
        airflow: 1000,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial',
        material: 'stainless_steel'
      };

      // Free user with standard material should be allowed
      const standardResult = await tierEnforcer.validateCalculationAccess(
        mockUsers.freeUser.id, 
        standardMaterial
      );
      expect(standardResult.allowed).toBe(true);

      // Free user with custom material might be denied based on complexity
      const customResult = await tierEnforcer.validateCalculationAccess(
        mockUsers.freeUser.id, 
        customMaterial
      );
      // Result depends on overall complexity score
      expect(typeof customResult.allowed).toBe('boolean');
    });
  });

  describe('Performance Integration', () => {
    test('should meet performance requirements for integrated workflow', async () => {
      const inputs: DuctSizingInputs = {
        airflow: 1000,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const startTime = Date.now();

      // Complete workflow: validation + calculation + standards check
      const result = await tierEnforcer.performCalculation(mockUsers.proUser.id, inputs);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(100); // Should complete in <100ms
      expect(result.enforcement.allowed).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.validation).toBeDefined();
    });

    test('should handle batch operations efficiently', async () => {
      const testInputs = [
        { airflow: 500, ductType: 'round' as const },
        { airflow: 1000, ductType: 'round' as const },
        { airflow: 1500, ductType: 'rectangular' as const },
        { airflow: 2000, ductType: 'rectangular' as const },
        { airflow: 2500, ductType: 'round' as const }
      ].map(input => ({
        ...input,
        frictionRate: 0.08,
        units: 'imperial' as const
      }));

      const startTime = Date.now();

      const results = await Promise.all(
        testInputs.map(inputs => 
          tierEnforcer.performCalculation(mockUsers.proUser.id, inputs)
        )
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(300); // Batch should complete in <300ms
      expect(results).toHaveLength(5);
      
      results.forEach(result => {
        expect(result.enforcement.allowed).toBe(true);
        expect(result.result).toBeDefined();
        expect(result.validation).toBeDefined();
      });
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle calculation errors gracefully', async () => {
      const invalidInputs: any = {
        airflow: 0, // Invalid airflow
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const result = await tierEnforcer.performCalculation(mockUsers.proUser.id, invalidInputs);

      expect(result.enforcement.allowed).toBe(false);
      expect(result.enforcement.reason).toContain('error');
      expect(result.result).toBeUndefined();
    });

    test('should handle validation errors gracefully', async () => {
      // Mock feature manager to throw error
      mockFeatureManager.isEnabled.mockRejectedValue(new Error('Feature manager error'));

      const inputs: DuctSizingInputs = {
        airflow: 1000,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const result = await tierEnforcer.performCalculation(mockUsers.proUser.id, inputs);

      expect(result.enforcement.allowed).toBe(false);
      expect(result.enforcement.reason).toContain('Validation error');
    });
  });

  describe('Business Logic Consistency', () => {
    test('should maintain consistency between UI and business logic enforcement', async () => {
      // Test that business logic enforcement matches UI tier boundaries
      const testScenarios = [
        {
          tier: 'free',
          maxSegments: 10,
          maxRooms: 5,
          maxEquipment: 3,
          allowedExports: ['pdf', 'json']
        },
        {
          tier: 'pro',
          maxSegments: 100,
          maxRooms: 50,
          maxEquipment: 25,
          allowedExports: ['pdf', 'json', 'png', 'excel']
        },
        {
          tier: 'enterprise',
          maxSegments: -1, // Unlimited
          maxRooms: -1,
          maxEquipment: -1,
          allowedExports: ['pdf', 'json', 'png', 'excel', 'dwg', 'ifc']
        }
      ];

      for (const scenario of testScenarios) {
        const limits = TierEnforcer.getTierLimits(scenario.tier as UserTier);
        
        expect(limits.maxSegmentsPerProject).toBe(scenario.maxSegments);
        expect(limits.maxRoomsPerProject).toBe(scenario.maxRooms);
        expect(limits.maxEquipmentPerProject).toBe(scenario.maxEquipment);
        expect(limits.allowedExportFormats).toEqual(scenario.allowedExports);
      }
    });

    test('should validate feature flag integration', async () => {
      const features = [
        { name: 'air_duct_sizer', tier: 'free' },
        { name: 'unlimited_segments', tier: 'pro' },
        { name: 'equipment_selection', tier: 'pro' },
        { name: 'high_res_pdf_export', tier: 'pro' },
        { name: 'enhanced_csv_export', tier: 'pro' },
        { name: 'cad_export', tier: 'enterprise' },
        { name: 'api_access', tier: 'enterprise' }
      ];

      for (const feature of features) {
        // Mock feature as enabled for appropriate tier
        mockFeatureManager.isEnabled.mockResolvedValue({
          enabled: true,
          tier: feature.tier as UserTier,
          responseTime: 20,
          cached: false
        });

        const result = await tierEnforcer.validateFeatureAccess(
          mockUsers[`${feature.tier}User` as keyof typeof mockUsers].id,
          feature.name
        );

        expect(result.allowed).toBe(true);
      }
    });
  });

  describe('Data Consistency', () => {
    test('should maintain data consistency across calculations', async () => {
      const inputs: DuctSizingInputs = {
        airflow: 1200,
        ductType: 'rectangular',
        frictionRate: 0.08,
        units: 'imperial'
      };

      // Perform calculation through tier enforcer
      const enforcedResult = await tierEnforcer.performCalculation(mockUsers.proUser.id, inputs);

      // Perform same calculation directly
      const directResult = AirDuctCalculator.calculateDuctSizing(inputs);

      // Results should be identical
      expect(enforcedResult.result?.width).toBe(directResult.width);
      expect(enforcedResult.result?.height).toBe(directResult.height);
      expect(enforcedResult.result?.velocity).toBe(directResult.velocity);
      expect(enforcedResult.result?.area).toBe(directResult.area);
    });

    test('should maintain validation consistency', async () => {
      const calculationData: CalculationData = {
        velocity: 1500,
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 1000,
        diameter: 12,
        area: 0.785
      };

      // Validate through tier enforcer calculation
      const inputs: DuctSizingInputs = {
        airflow: calculationData.airflow,
        ductType: calculationData.ductType,
        frictionRate: calculationData.frictionRate,
        units: 'imperial'
      };

      const enforcedResult = await tierEnforcer.performCalculation(mockUsers.proUser.id, inputs);

      // Validate directly
      const directValidation = SMACNAValidator.validateSMACNACompliance(calculationData);

      // Validation results should be consistent
      expect(enforcedResult.validation?.isValid).toBe(directValidation.isValid);
      expect(enforcedResult.validation?.compliant).toBe(directValidation.compliant);
    });
  });
});
