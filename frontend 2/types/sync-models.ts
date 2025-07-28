/**
 * Enhanced Data Models with Sync and Versioning Support
 * 
 * Implements ChatGPT recommendations for offline-first architecture
 * with proper versioning, conflict resolution, and sync preparation.
 * 
 * @see docs/refactoring/component-architecture-specification.md
 */

// =============================================================================
// Base Sync Metadata
// =============================================================================

/**
 * Base sync metadata for all entities
 * Prepares for future online synchronization
 */
export interface SyncMetadata {
  /** Entity version number for conflict resolution */
  version: number;
  
  /** Last modification timestamp */
  lastModified: Date;
  
  /** User who last modified this entity */
  lastModifiedBy: string;
  
  /** Sync status for online transition */
  syncStatus: 'local' | 'synced' | 'conflict' | 'pending';
  
  /** Last successful sync timestamp */
  lastSynced?: Date;
  
  /** Conflict resolution metadata */
  conflictData?: {
    conflictVersion: number;
    conflictedFields: string[];
    resolutionStrategy: 'local' | 'remote' | 'manual';
  };
  
  /** Change tracking for sync */
  changeLog: ChangeLogEntry[];
  
  /** Entity hash for integrity checking */
  entityHash?: string;
  
  /** Soft delete flag */
  isDeleted: boolean;
  
  /** Deletion timestamp */
  deletedAt?: Date;
}

/**
 * Change log entry for tracking modifications
 */
export interface ChangeLogEntry {
  /** Unique change ID */
  id: string;
  
  /** Timestamp of change */
  timestamp: Date;
  
  /** User who made the change */
  userId: string;
  
  /** Type of operation */
  operation: 'create' | 'update' | 'delete';
  
  /** Fields that were changed */
  changedFields: string[];
  
  /** Previous values (for rollback) */
  previousValues?: Record<string, any>;
  
  /** Change description */
  description?: string;
  
  /** Whether this change has been synced */
  synced: boolean;
}

// =============================================================================
// Enhanced Entity Models
// =============================================================================

/**
 * Enhanced User model with sync support
 */
export interface SyncableUser {
  // Core user data
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  company?: string;
  licenseKey?: string;
  organizationId?: string | null;
  settings: Record<string, any>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Sync metadata
  sync: SyncMetadata;
  
  // Offline-specific data
  offline: {
    /** Local user preferences */
    preferences: {
      autoSave: boolean;
      backupFrequency: 'never' | 'daily' | 'weekly';
      exportFormat: 'json' | 'csv' | 'pdf';
    };
    
    /** Local license validation */
    licenseValidation: {
      isValid: boolean;
      expiresAt?: Date;
      features: string[];
    };
  };
}

/**
 * Enhanced Project model with sync support
 */
export interface SyncableProject {
  // Core project data
  id: string;
  userId: string;
  project_name: string;
  project_number: string;
  project_description?: string;
  project_location?: string;
  client_name?: string;
  estimator_name?: string;
  date_created: string;
  last_modified: string;
  version: string;
  
  // Project content
  rooms: any[];
  segments: any[];
  equipment: any[];
  computational_properties: any;
  code_standards: any;
  
  // Sync metadata
  sync: SyncMetadata;
  
  // Collaboration data (for future online mode)
  collaboration: {
    /** Project sharing settings */
    sharing: {
      isShared: boolean;
      sharedWith: string[];
      permissions: Record<string, 'read' | 'write' | 'admin'>;
    };
    
    /** Comments and annotations */
    comments: ProjectComment[];
    
    /** Project lock status */
    lock: {
      isLocked: boolean;
      lockedBy?: string;
      lockedAt?: Date;
    };
  };
  
  // Offline-specific data
  offline: {
    /** Local backup information */
    backup: {
      lastBackup?: Date;
      backupPath?: string;
      autoBackup: boolean;
    };
    
    /** Export history */
    exports: ProjectExport[];
  };
}

/**
 * Project comment for collaboration
 */
export interface ProjectComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  resolved: boolean;
  replies: ProjectComment[];
}

/**
 * Project export record
 */
export interface ProjectExport {
  id: string;
  format: 'json' | 'csv' | 'pdf' | 'dwg';
  timestamp: Date;
  filePath?: string;
  fileSize?: number;
  success: boolean;
  error?: string;
}

/**
 * Enhanced Feature Flag model with sync support
 */
export interface SyncableFeatureFlag {
  // Core feature flag data
  id: string;
  userId?: string | null;
  organizationId?: string | null;
  featureName: string;
  enabled: boolean;
  tierRequired: 'free' | 'pro' | 'enterprise';
  expiresAt?: Date | null;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  // Sync metadata
  sync: SyncMetadata;
  
  // Feature-specific data
  feature: {
    /** Feature configuration */
    config: Record<string, any>;
    
    /** Usage tracking */
    usage: {
      lastUsed?: Date;
      usageCount: number;
      usageLimit?: number;
    };
    
    /** A/B testing data */
    experiment?: {
      variant: string;
      experimentId: string;
      startDate: Date;
      endDate?: Date;
    };
  };
}

// =============================================================================
// Sync Operation Types
// =============================================================================

/**
 * Sync operation for data synchronization
 */
export interface SyncOperation {
  id: string;
  entityType: 'user' | 'project' | 'feature_flag';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  timestamp: Date;
  userId: string;
  data: any;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retryCount: number;
  error?: string;
}

/**
 * Sync conflict for resolution
 */
export interface SyncConflict {
  id: string;
  entityType: 'user' | 'project' | 'feature_flag';
  entityId: string;
  localVersion: number;
  remoteVersion: number;
  localData: any;
  remoteData: any;
  conflictedFields: string[];
  timestamp: Date;
  status: 'pending' | 'resolved';
  resolution?: 'local' | 'remote' | 'merged';
  resolvedBy?: string;
  resolvedAt?: Date;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Entity type union
 */
export type SyncableEntity = SyncableUser | SyncableProject | SyncableFeatureFlag;

/**
 * Entity type names
 */
export type EntityType = 'user' | 'project' | 'feature_flag';

/**
 * Sync status options
 */
export type SyncStatus = 'local' | 'synced' | 'conflict' | 'pending';

/**
 * Operation types
 */
export type OperationType = 'create' | 'update' | 'delete';

/**
 * Conflict resolution strategies
 */
export type ConflictResolution = 'local' | 'remote' | 'manual' | 'merged';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create sync metadata for new entity
 */
export function createSyncMetadata(userId: string): SyncMetadata {
  return {
    version: 1,
    lastModified: new Date(),
    lastModifiedBy: userId,
    syncStatus: 'local',
    changeLog: [],
    isDeleted: false
  };
}

/**
 * Update sync metadata for entity modification
 */
export function updateSyncMetadata(
  current: SyncMetadata,
  userId: string,
  changedFields: string[],
  operation: OperationType = 'update'
): SyncMetadata {
  const changeEntry: ChangeLogEntry = {
    id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    userId,
    operation,
    changedFields,
    synced: false
  };

  return {
    ...current,
    version: current.version + 1,
    lastModified: new Date(),
    lastModifiedBy: userId,
    syncStatus: 'pending',
    changeLog: [...current.changeLog, changeEntry]
  };
}

/**
 * Generate entity hash for integrity checking
 */
export function generateEntityHash(entity: any): string {
  // Simple hash implementation - would use crypto in production
  const str = JSON.stringify(entity);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}
