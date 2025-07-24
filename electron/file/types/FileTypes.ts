/**
 * File Type Definitions - Comprehensive file operation types
 * 
 * MISSION-CRITICAL: Type definitions for file operations and tier enforcement
 * Provides type safety for all file-related operations and restrictions
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 3.3
 */

/**
 * File operation types
 */
export type FileOperation = 'read' | 'write' | 'import' | 'export' | 'delete';

/**
 * File categories
 */
export type FileCategory = 'project' | 'import' | 'export' | 'image' | 'document' | 'cad';

/**
 * Export formats with tier requirements
 */
export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  requiredTier: 'free' | 'pro' | 'enterprise';
  maxResolution?: {
    width: number;
    height: number;
  };
  features: string[];
  watermark?: boolean;
}

/**
 * Import format configuration
 */
export interface ImportFormat {
  id: string;
  name: string;
  extensions: string[];
  mimeTypes: string[];
  requiredTier: 'free' | 'pro' | 'enterprise';
  maxFileSize: number;
  features: string[];
  processor: string;
}

/**
 * File validation rules
 */
export interface FileValidationRules {
  maxSize: number;
  allowedExtensions: string[];
  requiredTier: 'free' | 'pro' | 'enterprise';
  virusScan: boolean;
  contentValidation: boolean;
}

/**
 * File access permissions
 */
export interface FileAccessPermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  share: boolean;
  export: boolean;
  import: boolean;
}

/**
 * File tier restrictions
 */
export interface FileTierRestrictions {
  free: {
    maxFileSize: number;
    allowedFormats: string[];
    exportFormats: string[];
    importFormats: string[];
    features: string[];
  };
  pro: {
    maxFileSize: number;
    allowedFormats: string[];
    exportFormats: string[];
    importFormats: string[];
    features: string[];
  };
  enterprise: {
    maxFileSize: number;
    allowedFormats: string[];
    exportFormats: string[];
    importFormats: string[];
    features: string[];
  };
}

/**
 * File processing status
 */
export type FileProcessingStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * File processing result
 */
export interface FileProcessingResult {
  status: FileProcessingStatus;
  progress: number;
  message?: string;
  error?: string;
  data?: any;
  metadata?: {
    processingTime: number;
    fileSize: number;
    format: string;
  };
}

/**
 * Batch file operation
 */
export interface BatchFileOperation {
  id: string;
  operation: FileOperation;
  files: string[];
  options: any;
  status: FileProcessingStatus;
  progress: number;
  results: FileProcessingResult[];
  startTime: Date;
  endTime?: Date;
}

/**
 * File dialog configuration
 */
export interface FileDialogConfig {
  title: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters: Electron.FileFilter[];
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
  message?: string;
  nameFieldLabel?: string;
  showsTagField?: boolean;
}

/**
 * File watcher configuration
 */
export interface FileWatcherConfig {
  path: string;
  recursive: boolean;
  events: Array<'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir'>;
  ignored?: string[];
  persistent: boolean;
  followSymlinks: boolean;
}

/**
 * File backup configuration
 */
export interface FileBackupConfig {
  enabled: boolean;
  interval: number; // minutes
  maxBackups: number;
  compression: boolean;
  encryption: boolean;
  location: string;
}

/**
 * File sync configuration
 */
export interface FileSyncConfig {
  enabled: boolean;
  provider: 'local' | 'cloud' | 'network';
  endpoint?: string;
  credentials?: {
    username: string;
    password: string;
    token?: string;
  };
  syncInterval: number;
  conflictResolution: 'local' | 'remote' | 'merge' | 'prompt';
}

/**
 * File security configuration
 */
export interface FileSecurityConfig {
  encryption: {
    enabled: boolean;
    algorithm: string;
    keySize: number;
  };
  signing: {
    enabled: boolean;
    algorithm: string;
  };
  virusScanning: {
    enabled: boolean;
    provider: string;
  };
  accessControl: {
    enabled: boolean;
    permissions: FileAccessPermissions;
  };
}

/**
 * File operation context
 */
export interface FileOperationContext {
  userId: string;
  userTier: 'free' | 'pro' | 'enterprise';
  operation: FileOperation;
  filePath: string;
  fileSize: number;
  fileType: string;
  timestamp: Date;
  sessionId: string;
  requestId: string;
}

/**
 * File audit log entry
 */
export interface FileAuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  operation: FileOperation;
  filePath: string;
  fileSize: number;
  success: boolean;
  error?: string;
  duration: number;
  metadata: {
    userAgent: string;
    ipAddress: string;
    sessionId: string;
  };
}

/**
 * File cache configuration
 */
export interface FileCacheConfig {
  enabled: boolean;
  maxSize: number; // bytes
  maxAge: number; // seconds
  compression: boolean;
  location: string;
  cleanupInterval: number; // seconds
}

/**
 * File thumbnail configuration
 */
export interface FileThumbnailConfig {
  enabled: boolean;
  sizes: Array<{
    name: string;
    width: number;
    height: number;
  }>;
  formats: string[];
  quality: number;
  cacheLocation: string;
}

/**
 * File search configuration
 */
export interface FileSearchConfig {
  indexing: {
    enabled: boolean;
    includedPaths: string[];
    excludedPaths: string[];
    fileTypes: string[];
  };
  search: {
    fuzzyMatching: boolean;
    caseSensitive: boolean;
    includeContent: boolean;
    maxResults: number;
  };
}

/**
 * File manager configuration
 */
export interface FileManagerConfig {
  tierRestrictions: FileTierRestrictions;
  security: FileSecurityConfig;
  backup: FileBackupConfig;
  sync: FileSyncConfig;
  cache: FileCacheConfig;
  thumbnails: FileThumbnailConfig;
  search: FileSearchConfig;
  audit: {
    enabled: boolean;
    logLevel: 'minimal' | 'standard' | 'detailed';
    retention: number; // days
  };
}

