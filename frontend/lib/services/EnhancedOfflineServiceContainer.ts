/**
 * Enhanced Offline Service Container
 * 
 * Implements ChatGPT recommendations with comprehensive DataService integration.
 * Provides robust offline-first architecture with sync preparation.
 * 
 * @see docs/refactoring/component-architecture-specification.md
 */

import { createDataService, DataService } from '../data/DataService';
import { createExportService, createImportService, createBackupService } from '../data/ImportExportService';
import { createBrowserFeatureManager, BrowserFeatureManager } from '../features/BrowserFeatureManager';
import {
  CalculationInput,
  CalculationResult,
  ExportOptions,
  ExportResult,
  TierLimits
} from '../../types/air-duct-sizer';
import { Project } from '../repositories/interfaces/ProjectRepository';
import { User, UserTier } from '../repositories/interfaces/UserRepository';
import { SyncableUser, SyncableProject } from '../../types/sync-models';

/**
 * Enhanced service container interface with DataService integration
 */
export interface EnhancedOfflineServiceContainer {
  // Core services
  dataService: DataService;
  projectService: EnhancedProjectService;
  userService: EnhancedUserService;
  calculationService: EnhancedCalculationService;
  validationService: EnhancedValidationService;
  exportService: EnhancedExportService;
  tierService: EnhancedTierService;
  featureManager: BrowserFeatureManager;
  
  // New services from ChatGPT recommendations
  importService: any; // ImportService
  backupService: any; // BackupService
  syncService: EnhancedSyncService;
}

/**
 * Enhanced project service with DataService integration
 */
export class EnhancedProjectService {
  constructor(private dataService: DataService) {}

  async getProject(id: string): Promise<Project | null> {
    try {
      const syncableProject = await this.dataService.getProject(id);
      return syncableProject ? this.convertToLegacyProject(syncableProject) : null;
    } catch (error) {
      console.error('Failed to get project:', error);
      throw error;
    }
  }

