/**
 * TierEnforcer Test Suite
 * 
 * CRITICAL: Validates business logic tier enforcement engine
 * Tests project limits, export restrictions, and feature access validation
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 2.5
 */

import TierEnforcer, { UserTier, ProjectData, EnforcementResult } from '../TierEnforcer';
import { FeatureManager } from '../../../../backend/features/FeatureManager';
import { DatabaseManager } from '../../../../backend/database/DatabaseManager';
import { DuctSizingInputs } from '../../calculations/AirDuctCalculator';

// Mock dependencies
jest.mock('../../../../backend/features/FeatureManager');
jest.mock('../../../../backend/database/DatabaseManager');

describe('TierEnforcer', () => {
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
      isEnabled: jest.fn(),
      userRepository: {
        getUser: jest.fn()
      }
    } as any;

    // Setup user repository mocks
    mockFeatureManager.userRepository.getUser.mockImplementation((userId: string) => {
      const user = Object.values(mockUsers).find(u => u.id === userId);
      return Promise.resolve(user);
    });

    tierEnforcer = new TierEnforcer(mockFeatureManager, mockDbManager);
  });

  describe('Project Creation Validation', () => {
    test('should allow project creation for free user within limits', async () => {
      // Mock project count below limit
      jest.spyOn(tierEnforcer as any, 'getUserProjectCount').mockResolvedValue(2);

      const result = await tierEnforcer.validateProjectCreation(mockUsers.freeUser.id);

      expect(result.allowed).toBe(true);
      expect(result.currentTier).toBe('free');
      expect(result.limitations).toContain('3/3 projects used');
    });

    test('should deny project creation for free user at limit', async () => {
      // Mock project count at limit
      jest.spyOn(tierEnforcer as any, 'getUserProjectCount').mockResolvedValue(3);

      const result = await tierEnforcer.validateProjectCreation(mockUsers.freeUser.id);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Project limit reached');
      expect(result.requiredTier).toBe('pro');
      expect(result.upgradeMessage).toContain('Upgrade to Pro');
    });

    test('should allow unlimited projects for pro user', async () => {
      jest.spyOn(tierEnforcer as any, 'getUserProjectCount').mockResolvedValue(100);

      const result = await tierEnforcer.validateProjectCreation(mockUsers.proUser.id);

      expect(result.allowed).toBe(true);
      expect(result.currentTier).toBe('pro');
    });

    test('should allow unlimited projects for enterprise user', async () => {
      jest.spyOn(tierEnforcer as any, 'getUserProjectCount').mockResolvedValue(1000);

      const result = await tierEnforcer.validateProjectCreation(mockUsers.enterpriseUser.id);

      expect(result.allowed).toBe(true);
      expect(result.currentTier).toBe('enterprise');
    });
  });

  describe('Project Content Validation', () => {
    test('should allow project content within free tier limits', async () => {
      const projectData: Partial<ProjectData> = {
        segments: new Array(8), // Within limit of 10
        rooms: new Array(3),    // Within limit of 5
        equipment: new Array(2) // Within limit of 3
      };

      const result = await tierEnforcer.validateProjectContent(mockUsers.freeUser.id, projectData);

      expect(result.allowed).toBe(true);
      expect(result.currentTier).toBe('free');
      expect(result.limitations).toContain('8/10 segments used');
      expect(result.limitations).toContain('3/5 rooms used');
      expect(result.limitations).toContain('2/3 equipment items used');
    });

    test('should deny project content exceeding free tier limits', async () => {
      const projectData: Partial<ProjectData> = {
        segments: new Array(15), // Exceeds limit of 10
        rooms: new Array(3),
        equipment: new Array(2)
      };

      const result = await tierEnforcer.validateProjectContent(mockUsers.freeUser.id, projectData);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Too many segments');
      expect(result.requiredTier).toBe('pro');
    });

    test('should allow large projects for pro user', async () => {
      const projectData: Partial<ProjectData> = {
        segments: new Array(50), // Within pro limit of 100
        rooms: new Array(25),    // Within pro limit of 50
        equipment: new Array(15) // Within pro limit of 25
      };

      const result = await tierEnforcer.validateProjectContent(mockUsers.proUser.id, projectData);

      expect(result.allowed).toBe(true);
      expect(result.currentTier).toBe('pro');
    });

    test('should allow unlimited content for enterprise user', async () => {
      const projectData: Partial<ProjectData> = {
        segments: new Array(500),
        rooms: new Array(200),
        equipment: new Array(100)
      };

      const result = await tierEnforcer.validateProjectContent(mockUsers.enterpriseUser.id, projectData);

      expect(result.allowed).toBe(true);
      expect(result.currentTier).toBe('enterprise');
    });
  });

  describe('Export Access Validation', () => {
    beforeEach(() => {
      // Mock feature manager to return enabled for all features
      mockFeatureManager.isEnabled.mockResolvedValue({
        enabled: true,
        tier: 'pro',
        responseTime: 20,
        cached: false
      });
    });

    test('should allow PDF export for free user', async () => {
      const result = await tierEnforcer.validateExportAccess(mockUsers.freeUser.id, 'pdf');

      expect(result.allowed).toBe(true);
      expect(result.currentTier).toBe('free');
      expect(result.limitations).toContain('Exports will include watermark');
    });

    test('should deny PNG export for free user', async () => {
      const result = await tierEnforcer.validateExportAccess(mockUsers.freeUser.id, 'png');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('requires pro tier');
      expect(result.requiredTier).toBe('pro');
    });

    test('should allow PNG export for pro user', async () => {
      const result = await tierEnforcer.validateExportAccess(mockUsers.proUser.id, 'png');

      expect(result.allowed).toBe(true);
      expect(result.currentTier).toBe('pro');
      expect(result.limitations).not.toContain('watermark');
    });

    test('should deny CAD export for pro user', async () => {
      const result = await tierEnforcer.validateExportAccess(mockUsers.proUser.id, 'dwg');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('requires enterprise tier');
      expect(result.requiredTier).toBe('enterprise');
    });

    test('should allow all exports for enterprise user', async () => {
      const formats = ['pdf', 'json', 'png', 'excel', 'dwg', 'ifc'];
      
      for (const format of formats) {
        const result = await tierEnforcer.validateExportAccess(mockUsers.enterpriseUser.id, format);
        expect(result.allowed).toBe(true);
      }
    });

    test('should enforce resolution limits', async () => {
      // Free user with high resolution
      const freeResult = await tierEnforcer.validateExportAccess(mockUsers.freeUser.id, 'pdf', 4320);
      expect(freeResult.allowed).toBe(false);
      expect(freeResult.reason).toContain('Resolution');

      // Pro user with 4K resolution
      const proResult = await tierEnforcer.validateExportAccess(mockUsers.proUser.id, 'png', 4320);
      expect(proResult.allowed).toBe(true);

      // Pro user with 8K resolution
      const proHighResult = await tierEnforcer.validateExportAccess(mockUsers.proUser.id, 'png', 8640);
      expect(proHighResult.allowed).toBe(false);
    });
  });

  describe('Calculation Access Validation', () => {
    test('should allow basic calculations for free user', async () => {
      const inputs: DuctSizingInputs = {
        airflow: 500,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const result = await tierEnforcer.validateCalculationAccess(mockUsers.freeUser.id, inputs);

      expect(result.allowed).toBe(true);
      expect(result.currentTier).toBe('free');
      expect(result.limitations?.[0]).toContain('basic');
    });

    test('should deny complex calculations for free user', async () => {
      const inputs: DuctSizingInputs = {
        airflow: 5000,
        ductType: 'rectangular',
        frictionRate: 0.15,
        units: 'imperial',
        material: 'stainless_steel'
      };

      const projectData: Partial<ProjectData> = {
        segments: new Array(50),
        rooms: new Array(20),
        equipment: new Array(15)
      };

      const result = await tierEnforcer.validateCalculationAccess(mockUsers.freeUser.id, inputs, projectData);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('complexity');
      expect(result.requiredTier).toBe('pro');
    });

    test('should allow advanced calculations for pro user', async () => {
      const inputs: DuctSizingInputs = {
        airflow: 3000,
        ductType: 'rectangular',
        frictionRate: 0.12,
        units: 'imperial',
        material: 'aluminum'
      };

      const result = await tierEnforcer.validateCalculationAccess(mockUsers.proUser.id, inputs);

      expect(result.allowed).toBe(true);
      expect(result.currentTier).toBe('pro');
    });

    test('should allow expert calculations for enterprise user', async () => {
      const inputs: DuctSizingInputs = {
        airflow: 10000,
        ductType: 'rectangular',
        frictionRate: 0.20,
        units: 'imperial',
        material: 'stainless_steel',
        targetVelocity: 2500
      };

      const projectData: Partial<ProjectData> = {
        segments: new Array(200),
        rooms: new Array(100),
        equipment: new Array(50)
      };

      const result = await tierEnforcer.validateCalculationAccess(mockUsers.enterpriseUser.id, inputs, projectData);

      expect(result.allowed).toBe(true);
      expect(result.currentTier).toBe('enterprise');
    });
  });

  describe('Feature Access Validation', () => {
    test('should allow basic features for free user', async () => {
      mockFeatureManager.isEnabled.mockResolvedValue({
        enabled: true,
        tier: 'free',
        responseTime: 20,
        cached: false
      });

      const result = await tierEnforcer.validateFeatureAccess(mockUsers.freeUser.id, 'air_duct_sizer');

      expect(result.allowed).toBe(true);
      expect(result.currentTier).toBe('free');
    });

    test('should deny pro features for free user', async () => {
      mockFeatureManager.isEnabled.mockResolvedValue({
        enabled: false,
        tier: 'free',
        reason: 'Requires Pro tier',
        responseTime: 20,
        cached: false
      });

      const result = await tierEnforcer.validateFeatureAccess(mockUsers.freeUser.id, 'unlimited_segments');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not available');
      expect(result.requiredTier).toBe('pro');
    });

    test('should allow pro features for pro user', async () => {
      mockFeatureManager.isEnabled.mockResolvedValue({
        enabled: true,
        tier: 'pro',
        responseTime: 20,
        cached: false
      });

      const result = await tierEnforcer.validateFeatureAccess(mockUsers.proUser.id, 'unlimited_segments');

      expect(result.allowed).toBe(true);
      expect(result.currentTier).toBe('pro');
    });
  });

  describe('Calculation Performance', () => {
    beforeEach(() => {
      mockFeatureManager.isEnabled.mockResolvedValue({
        enabled: true,
        tier: 'pro',
        responseTime: 20,
        cached: false
      });
    });

    test('should perform calculation with enforcement', async () => {
      const inputs: DuctSizingInputs = {
        airflow: 1000,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const result = await tierEnforcer.performCalculation(mockUsers.proUser.id, inputs);

      expect(result.enforcement.allowed).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result?.diameter).toBeGreaterThan(0);
      expect(result.validation).toBeDefined();
      expect(result.validation?.isValid).toBe(true);
    });

    test('should deny calculation for insufficient tier', async () => {
      const inputs: DuctSizingInputs = {
        airflow: 5000,
        ductType: 'rectangular',
        frictionRate: 0.15,
        units: 'imperial',
        material: 'stainless_steel'
      };

      const projectData: Partial<ProjectData> = {
        segments: new Array(100),
        rooms: new Array(50),
        equipment: new Array(25)
      };

      const result = await tierEnforcer.performCalculation(mockUsers.freeUser.id, inputs, projectData);

      expect(result.enforcement.allowed).toBe(false);
      expect(result.result).toBeUndefined();
      expect(result.validation).toBeUndefined();
    });
  });

  describe('Static Methods', () => {
    test('should provide tier limits', () => {
      const freeLimits = TierEnforcer.getTierLimits('free');
      const proLimits = TierEnforcer.getTierLimits('pro');
      const enterpriseLimits = TierEnforcer.getTierLimits('enterprise');

      expect(freeLimits.maxProjects).toBe(3);
      expect(proLimits.maxProjects).toBe(-1);
      expect(enterpriseLimits.maxProjects).toBe(-1);

      expect(freeLimits.maxSegmentsPerProject).toBe(10);
      expect(proLimits.maxSegmentsPerProject).toBe(100);
      expect(enterpriseLimits.maxSegmentsPerProject).toBe(-1);
    });

    test('should provide export formats', () => {
      const formats = TierEnforcer.getExportFormats();

      expect(formats).toHaveProperty('pdf');
      expect(formats).toHaveProperty('png');
      expect(formats).toHaveProperty('dwg');

      expect(formats.pdf.requiredTier).toBe('free');
      expect(formats.png.requiredTier).toBe('pro');
      expect(formats.dwg.requiredTier).toBe('enterprise');
    });

    test('should provide available export formats by tier', () => {
      const freeFormats = TierEnforcer.getAvailableExportFormats('free');
      const proFormats = TierEnforcer.getAvailableExportFormats('pro');
      const enterpriseFormats = TierEnforcer.getAvailableExportFormats('enterprise');

      expect(freeFormats).toHaveLength(2); // pdf, json
      expect(proFormats).toHaveLength(4); // pdf, json, png, excel
      expect(enterpriseFormats).toHaveLength(6); // all formats

      expect(freeFormats.map(f => f.id)).toEqual(['pdf', 'json']);
      expect(proFormats.map(f => f.id)).toEqual(['pdf', 'json', 'png', 'excel']);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      jest.spyOn(tierEnforcer as any, 'getUserTier').mockRejectedValue(new Error('Database error'));

      const result = await tierEnforcer.validateProjectCreation(mockUsers.freeUser.id);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Validation error');
    });

    test('should handle feature manager errors gracefully', async () => {
      mockFeatureManager.isEnabled.mockRejectedValue(new Error('Feature manager error'));

      const result = await tierEnforcer.validateFeatureAccess(mockUsers.proUser.id, 'test_feature');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Validation error');
    });

    test('should handle invalid export format', async () => {
      const result = await tierEnforcer.validateExportAccess(mockUsers.proUser.id, 'invalid_format');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Unknown export format');
    });

    test('should default to free tier on user lookup error', async () => {
      mockFeatureManager.userRepository.getUser.mockRejectedValue(new Error('User not found'));

      const result = await tierEnforcer.validateProjectCreation('invalid-user');

      expect(result.currentTier).toBe('free');
    });
  });

  describe('Performance Requirements', () => {
    test('should complete validation quickly', async () => {
      const startTime = Date.now();
      
      await tierEnforcer.validateProjectCreation(mockUsers.proUser.id);
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(50); // Should complete in <50ms
    });

    test('should handle batch validations efficiently', async () => {
      const validations = [
        () => tierEnforcer.validateProjectCreation(mockUsers.freeUser.id),
        () => tierEnforcer.validateExportAccess(mockUsers.proUser.id, 'pdf'),
        () => tierEnforcer.validateFeatureAccess(mockUsers.enterpriseUser.id, 'cad_export'),
        () => tierEnforcer.validateCalculationAccess(mockUsers.proUser.id, {
          airflow: 1000,
          ductType: 'round',
          frictionRate: 0.08,
          units: 'imperial'
        })
      ];

      const startTime = Date.now();
      
      const results = await Promise.all(validations.map(fn => fn()));
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(200); // Batch should complete in <200ms
      expect(results).toHaveLength(4);
    });
  });
});
