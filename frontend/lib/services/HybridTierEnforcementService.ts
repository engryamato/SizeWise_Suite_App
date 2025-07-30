/**
 * Hybrid Tier Enforcement Service
 * 
 * Integrates with the hybrid authentication system to enforce tier-based
 * feature restrictions while maintaining offline-first functionality
 */

import { useAuthStore } from '@/stores/auth-store'

export interface TierCheckResult {
  allowed: boolean
  message?: string
  upgradeRequired?: boolean
}

export interface ExportFeatures {
  highRes: boolean
  watermarked: boolean
  message?: string
}

export class HybridTierEnforcementService {
  /**
   * Check if user can create a new project
   */
  async checkProjectLimit(): Promise<TierCheckResult> {
    const { canPerformAction, tierStatus, user } = useAuthStore.getState()
    
    try {
      const allowed = await canPerformAction('create_project')
      
      if (!allowed && tierStatus) {
        const { features, usage } = tierStatus
        return {
          allowed: false,
          message: `Project limit reached (${usage.projects_count}/${features.max_projects}). Upgrade to Premium for unlimited projects.`,
          upgradeRequired: true,
        }
      }
      
      return { allowed: true }
    } catch (error) {
      // Fallback to legacy checking for offline mode
      if (user?.tier === 'free') {
        return {
          allowed: false,
          message: 'Free tier allows up to 3 projects. Upgrade to Premium for unlimited projects.',
          upgradeRequired: true,
        }
      }
      
      return { allowed: true }
    }
  }

  /**
   * Check if user can add a segment to a project
   */
  async checkSegmentLimit(projectSegments: number): Promise<TierCheckResult> {
    const { canPerformAction, tierStatus, user } = useAuthStore.getState()
    
    try {
      const allowed = await canPerformAction('add_segment', { segments_count: projectSegments })
      
      if (!allowed && tierStatus) {
        const { features } = tierStatus
        return {
          allowed: false,
          message: `Segment limit reached (${projectSegments}/${features.max_segments_per_project}). Upgrade to Premium for unlimited segments.`,
          upgradeRequired: true,
        }
      }
      
      return { allowed: true }
    } catch (error) {
      // Fallback to legacy checking for offline mode
      if (user?.tier === 'free' && projectSegments >= 25) {
        return {
          allowed: false,
          message: 'Free tier allows up to 25 segments per project. Upgrade to Premium for unlimited segments.',
          upgradeRequired: true,
        }
      }
      
      return { allowed: true }
    }
  }

  /**
   * Check export features available to user
   */
  async checkExportFeatures(): Promise<ExportFeatures> {
    const { canPerformAction, tierStatus, user } = useAuthStore.getState()
    
    try {
      const highRes = await canPerformAction('high_res_export')
      
      if (tierStatus) {
        const { features } = tierStatus
        return {
          highRes: features.high_res_exports,
          watermarked: features.watermarked_exports,
          message: !features.high_res_exports ? 'Upgrade to Premium for high-resolution exports' : undefined,
        }
      }
      
      return {
        highRes,
        watermarked: !highRes,
        message: !highRes ? 'Upgrade to Premium for high-resolution exports' : undefined,
      }
    } catch (error) {
      // Fallback to legacy checking for offline mode
      const isFreeTier = user?.tier === 'free'
      
      return {
        highRes: !isFreeTier,
        watermarked: isFreeTier,
        message: isFreeTier ? 'Upgrade to Premium for high-resolution exports' : undefined,
      }
    }
  }

  /**
   * Check if user can access API features
   */
  async checkApiAccess(): Promise<TierCheckResult> {
    const { canPerformAction, tierStatus, user } = useAuthStore.getState()
    
    try {
      const allowed = await canPerformAction('api_access')
      
      if (!allowed) {
        return {
          allowed: false,
          message: 'API access is available with Premium subscription only.',
          upgradeRequired: true,
        }
      }
      
      return { allowed: true }
    } catch (error) {
      // Fallback to legacy checking for offline mode
      const hasApiAccess = user?.tier === 'pro' || user?.tier === 'super_admin'
      
      return {
        allowed: hasApiAccess,
        message: !hasApiAccess ? 'API access is available with Premium subscription only.' : undefined,
        upgradeRequired: !hasApiAccess,
      }
    }
  }

