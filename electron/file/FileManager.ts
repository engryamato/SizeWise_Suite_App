/**
 * FileManager - Native File Operations with Tier Enforcement
 * 
 * MISSION-CRITICAL: Native file operations with tier-based restrictions
 * Provides secure file handling, import/export capabilities, and PDF processing
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 3.3
 */

import { dialog, BrowserWindow, app } from 'electron';
import { readFileSync, writeFileSync, existsSync, statSync, createReadStream } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { createHash } from 'crypto';
import { TierEnforcer } from '../../backend/services/enforcement/TierEnforcer';
import { FeatureManager } from '../../backend/features/FeatureManager';

/**
 * Supported file formats
 */
export interface SupportedFormats {
  project: string[];
  import: string[];
  export: string[];
  images: string[];
}

/**
 * File operation result
 */
export interface FileOperationResult {
  success: boolean;
  filePath?: string;
  data?: any;
  error?: string;
  metadata?: FileMetadata;
  tierRestriction?: {
    restricted: boolean;
    reason?: string;
    requiredTier?: string;
  };
}

/**
 * File metadata
 */
export interface FileMetadata {
  name: string;
  path: string;
  size: number;
  extension: string;
  mimeType: string;
  created: Date;
  modified: Date;
  checksum: string;
}

/**
 * Project file structure
 */
export interface ProjectFile {
  version: string;
  metadata: {
    name: string;
    description: string;
    created: Date;
    modified: Date;
    author: string;
    tier: string;
  };
  data: {
    projects: any[];
    calculations: any[];
    settings: any;
  };
  signature?: string;
}

/**
 * Import options
 */
export interface ImportOptions {
  userId: string;
  validateTier: boolean;
  mergeMode: 'replace' | 'merge' | 'append';
  preserveMetadata: boolean;
}

/**
 * Export options
 */
export interface ExportOptions {
  userId: string;
  format: string;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  watermark?: boolean;
  compression?: boolean;
  metadata?: boolean;
}

/**
 * FileManager - Comprehensive file operations with tier enforcement
 * CRITICAL: Prevents unauthorized file access and enforces tier boundaries
 */
export class FileManager {
  private tierEnforcer: TierEnforcer;
  private featureManager: FeatureManager;
  private supportedFormats: SupportedFormats;

  constructor(tierEnforcer: TierEnforcer, featureManager: FeatureManager) {
    this.tierEnforcer = tierEnforcer;
    this.featureManager = featureManager;
    
    this.supportedFormats = {
      project: ['.sizewise', '.json'],
      import: ['.pdf', '.dwg', '.dxf', '.json', '.csv'],
      export: ['.pdf', '.json', '.png', '.jpg', '.excel', '.dwg', '.ifc'],
      images: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg']
    };
  }

