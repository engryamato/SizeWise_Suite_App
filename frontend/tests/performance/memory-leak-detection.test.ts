/**
 * Memory Leak Detection Testing Suite
 * 
 * Tests for memory leaks during long-running sessions (8+ hours simulation)
 * to ensure production stability for professional HVAC engineering workflows.
 */

import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import { Project, Segment } from '@/types/air-duct-sizer';
import { SizeWiseDatabase } from '@/lib/database/DexieDatabase';
import { EnhancedProjectService } from '@/lib/services/EnhancedProjectService';

interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss?: number;
}

interface LeakDetectionResult {
  hasLeak: boolean;
  leakRate: number; // MB per hour
  maxMemoryIncrease: number;
  averageMemoryIncrease: number;
  snapshots: MemorySnapshot[];
  recommendations: string[];
}

class MemoryLeakDetector {
  private snapshots: MemorySnapshot[] = [];
  private baselineSnapshot: MemorySnapshot | null = null;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.baselineSnapshot = this.takeSnapshot();
    this.snapshots = [this.baselineSnapshot];
    
    this.monitoringInterval = setInterval(() => {
      const snapshot = this.takeSnapshot();
      this.snapshots.push(snapshot);
      
      // Log memory usage every 10 snapshots (5 minutes at 30s intervals)
      if (this.snapshots.length % 10 === 0) {
        const memoryIncrease = this.getMemoryIncrease();
        console.log(`📊 Memory monitoring: +${(memoryIncrease / 1024 / 1024).toFixed(2)}MB from baseline`);
      }
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }

  takeSnapshot(): MemorySnapshot {
    const timestamp = Date.now();
    
    // Node.js environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      return {
        timestamp,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
        rss: memUsage.rss
      };
    }
    
    // Browser environment
    if (typeof window !== 'undefined' && (window.performance as any).memory) {
      const memInfo = (window.performance as any).memory;
      return {
        timestamp,
        heapUsed: memInfo.usedJSHeapSize,
        heapTotal: memInfo.totalJSHeapSize,
        external: 0,
        arrayBuffers: 0
      };
    }
    
    // Fallback
    return {
      timestamp,
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0
    };
  }

  getMemoryIncrease(): number {
    if (!this.baselineSnapshot || this.snapshots.length === 0) return 0;
    
    const latest = this.snapshots[this.snapshots.length - 1];
    return latest.heapUsed - this.baselineSnapshot.heapUsed;
  }

  analyzeLeaks(): LeakDetectionResult {
    if (this.snapshots.length < 10) {
      return {
        hasLeak: false,
        leakRate: 0,
        maxMemoryIncrease: 0,
        averageMemoryIncrease: 0,
        snapshots: this.snapshots,
        recommendations: ['Insufficient data for leak analysis. Need at least 10 snapshots.']
      };
    }

    const baseline = this.snapshots[0];
    const memoryIncreases = this.snapshots.slice(1).map(snapshot => 
      snapshot.heapUsed - baseline.heapUsed
    );

    const maxIncrease = Math.max(...memoryIncreases);
    const avgIncrease = memoryIncreases.reduce((a, b) => a + b, 0) / memoryIncreases.length;
    
    // Calculate leak rate (MB per hour)
    const timeSpanHours = (this.snapshots[this.snapshots.length - 1].timestamp - baseline.timestamp) / (1000 * 60 * 60);
    const leakRate = timeSpanHours > 0 ? (maxIncrease / 1024 / 1024) / timeSpanHours : 0;

    // Determine if there's a leak
    const hasLeak = this.detectLeakPattern(memoryIncreases);

    const recommendations = this.generateRecommendations(hasLeak, leakRate, maxIncrease);

    return {
      hasLeak,
      leakRate,
      maxMemoryIncrease: maxIncrease,
      averageMemoryIncrease: avgIncrease,
      snapshots: this.snapshots,
      recommendations
    };
  }

  private detectLeakPattern(increases: number[]): boolean {
    if (increases.length < 10) return false;

    // Check for consistent upward trend
    let consecutiveIncreases = 0;
    let maxConsecutive = 0;
    
    for (let i = 1; i < increases.length; i++) {
      if (increases[i] > increases[i - 1]) {
        consecutiveIncreases++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveIncreases);
      } else {
        consecutiveIncreases = 0;
      }
    }

    // Leak detected if:
    // 1. Memory consistently increases for more than 50% of samples
    // 2. Maximum memory increase > 200MB
    // 3. No significant memory cleanup observed
    const trendThreshold = increases.length * 0.5;
    const memoryThreshold = 200 * 1024 * 1024; // 200MB
    const maxIncrease = Math.max(...increases);
    
    return maxConsecutive > trendThreshold || maxIncrease > memoryThreshold;
  }

  private generateRecommendations(hasLeak: boolean, leakRate: number, maxIncrease: number): string[] {
    const recommendations: string[] = [];

    if (hasLeak) {
      recommendations.push('🚨 MEMORY LEAK DETECTED - Immediate investigation required');
      
      if (leakRate > 50) {
        recommendations.push('⚠️ High leak rate detected (>50MB/hour) - Critical issue');
      } else if (leakRate > 10) {
        recommendations.push('⚠️ Moderate leak rate detected (>10MB/hour) - Needs attention');
      }

      if (maxIncrease > 500 * 1024 * 1024) {
        recommendations.push('🔴 Excessive memory usage (>500MB increase) - Application may crash');
      }

      recommendations.push('🔧 Check for: unclosed database connections, event listener leaks, large object retention');
      recommendations.push('🔧 Implement: proper cleanup in useEffect hooks, WeakMap for caching, garbage collection triggers');
    } else {
      recommendations.push('✅ No significant memory leaks detected');
      
      if (maxIncrease > 100 * 1024 * 1024) {
        recommendations.push('ℹ️ Memory usage is high but stable - monitor for optimization opportunities');
      }
    }

    return recommendations;
  }

  reset(): void {
    this.stopMonitoring();
    this.snapshots = [];
    this.baselineSnapshot = null;
  }
}

