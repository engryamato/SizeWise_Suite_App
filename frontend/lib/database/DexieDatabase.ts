/**
 * Enhanced Dexie.js Database Implementation for SizeWise Suite
 * 
 * Provides high-performance IndexedDB operations with:
 * - Type-safe database operations
 * - Automatic schema migrations
 * - Transaction support
 * - Query optimization
 * - Offline-first architecture support
 */

import Dexie, { Table, Transaction } from 'dexie';
import { Project, Room, Segment, Equipment, CalculationResult } from '@/types/air-duct-sizer';

// =============================================================================
// Database Schema Interfaces
// =============================================================================

export interface SizeWiseProject extends Omit<Project, 'id'> {
  id?: number;
  uuid: string; // External UUID for sync
  lastModified: Date;
  syncStatus: 'local' | 'synced' | 'pending' | 'conflict';
  version: number;
}

export interface SizeWiseCalculation {
  id?: number;
  uuid: string;
  projectUuid: string;
  segmentUuid?: string;
  roomUuid?: string;
  calculationType: string;
  inputData: any;
  result: CalculationResult;
  timestamp: Date;
  syncStatus: 'local' | 'synced' | 'pending' | 'conflict';
}

export interface SpatialDataLayer {
  id?: number;
  uuid: string;
  projectUuid: string;
  layerType: 'duct' | 'equipment' | 'room' | 'annotation' | 'background';
  geometry: any; // GeoJSON or Three.js geometry data
  properties: Record<string, any>;
  visible: boolean;
  locked: boolean;
  lastModified: Date;
  syncStatus: 'local' | 'synced' | 'pending' | 'conflict';
}

export interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  compressed: boolean;
}

export interface SyncOperation {
  id?: number;
  uuid: string;
  entityType: 'project' | 'calculation' | 'spatial' | 'user';
  entityUuid: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  lastError?: string;
}

export interface UserPreference {
  id?: number;
  key: string;
  value: any;
  lastModified: Date;
}

// =============================================================================
// Enhanced Dexie Database Class
// =============================================================================

export class SizeWiseDatabase extends Dexie {
  // Tables
  projects!: Table<SizeWiseProject>;
  calculations!: Table<SizeWiseCalculation>;
  spatialData!: Table<SpatialDataLayer>;
  syncOperations!: Table<SyncOperation>;
  cacheEntries!: Table<CacheEntry>;
  userPreferences!: Table<UserPreference>;

  constructor() {
    super('SizeWiseDatabase');

    // Define schema versions
    this.version(1).stores({
      projects: '++id, uuid, lastModified, syncStatus, project_name',
      calculations: '++id, uuid, projectUuid, timestamp, calculationType, syncStatus',
      spatialData: '++id, uuid, projectUuid, layerType, lastModified, syncStatus',
      syncOperations: '++id, uuid, entityType, entityUuid, timestamp, status',
      userPreferences: '++id, key, lastModified',
      cacheEntries: 'key, timestamp, lastAccessed, ttl'
    });

    // Add hooks for automatic timestamp updates
    this.projects.hook('creating', (primKey, obj, trans) => {
      obj.lastModified = new Date();
      obj.version = 1;
      obj.syncStatus = 'local';
    });

    this.projects.hook('updating', (modifications, primKey, obj, trans) => {
      (modifications as any).lastModified = new Date();
      (modifications as any).version = (obj.version || 0) + 1;
      if (obj.syncStatus === 'synced') {
        (modifications as any).syncStatus = 'pending';
      }
    });

    this.calculations.hook('creating', (primKey, obj, trans) => {
      obj.timestamp = new Date();
      obj.syncStatus = 'local';
    });

    this.spatialData.hook('creating', (primKey, obj, trans) => {
      obj.lastModified = new Date();
      obj.syncStatus = 'local';
    });

    this.spatialData.hook('updating', (modifications, primKey, obj, trans) => {
      (modifications as any).lastModified = new Date();
      if (obj.syncStatus === 'synced') {
        (modifications as any).syncStatus = 'pending';
      }
    });
  }

  // =============================================================================
  // Database Health Check Methods
  // =============================================================================

