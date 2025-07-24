/**
 * Local DataService Implementation
 * 
 * IndexedDB-based implementation of the DataService interface.
 * Provides offline-first data access with sync preparation.
 * 
 * @see docs/refactoring/component-architecture-specification.md
 */

import { DataService, ConnectionStatus, ExportResult, ImportResult, ValidationResult, BackupResult, RestoreResult, BackupInfo, DataStatistics, SyncStatistics, StorageUsage, SyncResult, ExportFormat, ImportOptions, BackupOptions, RestoreOptions, DataEvent } from '../DataService';
import { SyncableUser, SyncableProject, SyncableFeatureFlag, SyncOperation, SyncConflict, EntityType, ConflictResolution, createSyncMetadata, updateSyncMetadata } from '../../../types/sync-models';
import { BrowserDatabaseManager, initializeBrowserDatabase } from '../../database/BrowserDatabaseManager';

/**
 * Local DataService implementation using IndexedDB
 */
export class LocalDataService implements DataService {
  private dbManager: BrowserDatabaseManager | null = null;
  private ready = false;
  private eventListeners: Map<DataEvent, ((data: any) => void)[]> = new Map();
  private syncQueue: SyncOperation[] = [];

  // =============================================================================
  // Connection and Status
  // =============================================================================

  async initialize(): Promise<void> {
    try {
      console.log('🔧 Initializing Local DataService...');
      this.dbManager = await initializeBrowserDatabase();
      this.ready = true; // Set ready before initializing default data
      await this.initializeDefaultData();
      console.log('✅ Local DataService initialized successfully');
      this.emit('connection:online', { timestamp: new Date() });
    } catch (error) {
      console.error('❌ Failed to initialize Local DataService:', error);
      this.ready = false; // Reset ready state on error
      throw error;
    }
  }

  isReady(): boolean {
    return this.ready && this.dbManager !== null;
  }

  isOnline(): boolean {
    // For local service, we're always "online" to local storage
    return this.ready;
  }

  getConnectionStatus(): ConnectionStatus {
    return {
      isOnline: this.isOnline(),
      isConnectedToServer: false, // Local mode
      lastSyncTime: undefined, // No sync in local mode
      syncInProgress: false,
      pendingOperations: this.syncQueue.length,
      conflictCount: 0 // No conflicts in local mode
    };
  }

  async close(): Promise<void> {
    if (this.dbManager) {
      await this.dbManager.close();
      this.dbManager = null;
      this.ready = false;
      console.log('🔌 Local DataService closed');
    }
  }

  // =============================================================================
  // User Operations
  // =============================================================================

