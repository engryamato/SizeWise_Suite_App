/**
 * TierEnforcer - Business Logic Tier Enforcement Engine
 * 
 * MISSION-CRITICAL: Service layer for tier-based business logic enforcement
 * Complements UI tier enforcement with server-side validation and limits
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 2.5
 */

import { FeatureManager } from '../../features/FeatureManager';
import { DatabaseManager } from '../../database/DatabaseManager';
import AirDuctCalculator, { DuctSizingInputs, DuctSizingResults } from '../calculations/AirDuctCalculator';
import SMACNAValidator, { CalculationData, ValidationResult } from '../calculations/SMACNAValidator';

/**
 * User tier type
 */
export type UserTier = 'free' | 'pro' | 'enterprise';

/**
 * Project data structure
 */
export interface ProjectData {
  id: string;
  name: string;
  userId: string;
  segments: any[];
  rooms: any[];
  equipment: any[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Export format configuration
 */
export interface ExportFormat {
  id: string;
  name: string;
  description: string;
  requiredTier: UserTier;
  featureName: string;
  maxResolution?: number;
  maxFileSize?: number; // MB
  watermarked?: boolean;
}

/**
 * Calculation complexity assessment
 */
export interface CalculationComplexity {
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  score: number; // 0-100
  factors: {
    segmentCount: number;
    roomCount: number;
    equipmentCount: number;
    customMaterials: number;
    advancedFeatures: number;
  };
  requiredTier: UserTier;
}

/**
 * Enforcement result
 */
export interface EnforcementResult {
  allowed: boolean;
  reason?: string;
  currentTier: UserTier;
  requiredTier?: UserTier;
  upgradeMessage?: string;
  limitations?: string[];
  recommendations?: string[];
}

/**
 * Project limits by tier
 */
interface TierLimits {
  maxProjects: number;
  maxSegmentsPerProject: number;
  maxRoomsPerProject: number;
  maxEquipmentPerProject: number;
  maxCalculationComplexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
  allowedExportFormats: string[];
  maxExportResolution: number;
  watermarkedExports: boolean;
  advancedFeatures: string[];
}

/**
 * TierEnforcer - Business logic enforcement for tier boundaries
 * CRITICAL: Provides server-side validation to prevent tier circumvention
 */
export class TierEnforcer {
  private featureManager: FeatureManager;
  private dbManager: DatabaseManager;

  // Tier limits configuration
  private static readonly TIER_LIMITS: Record<UserTier, TierLimits> = {
    free: {
      maxProjects: 3,
      maxSegmentsPerProject: 10,
      maxRoomsPerProject: 5,
      maxEquipmentPerProject: 3,
      maxCalculationComplexity: 'basic',
      allowedExportFormats: ['pdf', 'json'],
      maxExportResolution: 1080,
      watermarkedExports: true,
      advancedFeatures: []
    },
    pro: {
      maxProjects: -1, // Unlimited
      maxSegmentsPerProject: 100,
      maxRoomsPerProject: 50,
      maxEquipmentPerProject: 25,
      maxCalculationComplexity: 'advanced',
      allowedExportFormats: ['pdf', 'json', 'png', 'excel'],
      maxExportResolution: 4320, // 4K
      watermarkedExports: false,
      advancedFeatures: ['unlimited_segments', 'equipment_selection', 'high_res_pdf_export', 'enhanced_csv_export']
    },
    enterprise: {
      maxProjects: -1, // Unlimited
      maxSegmentsPerProject: -1, // Unlimited
      maxRoomsPerProject: -1, // Unlimited
      maxEquipmentPerProject: -1, // Unlimited
      maxCalculationComplexity: 'expert',
      allowedExportFormats: ['pdf', 'json', 'png', 'excel', 'dwg', 'ifc'],
      maxExportResolution: 8640, // 8K
      watermarkedExports: false,
      advancedFeatures: ['unlimited_segments', 'equipment_selection', 'high_res_pdf_export', 'enhanced_csv_export', 'cad_export', 'api_access', 'bulk_operations']
    }
  };

  // Export format definitions
  private static readonly EXPORT_FORMATS: Record<string, ExportFormat> = {
    pdf: {
      id: 'pdf',
      name: 'PDF Report',
      description: 'Complete project report with BOM and schedules',
      requiredTier: 'free',
      featureName: 'air_duct_sizer'
    },
    json: {
      id: 'json',
      name: 'JSON Data',
      description: 'Project data for backup or sharing',
      requiredTier: 'free',
      featureName: 'air_duct_sizer'
    },
    png: {
      id: 'png',
      name: 'PNG Image',
      description: 'High-resolution drawing export',
      requiredTier: 'pro',
      featureName: 'high_res_pdf_export',
      maxResolution: 4320
    },
    excel: {
      id: 'excel',
      name: 'Excel Spreadsheet',
      description: 'BOM and schedules in spreadsheet format',
      requiredTier: 'pro',
      featureName: 'enhanced_csv_export'
    },
    dwg: {
      id: 'dwg',
      name: 'AutoCAD Drawing',
      description: 'CAD-compatible drawing file',
      requiredTier: 'enterprise',
      featureName: 'cad_export'
    },
    ifc: {
      id: 'ifc',
      name: 'IFC Model',
      description: 'Building Information Model format',
      requiredTier: 'enterprise',
      featureName: 'cad_export'
    }
  };

  constructor(featureManager: FeatureManager, dbManager: DatabaseManager) {
    this.featureManager = featureManager;
    this.dbManager = dbManager;
  }

  /**
   * Validate project creation limits
   */
  public async validateProjectCreation(userId: string): Promise<EnforcementResult> {
    try {
      // Get user tier
      const userTier = await this.getUserTier(userId);
      const limits = TierEnforcer.TIER_LIMITS[userTier];

      // Check if unlimited projects allowed
      if (limits.maxProjects === -1) {
        return {
          allowed: true,
          currentTier: userTier
        };
      }

      // Count existing projects
      const projectCount = await this.getUserProjectCount(userId);

      if (projectCount >= limits.maxProjects) {
        return {
          allowed: false,
          reason: `Project limit reached (${projectCount}/${limits.maxProjects})`,
          currentTier: userTier,
          requiredTier: 'pro',
          upgradeMessage: `Upgrade to Pro for unlimited projects`,
          limitations: [`Free tier limited to ${limits.maxProjects} projects`]
        };
      }

      return {
        allowed: true,
        currentTier: userTier,
        limitations: [`${projectCount + 1}/${limits.maxProjects} projects used`]
      };

    } catch (error) {
      return {
        allowed: false,
        reason: `Validation error: ${error.message}`,
        currentTier: 'free'
      };
    }
  }

  /**
   * Validate project content limits (segments, rooms, equipment)
   */
  public async validateProjectContent(userId: string, projectData: Partial<ProjectData>): Promise<EnforcementResult> {
    try {
      const userTier = await this.getUserTier(userId);
      const limits = TierEnforcer.TIER_LIMITS[userTier];

      const violations: string[] = [];
      const limitations: string[] = [];

      // Check segment count
      const segmentCount = projectData.segments?.length || 0;
      if (limits.maxSegmentsPerProject !== -1 && segmentCount > limits.maxSegmentsPerProject) {
        violations.push(`Too many segments (${segmentCount}/${limits.maxSegmentsPerProject})`);
      } else if (limits.maxSegmentsPerProject !== -1) {
        limitations.push(`${segmentCount}/${limits.maxSegmentsPerProject} segments used`);
      }

      // Check room count
      const roomCount = projectData.rooms?.length || 0;
      if (limits.maxRoomsPerProject !== -1 && roomCount > limits.maxRoomsPerProject) {
        violations.push(`Too many rooms (${roomCount}/${limits.maxRoomsPerProject})`);
      } else if (limits.maxRoomsPerProject !== -1) {
        limitations.push(`${roomCount}/${limits.maxRoomsPerProject} rooms used`);
      }

      // Check equipment count
      const equipmentCount = projectData.equipment?.length || 0;
      if (limits.maxEquipmentPerProject !== -1 && equipmentCount > limits.maxEquipmentPerProject) {
        violations.push(`Too many equipment items (${equipmentCount}/${limits.maxEquipmentPerProject})`);
      } else if (limits.maxEquipmentPerProject !== -1) {
        limitations.push(`${equipmentCount}/${limits.maxEquipmentPerProject} equipment items used`);
      }

      if (violations.length > 0) {
        return {
          allowed: false,
          reason: violations.join(', '),
          currentTier: userTier,
          requiredTier: userTier === 'free' ? 'pro' : 'enterprise',
          upgradeMessage: `Upgrade to ${userTier === 'free' ? 'Pro' : 'Enterprise'} for higher limits`,
          limitations: violations
        };
      }

      return {
        allowed: true,
        currentTier: userTier,
        limitations
      };

    } catch (error) {
      return {
        allowed: false,
        reason: `Validation error: ${error.message}`,
        currentTier: 'free'
      };
    }
  }

  /**
   * Validate export access and format
   */
  public async validateExportAccess(userId: string, formatId: string, resolution?: number): Promise<EnforcementResult> {
    try {
      const userTier = await this.getUserTier(userId);
      const limits = TierEnforcer.TIER_LIMITS[userTier];
      const format = TierEnforcer.EXPORT_FORMATS[formatId];

      if (!format) {
        return {
          allowed: false,
          reason: `Unknown export format: ${formatId}`,
          currentTier: userTier
        };
      }

      // Check if format is allowed for user tier
      if (!limits.allowedExportFormats.includes(formatId)) {
        return {
          allowed: false,
          reason: `Export format '${format.name}' requires ${format.requiredTier} tier`,
          currentTier: userTier,
          requiredTier: format.requiredTier,
          upgradeMessage: `Upgrade to ${format.requiredTier} for ${format.name} export`,
          limitations: [`Available formats: ${limits.allowedExportFormats.join(', ')}`]
        };
      }

      // Check resolution limits
      if (resolution && resolution > limits.maxExportResolution) {
        // Determine required tier based on resolution
        let requiredTier: UserTier = 'free';
        if (resolution > 4320) {
          requiredTier = 'enterprise';
        } else if (resolution > 1080) {
          requiredTier = 'pro';
        }

        return {
          allowed: false,
          reason: `Resolution ${resolution}p exceeds tier limit of ${limits.maxExportResolution}p`,
          currentTier: userTier,
          requiredTier,
          upgradeMessage: `Upgrade for higher resolution exports`,
          limitations: [`Maximum resolution: ${limits.maxExportResolution}p`]
        };
      }

      // Check feature flag
      const featureEnabled = await this.featureManager.isEnabled(format.featureName, userId);
      if (!featureEnabled.enabled) {
        return {
          allowed: false,
          reason: `Feature '${format.featureName}' not enabled for user`,
          currentTier: userTier,
          requiredTier: format.requiredTier
        };
      }

      return {
        allowed: true,
        currentTier: userTier,
        limitations: limits.watermarkedExports ? ['Exports will include watermark'] : []
      };

    } catch (error) {
      return {
        allowed: false,
        reason: `Validation error: ${error.message}`,
        currentTier: 'free'
      };
    }
  }

  /**
   * Assess calculation complexity and validate tier access
   */
  public async validateCalculationAccess(userId: string, inputs: DuctSizingInputs, projectData?: Partial<ProjectData>): Promise<EnforcementResult> {
    try {
      const userTier = await this.getUserTier(userId);
      const limits = TierEnforcer.TIER_LIMITS[userTier];

      // Assess calculation complexity
      const complexity = this.assessCalculationComplexity(inputs, projectData);

      // Check if user tier supports this complexity level
      const complexityLevels = ['basic', 'intermediate', 'advanced', 'expert'];
      const userMaxLevel = complexityLevels.indexOf(limits.maxCalculationComplexity);
      const requiredLevel = complexityLevels.indexOf(complexity.level);

      if (requiredLevel > userMaxLevel) {
        return {
          allowed: false,
          reason: `Calculation complexity '${complexity.level}' requires ${complexity.requiredTier} tier`,
          currentTier: userTier,
          requiredTier: complexity.requiredTier,
          upgradeMessage: `Upgrade to ${complexity.requiredTier} for advanced calculations`,
          limitations: [`Current tier supports: ${limits.maxCalculationComplexity} calculations`]
        };
      }

      return {
        allowed: true,
        currentTier: userTier,
        limitations: [`Calculation complexity: ${complexity.level} (score: ${complexity.score})`]
      };

    } catch (error) {
      return {
        allowed: false,
        reason: `Validation error: ${error.message}`,
        currentTier: 'free'
      };
    }
  }

  /**
   * Validate feature access
   */
  public async validateFeatureAccess(userId: string, featureName: string): Promise<EnforcementResult> {
    try {
      const userTier = await this.getUserTier(userId);
      const limits = TierEnforcer.TIER_LIMITS[userTier];

      // Check feature flag
      const featureResult = await this.featureManager.isEnabled(featureName, userId);

      if (!featureResult.enabled) {
        // Determine required tier for this feature
        let requiredTier: UserTier = 'pro';
        for (const [tier, tierLimits] of Object.entries(TierEnforcer.TIER_LIMITS)) {
          if (tierLimits.advancedFeatures.includes(featureName)) {
            requiredTier = tier as UserTier;
            break;
          }
        }

        return {
          allowed: false,
          reason: featureResult.reason || `Feature '${featureName}' not available`,
          currentTier: userTier,
          requiredTier,
          upgradeMessage: `Upgrade to ${requiredTier} for ${featureName}`,
          limitations: [`Available features: ${limits.advancedFeatures.join(', ') || 'Basic features only'}`]
        };
      }

      return {
        allowed: true,
        currentTier: userTier
      };

    } catch (error) {
      return {
        allowed: false,
        reason: `Validation error: ${error.message}`,
        currentTier: 'free'
      };
    }
  }

  /**
   * Perform calculation with tier enforcement
   */
  public async performCalculation(userId: string, inputs: DuctSizingInputs, projectData?: Partial<ProjectData>): Promise<{
    result?: DuctSizingResults;
    validation?: ValidationResult;
    enforcement: EnforcementResult;
  }> {
    // Validate calculation access
    const enforcement = await this.validateCalculationAccess(userId, inputs, projectData);

    if (!enforcement.allowed) {
      return { enforcement };
    }

    try {
      // Perform calculation using extracted core logic
      const result = AirDuctCalculator.calculateDuctSizing(inputs);

      // Validate against standards
      const calculationData: CalculationData = {
        velocity: result.velocity,
        frictionRate: inputs.frictionRate,
        ductType: inputs.ductType,
        airflow: inputs.airflow,
        diameter: result.diameter,
        width: result.width,
        height: result.height,
        aspectRatio: result.aspectRatio,
        area: result.area,
        material: inputs.material
      };

      const validation = SMACNAValidator.validateSMACNACompliance(calculationData);

      return {
        result,
        validation,
        enforcement
      };

    } catch (error) {
      return {
        enforcement: {
          allowed: false,
          reason: `Calculation error: ${error.message}`,
          currentTier: enforcement.currentTier
        }
      };
    }
  }

  /**
   * Assess calculation complexity based on inputs and project data
   */
  private assessCalculationComplexity(inputs: DuctSizingInputs, projectData?: Partial<ProjectData>): CalculationComplexity {
    let score = 0;
    const factors = {
      segmentCount: projectData?.segments?.length || 1,
      roomCount: projectData?.rooms?.length || 1,
      equipmentCount: projectData?.equipment?.length || 1,
      customMaterials: inputs.material && inputs.material !== 'galvanized_steel' ? 1 : 0,
      advancedFeatures: 0
    };

    // Score based on project size
    score += Math.min(factors.segmentCount * 2, 20);
    score += Math.min(factors.roomCount * 3, 15);
    score += Math.min(factors.equipmentCount * 4, 20);

    // Score based on calculation parameters
    if (inputs.frictionRate > 0.12) score += 10; // High friction rate
    if (inputs.targetVelocity && inputs.targetVelocity > 2000) score += 10; // High velocity
    if (inputs.ductType === 'rectangular') score += 5; // More complex than round

    // Score based on custom materials
    score += factors.customMaterials * 10;

    // Determine complexity level and required tier
    let level: CalculationComplexity['level'];
    let requiredTier: UserTier;

    if (score <= 25) {
      level = 'basic';
      requiredTier = 'free';
    } else if (score <= 50) {
      level = 'intermediate';
      requiredTier = 'pro';
    } else if (score <= 75) {
      level = 'advanced';
      requiredTier = 'pro';
    } else {
      level = 'expert';
      requiredTier = 'enterprise';
    }

    return {
      level,
      score: Math.min(score, 100),
      factors,
      requiredTier
    };
  }

  /**
   * Get user tier from feature manager
   */
  private async getUserTier(userId: string): Promise<UserTier> {
    try {
      // Get user from database through feature manager
      const userRepo = this.featureManager['userRepository'];
      const user = await userRepo.getUser(userId);
      return user?.tier || 'free';
    } catch (error) {
      console.error('Error getting user tier:', error);
      return 'free'; // Default to free tier on error
    }
  }

  /**
   * Get user project count
   * TODO: Implement actual project count query when project repository is available
   */
  private async getUserProjectCount(userId: string): Promise<number> {
    // This would typically query the projects table through a repository
    // For now, return 0 as placeholder until project repository is implemented
    return Promise.resolve(0);
  }

  /**
   * Get tier limits for a specific tier
   */
  public static getTierLimits(tier: UserTier): TierLimits {
    return { ...TierEnforcer.TIER_LIMITS[tier] };
  }

  /**
   * Get all export formats
   */
  public static getExportFormats(): Record<string, ExportFormat> {
    return { ...TierEnforcer.EXPORT_FORMATS };
  }

  /**
   * Get export formats available for a tier
   */
  public static getAvailableExportFormats(tier: UserTier): ExportFormat[] {
    const limits = TierEnforcer.TIER_LIMITS[tier];
    return limits.allowedExportFormats.map(id => TierEnforcer.EXPORT_FORMATS[id]).filter(Boolean);
  }
}

export default TierEnforcer;
