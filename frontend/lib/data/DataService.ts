/**
 * Comprehensive DataService Interface
 * 
 * Implements ChatGPT recommendations for robust data service abstraction.
 * Provides unified interface for both local (offline) and remote (online) data access.
 * Supports sync, conflict resolution, and offline-first architecture.
 * 
 * @see docs/refactoring/component-architecture-specification.md
 */

import {
  SyncableUser,
  SyncableProject,
  SyncableFeatureFlag,
  SyncOperation,
  SyncConflict,
  EntityType,
  OperationType,
  ConflictResolution
} from '../../types/sync-models';

// =============================================================================
// Core DataService Interface
// =============================================================================

/**
 * Comprehensive data service interface
 * Abstracts all data operations for offline-first, online-ready architecture
 */
export interface DataService {
  // =============================================================================
  // Connection and Status
  // =============================================================================
  
  /** Initialize the data service */
  initialize(): Promise<void>;
  
  /** Check if service is ready */
  isReady(): boolean;
  
  /** Check if currently online (for future cloud mode) */
  isOnline(): boolean;
  
  /** Get connection status */
  getConnectionStatus(): ConnectionStatus;
  
  /** Close/cleanup the service */
  close(): Promise<void>;
  
  // =============================================================================
  // User Operations
  // =============================================================================
  
  /** Get user by ID */
  getUser(id: string): Promise<SyncableUser | null>;
  
  /** Get user by email */
  getUserByEmail(email: string): Promise<SyncableUser | null>;
  
  /** Get current user */
  getCurrentUser(): Promise<SyncableUser | null>;
  
  /** Save user */
  saveUser(user: SyncableUser): Promise<void>;
  
  /** Delete user */
  deleteUser(id: string): Promise<void>;
  
  /** List all users (admin function) */
  listUsers(): Promise<SyncableUser[]>;
  
  // =============================================================================
  // Project Operations
  // =============================================================================
  
  /** Get project by ID */
  getProject(id: string): Promise<SyncableProject | null>;
  
  /** Save project */
  saveProject(project: SyncableProject): Promise<void>;
  
  /** Delete project */
  deleteProject(id: string): Promise<void>;
  
  /** List projects by user */
  listProjectsByUser(userId: string): Promise<SyncableProject[]>;
  
  /** Search projects */
  searchProjects(query: string, userId?: string): Promise<SyncableProject[]>;
  
  /** Get project count */
  getProjectCount(userId?: string): Promise<number>;
  
  // =============================================================================
  // Feature Flag Operations
  // =============================================================================
  
  /** Get feature flag */
  getFeatureFlag(featureName: string, userId?: string): Promise<SyncableFeatureFlag | null>;
  
  /** Save feature flag */
  saveFeatureFlag(flag: SyncableFeatureFlag): Promise<void>;
  
  /** Delete feature flag */
  deleteFeatureFlag(id: string): Promise<void>;
  
  /** List feature flags by user */
  listFeatureFlagsByUser(userId: string): Promise<SyncableFeatureFlag[]>;
  
  /** List global feature flags */
  listGlobalFeatureFlags(): Promise<SyncableFeatureFlag[]>;
  
  // =============================================================================
  // Sync Operations (for future online mode)
  // =============================================================================
  
  /** Get pending sync operations */
  getPendingSyncOperations(): Promise<SyncOperation[]>;
  
  /** Add sync operation to queue */
  queueSyncOperation(operation: SyncOperation): Promise<void>;
  
  /** Process sync operations */
  processSyncOperations(): Promise<SyncResult>;
  
  /** Get sync conflicts */
  getSyncConflicts(): Promise<SyncConflict[]>;
  
  /** Resolve sync conflict */
  resolveSyncConflict(conflictId: string, resolution: ConflictResolution, mergedData?: any): Promise<void>;
  
  /** Force sync all data */
  forceSyncAll(): Promise<SyncResult>;
  
  // =============================================================================
  // Import/Export Operations
  // =============================================================================
  
  /** Export all data to file */
  exportAllData(format: ExportFormat): Promise<ExportResult>;
  
  /** Export specific entity */
  exportEntity(entityType: EntityType, entityId: string, format: ExportFormat): Promise<ExportResult>;
  
  /** Import data from file */
  importData(data: any, options: ImportOptions): Promise<ImportResult>;
  
  /** Validate import data */
  validateImportData(data: any): Promise<ValidationResult>;
  
  // =============================================================================
  // Backup and Recovery
  // =============================================================================
  
  /** Create backup */
  createBackup(options: BackupOptions): Promise<BackupResult>;
  
  /** Restore from backup */
  restoreFromBackup(backupData: any, options: RestoreOptions): Promise<RestoreResult>;
  
  /** List available backups */
  listBackups(): Promise<BackupInfo[]>;
  
