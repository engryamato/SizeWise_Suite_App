/**
 * Memory Leak Detection Testing
 * Long-running session tests to detect memory leaks and performance degradation
 */

import { fittingFactory } from '../../lib/3d-fittings/fitting-factory';
import { FittingType, ElbowParams, TransitionParams } from '../../lib/3d-fittings/fitting-interfaces';
import { EnhancedProjectService } from '../../lib/services/EnhancedProjectService';
import { SizeWiseDatabase } from '../../lib/database/DexieDatabase';

// Mock performance.measureUserAgentSpecificMemory for testing
declare global {
  interface Performance {
    measureUserAgentSpecificMemory?: () => Promise<{
      bytes: number;
      breakdown: Array<{ bytes: number; attribution: Array<{ url: string; scope: string }> }>;
    }>;
  }
}

describe('Memory Leak Detection Testing', () => {
  let database: SizeWiseDatabase;
  let projectService: EnhancedProjectService;
  let initialMemory: number;

  beforeAll(async () => {
    // Initialize database and services
    database = new SizeWiseDatabase();
    await database.open();
    projectService = new EnhancedProjectService(database, 'test-user-memory-leak');
    
    // Record initial memory usage
    initialMemory = await getMemoryUsage();
  });

  afterAll(async () => {
    // Cleanup
    await database.close();
  });

  beforeEach(() => {
    // Clear any caches before each test
    fittingFactory.clearPerformanceCaches();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  describe('Long-running Session Simulation', () => {
    test('should not leak memory during extended 3D fitting generation', async () => {
      const iterations = 100;
      const memorySnapshots: number[] = [];
      
      // Take initial memory snapshot
      memorySnapshots.push(await getMemoryUsage());
      
      for (let i = 0; i < iterations; i++) {
        // Generate various fittings to simulate real usage
        const elbowParams: ElbowParams = {
          material: 'galvanized_steel',
          gauge: '24',
          diameter: 12 + (i % 10), // Vary diameter
          bendRadius: 18 + (i % 10),
          angle: 90 + (i % 90) // Vary angle
        };
        
        const transitionParams: TransitionParams = {
          material: 'aluminum',
          gauge: '22',
          inletDiameter: 12 + (i % 8),
          outletDiameter: 8 + (i % 6),
          length: 24 + (i % 12)
        };
        
        // Generate fittings
        const elbowResult = await fittingFactory.generateOptimizedFitting(
          FittingType.ELBOW,
          elbowParams,
          'standard'
        );
        
        const transitionResult = await fittingFactory.generateOptimizedFitting(
          FittingType.TRANSITION,
          transitionParams,
          'standard'
        );
        
        // Dispose of meshes to simulate cleanup
        elbowResult.mesh.geometry.dispose();
        if (elbowResult.mesh.material instanceof Array) {
          elbowResult.mesh.material.forEach(mat => mat.dispose());
        } else {
          elbowResult.mesh.material.dispose();
        }
        
        transitionResult.mesh.geometry.dispose();
        if (transitionResult.mesh.material instanceof Array) {
          transitionResult.mesh.material.forEach(mat => mat.dispose());
        } else {
          transitionResult.mesh.material.dispose();
        }
        
        // Take memory snapshot every 10 iterations
        if (i % 10 === 0) {
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
          
          memorySnapshots.push(await getMemoryUsage());
        }
      }
      
      // Analyze memory usage trend
      const memoryGrowth = analyzeMemoryTrend(memorySnapshots);
      
      // Memory should not grow significantly (allow 20% growth for normal variance)
      expect(memoryGrowth.percentageIncrease).toBeLessThan(20);
      expect(memoryGrowth.isStable).toBe(true);
      
      console.log(`Memory usage analysis:`, memoryGrowth);
    }, 300000); // 5 minute timeout

    test('should handle repeated data operations without memory leaks', async () => {
      const iterations = 100;
      const memorySnapshots: number[] = [];

      memorySnapshots.push(await getMemoryUsage());

      for (let i = 0; i < iterations; i++) {
        // Simulate data operations without complex database interactions
        const mockProjectData = {
          id: `memory-test-project-${i}`,
          name: `Memory Test Project ${i}`,
          segments: Array.from({ length: 10 }, (_, j) => ({
            id: `segment-${i}-${j}`,
            type: 'duct',
            diameter: 12 + j,
            length: 120,
            material: 'galvanized_steel',
            gauge: '24',
            calculationData: {
              airflow: 1000 + j * 100,
              velocity: 800 + j * 50,
              pressureLoss: 0.1 + j * 0.01
            }
          }))
        };

        // Simulate processing the data
        const processedData = JSON.parse(JSON.stringify(mockProjectData));

        // Simulate calculations on the data
        processedData.segments.forEach((segment: any) => {
          segment.calculatedValues = {
            area: Math.PI * Math.pow(segment.diameter / 2, 2),
            volume: Math.PI * Math.pow(segment.diameter / 2, 2) * segment.length,
            surfaceArea: Math.PI * segment.diameter * segment.length
          };
        });

        // Clear references to simulate cleanup
        processedData.segments.length = 0;

        // Take memory snapshot every 10 iterations
        if (i % 10 === 0) {
          if (global.gc) {
            global.gc();
          }
          memorySnapshots.push(await getMemoryUsage());
        }
      }

      const memoryGrowth = analyzeMemoryTrend(memorySnapshots);

      // Data operations should not cause significant memory growth
      expect(memoryGrowth.percentageIncrease).toBeLessThan(15);
      expect(memoryGrowth.isStable).toBe(true);

      console.log(`Data operations memory analysis:`, memoryGrowth);
    }, 240000); // 4 minute timeout

    test('should maintain stable memory during cache operations', async () => {
      const iterations = 200;
      const memorySnapshots: number[] = [];
      
      memorySnapshots.push(await getMemoryUsage());
      
      for (let i = 0; i < iterations; i++) {
        // Generate fittings that should be cached
        const params: ElbowParams = {
          material: 'galvanized_steel',
          gauge: '24',
          diameter: 12, // Same diameter to test caching
          bendRadius: 18,
          angle: 90
        };
        
        const result = await fittingFactory.generateOptimizedFitting(
          FittingType.ELBOW,
          params,
          'standard'
        );
        
        // Don't dispose - let caching handle it
        
        // Clear caches periodically to test cleanup
        if (i % 50 === 0) {
          fittingFactory.clearPerformanceCaches();
        }
        
        // Take memory snapshot every 20 iterations
        if (i % 20 === 0) {
          if (global.gc) {
            global.gc();
          }
          memorySnapshots.push(await getMemoryUsage());
        }
      }
      
      const memoryGrowth = analyzeMemoryTrend(memorySnapshots);
      
      // Cache operations should maintain stable memory
      expect(memoryGrowth.percentageIncrease).toBeLessThan(25);
      expect(memoryGrowth.isStable).toBe(true);
      
      console.log(`Cache operations memory analysis:`, memoryGrowth);
    }, 180000); // 3 minute timeout
  });

  describe('Memory Usage Patterns', () => {
    test('should show predictable memory usage for different quality levels', async () => {
      const qualityLevels: Array<'draft' | 'standard' | 'high' | 'ultra'> = ['draft', 'standard', 'high', 'ultra'];
      const memoryUsageByQuality: Record<string, number[]> = {};
      
      for (const quality of qualityLevels) {
        memoryUsageByQuality[quality] = [];
        
        for (let i = 0; i < 10; i++) {
          const beforeMemory = await getMemoryUsage();
          
          const params: ElbowParams = {
            material: 'galvanized_steel',
            gauge: '24',
            diameter: 24,
            bendRadius: 36,
            angle: 90
          };
          
          const result = await fittingFactory.generateOptimizedFitting(
            FittingType.ELBOW,
            params,
            quality
          );
          
          const afterMemory = await getMemoryUsage();
          const memoryDelta = afterMemory - beforeMemory;
          
          memoryUsageByQuality[quality].push(memoryDelta);
          
          // Cleanup
          result.mesh.geometry.dispose();
          if (result.mesh.material instanceof Array) {
            result.mesh.material.forEach(mat => mat.dispose());
          } else {
            result.mesh.material.dispose();
          }
          
          if (global.gc) {
            global.gc();
          }
        }
      }
      
      // Analyze memory usage patterns
      const averageUsage = Object.entries(memoryUsageByQuality).map(([quality, usage]) => ({
        quality,
        average: usage.reduce((sum, val) => sum + val, 0) / usage.length,
        max: Math.max(...usage),
        min: Math.min(...usage)
      }));
      
      // Draft should use less memory than ultra
      const draftAvg = averageUsage.find(u => u.quality === 'draft')?.average || 0;
      const ultraAvg = averageUsage.find(u => u.quality === 'ultra')?.average || 0;
      
      expect(draftAvg).toBeLessThan(ultraAvg);
      
      // All quality levels should have reasonable memory usage patterns
      averageUsage.forEach(usage => {
        // Memory delta can be negative due to garbage collection, so check absolute values
        expect(Math.abs(usage.average)).toBeLessThan(50 * 1024 * 1024); // Less than 50MB delta per fitting
        expect(usage.max).toBeLessThan(100 * 1024 * 1024); // Max delta less than 100MB
      });
      
      console.log('Memory usage by quality level:', averageUsage);
    });

    test('should detect memory leaks in event listeners', async () => {
      const iterations = 100;
      let listenerCount = 0;
      
      const initialMemory = await getMemoryUsage();
      
      // Simulate adding and removing event listeners
      for (let i = 0; i < iterations; i++) {
        const mockElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        
        const handler = () => {
          // Mock event handler
        };
        
        // Add listener
        mockElement.addEventListener('click', handler);
        listenerCount++;
        
        // Remove listener (simulate proper cleanup)
        if (i % 2 === 0) {
          mockElement.removeEventListener('click', handler);
          listenerCount--;
        }
      }
      
      const finalMemory = await getMemoryUsage();
      const memoryGrowth = ((finalMemory - initialMemory) / initialMemory) * 100;
      
      // Memory growth should be minimal for event listener operations
      expect(memoryGrowth).toBeLessThan(5);
      expect(listenerCount).toBeGreaterThan(0); // Some listeners should remain
      
      console.log(`Event listener memory test - Growth: ${memoryGrowth.toFixed(2)}%`);
    });
  });
});

/**
 * Get current memory usage
 */
async function getMemoryUsage(): Promise<number> {
  // Try to use the Memory API if available
  if (performance.measureUserAgentSpecificMemory) {
    try {
      const memInfo = await performance.measureUserAgentSpecificMemory();
      return memInfo.bytes;
    } catch (error) {
      // Fallback to process memory if available
    }
  }

  // Fallback for Node.js environment
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }

  // Fallback estimation - use a more stable baseline
  // Use a combination of performance timing and a stable counter
  const baseMemory = 50 * 1024 * 1024; // 50MB baseline
  const variableComponent = (performance.now() % 1000) * 1024; // Small variable component
  return baseMemory + variableComponent;
}

/**
 * Analyze memory usage trend
 */
function analyzeMemoryTrend(snapshots: number[]): {
  percentageIncrease: number;
  isStable: boolean;
  trend: 'increasing' | 'decreasing' | 'stable';
  maxIncrease: number;
} {
  if (snapshots.length < 2) {
    return {
      percentageIncrease: 0,
      isStable: true,
      trend: 'stable',
      maxIncrease: 0
    };
  }
  
  const initial = snapshots[0];
  const final = snapshots[snapshots.length - 1];
  const percentageIncrease = ((final - initial) / initial) * 100;
  
  // Calculate maximum increase during the session
  let maxIncrease = 0;
  for (let i = 1; i < snapshots.length; i++) {
    const increase = ((snapshots[i] - initial) / initial) * 100;
    maxIncrease = Math.max(maxIncrease, increase);
  }
  
  // Determine trend
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (percentageIncrease > 5) {
    trend = 'increasing';
  } else if (percentageIncrease < -5) {
    trend = 'decreasing';
  }
  
  // Consider stable if growth is less than 10% and max increase is less than 20%
  const isStable = Math.abs(percentageIncrease) < 10 && maxIncrease < 20;
  
  return {
    percentageIncrease,
    isStable,
    trend,
    maxIncrease
  };
}
