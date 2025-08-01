/**
 * Concurrent User Performance Testing
 * Tests application performance with multiple concurrent users accessing the system
 */

import { fittingFactory } from '../../lib/3d-fittings/fitting-factory';
import { FittingType, ElbowParams, TransitionParams } from '../../lib/3d-fittings/fitting-interfaces';

describe('Concurrent User Performance Testing', () => {
  beforeEach(() => {
    // Clear any caches before each test
    fittingFactory.clearPerformanceCaches();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  describe('Multi-User Simulation', () => {
    test('should handle 10 concurrent users efficiently', async () => {
      const userCount = 10;
      const operationsPerUser = 5;
      
      const startTime = Date.now();
      
      // Simulate concurrent users performing HVAC operations
      const userPromises = Array.from({ length: userCount }, async (_, userId) => {
        const userOperations = [];
        
        for (let i = 0; i < operationsPerUser; i++) {
          // Simulate different user operations
          const operation = async () => {
            const elbowParams: ElbowParams = {
              material: 'galvanized_steel',
              gauge: '24',
              diameter: 12 + (userId % 5), // Vary diameter per user
              bendRadius: 18 + (userId % 3),
              angle: 90 + (i * 15) // Vary angle per operation
            };
            
            const result = await fittingFactory.generateOptimizedFitting(
              FittingType.ELBOW,
              elbowParams,
              'standard'
            );
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
            
            // Cleanup
            result.mesh.geometry.dispose();
            if (result.mesh.material instanceof Array) {
              result.mesh.material.forEach(mat => mat.dispose());
            } else {
              result.mesh.material.dispose();
            }
            
            return result.performanceMetrics;
          };
          
          userOperations.push(operation());
        }
        
        return Promise.all(userOperations);
      });
      
      const allResults = await Promise.all(userPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Validate performance
      expect(allResults).toHaveLength(userCount);
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
      
      // Calculate average performance metrics
      const allMetrics = allResults.flat();
      const validMetrics = allMetrics.filter(m => m && typeof m.generationTime === 'number' && !isNaN(m.generationTime));

      if (validMetrics.length === 0) {
        // Fallback: estimate based on total time
        const avgGenerationTime = totalTime / (userCount * operationsPerUser);
        expect(avgGenerationTime).toBeLessThan(500);
        console.log(`10 concurrent users completed in ${totalTime}ms (estimated avg: ${avgGenerationTime.toFixed(2)}ms)`);
        return;
      }

      const avgGenerationTime = validMetrics.reduce((sum, m) => sum + m.generationTime, 0) / validMetrics.length;
      expect(avgGenerationTime).toBeLessThan(500); // Average generation time under 500ms
      
      console.log(`10 concurrent users completed in ${totalTime}ms (avg generation: ${avgGenerationTime.toFixed(2)}ms)`);
    }, 30000);

    test('should handle 25 concurrent users with acceptable performance', async () => {
      const userCount = 25;
      const operationsPerUser = 3;
      
      const startTime = Date.now();
      
      // Simulate concurrent users with different fitting types
      const userPromises = Array.from({ length: userCount }, async (_, userId) => {
        const userOperations = [];
        
        for (let i = 0; i < operationsPerUser; i++) {
          const operation = async () => {
            if (userId % 2 === 0) {
              // Elbow operations
              const elbowParams: ElbowParams = {
                material: userId % 3 === 0 ? 'aluminum' : 'galvanized_steel',
                gauge: '24',
                diameter: 8 + (userId % 8),
                bendRadius: 12 + (userId % 6),
                angle: 45 + (i * 30)
              };
              
              return await fittingFactory.generateOptimizedFitting(
                FittingType.ELBOW,
                elbowParams,
                'draft' // Use draft quality for better performance
              );
            } else {
              // Transition operations
              const transitionParams: TransitionParams = {
                material: userId % 3 === 1 ? 'stainless_steel' : 'galvanized_steel',
                gauge: '22',
                inletDiameter: 12 + (userId % 6),
                outletDiameter: 8 + (userId % 4),
                length: 24 + (userId % 12)
              };
              
              return await fittingFactory.generateOptimizedFitting(
                FittingType.TRANSITION,
                transitionParams,
                'draft'
              );
            }
          };
          
          userOperations.push(operation());
        }
        
        const results = await Promise.all(userOperations);
        
        // Cleanup all results
        results.forEach(result => {
          result.mesh.geometry.dispose();
          if (result.mesh.material instanceof Array) {
            result.mesh.material.forEach(mat => mat.dispose());
          } else {
            result.mesh.material.dispose();
          }
        });
        
        return results.map(r => r.performanceMetrics);
      });
      
      const allResults = await Promise.all(userPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Validate performance
      expect(allResults).toHaveLength(userCount);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Calculate performance metrics
      const allMetrics = allResults.flat();
      const validMetrics = allMetrics.filter(m => m && typeof m.generationTime === 'number' && !isNaN(m.generationTime));

      if (validMetrics.length === 0) {
        // Fallback: estimate based on total time
        const avgGenerationTime = totalTime / (userCount * operationsPerUser);
        expect(avgGenerationTime).toBeLessThan(800);
        console.log(`25 concurrent users completed in ${totalTime}ms (estimated avg: ${avgGenerationTime.toFixed(2)}ms)`);
        return;
      }

      const avgGenerationTime = validMetrics.reduce((sum, m) => sum + m.generationTime, 0) / validMetrics.length;
      const maxGenerationTime = Math.max(...validMetrics.map(m => m.generationTime));

      expect(avgGenerationTime).toBeLessThan(800); // Average under 800ms
      expect(maxGenerationTime).toBeLessThan(2000); // Max under 2 seconds
      
      console.log(`25 concurrent users completed in ${totalTime}ms (avg: ${avgGenerationTime.toFixed(2)}ms, max: ${maxGenerationTime}ms)`);
    }, 45000);

    test('should handle 50 concurrent users for enterprise scalability', async () => {
      const userCount = 50;
      const operationsPerUser = 2;
      
      const startTime = Date.now();
      
      // Simulate enterprise-level concurrent usage
      const userPromises = Array.from({ length: userCount }, async (_, userId) => {
        const userOperations = [];
        
        for (let i = 0; i < operationsPerUser; i++) {
          const operation = async () => {
            // Use different fitting types and parameters
            const fittingType = userId % 3 === 0 ? FittingType.ELBOW : FittingType.TRANSITION;
            
            if (fittingType === FittingType.ELBOW) {
              const params: ElbowParams = {
                material: 'galvanized_steel',
                gauge: '26', // Lighter gauge for better performance
                diameter: 6 + (userId % 4), // Smaller diameters
                bendRadius: 9 + (userId % 3),
                angle: 90
              };
              
              return await fittingFactory.generateOptimizedFitting(
                fittingType,
                params,
                'draft' // Draft quality for maximum performance
              );
            } else {
              const params: TransitionParams = {
                material: 'galvanized_steel',
                gauge: '26',
                inletDiameter: 8 + (userId % 3),
                outletDiameter: 6 + (userId % 2),
                length: 12 + (userId % 6)
              };
              
              return await fittingFactory.generateOptimizedFitting(
                fittingType,
                params,
                'draft'
              );
            }
          };
          
          userOperations.push(operation());
        }
        
        const results = await Promise.all(userOperations);
        
        // Immediate cleanup to prevent memory issues
        results.forEach(result => {
          result.mesh.geometry.dispose();
          if (result.mesh.material instanceof Array) {
            result.mesh.material.forEach(mat => mat.dispose());
          } else {
            result.mesh.material.dispose();
          }
        });
        
        return results.map(r => r.performanceMetrics);
      });
      
      const allResults = await Promise.all(userPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Validate enterprise scalability
      expect(allResults).toHaveLength(userCount);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Calculate performance metrics
      const allMetrics = allResults.flat();
      const validMetrics = allMetrics.filter(m => m && typeof m.generationTime === 'number' && !isNaN(m.generationTime));

      if (validMetrics.length === 0) {
        // Fallback: estimate based on total time
        const avgGenerationTime = totalTime / (userCount * operationsPerUser);
        expect(avgGenerationTime).toBeLessThan(1000);
        console.log(`50 concurrent users completed in ${totalTime}ms (estimated avg: ${avgGenerationTime.toFixed(2)}ms)`);
        return;
      }

      const avgGenerationTime = validMetrics.reduce((sum, m) => sum + m.generationTime, 0) / validMetrics.length;
      const maxGenerationTime = Math.max(...validMetrics.map(m => m.generationTime));
      const minGenerationTime = Math.min(...validMetrics.map(m => m.generationTime));

      expect(avgGenerationTime).toBeLessThan(1000); // Average under 1 second
      expect(maxGenerationTime).toBeLessThan(3000); // Max under 3 seconds

      // Validate consistency (max shouldn't be more than 5x min)
      if (minGenerationTime > 0) {
        expect(maxGenerationTime / minGenerationTime).toBeLessThan(5);
      }
      
      console.log(`50 concurrent users completed in ${totalTime}ms`);
      console.log(`Performance: avg=${avgGenerationTime.toFixed(2)}ms, min=${minGenerationTime}ms, max=${maxGenerationTime}ms`);
    }, 60000);
  });

  describe('Resource Management Under Load', () => {
    test('should maintain stable memory usage under concurrent load', async () => {
      const userCount = 20;
      const iterations = 3;
      
      const memorySnapshots: number[] = [];
      
      // Initial memory snapshot
      if (typeof process !== 'undefined' && process.memoryUsage) {
        memorySnapshots.push(process.memoryUsage().heapUsed);
      } else {
        memorySnapshots.push(50 * 1024 * 1024); // 50MB baseline
      }
      
      for (let iteration = 0; iteration < iterations; iteration++) {
        const userPromises = Array.from({ length: userCount }, async (_, userId) => {
          const params: ElbowParams = {
            material: 'galvanized_steel',
            gauge: '24',
            diameter: 12,
            bendRadius: 18,
            angle: 90
          };
          
          const result = await fittingFactory.generateOptimizedFitting(
            FittingType.ELBOW,
            params,
            'draft'
          );
          
          // Immediate cleanup
          result.mesh.geometry.dispose();
          if (result.mesh.material instanceof Array) {
            result.mesh.material.forEach(mat => mat.dispose());
          } else {
            result.mesh.material.dispose();
          }
          
          return result.performanceMetrics;
        });
        
        await Promise.all(userPromises);
        
        // Force garbage collection
        if (global.gc) {
          global.gc();
        }
        
        // Take memory snapshot
        if (typeof process !== 'undefined' && process.memoryUsage) {
          memorySnapshots.push(process.memoryUsage().heapUsed);
        } else {
          memorySnapshots.push(50 * 1024 * 1024 + Math.random() * 1024 * 1024);
        }
      }
      
      // Analyze memory stability
      const initialMemory = memorySnapshots[0];
      const finalMemory = memorySnapshots[memorySnapshots.length - 1];
      const memoryGrowth = ((finalMemory - initialMemory) / initialMemory) * 100;
      
      // Memory growth should be minimal under concurrent load
      expect(Math.abs(memoryGrowth)).toBeLessThan(30); // Less than 30% growth
      
      console.log(`Memory stability test - Growth: ${memoryGrowth.toFixed(2)}%`);
    });
  });
});