  async saveProject(project: Project): Promise<void> {
    try {
      const syncableProject = this.convertToSyncableProject(project);
      await this.dataService.saveProject(syncableProject);
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    try {
      // Cast to any to avoid TypeScript issues with Partial<Project>
      const projectData = data as any;

      const newProject: Project = {
        id: projectData.id || this.generateUUID(),
        userId: projectData.userId || 'offline-user-001',
        project_name: projectData.project_name || 'New Project',
        project_number: projectData.project_number || this.generateProjectNumber(),
        project_description: projectData.project_description || '',
        project_location: projectData.project_location || '',
        client_name: projectData.client_name || '',
        estimator_name: projectData.estimator_name || '',
        date_created: projectData.date_created || new Date().toISOString(),
        last_modified: new Date().toISOString(),
        version: projectData.version || '1.0',
        rooms: projectData.rooms || [],
        segments: projectData.segments || [],
        equipment: projectData.equipment || [],
        computational_properties: projectData.computational_properties || {
          units: 'Imperial',
          default_duct_size: { width: 12, height: 8 },
          default_material: 'Galvanized Steel',
          default_insulation: 'None',
          default_fitting: 'Standard',
          calibration_mode: 'Auto',
          default_velocity: 1000,
          pressure_class: "2",
          altitude: 0,
          friction_rate: 0.1
        },
        code_standards: projectData.code_standards || {
          smacna: true,
          ashrae: true,
          ul: false,
          imc: false,
          nfpa: false
        }
      };

      await this.saveProject(newProject);
      return newProject;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      await this.dataService.deleteProject(id);
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  async listProjects(userId: string): Promise<Project[]> {
    try {
      const syncableProjects = await this.dataService.listProjectsByUser(userId);
      return syncableProjects.map(p => this.convertToLegacyProject(p));
    } catch (error) {
      console.error('Failed to list projects:', error);
      throw error;
    }
  }

  async searchProjects(query: string, userId?: string): Promise<Project[]> {
    try {
      const syncableProjects = await this.dataService.searchProjects(query, userId);
      return syncableProjects.map(p => this.convertToLegacyProject(p));
    } catch (error) {
      console.error('Failed to search projects:', error);
      throw error;
    }
  }

  private convertToLegacyProject(syncableProject: SyncableProject): Project {
    // Convert SyncableProject to legacy Project format
    return {
      id: syncableProject.id,
      userId: syncableProject.userId,
      project_name: syncableProject.project_name,
      project_number: syncableProject.project_number,
      project_description: syncableProject.project_description,
      project_location: syncableProject.project_location,
      client_name: syncableProject.client_name,
      estimator_name: syncableProject.estimator_name,
      date_created: syncableProject.date_created,
      last_modified: syncableProject.last_modified,
      version: syncableProject.version,
      rooms: syncableProject.rooms,
      segments: syncableProject.segments,
      equipment: syncableProject.equipment,
      computational_properties: syncableProject.computational_properties,
      code_standards: syncableProject.code_standards
    };
  }

  private convertToSyncableProject(project: Project): SyncableProject {
    // Convert legacy Project to SyncableProject format
    return {
      ...project,
      sync: {
        version: 1,
        lastModified: new Date(),
        lastModifiedBy: project.userId,
        syncStatus: 'local',
        changeLog: [],
        isDeleted: false
      },
      collaboration: {
        sharing: {
          isShared: false,
          sharedWith: [],
          permissions: {}
        },
        comments: [],
        lock: {
          isLocked: false
        }
      },
      offline: {
        backup: {
          autoBackup: true
        },
        exports: []
      }
    };
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private generateProjectNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    return `PRJ-${timestamp}`;
  }
}

/**
 * Enhanced user service with DataService integration
 */
export class EnhancedUserService {
  constructor(private dataService: DataService) {}

  async getCurrentUser(): Promise<User | null> {
    try {
      const syncableUser = await this.dataService.getCurrentUser();
      return syncableUser ? this.convertToLegacyUser(syncableUser) : null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const syncableUser = await this.dataService.getUser(id);
      return syncableUser ? this.convertToLegacyUser(syncableUser) : null;
    } catch (error) {
      console.error('Failed to get user:', error);
      throw error;
    }
  }

  async updateUser(user: User): Promise<void> {
    try {
      const syncableUser = this.convertToSyncableUser(user);
      await this.dataService.saveUser(syncableUser);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  private convertToLegacyUser(syncableUser: SyncableUser): User {
    return {
      id: syncableUser.id,
      email: syncableUser.email,
      name: syncableUser.name,
      tier: syncableUser.tier,
      company: syncableUser.company,
      licenseKey: syncableUser.licenseKey,
      createdAt: syncableUser.createdAt,
      updatedAt: syncableUser.updatedAt
    };
  }

  private convertToSyncableUser(user: User): SyncableUser {
    // Map super_admin to enterprise for SyncableUser compatibility
    const syncTier = user.tier === 'super_admin' ? 'enterprise' : user.tier as 'free' | 'pro' | 'enterprise';

    return {
      ...user,
      name: user.name || 'Unknown User', // Ensure name is always a string
      tier: syncTier, // Use mapped tier
      settings: {}, // Add default empty settings
      sync: {
        version: 1,
        lastModified: new Date(),
        lastModifiedBy: user.id,
        syncStatus: 'local',
        changeLog: [],
        isDeleted: false
      },
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
  }
}

/**
 * Enhanced calculation service
 * TODO: Implement calculation service without backend dependencies
 */
export class EnhancedCalculationService {
  // private calculator: AirDuctCalculator;

  constructor() {
    // this.calculator = new AirDuctCalculator();
  }

  async calculateDuctSizing(inputs: CalculationInput): Promise<CalculationResult> {
    try {
      // TODO: Implement actual calculation logic
      return {
        success: false,
        input_data: inputs,
        warnings: ['Calculation service not yet implemented'],
        errors: ['Calculation service is under development']
      };
    } catch (error) {
      console.error('Failed to calculate duct sizing:', error);
      throw error;
    }
  }

  async validateResults(results: CalculationResult): Promise<any> {
    try {
      return {
        valid: results.success,
        warnings: results.warnings || [],
        errors: results.success ? [] : ['Calculation failed']
      };
    } catch (error) {
      console.error('Failed to validate results:', error);
      throw error;
    }
  }

  async getCalculationHistory(projectId: string): Promise<CalculationResult[]> {
    try {
      // Future enhancement: store calculation history
      return [];
    } catch (error) {
      console.error('Failed to get calculation history:', error);
      throw error;
    }
  }
}

/**
 * Enhanced validation service
 * TODO: Implement validation service without backend dependencies
 */
export class EnhancedValidationService {
  // private smacnaValidator: SMACNAValidator;

  constructor() {
    // this.smacnaValidator = new SMACNAValidator();
  }

  async validateProject(project: Project): Promise<any> {
    try {
      const errors = [];
      const warnings = [];

      if (!project.project_name?.trim()) {
        errors.push('Project name is required');
      }

      if (project.rooms.length === 0) {
        warnings.push('Project has no rooms defined');
      }

      if (project.segments.length === 0) {
        warnings.push('Project has no duct segments defined');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error('Failed to validate project:', error);
      throw error;
    }
  }
}

/**
 * Enhanced export service with DataService integration
 */
export class EnhancedExportService {
  private exportService = createExportService();

  constructor(private dataService: DataService) {}

  async exportProject(projectId: string, options: ExportOptions): Promise<ExportResult> {
    try {
      const project = await this.dataService.getProject(projectId);
      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      // Map export format to DataService format
      const dataServiceFormat = options.format === 'excel' ? 'xlsx' :
                                options.format === 'bom' ? 'csv' :
                                options.format as 'pdf' | 'json';

      const result = await this.exportService.exportEntity('project', project, dataServiceFormat);

      // Convert DataService ExportResult to air-duct-sizer ExportResult
      return {
        success: result.success,
        exportId: crypto.randomUUID(), // Generate missing exportId
        downloadUrl: result.downloadUrl,
        error: result.error
      };
    } catch (error) {
      console.error('Failed to export project:', error);
      throw error;
    }
  }

  async getExportStatus(exportId: string): Promise<ExportResult> {
    try {
      return {
        success: true,
        exportId: exportId,
        downloadUrl: `/api/exports/${exportId}/download`
      };
    } catch (error) {
      console.error('Failed to get export status:', error);
      throw error;
    }
  }

  async downloadExport(exportId: string): Promise<Blob> {
    try {
      return new Blob(['Mock export content'], { type: 'application/pdf' });
    } catch (error) {
      console.error('Failed to download export:', error);
      throw error;
    }
  }
}

/**
 * Enhanced tier service
 */
export class EnhancedTierService {
  constructor(private dataService: DataService) {}

  async getCurrentTier(): Promise<UserTier> {
    try {
      const user = await this.dataService.getCurrentUser();
      return user?.tier || 'free';
    } catch (error) {
      console.error('Failed to get current tier:', error);
      return 'free';
    }
  }

  async hasFeatureAccess(feature: string): Promise<boolean> {
    try {
      const user = await this.dataService.getCurrentUser();
      const flag = await this.dataService.getFeatureFlag(feature, user?.id);
      return flag?.enabled || false;
    } catch (error) {
      console.error('Failed to check feature access:', error);
      return false;
    }
  }

  async getTierLimits(): Promise<TierLimits> {
    try {
      const tier = await this.getCurrentTier();
      
      const limits: Record<UserTier, TierLimits> = {
        free: {
          maxRooms: 5,
          maxSegments: 10,
          maxProjects: 3,
          canEditComputationalProperties: false,
          canExportWithoutWatermark: false,
          canUseSimulation: false,
          canUseCatalog: false
        },
        pro: {
          maxRooms: 50,
          maxSegments: 100,
          maxProjects: -1,
          canEditComputationalProperties: true,
          canExportWithoutWatermark: true,
          canUseSimulation: true,
          canUseCatalog: true
        },
        enterprise: {
          maxRooms: -1,
          maxSegments: -1,
          maxProjects: -1,
          canEditComputationalProperties: true,
          canExportWithoutWatermark: true,
          canUseSimulation: true,
          canUseCatalog: true
        },
        super_admin: {
          maxRooms: -1,
          maxSegments: -1,
          maxProjects: -1,
          canEditComputationalProperties: true,
          canExportWithoutWatermark: true,
          canUseSimulation: true,
          canUseCatalog: true
        }
      };

      return limits[tier];
    } catch (error) {
      console.error('Failed to get tier limits:', error);
      return {
        maxRooms: 5,
        maxSegments: 10,
        maxProjects: 3,
        canEditComputationalProperties: false,
        canExportWithoutWatermark: false,
        canUseSimulation: false,
        canUseCatalog: false
      };
    }
  }

  async upgradeTier(newTier: UserTier): Promise<void> {
    try {
      const user = await this.dataService.getCurrentUser();
      if (user) {
        // Map super_admin to enterprise for SyncableUser compatibility
        const syncTier = newTier === 'super_admin' ? 'enterprise' : newTier as 'free' | 'pro' | 'enterprise';

        const syncableUser = {
          ...user,
          name: user.name || 'Unknown User', // Ensure name is always a string
          tier: syncTier,
          settings: {}, // Add default empty settings
          updatedAt: new Date(),
          sync: {
            version: 1,
            lastModified: new Date(),
            lastModifiedBy: user.id,
            syncStatus: 'local' as const,
            changeLog: [],
            isDeleted: false
          },
          offline: {
            preferences: {
              autoSave: true,
              backupFrequency: 'weekly' as const,
              exportFormat: 'json' as const
            },
            licenseValidation: {
              isValid: true,
              features: ['air_duct_sizer', 'project_management', 'basic_export']
            }
          }
        };
        await this.dataService.saveUser(syncableUser);
      }
    } catch (error) {
      console.error('Failed to upgrade tier:', error);
      throw error;
    }
  }
}

/**
 * Enhanced sync service for future online mode
 */
export class EnhancedSyncService {
  constructor(private dataService: DataService) {}

  async getPendingOperations() {
    return await this.dataService.getPendingSyncOperations();
  }

  async getConnectionStatus() {
    return this.dataService.getConnectionStatus();
  }

  async forceSyncAll() {
    return await this.dataService.forceSyncAll();
  }

  async getSyncStatistics() {
    return await this.dataService.getSyncStatistics();
  }
}

/**
 * Create enhanced offline service container
 */
export async function createEnhancedOfflineServiceContainer(): Promise<EnhancedOfflineServiceContainer> {
  // Initialize DataService
  const dataService = await createDataService('local');
  await dataService.initialize();

  // Create services
  const projectService = new EnhancedProjectService(dataService);
  const userService = new EnhancedUserService(dataService);
  const calculationService = new EnhancedCalculationService();
  const validationService = new EnhancedValidationService();
  const exportService = new EnhancedExportService(dataService);
  const tierService = new EnhancedTierService(dataService);
  const syncService = new EnhancedSyncService(dataService);

  // Create import/export services
  const importService = createImportService();
  const backupService = createBackupService();

  // Create feature manager
  const featureManager = createBrowserFeatureManager(dataService);

  return {
    dataService,
    projectService,
    userService,
    calculationService,
    validationService,
    exportService,
    tierService,
    featureManager,
    importService,
    backupService,
    syncService
  };
}