  /**
   * Show open file dialog with tier restrictions
   */
  public async showOpenDialog(
    window: BrowserWindow,
    userId: string,
    options: {
      title?: string;
      defaultPath?: string;
      filters?: Electron.FileFilter[];
      properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
    } = {}
  ): Promise<FileOperationResult> {
    const startTime = Date.now();

    try {
      // Validate file access permission
      const accessValidation = await this.tierEnforcer.validateFileAccess(userId, 'read');
      if (!accessValidation.allowed) {
        return {
          success: false,
          error: 'File access not allowed for current tier',
          tierRestriction: {
            restricted: true,
            reason: accessValidation.reason,
            requiredTier: accessValidation.requiredTier
          }
        };
      }

      // Configure dialog options
      const dialogOptions: Electron.OpenDialogOptions = {
        title: options.title || 'Open File',
        defaultPath: options.defaultPath || app.getPath('documents'),
        properties: options.properties || ['openFile'],
        filters: options.filters || [
          { name: 'SizeWise Projects', extensions: ['sizewise', 'json'] },
          { name: 'PDF Files', extensions: ['pdf'] },
          { name: 'CAD Files', extensions: ['dwg', 'dxf'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      };

      // Show dialog
      const result = await dialog.showOpenDialog(window, dialogOptions);

      if (result.canceled || !result.filePaths.length) {
        return {
          success: false,
          error: 'File selection canceled'
        };
      }

      const filePath = result.filePaths[0];
      const metadata = await this.getFileMetadata(filePath);

      // Validate file size restrictions
      const sizeValidation = await this.validateFileSize(userId, metadata.size);
      if (!sizeValidation.allowed) {
        return {
          success: false,
          error: 'File size exceeds tier limit',
          tierRestriction: {
            restricted: true,
            reason: sizeValidation.reason,
            requiredTier: sizeValidation.requiredTier
          }
        };
      }

      const operationTime = Date.now() - startTime;
      if (operationTime > 500) {
        console.warn(`⚠️ File dialog took ${operationTime}ms (exceeds 500ms target)`);
      }

      return {
        success: true,
        filePath,
        metadata
      };

    } catch (error) {
      console.error('Open dialog failed:', error);
      return {
        success: false,
        error: `Open dialog failed: ${error.message}`
      };
    }
  }

  /**
   * Show save file dialog with tier restrictions
   */
  public async showSaveDialog(
    window: BrowserWindow,
    userId: string,
    options: {
      title?: string;
      defaultPath?: string;
      filters?: Electron.FileFilter[];
      format?: string;
    } = {}
  ): Promise<FileOperationResult> {
    const startTime = Date.now();

    try {
      // Validate export access
      const format = options.format || 'json';
      const exportValidation = await this.tierEnforcer.validateExportAccess(userId, format);
      if (!exportValidation.allowed) {
        return {
          success: false,
          error: 'Export format not allowed for current tier',
          tierRestriction: {
            restricted: true,
            reason: exportValidation.reason,
            requiredTier: exportValidation.requiredTier
          }
        };
      }

      // Configure dialog options
      const dialogOptions: Electron.SaveDialogOptions = {
        title: options.title || 'Save File',
        defaultPath: options.defaultPath || join(app.getPath('documents'), 'project.sizewise'),
        filters: options.filters || [
          { name: 'SizeWise Projects', extensions: ['sizewise'] },
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'PDF Files', extensions: ['pdf'] },
          { name: 'PNG Images', extensions: ['png'] },
          { name: 'Excel Files', extensions: ['xlsx'] }
        ]
      };

      // Show dialog
      const result = await dialog.showSaveDialog(window, dialogOptions);

      if (result.canceled || !result.filePath) {
        return {
          success: false,
          error: 'Save location not selected'
        };
      }

      const operationTime = Date.now() - startTime;
      if (operationTime > 500) {
        console.warn(`⚠️ Save dialog took ${operationTime}ms (exceeds 500ms target)`);
      }

      return {
        success: true,
        filePath: result.filePath
      };

    } catch (error) {
      console.error('Save dialog failed:', error);
      return {
        success: false,
        error: `Save dialog failed: ${error.message}`
      };
    }
  }

  /**
   * Import project file with tier validation
   */
  public async importProject(
    filePath: string,
    options: ImportOptions
  ): Promise<FileOperationResult> {
    const startTime = Date.now();

    try {
      // Validate file exists
      if (!existsSync(filePath)) {
        return {
          success: false,
          error: 'File does not exist'
        };
      }

      // Get file metadata
      const metadata = await this.getFileMetadata(filePath);

      // Validate import access
      if (options.validateTier) {
        const importValidation = await this.tierEnforcer.validateImportAccess(
          options.userId,
          metadata.extension,
          metadata.size
        );
        
        if (!importValidation.allowed) {
          return {
            success: false,
            error: 'Import not allowed for current tier',
            tierRestriction: {
              restricted: true,
              reason: importValidation.reason,
              requiredTier: importValidation.requiredTier
            }
          };
        }
      }

      // Read and parse file
      let data: any;
      const extension = metadata.extension.toLowerCase();

      switch (extension) {
        case '.sizewise':
        case '.json':
          data = await this.importJsonProject(filePath);
          break;
        case '.pdf':
          data = await this.importPdfFile(filePath, options.userId);
          break;
        case '.dwg':
        case '.dxf':
          data = await this.importCadFile(filePath, options.userId);
          break;
        default:
          return {
            success: false,
            error: `Unsupported file format: ${extension}`
          };
      }

      const operationTime = Date.now() - startTime;
      if (operationTime > 500) {
        console.warn(`⚠️ Import took ${operationTime}ms (exceeds 500ms target)`);
      }

      return {
        success: true,
        data,
        metadata
      };

    } catch (error) {
      console.error('Import failed:', error);
      return {
        success: false,
        error: `Import failed: ${error.message}`
      };
    }
  }

  /**
   * Export project with tier enforcement
   */
  public async exportProject(
    data: any,
    filePath: string,
    options: ExportOptions
  ): Promise<FileOperationResult> {
    const startTime = Date.now();

    try {
      // Validate export access
      const exportValidation = await this.tierEnforcer.validateExportAccess(
        options.userId,
        options.format
      );
      
      if (!exportValidation.allowed) {
        return {
          success: false,
          error: 'Export format not allowed for current tier',
          tierRestriction: {
            restricted: true,
            reason: exportValidation.reason,
            requiredTier: exportValidation.requiredTier
          }
        };
      }

      // Export based on format
      let exportData: Buffer | string;
      
      switch (options.format.toLowerCase()) {
        case 'json':
        case 'sizewise':
          exportData = await this.exportJsonProject(data, options);
          break;
        case 'pdf':
          exportData = await this.exportPdfProject(data, options);
          break;
        case 'png':
        case 'jpg':
          exportData = await this.exportImageProject(data, options);
          break;
        case 'excel':
          exportData = await this.exportExcelProject(data, options);
          break;
        default:
          return {
            success: false,
            error: `Unsupported export format: ${options.format}`
          };
      }

      // Write file
      writeFileSync(filePath, exportData);

      // Get exported file metadata
      const metadata = await this.getFileMetadata(filePath);

      const operationTime = Date.now() - startTime;
      if (operationTime > 500) {
        console.warn(`⚠️ Export took ${operationTime}ms (exceeds 500ms target)`);
      }

      return {
        success: true,
        filePath,
        metadata
      };

    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        error: `Export failed: ${error.message}`
      };
    }
  }

  /**
   * Get file metadata
   */
  private async getFileMetadata(filePath: string): Promise<FileMetadata> {
    const stats = statSync(filePath);
    const extension = extname(filePath);
    const name = basename(filePath);

    // Generate checksum
    const checksum = await this.generateFileChecksum(filePath);

    // Determine MIME type
    const mimeType = this.getMimeType(extension);

    return {
      name,
      path: filePath,
      size: stats.size,
      extension,
      mimeType,
      created: stats.birthtime,
      modified: stats.mtime,
      checksum
    };
  }

  /**
   * Generate file checksum
   */
  private async generateFileChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Get MIME type from extension
   */
  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.json': 'application/json',
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.dwg': 'application/acad',
      '.dxf': 'application/dxf',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.sizewise': 'application/x-sizewise'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Validate file size against tier limits
   */
  private async validateFileSize(userId: string, fileSize: number): Promise<{
    allowed: boolean;
    reason?: string;
    requiredTier?: string;
  }> {
    const userTier = await this.featureManager.getUserTier(userId);
    
    // File size limits by tier (in bytes)
    const sizeLimits = {
      free: 10 * 1024 * 1024,      // 10MB
      pro: 100 * 1024 * 1024,     // 100MB
      enterprise: 1024 * 1024 * 1024 // 1GB
    };

    const limit = sizeLimits[userTier] || sizeLimits.free;

    if (fileSize > limit) {
      const requiredTier = fileSize > sizeLimits.pro ? 'enterprise' : 'pro';
      return {
        allowed: false,
        reason: `File size ${Math.round(fileSize / 1024 / 1024)}MB exceeds ${userTier} tier limit of ${Math.round(limit / 1024 / 1024)}MB`,
        requiredTier
      };
    }

    return { allowed: true };
  }

  /**
   * Import JSON project file
   */
  private async importJsonProject(filePath: string): Promise<ProjectFile> {
    const content = readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // Validate project file structure
    if (!data.version || !data.metadata || !data.data) {
      throw new Error('Invalid project file format');
    }

    return data;
  }

  /**
   * Import PDF file (placeholder for PDF processing)
   */
  private async importPdfFile(filePath: string, userId: string): Promise<any> {
    // Validate PDF import access
    const pdfFeature = await this.featureManager.isEnabled('pdf_import', userId);
    if (!pdfFeature.enabled) {
      throw new Error('PDF import requires Pro tier or higher');
    }

    // Placeholder for PDF processing
    // In a real implementation, this would use a PDF library like pdf-parse
    return {
      type: 'pdf',
      path: filePath,
      pages: 1,
      text: 'PDF content extraction not implemented',
      metadata: await this.getFileMetadata(filePath)
    };
  }

  /**
   * Import CAD file (placeholder for CAD processing)
   */
  private async importCadFile(filePath: string, userId: string): Promise<any> {
    // Validate CAD import access
    const cadFeature = await this.featureManager.isEnabled('cad_import', userId);
    if (!cadFeature.enabled) {
      throw new Error('CAD import requires Enterprise tier');
    }

    // Placeholder for CAD processing
    return {
      type: 'cad',
      path: filePath,
      format: extname(filePath),
      entities: [],
      metadata: await this.getFileMetadata(filePath)
    };
  }

  /**
   * Export JSON project
   */
  private async exportJsonProject(data: any, options: ExportOptions): Promise<string> {
    const projectFile: ProjectFile = {
      version: '1.0.0',
      metadata: {
        name: data.name || 'Untitled Project',
        description: data.description || '',
        created: new Date(),
        modified: new Date(),
        author: data.author || 'Unknown',
        tier: await this.featureManager.getUserTier(options.userId)
      },
      data: data
    };

    return JSON.stringify(projectFile, null, 2);
  }

  /**
   * Export PDF project (placeholder)
   */
  private async exportPdfProject(data: any, options: ExportOptions): Promise<Buffer> {
    // Placeholder for PDF generation
    // In a real implementation, this would use a PDF library like PDFKit
    const content = `PDF Export - ${data.name || 'Project'}\nGenerated: ${new Date().toISOString()}`;
    return Buffer.from(content, 'utf8');
  }

  /**
   * Export image project (placeholder)
   */
  private async exportImageProject(data: any, options: ExportOptions): Promise<Buffer> {
    // Placeholder for image generation
    // In a real implementation, this would use a canvas library
    const content = `Image Export - ${data.name || 'Project'}`;
    return Buffer.from(content, 'utf8');
  }

  /**
   * Export Excel project (placeholder)
   */
  private async exportExcelProject(data: any, options: ExportOptions): Promise<Buffer> {
    // Placeholder for Excel generation
    // In a real implementation, this would use a library like ExcelJS
    const content = `Excel Export - ${data.name || 'Project'}`;
    return Buffer.from(content, 'utf8');
  }

  /**
   * Get supported file formats
   */
  public getSupportedFormats(): SupportedFormats {
    return { ...this.supportedFormats };
  }

  /**
   * Validate file format
   */
  public isFormatSupported(filePath: string, category: keyof SupportedFormats): boolean {
    const extension = extname(filePath).toLowerCase();
    return this.supportedFormats[category].includes(extension);
  }

  /**
   * Get file operation statistics
   */
  public getFileStats(): {
    supportedFormats: SupportedFormats;
    maxFileSizes: Record<string, number>;
    features: string[];
  } {
    return {
      supportedFormats: this.supportedFormats,
      maxFileSizes: {
        free: 10 * 1024 * 1024,
        pro: 100 * 1024 * 1024,
        enterprise: 1024 * 1024 * 1024
      },
      features: [
        'native_file_dialogs',
        'tier_based_restrictions',
        'pdf_import',
        'cad_import',
        'multi_format_export',
        'file_validation',
        'metadata_extraction'
      ]
    };
  }
}

export default FileManager;