  async getUser(id: string): Promise<SyncableUser | null> {
    this.ensureReady();
    try {
      const userData = await this.dbManager!.get('users', id);
      return userData ? this.mapToSyncableUser(userData) : null;
    } catch (error) {
      console.error('Failed to get user:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<SyncableUser | null> {
    this.ensureReady();
    try {
      const users = await this.dbManager!.getByIndex('users', 'email', email);
      return users.length > 0 ? this.mapToSyncableUser(users[0]) : null;
    } catch (error) {
      console.error('Failed to get user by email:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<SyncableUser | null> {
    this.ensureReady();
    try {
      const users = await this.dbManager!.getAll('users');
      if (users.length > 0) {
        return this.mapToSyncableUser(users[0]);
      }
      
      // Create default user if none exists
      const defaultUser = await this.createDefaultUser();
      return defaultUser;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  async saveUser(user: SyncableUser): Promise<void> {
    this.ensureReady();
    try {
      const userData = this.mapFromSyncableUser(user);
      await this.dbManager!.put('users', userData);
      this.emit('user:updated', { user });
      
      // Queue sync operation for future online mode
      await this.queueSyncOperation({
        id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entityType: 'user',
        entityId: user.id,
        operation: 'update',
        timestamp: new Date(),
        userId: user.id,
        data: user,
        status: 'pending',
        retryCount: 0
      });
    } catch (error) {
      console.error('Failed to save user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    this.ensureReady();
    try {
      await this.dbManager!.delete('users', id);
      this.emit('user:deleted', { id });
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }

  async listUsers(): Promise<SyncableUser[]> {
    this.ensureReady();
    try {
      const usersData = await this.dbManager!.getAll('users');
      return usersData.map(userData => this.mapToSyncableUser(userData));
    } catch (error) {
      console.error('Failed to list users:', error);
      throw error;
    }
  }

  // =============================================================================
  // Project Operations
  // =============================================================================

  async getProject(id: string): Promise<SyncableProject | null> {
    this.ensureReady();
    try {
      const projectData = await this.dbManager!.get('projects', id);
      return projectData ? this.mapToSyncableProject(projectData) : null;
    } catch (error) {
      console.error('Failed to get project:', error);
      throw error;
    }
  }

  async saveProject(project: SyncableProject): Promise<void> {
    this.ensureReady();
    try {
      const projectData = this.mapFromSyncableProject(project);
      await this.dbManager!.put('projects', projectData);
      this.emit('project:updated', { project });
      
      // Queue sync operation
      await this.queueSyncOperation({
        id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entityType: 'project',
        entityId: project.id,
        operation: 'update',
        timestamp: new Date(),
        userId: project.userId,
        data: project,
        status: 'pending',
        retryCount: 0
      });
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    this.ensureReady();
    try {
      await this.dbManager!.delete('projects', id);
      this.emit('project:deleted', { id });
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  async listProjectsByUser(userId: string): Promise<SyncableProject[]> {
    this.ensureReady();
    try {
      const projectsData = await this.dbManager!.getByIndex('projects', 'userId', userId);
      return projectsData.map(projectData => this.mapToSyncableProject(projectData));
    } catch (error) {
      console.error('Failed to list projects by user:', error);
      throw error;
    }
  }

  async searchProjects(query: string, userId?: string): Promise<SyncableProject[]> {
    this.ensureReady();
    try {
      const projects = userId 
        ? await this.listProjectsByUser(userId)
        : await this.dbManager!.getAll('projects').then(data => 
            data.map(projectData => this.mapToSyncableProject(projectData))
          );
      
      const lowercaseQuery = query.toLowerCase();
      return projects.filter(project => 
        project.project_name.toLowerCase().includes(lowercaseQuery) ||
        project.project_description?.toLowerCase().includes(lowercaseQuery) ||
        project.client_name?.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Failed to search projects:', error);
      throw error;
    }
  }

  async getProjectCount(userId?: string): Promise<number> {
    this.ensureReady();
    try {
      if (userId) {
        const projects = await this.listProjectsByUser(userId);
        return projects.length;
      } else {
        return await this.dbManager!.count('projects');
      }
    } catch (error) {
      console.error('Failed to get project count:', error);
      throw error;
    }
  }

  // =============================================================================
  // Feature Flag Operations
  // =============================================================================

  async getFeatureFlag(featureName: string, userId?: string): Promise<SyncableFeatureFlag | null> {
    this.ensureReady();
    try {
      // First try user-specific flag
      if (userId) {
        const userFlags = await this.dbManager!.getByIndex('feature_flags', 'userId', userId);
        const userFlag = userFlags.find(flag => flag.featureName === featureName);
        if (userFlag) {
          return this.mapToSyncableFeatureFlag(userFlag);
        }
      }

      // Fall back to global flag
      const globalFlags = await this.dbManager!.getByIndex('feature_flags', 'userId', null);
      const globalFlag = globalFlags.find(flag => flag.featureName === featureName);
      return globalFlag ? this.mapToSyncableFeatureFlag(globalFlag) : null;
    } catch (error) {
      console.error('Failed to get feature flag:', error);
      throw error;
    }
  }

  async saveFeatureFlag(flag: SyncableFeatureFlag): Promise<void> {
    this.ensureReady();
    try {
      const flagData = this.mapFromSyncableFeatureFlag(flag);
      await this.dbManager!.put('feature_flags', flagData);
      this.emit('feature_flag:updated', { flag });
    } catch (error) {
      console.error('Failed to save feature flag:', error);
      throw error;
    }
  }

  async deleteFeatureFlag(id: string): Promise<void> {
    this.ensureReady();
    try {
      await this.dbManager!.delete('feature_flags', id);
      this.emit('feature_flag:deleted', { id });
    } catch (error) {
      console.error('Failed to delete feature flag:', error);
      throw error;
    }
  }

  async listFeatureFlagsByUser(userId: string): Promise<SyncableFeatureFlag[]> {
    this.ensureReady();
    try {
      const flagsData = await this.dbManager!.getByIndex('feature_flags', 'userId', userId);
      return flagsData.map(flagData => this.mapToSyncableFeatureFlag(flagData));
    } catch (error) {
      console.error('Failed to list feature flags by user:', error);
      throw error;
    }
  }

  async listGlobalFeatureFlags(): Promise<SyncableFeatureFlag[]> {
    this.ensureReady();
    try {
      const flagsData = await this.dbManager!.getByIndex('feature_flags', 'userId', null);
      return flagsData.map(flagData => this.mapToSyncableFeatureFlag(flagData));
    } catch (error) {
      console.error('Failed to list global feature flags:', error);
      throw error;
    }
  }

  // =============================================================================
  // Sync Operations (Preparation for Online Mode)
  // =============================================================================

  async getPendingSyncOperations(): Promise<SyncOperation[]> {
    return this.syncQueue.filter(op => op.status === 'pending');
  }

  async queueSyncOperation(operation: SyncOperation): Promise<void> {
    this.syncQueue.push(operation);
    // In local mode, we just queue operations for future sync
    console.log(`📝 Queued sync operation: ${operation.operation} ${operation.entityType}:${operation.entityId}`);
  }

  async processSyncOperations(): Promise<SyncResult> {
    // In local mode, we don't actually sync - just return success
    return {
      success: true,
      syncedCount: 0,
      conflictCount: 0,
      errorCount: 0,
      errors: [],
      conflicts: []
    };
  }

  async getSyncConflicts(): Promise<SyncConflict[]> {
    // No conflicts in local mode
    return [];
  }

  async resolveSyncConflict(conflictId: string, resolution: ConflictResolution, mergedData?: any): Promise<void> {
    // No conflicts to resolve in local mode
  }

  async forceSyncAll(): Promise<SyncResult> {
    // In local mode, return success without actual sync
    return {
      success: true,
      syncedCount: 0,
      conflictCount: 0,
      errorCount: 0,
      errors: [],
      conflicts: []
    };
  }

  // =============================================================================
  // Placeholder Methods (To be implemented)
  // =============================================================================

  async exportAllData(format: ExportFormat): Promise<ExportResult> {
    throw new Error('Export functionality not yet implemented');
  }

  async exportEntity(entityType: EntityType, entityId: string, format: ExportFormat): Promise<ExportResult> {
    throw new Error('Export functionality not yet implemented');
  }

  async importData(data: any, options: ImportOptions): Promise<ImportResult> {
    throw new Error('Import functionality not yet implemented');
  }

  async validateImportData(data: any): Promise<ValidationResult> {
    throw new Error('Validation functionality not yet implemented');
  }

  async createBackup(options: BackupOptions): Promise<BackupResult> {
    throw new Error('Backup functionality not yet implemented');
  }

  async restoreFromBackup(backupData: any, options: RestoreOptions): Promise<RestoreResult> {
    throw new Error('Restore functionality not yet implemented');
  }

  async listBackups(): Promise<BackupInfo[]> {
    return [];
  }

  async deleteBackup(backupId: string): Promise<void> {
    throw new Error('Backup deletion not yet implemented');
  }

  async getStatistics(): Promise<DataStatistics> {
    throw new Error('Statistics not yet implemented');
  }

  async getSyncStatistics(): Promise<SyncStatistics> {
    return {
      pendingOperations: this.syncQueue.length,
      completedOperations: 0,
      failedOperations: 0,
      conflictCount: 0,
      syncErrors: []
    };
  }

  async getStorageUsage(): Promise<StorageUsage> {
    throw new Error('Storage usage not yet implemented');
  }

  // =============================================================================
  // Event System
  // =============================================================================

  subscribe(event: DataEvent, callback: (data: any) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  emit(event: DataEvent, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  private ensureReady(): void {
    if (!this.ready || !this.dbManager) {
      throw new Error('LocalDataService not initialized. Call initialize() first.');
    }
  }

  private async initializeDefaultData(): Promise<void> {
    // Initialize default data if needed
    const users = await this.dbManager!.getAll('users');
    if (users.length === 0) {
      await this.createDefaultUser();
    }
  }

  private async createDefaultUser(): Promise<SyncableUser> {
    const defaultUser: SyncableUser = {
      id: 'offline-user-001',
      email: 'offline@sizewise.local',
      name: 'Offline User',
      tier: 'free',
      company: 'Local Company',
      licenseKey: 'OFFLINE-LICENSE-001',
      organizationId: null,
      settings: {
        theme: 'system',
        units: 'imperial',
        autoSave: true
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      sync: createSyncMetadata('offline-user-001'),
      offline: {
        preferences: {
          autoSave: true,
          backupFrequency: 'weekly',
          exportFormat: 'json'
        },
        licenseValidation: {
          isValid: true,
          features: ['air_duct_sizer', 'project_management', 'basic_export']
        }
      }
    };

    await this.saveUser(defaultUser);
    return defaultUser;
  }

  // Mapping functions would be implemented here
  private mapToSyncableUser(userData: any): SyncableUser {
    // Implementation needed
    return userData as SyncableUser;
  }

  private mapFromSyncableUser(user: SyncableUser): any {
    // Implementation needed
    return user;
  }

  private mapToSyncableProject(projectData: any): SyncableProject {
    // Implementation needed
    return projectData as SyncableProject;
  }

  private mapFromSyncableProject(project: SyncableProject): any {
    // Implementation needed
    return project;
  }

  private mapToSyncableFeatureFlag(flagData: any): SyncableFeatureFlag {
    // Implementation needed
    return flagData as SyncableFeatureFlag;
  }

  private mapFromSyncableFeatureFlag(flag: SyncableFeatureFlag): any {
    // Implementation needed
    return flag;
  }
}
