/**
 * Test Data Manager for SizeWise Suite Frontend
 * 
 * Provides comprehensive test data generation, database setup, and cleanup
 * for consistent and isolated frontend testing.
 */

import { v4 as uuidv4 } from 'uuid';
import { SizeWiseDatabase, SizeWiseProject, ProjectSegment } from '@/lib/database/DexieDatabase';
import { Project, Segment, CalculationResult } from '@/types/air-duct-sizer';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  tier: 'trial' | 'free' | 'premium' | 'enterprise';
  company: string;
  licenseKey?: string;
  organizationId?: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface TestProject {
  uuid: string;
  project_name: string;
  project_location: string;
  user_name: string;
  contractor_name: string;
  projectType: 'air-duct' | 'grease-duct' | 'engine-exhaust' | 'boiler-vent';
  codes: string[];
  rooms: any[];
  segments: any[];
  equipment: any[];
  created_at: string;
  last_modified: string;
  lastModified: Date;
  syncStatus: 'local' | 'synced' | 'pending';
  version: number;
}

export interface TestCalculation {
  id: string;
  projectId: string;
  userId: string;
  type: string;
  inputs: Record<string, any>;
  results: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: Date;
  isValid: boolean;
}

export interface TestScenario {
  name: string;
  description: string;
  users: TestUser[];
  projects: TestProject[];
  calculations: TestCalculation[];
  segments: ProjectSegment[];
  createdAt: Date;
}

export class TestDataFactory {
  private userCounter = 0;
  private projectCounter = 0;
  private calculationCounter = 0;
  private segmentCounter = 0;

  constructor(private seed?: number) {
    if (seed !== undefined) {
      // Simple seeded random for reproducible tests
      Math.random = this.seededRandom(seed);
    }
  }

  private seededRandom(seed: number) {
    let x = Math.sin(seed) * 10000;
    return () => {
      x = Math.sin(x) * 10000;
      return x - Math.floor(x);
    };
  }