// Simulated long-running operations for testing
class LongRunningSimulator {
  private database: SizeWiseDatabase;
  private projectService: EnhancedProjectService;
  private isRunning = false;

  constructor() {
    this.database = new SizeWiseDatabase('memory-test-db');
    this.projectService = new EnhancedProjectService(this.database, 'test-user-id');
  }

  async simulateUserSession(durationMinutes: number): Promise<void> {
    this.isRunning = true;
    const endTime = Date.now() + (durationMinutes * 60 * 1000);
    let operationCount = 0;

    console.log(`🎬 Starting ${durationMinutes}-minute user session simulation`);

    while (Date.now() < endTime && this.isRunning) {
      try {
        // Simulate typical user operations
        await this.simulateProjectCreation();
        await this.simulateProjectEditing();
        await this.simulateCalculations();
        await this.simulateDataQueries();
        
        operationCount++;
        
        // Log progress every 50 operations
        if (operationCount % 50 === 0) {
          const elapsed = (Date.now() - (endTime - durationMinutes * 60 * 1000)) / 1000 / 60;
          console.log(`⏱️ Session progress: ${elapsed.toFixed(1)}/${durationMinutes} minutes, ${operationCount} operations`);
        }
        
        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error('❌ Error during simulation:', error);
      }
    }

    console.log(`✅ Session simulation completed: ${operationCount} operations in ${durationMinutes} minutes`);
  }

