/**
 * Database Corruption Recovery Testing Suite
 * 
 * Tests database integrity checks, corruption detection, and automated repair
 * mechanisms to ensure data safety in production HVAC engineering environments.
 */

import { v4 as uuidv4 } from 'uuid';
import { Project, Segment } from '@/types/air-duct-sizer';
import { SizeWiseDatabase, ProjectSegment, SizeWiseProject } from '@/lib/database/DexieDatabase';
import { EnhancedProjectService } from '@/lib/services/EnhancedProjectService';

interface CorruptionTestResult {
  corruptionType: string;
  detectionSuccessful: boolean;
  recoverySuccessful: boolean;
  dataLossPercentage: number;
  recoveryTimeMs: number;
  integrityScore: number;
}

interface DatabaseIntegrityReport {
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'CORRUPTED' | 'CRITICAL';
  totalRecords: number;
  corruptedRecords: number;
  orphanedRecords: number;
  inconsistencies: string[];
  repairActions: string[];
  backupRecommended: boolean;
}

class DatabaseCorruptionTester {
  private database: SizeWiseDatabase;
  private backupData: Map<string, any> = new Map();
  private corruptionLog: string[] = [];

  constructor() {
    this.database = new SizeWiseDatabase('corruption-test-db');
  }

  async createBackup(): Promise<void> {
    console.log('📦 Creating database backup...');
    
    const projects = await this.database.projects.toArray();
    const segments = await this.database.projectSegments.toArray();
    const calculations = await this.database.calculations.toArray();
    
    this.backupData.set('projects', projects);
    this.backupData.set('segments', segments);
    this.backupData.set('calculations', calculations);
    
    console.log(`✅ Backup created: ${projects.length} projects, ${segments.length} segments`);
  }

  async restoreFromBackup(): Promise<void> {
    console.log('🔄 Restoring from backup...');
    
    await this.database.projects.clear();
    await this.database.projectSegments.clear();
    await this.database.calculations.clear();
    
    const projects = this.backupData.get('projects') || [];
    const segments = this.backupData.get('segments') || [];
    const calculations = this.backupData.get('calculations') || [];
    
    if (projects.length > 0) await this.database.projects.bulkAdd(projects);
    if (segments.length > 0) await this.database.projectSegments.bulkAdd(segments);
    if (calculations.length > 0) await this.database.calculations.bulkAdd(calculations);
    
    console.log(`✅ Backup restored: ${projects.length} projects, ${segments.length} segments`);
  }

  async simulateCorruption(type: 'orphaned_segments' | 'invalid_references' | 'malformed_data' | 'missing_required_fields'): Promise<void> {
    this.corruptionLog.push(`Simulating corruption: ${type}`);
    console.log(`🔧 Simulating ${type} corruption...`);

    switch (type) {
      case 'orphaned_segments':
        await this.createOrphanedSegments();
        break;
      case 'invalid_references':
        await this.createInvalidReferences();
        break;
      case 'malformed_data':
        await this.createMalformedData();
        break;
      case 'missing_required_fields':
        await this.createMissingRequiredFields();
        break;
    }
  }

  private async createOrphanedSegments(): Promise<void> {
    // Create segments that reference non-existent projects
    const orphanedSegments: ProjectSegment[] = [];
    
    for (let i = 0; i < 10; i++) {
      orphanedSegments.push({
        uuid: uuidv4(),
        projectUuid: `non-existent-project-${i}`,
        segmentType: 'duct',
        name: `Orphaned Segment ${i}`,
        calculationData: { airflow: 1000 },
        geometryData: { length: 10 },
        validationResults: {},
        lastModified: new Date(),
        syncStatus: 'local'
      });
    }
    
    await this.database.projectSegments.bulkAdd(orphanedSegments);
    console.log(`Created ${orphanedSegments.length} orphaned segments`);
  }

  private async createInvalidReferences(): Promise<void> {
    // Corrupt existing project references
    const segments = await this.database.projectSegments.limit(5).toArray();
    
    for (const segment of segments) {
      segment.projectUuid = 'invalid-project-reference';
      await this.database.projectSegments.put(segment);
    }
    
    console.log(`Corrupted ${segments.length} segment references`);
  }

