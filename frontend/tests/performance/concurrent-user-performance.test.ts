/**
 * Concurrent User Performance Testing Suite
 * 
 * Tests application performance with multiple concurrent users to validate
 * scalability and multi-user performance characteristics for professional
 * HVAC engineering environments.
 * 
 * Key Performance Metrics:
 * - Response time under concurrent load
 * - Memory usage with multiple sessions
 * - Database performance with concurrent access
 * - Authentication system scalability
 * - HVAC calculation throughput
 */

import { SizeWiseDatabase } from '../../lib/database/DexieDatabase';
import { EnhancedProjectService } from '../../lib/services/EnhancedProjectService';
import { v4 as uuidv4 } from 'uuid';

interface ConcurrentUserSession {
  userId: string;
  database: SizeWiseDatabase;
  projectService: EnhancedProjectService;
  sessionStartTime: number;
  operationsCompleted: number;
  errors: string[];
}

interface PerformanceMetrics {
  totalUsers: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  throughputPerSecond: number;
  errorRate: number;
  memoryUsageMB: number;
  databaseOperationsPerSecond: number;
}

interface ConcurrentTestResult {
  testName: string;
  userCount: number;
  durationMs: number;
  metrics: PerformanceMetrics;
  passed: boolean;
  errors: string[];
  recommendations: string[];
}

class ConcurrentUserSimulator {
  private sessions: Map<string, ConcurrentUserSession> = new Map();
  private performanceData: number[] = [];
  private startTime: number = 0;

  constructor() {
    console.log('🚀 Concurrent User Simulator initialized');
  }

  async createUserSession(userId: string): Promise<ConcurrentUserSession> {
    const database = new SizeWiseDatabase(`concurrent-user-${userId}`);
    await database.open();
    
    const projectService = new EnhancedProjectService(database, userId);
    
    const session: ConcurrentUserSession = {
      userId,
      database,
      projectService,
      sessionStartTime: Date.now(),
      operationsCompleted: 0,
      errors: []
    };
    
    this.sessions.set(userId, session);
    return session;
  }

