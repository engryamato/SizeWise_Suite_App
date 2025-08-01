/**
 * Debug Database Test - Simple test to debug database operations
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { SizeWiseDatabase, ProjectSegment } from '../lib/database/DexieDatabase';
import { EnhancedProjectService } from '../lib/services/EnhancedProjectService';
import { v4 as uuidv4 } from 'uuid';

describe('Debug Database Operations', () => {
  let database: SizeWiseDatabase;
  let projectService: EnhancedProjectService;

  beforeEach(async () => {
    // Create fresh database instance for each test
    database = new SizeWiseDatabase('test-debug-db');
    await database.open();
    
    // Clear all data
    await database.projects.clear();
    await database.projectSegments.clear();
    
    projectService = new EnhancedProjectService(database, 'test-user-id');
  });

  test('should save and retrieve project segments', async () => {
    const projectId = uuidv4();
    console.log(`🔍 Generated project ID: ${projectId}, Type: ${typeof projectId}`);

    // Create a simple project
    const project = {
      id: projectId,
      project_name: 'Debug Test Project',
      user_name: 'Test User',
      contractor_name: 'Test Contractor',
      project_location: 'Test Location',
      codes: ['SMACNA'],
      computational_properties: {
        default_velocity: 1200,
        pressure_class: 'Medium' as const,
        altitude: 0,
        r_value: 4.0,
        default_material: 'galvanized_steel' as const,
        default_gauge: 26,
        default_insulation: 'none' as const
      },
      segments: [],
      rooms: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    // Save project
    console.log('🔍 Saving project...');
    await projectService.saveProject(project);

    // Create test segments
    const testSegments: Omit<ProjectSegment, 'id' | 'lastModified' | 'syncStatus'>[] = [
      {
        uuid: uuidv4(),
        projectUuid: projectId,
        segmentType: 'duct',
        name: 'Test Duct 1',
        calculationData: {},
        geometryData: {},
        validationResults: {}
      },
      {
        uuid: uuidv4(),
        projectUuid: projectId,
        segmentType: 'fitting',
        name: 'Test Fitting 1',
        calculationData: {},
        geometryData: {},
        validationResults: {}
      }
    ];

    console.log(`🔍 Saving ${testSegments.length} segments with projectUuid: ${projectId}`);
    
    // Save segments using bulkAdd
    await database.projectSegments.bulkAdd(testSegments.map(segment => ({
      ...segment,
      lastModified: new Date(),
      syncStatus: 'local' as const
    })));

    // Query segments back
    console.log(`🔍 Querying segments for projectUuid: ${projectId}`);
    console.log(`🔍 ProjectId type: ${typeof projectId}`);
    console.log(`🔍 ProjectId value: "${projectId}"`);
    console.log(`🔍 ProjectId length: ${projectId?.length}`);
    console.log(`🔍 ProjectId is null/undefined: ${projectId == null}`);

    // First, try to get all segments to see if the table works
    console.log('🔍 Getting all segments first...');
    const allSegments = await database.projectSegments.toArray();
    console.log(`🔍 Total segments in DB: ${allSegments.length}`);

    // Try a simple filter instead of where/equals
    console.log('🔍 Trying filter approach...');
    const savedSegments = allSegments.filter(segment => segment.projectUuid === projectId);

    console.log(`🔍 Found ${savedSegments.length} segments`);

    if (allSegments.length > 0) {
      console.log(`🔍 Sample segment:`, {
        uuid: allSegments[0].uuid,
        projectUuid: allSegments[0].projectUuid,
        segmentType: allSegments[0].segmentType,
        name: allSegments[0].name
      });
    }

    // Assertions
    expect(savedSegments).toHaveLength(2);
    expect(savedSegments[0].projectUuid).toBe(projectId);
    expect(savedSegments[1].projectUuid).toBe(projectId);
  });

  test('should debug bulkAdd operation', async () => {
    const projectId = uuidv4();
    console.log(`🔍 Testing bulkAdd with project ID: ${projectId}`);

    // Create test segments exactly like the stress test does
    const testSegments = [
      {
        uuid: uuidv4(),
        projectUuid: projectId,
        segmentType: 'duct' as const,
        name: 'Test Duct 1',
        calculationData: {},
        geometryData: {},
        validationResults: {},
        lastModified: new Date(),
        syncStatus: 'local' as const
      },
      {
        uuid: uuidv4(),
        projectUuid: projectId,
        segmentType: 'fitting' as const,
        name: 'Test Fitting 1',
        calculationData: {},
        geometryData: {},
        validationResults: {},
        lastModified: new Date(),
        syncStatus: 'local' as const
      }
    ];

    console.log(`🔍 About to bulkAdd ${testSegments.length} segments`);
    console.log(`🔍 First segment:`, testSegments[0]);

    try {
      const result = await database.projectSegments.bulkAdd(testSegments);
      console.log(`🔍 BulkAdd result:`, result);
    } catch (error) {
      console.error(`🔍 BulkAdd error:`, error);
    }

    // Check what's in the database
    const allSegments = await database.projectSegments.toArray();
    console.log(`🔍 Total segments after bulkAdd: ${allSegments.length}`);

    const projectSegments = allSegments.filter(segment => segment.projectUuid === projectId);
    console.log(`🔍 Segments for this project: ${projectSegments.length}`);

    expect(projectSegments).toHaveLength(2);
  });

  test('should handle string conversion correctly', async () => {
    const projectId = uuidv4();
    const projectIdString = String(projectId);
    
    console.log(`🔍 Original ID: ${projectId}`);
    console.log(`🔍 String ID: ${projectIdString}`);
    console.log(`🔍 Are they equal? ${projectId === projectIdString}`);
    
    // Test direct database operations
    const testSegment: Omit<ProjectSegment, 'id' | 'lastModified' | 'syncStatus'> = {
      uuid: uuidv4(),
      projectUuid: projectIdString,
      segmentType: 'duct',
      name: 'String Test Duct',
      calculationData: {},
      geometryData: {},
      validationResults: {}
    };

    await database.projectSegments.add({
      ...testSegment,
      lastModified: new Date(),
      syncStatus: 'local'
    });

    // Query with original ID
    const segments1 = await database.projectSegments
      .where('projectUuid')
      .equals(projectId)
      .toArray();

    // Query with string ID
    const segments2 = await database.projectSegments
      .where('projectUuid')
      .equals(projectIdString)
      .toArray();

    console.log(`🔍 Segments found with original ID: ${segments1.length}`);
    console.log(`🔍 Segments found with string ID: ${segments2.length}`);

    expect(segments1).toHaveLength(1);
    expect(segments2).toHaveLength(1);
    expect(segments1[0].uuid).toBe(segments2[0].uuid);
  });
});