  createUser(tier: TestUser['tier'] = 'free', overrides: Partial<TestUser> = {}): TestUser {
    this.userCounter++;
    
    const baseUser: TestUser = {
      id: `test-user-${this.userCounter}`,
      email: `test.user.${this.userCounter}@sizewise.com`,
      name: `Test User ${this.userCounter}`,
      tier,
      company: `Test Company ${this.userCounter}`,
      licenseKey: tier === 'premium' || tier === 'enterprise' ? `LIC-${tier.toUpperCase()}-${this.userCounter.toString().padStart(4, '0')}` : undefined,
      organizationId: tier === 'enterprise' ? `org-${this.userCounter}` : undefined,
      settings: {
        units: 'imperial',
        defaultCodes: ['SMACNA', 'ASHRAE'],
        notifications: true,
        autoSave: true,
        theme: 'light'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      ...overrides
    };

    return baseUser;
  }

  createProject(userId: string, projectType: 'air-duct' | 'grease-duct' | 'engine-exhaust' | 'boiler-vent' = 'air-duct', overrides: Partial<TestProject> = {}): TestProject {
    this.projectCounter++;
    
    const baseProject: TestProject = {
      uuid: `test-project-${this.projectCounter}`,
      project_name: `Test ${projectType.replace('-', ' ')} Project ${this.projectCounter}`,
      project_location: `Test Building ${this.projectCounter}, Test City, TC`,
      user_name: `Test User ${this.projectCounter}`,
      contractor_name: `Test Contractor ${this.projectCounter}`,
      projectType,
      codes: ['SMACNA', 'ASHRAE'],
      rooms: this.generateRooms(projectType),
      segments: this.generateSegments(projectType),
      equipment: this.generateEquipment(projectType),
      created_at: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      lastModified: new Date(),
      syncStatus: 'local',
      version: 1,
      ...overrides
    };

    return baseProject;
  }

  createCalculation(projectId: string, userId: string, calculationType: string = 'round_duct', overrides: Partial<TestCalculation> = {}): TestCalculation {
    this.calculationCounter++;
    
    const { inputs, results } = this.generateCalculationData(calculationType);
    
    const baseCalculation: TestCalculation = {
      id: `test-calc-${this.calculationCounter}`,
      projectId,
      userId,
      type: calculationType,
      inputs,
      results,
      metadata: {
        calculationMethod: 'standard',
        codeCompliance: ['SMACNA'],
        calculationTime: new Date().toISOString(),
        version: '1.0.0'
      },
      createdAt: new Date(),
      isValid: true,
      ...overrides
    };

    return baseCalculation;
  }

  createSegment(projectId: string, segmentType: 'duct' | 'fitting' | 'equipment' | 'terminal' = 'duct', overrides: Partial<ProjectSegment> = {}): ProjectSegment {
    this.segmentCounter++;

    const baseSegment: ProjectSegment = {
      uuid: `test-segment-${this.segmentCounter}`,
      projectUuid: projectId,
      segmentType: segmentType,
      name: `Segment ${this.segmentCounter}`,
      calculationData: this.generateSegmentCalculationData(segmentType),
      geometryData: this.generateSegmentGeometryData(segmentType),
      validationResults: this.generateValidationResults(),
      lastModified: new Date(),
      syncStatus: 'local',
      ...overrides
    };

    return baseSegment;
  }

  private generateSegmentCalculationData(segmentType: string): any {
    switch (segmentType) {
      case 'duct':
        return {
          airflow: Math.floor(Math.random() * 4500) + 500,
          velocity: Math.floor(Math.random() * 1200) + 800,
          pressureLoss: Math.random() * 0.5,
          diameter: Math.floor(Math.random() * 20) + 6,
          material: ['galvanized_steel', 'aluminum', 'stainless_steel'][Math.floor(Math.random() * 3)]
        };
      case 'fitting':
        return {
          fittingType: ['elbow', 'tee', 'reducer'][Math.floor(Math.random() * 3)],
          angle: Math.floor(Math.random() * 90) + 45,
          pressureLoss: Math.random() * 0.3
        };
      default:
        return {};
    }
  }

  private generateSegmentGeometryData(segmentType: string): any {
    return {
      position: {
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: Math.random() * 20
      },
      dimensions: {
        length: Math.floor(Math.random() * 90) + 10,
        width: segmentType === 'duct' ? Math.floor(Math.random() * 20) + 6 : undefined,
        height: segmentType === 'duct' ? Math.floor(Math.random() * 20) + 6 : undefined
      }
    };
  }

  private generateValidationResults(): any {
    return {
      isValid: Math.random() > 0.1,
      warnings: Math.random() > 0.7 ? ['Minor compliance issue'] : [],
      complianceStatus: Math.random() > 0.1 ? 'compliant' : 'warning'
    };
  }

  private generateRooms(projectType: string): any[] {
    const roomCount = Math.floor(Math.random() * 6) + 3; // 3-8 rooms
    const rooms = [];

    for (let i = 0; i < roomCount; i++) {
      const length = Math.floor(Math.random() * 20) + 10; // 10-30 ft
      const width = Math.floor(Math.random() * 15) + 8; // 8-23 ft
      const height = Math.floor(Math.random() * 4) + 8; // 8-12 ft

      const room = {
        room_id: uuidv4(),
        name: `Room ${i + 1}`,
        function: ['office', 'conference', 'lobby', 'storage', 'kitchen', 'bathroom'][i % 6],
        dimensions: {
          length,
          width,
          height
        },
        area: length * width,
        airflow: Math.floor(Math.random() * 1900) + 100, // 100-2000 CFM
        outlets: []
      };

      rooms.push(room);
    }

    return rooms;
  }

  private generateSegments(projectType: string): any[] {
    const segmentCount = Math.floor(Math.random() * 10) + 5; // 5-15 segments
    const segments = [];

    for (let i = 0; i < segmentCount; i++) {
      const segmentTypes = ['straight', 'elbow', 'branch', 'reducer', 'tee'] as const;
      const isRound = projectType === 'air-duct' || Math.random() > 0.5;

      const segment = {
        segment_id: uuidv4(),
        type: segmentTypes[i % segmentTypes.length],
        material: ['galvanized_steel', 'aluminum', 'stainless_steel'][Math.floor(Math.random() * 3)],
        size: isRound ? {
          diameter: Math.floor(Math.random() * 18) + 6 // 6-24 inches
        } : {
          width: Math.floor(Math.random() * 30) + 6, // 6-36 inches
          height: Math.floor(Math.random() * 18) + 6 // 6-24 inches
        },
        length: Math.floor(Math.random() * 90) + 10, // 10-100 feet
        airflow: Math.floor(Math.random() * 4500) + 500, // 500-5000 CFM
        velocity: Math.floor(Math.random() * 1200) + 800, // 800-2000 FPM
        pressure_loss: Math.random() * 0.5, // 0-0.5 in. w.g.
        warnings: []
      };

      segments.push(segment);
    }

    return segments;
  }

  private generateEquipment(projectType: string): any[] {
    const equipmentCount = Math.floor(Math.random() * 4) + 2; // 2-6 equipment
    const equipment = [];

    for (let i = 0; i < equipmentCount; i++) {
      const equipmentTypes = projectType === 'air-duct'
        ? ['AHU', 'RTU', 'VAV', 'Fan']
        : ['Exhaust Fan', 'Supply Fan', 'Makeup Air Unit'];

      const baseEquipment = {
        equipment_id: uuidv4(),
        type: equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)],
        manufacturer: ['Carrier', 'Trane', 'York', 'Lennox'][Math.floor(Math.random() * 4)],
        model: `Model-${Math.floor(Math.random() * 9000) + 1000}`,
        catalog_data: {
          capacity: Math.floor(Math.random() * 450000) + 50000, // 50000-500000 BTU/hr
          efficiency: Math.random() * 10 + 85 // 85-95%
        },
        airflow: Math.floor(Math.random() * 9500) + 500, // 500-10000 CFM
        static_pressure: Math.random() * 2.5 + 0.5 // 0.5-3.0 in. w.g.
      };

      equipment.push(baseEquipment);
    }

