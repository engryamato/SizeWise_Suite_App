/**
 * FileManager Test Suite
 * 
 * CRITICAL: Validates native file operations and tier enforcement
 * Tests file dialogs, import/export functionality, and security measures
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 3.3
 */

import { FileManager, FileOperationResult, ImportOptions, ExportOptions } from '../FileManager';
import { TierEnforcer } from '../../../backend/services/enforcement/TierEnforcer';
import { FeatureManager } from '../../../backend/features/FeatureManager';
import { dialog, BrowserWindow } from 'electron';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';

// Mock Electron modules
jest.mock('electron', () => ({
  dialog: {
    showOpenDialog: jest.fn(),
    showSaveDialog: jest.fn()
  },
  app: {
    getPath: jest.fn(() => '/mock/documents')
  }
}));

// Mock file system
jest.mock('fs');
jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn(),
    digest: jest.fn(() => 'mock-checksum')
  })),
  createReadStream: jest.fn(() => ({
    on: jest.fn((event, callback) => {
      if (event === 'end') callback();
    })
  }))
}));

// Mock dependencies
jest.mock('../../../backend/services/enforcement/TierEnforcer');
jest.mock('../../../backend/features/FeatureManager');

describe('FileManager', () => {
  let fileManager: FileManager;
  let mockTierEnforcer: jest.Mocked<TierEnforcer>;
  let mockFeatureManager: jest.Mocked<FeatureManager>;
  let mockWindow: jest.Mocked<BrowserWindow>;
  let mockDialog: jest.Mocked<typeof dialog>;
  let mockFs: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock TierEnforcer
    mockTierEnforcer = {
      validateFileAccess: jest.fn().mockResolvedValue({ allowed: true }),
      validateExportAccess: jest.fn().mockResolvedValue({ allowed: true }),
      validateImportAccess: jest.fn().mockResolvedValue({ allowed: true })
    } as any;

    // Mock FeatureManager
    mockFeatureManager = {
      isEnabled: jest.fn().mockResolvedValue({ enabled: true }),
      getUserTier: jest.fn().mockResolvedValue('pro')
    } as any;

    // Mock BrowserWindow
    mockWindow = {} as any;

    // Mock dialog
    mockDialog = dialog as jest.Mocked<typeof dialog>;

    // Mock file system
    mockFs = {
      readFileSync: readFileSync as jest.MockedFunction<typeof readFileSync>,
      writeFileSync: writeFileSync as jest.MockedFunction<typeof writeFileSync>,
      existsSync: existsSync as jest.MockedFunction<typeof existsSync>,
      statSync: statSync as jest.MockedFunction<typeof statSync>
    };

    fileManager = new FileManager(mockTierEnforcer, mockFeatureManager);
  });

  describe('File Dialog Operations', () => {
    test('should show open dialog successfully', async () => {
      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/mock/path/test.sizewise']
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        size: 1024,
        birthtime: new Date(),
        mtime: new Date()
      } as any);

      const startTime = Date.now();
      const result = await fileManager.showOpenDialog(mockWindow, 'user123');
      const operationTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.filePath).toBe('/mock/path/test.sizewise');
      expect(result.metadata).toBeDefined();
      expect(operationTime).toBeLessThan(500); // Performance requirement
      expect(mockTierEnforcer.validateFileAccess).toHaveBeenCalledWith('user123', 'read');
    });

    test('should handle canceled open dialog', async () => {
      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: true,
        filePaths: []
      });

      const result = await fileManager.showOpenDialog(mockWindow, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('File selection canceled');
    });

    test('should enforce tier restrictions on file access', async () => {
      mockTierEnforcer.validateFileAccess.mockResolvedValue({
        allowed: false,
        reason: 'File access not allowed for free tier',
        requiredTier: 'pro'
      });

      const result = await fileManager.showOpenDialog(mockWindow, 'user123');

      expect(result.success).toBe(false);
      expect(result.tierRestriction?.restricted).toBe(true);
      expect(result.tierRestriction?.requiredTier).toBe('pro');
    });

    test('should show save dialog successfully', async () => {
      mockDialog.showSaveDialog.mockResolvedValue({
        canceled: false,
        filePath: '/mock/path/project.sizewise'
      });

      const startTime = Date.now();
      const result = await fileManager.showSaveDialog(mockWindow, 'user123', {
        format: 'json'
      });
      const operationTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.filePath).toBe('/mock/path/project.sizewise');
      expect(operationTime).toBeLessThan(500); // Performance requirement
      expect(mockTierEnforcer.validateExportAccess).toHaveBeenCalledWith('user123', 'json');
    });

    test('should enforce export format restrictions', async () => {
      mockTierEnforcer.validateExportAccess.mockResolvedValue({
        allowed: false,
        reason: 'PNG export requires Pro tier',
        requiredTier: 'pro'
      });

      const result = await fileManager.showSaveDialog(mockWindow, 'user123', {
        format: 'png'
      });

      expect(result.success).toBe(false);
      expect(result.tierRestriction?.restricted).toBe(true);
      expect(result.tierRestriction?.requiredTier).toBe('pro');
    });
  });

  describe('File Import Operations', () => {
    test('should import JSON project successfully', async () => {
      const mockProjectData = {
        version: '1.0.0',
        metadata: { name: 'Test Project' },
        data: { projects: [] }
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        size: 1024,
        birthtime: new Date(),
        mtime: new Date()
      } as any);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockProjectData));

      const options: ImportOptions = {
        userId: 'user123',
        validateTier: true,
        mergeMode: 'replace',
        preserveMetadata: true
      };

      const startTime = Date.now();
      const result = await fileManager.importProject('/mock/path/test.json', options);
      const operationTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProjectData);
      expect(operationTime).toBeLessThan(500); // Performance requirement
      expect(mockTierEnforcer.validateImportAccess).toHaveBeenCalled();
    });

    test('should handle non-existent file', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const options: ImportOptions = {
        userId: 'user123',
        validateTier: true,
        mergeMode: 'replace',
        preserveMetadata: true
      };

      const result = await fileManager.importProject('/mock/path/nonexistent.json', options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('File does not exist');
    });

    test('should enforce import tier restrictions', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        size: 1024,
        birthtime: new Date(),
        mtime: new Date()
      } as any);

      mockTierEnforcer.validateImportAccess.mockResolvedValue({
        allowed: false,
        reason: 'PDF import requires Pro tier',
        requiredTier: 'pro'
      });

      const options: ImportOptions = {
        userId: 'user123',
        validateTier: true,
        mergeMode: 'replace',
        preserveMetadata: true
      };

      const result = await fileManager.importProject('/mock/path/test.pdf', options);

      expect(result.success).toBe(false);
      expect(result.tierRestriction?.restricted).toBe(true);
      expect(result.tierRestriction?.requiredTier).toBe('pro');
    });

    test('should handle PDF import with tier validation', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        size: 1024,
        birthtime: new Date(),
        mtime: new Date()
      } as any);

      mockFeatureManager.isEnabled.mockResolvedValue({ enabled: true });

      const options: ImportOptions = {
        userId: 'user123',
        validateTier: true,
        mergeMode: 'replace',
        preserveMetadata: true
      };

      const result = await fileManager.importProject('/mock/path/test.pdf', options);

      expect(result.success).toBe(true);
      expect(result.data.type).toBe('pdf');
      expect(mockFeatureManager.isEnabled).toHaveBeenCalledWith('pdf_import', 'user123');
    });

    test('should reject PDF import for insufficient tier', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        size: 1024,
        birthtime: new Date(),
        mtime: new Date()
      } as any);

      mockFeatureManager.isEnabled.mockResolvedValue({ enabled: false });

      const options: ImportOptions = {
        userId: 'user123',
        validateTier: true,
        mergeMode: 'replace',
        preserveMetadata: true
      };

      await expect(fileManager.importProject('/mock/path/test.pdf', options))
        .rejects.toThrow('PDF import requires Pro tier or higher');
    });

    test('should handle CAD import with enterprise tier', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        size: 1024,
        birthtime: new Date(),
        mtime: new Date()
      } as any);

      mockFeatureManager.isEnabled.mockResolvedValue({ enabled: true });

      const options: ImportOptions = {
        userId: 'user123',
        validateTier: true,
        mergeMode: 'replace',
        preserveMetadata: true
      };

      const result = await fileManager.importProject('/mock/path/test.dwg', options);

      expect(result.success).toBe(true);
      expect(result.data.type).toBe('cad');
      expect(mockFeatureManager.isEnabled).toHaveBeenCalledWith('cad_import', 'user123');
    });
  });

  describe('File Export Operations', () => {
    test('should export JSON project successfully', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test description',
        data: { projects: [] }
      };

      const options: ExportOptions = {
        userId: 'user123',
        format: 'json',
        metadata: true
      };

      mockFs.statSync.mockReturnValue({
        size: 2048,
        birthtime: new Date(),
        mtime: new Date()
      } as any);

      const startTime = Date.now();
      const result = await fileManager.exportProject(
        projectData,
        '/mock/path/export.json',
        options
      );
      const operationTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.filePath).toBe('/mock/path/export.json');
      expect(operationTime).toBeLessThan(500); // Performance requirement
      expect(mockTierEnforcer.validateExportAccess).toHaveBeenCalledWith('user123', 'json');
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    test('should enforce export format restrictions', async () => {
      mockTierEnforcer.validateExportAccess.mockResolvedValue({
        allowed: false,
        reason: 'Excel export requires Pro tier',
        requiredTier: 'pro'
      });

      const options: ExportOptions = {
        userId: 'user123',
        format: 'excel'
      };

      const result = await fileManager.exportProject(
        {},
        '/mock/path/export.xlsx',
        options
      );

      expect(result.success).toBe(false);
      expect(result.tierRestriction?.restricted).toBe(true);
      expect(result.tierRestriction?.requiredTier).toBe('pro');
    });

    test('should handle unsupported export format', async () => {
      const options: ExportOptions = {
        userId: 'user123',
        format: 'unsupported'
      };

      const result = await fileManager.exportProject(
        {},
        '/mock/path/export.xyz',
        options
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported export format');
    });
  });

  describe('File Size Validation', () => {
    test('should validate file size for free tier', async () => {
      mockFeatureManager.getUserTier.mockResolvedValue('free');

      const fileSize = 5 * 1024 * 1024; // 5MB - within free tier limit
      const validation = await (fileManager as any).validateFileSize('user123', fileSize);

      expect(validation.allowed).toBe(true);
    });

    test('should reject oversized file for free tier', async () => {
      mockFeatureManager.getUserTier.mockResolvedValue('free');

      const fileSize = 15 * 1024 * 1024; // 15MB - exceeds free tier limit
      const validation = await (fileManager as any).validateFileSize('user123', fileSize);

      expect(validation.allowed).toBe(false);
      expect(validation.requiredTier).toBe('pro');
      expect(validation.reason).toContain('exceeds free tier limit');
    });

    test('should allow larger files for pro tier', async () => {
      mockFeatureManager.getUserTier.mockResolvedValue('pro');

      const fileSize = 50 * 1024 * 1024; // 50MB - within pro tier limit
      const validation = await (fileManager as any).validateFileSize('user123', fileSize);

      expect(validation.allowed).toBe(true);
    });

    test('should allow very large files for enterprise tier', async () => {
      mockFeatureManager.getUserTier.mockResolvedValue('enterprise');

      const fileSize = 500 * 1024 * 1024; // 500MB - within enterprise tier limit
      const validation = await (fileManager as any).validateFileSize('user123', fileSize);

      expect(validation.allowed).toBe(true);
    });
  });

  describe('File Metadata Operations', () => {
    test('should generate file metadata correctly', async () => {
      mockFs.statSync.mockReturnValue({
        size: 1024,
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-02')
      } as any);

      const metadata = await (fileManager as any).getFileMetadata('/mock/path/test.sizewise');

      expect(metadata.name).toBe('test.sizewise');
      expect(metadata.path).toBe('/mock/path/test.sizewise');
      expect(metadata.size).toBe(1024);
      expect(metadata.extension).toBe('.sizewise');
      expect(metadata.mimeType).toBe('application/x-sizewise');
      expect(metadata.checksum).toBe('mock-checksum');
    });

    test('should determine correct MIME types', () => {
      const mimeType1 = (fileManager as any).getMimeType('.json');
      const mimeType2 = (fileManager as any).getMimeType('.pdf');
      const mimeType3 = (fileManager as any).getMimeType('.unknown');

      expect(mimeType1).toBe('application/json');
      expect(mimeType2).toBe('application/pdf');
      expect(mimeType3).toBe('application/octet-stream');
    });
  });

  describe('Format Support', () => {
    test('should return supported formats', () => {
      const formats = fileManager.getSupportedFormats();

      expect(formats.project).toContain('.sizewise');
      expect(formats.project).toContain('.json');
      expect(formats.import).toContain('.pdf');
      expect(formats.export).toContain('.png');
    });

    test('should validate format support correctly', () => {
      const isSupported1 = fileManager.isFormatSupported('/test.sizewise', 'project');
      const isSupported2 = fileManager.isFormatSupported('/test.xyz', 'project');

      expect(isSupported1).toBe(true);
      expect(isSupported2).toBe(false);
    });

    test('should return file operation statistics', () => {
      const stats = fileManager.getFileStats();

      expect(stats.supportedFormats).toBeDefined();
      expect(stats.maxFileSizes).toBeDefined();
      expect(stats.features).toContain('native_file_dialogs');
      expect(stats.features).toContain('tier_based_restrictions');
    });
  });

  describe('Error Handling', () => {
    test('should handle dialog errors gracefully', async () => {
      mockDialog.showOpenDialog.mockRejectedValue(new Error('Dialog error'));

      const result = await fileManager.showOpenDialog(mockWindow, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Open dialog failed');
    });

    test('should handle file read errors gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        size: 1024,
        birthtime: new Date(),
        mtime: new Date()
      } as any);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const options: ImportOptions = {
        userId: 'user123',
        validateTier: true,
        mergeMode: 'replace',
        preserveMetadata: true
      };

      const result = await fileManager.importProject('/mock/path/test.json', options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Import failed');
    });

    test('should handle export errors gracefully', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      const options: ExportOptions = {
        userId: 'user123',
        format: 'json'
      };

      const result = await fileManager.exportProject(
        {},
        '/mock/path/export.json',
        options
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Export failed');
    });
  });

  describe('Performance Requirements', () => {
    test('should meet file operation performance requirements', async () => {
      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/mock/path/test.sizewise']
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        size: 1024,
        birthtime: new Date(),
        mtime: new Date()
      } as any);

      const startTime = Date.now();
      await fileManager.showOpenDialog(mockWindow, 'user123');
      const operationTime = Date.now() - startTime;

      expect(operationTime).toBeLessThan(500); // <500ms requirement
    });

    test('should handle batch operations efficiently', async () => {
      const operations = [
        fileManager.isFormatSupported('/test1.sizewise', 'project'),
        fileManager.isFormatSupported('/test2.json', 'project'),
        fileManager.isFormatSupported('/test3.pdf', 'import')
      ];

      const startTime = Date.now();
      await Promise.all(operations);
      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(100); // Batch operations should be fast
    });
  });
});