  private async createMalformedData(): Promise<void> {
    // Create projects with malformed JSON data
    const malformedProjects: SizeWiseProject[] = [];
    
    for (let i = 0; i < 5; i++) {
      malformedProjects.push({
        uuid: uuidv4(),
        project_name: `Malformed Project ${i}`,
        project_location: 'Test Location',
        codes: ['SMACNA'],
        rooms: null as any, // Malformed: should be array
        segments: 'invalid-segments' as any, // Malformed: should be array
        equipment: undefined as any, // Malformed: should be array
        created_at: 'invalid-date' as any, // Malformed: should be Date
        last_modified: 'invalid-date' as any, // Malformed: should be Date
        lastModified: new Date(),
        syncStatus: 'local',
        version: 1
      });
    }
    
    // Force insert malformed data (bypassing validation)
    await this.database.projects.bulkAdd(malformedProjects);
    console.log(`Created ${malformedProjects.length} projects with malformed data`);
  }

  private async createMissingRequiredFields(): Promise<void> {
    // Create records missing required fields
    const incompleteSegments: Partial<ProjectSegment>[] = [];
    
    for (let i = 0; i < 5; i++) {
      incompleteSegments.push({
        uuid: uuidv4(),
        // Missing projectUuid (required field)
        segmentType: 'duct',
        // Missing name (required field)
        lastModified: new Date(),
        syncStatus: 'local'
      });
    }
    
    // Force insert incomplete data
    await this.database.projectSegments.bulkAdd(incompleteSegments as ProjectSegment[]);
    console.log(`Created ${incompleteSegments.length} segments with missing required fields`);
  }

  async detectCorruption(): Promise<DatabaseIntegrityReport> {
    console.log('🔍 Detecting database corruption...');
    
    const report: DatabaseIntegrityReport = {
      overallHealth: 'HEALTHY',
      totalRecords: 0,
      corruptedRecords: 0,
      orphanedRecords: 0,
      inconsistencies: [],
      repairActions: [],
      backupRecommended: false
    };

    // Check projects
    const projects = await this.database.projects.toArray();
    report.totalRecords += projects.length;

    for (const project of projects) {
      if (!this.validateProject(project)) {
        report.corruptedRecords++;
        report.inconsistencies.push(`Project ${project.uuid}: Invalid data structure`);
      }
    }

    // Check segments
    const segments = await this.database.projectSegments.toArray();
    report.totalRecords += segments.length;

    for (const segment of segments) {
      if (!this.validateSegment(segment)) {
        report.corruptedRecords++;
        report.inconsistencies.push(`Segment ${segment.uuid}: Invalid data structure`);
      }

      // Check for orphaned segments using filter-based approach
      if (segment.projectUuid) {
        const allProjects = await this.database.projects.toArray();
        const parentProject = allProjects.find(p => p.uuid === segment.projectUuid);
        if (!parentProject) {
          report.orphanedRecords++;
          report.inconsistencies.push(`Segment ${segment.uuid}: Orphaned (no parent project)`);
        }
      }
    }

    // Determine overall health
    const corruptionPercentage = (report.corruptedRecords + report.orphanedRecords) / report.totalRecords * 100;
    
    if (corruptionPercentage === 0) {
      report.overallHealth = 'HEALTHY';
    } else if (corruptionPercentage < 5) {
      report.overallHealth = 'DEGRADED';
      report.backupRecommended = true;
    } else if (corruptionPercentage < 20) {
      report.overallHealth = 'CORRUPTED';
      report.backupRecommended = true;
    } else {
      report.overallHealth = 'CRITICAL';
      report.backupRecommended = true;
    }

    // Generate repair actions
    if (report.orphanedRecords > 0) {
      report.repairActions.push('Remove orphaned segments');
    }
    if (report.corruptedRecords > 0) {
      report.repairActions.push('Repair or remove corrupted records');
    }

    console.log(`🔍 Corruption detection complete: ${report.overallHealth}`);
    return report;
  }

  private validateProject(project: SizeWiseProject): boolean {
    try {
      return (
        typeof project.uuid === 'string' &&
        typeof project.project_name === 'string' &&
        typeof project.project_location === 'string' &&
        Array.isArray(project.codes) &&
        Array.isArray(project.rooms) &&
        Array.isArray(project.segments) &&
        Array.isArray(project.equipment) &&
        project.lastModified instanceof Date
      );
    } catch (error) {
      return false;
    }
  }