    return equipment;
  }

  private generateFittings(): any[] {
    const fittingCount = Math.floor(Math.random() * 5) + 1; // 1-5 fittings
    const fittings = [];
    const fittingTypes = ['elbow_90', 'elbow_45', 'tee', 'reducer', 'damper'];

    for (let i = 0; i < fittingCount; i++) {
      fittings.push({
        id: uuidv4(),
        type: fittingTypes[Math.floor(Math.random() * fittingTypes.length)],
        pressureLoss: Math.random() * 0.5 + 0.1, // 0.1-0.6 in. w.g.
        quantity: Math.floor(Math.random() * 3) + 1 // 1-3 quantity
      });
    }

    return fittings;
  }

  private generateSegmentResults(segmentType: string): any {
    const velocity = Math.floor(Math.random() * 1200) + 800; // 800-2000 FPM
    const pressureDrop = Math.random() * 0.2 + 0.05; // 0.05-0.25 in. w.g.

    const results = {
      velocity,
      pressureDrop,
      reynoldsNumber: Math.floor(Math.random() * 150000) + 50000,
      frictionFactor: Math.random() * 0.01 + 0.015,
      equivalentDiameter: Math.random() * 10 + 8 // 8-18 inches
    };

    return results;
  }

  private generateCalculationData(calculationType: string): { inputs: any; results: any } {
    switch (calculationType) {
      case 'round_duct':
        const airflow = Math.floor(Math.random() * 4500) + 500;
        const velocity = Math.floor(Math.random() * 1200) + 800;
        return {
          inputs: {
            airflow,
            velocity,
            material: ['galvanized_steel', 'aluminum'][Math.floor(Math.random() * 2)],
            length: Math.floor(Math.random() * 90) + 10
          },
          results: {
            diameter: Math.sqrt((airflow / velocity) / 0.7854),
            pressureDrop: 0.1 * Math.random(),
            reynoldsNumber: Math.floor(Math.random() * 150000) + 50000,
            frictionFactor: Math.random() * 0.01 + 0.015
          }
        };

      case 'rectangular_duct':
        const rectAirflow = Math.floor(Math.random() * 7000) + 1000;
        const width = Math.floor(Math.random() * 24) + 12;
        const height = Math.floor(Math.random() * 16) + 8;
        const area = (width * height) / 144;
        const rectVelocity = rectAirflow / area;
        return {
          inputs: {
            airflow: rectAirflow,
            width,
            height,
            material: ['galvanized_steel', 'aluminum'][Math.floor(Math.random() * 2)],
            length: Math.floor(Math.random() * 90) + 10
          },
          results: {
            velocity: rectVelocity,
            pressureDrop: 0.1 * Math.random(),
            equivalentDiameter: 1.3 * Math.pow((width * height), 0.625) / Math.pow((width + height), 0.25)
          }
        };

      case 'load_calculation':
        const buildingArea = Math.floor(Math.random() * 4500) + 500;
        const occupancy = Math.floor(Math.random() * 90) + 10;
        const lightingLoad = Math.floor(Math.random() * 2) + 1;
        const equipmentLoad = Math.floor(Math.random() * 6) + 2;
        const sensibleLoad = buildingArea * (lightingLoad + equipmentLoad) * 3.412;
        const latentLoad = occupancy * 200;
        const totalLoad = sensibleLoad + latentLoad;
        return {
          inputs: {
            area: buildingArea,
            occupancy,
            lightingLoad,
            equipmentLoad,
            outdoorTemp: Math.floor(Math.random() * 20) + 85,
            indoorTemp: 75
          },
          results: {
            sensibleLoad: Math.round(sensibleLoad),
            latentLoad: Math.round(latentLoad),
            totalLoad: Math.round(totalLoad),
            tons: Math.round((totalLoad / 12000) * 100) / 100
          }
        };

      default:
        return {
          inputs: { value: Math.floor(Math.random() * 900) + 100 },
          results: { result: Math.floor(Math.random() * 1000) + 100 }
        };
    }
  }

  createTestScenario(
    name: string,
    userCount: number = 3,
    projectsPerUser: number = 2,
    calculationsPerProject: number = 5,
    segmentsPerProject: number = 8
  ): TestScenario {
    const scenario: TestScenario = {
      name,
      description: `Test scenario with ${userCount} users, ${projectsPerUser} projects per user`,
      users: [],
      projects: [],
      calculations: [],
      segments: [],
      createdAt: new Date()
    };

    // Create users
    const tiers: TestUser['tier'][] = ['free', 'premium', 'enterprise'];
    for (let i = 0; i < userCount; i++) {
      const tier = tiers[i % tiers.length];
      const user = this.createUser(tier);
      scenario.users.push(user);

      // Create projects for each user
      const projectTypes = ['air-duct', 'grease-duct', 'engine-exhaust', 'boiler-vent'] as const;
      for (let j = 0; j < projectsPerUser; j++) {
        const projectType = projectTypes[j % projectTypes.length];
        const project = this.createProject(user.id, projectType);
        scenario.projects.push(project);

        // Create calculations for each project
        const calculationTypes = ['round_duct', 'rectangular_duct', 'load_calculation'];
        for (let k = 0; k < calculationsPerProject; k++) {
          const calcType = calculationTypes[k % calculationTypes.length];
          const calculation = this.createCalculation(project.uuid, user.id, calcType);
          scenario.calculations.push(calculation);
        }

        // Create segments for each project
        for (let s = 0; s < segmentsPerProject; s++) {
          const segmentTypes: ('duct' | 'fitting' | 'equipment' | 'terminal')[] = ['duct', 'fitting', 'equipment', 'terminal'];
          const segmentType = segmentTypes[s % segmentTypes.length];
          const segment = this.createSegment(project.uuid, segmentType);
          scenario.segments.push(segment);
        }
      }
    }

    return scenario;
  }
}