  /**
   * Check if user can edit computational properties
   */
  async checkComputationalPropertiesAccess(): Promise<TierCheckResult> {
    const { user, tierStatus } = useAuthStore.getState()
    
    // Super admin always has access
    if (user?.tier === 'super_admin') {
      return { allowed: true }
    }
    
    try {
      // For hybrid authentication, check tier status
      if (tierStatus) {
        const allowed = tierStatus.tier !== 'free'
        return {
          allowed,
          message: !allowed ? 'Computational properties editing is available with Premium subscription.' : undefined,
          upgradeRequired: !allowed,
        }
      }
      
      // Fallback to legacy checking
      const allowed = user?.tier !== 'free'
      return {
        allowed,
        message: !allowed ? 'Computational properties editing is available with Premium subscription.' : undefined,
        upgradeRequired: !allowed,
      }
    } catch (error) {
      // Default to restricted access
      return {
        allowed: false,
        message: 'Computational properties editing requires Premium subscription.',
        upgradeRequired: true,
      }
    }
  }

  /**
   * Get user's current tier information
   */
  async getTierInfo(): Promise<{
    tier: string
    isTrialActive: boolean
    trialDaysRemaining?: number
    features: {
      maxProjects: number
      maxSegments: number
      highResExports: boolean
      apiAccess: boolean
    }
  }> {
    const { tierStatus, user } = useAuthStore.getState()
    
    if (tierStatus) {
      const isTrialActive = tierStatus.tier === 'trial'
      let trialDaysRemaining: number | undefined
      
      if (isTrialActive && tierStatus.trial_expires) {
        const expiryDate = new Date(tierStatus.trial_expires)
        const now = new Date()
        const diffTime = expiryDate.getTime() - now.getTime()
        trialDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
      }
      
      return {
        tier: tierStatus.tier,
        isTrialActive,
        trialDaysRemaining,
        features: {
          maxProjects: tierStatus.limits.projects || 3,
          maxSegments: tierStatus.limits.segments || 10,
          highResExports: tierStatus.features.unlimited || false,
          apiAccess: tierStatus.features.unlimited || false,
        },
      }
    }
    
    // Fallback to user tier information
    const tier = user?.tier || 'free'
    const isFreeTier = tier === 'free'
    
    return {
      tier,
      isTrialActive: false,
      features: {
        maxProjects: isFreeTier ? 3 : -1,
        maxSegments: isFreeTier ? 25 : -1,
        highResExports: !isFreeTier,
        apiAccess: tier === 'pro' || tier === 'super_admin',
      },
    }
  }

  /**
   * Check if user needs to upgrade for a specific feature
   */
  async shouldShowUpgradePrompt(feature: string): Promise<{
    show: boolean
    message?: string
    ctaText?: string
  }> {
    const { user, tierStatus } = useAuthStore.getState()
    
    // Never show upgrade prompts for super admin
    if (user?.tier === 'super_admin') {
      return { show: false }
    }
    
    const currentTier = tierStatus?.tier || user?.tier || 'free'
    
    // Don't show upgrade prompts for premium users
    if (currentTier === 'premium') {
      return { show: false }
    }
    
    // Show upgrade prompts for free tier users
    if (currentTier === 'free') {
      const messages = {
        projects: 'Upgrade to Premium for unlimited projects',
        segments: 'Upgrade to Premium for unlimited segments per project',
        exports: 'Upgrade to Premium for high-resolution, watermark-free exports',
        api: 'Upgrade to Premium for API access',
        computational: 'Upgrade to Premium to edit computational properties',
      }
      
      return {
        show: true,
        message: messages[feature as keyof typeof messages] || 'Upgrade to Premium for full access',
        ctaText: 'Upgrade to Premium',
      }
    }
    
    // Show trial expiration warnings for trial users
    if (currentTier === 'trial' && tierStatus?.trial_expires) {
      const expiryDate = new Date(tierStatus.trial_expires)
      const now = new Date()
      const diffTime = expiryDate.getTime() - now.getTime()
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (daysRemaining <= 3) {
        return {
          show: true,
          message: `Your trial expires in ${daysRemaining} days. Upgrade to keep Premium features.`,
          ctaText: 'Upgrade Now',
        }
      }
    }
    
    return { show: false }
  }
}

// Export singleton instance
export const tierEnforcementService = new HybridTierEnforcementService()
