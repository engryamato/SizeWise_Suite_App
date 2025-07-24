/**
 * AirDuctCalculator Test Suite
 * 
 * CRITICAL: Validates pure calculation functions for air duct sizing
 * Tests SMACNA compliance, performance requirements, and business logic
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 2.4
 */

import AirDuctCalculator, { DuctSizingInputs, DuctSizingResults } from '../AirDuctCalculator';

describe('AirDuctCalculator', () => {
  describe('Round Duct Calculations', () => {
    test('should calculate round duct sizing correctly', () => {
      const inputs: DuctSizingInputs = {
        airflow: 1000,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const results = AirDuctCalculator.calculateDuctSizing(inputs);

      expect(results.diameter).toBeDefined();
      expect(results.diameter).toBeGreaterThan(0);
      expect(results.area).toBeGreaterThan(0);
      expect(results.velocity).toBeGreaterThan(0);
      expect(results.pressureLoss).toBeGreaterThan(0);
      expect(results.reynoldsNumber).toBeGreaterThan(0);
      expect(results.frictionFactor).toBeGreaterThan(0);
    });

    test('should meet SMACNA velocity requirements for round ducts', () => {
      const inputs: DuctSizingInputs = {
        airflow: 1500,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const results = AirDuctCalculator.calculateDuctSizing(inputs);

      // SMACNA velocity limits: 400-2500 FPM
      expect(results.velocity).toBeGreaterThanOrEqual(400);
      expect(results.velocity).toBeLessThanOrEqual(2500);
      expect(results.standardsCompliance.velocityCompliant).toBe(true);
    });

    test('should use standard round duct sizes', () => {
      const inputs: DuctSizingInputs = {
        airflow: 800,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const results = AirDuctCalculator.calculateDuctSizing(inputs);
      const standardSizes = AirDuctCalculator.getStandardSizes().round;

      expect(standardSizes).toContain(results.diameter);
    });

    test('should handle high airflow round ducts', () => {
      const inputs: DuctSizingInputs = {
        airflow: 5000,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const results = AirDuctCalculator.calculateDuctSizing(inputs);

      expect(results.diameter).toBeGreaterThan(20);
      expect(results.velocity).toBeLessThanOrEqual(2500);
    });
  });

  describe('Rectangular Duct Calculations', () => {
    test('should calculate rectangular duct sizing correctly', () => {
      const inputs: DuctSizingInputs = {
        airflow: 1000,
        ductType: 'rectangular',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const results = AirDuctCalculator.calculateDuctSizing(inputs);

      expect(results.width).toBeDefined();
      expect(results.height).toBeDefined();
      expect(results.width).toBeGreaterThan(0);
      expect(results.height).toBeGreaterThan(0);
      expect(results.area).toBeGreaterThan(0);
      expect(results.velocity).toBeGreaterThan(0);
      expect(results.equivalentDiameter).toBeDefined();
      expect(results.hydraulicDiameter).toBeDefined();
      expect(results.aspectRatio).toBeDefined();
    });

    test('should meet SMACNA aspect ratio requirements', () => {
      const inputs: DuctSizingInputs = {
        airflow: 1200,
        ductType: 'rectangular',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const results = AirDuctCalculator.calculateDuctSizing(inputs);

      // SMACNA maximum aspect ratio: 4:1
      expect(results.aspectRatio).toBeLessThanOrEqual(4.0);
      expect(results.aspectRatio).toBeGreaterThanOrEqual(1.0);
    });

    test('should use standard rectangular duct sizes', () => {
      const inputs: DuctSizingInputs = {
        airflow: 900,
        ductType: 'rectangular',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const results = AirDuctCalculator.calculateDuctSizing(inputs);
      const standardSizes = AirDuctCalculator.getStandardSizes().rectangular;

      expect(standardSizes).toContain(results.width);
      expect(standardSizes).toContain(results.height);
    });

    test('should calculate equivalent diameter correctly', () => {
      const width = 12;
      const height = 8;
      const equivalentDiameter = AirDuctCalculator.calculateEquivalentDiameter(width, height);

      // SMACNA formula: 1.3 * (width * height)^0.625 / (width + height)^0.25
      const expected = 1.3 * Math.pow(width * height, 0.625) / Math.pow(width + height, 0.25);
      expect(equivalentDiameter).toBeCloseTo(expected, 2);
    });

    test('should calculate hydraulic diameter correctly', () => {
      const width = 12;
      const height = 8;
      const hydraulicDiameter = AirDuctCalculator.calculateHydraulicDiameter(width, height);

      // Formula: 4 * width * height / (2 * (width + height))
      const expected = (4 * width * height) / (2 * (width + height));
      expect(hydraulicDiameter).toBeCloseTo(expected, 2);
    });

    test('should calculate aspect ratio correctly', () => {
      const width = 16;
      const height = 8;
      const aspectRatio = AirDuctCalculator.calculateAspectRatio(width, height);

      expect(aspectRatio).toBe(2.0);

      // Test with reversed dimensions
      const aspectRatio2 = AirDuctCalculator.calculateAspectRatio(height, width);
      expect(aspectRatio2).toBe(2.0);
    });
  });

  describe('Metric Unit Conversion', () => {
    test('should convert metric inputs to imperial correctly', () => {
      const metricInputs: DuctSizingInputs = {
        airflow: 1000, // m³/h
        ductType: 'round',
        frictionRate: 1.0, // Pa/m
        units: 'metric'
      };

      const results = AirDuctCalculator.calculateDuctSizing(metricInputs);

      // Should have valid results after conversion
      expect(results.diameter).toBeGreaterThan(0);
      expect(results.velocity).toBeGreaterThan(0);
      expect(results.area).toBeGreaterThan(0);
    });

    test('should handle metric rectangular duct calculations', () => {
      const metricInputs: DuctSizingInputs = {
        airflow: 1500, // m³/h
        ductType: 'rectangular',
        frictionRate: 0.8, // Pa/m
        units: 'metric'
      };

      const results = AirDuctCalculator.calculateDuctSizing(metricInputs);

      expect(results.width).toBeGreaterThan(0);
      expect(results.height).toBeGreaterThan(0);
      expect(results.aspectRatio).toBeLessThanOrEqual(4.0);
    });
  });

  describe('Material Properties', () => {
    test('should provide material properties', () => {
      const materials = AirDuctCalculator.getMaterials();

      expect(materials).toHaveProperty('galvanized_steel');
      expect(materials).toHaveProperty('aluminum');
      expect(materials).toHaveProperty('stainless_steel');
      expect(materials).toHaveProperty('pvc');

      expect(materials.galvanized_steel.roughnessFactor).toBe(0.0003);
      expect(materials.aluminum.roughnessFactor).toBe(0.0002);
    });

    test('should affect pressure loss calculations', () => {
      const baseInputs: DuctSizingInputs = {
        airflow: 1000,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const steelResults = AirDuctCalculator.calculateDuctSizing({
        ...baseInputs,
        material: 'galvanized_steel'
      });

      const aluminumResults = AirDuctCalculator.calculateDuctSizing({
        ...baseInputs,
        material: 'aluminum'
      });

      // Aluminum should have slightly lower pressure loss due to smoother surface
      expect(aluminumResults.pressureLoss).toBeLessThan(steelResults.pressureLoss);
    });
  });

  describe('Validation and Recommendations', () => {
    test('should provide warnings for high velocity', () => {
      const inputs: DuctSizingInputs = {
        airflow: 3000,
        ductType: 'round',
        frictionRate: 0.15, // High friction to force small duct
        units: 'imperial'
      };

      const results = AirDuctCalculator.calculateDuctSizing(inputs);

      if (results.velocity > 2000) {
        expect(results.warnings.length).toBeGreaterThan(0);
        expect(results.isOptimal).toBe(false);
      }
    });

    test('should provide warnings for low velocity', () => {
      const inputs: DuctSizingInputs = {
        airflow: 200,
        ductType: 'round',
        frictionRate: 0.02, // Low friction to force large duct
        units: 'imperial'
      };

      const results = AirDuctCalculator.calculateDuctSizing(inputs);

      if (results.velocity < 600) {
        expect(results.warnings.length).toBeGreaterThan(0);
      }
    });

    test('should provide recommendations for optimization', () => {
      const inputs: DuctSizingInputs = {
        airflow: 1000,
        ductType: 'rectangular',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const results = AirDuctCalculator.calculateDuctSizing(inputs);

      expect(Array.isArray(results.recommendations)).toBe(true);
      
      // Should have recommendations if not optimal
      if (!results.isOptimal) {
        expect(results.recommendations.length).toBeGreaterThan(0);
      }
    });

    test('should validate standards compliance', () => {
      const inputs: DuctSizingInputs = {
        airflow: 1000,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const results = AirDuctCalculator.calculateDuctSizing(inputs);

      expect(results.standardsCompliance).toHaveProperty('smacna');
      expect(results.standardsCompliance).toHaveProperty('ashrae');
      expect(results.standardsCompliance).toHaveProperty('velocityCompliant');
      
      expect(typeof results.standardsCompliance.smacna).toBe('boolean');
      expect(typeof results.standardsCompliance.ashrae).toBe('boolean');
      expect(typeof results.standardsCompliance.velocityCompliant).toBe('boolean');
    });
  });

  describe('Performance Requirements', () => {
    test('should complete calculations quickly', () => {
      const inputs: DuctSizingInputs = {
        airflow: 1000,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const startTime = Date.now();
      const results = AirDuctCalculator.calculateDuctSizing(inputs);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50); // Should complete in <50ms
      expect(results).toBeDefined();
    });

    test('should handle batch calculations efficiently', () => {
      const testCases = [
        { airflow: 500, ductType: 'round' as const },
        { airflow: 1000, ductType: 'round' as const },
        { airflow: 1500, ductType: 'rectangular' as const },
        { airflow: 2000, ductType: 'rectangular' as const },
        { airflow: 2500, ductType: 'round' as const }
      ];

      const startTime = Date.now();
      
      const results = testCases.map(testCase => 
        AirDuctCalculator.calculateDuctSizing({
          ...testCase,
          frictionRate: 0.08,
          units: 'imperial'
        })
      );

      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(200); // Batch should complete in <200ms
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.velocity).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should throw error for invalid airflow', () => {
      const inputs: DuctSizingInputs = {
        airflow: 0,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial'
      };

      expect(() => AirDuctCalculator.calculateDuctSizing(inputs)).toThrow('Airflow must be greater than 0');
    });

    test('should throw error for invalid friction rate', () => {
      const inputs: DuctSizingInputs = {
        airflow: 1000,
        ductType: 'round',
        frictionRate: 0,
        units: 'imperial'
      };

      expect(() => AirDuctCalculator.calculateDuctSizing(inputs)).toThrow('Friction rate must be greater than 0');
    });

    test('should throw error for invalid duct type', () => {
      const inputs: any = {
        airflow: 1000,
        ductType: 'invalid',
        frictionRate: 0.08,
        units: 'imperial'
      };

      expect(() => AirDuctCalculator.calculateDuctSizing(inputs)).toThrow('Duct type must be "round" or "rectangular"');
    });

    test('should throw error for invalid units', () => {
      const inputs: any = {
        airflow: 1000,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'invalid'
      };

      expect(() => AirDuctCalculator.calculateDuctSizing(inputs)).toThrow('Units must be "imperial" or "metric"');
    });

    test('should handle very small airflow', () => {
      const inputs: DuctSizingInputs = {
        airflow: 50,
        ductType: 'round',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const results = AirDuctCalculator.calculateDuctSizing(inputs);

      expect(results.diameter).toBeGreaterThan(0);
      expect(results.velocity).toBeGreaterThan(0);
    });

    test('should handle very large airflow', () => {
      const inputs: DuctSizingInputs = {
        airflow: 10000,
        ductType: 'rectangular',
        frictionRate: 0.08,
        units: 'imperial'
      };

      const results = AirDuctCalculator.calculateDuctSizing(inputs);

      expect(results.width).toBeGreaterThan(0);
      expect(results.height).toBeGreaterThan(0);
      expect(results.velocity).toBeLessThanOrEqual(2500);
    });
  });

  describe('Static Methods', () => {
    test('should provide velocity limits', () => {
      const limits = AirDuctCalculator.getVelocityLimits();

      expect(limits).toHaveProperty('supply');
      expect(limits).toHaveProperty('return');
      expect(limits).toHaveProperty('exhaust');

      expect(limits.supply.min).toBe(400);
      expect(limits.supply.max).toBe(2500);
      expect(limits.supply.optimal).toBe(1500);
    });

    test('should provide standard sizes', () => {
      const sizes = AirDuctCalculator.getStandardSizes();

      expect(sizes).toHaveProperty('round');
      expect(sizes).toHaveProperty('rectangular');

      expect(Array.isArray(sizes.round)).toBe(true);
      expect(Array.isArray(sizes.rectangular)).toBe(true);

      expect(sizes.round).toContain(12);
      expect(sizes.rectangular).toContain(12);
    });
  });
});