/**
 * Default file manager configuration
 */
export const DEFAULT_FILE_MANAGER_CONFIG: FileManagerConfig = {
  tierRestrictions: {
    free: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFormats: ['.sizewise', '.json', '.pdf'],
      exportFormats: ['.json', '.pdf'],
      importFormats: ['.json', '.pdf'],
      features: ['basic_export', 'pdf_export']
    },
    pro: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedFormats: ['.sizewise', '.json', '.pdf', '.png', '.jpg', '.xlsx', '.dwg'],
      exportFormats: ['.json', '.pdf', '.png', '.jpg', '.xlsx'],
      importFormats: ['.json', '.pdf', '.dwg', '.dxf'],
      features: ['advanced_export', 'image_export', 'excel_export', 'cad_import']
    },
    enterprise: {
      maxFileSize: 1024 * 1024 * 1024, // 1GB
      allowedFormats: ['*'],
      exportFormats: ['*'],
      importFormats: ['*'],
      features: ['all_formats', 'batch_operations', 'api_access', 'custom_formats']
    }
  },
  security: {
    encryption: {
      enabled: true,
      algorithm: 'AES-256-GCM',
      keySize: 256
    },
    signing: {
      enabled: true,
      algorithm: 'HMAC-SHA256'
    },
    virusScanning: {
      enabled: false,
      provider: 'none'
    },
    accessControl: {
      enabled: true,
      permissions: {
        read: true,
        write: true,
        delete: false,
        share: false,
        export: true,
        import: true
      }
    }
  },
  backup: {
    enabled: true,
    interval: 30, // 30 minutes
    maxBackups: 10,
    compression: true,
    encryption: true,
    location: 'backups'
  },
  sync: {
    enabled: false,
    provider: 'local',
    syncInterval: 300, // 5 minutes
    conflictResolution: 'prompt'
  },
  cache: {
    enabled: true,
    maxSize: 100 * 1024 * 1024, // 100MB
    maxAge: 3600, // 1 hour
    compression: true,
    location: 'cache',
    cleanupInterval: 300 // 5 minutes
  },
  thumbnails: {
    enabled: true,
    sizes: [
      { name: 'small', width: 64, height: 64 },
      { name: 'medium', width: 128, height: 128 },
      { name: 'large', width: 256, height: 256 }
    ],
    formats: ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
    quality: 80,
    cacheLocation: 'thumbnails'
  },
  search: {
    indexing: {
      enabled: true,
      includedPaths: ['projects', 'documents'],
      excludedPaths: ['temp', 'cache'],
      fileTypes: ['.sizewise', '.json', '.pdf', '.txt']
    },
    search: {
      fuzzyMatching: true,
      caseSensitive: false,
      includeContent: true,
      maxResults: 100
    }
  },
  audit: {
    enabled: true,
    logLevel: 'standard',
    retention: 90 // 90 days
  }
};

/**
 * Export format definitions
 */
export const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'json',
    name: 'JSON Project',
    extension: '.json',
    mimeType: 'application/json',
    requiredTier: 'free',
    features: ['project_data', 'calculations'],
    watermark: false
  },
  {
    id: 'pdf',
    name: 'PDF Report',
    extension: '.pdf',
    mimeType: 'application/pdf',
    requiredTier: 'free',
    features: ['formatted_report', 'calculations'],
    watermark: true
  },
  {
    id: 'png',
    name: 'PNG Image',
    extension: '.png',
    mimeType: 'image/png',
    requiredTier: 'pro',
    maxResolution: { width: 4096, height: 4096 },
    features: ['high_quality', 'transparency'],
    watermark: false
  },
  {
    id: 'excel',
    name: 'Excel Spreadsheet',
    extension: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    requiredTier: 'pro',
    features: ['calculations', 'data_tables', 'charts'],
    watermark: false
  },
  {
    id: 'dwg',
    name: 'AutoCAD Drawing',
    extension: '.dwg',
    mimeType: 'application/acad',
    requiredTier: 'enterprise',
    features: ['cad_geometry', 'layers', 'dimensions'],
    watermark: false
  },
  {
    id: 'ifc',
    name: 'IFC Building Model',
    extension: '.ifc',
    mimeType: 'application/x-step',
    requiredTier: 'enterprise',
    features: ['bim_data', '3d_geometry', 'properties'],
    watermark: false
  }
];

/**
 * Import format definitions
 */
export const IMPORT_FORMATS: ImportFormat[] = [
  {
    id: 'json',
    name: 'JSON Project',
    extensions: ['.json', '.sizewise'],
    mimeTypes: ['application/json', 'application/x-sizewise'],
    requiredTier: 'free',
    maxFileSize: 10 * 1024 * 1024,
    features: ['project_import', 'data_validation'],
    processor: 'json'
  },
  {
    id: 'pdf',
    name: 'PDF Document',
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    requiredTier: 'pro',
    maxFileSize: 50 * 1024 * 1024,
    features: ['text_extraction', 'image_extraction'],
    processor: 'pdf'
  },
  {
    id: 'cad',
    name: 'CAD Files',
    extensions: ['.dwg', '.dxf'],
    mimeTypes: ['application/acad', 'application/dxf'],
    requiredTier: 'enterprise',
    maxFileSize: 100 * 1024 * 1024,
    features: ['geometry_import', 'layer_import', 'dimension_import'],
    processor: 'cad'
  }
];

export default {
  DEFAULT_FILE_MANAGER_CONFIG,
  EXPORT_FORMATS,
  IMPORT_FORMATS
};