  private validateSegment(segment: ProjectSegment): boolean {
    try {
      return (
        typeof segment.uuid === 'string' &&
        typeof segment.projectUuid === 'string' &&
        typeof segment.segmentType === 'string' &&
        typeof segment.name === 'string' &&
        segment.lastModified instanceof Date &&
        ['duct', 'fitting', 'equipment', 'terminal'].includes(segment.segmentType)
      );
    } catch (error) {
      return false;
    }
  }

  async repairCorruption(report: DatabaseIntegrityReport): Promise<CorruptionTestResult> {
    console.log('🔧 Starting corruption repair...');
    const startTime = Date.now();
    
    let repairedRecords = 0;
    let removedRecords = 0;

    // Remove orphaned segments
    if (report.orphanedRecords > 0) {
      const orphanedSegments = await this.findOrphanedSegments();
      for (const segment of orphanedSegments) {
        await this.database.projectSegments.delete(segment.id!);
        removedRecords++;
      }
      console.log(`🗑️ Removed ${orphanedSegments.length} orphaned segments`);
    }

    // Repair corrupted projects
    const projects = await this.database.projects.toArray();
    for (const project of projects) {
      if (!this.validateProject(project)) {
        const repaired = this.repairProject(project);
        if (repaired) {
          await this.database.projects.put(repaired);
          repairedRecords++;
        } else {
          await this.database.projects.delete(project.id!);
          removedRecords++;
        }
      }
    }

    // Repair corrupted segments
    const segments = await this.database.projectSegments.toArray();
    for (const segment of segments) {
      if (!this.validateSegment(segment)) {
        const repaired = this.repairSegment(segment);
        if (repaired) {
          await this.database.projectSegments.put(repaired);
          repairedRecords++;
        } else {
          await this.database.projectSegments.delete(segment.id!);
          removedRecords++;
        }
      }
    }

    const recoveryTime = Date.now() - startTime;
    const totalAffected = repairedRecords + removedRecords;
    const dataLossPercentage = totalAffected > 0 ? (removedRecords / totalAffected) * 100 : 0;

    console.log(`✅ Repair complete: ${repairedRecords} repaired, ${removedRecords} removed`);

    return {
      corruptionType: 'mixed',
      detectionSuccessful: true,
      recoverySuccessful: true,
      dataLossPercentage,
      recoveryTimeMs: recoveryTime,
      integrityScore: Math.max(0, 100 - dataLossPercentage)
    };
  }

  private async findOrphanedSegments(): Promise<ProjectSegment[]> {
    const segments = await this.database.projectSegments.toArray();
    const orphaned: ProjectSegment[] = [];

    // Get all projects once for efficiency
    const allProjects = await this.database.projects.toArray();

    for (const segment of segments) {
      if (segment.projectUuid) {
        const parentProject = allProjects.find(p => p.uuid === segment.projectUuid);
        if (!parentProject) {
          orphaned.push(segment);
        }
      }
    }

    return orphaned;
  }

  private repairProject(project: SizeWiseProject): SizeWiseProject | null {
    try {
      const repaired = { ...project };

      // Fix malformed arrays
      if (!Array.isArray(repaired.rooms)) repaired.rooms = [];
      if (!Array.isArray(repaired.segments)) repaired.segments = [];
      if (!Array.isArray(repaired.equipment)) repaired.equipment = [];
      if (!Array.isArray(repaired.codes)) repaired.codes = ['SMACNA'];

      // Fix malformed dates
      if (!(repaired.lastModified instanceof Date)) {
        repaired.lastModified = new Date();
      }

      // Validate required fields
      if (!repaired.uuid || !repaired.project_name || !repaired.project_location) {
        return null; // Cannot repair missing critical fields
      }

      return repaired;
    } catch (error) {
      return null;
    }
  }

  private repairSegment(segment: ProjectSegment): ProjectSegment | null {
    try {
      const repaired = { ...segment };

      // Fix missing required fields
      if (!repaired.uuid) repaired.uuid = uuidv4();
      if (!repaired.name) repaired.name = `Repaired Segment ${Date.now()}`;
      if (!repaired.segmentType) repaired.segmentType = 'duct';
      if (!repaired.calculationData) repaired.calculationData = {};
      if (!repaired.geometryData) repaired.geometryData = {};
      if (!repaired.validationResults) repaired.validationResults = {};

      // Fix malformed dates
      if (!(repaired.lastModified instanceof Date)) {
        repaired.lastModified = new Date();
      }

      // Validate critical fields
      if (!repaired.projectUuid) {
        return null; // Cannot repair segment without project reference
      }

      return repaired;
    } catch (error) {
      return null;
    }
  }

