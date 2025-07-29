/**
 * Advanced Caching Service Test Runner
 * 
 * Comprehensive test runner for validating AdvancedCachingService performance
 * and integration with the SizeWise Suite application.
 * 
 * This script performs:
 * - Performance benchmarking
 * - Memory usage validation
 * - Cache hit rate analysis
 * - Integration testing with DexieDatabase
 * - Error handling validation
 */

import { AdvancedCachingService, CacheConfig } from '../lib/services/AdvancedCachingService';
import { SizeWiseDatabase } from '../lib/database/DexieDatabase';

// =============================================================================
// Test Configuration
// =============================================================================

interface TestConfig {
  iterations: number;
  dataSize: 'small' | 'medium' | 'large';
  cacheSize: number; // MB
  ttl: number; // milliseconds
  enableLogging: boolean;
}

const TEST_CONFIGS: Record<string, TestConfig> = {
  performance: {
    iterations: 1000,
    dataSize: 'medium',
    cacheSize: 50,
    ttl: 300000, // 5 minutes
    enableLogging: true
  },
  memory: {
    iterations: 100,
    dataSize: 'large',
    cacheSize: 10,
    ttl: 60000, // 1 minute
    enableLogging: true
  },
  integration: {
    iterations: 50,
    dataSize: 'small',
    cacheSize: 25,
    ttl: 120000, // 2 minutes
    enableLogging: true
  }
};

// =============================================================================
// Test Data Generators
// =============================================================================

function generateTestData(size: 'small' | 'medium' | 'large') {
  const baseData = {
    timestamp: Date.now(),
    uuid: crypto.randomUUID(),
    metadata: {
      version: '1.0.0',
      source: 'test-runner'
    }
  };

  switch (size) {
    case 'small':
      return {
        ...baseData,
        calculations: Array.from({ length: 10 }, (_, i) => ({
          id: i,
          result: Math.random() * 100,
          type: 'air-duct-sizing'
        }))
      };
    
    case 'medium':
      return {
        ...baseData,
        calculations: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          result: Math.random() * 1000,
          type: 'pressure-drop',
          parameters: {
            airflow: Math.random() * 5000,
            velocity: Math.random() * 2000,
            diameter: Math.random() * 24
          }
        }))
      };
    
    case 'large':
      return {
        ...baseData,
        calculations: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          result: Math.random() * 10000,
          type: 'system-optimization',
          parameters: {
            zones: Array.from({ length: 10 }, (_, j) => ({
              id: j,
              airflow: Math.random() * 2000,
              temperature: 68 + Math.random() * 10,
              area: Math.random() * 500
            }))
          },
          metadata: {
            iteration: i,
            complexity: 'high',
            processingTime: Math.random() * 100
          }
        }))
      };
  }
}

function generateHVACCalculationData() {
  return {
    projectUuid: crypto.randomUUID(),
    calculationType: 'air-duct-sizing',
    parameters: {
      airflow: 2000 + Math.random() * 3000,
      velocity: 1500 + Math.random() * 1000,
      frictionFactor: 0.015 + Math.random() * 0.01,
      roughness: 0.0001 + Math.random() * 0.0005
    },
    results: {
      ductSize: 12 + Math.random() * 12,
      pressureDrop: 0.1 + Math.random() * 0.4,
      velocity: 1500 + Math.random() * 1000,
      efficiency: 0.8 + Math.random() * 0.2
    },
    metadata: {
      timestamp: Date.now(),
      version: '2.1.0',
      processingTime: Math.random() * 50
    }
  };
}

// =============================================================================
// Test Runner Class
// =============================================================================

class CachingServiceTestRunner {
  private database: SizeWiseDatabase;
  private cachingService: AdvancedCachingService;
  private testResults: Map<string, any> = new Map();

  constructor(config: TestConfig) {
    this.database = new SizeWiseDatabase();
    
    const cacheConfig: CacheConfig = {
      maxMemorySize: config.cacheSize,
      defaultTTL: config.ttl,
      maxIndexedDBSize: config.cacheSize * 5,
      compressionEnabled: true,
      prefetchEnabled: true,
      metricsEnabled: true
    };

    this.cachingService = new AdvancedCachingService(this.database, cacheConfig);
  }