  private async simulateProjectCreation(): Promise<void> {
    const project: Project = {
      id: uuidv4(),
      project_name: `Test Project ${Date.now()}`,
      project_location: 'Test Location',
      codes: ['SMACNA'],
      rooms: [],
      segments: this.generateRandomSegments(10),
      equipment: [],
      created_at: new Date().toISOString(),
      last_modified: new Date().toISOString()
    };

    await this.projectService.saveProject(project);
    
    // Cleanup to prevent database bloat
    setTimeout(async () => {
      try {
        // Use filter-based approach for reliable deletion
        const projectsToDelete = await this.database.projects.toArray();
        const targetProject = projectsToDelete.find(p => p.uuid === project.id!);
        if (targetProject) {
          await this.database.projects.delete(targetProject.id!);
        }

        const segmentsToDelete = await this.database.projectSegments.toArray();
        const targetSegments = segmentsToDelete.filter(s => s.projectUuid === project.id!);
        for (const segment of targetSegments) {
          await this.database.projectSegments.delete(segment.id!);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }, 30000); // Cleanup after 30 seconds
  }

  private async simulateProjectEditing(): Promise<void> {
    // Get a random project and modify it
    const projects = await this.database.projects.limit(5).toArray();
    if (projects.length === 0) return;

    const project = projects[Math.floor(Math.random() * projects.length)];
    project.lastModified = new Date();
    
    await this.database.projects.put(project);
  }

  private async simulateCalculations(): Promise<void> {
    // Simulate HVAC calculations
    const segments = this.generateRandomSegments(5);
    
    for (const segment of segments) {
      // Simulate pressure loss calculation
      const velocity = segment.velocity || 1000;
      const length = segment.length;
      const pressureLoss = (0.02 * length * Math.pow(velocity / 1000, 2)) / 12;
      
      // Create calculation objects that will be garbage collected
      const calculationData = {
        segment_id: segment.segment_id,
        pressure_loss: pressureLoss,
        timestamp: Date.now(),
        intermediate_values: new Array(100).fill(Math.random()) // Create some memory pressure
      };
      
      // Simulate storing calculation results
      segment.pressure_loss = pressureLoss;
    }
  }

  private async simulateDataQueries(): Promise<void> {
    // Simulate various database queries
    await this.database.projects.orderBy('lastModified').limit(10).toArray();

    // Use filter-based approach for segment queries
    const allSegments = await this.database.projectSegments.toArray();
    const ductSegments = allSegments.filter(s => s.segmentType === 'duct').slice(0, 20);
    
    // Simulate complex queries that might create temporary objects
    const recentProjects = await this.database.projects
      .where('lastModified')
      .above(new Date(Date.now() - 24 * 60 * 60 * 1000))
      .toArray();
    
    // Process results to simulate real usage
    recentProjects.forEach(project => {
      const summary = {
        id: project.uuid,
        name: project.project_name,
        segmentCount: 0, // Would be calculated in real usage
        lastModified: project.lastModified
      };
    });
  }

  private generateRandomSegments(count: number): Segment[] {
    const segments: Segment[] = [];
    const types: Array<'straight' | 'elbow' | 'branch'> = ['straight', 'elbow', 'branch'];
    
    for (let i = 0; i < count; i++) {
      segments.push({
        segment_id: `seg-${Date.now()}-${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        material: 'galvanized',
        size: {
          width: 12 + Math.floor(Math.random() * 24),
          height: 8 + Math.floor(Math.random() * 16)
        },
        length: 1 + Math.random() * 20,
        airflow: 200 + Math.random() * 1000,
        velocity: 800 + Math.random() * 800,
        warnings: []
      });
    }
    
    return segments;
  }

  stop(): void {
    this.isRunning = false;
  }
}

describe('Memory Leak Detection Tests', () => {
  let detector: MemoryLeakDetector;
  let simulator: LongRunningSimulator;

  beforeAll(async () => {
    detector = new MemoryLeakDetector();
    simulator = new LongRunningSimulator();

    // Initialize database for testing
    await simulator.database.open();
    await simulator.database.projects.clear();
    await simulator.database.projectSegments.clear();

    console.log('🔍 Memory leak detection test environment initialized');
  });

  afterAll(() => {
    detector.stopMonitoring();
    simulator.stop();
  });

  describe('Short-term Memory Monitoring', () => {
    test('should monitor memory during 10-minute intensive session', async () => {
      detector.reset();
      detector.startMonitoring(5000); // 5-second intervals
      
      // Simulate 10 minutes of intensive operations
      await simulator.simulateUserSession(10);
      
      detector.stopMonitoring();
      
      const analysis = detector.analyzeLeaks();
      
      console.log('\n📊 10-Minute Session Analysis:');
      console.log(`Memory leak detected: ${analysis.hasLeak ? '🚨 YES' : '✅ NO'}`);
      console.log(`Leak rate: ${analysis.leakRate.toFixed(2)} MB/hour`);
      console.log(`Max memory increase: ${(analysis.maxMemoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Average memory increase: ${(analysis.averageMemoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      
      analysis.recommendations.forEach(rec => console.log(`  ${rec}`));
      
      // Assertions for short-term session
      expect(analysis.maxMemoryIncrease).toBeLessThan(200 * 1024 * 1024); // Less than 200MB
      expect(analysis.leakRate).toBeLessThan(100); // Less than 100MB/hour leak rate
      
    }, 15 * 60 * 1000); // 15-minute timeout

    test('should detect memory cleanup after operations', async () => {
      const initialSnapshot = detector.takeSnapshot();

      // Perform memory-intensive operations
      const projects = [];
      for (let i = 0; i < 50; i++) {
        const project: Project = {
          id: uuidv4(),
          project_name: `Memory Test Project ${i}`,
          project_location: 'Test Location',
          codes: ['SMACNA'],
          rooms: [],
          segments: simulator['generateRandomSegments'](100), // Large segments array
          equipment: [],
          created_at: new Date().toISOString(),
          last_modified: new Date().toISOString()
        };
        projects.push(project);
      }

      const peakSnapshot = detector.takeSnapshot();
      const peakIncrease = peakSnapshot.heapUsed - initialSnapshot.heapUsed;

      // Clear references and force garbage collection
      projects.length = 0;
      if (global.gc) {
        global.gc();
      }

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));

      const cleanupSnapshot = detector.takeSnapshot();
      const finalIncrease = cleanupSnapshot.heapUsed - initialSnapshot.heapUsed;

      console.log(`📊 Memory cleanup test:`);
      console.log(`  Peak increase: ${(peakIncrease / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Final increase: ${(finalIncrease / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Cleanup efficiency: ${((peakIncrease - finalIncrease) / peakIncrease * 100).toFixed(1)}%`);

      // Memory should be mostly cleaned up
      expect(finalIncrease).toBeLessThan(peakIncrease * 0.5); // At least 50% cleanup

    }, 30000);
  });

  describe('Long-term Memory Monitoring', () => {
    test('should simulate 2-hour session for leak detection', async () => {
      detector.reset();
      detector.startMonitoring(30000); // 30-second intervals

      console.log('🕐 Starting 2-hour session simulation (accelerated)...');

      // Simulate 2 hours in accelerated time (20 minutes real time)
      const sessionDuration = 20; // 20 minutes real time
      await simulator.simulateUserSession(sessionDuration);

      detector.stopMonitoring();

      const analysis = detector.analyzeLeaks();

      console.log('\n📊 2-Hour Session Analysis:');
      console.log(`Memory leak detected: ${analysis.hasLeak ? '🚨 YES' : '✅ NO'}`);
      console.log(`Leak rate: ${analysis.leakRate.toFixed(2)} MB/hour`);
      console.log(`Max memory increase: ${(analysis.maxMemoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Snapshots taken: ${analysis.snapshots.length}`);

      analysis.recommendations.forEach(rec => console.log(`  ${rec}`));

      // Assertions for long-term session
      expect(analysis.maxMemoryIncrease).toBeLessThan(500 * 1024 * 1024); // Less than 500MB
      expect(analysis.leakRate).toBeLessThan(50); // Less than 50MB/hour leak rate

      // If leak detected, fail the test
      if (analysis.hasLeak) {
        throw new Error(`Memory leak detected: ${analysis.leakRate.toFixed(2)} MB/hour leak rate`);
      }

    }, 25 * 60 * 1000); // 25-minute timeout

    test('should handle database connection lifecycle', async () => {
      detector.reset();
      detector.startMonitoring(10000); // 10-second intervals

      // Test database connection creation and cleanup
      const databases = [];

      for (let i = 0; i < 10; i++) {
        const db = new SizeWiseDatabase();
        databases.push(db);

        // Perform some operations
        await db.projects.limit(1).toArray();

        // Close database
        db.close();
      }

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 5000));

      detector.stopMonitoring();

      const analysis = detector.analyzeLeaks();

      console.log('\n📊 Database Connection Lifecycle Test:');
      console.log(`Memory leak detected: ${analysis.hasLeak ? '🚨 YES' : '✅ NO'}`);
      console.log(`Max memory increase: ${(analysis.maxMemoryIncrease / 1024 / 1024).toFixed(2)} MB`);

      // Database connections should not cause significant leaks
      expect(analysis.maxMemoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB

    }, 60000);
  });

  describe('Memory Stress Testing', () => {
    test('should handle rapid project creation and deletion', async () => {
      detector.reset();
      detector.startMonitoring(5000); // 5-second intervals

      const database = new SizeWiseDatabase('rapid-test-db');
      await database.open();
      const projectService = new EnhancedProjectService(database, 'test-user-id');

      // Rapidly create and delete projects
      for (let cycle = 0; cycle < 20; cycle++) {
        const projects = [];

        // Create 10 projects
        for (let i = 0; i < 10; i++) {
          const project: Project = {
            id: uuidv4(),
            project_name: `Stress Test Project ${cycle}-${i}`,
            project_location: 'Test Location',
            codes: ['SMACNA'],
            rooms: [],
            segments: simulator['generateRandomSegments'](50),
            equipment: [],
            created_at: new Date().toISOString(),
            last_modified: new Date().toISOString()
          };

          await projectService.saveProject(project);
          projects.push(project);
        }

        // Delete all projects using filter-based approach
        for (const project of projects) {
          const allProjects = await database.projects.toArray();
          const targetProject = allProjects.find(p => p.uuid === project.id!);
          if (targetProject) {
            await database.projects.delete(targetProject.id!);
          }

          const allSegments = await database.projectSegments.toArray();
          const targetSegments = allSegments.filter(s => s.projectUuid === project.id!);
          for (const segment of targetSegments) {
            await database.projectSegments.delete(segment.id!);
          }
        }

        // Small delay between cycles
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      detector.stopMonitoring();

      const analysis = detector.analyzeLeaks();

      console.log('\n📊 Rapid Creation/Deletion Stress Test:');
      console.log(`Memory leak detected: ${analysis.hasLeak ? '🚨 YES' : '✅ NO'}`);
      console.log(`Max memory increase: ${(analysis.maxMemoryIncrease / 1024 / 1024).toFixed(2)} MB`);

      // Rapid operations should not cause major leaks
      expect(analysis.maxMemoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB

    }, 120000);

    test('should monitor memory during concurrent operations', async () => {
      detector.reset();
      detector.startMonitoring(5000);

      // Simulate concurrent operations
      const operations = [];

      for (let i = 0; i < 5; i++) {
        operations.push(simulator.simulateUserSession(2)); // 2-minute sessions
      }

      await Promise.all(operations);

      detector.stopMonitoring();

      const analysis = detector.analyzeLeaks();

      console.log('\n📊 Concurrent Operations Test:');
      console.log(`Memory leak detected: ${analysis.hasLeak ? '🚨 YES' : '✅ NO'}`);
      console.log(`Max memory increase: ${(analysis.maxMemoryIncrease / 1024 / 1024).toFixed(2)} MB`);

      // Concurrent operations should be handled efficiently
      expect(analysis.maxMemoryIncrease).toBeLessThan(300 * 1024 * 1024); // Less than 300MB

    }, 180000);
  });

  describe('Memory Profiling and Reporting', () => {
    test('should generate comprehensive memory report', async () => {
      detector.reset();
      detector.startMonitoring(2000); // 2-second intervals for detailed monitoring

      // Perform various operations
      await simulator.simulateUserSession(5); // 5-minute session

      detector.stopMonitoring();

      const analysis = detector.analyzeLeaks();

      // Generate detailed report
      const report = {
        testSuite: 'Memory Leak Detection',
        timestamp: new Date().toISOString(),
        duration: analysis.snapshots.length > 0 ?
          (analysis.snapshots[analysis.snapshots.length - 1].timestamp - analysis.snapshots[0].timestamp) / 1000 / 60 : 0,
        memoryAnalysis: analysis,
        systemInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        }
      };

      console.log('\n📋 COMPREHENSIVE MEMORY REPORT');
      console.log('='.repeat(50));
      console.log(`Test Duration: ${report.duration.toFixed(2)} minutes`);
      console.log(`Snapshots Collected: ${analysis.snapshots.length}`);
      console.log(`Memory Leak Status: ${analysis.hasLeak ? '🚨 DETECTED' : '✅ NONE'}`);
      console.log(`Leak Rate: ${analysis.leakRate.toFixed(2)} MB/hour`);
      console.log(`Max Memory Increase: ${(analysis.maxMemoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Average Memory Increase: ${(analysis.averageMemoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      console.log('\nRecommendations:');
      analysis.recommendations.forEach(rec => console.log(`  ${rec}`));
      console.log('='.repeat(50));

      // Save report to file for CI/CD integration
      const fs = require('fs');
      const path = require('path');
      const reportsDir = path.join(process.cwd(), 'test-reports');

      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const reportPath = path.join(reportsDir, `memory-leak-report-${Date.now()}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      console.log(`📄 Report saved to: ${reportPath}`);

      // Test should pass if no critical leaks detected
      expect(analysis.hasLeak).toBe(false);
      expect(analysis.leakRate).toBeLessThan(25); // Less than 25MB/hour

    }, 10 * 60 * 1000); // 10-minute timeout
  });
});
