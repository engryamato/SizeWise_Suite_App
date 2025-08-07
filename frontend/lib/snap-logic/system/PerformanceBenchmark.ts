/**
 * Performance Benchmark System
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Benchmarking utilities to measure and compare performance between linear search
 * and spatial indexing for snap point queries. Provides comprehensive performance
 * analysis and optimization recommendations.
 * 
 * @fileoverview Performance benchmarking for spatial indexing optimization
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 * 
 * @example Basic Usage
 * ```typescript
 * const benchmark = new PerformanceBenchmark();
 * 
 * // Run benchmark with test data
 * const results = await benchmark.runBenchmark(snapPoints, testQueries);
 * 
 * // Get performance report
 * const report = benchmark.generateReport(results);
 * console.log(report);
 * ```
 */

import { SnapPoint, SnapPointType } from '@/types/air-duct-sizer';
import { SnapLogicManager } from '../SnapLogicManager';
import { SpatialIndex } from './SpatialIndex';
import { Bounds2D } from './QuadTree';

/**
 * Benchmark test configuration
 */
export interface BenchmarkConfig {
  snapPointCounts: number[];        // Different snap point counts to test
  queryCount: number;               // Number of queries per test
  queryRadius: number;              // Search radius for queries
  testBounds: Bounds2D;            // Test area bounds
  warmupRuns: number;              // Warmup runs before measurement
  measurementRuns: number;         // Number of measurement runs
}

/**
 * Benchmark query definition
 */
export interface BenchmarkQuery {
  position: { x: number; y: number };
  radius: number;
  excludeTypes?: SnapPointType[];
}

/**
 * Benchmark result for a single test
 */
export interface BenchmarkResult {
  snapPointCount: number;
  linearSearchTime: number;        // Total time for linear search (ms)
  spatialSearchTime: number;       // Total time for spatial search (ms)
  linearAverageTime: number;       // Average time per query (ms)
  spatialAverageTime: number;      // Average time per query (ms)
  performanceImprovement: number;  // Improvement ratio (0-1)
  memoryUsage: {
    linear: number;                // Estimated memory usage (MB)
    spatial: number;               // Estimated memory usage (MB)
  };
  accuracy: {
    matchingResults: number;       // Number of queries with matching results
    totalQueries: number;          // Total number of queries
    accuracyRate: number;          // Accuracy rate (0-1)
  };
}

/**
 * Complete benchmark report
 */
export interface BenchmarkReport {
  summary: {
    totalTests: number;
    averageImprovement: number;
    bestImprovement: number;
    worstImprovement: number;
    recommendedThreshold: number;   // Recommended snap point count for spatial indexing
  };
  results: BenchmarkResult[];
  recommendations: string[];
  timestamp: Date;
}

/**
 * Default benchmark configuration
 */
const DEFAULT_BENCHMARK_CONFIG: BenchmarkConfig = {
  snapPointCounts: [10, 50, 100, 500, 1000, 2000, 5000],
  queryCount: 100,
  queryRadius: 50,
  testBounds: { x: 0, y: 0, width: 10000, height: 10000 },
  warmupRuns: 5,
  measurementRuns: 10
};

/**
 * Performance benchmark system for spatial indexing
 */
export class PerformanceBenchmark {
  private config: BenchmarkConfig;

  constructor(config?: Partial<BenchmarkConfig>) {
    this.config = { ...DEFAULT_BENCHMARK_CONFIG, ...config };
  }

  /**
   * Generate test snap points
   */
  generateTestSnapPoints(count: number, bounds: Bounds2D): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    const types: SnapPointType[] = ['endpoint', 'centerline', 'midpoint', 'intersection'];

    for (let i = 0; i < count; i++) {
      const snapPoint: SnapPoint = {
        id: `test_snap_${i}`,
        type: types[i % types.length],
        position: {
          x: bounds.x + Math.random() * bounds.width,
          y: bounds.y + Math.random() * bounds.height
        },
        priority: Math.floor(Math.random() * 10) + 1,
        elementId: `element_${Math.floor(i / 10)}`,
        elementType: 'centerline'
      };
      snapPoints.push(snapPoint);
    }

