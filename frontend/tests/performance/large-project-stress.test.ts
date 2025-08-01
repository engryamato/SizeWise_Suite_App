/**
 * Large Project Stress Testing Suite
 * 
 * Tests performance and stability with enterprise-scale HVAC projects
 * containing 1000+ and 5000+ duct segments to validate production readiness.
 */

import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import { Project, Segment, Room } from '@/types/air-duct-sizer';
import { SizeWiseDatabase, ProjectSegment } from '@/lib/database/DexieDatabase';
import { EnhancedProjectService } from '@/lib/services/EnhancedProjectService';

// Performance monitoring utilities
class StressTestMonitor {
  private metrics: Map<string, number[]> = new Map();
  private memoryBaseline: number = 0;
  private startTimes: Map<string, number> = new Map();

  constructor() {
    this.memoryBaseline = this.getCurrentMemoryUsage();
  }

  start(testName: string): void {
    this.startTimes.set(testName, performance.now());
  }

  end(testName: string): number {
    const startTime = this.startTimes.get(testName);
    if (!startTime) return 0;
    
    const duration = performance.now() - startTime;
    
    if (!this.metrics.has(testName)) {
      this.metrics.set(testName, []);
    }
    this.metrics.get(testName)!.push(duration);
    this.startTimes.delete(testName);
    
    return duration;
  }