  async simulateUserWorkflow(session: ConcurrentUserSession, operationCount: number = 10): Promise<void> {
    const operations = [
      () => this.createProject(session),
      () => this.addDuctSegments(session),
      () => this.addFittingSegments(session),
      () => this.performCalculations(session),
      () => this.saveProject(session),
      () => this.loadProject(session)
    ];

    for (let i = 0; i < operationCount; i++) {
      try {
        const startTime = Date.now();
        const operation = operations[i % operations.length];
        await operation();
        
        const responseTime = Date.now() - startTime;
        this.performanceData.push(responseTime);
        session.operationsCompleted++;
        
        // Small delay to simulate realistic user interaction
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        session.errors.push(`Operation ${i}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private async createProject(session: ConcurrentUserSession): Promise<void> {
    const project = {
      name: `Concurrent Test Project ${session.userId}`,
      description: 'Test project for concurrent user simulation',
      location: 'Test Location',
      projectType: 'commercial' as const,
      createdBy: session.userId,
      lastModified: new Date(),
      syncStatus: 'local' as const
    };

    await session.projectService.saveProject(project);
  }

  private async addDuctSegments(session: ConcurrentUserSession): Promise<void> {
    // Simulate adding multiple duct segments
    for (let i = 0; i < 5; i++) {
      const segment = {
        uuid: uuidv4(),
        projectUuid: session.userId,
        segmentType: 'duct' as const,
        name: `Duct Segment ${i}`,
        calculationData: { 
          airflow: 1000 + i * 100,
          velocity: 800 + i * 50,
          pressure: 0.5 + i * 0.1
        },
        geometryData: { 
          length: 10 + i,
          width: 12,
          height: 8
        },
        validationResults: { status: 'valid' },
        lastModified: new Date(),
        syncStatus: 'local' as const
      };

      await session.database.projectSegments.add(segment);
    }
  }

  private async addFittingSegments(session: ConcurrentUserSession): Promise<void> {
    // Simulate adding fitting segments
    for (let i = 0; i < 3; i++) {
      const segment = {
        uuid: uuidv4(),
        projectUuid: session.userId,
        segmentType: 'fitting' as const,
        name: `Fitting ${i}`,
        calculationData: { 
          fittingType: 'elbow',
          angle: 90,
          pressureLoss: 0.1 + i * 0.05
        },
        geometryData: { 
          diameter: 12,
          radius: 6
        },
        validationResults: { status: 'valid' },
        lastModified: new Date(),
        syncStatus: 'local' as const
      };

      await session.database.projectSegments.add(segment);
    }
  }

  private async performCalculations(session: ConcurrentUserSession): Promise<void> {
    // Simulate HVAC calculations
    const allSegments = await session.database.projectSegments.toArray();
    const userSegments = allSegments.filter(segment => segment.projectUuid === session.userId);
    
    // Simulate calculation processing time
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Update segments with calculation results
    for (const segment of userSegments) {
      segment.calculationData = {
        ...segment.calculationData,
        calculatedAt: new Date().toISOString(),
        result: Math.random() * 1000
      };
      await session.database.projectSegments.put(segment);
    }
  }

  private async saveProject(session: ConcurrentUserSession): Promise<void> {
    const project = {
      name: `Updated Project ${session.userId}`,
      description: 'Updated test project',
      location: 'Test Location',
      projectType: 'commercial' as const,
      createdBy: session.userId,
      lastModified: new Date(),
      syncStatus: 'local' as const
    };

    await session.projectService.saveProject(project);
  }

  private async loadProject(session: ConcurrentUserSession): Promise<void> {
    const allProjects = await session.database.projects.toArray();
    const userProjects = allProjects.filter(p => p.createdBy === session.userId);
    
    if (userProjects.length > 0) {
      await session.projectService.loadProject(String(userProjects[0].id!));
    }
  }

  calculateMetrics(userCount: number, durationMs: number): PerformanceMetrics {
    const totalOperations = Array.from(this.sessions.values())
      .reduce((sum, session) => sum + session.operationsCompleted, 0);
    
    const totalErrors = Array.from(this.sessions.values())
      .reduce((sum, session) => sum + session.errors.length, 0);

    const responseTimes = this.performanceData.filter(time => time > 0);
    
    return {
      totalUsers: userCount,
      averageResponseTime: responseTimes.length > 0 ? 
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      throughputPerSecond: totalOperations / (durationMs / 1000),
      errorRate: totalOperations > 0 ? (totalErrors / totalOperations) * 100 : 0,
      memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
      databaseOperationsPerSecond: (totalOperations * 2) / (durationMs / 1000) // Estimate DB ops
    };
  }

  async cleanup(): Promise<void> {
    for (const session of this.sessions.values()) {
      try {
        await session.database.delete();
      } catch (error) {
        console.warn(`Failed to cleanup session ${session.userId}:`, error);
      }
    }
    this.sessions.clear();
    this.performanceData = [];
  }
}

class ConcurrentPerformanceTester {
  private simulator: ConcurrentUserSimulator;

  constructor() {
    this.simulator = new ConcurrentUserSimulator();
  }

  async testConcurrentUsers(userCount: number, operationsPerUser: number = 10): Promise<ConcurrentTestResult> {
    console.log(`🔄 Testing ${userCount} concurrent users with ${operationsPerUser} operations each...`);
    
    const startTime = Date.now();
    const userPromises: Promise<void>[] = [];
    const errors: string[] = [];

    try {
      // Create concurrent user sessions
      for (let i = 0; i < userCount; i++) {
        const userId = `user-${i}-${Date.now()}`;
        const userPromise = this.simulator.createUserSession(userId)
          .then(session => this.simulator.simulateUserWorkflow(session, operationsPerUser))
          .catch(error => {
            errors.push(`User ${userId}: ${error instanceof Error ? error.message : String(error)}`);
          });
        
        userPromises.push(userPromise);
      }

      // Wait for all users to complete
      await Promise.all(userPromises);
      
      const durationMs = Date.now() - startTime;
      const metrics = this.simulator.calculateMetrics(userCount, durationMs);
      
      // Performance thresholds for professional HVAC software
      const passed = this.evaluatePerformance(metrics, userCount);
      const recommendations = this.generateRecommendations(metrics, userCount);

      return {
        testName: `${userCount} Concurrent Users Test`,
        userCount,
        durationMs,
        metrics,
        passed,
        errors,
        recommendations
      };

    } catch (error) {
      errors.push(`Test execution error: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        testName: `${userCount} Concurrent Users Test (Failed)`,
        userCount,
        durationMs: Date.now() - startTime,
        metrics: this.simulator.calculateMetrics(userCount, Date.now() - startTime),
        passed: false,
        errors,
        recommendations: ['Fix test execution errors before performance evaluation']
      };
    }
  }

  private evaluatePerformance(metrics: PerformanceMetrics, userCount: number): boolean {
    // Professional HVAC software performance thresholds
    const thresholds = {
      maxAverageResponseTime: userCount <= 10 ? 2000 : userCount <= 25 ? 3000 : 5000, // ms
      maxErrorRate: 5, // %
      minThroughput: userCount * 0.5, // operations per second
      maxMemoryUsage: 500 + (userCount * 10) // MB
    };

    return metrics.averageResponseTime <= thresholds.maxAverageResponseTime &&
           metrics.errorRate <= thresholds.maxErrorRate &&
           metrics.throughputPerSecond >= thresholds.minThroughput &&
           metrics.memoryUsageMB <= thresholds.maxMemoryUsage;
  }

  private generateRecommendations(metrics: PerformanceMetrics, userCount: number): string[] {
    const recommendations: string[] = [];

    if (metrics.averageResponseTime > 3000) {
      recommendations.push('Consider implementing response caching and database query optimization');
    }

    if (metrics.errorRate > 2) {
      recommendations.push('Investigate and fix error sources to improve system reliability');
    }

    if (metrics.memoryUsageMB > 300 + (userCount * 8)) {
      recommendations.push('Implement memory optimization and garbage collection improvements');
    }

    if (metrics.throughputPerSecond < userCount * 0.3) {
      recommendations.push('Optimize database operations and consider connection pooling');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance meets professional HVAC software standards');
    }

    return recommendations;
  }

  async cleanup(): Promise<void> {
    await this.simulator.cleanup();
  }
}

describe('Concurrent User Performance Tests', () => {
  let tester: ConcurrentPerformanceTester;

  beforeAll(async () => {
    tester = new ConcurrentPerformanceTester();
    console.log('🔍 Concurrent user performance test environment initialized');
  });

  afterAll(async () => {
    await tester.cleanup();
    console.log('🧹 Concurrent user performance test cleanup completed');
  });

  test('should handle 10 concurrent users efficiently', async () => {
    const result = await tester.testConcurrentUsers(10, 8);

    expect(result.passed).toBe(true);
    expect(result.metrics.errorRate).toBeLessThanOrEqual(5);
    expect(result.metrics.averageResponseTime).toBeLessThanOrEqual(2000);
    expect(result.metrics.throughputPerSecond).toBeGreaterThanOrEqual(5);

    console.log(`✅ 10 users: ${result.metrics.averageResponseTime.toFixed(0)}ms avg response, ${result.metrics.throughputPerSecond.toFixed(1)} ops/sec`);
  }, 300000); // 5 minutes timeout

  test('should handle 25 concurrent users with acceptable performance', async () => {
    const result = await tester.testConcurrentUsers(25, 6);

    expect(result.passed).toBe(true);
    expect(result.metrics.errorRate).toBeLessThanOrEqual(5);
    expect(result.metrics.averageResponseTime).toBeLessThanOrEqual(3000);
    expect(result.metrics.throughputPerSecond).toBeGreaterThanOrEqual(12);

    console.log(`✅ 25 users: ${result.metrics.averageResponseTime.toFixed(0)}ms avg response, ${result.metrics.throughputPerSecond.toFixed(1)} ops/sec`);
  }, 600000); // 10 minutes timeout

  test('should handle 50 concurrent users for enterprise scalability', async () => {
    const result = await tester.testConcurrentUsers(50, 5);

    expect(result.passed).toBe(true);
    expect(result.metrics.errorRate).toBeLessThanOrEqual(8); // Slightly higher tolerance for 50 users
    expect(result.metrics.averageResponseTime).toBeLessThanOrEqual(5000);
    expect(result.metrics.throughputPerSecond).toBeGreaterThanOrEqual(20);

    console.log(`✅ 50 users: ${result.metrics.averageResponseTime.toFixed(0)}ms avg response, ${result.metrics.throughputPerSecond.toFixed(1)} ops/sec`);
    
    if (result.recommendations.length > 0) {
      console.log('📋 Recommendations:', result.recommendations.join('; '));
    }
  }, 900000); // 15 minutes timeout
});