  // =============================================================================
  // Performance Tests
  // =============================================================================

  async runPerformanceTest(config: TestConfig): Promise<void> {
    console.log(`\n🚀 Running Performance Test (${config.iterations} iterations)`);
    
    const testData = generateTestData(config.dataSize);
    const keys: string[] = [];
    
    // Performance metrics
    let totalSetTime = 0;
    let totalGetTime = 0;
    let cacheHits = 0;
    let cacheMisses = 0;

    // Set operations
    console.log('📝 Testing SET operations...');
    const setStartTime = performance.now();
    
    for (let i = 0; i < config.iterations; i++) {
      const key = `perf-test-${i}`;
      keys.push(key);
      
      const setStart = performance.now();
      await this.cachingService.set(key, { ...testData, iteration: i });
      totalSetTime += performance.now() - setStart;
      
      if (i % 100 === 0 && config.enableLogging) {
        console.log(`  Set ${i}/${config.iterations} entries`);
      }
    }
    
    const setEndTime = performance.now();
    const totalSetDuration = setEndTime - setStartTime;

    // Get operations (cache hits)
    console.log('📖 Testing GET operations (cache hits)...');
    const getStartTime = performance.now();
    
    for (const key of keys) {
      const getStart = performance.now();
      const result = await this.cachingService.get(key);
      totalGetTime += performance.now() - getStart;
      
      if (result !== null) {
        cacheHits++;
      } else {
        cacheMisses++;
      }
    }
    
    const getEndTime = performance.now();
    const totalGetDuration = getEndTime - getStartTime;

    // Calculate metrics
    const avgSetTime = totalSetTime / config.iterations;
    const avgGetTime = totalGetTime / config.iterations;
    const hitRate = cacheHits / (cacheHits + cacheMisses);
    const throughputSet = config.iterations / (totalSetDuration / 1000);
    const throughputGet = config.iterations / (totalGetDuration / 1000);

    const performanceResults = {
      iterations: config.iterations,
      dataSize: config.dataSize,
      avgSetTime: `${avgSetTime.toFixed(2)}ms`,
      avgGetTime: `${avgGetTime.toFixed(2)}ms`,
      hitRate: `${(hitRate * 100).toFixed(1)}%`,
      throughputSet: `${throughputSet.toFixed(0)} ops/sec`,
      throughputGet: `${throughputGet.toFixed(0)} ops/sec`,
      totalSetDuration: `${totalSetDuration.toFixed(0)}ms`,
      totalGetDuration: `${totalGetDuration.toFixed(0)}ms`,
      cacheMetrics: this.cachingService.getMetrics()
    };

    this.testResults.set('performance', performanceResults);
    
    console.log('✅ Performance Test Results:');
    console.log(`   Average SET time: ${avgSetTime.toFixed(2)}ms`);
    console.log(`   Average GET time: ${avgGetTime.toFixed(2)}ms`);
    console.log(`   Cache hit rate: ${(hitRate * 100).toFixed(1)}%`);
    console.log(`   SET throughput: ${throughputSet.toFixed(0)} ops/sec`);
    console.log(`   GET throughput: ${throughputGet.toFixed(0)} ops/sec`);
  }

  // =============================================================================
  // Memory Management Tests
  // =============================================================================