  getAverageTime(testName: string): number {
    const times = this.metrics.get(testName) || [];
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  getMemoryIncrease(): number {
    return this.getCurrentMemoryUsage() - this.memoryBaseline;
  }

  private getCurrentMemoryUsage(): number {
    // In Node.js environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    // In browser environment
    if (typeof window !== 'undefined' && (window.performance as any).memory) {
      return (window.performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  generateReport(): StressTestReport {
    const report: StressTestReport = {
      totalTests: this.metrics.size,
      memoryIncrease: this.getMemoryIncrease(),
      testResults: {},
      overallStatus: 'PASS'
    };

    for (const [testName, times] of this.metrics) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      
      report.testResults[testName] = {
        averageTime: avgTime,
        maxTime,
        minTime,
        iterations: times.length,
        status: this.evaluatePerformance(testName, avgTime, maxTime)
      };

      if (report.testResults[testName].status === 'FAIL') {
        report.overallStatus = 'FAIL';
      } else if (report.testResults[testName].status === 'WARN' && report.overallStatus === 'PASS') {
        report.overallStatus = 'WARN';
      }
    }

    return report;
  }

  private evaluatePerformance(testName: string, avgTime: number, maxTime: number): 'PASS' | 'WARN' | 'FAIL' {
    // Performance thresholds based on test type
    const thresholds = {
      'project-creation': { warn: 5000, fail: 10000 },
      'segment-bulk-insert': { warn: 30000, fail: 60000 },
      'project-load': { warn: 10000, fail: 20000 },
      'calculation-performance': { warn: 15000, fail: 30000 },
      'database-query': { warn: 2000, fail: 5000 },
      'memory-usage': { warn: 500 * 1024 * 1024, fail: 1024 * 1024 * 1024 } // 500MB warn, 1GB fail
    };

    const threshold = thresholds[testName as keyof typeof thresholds] || { warn: 10000, fail: 20000 };
    
    if (maxTime > threshold.fail) return 'FAIL';
    if (avgTime > threshold.warn) return 'WARN';
    return 'PASS';
  }
}

interface StressTestReport {
  totalTests: number;
  memoryIncrease: number;
  testResults: Record<string, {
    averageTime: number;
    maxTime: number;
    minTime: number;
    iterations: number;
    status: 'PASS' | 'WARN' | 'FAIL';
  }>;
  overallStatus: 'PASS' | 'WARN' | 'FAIL';
}

// Mock data generators for stress testing
class ProjectDataGenerator {
  static generateLargeProject(segmentCount: number): Project {
    const projectId = uuidv4();
    const rooms = this.generateRooms(Math.min(segmentCount / 10, 100)); // Max 100 rooms
    const segments = this.generateSegments(segmentCount, rooms);

    return {
      id: projectId,
      project_name: `Stress Test Project - ${segmentCount} Segments`,
      user_name: 'Stress Test User',
      contractor_name: 'Test Contractor',
      project_location: 'Test Location',
      codes: ['SMACNA', 'ASHRAE'],
      computational_properties: {
        default_velocity: 1200,
        pressure_class: 'Medium',
        altitude: 0,
        r_value: 4.0,
        friction_rate: 0.08
      },
      rooms,
      segments,
      equipment: [],
      created_at: new Date().toISOString(),
      last_modified: new Date().toISOString()
    };
  }

  static generateRooms(count: number): Room[] {
    const rooms: Room[] = [];
    const roomTypes = ['office', 'conference', 'classroom', 'laboratory', 'storage'];
    
    for (let i = 0; i < count; i++) {
      rooms.push({
        room_id: `room-${i + 1}`,
        name: `${roomTypes[i % roomTypes.length]} ${Math.floor(i / roomTypes.length) + 1}`,
        function: roomTypes[i % roomTypes.length],
        dimensions: {
          length: 10 + Math.random() * 20,
          width: 8 + Math.random() * 15,
          height: 8 + Math.random() * 4
        },
        airflow: 200 + Math.random() * 800,
        x: (i % 10) * 50,
        y: Math.floor(i / 10) * 40
      });
    }
    
    return rooms;
  }

  static generateSegments(count: number, rooms: Room[]): Segment[] {
    const segments: Segment[] = [];
    const segmentTypes: Array<'straight' | 'elbow' | 'branch' | 'reducer' | 'tee'> = 
      ['straight', 'elbow', 'branch', 'reducer', 'tee'];
    const materials = ['galvanized', 'aluminum', 'stainless_steel'];
    
    for (let i = 0; i < count; i++) {
      const segmentType = segmentTypes[i % segmentTypes.length];
      const material = materials[i % materials.length];
      
      // Generate realistic duct sizes
      const width = 6 + Math.floor(Math.random() * 30); // 6-36 inches
      const height = 6 + Math.floor(Math.random() * 24); // 6-30 inches
      const length = 1 + Math.random() * 20; // 1-20 feet
      
      segments.push({
        segment_id: `seg-${i + 1}`,
        type: segmentType,
        material,
        size: { width, height },
        length,
        airflow: 100 + Math.random() * 2000,
        velocity: 800 + Math.random() * 800,
        pressure_loss: Math.random() * 0.5,
        warnings: [],
        points: [
          Math.random() * 1000,
          Math.random() * 800,
          Math.random() * 1000,
          Math.random() * 800
        ],
        connected_rooms: rooms.length > 0 ? [rooms[Math.floor(Math.random() * rooms.length)].room_id] : []
      });
    }
    
    return segments;
  }

  static generateProjectSegments(projectUuid: string, segments: Segment[]): ProjectSegment[] {
    return segments.map((segment, index) => ({
      uuid: uuidv4(),
      projectUuid: String(projectUuid), // Ensure it's a string
      segmentType: segment.type === 'straight' ? 'duct' : 'fitting',
      name: `${segment.type} - ${segment.segment_id}`,
      calculationData: {
        airflow: segment.airflow,
        velocity: segment.velocity,
        pressure_loss: segment.pressure_loss,
        material: segment.material,
        size: segment.size,
        type: segment.type
      },
      geometryData: {
        points: segment.points,
        length: segment.length,
        connected_rooms: segment.connected_rooms
      },
      validationResults: {
        warnings: segment.warnings || [],
        compliance_status: 'valid'
      },
      lastModified: new Date(),
      syncStatus: 'local' as const
    }));
  }
}

describe('Large Project Stress Testing', () => {
  let monitor: StressTestMonitor;
  let database: SizeWiseDatabase;
  let projectService: EnhancedProjectService;

  beforeAll(async () => {
    monitor = new StressTestMonitor();
    database = new SizeWiseDatabase('stress-test-db');
    await database.open();
    projectService = new EnhancedProjectService(database, 'test-user-id');

    // Clear any existing test data
    await database.projects.clear();
    await database.projectSegments.clear();

    console.log('🔍 Database initialized and cleared');
  });

  afterAll(async () => {
    // Generate and log comprehensive report
    const report = monitor.generateReport();
    console.log('\n' + '='.repeat(80));
    console.log('LARGE PROJECT STRESS TEST REPORT');
    console.log('='.repeat(80));
    console.log(`Overall Status: ${report.overallStatus}`);
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`Memory Increase: ${(report.memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
    console.log('\nDetailed Results:');
    
    for (const [testName, result] of Object.entries(report.testResults)) {
      console.log(`\n${testName}:`);
      console.log(`  Status: ${result.status}`);
      console.log(`  Average Time: ${result.averageTime.toFixed(2)}ms`);
      console.log(`  Max Time: ${result.maxTime.toFixed(2)}ms`);
      console.log(`  Iterations: ${result.iterations}`);
    }
    console.log('='.repeat(80));
    
    // Cleanup
    await database.delete();
  });

  describe('1000 Segment Project Tests', () => {
    test('should create project with 1000 segments within performance limits', async () => {
      const segmentCount = 1000;
      
      monitor.start('project-creation');
      const project = ProjectDataGenerator.generateLargeProject(segmentCount);
      const creationTime = monitor.end('project-creation');
      
      expect(project.segments).toHaveLength(segmentCount);
      expect(creationTime).toBeLessThan(10000); // 10 seconds max
      
      console.log(`✅ Created project with ${segmentCount} segments in ${creationTime.toFixed(2)}ms`);
    }, 15000);

    test('should save 1000 segments to database efficiently', async () => {
      const segmentCount = 1000;
      const project = ProjectDataGenerator.generateLargeProject(segmentCount);
      const projectSegments = ProjectDataGenerator.generateProjectSegments(project.id!, project.segments);

      monitor.start('segment-bulk-insert');

      // Save project first
      await projectService.saveProject(project);

      // Debug: Check project ID
      console.log(`🔍 Project ID: ${project.id}, Type: ${typeof project.id}`);
      console.log(`🔍 First segment projectUuid: ${projectSegments[0]?.projectUuid}`);
      console.log(`🔍 Segments to save: ${projectSegments.length}`);

      // Bulk insert segments
      console.log(`🔍 About to bulkAdd ${projectSegments.length} segments`);
      console.log(`🔍 First segment structure:`, JSON.stringify(projectSegments[0], null, 2));

      try {
        const result = await database.projectSegments.bulkAdd(projectSegments);
        console.log(`🔍 BulkAdd completed, result:`, result);
      } catch (error) {
        console.error(`🔍 BulkAdd failed:`, error);
        throw error;
      }

      const insertTime = monitor.end('segment-bulk-insert');

      // Verify all segments were saved
      console.log(`🔍 Querying for projectUuid: ${String(project.id!)}`);
      const allSegments = await database.projectSegments.toArray();
      const savedSegments = allSegments.filter(segment => segment.projectUuid === String(project.id!));

      console.log(`🔍 Total segments in DB: ${allSegments.length}`);
      console.log(`🔍 Segments for this project: ${savedSegments.length}`);
      if (allSegments.length > 0) {
        console.log(`🔍 Sample segment projectUuid: ${allSegments[0].projectUuid}`);
      }

      expect(savedSegments).toHaveLength(segmentCount);
      expect(insertTime).toBeLessThan(60000); // 60 seconds max for bulk insert

      console.log(`✅ Saved ${segmentCount} segments to database in ${insertTime.toFixed(2)}ms`);
    }, 70000);

    test('should load 1000 segment project efficiently', async () => {
      const segmentCount = 1000;
      const project = ProjectDataGenerator.generateLargeProject(segmentCount);

      // Save project and segments first
      await projectService.saveProject(project);
      const projectSegments = ProjectDataGenerator.generateProjectSegments(project.id!, project.segments);
      await database.projectSegments.bulkAdd(projectSegments);

      monitor.start('project-load');

      // Load project with all segments
      const loadedProject = await projectService.loadProject(String(project.id!));
      const allLoadedSegments = await database.projectSegments.toArray();
      const loadedSegments = allLoadedSegments.filter(segment => segment.projectUuid === String(project.id!));

      const loadTime = monitor.end('project-load');

      expect(loadedProject).toBeDefined();
      expect(loadedSegments).toHaveLength(segmentCount);
      expect(loadTime).toBeLessThan(20000); // 20 seconds max for loading

      console.log(`✅ Loaded project with ${segmentCount} segments in ${loadTime.toFixed(2)}ms`);
    }, 30000);

    test('should perform calculations on 1000 segments within limits', async () => {
      const segmentCount = 1000;
      const project = ProjectDataGenerator.generateLargeProject(segmentCount);

      monitor.start('calculation-performance');

      // Simulate HVAC calculations on all segments
      let totalPressureLoss = 0;
      let totalAirflow = 0;

      for (const segment of project.segments) {
        // Simulate pressure loss calculation
        const pressureLoss = calculatePressureLoss(segment);
        totalPressureLoss += pressureLoss;
        totalAirflow += segment.airflow || 0;

        // Simulate validation checks
        const isValid = validateSegment(segment);
        expect(isValid).toBe(true);
      }

      const calculationTime = monitor.end('calculation-performance');

      expect(totalPressureLoss).toBeGreaterThan(0);
      expect(totalAirflow).toBeGreaterThan(0);
      expect(calculationTime).toBeLessThan(30000); // 30 seconds max for calculations

      console.log(`✅ Calculated ${segmentCount} segments in ${calculationTime.toFixed(2)}ms`);
      console.log(`   Total Pressure Loss: ${totalPressureLoss.toFixed(3)} in. w.g.`);
      console.log(`   Total Airflow: ${totalAirflow.toFixed(0)} CFM`);
    }, 40000);
  });

  describe('5000 Segment Project Tests', () => {
    test('should handle enterprise-scale project with 5000 segments', async () => {
      const segmentCount = 5000;

      monitor.start('enterprise-project-creation');
      const project = ProjectDataGenerator.generateLargeProject(segmentCount);
      const creationTime = monitor.end('enterprise-project-creation');

      expect(project.segments).toHaveLength(segmentCount);
      expect(creationTime).toBeLessThan(30000); // 30 seconds max for enterprise scale

      console.log(`✅ Created enterprise project with ${segmentCount} segments in ${creationTime.toFixed(2)}ms`);
    }, 40000);

    test('should save 5000 segments with chunked operations', async () => {
      const segmentCount = 5000;
      const chunkSize = 500; // Process in chunks to avoid memory issues
      const project = ProjectDataGenerator.generateLargeProject(segmentCount);

      monitor.start('enterprise-bulk-insert');

      // Save project first
      await projectService.saveProject(project);

      // Process segments in chunks
      const projectSegments = ProjectDataGenerator.generateProjectSegments(project.id!, project.segments);

      for (let i = 0; i < projectSegments.length; i += chunkSize) {
        const chunk = projectSegments.slice(i, i + chunkSize);
        await database.projectSegments.bulkAdd(chunk);

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const insertTime = monitor.end('enterprise-bulk-insert');

      // Verify all segments were saved
      const allSavedSegments = await database.projectSegments.toArray();
      const savedSegments = allSavedSegments.filter(segment => segment.projectUuid === String(project.id!));

      expect(savedSegments).toHaveLength(segmentCount);
      expect(insertTime).toBeLessThan(120000); // 2 minutes max for enterprise bulk insert

      console.log(`✅ Saved ${segmentCount} segments in chunks in ${insertTime.toFixed(2)}ms`);
    }, 150000);

    test('should query large dataset efficiently', async () => {
      const segmentCount = 5000;
      const project = ProjectDataGenerator.generateLargeProject(segmentCount);

      // Save project and segments
      await projectService.saveProject(project);
      const projectSegments = ProjectDataGenerator.generateProjectSegments(project.id!, project.segments);

      // Save in chunks
      const chunkSize = 500;
      for (let i = 0; i < projectSegments.length; i += chunkSize) {
        const chunk = projectSegments.slice(i, i + chunkSize);
        await database.projectSegments.bulkAdd(chunk);
      }

      monitor.start('database-query');

      // Test various query patterns
      const allDbSegments = await database.projectSegments.toArray();
      const allSegments = allDbSegments.filter(segment => segment.projectUuid === String(project.id!));

      const ductSegments = await database.projectSegments
        .where('segmentType')
        .equals('duct')
        .and(segment => segment.projectUuid === project.id!)
        .toArray();

      const recentSegments = await database.projectSegments
        .where('lastModified')
        .above(new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
        .and(segment => segment.projectUuid === project.id!)
        .toArray();

      const queryTime = monitor.end('database-query');

      expect(allSegments).toHaveLength(segmentCount);
      expect(ductSegments.length).toBeGreaterThan(0);
      expect(recentSegments.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(5000); // 5 seconds max for complex queries

      console.log(`✅ Queried ${segmentCount} segments in ${queryTime.toFixed(2)}ms`);
      console.log(`   All segments: ${allSegments.length}`);
      console.log(`   Duct segments: ${ductSegments.length}`);
      console.log(`   Recent segments: ${recentSegments.length}`);
    }, 180000);
  });

  describe('Memory and Performance Monitoring', () => {
    test('should monitor memory usage during large operations', async () => {
      const initialMemory = monitor.getMemoryIncrease();

      // Create multiple large projects to stress memory
      const projects = [];
      for (let i = 0; i < 3; i++) {
        const project = ProjectDataGenerator.generateLargeProject(1000);
        projects.push(project);
        await projectService.saveProject(project);
      }

      const memoryIncrease = monitor.getMemoryIncrease();
      const memoryDelta = memoryIncrease - initialMemory;

      // Memory increase should be reasonable (less than 1GB)
      expect(memoryDelta).toBeLessThan(1024 * 1024 * 1024);

      console.log(`✅ Memory increase: ${(memoryDelta / 1024 / 1024).toFixed(2)} MB`);

      // Cleanup projects
      for (const project of projects) {
        // Delete project segments first
        const segmentsToDelete = await database.projectSegments.toArray();
        const projectSegmentsToDelete = segmentsToDelete.filter(segment => segment.projectUuid === String(project.id!));
        for (const segment of projectSegmentsToDelete) {
          await database.projectSegments.delete(segment.id!);
        }
        // Delete project using direct delete method
        await database.projects.delete(project.id!);
      }
    }, 60000);

    test('should maintain performance consistency across multiple operations', async () => {
      const operationTimes: number[] = [];
      const segmentCount = 500; // Smaller for repeated operations

      // Perform same operation multiple times
      for (let i = 0; i < 5; i++) {
        monitor.start(`consistency-test-${i}`);

        const project = ProjectDataGenerator.generateLargeProject(segmentCount);
        await projectService.saveProject(project);

        const operationTime = monitor.end(`consistency-test-${i}`);
        operationTimes.push(operationTime);

        // Cleanup
        await database.projects.delete(project.id!);
      }

      // Check consistency - no operation should be more than 3x the average
      const avgTime = operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length;
      const maxAcceptableTime = avgTime * 3;

      operationTimes.forEach((time, index) => {
        expect(time).toBeLessThan(maxAcceptableTime);
      });

      console.log(`✅ Performance consistency maintained`);
      console.log(`   Average time: ${avgTime.toFixed(2)}ms`);
      console.log(`   Operation times: ${operationTimes.map(t => t.toFixed(0)).join(', ')}ms`);
    }, 120000);
  });

  // Helper methods for calculations
  function calculatePressureLoss(segment: Segment): number {
    // Simplified pressure loss calculation for testing
    const velocity = segment.velocity || 1000;
    const length = segment.length;
    const frictionFactor = 0.02;

    return (frictionFactor * length * Math.pow(velocity / 1000, 2)) / 12;
  }

  function validateSegment(segment: Segment): boolean {
    // Basic validation checks
    return (
      segment.segment_id.length > 0 &&
      segment.length > 0 &&
      (segment.size.width || segment.size.diameter || 0) > 0 &&
      (segment.airflow || 0) >= 0
    );
  }
});