  /** Delete backup */
  deleteBackup(backupId: string): Promise<void>;
  
  // =============================================================================
  // Statistics and Monitoring
  // =============================================================================
  
  /** Get data statistics */
  getStatistics(): Promise<DataStatistics>;
  
  /** Get sync statistics */
  getSyncStatistics(): Promise<SyncStatistics>;
  
  /** Get storage usage */
  getStorageUsage(): Promise<StorageUsage>;
  
  // =============================================================================
  // Event System
  // =============================================================================
  
  /** Subscribe to data events */
  subscribe(event: DataEvent, callback: (data: any) => void): () => void;
  
  /** Emit data event */
  emit(event: DataEvent, data: any): void;
}

// =============================================================================
// Supporting Types
// =============================================================================

/**
 * Connection status
 */
export interface ConnectionStatus {
  isOnline: boolean;
  isConnectedToServer: boolean;
  lastSyncTime?: Date;
  syncInProgress: boolean;
  pendingOperations: number;
  conflictCount: number;
}

/**
 * Export formats
 */
export type ExportFormat = 'json' | 'csv' | 'pdf' | 'xlsx' | 'backup';

/**
 * Export result
 */
export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  format: ExportFormat;
  timestamp: Date;
  error?: string;
  downloadUrl?: string;
}

/**
 * Import options
 */
export interface ImportOptions {
  overwriteExisting: boolean;
  validateData: boolean;
  createBackup: boolean;
  mergeStrategy: 'replace' | 'merge' | 'skip';
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
  backupCreated?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

/**
 * Backup options
 */
export interface BackupOptions {
  includeUserData: boolean;
  includeProjects: boolean;
  includeFeatureFlags: boolean;
  compression: boolean;
  encryption: boolean;
  description?: string;
}

/**
 * Backup result
 */
export interface BackupResult {
  success: boolean;
  backupId: string;
  filePath?: string;
  fileSize?: number;
  timestamp: Date;
  error?: string;
}

/**
 * Backup info
 */
export interface BackupInfo {
  id: string;
  timestamp: Date;
  description?: string;
  fileSize: number;
  filePath: string;
  entities: {
    users: number;
    projects: number;
    featureFlags: number;
  };
}

/**
 * Restore options
 */
export interface RestoreOptions {
  overwriteExisting: boolean;
  restoreUsers: boolean;
  restoreProjects: boolean;
  restoreFeatureFlags: boolean;
  createBackupBeforeRestore: boolean;
}

/**
 * Restore result
 */
export interface RestoreResult {
  success: boolean;
  restoredCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
  backupCreated?: string;
}

/**
 * Data statistics
 */
export interface DataStatistics {
  users: {
    total: number;
    byTier: Record<string, number>;
  };
  projects: {
    total: number;
    byUser: Record<string, number>;
    totalSize: number;
  };
  featureFlags: {
    total: number;
    enabled: number;
    disabled: number;
  };
  storage: {
    totalSize: number;
    availableSpace: number;
    usagePercentage: number;
  };
}

/**
 * Sync statistics
 */
export interface SyncStatistics {
  lastSyncTime?: Date;
  pendingOperations: number;
  completedOperations: number;
  failedOperations: number;
  conflictCount: number;
  syncErrors: string[];
}

/**
 * Storage usage
 */
export interface StorageUsage {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  usagePercentage: number;
  breakdown: {
    users: number;
    projects: number;
    featureFlags: number;
    backups: number;
    cache: number;
  };
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  syncedCount: number;
  conflictCount: number;
  errorCount: number;
  errors: string[];
  conflicts: SyncConflict[];
}

/**
 * Data events
 */
export type DataEvent = 
  | 'user:created' | 'user:updated' | 'user:deleted'
  | 'project:created' | 'project:updated' | 'project:deleted'
  | 'feature_flag:created' | 'feature_flag:updated' | 'feature_flag:deleted'
  | 'sync:started' | 'sync:completed' | 'sync:failed'
  | 'conflict:detected' | 'conflict:resolved'
  | 'backup:created' | 'backup:restored'
  | 'connection:online' | 'connection:offline';

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create data service instance
 */
export function createDataService(mode: 'local' | 'remote' | 'hybrid'): DataService {
  switch (mode) {
    case 'local': {
      // Import and return local implementation
      const { LocalDataService } = require('./local/LocalDataService');
      return new LocalDataService();
    }
    case 'remote':
      // Return remote implementation (API) - to be implemented
      throw new Error('Remote DataService implementation not yet available');
    case 'hybrid':
      // Return hybrid implementation (local + remote sync) - to be implemented
      throw new Error('Hybrid DataService implementation not yet available');
    default:
      throw new Error(`Unknown DataService mode: ${mode}`);
  }
}