  async runMemoryTest(config: TestConfig): Promise<void> {
    console.log(`\n🧠 Running Memory Management Test`);
    
    const initialMetrics = this.cachingService.getMetrics();
    console.log(`Initial memory usage: ${initialMetrics.memoryUsage.toFixed(2)}MB`);
    
    // Fill cache beyond memory limit to test eviction
    const largeData = generateTestData('large');
    let evictionCount = 0;
    
    for (let i = 0; i < config.iterations; i++) {
      const key = `memory-test-${i}`;
      await this.cachingService.set(key, { ...largeData, iteration: i });
      
      const currentMetrics = this.cachingService.getMetrics();
      if (currentMetrics.evictionCount > evictionCount) {
        evictionCount = currentMetrics.evictionCount;
        if (config.enableLogging && i % 10 === 0) {
          console.log(`  Iteration ${i}: Memory ${currentMetrics.memoryUsage.toFixed(2)}MB, Evictions: ${evictionCount}`);
        }
      }
    }
    
    const finalMetrics = this.cachingService.getMetrics();
    
    const memoryResults = {
      initialMemory: `${initialMetrics.memoryUsage.toFixed(2)}MB`,
      finalMemory: `${finalMetrics.memoryUsage.toFixed(2)}MB`,
      maxMemoryLimit: `${config.cacheSize}MB`,
      totalEvictions: finalMetrics.evictionCount,
      memoryEfficiency: finalMetrics.memoryUsage <= config.cacheSize,
      finalMetrics
    };

    this.testResults.set('memory', memoryResults);
    
    console.log('✅ Memory Management Test Results:');
    console.log(`   Final memory usage: ${finalMetrics.memoryUsage.toFixed(2)}MB`);
    console.log(`   Memory limit respected: ${finalMetrics.memoryUsage <= config.cacheSize ? 'Yes' : 'No'}`);
    console.log(`   Total evictions: ${finalMetrics.evictionCount}`);
    console.log(`   Eviction efficiency: ${evictionCount > 0 ? 'Working' : 'Not triggered'}`);
  }

  // =============================================================================
  // HVAC Integration Tests
  // =============================================================================

  async runHVACIntegrationTest(config: TestConfig): Promise<void> {
    console.log(`\n🏗️ Running HVAC Integration Test`);
    
    const projects = Array.from({ length: 5 }, () => crypto.randomUUID());
    let calculationsCached = 0;
    let calculationsRetrieved = 0;
    
    // Cache HVAC calculations for multiple projects
    for (const projectUuid of projects) {
      for (let i = 0; i < config.iterations / 5; i++) {
        const calculationData = generateHVACCalculationData();
        const inputHash = `calc-${i}-${Math.random().toString(36).substr(2, 9)}`;
        
        await this.cachingService.cacheCalculationResult(
          projectUuid,
          inputHash,
          calculationData.results
        );
        calculationsCached++;
        
        // Test retrieval
        const cached = await this.cachingService.getCachedCalculation(projectUuid, inputHash);
        if (cached) {
          calculationsRetrieved++;
        }
      }
      
      if (config.enableLogging) {
        console.log(`  Processed project ${projectUuid}: ${config.iterations / 5} calculations`);
      }
    }
    
    // Test project data prefetching
    console.log('🔄 Testing project data prefetching...');
    for (const projectUuid of projects) {
      await this.cachingService.prefetchProjectData(projectUuid);
    }
    
    const integrationResults = {
      projectsProcessed: projects.length,
      calculationsCached,
      calculationsRetrieved,
      retrievalSuccessRate: `${((calculationsRetrieved / calculationsCached) * 100).toFixed(1)}%`,
      prefetchingTested: true,
      finalMetrics: this.cachingService.getMetrics()
    };

    this.testResults.set('hvac-integration', integrationResults);
    
    console.log('✅ HVAC Integration Test Results:');
    console.log(`   Projects processed: ${projects.length}`);
    console.log(`   Calculations cached: ${calculationsCached}`);
    console.log(`   Calculations retrieved: ${calculationsRetrieved}`);
    console.log(`   Retrieval success rate: ${((calculationsRetrieved / calculationsCached) * 100).toFixed(1)}%`);
  }

  // =============================================================================
  // Error Handling Tests
  // =============================================================================