  async testDatabaseConnection(): Promise<boolean> {
    try {
      await this.open();
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  async validateDatabaseSchema(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Test each table exists and is accessible
      const tables = ['projects', 'calculations', 'spatialData', 'syncOperations', 'cacheEntries', 'userPreferences'];

      for (const tableName of tables) {
        try {
          const table = (this as any)[tableName];
          if (!table) {
            errors.push(`Table ${tableName} not found`);
            continue;
          }

          // Test basic operations
          await table.limit(1).toArray();
        } catch (error) {
          errors.push(`Table ${tableName} validation failed: ${error}`);
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Schema validation failed: ${error}`);
      return { valid: false, errors };
    }
  }

  async performBasicCRUDTest(): Promise<{ success: boolean; results: any; errors: string[] }> {
    const errors: string[] = [];
    const results: any = {};

    try {
      // Test project creation
      const testProject: Omit<SizeWiseProject, 'id' | 'lastModified' | 'syncStatus' | 'version'> = {
        uuid: `test-${Date.now()}`,
        project_name: 'Test Project',
        contractor_name: 'Test Contractor',
        project_location: 'Test Address',
        codes: ['SMACNA'],
        rooms: [],
        segments: [],
        equipment: [],
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString()
      };

      const projectId = await this.createProject(testProject);
      results.projectCreated = { id: projectId, uuid: testProject.uuid };

      // Test project retrieval
      const retrievedProject = await this.projects.get(projectId);
      results.projectRetrieved = retrievedProject ? true : false;

      if (!retrievedProject) {
        errors.push('Failed to retrieve created project');
      }

      // Test project update
      if (retrievedProject) {
        await this.projects.update(projectId, { contractor_name: 'Updated Test Contractor' });
        const updatedProject = await this.projects.get(projectId);
        results.projectUpdated = updatedProject?.contractor_name === 'Updated Test Contractor';
      }

      // Test project deletion
      await this.projects.delete(projectId);
      const deletedProject = await this.projects.get(projectId);
      results.projectDeleted = !deletedProject;

      return { success: errors.length === 0, results, errors };
    } catch (error) {
      errors.push(`CRUD test failed: ${error}`);
      return { success: false, results, errors };
    }
  }

  // =============================================================================
  // Project Operations
  // =============================================================================

  async createProject(project: Omit<SizeWiseProject, 'id' | 'lastModified' | 'syncStatus' | 'version'>): Promise<number> {
    return await this.transaction('rw', this.projects, this.syncOperations, async () => {
      const id = await this.projects.add({
        ...project,
        lastModified: new Date(),
        syncStatus: 'local',
        version: 1
      });

      // Queue sync operation
      await this.queueSyncOperation('project', project.uuid, 'create', project);

      return id;
    });
  }

  async updateProject(uuid: string, updates: Partial<SizeWiseProject>): Promise<void> {
    return await this.transaction('rw', this.projects, this.syncOperations, async () => {
      const updated = await this.projects.where('uuid').equals(uuid).modify(updates);
      
      if (updated > 0) {
        await this.queueSyncOperation('project', uuid, 'update', updates);
      }
    });
  }

  async getProject(uuid: string): Promise<SizeWiseProject | undefined> {
    return await this.projects.where('uuid').equals(uuid).first();
  }

  async getAllProjects(): Promise<SizeWiseProject[]> {
    return await this.projects.orderBy('lastModified').reverse().toArray();
  }

  async deleteProject(uuid: string): Promise<void> {
    return await this.transaction('rw', this.projects, this.calculations, this.spatialData, this.syncOperations, async () => {
      // Delete related data
      await this.calculations.where('projectUuid').equals(uuid).delete();
      await this.spatialData.where('projectUuid').equals(uuid).delete();
      
      // Delete project
      await this.projects.where('uuid').equals(uuid).delete();
      
      // Queue sync operation
      await this.queueSyncOperation('project', uuid, 'delete', { uuid });
    });
  }

  // =============================================================================
  // Calculation Operations
  // =============================================================================

  async saveCalculation(calculation: Omit<SizeWiseCalculation, 'id' | 'timestamp' | 'syncStatus'>): Promise<number> {
    return await this.transaction('rw', this.calculations, this.syncOperations, async () => {
      const id = await this.calculations.add({
        ...calculation,
        timestamp: new Date(),
        syncStatus: 'local'
      });

      await this.queueSyncOperation('calculation', calculation.uuid, 'create', calculation);

      return id;
    });
  }

  async getCalculationsByProject(projectUuid: string): Promise<SizeWiseCalculation[]> {
    return await this.calculations
      .where('projectUuid')
      .equals(projectUuid)
      .reverse()
      .sortBy('timestamp');
  }

  async getCalculationsByType(projectUuid: string, calculationType: string): Promise<SizeWiseCalculation[]> {
    return await this.calculations
      .where(['projectUuid', 'calculationType'])
      .equals([projectUuid, calculationType])
      .reverse()
      .sortBy('timestamp');
  }

  // =============================================================================
  // Spatial Data Operations
  // =============================================================================

  async saveSpatialLayer(layer: Omit<SpatialDataLayer, 'id' | 'lastModified' | 'syncStatus'>): Promise<number> {
    return await this.transaction('rw', this.spatialData, this.syncOperations, async () => {
      const id = await this.spatialData.add({
        ...layer,
        lastModified: new Date(),
        syncStatus: 'local'
      });

      await this.queueSyncOperation('spatial', layer.uuid, 'create', layer);

      return id;
    });
  }

  async getSpatialLayersByProject(projectUuid: string): Promise<SpatialDataLayer[]> {
    return await this.spatialData
      .where('projectUuid')
      .equals(projectUuid)
      .sortBy('lastModified');
  }

  async getSpatialLayersByType(projectUuid: string, layerType: string): Promise<SpatialDataLayer[]> {
    return await this.spatialData
      .where(['projectUuid', 'layerType'])
      .equals([projectUuid, layerType])
      .toArray();
  }

  async updateSpatialLayer(uuid: string, updates: Partial<SpatialDataLayer>): Promise<void> {
    return await this.transaction('rw', this.spatialData, this.syncOperations, async () => {
      const updated = await this.spatialData.where('uuid').equals(uuid).modify(updates);
      
      if (updated > 0) {
        await this.queueSyncOperation('spatial', uuid, 'update', updates);
      }
    });
  }

  // =============================================================================
  // Sync Operations
  // =============================================================================

  private async queueSyncOperation(
    entityType: SyncOperation['entityType'],
    entityUuid: string,
    operation: SyncOperation['operation'],
    data: any
  ): Promise<void> {
    await this.syncOperations.add({
      uuid: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityType,
      entityUuid,
      operation,
      data,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0
    });
  }

  async getPendingSyncOperations(): Promise<SyncOperation[]> {
    return await this.syncOperations
      .where('status')
      .equals('pending')
      .sortBy('timestamp');
  }

  async markSyncOperationCompleted(uuid: string): Promise<void> {
    await this.syncOperations.where('uuid').equals(uuid).modify({ status: 'completed' });
  }

  async markSyncOperationFailed(uuid: string, error: string): Promise<void> {
    await this.syncOperations.where('uuid').equals(uuid).modify((obj: SyncOperation) => {
      obj.status = 'failed';
      obj.lastError = error;
      obj.retryCount = (obj.retryCount || 0) + 1;
    });
  }

  // =============================================================================
  // User Preferences
  // =============================================================================

  async setUserPreference(key: string, value: any): Promise<void> {
    await this.userPreferences.put({
      key,
      value,
      lastModified: new Date()
    });
  }

  async getUserPreference(key: string): Promise<any> {
    const pref = await this.userPreferences.where('key').equals(key).first();
    return pref?.value;
  }

  async getAllUserPreferences(): Promise<Record<string, any>> {
    const prefs = await this.userPreferences.toArray();
    return prefs.reduce((acc, pref) => {
      acc[pref.key] = pref.value;
      return acc;
    }, {} as Record<string, any>);
  }

  // =============================================================================
  // Database Maintenance
  // =============================================================================

  async clearOldSyncOperations(olderThanDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    await this.syncOperations
      .where('timestamp')
      .below(cutoffDate)
      .and(op => op.status === 'completed')
      .delete();
  }

  async getStorageStats(): Promise<{
    projects: number;
    calculations: number;
    spatialLayers: number;
    pendingSyncOps: number;
    totalSize: number;
  }> {
    const [projects, calculations, spatialLayers, pendingSyncOps] = await Promise.all([
      this.projects.count(),
      this.calculations.count(),
      this.spatialData.count(),
      this.syncOperations.where('status').equals('pending').count()
    ]);

    // Estimate total size (rough calculation)
    const totalSize = await navigator.storage?.estimate?.()
      .then(estimate => estimate.usage || 0)
      .catch(() => 0);

    return {
      projects,
      calculations,
      spatialLayers,
      pendingSyncOps,
      totalSize
    };
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let dbInstance: SizeWiseDatabase | null = null;

export function getSizeWiseDatabase(): SizeWiseDatabase {
  if (!dbInstance) {
    dbInstance = new SizeWiseDatabase();
  }
  return dbInstance;
}

export async function initializeSizeWiseDatabase(): Promise<SizeWiseDatabase> {
  const db = getSizeWiseDatabase();
  await db.open();
  return db;
}
