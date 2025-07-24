/**
 * SMACNAValidator Test Suite
 * 
 * CRITICAL: Validates pure validation functions for HVAC standards compliance
 * Tests SMACNA, ASHRAE, and NFPA validation with comprehensive coverage
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 2.4
 */

import SMACNAValidator, { ValidationResult, CalculationData } from '../SMACNAValidator';

describe('SMACNAValidator', () => {
  describe('SMACNA Compliance Validation', () => {
    test('should validate compliant round duct', () => {
      const data: CalculationData = {
        velocity: 1500,
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 1000,
        diameter: 12,
        area: 0.785,
        application: 'supply'
      };

      const result = SMACNAValidator.validateSMACNACompliance(data);

      expect(result.isValid).toBe(true);
      expect(result.compliant).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBeGreaterThan(80);
      expect(result.standardReference).toContain('SMACNA');
    });

    test('should validate compliant rectangular duct', () => {
      const data: CalculationData = {
        velocity: 1400,
        frictionRate: 0.08,
        ductType: 'rectangular',
        airflow: 1000,
        width: 12,
        height: 8,
        aspectRatio: 1.5,
        area: 0.667,
        application: 'supply'
      };

      const result = SMACNAValidator.validateSMACNACompliance(data);

      expect(result.isValid).toBe(true);
      expect(result.compliant).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBeGreaterThan(80);
    });

    test('should flag excessive velocity', () => {
      const data: CalculationData = {
        velocity: 3000, // Exceeds SMACNA maximum of 2500
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 2000,
        diameter: 10,
        area: 0.545,
        application: 'supply'
      };

      const result = SMACNAValidator.validateSMACNACompliance(data);

      expect(result.isValid).toBe(true); // Still valid but not compliant
      expect(result.compliant).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('exceeds SMACNA maximum');
      expect(result.score).toBeLessThan(80);
    });

    test('should warn about low velocity', () => {
      const data: CalculationData = {
        velocity: 300, // Below SMACNA minimum of 400
        frictionRate: 0.02,
        ductType: 'round',
        airflow: 200,
        diameter: 16,
        area: 1.396,
        application: 'supply'
      };

      const result = SMACNAValidator.validateSMACNACompliance(data);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('below SMACNA minimum');
      expect(result.score).toBeLessThan(100);
    });

    test('should flag excessive aspect ratio', () => {
      const data: CalculationData = {
        velocity: 1500,
        frictionRate: 0.08,
        ductType: 'rectangular',
        airflow: 1000,
        width: 24,
        height: 6,
        aspectRatio: 4.5, // Exceeds SMACNA maximum of 4.0
        area: 1.0,
        application: 'supply'
      };

      const result = SMACNAValidator.validateSMACNACompliance(data);

      expect(result.compliant).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('aspect ratio');
      expect(result.errors[0]).toContain('exceeds SMACNA maximum');
    });

    test('should warn about high friction rate', () => {
      const data: CalculationData = {
        velocity: 1500,
        frictionRate: 0.15, // High friction rate
        ductType: 'round',
        airflow: 1000,
        diameter: 10,
        area: 0.545,
        application: 'supply'
      };

      const result = SMACNAValidator.validateSMACNACompliance(data);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('friction rate');
      expect(result.score).toBeLessThan(100);
    });

    test('should flag excessive friction rate', () => {
      const data: CalculationData = {
        velocity: 1500,
        frictionRate: 0.25, // Exceeds SMACNA maximum of 0.20
        ductType: 'round',
        airflow: 1000,
        diameter: 8,
        area: 0.349,
        application: 'supply'
      };

      const result = SMACNAValidator.validateSMACNACompliance(data);

      expect(result.compliant).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('friction rate');
      expect(result.errors[0]).toContain('exceeds SMACNA maximum');
    });
  });

  describe('ASHRAE Compliance Validation', () => {
    test('should validate comfort velocity for occupied spaces', () => {
      const data: CalculationData = {
        velocity: 600, // Below ASHRAE occupied zone limit of 750
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 500,
        diameter: 12,
        area: 0.785,
        location: 'occupied'
      };

      const result = SMACNAValidator.validateASHRAECompliance(data);

      expect(result.isValid).toBe(true);
      expect(result.compliant).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.score).toBe(100);
    });

    test('should warn about high velocity in occupied spaces', () => {
      const data: CalculationData = {
        velocity: 900, // Exceeds ASHRAE occupied zone limit of 750
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 800,
        diameter: 12,
        area: 0.785,
        location: 'occupied'
      };

      const result = SMACNAValidator.validateASHRAECompliance(data);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('occupied zone');
      expect(result.warnings[0]).toContain('ASHRAE comfort limit');
      expect(result.score).toBeLessThan(100);
    });

    test('should validate velocity for unoccupied spaces', () => {
      const data: CalculationData = {
        velocity: 1200, // Below ASHRAE unoccupied zone limit of 1500
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 1000,
        diameter: 12,
        area: 0.785,
        location: 'unoccupied'
      };

      const result = SMACNAValidator.validateASHRAECompliance(data);

      expect(result.isValid).toBe(true);
      expect(result.compliant).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.score).toBe(100);
    });

    test('should warn about noise-generating velocity', () => {
      const data: CalculationData = {
        velocity: 2200, // Exceeds loud noise threshold of 2000
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 1800,
        diameter: 12,
        area: 0.785,
        location: 'unoccupied'
      };

      const result = SMACNAValidator.validateASHRAECompliance(data);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('noise'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('noise attenuation'))).toBe(true);
    });
  });

  describe('NFPA 96 Compliance Validation', () => {
    test('should validate compliant grease duct', () => {
      const data: CalculationData = {
        velocity: 2000, // Meets NFPA recommended minimum
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 1500,
        diameter: 12,
        area: 0.785,
        application: 'grease',
        pressure: 1.5
      };

      const result = SMACNAValidator.validateNFPACompliance(data);

      expect(result.isValid).toBe(true);
      expect(result.compliant).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBeGreaterThan(80);
    });

    test('should flag insufficient velocity for grease removal', () => {
      const data: CalculationData = {
        velocity: 1200, // Below NFPA minimum of 1500
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 1000,
        diameter: 14,
        area: 1.069,
        application: 'grease'
      };

      const result = SMACNAValidator.validateNFPACompliance(data);

      expect(result.compliant).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('below NFPA 96 minimum');
      expect(result.errors[0]).toContain('grease removal');
    });

    test('should warn about low velocity for grease ducts', () => {
      const data: CalculationData = {
        velocity: 1700, // Above minimum but below recommended
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 1300,
        diameter: 12,
        area: 0.785,
        application: 'grease'
      };

      const result = SMACNAValidator.validateNFPACompliance(data);

      expect(result.isValid).toBe(true);
      expect(result.compliant).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('below NFPA 96 recommended');
    });

    test('should warn about rectangular grease ducts', () => {
      const data: CalculationData = {
        velocity: 2000,
        frictionRate: 0.08,
        ductType: 'rectangular',
        airflow: 1500,
        width: 12,
        height: 10,
        area: 0.833,
        application: 'grease'
      };

      const result = SMACNAValidator.validateNFPACompliance(data);

      expect(result.warnings.some(w => w.includes('round ducts'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('round duct'))).toBe(true);
    });

    test('should skip NFPA validation for non-grease applications', () => {
      const data: CalculationData = {
        velocity: 1500,
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 1000,
        diameter: 12,
        area: 0.785,
        application: 'supply'
      };

      const result = SMACNAValidator.validateNFPACompliance(data);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('only applies to grease exhaust');
    });
  });

  describe('Comprehensive Validation', () => {
    test('should validate against all applicable standards', () => {
      const data: CalculationData = {
        velocity: 1500,
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 1000,
        diameter: 12,
        area: 0.785,
        application: 'supply',
        location: 'unoccupied'
      };

      const results = SMACNAValidator.validateAllStandards(data);

      expect(results).toHaveProperty('smacna');
      expect(results).toHaveProperty('ashrae');
      expect(results).not.toHaveProperty('nfpa'); // Not grease application

      expect(results.smacna.isValid).toBe(true);
      expect(results.ashrae.isValid).toBe(true);
    });

    test('should include NFPA validation for grease ducts', () => {
      const data: CalculationData = {
        velocity: 2000,
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 1500,
        diameter: 12,
        area: 0.785,
        application: 'grease'
      };

      const results = SMACNAValidator.validateAllStandards(data);

      expect(results).toHaveProperty('smacna');
      expect(results).toHaveProperty('ashrae');
      expect(results).toHaveProperty('nfpa');

      expect(results.nfpa.isValid).toBe(true);
    });
  });

  describe('Input Data Validation', () => {
    test('should validate complete round duct data', () => {
      const data: CalculationData = {
        velocity: 1500,
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 1000,
        diameter: 12,
        area: 0.785
      };

      const validation = SMACNAValidator.validateInputData(data);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should validate complete rectangular duct data', () => {
      const data: CalculationData = {
        velocity: 1500,
        frictionRate: 0.08,
        ductType: 'rectangular',
        airflow: 1000,
        width: 12,
        height: 8,
        area: 0.667
      };

      const validation = SMACNAValidator.validateInputData(data);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should flag missing velocity', () => {
      const data: any = {
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 1000,
        diameter: 12,
        area: 0.785
      };

      const validation = SMACNAValidator.validateInputData(data);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Velocity must be greater than 0');
    });

    test('should flag missing airflow', () => {
      const data: any = {
        velocity: 1500,
        frictionRate: 0.08,
        ductType: 'round',
        diameter: 12,
        area: 0.785
      };

      const validation = SMACNAValidator.validateInputData(data);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Airflow must be greater than 0');
    });

    test('should flag missing dimensions for rectangular ducts', () => {
      const data: any = {
        velocity: 1500,
        frictionRate: 0.08,
        ductType: 'rectangular',
        airflow: 1000,
        area: 0.667
        // Missing width and height
      };

      const validation = SMACNAValidator.validateInputData(data);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Width must be greater than 0 for rectangular ducts');
      expect(validation.errors).toContain('Height must be greater than 0 for rectangular ducts');
    });

    test('should flag missing diameter for round ducts', () => {
      const data: any = {
        velocity: 1500,
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 1000,
        area: 0.785
        // Missing diameter
      };

      const validation = SMACNAValidator.validateInputData(data);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Diameter must be greater than 0 for round ducts');
    });
  });

  describe('Standards Reference Data', () => {
    test('should provide SMACNA standards', () => {
      const standards = SMACNAValidator.getSMACNAStandards();

      expect(standards).toHaveProperty('velocity');
      expect(standards).toHaveProperty('friction');
      expect(standards).toHaveProperty('aspectRatio');
      expect(standards).toHaveProperty('minimumArea');

      expect(standards.velocity.supply.max).toBe(2500);
      expect(standards.aspectRatio.maximum).toBe(4.0);
    });

    test('should provide ASHRAE standards', () => {
      const standards = SMACNAValidator.getASHRAEStandards();

      expect(standards).toHaveProperty('comfortVelocity');
      expect(standards).toHaveProperty('noiseVelocity');

      expect(standards.comfortVelocity.occupiedZone).toBe(750);
      expect(standards.noiseVelocity.quiet).toBe(1000);
    });

    test('should provide NFPA standards', () => {
      const standards = SMACNAValidator.getNFPAStandards();

      expect(standards).toHaveProperty('greaseVelocity');
      expect(standards).toHaveProperty('greasePressure');

      expect(standards.greaseVelocity.minimum).toBe(1500);
      expect(standards.greasePressure.maximum).toBe(2.0);
    });
  });

  describe('Performance Requirements', () => {
    test('should complete validation quickly', () => {
      const data: CalculationData = {
        velocity: 1500,
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 1000,
        diameter: 12,
        area: 0.785
      };

      const startTime = Date.now();
      const result = SMACNAValidator.validateSMACNACompliance(data);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(10); // Should complete in <10ms
      expect(result).toBeDefined();
    });

    test('should handle batch validation efficiently', () => {
      const testCases: CalculationData[] = [
        { velocity: 1200, frictionRate: 0.06, ductType: 'round', airflow: 800, diameter: 12, area: 0.785 },
        { velocity: 1500, frictionRate: 0.08, ductType: 'round', airflow: 1000, diameter: 12, area: 0.785 },
        { velocity: 1800, frictionRate: 0.10, ductType: 'rectangular', airflow: 1200, width: 12, height: 8, area: 0.667 },
        { velocity: 2000, frictionRate: 0.12, ductType: 'rectangular', airflow: 1500, width: 14, height: 10, area: 0.972 },
        { velocity: 2200, frictionRate: 0.14, ductType: 'round', airflow: 1800, diameter: 14, area: 1.069 }
      ];

      const startTime = Date.now();
      
      const results = testCases.map(data => SMACNAValidator.validateSMACNACompliance(data));

      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50); // Batch should complete in <50ms
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.isValid).toBe(true);
        expect(typeof result.score).toBe('number');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle validation errors gracefully', () => {
      const invalidData: any = {
        velocity: 'invalid',
        frictionRate: 0.08,
        ductType: 'round',
        airflow: 1000,
        diameter: 12,
        area: 0.785
      };

      const result = SMACNAValidator.validateSMACNACompliance(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.score).toBe(0);
    });

    test('should handle missing data gracefully', () => {
      const incompleteData: any = {
        velocity: 1500
        // Missing most required fields
      };

      const result = SMACNAValidator.validateSMACNACompliance(incompleteData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