export class TestDatabaseManager {
  private database: SizeWiseDatabase;
  private testName: string;

  constructor(testName: string = 'test') {
    this.testName = testName;
    this.database = new SizeWiseDatabase();
  }

  async setup(): Promise<void> {
    await this.database.open();
    await this.clearAllData();
  }

  async cleanup(): Promise<void> {
    await this.clearAllData();
    await this.database.close();
    await this.database.delete();
  }

  async clearAllData(): Promise<void> {
    await Promise.all([
      this.database.projects.clear(),
      this.database.projectSegments.clear(),
      this.database.calculations.clear(),
      this.database.spatialData.clear()
    ]);
  }

  async loadTestScenario(scenario: TestScenario): Promise<void> {
    // Load projects
    const projectPromises = scenario.projects.map(project => 
      this.database.projects.add(project as SizeWiseProject)
    );
    await Promise.all(projectPromises);

    // Load segments
    const segmentPromises = scenario.segments.map(segment => 
      this.database.projectSegments.add(segment)
    );
    await Promise.all(segmentPromises);

    console.log(`Loaded test scenario: ${scenario.projects.length} projects, ${scenario.segments.length} segments`);
  }

  getDatabase(): SizeWiseDatabase {
    return this.database;
  }

  async getProjectCount(): Promise<number> {
    return await this.database.projects.count();
  }

