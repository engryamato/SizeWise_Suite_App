/**
 * SMACNA Validator Tests
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * Comprehensive test suite for SMACNA/NFPA/ASHRAE compliance validation
 * ensuring professional engineering standards are properly enforced.
 * 
 * @fileoverview SMACNA validator tests
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import { SMACNAValidator, SMACNAStandardsProvider } from '../../services/SMACNAValidator';
import {
  SMACNACenterline,
  SMACNAPressureClass,
  SMACNAMaterialType,
  SMACNAValidationResult
} from '../../core/interfaces/ISMACNAValidator';

// Mock logger
class MockLogger {
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
  debug = jest.fn();
}

// Mock configuration service
class MockConfigurationService {
  private config = new Map<string, any>();

  async get<T>(key: string): Promise<T> {
    return this.config.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    this.config.set(key, value);
  }
}

describe('SMACNAValidator', () => {
  let validator: SMACNAValidator;
  let standardsProvider: SMACNAStandardsProvider;
  let mockLogger: MockLogger;
  let mockConfigService: MockConfigurationService;

  beforeEach(() => {
    mockLogger = new MockLogger();
    mockConfigService = new MockConfigurationService();
    standardsProvider = new SMACNAStandardsProvider();
    validator = new SMACNAValidator(
      standardsProvider,
      mockLogger as any,
      mockConfigService as any
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Standards Provider', () => {
    it('should provide gauge table data', async () => {
      const gaugeTable = await standardsProvider.getGaugeTable();
      
      expect(gaugeTable).toBeDefined();
      expect(gaugeTable.length).toBeGreaterThan(0);
      expect(gaugeTable[0]).toHaveProperty('material');
      expect(gaugeTable[0]).toHaveProperty('pressureClass');
      expect(gaugeTable[0]).toHaveProperty('minThickness');
      expect(gaugeTable[0]).toHaveProperty('gaugeNumber');
    });

    it('should provide reinforcement table data', async () => {
      const reinforcementTable = await standardsProvider.getReinforcementTable();
      
      expect(reinforcementTable).toBeDefined();
      expect(reinforcementTable.length).toBeGreaterThan(0);
      expect(reinforcementTable[0]).toHaveProperty('pressureClass');
      expect(reinforcementTable[0]).toHaveProperty('ductDimension');
      expect(reinforcementTable[0]).toHaveProperty('reinforcementType');
    });

    it('should provide sealing requirements', async () => {
      const sealingTable = await standardsProvider.getSealingTable();
      
      expect(sealingTable).toBeDefined();
      expect(sealingTable.length).toBeGreaterThan(0);
      expect(sealingTable[0]).toHaveProperty('pressureClass');
      expect(sealingTable[0]).toHaveProperty('sealingClass');
      expect(sealingTable[0]).toHaveProperty('leakageRate');
    });

    it('should provide pressure class specifications', async () => {
      const specs = await standardsProvider.getPressureClassSpecs();
      
      expect(specs).toBeDefined();
      expect(specs[SMACNAPressureClass.LOW_PRESSURE]).toBeDefined();
      expect(specs[SMACNAPressureClass.MEDIUM_PRESSURE]).toBeDefined();
      expect(specs[SMACNAPressureClass.HIGH_PRESSURE]).toBeDefined();
    });
  });

  describe('Centerline Validation', () => {
    const createTestCenterline = (overrides: Partial<SMACNACenterline> = {}): SMACNACenterline => ({
      id: 'test-centerline-1',
      points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
      width: 24,
      height: 12,
      material: SMACNAMaterialType.GALVANIZED_STEEL,
      pressureClass: SMACNAPressureClass.LOW_PRESSURE,
      airflow: 1000,
      velocity: 1200,
      pressureLoss: 0.08,
      ...overrides
    });

    it('should validate compliant low pressure centerline', async () => {
      const centerline = createTestCenterline();
      
      const result = await validator.validateCenterline(centerline);
      
      expect(result.centerlineId).toBe(centerline.id);
      expect(result.isCompliant).toBe(true);
      expect(result.overallScore).toBeGreaterThan(80);
      expect(result.checks).toHaveLength(4); // pressure, material, reinforcement, sealing
      expect(result.requiredCorrections).toHaveLength(0);
    });

    it('should validate medium pressure centerline requirements', async () => {
      const centerline = createTestCenterline({
        pressureClass: SMACNAPressureClass.MEDIUM_PRESSURE,
        width: 36,
        height: 24,
        pressureLoss: 3.5
      });
      
      const result = await validator.validateCenterline(centerline);
      
      expect(result.isCompliant).toBe(true);
      expect(result.checks.some(check => check.checkType === 'pressure_class')).toBe(true);
      expect(result.checks.some(check => check.checkType === 'reinforcement')).toBe(true);
    });

    it('should validate high pressure centerline requirements', async () => {
      const centerline = createTestCenterline({
        pressureClass: SMACNAPressureClass.HIGH_PRESSURE,
        width: 48,
        height: 36,
        pressureLoss: 8.0
      });
      
      const result = await validator.validateCenterline(centerline);
      
      expect(result.isCompliant).toBe(true);
      expect(result.checks.some(check => check.checkType === 'pressure_class')).toBe(true);
    });

    it('should detect pressure class violations', async () => {
      const centerline = createTestCenterline({
        pressureClass: SMACNAPressureClass.LOW_PRESSURE,
        pressureLoss: 5.0 // Exceeds low pressure limit
      });
      
      const result = await validator.validateCenterline(centerline);
      
      expect(result.isCompliant).toBe(false);
      const pressureCheck = result.checks.find(check => check.checkType === 'pressure_class');
      expect(pressureCheck?.isCompliant).toBe(false);
      expect(pressureCheck?.severity).toBe('error');
      expect(pressureCheck?.recommendation).toContain('upgrading');
    });

    it('should validate material thickness requirements', async () => {
      const centerline = createTestCenterline({
        width: 60, // Large dimension requiring thicker material
        height: 48
      });
      
      const result = await validator.validateCenterline(centerline);
      
      const materialCheck = result.checks.find(check => check.checkType === 'material_thickness');
      expect(materialCheck).toBeDefined();
      expect(materialCheck?.isCompliant).toBe(true);
    });

    it('should validate reinforcement requirements', async () => {
      const centerline = createTestCenterline({
        pressureClass: SMACNAPressureClass.MEDIUM_PRESSURE,
        width: 72, // Large dimension requiring reinforcement
        height: 48
      });
      
      const result = await validator.validateCenterline(centerline);
      
      const reinforcementCheck = result.checks.find(check => check.checkType === 'reinforcement');
      expect(reinforcementCheck).toBeDefined();
      expect(reinforcementCheck?.message).toContain('reinforcement');
    });

    it('should validate sealing requirements', async () => {
      const centerline = createTestCenterline({
        pressureClass: SMACNAPressureClass.HIGH_PRESSURE
      });
      
      const result = await validator.validateCenterline(centerline);
      
      const sealingCheck = result.checks.find(check => check.checkType === 'sealing');
      expect(sealingCheck).toBeDefined();
      expect(sealingCheck?.message).toContain('Sealing class');
    });
  });

  describe('Multiple Centerlines Validation', () => {
    it('should validate multiple centerlines', async () => {
      const centerlines: SMACNACenterline[] = [
        {
          id: 'centerline-1',
          points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
          width: 24,
          height: 12,
          material: SMACNAMaterialType.GALVANIZED_STEEL,
          pressureClass: SMACNAPressureClass.LOW_PRESSURE,
          airflow: 1000,
          velocity: 1200,
          pressureLoss: 0.08
        },
        {
          id: 'centerline-2',
          points: [{ x: 100, y: 0 }, { x: 200, y: 0 }],
          width: 36,
          height: 24,
          material: SMACNAMaterialType.GALVANIZED_STEEL,
          pressureClass: SMACNAPressureClass.MEDIUM_PRESSURE,
          airflow: 2000,
          velocity: 1500,
          pressureLoss: 3.2
        }
      ];
      
      const results = await validator.validateCenterlines(centerlines);
      
      expect(results).toHaveLength(2);
      expect(results[0].centerlineId).toBe('centerline-1');
      expect(results[1].centerlineId).toBe('centerline-2');
      expect(results.every(result => result.isCompliant)).toBe(true);
    });

    it('should handle validation errors gracefully', async () => {
      const centerlines: SMACNACenterline[] = [
        {
          id: 'invalid-centerline',
          points: [],
          width: -1, // Invalid dimension
          height: -1,
          material: SMACNAMaterialType.GALVANIZED_STEEL,
          pressureClass: SMACNAPressureClass.LOW_PRESSURE,
          airflow: 0,
          velocity: 0,
          pressureLoss: 0
        }
      ];
      
      // Should not throw, but handle gracefully
      const results = await validator.validateCenterlines(centerlines);
      expect(results).toHaveLength(0); // Failed validations are skipped
    });
  });

  describe('Compliance Reporting', () => {
    it('should generate compliance report', async () => {
      const projectId = 'test-project-1';
      
      const report = await validator.generateComplianceReport(projectId);
      
      expect(report.projectId).toBe(projectId);
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.overallCompliance).toBeGreaterThanOrEqual(0);
      expect(report.overallCompliance).toBeLessThanOrEqual(100);
      expect(report.summary).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.standardsReferences).toBeDefined();
    });

    it('should include standards references', async () => {
      const references = await validator.getStandardsReferences();
      
      expect(references).toContain('SMACNA HVAC Duct Construction Standards - 3rd Edition');
      expect(references).toContain('NFPA 90A - Standard for the Installation of Air-Conditioning and Ventilating Systems');
      expect(references).toContain('ASHRAE Standard 90.1 - Energy Standard for Buildings');
    });
  });

  describe('Configuration Management', () => {
    it('should update validator configuration', async () => {
      const newConfig = {
        strictMode: false,
        allowableVariance: 10,
        includeNFPAStandards: false
      };
      
      await validator.updateConfig(newConfig);
      
      const config = await validator.getConfig();
      expect(config.strictMode).toBe(false);
      expect(config.allowableVariance).toBe(10);
      expect(config.includeNFPAStandards).toBe(false);
    });

    it('should get current configuration', async () => {
      const config = await validator.getConfig();
      
      expect(config).toBeDefined();
      expect(config.strictMode).toBeDefined();
      expect(config.allowableVariance).toBeDefined();
      expect(config.reportFormat).toBeDefined();
    });
  });

  describe('Gauge Requirements', () => {
    it('should get gauge requirements for low pressure galvanized steel', async () => {
      const requirement = await validator.getGaugeRequirements(
        SMACNAMaterialType.GALVANIZED_STEEL,
        SMACNAPressureClass.LOW_PRESSURE,
        30
      );
      
      expect(requirement).toBeDefined();
      expect(requirement.material).toBe(SMACNAMaterialType.GALVANIZED_STEEL);
      expect(requirement.pressureClass).toBe(SMACNAPressureClass.LOW_PRESSURE);
      expect(requirement.gaugeNumber).toBeDefined();
    });

    it('should get reinforcement requirements for medium pressure', async () => {
      const requirement = await validator.getReinforcementRequirements(
        SMACNAPressureClass.MEDIUM_PRESSURE,
        54
      );
      
      expect(requirement).toBeDefined();
      expect(requirement.pressureClass).toBe(SMACNAPressureClass.MEDIUM_PRESSURE);
      expect(requirement.reinforcementType).toBeDefined();
    });

    it('should get sealing requirements for high pressure', async () => {
      const requirement = await validator.getSealingRequirements(
        SMACNAPressureClass.HIGH_PRESSURE
      );
      
      expect(requirement).toBeDefined();
      expect(requirement.pressureClass).toBe(SMACNAPressureClass.HIGH_PRESSURE);
      expect(requirement.sealingClass).toBe('A');
      expect(requirement.leakageRate).toBe(6);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid pressure class', async () => {
      const centerline: SMACNACenterline = {
        id: 'invalid-pressure-class',
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
        width: 24,
        height: 12,
        material: SMACNAMaterialType.GALVANIZED_STEEL,
        pressureClass: 'invalid' as any,
        airflow: 1000,
        velocity: 1200,
        pressureLoss: 0.08
      };
      
      const result = await validator.validateCenterline(centerline);
      
      expect(result.isCompliant).toBe(false);
      const pressureCheck = result.checks.find(check => check.checkType === 'pressure_class');
      expect(pressureCheck?.isCompliant).toBe(false);
      expect(pressureCheck?.severity).toBe('error');
    });

    it('should handle validation errors gracefully', async () => {
      // Mock a validation error
      const originalValidate = validator.validatePressureClass;
      validator.validatePressureClass = jest.fn().mockRejectedValue(new Error('Validation error'));
      
      const centerline: SMACNACenterline = {
        id: 'error-centerline',
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
        width: 24,
        height: 12,
        material: SMACNAMaterialType.GALVANIZED_STEEL,
        pressureClass: SMACNAPressureClass.LOW_PRESSURE,
        airflow: 1000,
        velocity: 1200,
        pressureLoss: 0.08
      };
      
      await expect(validator.validateCenterline(centerline)).rejects.toThrow('SMACNA validation failed');
      
      // Restore original method
      validator.validatePressureClass = originalValidate;
    });
  });
});