    return snapPoints;
  }

  /**
   * Generate test queries
   */
  generateTestQueries(count: number, bounds: Bounds2D): BenchmarkQuery[] {
    const queries: BenchmarkQuery[] = [];

    for (let i = 0; i < count; i++) {
      queries.push({
        position: {
          x: bounds.x + Math.random() * bounds.width,
          y: bounds.y + Math.random() * bounds.height
        },
        radius: this.config.queryRadius,
        excludeTypes: Math.random() > 0.8 ? ['intersection'] : undefined
      });
    }

    return queries;
  }

  /**
   * Run benchmark for a specific snap point count
   */
  async runSingleBenchmark(snapPointCount: number): Promise<BenchmarkResult> {
    // Generate test data
    const snapPoints = this.generateTestSnapPoints(snapPointCount, this.config.testBounds);
    const queries = this.generateTestQueries(this.config.queryCount, this.config.testBounds);

    // Setup managers
    const linearManager = new SnapLogicManager();
    const spatialManager = new SnapLogicManager();

    // Disable spatial indexing for linear manager
    linearManager.setSpatialIndexEnabled(false);
    spatialManager.setSpatialIndexEnabled(true);

    // Add snap points to both managers
    for (const snapPoint of snapPoints) {
      linearManager.addSnapPoint(snapPoint);
      spatialManager.addSnapPoint(snapPoint);
    }

    // Warmup runs
    for (let i = 0; i < this.config.warmupRuns; i++) {
      for (const query of queries.slice(0, 10)) {
        linearManager.findClosestSnapPoint(query.position, query.excludeTypes);
        spatialManager.findClosestSnapPoint(query.position, query.excludeTypes);
      }
    }

    // Reset performance metrics
    linearManager.resetPerformanceMetrics();
    spatialManager.resetPerformanceMetrics();

    // Measurement runs
    const linearResults: any[] = [];
    const spatialResults: any[] = [];

    for (let run = 0; run < this.config.measurementRuns; run++) {
      // Linear search timing
      const linearStartTime = performance.now();
      for (const query of queries) {
        const result = linearManager.findClosestSnapPoint(query.position, query.excludeTypes);
        linearResults.push(result);
      }
      const linearEndTime = performance.now();

      // Spatial search timing
      const spatialStartTime = performance.now();
      for (const query of queries) {
        const result = spatialManager.findClosestSnapPoint(query.position, query.excludeTypes);
        spatialResults.push(result);
      }
      const spatialEndTime = performance.now();
    }

    // Get performance metrics
    const linearMetrics = linearManager.getSpatialIndexMetrics();
    const spatialMetrics = spatialManager.getSpatialIndexMetrics();

    // Calculate accuracy
    let matchingResults = 0;
    const totalQueries = Math.min(linearResults.length, spatialResults.length);

    for (let i = 0; i < totalQueries; i++) {
      const linearResult = linearResults[i];
      const spatialResult = spatialResults[i];

      // Compare results (allowing for small floating point differences)
      if (
        (linearResult.snapPoint?.id === spatialResult.snapPoint?.id) ||
        (Math.abs(linearResult.distance - spatialResult.distance) < 0.001)
      ) {
        matchingResults++;
      }
    }

    // Calculate performance improvement
    const linearTime = linearMetrics.linearSearchTime;
    const spatialTime = spatialMetrics.spatialSearchTime;
    const performanceImprovement = linearTime > 0 ? (linearTime - spatialTime) / linearTime : 0;

    return {
      snapPointCount,
      linearSearchTime: linearTime,
      spatialSearchTime: spatialTime,
      linearAverageTime: linearTime / this.config.queryCount / this.config.measurementRuns,
      spatialAverageTime: spatialTime / this.config.queryCount / this.config.measurementRuns,
      performanceImprovement,
      memoryUsage: {
        linear: this.estimateLinearMemoryUsage(snapPointCount),
        spatial: spatialMetrics.memoryUsage
      },
      accuracy: {
        matchingResults,
        totalQueries,
        accuracyRate: matchingResults / totalQueries
      }
    };
  }

  /**
   * Run complete benchmark suite
   */
  async runBenchmark(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    console.log('Starting performance benchmark...');

    for (const snapPointCount of this.config.snapPointCounts) {
      console.log(`Testing with ${snapPointCount} snap points...`);
      
      try {
        const result = await this.runSingleBenchmark(snapPointCount);
        results.push(result);
        
        console.log(`  Linear: ${result.linearAverageTime.toFixed(3)}ms avg`);
        console.log(`  Spatial: ${result.spatialAverageTime.toFixed(3)}ms avg`);
        console.log(`  Improvement: ${(result.performanceImprovement * 100).toFixed(1)}%`);
      } catch (error) {
        console.error(`Error testing ${snapPointCount} snap points:`, error);
      }
    }

    return results;
  }

  /**
   * Generate comprehensive benchmark report
   */
  generateReport(results: BenchmarkResult[]): BenchmarkReport {
    if (results.length === 0) {
      throw new Error('No benchmark results to generate report from');
    }

    // Calculate summary statistics
    const improvements = results.map(r => r.performanceImprovement);
    const averageImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;
    const bestImprovement = Math.max(...improvements);
    const worstImprovement = Math.min(...improvements);

    // Find recommended threshold (where improvement becomes significant)
    let recommendedThreshold = results[0].snapPointCount;
    for (const result of results) {
      if (result.performanceImprovement > 0.3) { // 30% improvement
        recommendedThreshold = result.snapPointCount;
        break;
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (averageImprovement > 0.5) {
      recommendations.push('Spatial indexing provides significant performance benefits (>50% improvement)');
    } else if (averageImprovement > 0.2) {
      recommendations.push('Spatial indexing provides moderate performance benefits (>20% improvement)');
    } else {
      recommendations.push('Spatial indexing provides minimal performance benefits (<20% improvement)');
    }

    recommendations.push(`Enable spatial indexing for projects with ${recommendedThreshold}+ snap points`);

    if (bestImprovement > 0.8) {
      recommendations.push('Consider optimizing QuadTree parameters for even better performance');
    }

    // Check accuracy
    const averageAccuracy = results.reduce((sum, r) => sum + r.accuracy.accuracyRate, 0) / results.length;
    if (averageAccuracy < 0.99) {
      recommendations.push('WARNING: Spatial indexing accuracy is below 99%. Review implementation.');
    }

    return {
      summary: {
        totalTests: results.length,
        averageImprovement,
        bestImprovement,
        worstImprovement,
        recommendedThreshold
      },
      results,
      recommendations,
      timestamp: new Date()
    };
  }

  /**
   * Export benchmark results to JSON
   */
  exportResults(report: BenchmarkReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate human-readable performance report
   */
  generateTextReport(report: BenchmarkReport): string {
    let text = 'SizeWise Suite - Spatial Indexing Performance Benchmark\n';
    text += '='.repeat(55) + '\n\n';

    text += `Generated: ${report.timestamp.toLocaleString()}\n`;
    text += `Total Tests: ${report.summary.totalTests}\n\n`;

    text += 'SUMMARY\n';
    text += '-------\n';
    text += `Average Performance Improvement: ${(report.summary.averageImprovement * 100).toFixed(1)}%\n`;
    text += `Best Performance Improvement: ${(report.summary.bestImprovement * 100).toFixed(1)}%\n`;
    text += `Worst Performance Improvement: ${(report.summary.worstImprovement * 100).toFixed(1)}%\n`;
    text += `Recommended Threshold: ${report.summary.recommendedThreshold} snap points\n\n`;

    text += 'DETAILED RESULTS\n';
    text += '----------------\n';
    text += 'Snap Points | Linear (ms) | Spatial (ms) | Improvement | Accuracy\n';
    text += '------------|-------------|---------------|-------------|----------\n';

    for (const result of report.results) {
      text += `${result.snapPointCount.toString().padStart(11)} | `;
      text += `${result.linearAverageTime.toFixed(3).padStart(11)} | `;
      text += `${result.spatialAverageTime.toFixed(3).padStart(13)} | `;
      text += `${(result.performanceImprovement * 100).toFixed(1).padStart(10)}% | `;
      text += `${(result.accuracy.accuracyRate * 100).toFixed(1).padStart(7)}%\n`;
    }

    text += '\nRECOMMENDATIONS\n';
    text += '---------------\n';
    for (const recommendation of report.recommendations) {
      text += `• ${recommendation}\n`;
    }

    return text;
  }

  /**
   * Estimate memory usage for linear search
   */
  private estimateLinearMemoryUsage(snapPointCount: number): number {
    // Rough estimation: each snap point ~200 bytes
    return (snapPointCount * 200) / (1024 * 1024); // MB
  }

  /**
   * Update benchmark configuration
   */
  updateConfig(newConfig: Partial<BenchmarkConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): BenchmarkConfig {
    return { ...this.config };
  }
}