  async getSegmentCount(): Promise<number> {
    return await this.database.projectSegments.count();
  }

  async verifyDataIntegrity(): Promise<boolean> {
    try {
      const projects = await this.database.projects.toArray();
      const segments = await this.database.projectSegments.toArray();

      // Verify all segments have valid project references
      for (const segment of segments) {
        const project = projects.find(p => p.uuid === segment.projectUuid);
        if (!project) {
          console.error(`Segment ${segment.uuid} references non-existent project ${segment.projectUuid}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Data integrity check failed:', error);
      return false;
    }
  }
}

// Convenience functions for common test scenarios
export function createBasicTestData(): TestScenario {
  const factory = new TestDataFactory(42); // Reproducible data
  return factory.createTestScenario('basic_test', 1, 1, 3, 5);
}

export function createPerformanceTestData(): TestScenario {
  const factory = new TestDataFactory(123);
  return factory.createTestScenario('performance_test', 10, 5, 20, 15);
}

export function createTierTestData(): TestScenario {
  const factory = new TestDataFactory(456);
  const scenario = factory.createTestScenario('tier_test', 4, 3, 10, 8);
  
  // Ensure we have one user of each tier
  const tiers: TestUser['tier'][] = ['trial', 'free', 'premium', 'enterprise'];
  scenario.users.forEach((user, index) => {
    if (index < tiers.length) {
      user.tier = tiers[index];
    }
  });
  
  return scenario;
}

// Test database context manager
export async function withTestDatabase<T>(
  testName: string,
  scenario: TestScenario | string = 'basic',
  callback: (manager: TestDatabaseManager) => Promise<T>
): Promise<T> {
  const manager = new TestDatabaseManager(testName);
  
  try {
    await manager.setup();
    
    // Load scenario data
    let scenarioData: TestScenario;
    if (typeof scenario === 'string') {
      switch (scenario) {
        case 'basic':
          scenarioData = createBasicTestData();
          break;
        case 'performance':
          scenarioData = createPerformanceTestData();
          break;
        case 'tier':
          scenarioData = createTierTestData();
          break;
        default:
          throw new Error(`Unknown scenario: ${scenario}`);
      }
    } else {
      scenarioData = scenario;
    }
    
    await manager.loadTestScenario(scenarioData);
    
    return await callback(manager);
  } finally {
    await manager.cleanup();
  }
}
