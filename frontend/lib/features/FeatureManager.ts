/**
 * FeatureManager - Production-Grade Feature Management System
 * 
 * MISSION-CRITICAL: Secure tier-based feature management with cryptographic protection
 * Integrates with Phase 1.5 security foundation to prevent tier bypass and revenue loss
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 1.4
 */

import { SecureFeatureValidator, ValidationContext } from '../security/SecureFeatureValidator';
import { LocalUserRepository } from '../repositories/local/LocalUserRepository';
import { LocalFeatureFlagRepository } from '../repositories/local/LocalFeatureFlagRepository';
import { DatabaseManager } from '../../../backend/database/DatabaseManager';

/**
 * Feature check result with performance metrics
 */
export interface FeatureCheckResult {
  enabled: boolean;
  tier: 'free' | 'pro' | 'enterprise';
  reason?: string;
  responseTime: number;
  cached: boolean;
}

/**
 * Batch feature check result
 */
export interface BatchFeatureResult {
  features: Map<string, FeatureCheckResult>;
  totalResponseTime: number;
  cacheHitRate: number;
}

/**
 * Feature usage statistics
 */
export interface FeatureUsageStats {
  featureName: string;
  accessCount: number;
  lastAccessed: Date;
  averageResponseTime: number;
  cacheHitRate: number;
}

/**
 * Production-grade feature manager with cryptographic security
 * CRITICAL: All feature checks go through SecureFeatureValidator
 */
export class FeatureManager {
  private readonly secureValidator: SecureFeatureValidator;
  private readonly userRepository: LocalUserRepository;
  private readonly featureFlagRepository: LocalFeatureFlagRepository;
  private readonly dbManager: DatabaseManager;

  // Performance optimization cache (max 50ms response time requirement)
  private readonly featureCache = new Map<string, { result: FeatureCheckResult; expires: number }>();
  private readonly cacheTimeout = 300000; // 5 minutes
  private readonly maxCacheSize = 1000;

  // Performance monitoring
  private readonly usageStats = new Map<string, FeatureUsageStats>();
  private readonly performanceThreshold = 50; // 50ms requirement

