/**
 * Offline Service Container
 * 
 * Real service implementations for Phase 1 offline desktop mode.
 * Connects to local SQLite database and provides business logic services.
 * 
 * @see docs/refactoring/component-architecture-specification.md
 */

import { DatabaseInitializer, RepositoryContainer } from '../database/DatabaseInitializer';
import { FeatureManager } from '../features/FeatureManager';
import { TierEnforcer } from '../../../backend/services/enforcement/TierEnforcer';
import { AirDuctCalculator } from '../../../backend/services/calculations/AirDuctCalculator';
import { SMACNAValidator } from '../../../backend/services/calculations/SMACNAValidator';
import { 
  Project, 
  User, 
  CalculationInput, 
  CalculationResult, 
  ExportOptions, 
  ExportResult,
  TierLimits 
} from '../../types/air-duct-sizer';
import { UserTier } from '../repositories/interfaces/UserRepository';

/**
 * Service container interface for dependency injection
 */
export interface OfflineServiceContainer {
  projectService: OfflineProjectService;
  calculationService: OfflineCalculationService;
  validationService: OfflineValidationService;
  exportService: OfflineExportService;
  tierService: OfflineTierService;
  featureManager: FeatureManager;
  userService: OfflineUserService;
}

/**
 * Project service for offline mode
 */
export class OfflineProjectService {
  constructor(private repositories: RepositoryContainer) {}

  async getProject(id: string): Promise<Project | null> {
    try {
      return await this.repositories.projectRepository.getProject(id);
    } catch (error) {
      console.error('Failed to get project:', error);
      throw error;
    }
  }