  async runErrorHandlingTest(): Promise<void> {
    console.log(`\n🛡️ Running Error Handling Test`);
    
    let errorsHandled = 0;
    let totalTests = 0;
    
    // Test 1: Invalid data handling
    try {
      const circularData = { self: null as any };
      circularData.self = circularData;
      await this.cachingService.set('circular-test', circularData);
      totalTests++;
    } catch (error) {
      errorsHandled++;
      totalTests++;
    }
    
    // Test 2: Null/undefined handling
    try {
      await this.cachingService.set('null-test', null);
      await this.cachingService.set('undefined-test', undefined);
      totalTests += 2;
    } catch (error) {
      errorsHandled++;
      totalTests += 2;
    }
    
    // Test 3: Very large data handling
    try {
      const veryLargeData = 'x'.repeat(10 * 1024 * 1024); // 10MB string
      await this.cachingService.set('large-test', veryLargeData);
      totalTests++;
    } catch (error) {
      errorsHandled++;
      totalTests++;
    }
    
    const errorResults = {
      totalTests,
      errorsHandled,
      errorHandlingRate: `${((totalTests - errorsHandled) / totalTests * 100).toFixed(1)}%`,
      gracefulHandling: errorsHandled === 0
    };

    this.testResults.set('error-handling', errorResults);
    
    console.log('✅ Error Handling Test Results:');
    console.log(`   Total tests: ${totalTests}`);
    console.log(`   Errors handled gracefully: ${totalTests - errorsHandled}`);
    console.log(`   Success rate: ${((totalTests - errorsHandled) / totalTests * 100).toFixed(1)}%`);
  }

  // =============================================================================
  // Test Results Summary
  // =============================================================================

  generateSummaryReport(): void {
    console.log('\n📊 COMPREHENSIVE TEST SUMMARY');
    console.log('=' .repeat(50));
    
    for (const [testName, results] of this.testResults) {
      console.log(`\n${testName.toUpperCase()}:`);
      console.log(JSON.stringify(results, null, 2));
    }
    
    // Overall assessment
    const performanceResults = this.testResults.get('performance');
    const memoryResults = this.testResults.get('memory');
    const integrationResults = this.testResults.get('hvac-integration');
    const errorResults = this.testResults.get('error-handling');
    
    console.log('\n🎯 OVERALL ASSESSMENT:');
    
    if (performanceResults) {
      const hitRate = parseFloat(performanceResults.hitRate);
      console.log(`   Cache Hit Rate: ${hitRate >= 80 ? '✅' : '⚠️'} ${performanceResults.hitRate} (Target: ≥80%)`);
    }
    
    if (memoryResults) {
      console.log(`   Memory Management: ${memoryResults.memoryEfficiency ? '✅' : '❌'} ${memoryResults.memoryEfficiency ? 'Efficient' : 'Inefficient'}`);
    }
    
    if (integrationResults) {
      const retrievalRate = parseFloat(integrationResults.retrievalSuccessRate);
      console.log(`   HVAC Integration: ${retrievalRate >= 95 ? '✅' : '⚠️'} ${integrationResults.retrievalSuccessRate} (Target: ≥95%)`);
    }
    
    if (errorResults) {
      console.log(`   Error Handling: ${errorResults.gracefulHandling ? '✅' : '⚠️'} ${errorResults.gracefulHandling ? 'Robust' : 'Needs improvement'}`);
    }
  }

  async cleanup(): Promise<void> {
    await this.cachingService.clear();
    console.log('\n🧹 Test cleanup completed');
  }
}

// =============================================================================
// Main Test Execution
// =============================================================================

export async function runAdvancedCachingTests(): Promise<void> {
  console.log('🧪 ADVANCED CACHING SERVICE TEST SUITE');
  console.log('=' .repeat(50));
  
  for (const [testType, config] of Object.entries(TEST_CONFIGS)) {
    console.log(`\n🔬 Starting ${testType.toUpperCase()} test suite...`);
    
    const testRunner = new CachingServiceTestRunner(config);
    
    try {
      switch (testType) {
        case 'performance':
          await testRunner.runPerformanceTest(config);
          break;
        case 'memory':
          await testRunner.runMemoryTest(config);
          break;
        case 'integration':
          await testRunner.runHVACIntegrationTest(config);
          break;
      }
      
      await testRunner.runErrorHandlingTest();
      await testRunner.cleanup();
      
    } catch (error) {
      console.error(`❌ Test suite ${testType} failed:`, error);
    }
  }
  
  console.log('\n✅ All test suites completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAdvancedCachingTests().catch(console.error);
}