  // Tier boundaries from specification (docs/implementation/tier-system/tier-boundaries-specification.md)
  private readonly tierFeatures: Record<string, 'free' | 'pro' | 'enterprise'> = {
    // Core HVAC Functionality
    'air_duct_sizer': 'free',
    'boiler_vent_sizer': 'pro',
    'grease_duct_sizer': 'pro',
    'general_ventilation': 'pro',
    'equipment_selection': 'pro',

    // Project Management
    'unlimited_projects': 'pro',
    'unlimited_segments': 'pro',
    'project_templates': 'pro',
    'custom_templates': 'enterprise',
    'enhanced_metadata': 'pro',
    'custom_metadata_fields': 'enterprise',

    // Standards & Compliance
    'full_smacna_standards': 'pro',
    'custom_standards': 'enterprise',
    'full_ashrae_standards': 'pro',
    'early_access_standards': 'enterprise',
    'global_standards': 'enterprise',
    'cloud_standards_updates': 'pro',
    'detailed_compliance_reports': 'pro',
    'audit_trails': 'enterprise',

    // Drawing & Visualization
    'enhanced_pdf_processing': 'pro',
    'full_cad_tools': 'pro',
    'advanced_cad_layers': 'enterprise',
    'enhanced_3d_rendering': 'pro',
    'bim_export': 'enterprise',
    'advanced_collision_detection': 'pro',
    'realtime_collision_reporting': 'enterprise',
    'advanced_airflow_analytics': 'pro',
    'custom_visualization': 'enterprise',

    // Import/Export
    'cloud_sync': 'pro',
    'version_control': 'enterprise',
    'full_bulk_import': 'pro',
    'custom_import_mappings': 'enterprise',
    'enhanced_csv_export': 'pro',
    'custom_export_formats': 'enterprise',
    'high_res_pdf_export': 'pro',
    'custom_pdf_templates': 'enterprise',
    'dxf_dwg_export': 'pro',
    'advanced_3d_export': 'enterprise',

    // Cloud & Collaboration
    'multi_device_access': 'pro',
    'team_collaboration': 'pro',
    'advanced_rbac': 'enterprise',
    'version_history': 'pro',
    'full_audit_trail': 'enterprise',
    'realtime_collaboration': 'enterprise',

    // Security & Administration
    'sso_integration': 'enterprise',
    'role_based_access': 'enterprise',
    'comprehensive_audit_logs': 'enterprise',
    'advanced_security': 'enterprise',
    'compliance_certifications': 'enterprise',

    // Support & Updates
    'standard_email_support': 'pro',
    'priority_phone_support': 'enterprise',
    'automatic_updates': 'pro',
    'sla_based_updates': 'enterprise',
    'video_library': 'pro',
    'custom_training': 'enterprise'
  };

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
    this.secureValidator = new SecureFeatureValidator();
    this.userRepository = new LocalUserRepository(dbManager);
    this.featureFlagRepository = new LocalFeatureFlagRepository(dbManager);
  }

  /**
   * Check if feature is enabled for user
   * CRITICAL: Primary feature check method with <50ms performance requirement
   */
  async isEnabled(featureName: string, userId: string): Promise<FeatureCheckResult> {
    const startTime = Date.now();

    try {
      // 1. Check cache first for performance
      const cacheKey = `${userId}:${featureName}`;
      const cached = this.featureCache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        const responseTime = Date.now() - startTime;
        this.updateUsageStats(featureName, responseTime, true);
        
        return {
          ...cached.result,
          responseTime,
          cached: true
        };
      }

      // 2. Get user context for validation
      const user = await this.userRepository.getCurrentUser();
      if (!user) {
        const result = this.createErrorResult('User not authenticated', startTime);
        this.updateUsageStats(featureName, result.responseTime, false);
        return result;
      }

      // 3. Create validation context
      const context: ValidationContext = {
        userId: user.id,
        userTier: user.tier,
        licenseValid: true, // Validated by authentication
        timestamp: Date.now()
      };

      // 4. Get stored feature flag if exists
      const storedFlag = await this.featureFlagRepository.getFeatureFlag(userId, featureName);

      // 5. Perform secure validation through cryptographic validator
      const validationResult = await this.secureValidator.validateFeature(
        featureName,
        context,
        storedFlag || undefined
      );

      // 6. Create result with tier information
      const result: FeatureCheckResult = {
        enabled: validationResult.valid && validationResult.enabled,
        tier: user.tier,
        reason: validationResult.error,
        responseTime: Date.now() - startTime,
        cached: false
      };

      // 7. Cache result for performance
      this.cacheResult(cacheKey, result);

      // 8. Update usage statistics
      this.updateUsageStats(featureName, result.responseTime, false);

      // 9. Performance monitoring
      if (result.responseTime > this.performanceThreshold) {
        await this.logPerformanceWarning(featureName, result.responseTime);
      }

      return result;

    } catch (error) {
      const result = this.createErrorResult(`Feature check failed: ${error.message}`, startTime);
      this.updateUsageStats(featureName, result.responseTime, false);
      await this.logSecurityEvent('feature_check_error', {
        userId,
        featureName,
        error: error.message
      });
      return result;
    }
  }

  /**
   * Batch check multiple features for performance
   * CRITICAL: Optimized for UI components that need multiple feature checks
   */
  async checkFeatures(featureNames: string[], userId: string): Promise<BatchFeatureResult> {
    const startTime = Date.now();
    const results = new Map<string, FeatureCheckResult>();
    let cacheHits = 0;

    try {
      // Process features in parallel for performance
      const featurePromises = featureNames.map(async (featureName) => {
        const result = await this.isEnabled(featureName, userId);
        if (result.cached) {
          cacheHits++;
        }
        return { featureName, result };
      });

      const featureResults = await Promise.all(featurePromises);
      
      for (const { featureName, result } of featureResults) {
        results.set(featureName, result);
      }

      const totalResponseTime = Date.now() - startTime;
      const cacheHitRate = featureNames.length > 0 ? (cacheHits / featureNames.length) * 100 : 0;

      return {
        features: results,
        totalResponseTime,
        cacheHitRate
      };

    } catch (error) {
      await this.logSecurityEvent('batch_feature_check_error', {
        userId,
        featureNames,
        error: error.message
      });

      // Return error results for all features
      for (const featureName of featureNames) {
        results.set(featureName, this.createErrorResult(`Batch check failed: ${error.message}`, startTime));
      }

      return {
        features: results,
        totalResponseTime: Date.now() - startTime,
        cacheHitRate: 0
      };
    }
  }

  /**
   * Get all enabled features for user's tier
   */
  async getEnabledFeatures(userId: string): Promise<string[]> {
    try {
      const user = await this.userRepository.getCurrentUser();
      if (!user) {
        return [];
      }

      const enabledFeatures: string[] = [];
      
      // Check all defined features
      for (const [featureName] of Object.entries(this.tierFeatures)) {
        const result = await this.isEnabled(featureName, userId);
        if (result.enabled) {
          enabledFeatures.push(featureName);
        }
      }

      return enabledFeatures.sort((a, b) => a.localeCompare(b));

    } catch (error) {
      await this.logSecurityEvent('get_enabled_features_error', {
        userId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get feature usage statistics for monitoring
   */
  getUsageStatistics(): FeatureUsageStats[] {
    return Array.from(this.usageStats.values()).sort((a, b) => b.accessCount - a.accessCount);
  }

  /**
   * Clear feature cache (for testing or tier changes)
   */
  clearCache(): void {
    this.featureCache.clear();
    this.secureValidator.clearCache();
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStatistics(): { size: number; hitRate: number; averageResponseTime: number } {
    const stats = Array.from(this.usageStats.values());
    const totalAccess = stats.reduce((sum, stat) => sum + stat.accessCount, 0);
    const totalCacheHits = stats.reduce((sum, stat) => sum + (stat.cacheHitRate * stat.accessCount / 100), 0);
    const avgResponseTime = stats.reduce((sum, stat) => sum + stat.averageResponseTime, 0) / (stats.length || 1);

    return {
      size: this.featureCache.size,
      hitRate: totalAccess > 0 ? (totalCacheHits / totalAccess) * 100 : 0,
      averageResponseTime: avgResponseTime
    };
  }

  /**
   * Create error result with timing
   */
  private createErrorResult(reason: string, startTime: number): FeatureCheckResult {
    return {
      enabled: false,
      tier: 'free',
      reason,
      responseTime: Date.now() - startTime,
      cached: false
    };
  }

  /**
   * Cache feature result for performance
   */
  private cacheResult(key: string, result: FeatureCheckResult): void {
    // Clean cache if it's getting too large
    if (this.featureCache.size >= this.maxCacheSize) {
      this.cleanupCache();
    }

    this.featureCache.set(key, {
      result: { ...result },
      expires: Date.now() + this.cacheTimeout
    });
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.featureCache.entries()) {
      if (entry.expires <= now) {
        this.featureCache.delete(key);
      }
    }
  }

  /**
   * Update usage statistics for monitoring
   */
  private updateUsageStats(featureName: string, responseTime: number, cached: boolean): void {
    const existing = this.usageStats.get(featureName);
    
    if (existing) {
      existing.accessCount++;
      existing.lastAccessed = new Date();
      existing.averageResponseTime = (existing.averageResponseTime + responseTime) / 2;
      existing.cacheHitRate = cached ? 
        (existing.cacheHitRate + 100) / 2 : 
        existing.cacheHitRate * 0.9; // Decay cache hit rate
    } else {
      this.usageStats.set(featureName, {
        featureName,
        accessCount: 1,
        lastAccessed: new Date(),
        averageResponseTime: responseTime,
        cacheHitRate: cached ? 100 : 0
      });
    }
  }

  /**
   * Log performance warnings for monitoring
   */
  private async logPerformanceWarning(featureName: string, responseTime: number): Promise<void> {
    await this.logSecurityEvent('performance_warning', {
      featureName,
      responseTime,
      threshold: this.performanceThreshold,
      message: `Feature check exceeded ${this.performanceThreshold}ms threshold`
    });
  }

  /**
   * Log security events for monitoring
   */
  private async logSecurityEvent(event: string, data: any): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data,
      source: 'FeatureManager'
    };
    
    // In production, this would send to secure logging service
    console.log('[SECURITY]', JSON.stringify(logEntry));
  }
}