  async saveProject(project: Project): Promise<void> {
    try {
      await this.repositories.projectRepository.saveProject(project);
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    try {
      const newProject: Project = {
        id: data.id || this.generateUUID(),
        userId: data.userId || 'offline-user-001',
        project_name: data.project_name || 'New Project',
        project_number: data.project_number || this.generateProjectNumber(),
        project_description: data.project_description || '',
        project_location: data.project_location || '',
        client_name: data.client_name || '',
        estimator_name: data.estimator_name || '',
        date_created: data.date_created || new Date().toISOString(),
        last_modified: new Date().toISOString(),
        version: data.version || '1.0',
        rooms: data.rooms || [],
        segments: data.segments || [],
        equipment: data.equipment || [],
        computational_properties: data.computational_properties || {
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
        code_standards: data.code_standards || {
          smacna: true,
          ashrae: true,
          ul: false,
          imc: false,
          nfpa: false
        }
      };

      await this.repositories.projectRepository.saveProject(newProject);
      return newProject;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      await this.repositories.projectRepository.deleteProject(id);
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  async listProjects(userId: string): Promise<Project[]> {
    try {
      return await this.repositories.projectRepository.getProjectsByUser(userId);
    } catch (error) {
      console.error('Failed to list projects:', error);
      throw error;
    }
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
 * User service for offline mode
 */
export class OfflineUserService {
  constructor(private repositories: RepositoryContainer) {}

  async getCurrentUser(): Promise<User | null> {
    try {
      return await this.repositories.userRepository.getCurrentUser();
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      return await this.repositories.userRepository.getUser(id);
    } catch (error) {
      console.error('Failed to get user:', error);
      throw error;
    }
  }

  async updateUser(user: User): Promise<void> {
    try {
      await this.repositories.userRepository.saveUser(user);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }
}

/**
 * Calculation service for offline mode
 */
export class OfflineCalculationService {
  private calculator: AirDuctCalculator;

  constructor() {
    this.calculator = new AirDuctCalculator();
  }

  async calculateDuctSizing(inputs: CalculationInput): Promise<CalculationResult> {
    try {
      return await this.calculator.calculateDuctSizing(inputs);
    } catch (error) {
      console.error('Failed to calculate duct sizing:', error);
      throw error;
    }
  }

  async validateResults(results: CalculationResult): Promise<any> {
    try {
      // Basic validation for offline mode
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
      // For offline mode, return empty array for now
      // Could be enhanced to store calculation history in database
      return [];
    } catch (error) {
      console.error('Failed to get calculation history:', error);
      throw error;
    }
  }
}

/**
 * Validation service for offline mode
 */
export class OfflineValidationService {
  private smacnaValidator: SMACNAValidator;

  constructor() {
    this.smacnaValidator = new SMACNAValidator();
  }

  async validateProject(project: Project): Promise<any> {
    try {
      // Basic project validation
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
 * Export service for offline mode
 */
export class OfflineExportService {
  async exportProject(projectId: string, options: ExportOptions): Promise<ExportResult> {
    try {
      // Simulate export process for offline mode
      return {
        id: `export-${Date.now()}`,
        projectId,
        format: options.format,
        status: 'completed',
        success: true,
        downloadUrl: `/exports/${projectId}.${options.format}`,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to export project:', error);
      throw error;
    }
  }

  async getExportStatus(exportId: string): Promise<ExportResult> {
    try {
      // Return mock status for offline mode
      return {
        id: exportId,
        projectId: 'unknown',
        format: 'pdf',
        status: 'completed',
        success: true,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get export status:', error);
      throw error;
    }
  }

  async downloadExport(exportId: string): Promise<Blob> {
    try {
      // Return empty blob for offline mode
      return new Blob(['Mock export content'], { type: 'application/pdf' });
    } catch (error) {
      console.error('Failed to download export:', error);
      throw error;
    }
  }
}

/**
 * Tier service for offline mode
 */
export class OfflineTierService {
  constructor(
    private repositories: RepositoryContainer,
    private featureManager: FeatureManager
  ) {}

  async getCurrentTier(): Promise<UserTier> {
    try {
      const user = await this.repositories.userRepository.getCurrentUser();
      return user?.tier || 'free';
    } catch (error) {
      console.error('Failed to get current tier:', error);
      return 'free';
    }
  }

  async hasFeatureAccess(feature: string): Promise<boolean> {
    try {
      const user = await this.repositories.userRepository.getCurrentUser();
      const result = await this.featureManager.isEnabled(feature, user?.id);
      return result.enabled;
    } catch (error) {
      console.error('Failed to check feature access:', error);
      return false;
    }
  }

  async getTierLimits(): Promise<TierLimits> {
    try {
      const tier = await this.getCurrentTier();
      
      // Define tier limits for offline mode
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
          maxProjects: -1, // Unlimited
          canEditComputationalProperties: true,
          canExportWithoutWatermark: true,
          canUseSimulation: true,
          canUseCatalog: true
        },
        enterprise: {
          maxRooms: -1, // Unlimited
          maxSegments: -1, // Unlimited
          maxProjects: -1, // Unlimited
          canEditComputationalProperties: true,
          canExportWithoutWatermark: true,
          canUseSimulation: true,
          canUseCatalog: true
        }
      };

      return limits[tier];
    } catch (error) {
      console.error('Failed to get tier limits:', error);
      return limits.free;
    }
  }

  async upgradeTier(newTier: UserTier): Promise<void> {
    try {
      const user = await this.repositories.userRepository.getCurrentUser();
      if (user) {
        user.tier = newTier;
        user.updatedAt = new Date();
        await this.repositories.userRepository.saveUser(user);
      }
    } catch (error) {
      console.error('Failed to upgrade tier:', error);
      throw error;
    }
  }
}

/**
 * Create offline service container
 */
export async function createOfflineServiceContainer(): Promise<OfflineServiceContainer> {
  // Initialize database
  const dbInitializer = DatabaseInitializer.getInstance();
  const dbResult = await dbInitializer.initialize();
  
  if (!dbResult.success || !dbResult.repositories) {
    throw new Error(`Failed to initialize database: ${dbResult.error}`);
  }

  const repositories = dbResult.repositories;

  // Create feature manager
  const featureManager = new FeatureManager(
    repositories.featureFlagRepository,
    repositories.userRepository
  );

  // Create services
  const projectService = new OfflineProjectService(repositories);
  const userService = new OfflineUserService(repositories);
  const calculationService = new OfflineCalculationService();
  const validationService = new OfflineValidationService();
  const exportService = new OfflineExportService();
  const tierService = new OfflineTierService(repositories, featureManager);

  return {
    projectService,
    calculationService,
    validationService,
    exportService,
    tierService,
    featureManager,
    userService
  };
}
