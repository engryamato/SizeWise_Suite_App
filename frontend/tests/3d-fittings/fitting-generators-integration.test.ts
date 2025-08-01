/**
 * Fitting Generators Integration Tests
 * Comprehensive testing of all fitting generators with various parameters
 */

import { fittingFactory } from '../../lib/3d-fittings/fitting-factory';
import { validationSystem } from '../../lib/3d-fittings/validation-system';
import { 
  FittingType, 
  ElbowParams, 
  TransitionParams,
  FittingResult 
} from '../../lib/3d-fittings/fitting-interfaces';
import { MaterialType, GaugeType } from '../../lib/3d-fittings/smacna-gauge-tables';

describe('Fitting Generators Integration Tests', () => {
  describe('Elbow Generator Integration', () => {
    test('should generate round elbow with standard parameters', async () => {
      const params: ElbowParams = {
        material: 'galvanized_steel',
        gauge: '24',
        diameter: 12,
        bendRadius: 18,
        angle: 90
      };

      const result = await fittingFactory.generateFitting(FittingType.ELBOW, params);
      
      expect(result).toBeDefined();
      expect(result.mesh).toBeDefined();
      expect(result.type).toBe(FittingType.ELBOW);
      expect(result.parameters.material).toBe('galvanized_steel');
      expect(result.parameters.gauge).toBe('24');
      expect(result.parameters.diameter).toBe(12);
    });

    test('should generate elbow with various diameters', async () => {
      const testDiameters = [6, 8, 12, 18, 24, 36, 48];
      
      for (const diameter of testDiameters) {
        const params: ElbowParams = {
          material: 'galvanized_steel',
          gauge: '24',
          diameter,
          bendRadius: diameter * 1.5,
          angle: 90
        };

        const result = await fittingFactory.generateFitting(FittingType.ELBOW, params);
        
        expect(result).toBeDefined();
        expect(result.mesh).toBeDefined();
        expect(result.parameters.diameter).toBe(diameter);
        
        // Verify mesh has reasonable vertex count
        expect(result.mesh.geometry.attributes.position.count).toBeGreaterThan(100);
        expect(result.mesh.geometry.attributes.position.count).toBeLessThan(50000);
      }
    });

    test('should generate elbow with various angles', async () => {
      const testAngles = [30, 45, 60, 90, 120, 135, 180];
      
      for (const angle of testAngles) {
        const params: ElbowParams = {
          material: 'galvanized_steel',
          gauge: '24',
          diameter: 12,
          bendRadius: 18,
          angle
        };

        const result = await fittingFactory.generateFitting(FittingType.ELBOW, params);
        
        expect(result).toBeDefined();
        expect(result.mesh).toBeDefined();
        expect(result.parameters.angle).toBe(angle);
      }
    });

    test('should generate elbow with different materials', async () => {
      const testMaterials: MaterialType[] = ['galvanized_steel', 'aluminum', 'stainless_steel'];
      
      for (const material of testMaterials) {
        const params: ElbowParams = {
          material,
          gauge: '24',
          diameter: 12,
          bendRadius: 18,
          angle: 90
        };

        const result = await fittingFactory.generateFitting(FittingType.ELBOW, params);
        
        expect(result).toBeDefined();
        expect(result.mesh).toBeDefined();
        expect(result.parameters.material).toBe(material);
        
        // Verify material properties are applied
        expect(result.mesh.material).toBeDefined();
      }
    });

    test('should generate elbow with different gauges', async () => {
      const testGauges: GaugeType[] = ['14', '16', '18', '20', '22', '24', '26'];
      
      for (const gauge of testGauges) {
        const params: ElbowParams = {
          material: 'galvanized_steel',
          gauge,
          diameter: 12,
          bendRadius: 18,
          angle: 90
        };

        const result = await fittingFactory.generateFitting(FittingType.ELBOW, params);
        
        expect(result).toBeDefined();
        expect(result.mesh).toBeDefined();
        expect(result.parameters.gauge).toBe(gauge);
      }
    });
  });

  describe('Transition Generator Integration', () => {
    test('should generate transition with standard parameters', async () => {
      const params: TransitionParams = {
        material: 'galvanized_steel',
        gauge: '24',
        inletDiameter: 18,
        outletDiameter: 12,
        length: 24
      };

      const result = await fittingFactory.generateFitting(FittingType.TRANSITION, params);
      
      expect(result).toBeDefined();
      expect(result.mesh).toBeDefined();
      expect(result.type).toBe(FittingType.TRANSITION);
      expect(result.parameters.inletDiameter).toBe(18);
      expect(result.parameters.outletDiameter).toBe(12);
    });

    test('should generate transitions with various size ratios', async () => {
      const testCases = [
        { inlet: 24, outlet: 18 }, // Small reduction
        { inlet: 24, outlet: 12 }, // Medium reduction
        { inlet: 24, outlet: 8 },  // Large reduction
        { inlet: 12, outlet: 18 }, // Expansion
        { inlet: 8, outlet: 24 }   // Large expansion
      ];
      
      for (const testCase of testCases) {
        const params: TransitionParams = {
          material: 'galvanized_steel',
          gauge: '24',
          inletDiameter: testCase.inlet,
          outletDiameter: testCase.outlet,
          length: Math.abs(testCase.inlet - testCase.outlet) * 2
        };

        const result = await fittingFactory.generateFitting(FittingType.TRANSITION, params);
        
        expect(result).toBeDefined();
        expect(result.mesh).toBeDefined();
        expect(result.parameters.inletDiameter).toBe(testCase.inlet);
        expect(result.parameters.outletDiameter).toBe(testCase.outlet);
      }
    });

    test('should generate transitions with various lengths', async () => {
      const testLengths = [12, 18, 24, 36, 48];
      
      for (const length of testLengths) {
        const params: TransitionParams = {
          material: 'galvanized_steel',
          gauge: '24',
          inletDiameter: 18,
          outletDiameter: 12,
          length
        };

        const result = await fittingFactory.generateFitting(FittingType.TRANSITION, params);
        
        expect(result).toBeDefined();
        expect(result.mesh).toBeDefined();
        expect(result.parameters.length).toBe(length);
      }
    });
  });

  describe('SMACNA Compliance Integration', () => {
    test('should validate SMACNA compliance for various fitting configurations', async () => {
      const testConfigurations = [
        {
          type: FittingType.ELBOW,
          params: {
            material: 'galvanized_steel' as MaterialType,
            gauge: '24' as GaugeType,
            diameter: 18,
            bendRadius: 27,
            angle: 90
          }
        },
        {
          type: FittingType.TRANSITION,
          params: {
            material: 'galvanized_steel' as MaterialType,
            gauge: '22' as GaugeType,
            inletDiameter: 24,
            outletDiameter: 18,
            length: 24
          }
        }
      ];

      for (const config of testConfigurations) {
        // Validate parameters
        const validation = fittingFactory.validateFitting(config.type, config.params);
        expect(validation.isValid).toBe(true);

        // Check SMACNA compliance
        const compliance = validationSystem.checkSMACNACompliance(config.params);
        expect(compliance.standard).toBe('SMACNA');
        
        // Generate fitting
        const result = await fittingFactory.generateFitting(config.type, config.params);
        expect(result).toBeDefined();
        expect(result.mesh).toBeDefined();
      }
    });

    test('should handle non-compliant configurations gracefully', async () => {
      const nonCompliantParams: ElbowParams = {
        material: 'galvanized_steel',
        gauge: '30', // Too thin for large diameter
        diameter: 48,
        bendRadius: 72,
        angle: 90
      };

      // Should validate but with warnings
      const validation = fittingFactory.validateFitting(FittingType.ELBOW, nonCompliantParams);
      expect(validation.warnings.length).toBeGreaterThan(0);

      // Should still generate fitting
      const result = await fittingFactory.generateFitting(FittingType.ELBOW, nonCompliantParams);
      expect(result).toBeDefined();
      expect(result.mesh).toBeDefined();
    });
  });

  describe('Performance and Accuracy Integration', () => {
    test('should generate fittings within reasonable time limits', async () => {
      const params: ElbowParams = {
        material: 'galvanized_steel',
        gauge: '24',
        diameter: 12,
        bendRadius: 18,
        angle: 90
      };

      const startTime = Date.now();
      const result = await fittingFactory.generateFitting(FittingType.ELBOW, params);
      const endTime = Date.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should generate geometrically accurate fittings', async () => {
      const params: ElbowParams = {
        material: 'galvanized_steel',
        gauge: '24',
        diameter: 12,
        bendRadius: 18,
        angle: 90
      };

      const result = await fittingFactory.generateFitting(FittingType.ELBOW, params);
      
      expect(result).toBeDefined();
      expect(result.mesh).toBeDefined();
      
      // Verify mesh has proper geometry
      const geometry = result.mesh.geometry;
      expect(geometry.attributes.position).toBeDefined();
      expect(geometry.attributes.normal).toBeDefined();
      expect(geometry.index).toBeDefined();
      
      // Verify reasonable vertex count for quality
      const vertexCount = geometry.attributes.position.count;
      expect(vertexCount).toBeGreaterThan(200); // Minimum for decent quality
      expect(vertexCount).toBeLessThan(20000); // Maximum for performance
    });

    test('should handle edge cases without errors', async () => {
      const edgeCases = [
        {
          type: FittingType.ELBOW,
          params: {
            material: 'galvanized_steel' as MaterialType,
            gauge: '14' as GaugeType,
            diameter: 4, // Minimum diameter
            bendRadius: 6,
            angle: 15 // Small angle
          }
        },
        {
          type: FittingType.ELBOW,
          params: {
            material: 'stainless_steel' as MaterialType,
            gauge: '26' as GaugeType,
            diameter: 120, // Large diameter
            bendRadius: 180,
            angle: 180 // Maximum angle
          }
        }
      ];

      for (const edgeCase of edgeCases) {
        const result = await fittingFactory.generateFitting(edgeCase.type, edgeCase.params);
        expect(result).toBeDefined();
        expect(result.mesh).toBeDefined();
      }
    });
  });
});
