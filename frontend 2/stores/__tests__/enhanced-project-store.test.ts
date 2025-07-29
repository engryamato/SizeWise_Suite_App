/**
 * Test Suite for Enhanced Project Store
 * 
 * Tests the enhanced project store functionality including:
 * - Project CRUD operations with optimistic updates
 * - Room, segment, and equipment management
 * - Computed properties for real-time calculations
 * - Undo/redo functionality
 * - Cross-store synchronization
 * - Performance monitoring
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { useEnhancedProjectStore, EnhancedProjectState } from '../enhanced-project-store';
import { advancedStateManager } from '../../lib/state/AdvancedStateManager';
import { Project, Room, Segment, Equipment } from '@/types/air-duct-sizer';

// =============================================================================
// Test Setup and Mocks
// =============================================================================

// Mock the types module
jest.mock('@/types/air-duct-sizer', () => ({
  Project: {},
  Room: {},
  Segment: {},
  Equipment: {}
}));

describe('Enhanced Project Store', () => {
  let store: any;

  beforeEach(() => {
    // Get the store instance
    store = useEnhancedProjectStore();
  });

  afterEach(() => {
    // Cleanup
    advancedStateManager.cleanup('enhanced-project');
  });

  // =============================================================================
  // Initial State Tests
  // =============================================================================

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState();
      
      expect(state.currentProject).toBeNull();
      expect(state.projects).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.isSaving).toBe(false);
      expect(state.error).toBeNull();
      
      // Computed properties should be initialized
      expect(state.totalRooms).toBe(0);
      expect(state.totalSegments).toBe(0);
      expect(state.totalEquipment).toBe(0);
      expect(state.totalCFM).toBe(0);
      expect(state.totalDuctLength).toBe(0);
      expect(state.projectComplexity).toBe('simple');
    });

    it('should have all required methods', () => {
      const state = store.getState();
      
      // Core project methods
      expect(typeof state.createProject).toBe('function');
      expect(typeof state.loadProject).toBe('function');
      expect(typeof state.updateProject).toBe('function');
      expect(typeof state.saveProject).toBe('function');
      expect(typeof state.deleteProject).toBe('function');
      expect(typeof state.clearProject).toBe('function');
      
      // Room management
      expect(typeof state.addRoom).toBe('function');
      expect(typeof state.updateRoom).toBe('function');
      expect(typeof state.deleteRoom).toBe('function');
      
      // Segment management
      expect(typeof state.addSegment).toBe('function');
      expect(typeof state.updateSegment).toBe('function');
      expect(typeof state.deleteSegment).toBe('function');
      
      // Equipment management
      expect(typeof state.addEquipment).toBe('function');
      expect(typeof state.updateEquipment).toBe('function');
      expect(typeof state.deleteEquipment).toBe('function');
      
      // Advanced state management
      expect(typeof state.optimisticUpdate).toBe('function');
      expect(typeof state.undo).toBe('function');
      expect(typeof state.redo).toBe('function');
      
      // Utility methods
      expect(typeof state.canAddRoom).toBe('function');
      expect(typeof state.validateProject).toBe('function');
      expect(typeof state.exportProject).toBe('function');
      expect(typeof state.importProject).toBe('function');
    });
  });

  // =============================================================================
  // Project CRUD Operations Tests
  // =============================================================================

  describe('Project CRUD Operations', () => {
    it('should create a new project', async () => {
      const projectData = {
        project_name: 'Test Project',
        project_location: 'Test Location',
        codes: ['SMACNA', 'ASHRAE']
      };

      await store.getState().createProject(projectData);
      
      const state = store.getState();
      expect(state.currentProject).not.toBeNull();
      expect(state.currentProject?.project_name).toBe('Test Project');
      expect(state.currentProject?.project_location).toBe('Test Location');
      expect(state.currentProject?.codes).toEqual(['SMACNA', 'ASHRAE']);
      expect(state.currentProject?.id).toBeTruthy();
      expect(state.isLoading).toBe(false);
    });

    it('should load an existing project', async () => {
      const existingProject: Project = {
        id: 'test-project-id',
        project_name: 'Existing Project',
        project_location: 'Existing Location',
        codes: ['SMACNA'],
        rooms: [],
        segments: [],
        equipment: [],
        plan_scale: 1,
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString()
      };

      await store.getState().loadProject(existingProject);
      
      const state = store.getState();
      expect(state.currentProject).toEqual(existingProject);
      expect(state.isLoading).toBe(false);
    });

    it('should update project with optimistic updates', async () => {
      // First create a project
      await store.getState().createProject({ project_name: 'Original Name' });
      
      const originalProject = store.getState().currentProject;
      expect(originalProject?.project_name).toBe('Original Name');
      
      // Update the project
      await store.getState().updateProject({ project_name: 'Updated Name' });
      
      const updatedProject = store.getState().currentProject;
      expect(updatedProject?.project_name).toBe('Updated Name');
      expect(updatedProject?.last_modified).not.toBe(originalProject?.last_modified);
    });

    it('should save project', async () => {
      await store.getState().createProject({ project_name: 'Save Test' });
      
      const savePromise = store.getState().saveProject();
      
      // Should set saving state
      expect(store.getState().isSaving).toBe(true);
      
      await savePromise;
      
      // Should clear saving state
      expect(store.getState().isSaving).toBe(false);
    });

    it('should clear project', () => {
      // First create a project
      store.getState().createProject({ project_name: 'To Be Cleared' });
      expect(store.getState().currentProject).not.toBeNull();
      
      // Clear the project
      store.getState().clearProject();
      expect(store.getState().currentProject).toBeNull();
    });
  });

  // =============================================================================
  // Room Management Tests
  // =============================================================================

  describe('Room Management', () => {
    beforeEach(async () => {
      // Create a project for room tests
      await store.getState().createProject({ project_name: 'Room Test Project' });
    });

    it('should add a room', async () => {
      const roomData = {
        room_name: 'Test Room',
        cfm: 500,
        room_type: 'office'
      };

      await store.getState().addRoom(roomData);
      
      const state = store.getState();
      expect(state.currentProject?.rooms).toHaveLength(1);
      expect(state.currentProject?.rooms[0].room_name).toBe('Test Room');
      expect(state.currentProject?.rooms[0].cfm).toBe(500);
      expect(state.currentProject?.rooms[0].room_id).toBeTruthy();
      
      // Computed properties should update
      expect(state.totalRooms).toBe(1);
      expect(state.totalCFM).toBe(500);
    });

    it('should update a room', async () => {
      // Add a room first
      await store.getState().addRoom({ room_name: 'Original Room', cfm: 300 });
      
      const roomId = store.getState().currentProject?.rooms[0].room_id;
      expect(roomId).toBeTruthy();
      
      // Update the room
      await store.getState().updateRoom(roomId!, { room_name: 'Updated Room', cfm: 600 });
      
      const state = store.getState();
      expect(state.currentProject?.rooms[0].room_name).toBe('Updated Room');
      expect(state.currentProject?.rooms[0].cfm).toBe(600);
      expect(state.totalCFM).toBe(600);
    });

    it('should delete a room', async () => {
      // Add a room first
      await store.getState().addRoom({ room_name: 'To Be Deleted', cfm: 400 });
      
      expect(store.getState().totalRooms).toBe(1);
      expect(store.getState().totalCFM).toBe(400);
      
      const roomId = store.getState().currentProject?.rooms[0].room_id;
      
      // Delete the room
      await store.getState().deleteRoom(roomId!);
      
      const state = store.getState();
      expect(state.currentProject?.rooms).toHaveLength(0);
      expect(state.totalRooms).toBe(0);
      expect(state.totalCFM).toBe(0);
    });

    it('should check room limits', () => {
      const canAdd = store.getState().canAddRoom();
      expect(typeof canAdd).toBe('boolean');
      expect(canAdd).toBe(true); // Should be true for pro tier
    });
  });

  // =============================================================================
  // Segment Management Tests
  // =============================================================================

  describe('Segment Management', () => {
    beforeEach(async () => {
      await store.getState().createProject({ project_name: 'Segment Test Project' });
    });

    it('should add a segment', async () => {
      const segmentData = {
        segment_name: 'Test Segment',
        length: 10,
        width: 12,
        height: 8,
        velocity: 1200,
        pressure_loss: 0.5
      };

      await store.getState().addSegment(segmentData);
      
      const state = store.getState();
      expect(state.currentProject?.segments).toHaveLength(1);
      expect(state.currentProject?.segments[0].segment_name).toBe('Test Segment');
      expect(state.currentProject?.segments[0].length).toBe(10);
      expect(state.currentProject?.segments[0].segment_id).toBeTruthy();
      
      // Computed properties should update
      expect(state.totalSegments).toBe(1);
      expect(state.totalDuctLength).toBe(10);
      expect(state.averageVelocity).toBe(1200);
      expect(state.systemPressureDrop).toBe(0.5);
    });

    it('should update a segment', async () => {
      await store.getState().addSegment({ segment_name: 'Original Segment', length: 5, velocity: 1000 });
      
      const segmentId = store.getState().currentProject?.segments[0].segment_id;
      
      await store.getState().updateSegment(segmentId!, { segment_name: 'Updated Segment', length: 15, velocity: 1500 });
      
      const state = store.getState();
      expect(state.currentProject?.segments[0].segment_name).toBe('Updated Segment');
      expect(state.currentProject?.segments[0].length).toBe(15);
      expect(state.totalDuctLength).toBe(15);
      expect(state.averageVelocity).toBe(1500);
    });

    it('should delete a segment', async () => {
      await store.getState().addSegment({ segment_name: 'To Be Deleted', length: 8 });
      
      expect(store.getState().totalSegments).toBe(1);
      
      const segmentId = store.getState().currentProject?.segments[0].segment_id;
      await store.getState().deleteSegment(segmentId!);
      
      const state = store.getState();
      expect(state.currentProject?.segments).toHaveLength(0);
      expect(state.totalSegments).toBe(0);
      expect(state.totalDuctLength).toBe(0);
    });
  });

  // =============================================================================
  // Equipment Management Tests
  // =============================================================================

  describe('Equipment Management', () => {
    beforeEach(async () => {
      await store.getState().createProject({ project_name: 'Equipment Test Project' });
    });

    it('should add equipment', async () => {
      const equipmentData = {
        equipment_name: 'Test Fan',
        equipment_type: 'fan',
        cfm: 1000
      };

      await store.getState().addEquipment(equipmentData);
      
      const state = store.getState();
      expect(state.currentProject?.equipment).toHaveLength(1);
      expect(state.currentProject?.equipment[0].equipment_name).toBe('Test Fan');
      expect(state.currentProject?.equipment[0].equipment_id).toBeTruthy();
      expect(state.totalEquipment).toBe(1);
    });

    it('should update equipment', async () => {
      await store.getState().addEquipment({ equipment_name: 'Original Fan', cfm: 800 });
      
      const equipmentId = store.getState().currentProject?.equipment[0].equipment_id;
      await store.getState().updateEquipment(equipmentId!, { equipment_name: 'Updated Fan', cfm: 1200 });
      
      const state = store.getState();
      expect(state.currentProject?.equipment[0].equipment_name).toBe('Updated Fan');
      expect(state.currentProject?.equipment[0].cfm).toBe(1200);
    });

    it('should delete equipment', async () => {
      await store.getState().addEquipment({ equipment_name: 'To Be Deleted' });
      
      expect(store.getState().totalEquipment).toBe(1);
      
      const equipmentId = store.getState().currentProject?.equipment[0].equipment_id;
      await store.getState().deleteEquipment(equipmentId!);
      
      const state = store.getState();
      expect(state.currentProject?.equipment).toHaveLength(0);
      expect(state.totalEquipment).toBe(0);
    });
  });

  // =============================================================================
  // Computed Properties Tests
  // =============================================================================

  describe('Computed Properties', () => {
    beforeEach(async () => {
      await store.getState().createProject({ project_name: 'Computed Properties Test' });
    });

    it('should calculate project complexity', async () => {
      // Simple project (few items)
      expect(store.getState().projectComplexity).toBe('simple');
      
      // Add items to increase complexity
      for (let i = 0; i < 15; i++) {
        await store.getState().addRoom({ room_name: `Room ${i}`, cfm: 100 });
      }
      
      // Should now be moderate
      expect(store.getState().projectComplexity).toBe('moderate');
    });

    it('should calculate compliance status', async () => {
      // Add compliant segments
      await store.getState().addSegment({ 
        segment_name: 'Compliant Segment', 
        velocity: 1500 // Within SMACNA range
      });
      
      // Add compliant room
      await store.getState().addRoom({ 
        room_name: 'Compliant Room', 
        cfm: 500 // Valid CFM
      });
      
      const state = store.getState();
      expect(state.complianceStatus.smacna).toBe(true);
      expect(state.complianceStatus.ashrae).toBe(true);
      expect(state.complianceStatus.overall).toBe(true);
    });

    it('should update computed properties reactively', async () => {
      expect(store.getState().totalCFM).toBe(0);
      
      await store.getState().addRoom({ room_name: 'Room 1', cfm: 300 });
      expect(store.getState().totalCFM).toBe(300);
      
      await store.getState().addRoom({ room_name: 'Room 2', cfm: 200 });
      expect(store.getState().totalCFM).toBe(500);
      
      // Update a room
      const roomId = store.getState().currentProject?.rooms[0].room_id;
      await store.getState().updateRoom(roomId!, { cfm: 400 });
      expect(store.getState().totalCFM).toBe(600); // 400 + 200
    });
  });

  // =============================================================================
  // Undo/Redo Tests
  // =============================================================================

  describe('Undo/Redo Functionality', () => {
    beforeEach(async () => {
      await store.getState().createProject({ project_name: 'Undo Test Project' });
    });

    it('should support undo for project updates', async () => {
      const originalName = store.getState().currentProject?.project_name;
      
      await store.getState().updateProject({ project_name: 'Changed Name' });
      expect(store.getState().currentProject?.project_name).toBe('Changed Name');
      
      const undoResult = store.getState().undo();
      expect(undoResult).toBe(true);
      expect(store.getState().currentProject?.project_name).toBe(originalName);
    });

    it('should track history size', async () => {
      const initialHistorySize = store.getState().getHistorySize();
      
      await store.getState().addRoom({ room_name: 'History Room' });
      await store.getState().addSegment({ segment_name: 'History Segment' });
      
      const newHistorySize = store.getState().getHistorySize();
      expect(newHistorySize).toBeGreaterThan(initialHistorySize);
    });

    it('should clear history', async () => {
      await store.getState().addRoom({ room_name: 'Room for history' });
      expect(store.getState().getHistorySize()).toBeGreaterThan(0);
      
      store.getState().clearHistory();
      expect(store.getState().getHistorySize()).toBe(0);
    });
  });

  // =============================================================================
  // Utility Methods Tests
  // =============================================================================

  describe('Utility Methods', () => {
    beforeEach(async () => {
      await store.getState().createProject({ project_name: 'Utility Test Project' });
    });

    it('should validate project', () => {
      const validation = store.getState().validateProject();
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
      expect(Array.isArray(validation.errors)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
    });

    it('should export project', () => {
      const exportedData = store.getState().exportProject();
      
      expect(typeof exportedData).toBe('string');
      expect(() => JSON.parse(exportedData)).not.toThrow();
      
      const parsedData = JSON.parse(exportedData);
      expect(parsedData.project_name).toBe('Utility Test Project');
    });

    it('should import project', async () => {
      const projectData = {
        id: 'imported-project',
        project_name: 'Imported Project',
        project_location: 'Import Location',
        codes: ['SMACNA'],
        rooms: [],
        segments: [],
        equipment: [],
        plan_scale: 1,
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString()
      };

      await store.getState().importProject(JSON.stringify(projectData));
      
      const state = store.getState();
      expect(state.currentProject?.project_name).toBe('Imported Project');
      expect(state.currentProject?.id).toBe('imported-project');
    });

    it('should handle invalid import data', async () => {
      await store.getState().importProject('invalid json data');
      
      const state = store.getState();
      expect(state.error).toBe('Invalid project data format');
    });
  });

  // =============================================================================
  // Performance Tests
  // =============================================================================

  describe('Performance Monitoring', () => {
    it('should provide state metrics', () => {
      const metrics = store.getState().getStateMetrics();
      
      expect(metrics).toHaveProperty('storeName');
      expect(metrics).toHaveProperty('stateSize');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(typeof metrics.stateSize).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('number');
    });
  });
});
