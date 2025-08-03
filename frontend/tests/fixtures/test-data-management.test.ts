/**
 * Test Data Management System Validation Test
 * 
 * This test validates that the test data management system is working correctly
 * for both backend and frontend components.
 */

import { TestDataFactory, TestDatabaseManager, createBasicTestData } from './TestDataManager';

describe('Test Data Management System', () => {
  let testDataFactory: TestDataFactory;
  let testDatabaseManager: TestDatabaseManager;

  beforeEach(async () => {
    testDataFactory = new TestDataFactory(42); // Reproducible seed
    testDatabaseManager = new TestDatabaseManager('test-data-management');
    await testDatabaseManager.setup();
  });

  afterEach(async () => {
    await testDatabaseManager.cleanup();
  });

  describe('TestDataFactory', () => {
    it('should create realistic test users', () => {
      const user = testDataFactory.createUser();

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.tier).toBeDefined();
      expect(['trial', 'free', 'premium', 'enterprise']).toContain(user.tier);
    });

    it('should create realistic test projects', () => {
      const user = testDataFactory.createUser();
      const project = testDataFactory.createProject(user.id);

      expect(project).toBeDefined();
      expect(project.uuid).toBeDefined();
      expect(project.project_name).toBeDefined();
      expect(project.user_name).toBeDefined();
      expect(typeof project.user_name).toBe('string');
      expect(project.projectType).toBeDefined();
      expect(['air-duct', 'grease-duct', 'engine-exhaust', 'boiler-vent']).toContain(project.projectType);
    });

    it('should create realistic test calculations', () => {
      const user = testDataFactory.createUser();
      const project = testDataFactory.createProject(user.id);
      const calculation = testDataFactory.createCalculation(project.uuid, user.id);

      expect(calculation).toBeDefined();
      expect(calculation.id).toBeDefined();
      expect(calculation.projectId).toBe(project.uuid);
      expect(calculation.userId).toBe(user.id);
      expect(calculation.type).toBeDefined();
      expect(calculation.inputs).toBeDefined();
      expect(calculation.results).toBeDefined();
    });

    it('should create test scenarios with proper relationships', () => {
      const scenario = testDataFactory.createTestScenario('basic_test', 2, 2, 3);

      expect(scenario.users).toHaveLength(2);
      expect(scenario.projects).toHaveLength(4); // 2 users * 2 projects each
      expect(scenario.calculations).toHaveLength(12); // 4 projects * 3 calculations each

      // Verify relationships - projects should have valid user names
      scenario.projects.forEach(project => {
        expect(project.user_name).toBeDefined();
        expect(typeof project.user_name).toBe('string');
      });

      scenario.calculations.forEach(calculation => {
        expect(scenario.projects.some(project => project.uuid === calculation.projectId)).toBe(true);
        expect(scenario.users.some(user => user.id === calculation.userId)).toBe(true);
      });
    });
  });

  describe('TestDatabaseManager', () => {
    it('should setup and cleanup database properly', async () => {
      const projectCount = await testDatabaseManager.getProjectCount();
      expect(projectCount).toBe(0); // Should start empty

      await testDatabaseManager.cleanup();

      // Re-setup for other tests
      await testDatabaseManager.setup();
    });

    it('should load test scenarios', async () => {
      const scenario = testDataFactory.createTestScenario('test_scenario', 1, 1, 2);

      await testDatabaseManager.loadTestScenario(scenario);

      const projectCount = await testDatabaseManager.getProjectCount();
      expect(projectCount).toBe(1);

      const segmentCount = await testDatabaseManager.getSegmentCount();
      expect(segmentCount).toBeGreaterThan(0); // Should have segments
    });

    it('should verify data integrity', async () => {
      const scenario = testDataFactory.createTestScenario('integrity_test', 1, 1, 1);
      await testDatabaseManager.loadTestScenario(scenario);

      const isValid = await testDatabaseManager.verifyDataIntegrity();
      expect(isValid).toBe(true);
    });
  });

  describe('Integration Test', () => {
    it('should work end-to-end with all components', async () => {
      // Create test scenario
      const scenario = testDataFactory.createTestScenario('integration_test', 1, 2, 3);

      // Load scenario into database
      await testDatabaseManager.loadTestScenario(scenario);

      // Verify data was loaded
      const projectCount = await testDatabaseManager.getProjectCount();
      expect(projectCount).toBe(2); // 1 user * 2 projects

      const segmentCount = await testDatabaseManager.getSegmentCount();
      expect(segmentCount).toBeGreaterThan(0); // Should have segments

      // Verify data integrity
      const isValid = await testDatabaseManager.verifyDataIntegrity();
      expect(isValid).toBe(true);

      console.log('✅ Test Data Management System: End-to-end integration test passed!');
    });

    it('should use convenience functions', () => {
      const basicData = createBasicTestData();

      expect(basicData).toBeDefined();
      expect(basicData.name).toBe('basic_test');
      expect(basicData.users).toHaveLength(1);
      expect(basicData.projects).toHaveLength(1);
      expect(basicData.calculations).toHaveLength(3);

      console.log('✅ Test Data Management System: Convenience functions working!');
    });

    it('should handle database operations correctly', async () => {
      const database = testDatabaseManager.getDatabase();
      expect(database).toBeDefined();

      // Test clearing data
      await testDatabaseManager.clearAllData();
      const projectCount = await testDatabaseManager.getProjectCount();
      expect(projectCount).toBe(0);

      console.log('✅ Test Data Management System: Database operations working!');
    });
  });
});