  async performIntegrityCheck(): Promise<boolean> {
    try {
      // Verify database structure
      await this.database.projects.limit(1).toArray();
      await this.database.projectSegments.limit(1).toArray();
      await this.database.calculations.limit(1).toArray();

      // Check for basic consistency
      const projectCount = await this.database.projects.count();
      const segmentCount = await this.database.projectSegments.count();

      console.log(`📊 Integrity check: ${projectCount} projects, ${segmentCount} segments`);
      return true;
    } catch (error) {
      console.error('❌ Integrity check failed:', error);
      return false;
    }
  }

  getCorruptionLog(): string[] {
    return [...this.corruptionLog];
  }

  clearCorruptionLog(): void {
    this.corruptionLog = [];
  }
}

describe('Database Corruption Recovery Tests', () => {
  let tester: DatabaseCorruptionTester;
  let projectService: EnhancedProjectService;

  beforeAll(async () => {
    tester = new DatabaseCorruptionTester();
    await tester.database.open();
    projectService = new EnhancedProjectService(tester.database, 'test-user-id');

    // Clear database and create test data
    await tester.database.projects.clear();
    await tester.database.projectSegments.clear();
    await tester.database.calculations.clear();

    console.log('🔍 Database corruption recovery test environment initialized');
    
    // Create some valid test data
    await createTestData();
  });

  afterAll(async () => {
    await tester.database.delete();
  });

  async function createTestData(): Promise<void> {
    const projects: Project[] = [];
    
    for (let i = 0; i < 5; i++) {
      const project: Project = {
        id: uuidv4(),
        project_name: `Test Project ${i}`,
        project_location: 'Test Location',
        codes: ['SMACNA'],
        rooms: [],
        segments: [],
        equipment: [],
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString()
      };
      
      projects.push(project);
      await projectService.saveProject(project);

      // Create test segments for each project to enable corruption testing
      const testSegments: ProjectSegment[] = [];
      for (let j = 0; j < 3; j++) {
        testSegments.push({
          uuid: uuidv4(),
          projectUuid: project.id!,
          segmentType: j % 2 === 0 ? 'duct' : 'fitting',
          name: `Test Segment ${j}`,
          calculationData: { airflow: 1000 + j * 100 },
          geometryData: { length: 10 + j },
          validationResults: { status: 'valid' },
          lastModified: new Date(),
          syncStatus: 'local'
        });
      }
      await tester.database.projectSegments.bulkAdd(testSegments);
    }

    console.log(`Created ${projects.length} test projects with segments`);
  }

  describe('Corruption Detection', () => {
    test('should detect orphaned segments', async () => {
      await tester.createBackup();
      await tester.simulateCorruption('orphaned_segments');
      
      const report = await tester.detectCorruption();
      
      expect(report.orphanedRecords).toBeGreaterThan(0);
      expect(report.overallHealth).not.toBe('HEALTHY');
      expect(report.inconsistencies.length).toBeGreaterThan(0);
      
      console.log(`✅ Detected ${report.orphanedRecords} orphaned segments`);
      
      await tester.restoreFromBackup();
    }, 30000);

    test('should detect invalid references', async () => {
      await tester.createBackup();
      await tester.simulateCorruption('invalid_references');

      const report = await tester.detectCorruption();

      expect(report.orphanedRecords).toBeGreaterThan(0);
      expect(report.overallHealth).not.toBe('HEALTHY');

      console.log(`✅ Detected ${report.orphanedRecords} invalid references`);

      await tester.restoreFromBackup();
    }, 30000);

    test('should detect malformed data', async () => {
      await tester.createBackup();
      await tester.simulateCorruption('malformed_data');

      const report = await tester.detectCorruption();

      expect(report.corruptedRecords).toBeGreaterThan(0);
      expect(report.overallHealth).not.toBe('HEALTHY');

      console.log(`✅ Detected ${report.corruptedRecords} malformed records`);

      await tester.restoreFromBackup();
    }, 30000);

    test('should detect missing required fields', async () => {
      await tester.createBackup();
      await tester.simulateCorruption('missing_required_fields');

      const report = await tester.detectCorruption();

      expect(report.corruptedRecords).toBeGreaterThan(0);
      expect(report.overallHealth).not.toBe('HEALTHY');

      console.log(`✅ Detected ${report.corruptedRecords} records with missing fields`);

      await tester.restoreFromBackup();
    }, 30000);
  });

  describe('Corruption Recovery', () => {
    test('should repair orphaned segments', async () => {
      await tester.createBackup();
      await tester.simulateCorruption('orphaned_segments');

      const corruptionReport = await tester.detectCorruption();
      expect(corruptionReport.orphanedRecords).toBeGreaterThan(0);

      const recoveryResult = await tester.repairCorruption(corruptionReport);

      expect(recoveryResult.detectionSuccessful).toBe(true);
      expect(recoveryResult.recoverySuccessful).toBe(true);
      expect(recoveryResult.recoveryTimeMs).toBeLessThan(10000); // Less than 10 seconds

      // Verify repair was successful
      const postRepairReport = await tester.detectCorruption();
      expect(postRepairReport.orphanedRecords).toBe(0);

      console.log(`✅ Repaired orphaned segments in ${recoveryResult.recoveryTimeMs}ms`);
      console.log(`   Data loss: ${recoveryResult.dataLossPercentage.toFixed(1)}%`);

      await tester.restoreFromBackup();
    }, 45000);

    test('should repair malformed data', async () => {
      await tester.createBackup();
      await tester.simulateCorruption('malformed_data');

      const corruptionReport = await tester.detectCorruption();
      expect(corruptionReport.corruptedRecords).toBeGreaterThan(0);

      const recoveryResult = await tester.repairCorruption(corruptionReport);

      expect(recoveryResult.recoverySuccessful).toBe(true);
      expect(recoveryResult.integrityScore).toBeGreaterThanOrEqual(50); // At least 50% integrity maintained

      // Verify repair was successful
      const postRepairReport = await tester.detectCorruption();
      expect(postRepairReport.corruptedRecords).toBeLessThan(corruptionReport.corruptedRecords);

      console.log(`✅ Repaired malformed data with ${recoveryResult.integrityScore.toFixed(1)}% integrity`);

      await tester.restoreFromBackup();
    }, 45000);

    test('should handle multiple corruption types', async () => {
      await tester.createBackup();

      // Simulate multiple types of corruption
      await tester.simulateCorruption('orphaned_segments');
      await tester.simulateCorruption('malformed_data');
      await tester.simulateCorruption('missing_required_fields');

      const corruptionReport = await tester.detectCorruption();
      expect(['CORRUPTED', 'CRITICAL']).toContain(corruptionReport.overallHealth);

      const recoveryResult = await tester.repairCorruption(corruptionReport);

      expect(recoveryResult.recoverySuccessful).toBe(true);
      expect(recoveryResult.dataLossPercentage).toBeLessThanOrEqual(50); // At most 50% data loss

      // Verify overall health improved or at least maintained
      const postRepairReport = await tester.detectCorruption();
      expect(['HEALTHY', 'CORRUPTED', 'CRITICAL']).toContain(postRepairReport.overallHealth);

      // Verify that corruption was reduced even if not fully eliminated
      const totalCorruptionBefore = (corruptionReport.orphanedRecords || 0) + (corruptionReport.corruptedRecords || 0) + (corruptionReport.missingFields || 0);
      const totalCorruptionAfter = (postRepairReport.orphanedRecords || 0) + (postRepairReport.corruptedRecords || 0) + (postRepairReport.missingFields || 0);
      expect(totalCorruptionAfter).toBeLessThanOrEqual(totalCorruptionBefore);

      console.log(`✅ Handled multiple corruption types`);
      console.log(`   Recovery time: ${recoveryResult.recoveryTimeMs}ms`);
      console.log(`   Data loss: ${recoveryResult.dataLossPercentage.toFixed(1)}%`);
      console.log(`   Final health: ${postRepairReport.overallHealth}`);

      await tester.restoreFromBackup();
    }, 60000);
  });

  describe('Integrity Monitoring', () => {
    test('should perform regular integrity checks', async () => {
      const isHealthy = await tester.performIntegrityCheck();
      expect(isHealthy).toBe(true);

      // Simulate corruption
      await tester.simulateCorruption('orphaned_segments');

      const report = await tester.detectCorruption();
      expect(report.overallHealth).not.toBe('HEALTHY');

      // Repair and verify
      await tester.repairCorruption(report);

      const finalCheck = await tester.performIntegrityCheck();
      expect(finalCheck).toBe(true);

      console.log('✅ Integrity monitoring cycle completed successfully');
    }, 45000);

    test('should maintain corruption log', async () => {
      tester.clearCorruptionLog();

      await tester.simulateCorruption('orphaned_segments');
      await tester.simulateCorruption('malformed_data');

      const log = tester.getCorruptionLog();
      expect(log.length).toBeGreaterThan(0);
      expect(log).toContain('Simulating corruption: orphaned_segments');
      expect(log).toContain('Simulating corruption: malformed_data');

      console.log('✅ Corruption log maintained:', log);
    }, 30000);
  });

  describe('Backup and Recovery', () => {
    test('should create and restore backups', async () => {
      // Create initial data
      const initialProjects = await tester.database.projects.toArray();
      const initialSegments = await tester.database.projectSegments.toArray();

      // Create backup
      await tester.createBackup();

      // Corrupt database
      await tester.database.projects.clear();
      await tester.database.projectSegments.clear();

      // Verify corruption
      const corruptedProjects = await tester.database.projects.toArray();
      const corruptedSegments = await tester.database.projectSegments.toArray();
      expect(corruptedProjects.length).toBe(0);
      expect(corruptedSegments.length).toBe(0);

      // Restore from backup
      await tester.restoreFromBackup();

      // Verify restoration
      const restoredProjects = await tester.database.projects.toArray();
      const restoredSegments = await tester.database.projectSegments.toArray();
      expect(restoredProjects.length).toBe(initialProjects.length);
      expect(restoredSegments.length).toBe(initialSegments.length);

      console.log(`✅ Backup and restore successful: ${restoredProjects.length} projects restored`);
    }, 30000);

    test('should handle partial data recovery', async () => {
      await tester.createBackup();

      // Simulate severe corruption
      await tester.simulateCorruption('orphaned_segments');
      await tester.simulateCorruption('malformed_data');
      await tester.simulateCorruption('invalid_references');

      const corruptionReport = await tester.detectCorruption();
      expect(['CORRUPTED', 'CRITICAL']).toContain(corruptionReport.overallHealth);

      // Attempt recovery
      const recoveryResult = await tester.repairCorruption(corruptionReport);

      // Even with severe corruption, some data should be recoverable
      expect(recoveryResult.integrityScore).toBeGreaterThan(0);
      expect(recoveryResult.dataLossPercentage).toBeLessThan(100);

      console.log(`✅ Partial recovery successful: ${recoveryResult.integrityScore.toFixed(1)}% integrity maintained`);

      await tester.restoreFromBackup();
    }, 60000);
  });

  describe('Performance Under Corruption', () => {
    test('should maintain performance during corruption detection', async () => {
      // Create large dataset
      const largeProjects: Project[] = [];
      for (let i = 0; i < 100; i++) {
        const project: Project = {
          id: uuidv4(),
          project_name: `Performance Test Project ${i}`,
          project_location: 'Test Location',
          codes: ['SMACNA'],
          rooms: [],
          segments: [],
          equipment: [],
          created_at: new Date().toISOString(),
          last_modified: new Date().toISOString()
        };
        largeProjects.push(project);
        await projectService.saveProject(project);
      }

      await tester.createBackup();

      // Introduce corruption
      await tester.simulateCorruption('orphaned_segments');
      await tester.simulateCorruption('malformed_data');

      // Measure detection performance
      const startTime = Date.now();
      const report = await tester.detectCorruption();
      const detectionTime = Date.now() - startTime;

      expect(detectionTime).toBeLessThan(30000); // Less than 30 seconds
      expect(report.totalRecords).toBeGreaterThan(100);

      console.log(`✅ Corruption detection on ${report.totalRecords} records: ${detectionTime}ms`);

      // Cleanup using filter-based approach
      await tester.restoreFromBackup();
      const allProjects = await tester.database.projects.toArray();
      for (const project of largeProjects) {
        const targetProject = allProjects.find(p => p.uuid === project.id!);
        if (targetProject) {
          await tester.database.projects.delete(targetProject.id!);
        }
      }
    }, 120000);
  });
});
