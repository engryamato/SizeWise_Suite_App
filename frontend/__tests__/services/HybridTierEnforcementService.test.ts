/**
 * Hybrid Tier Enforcement Service Tests
 * 
 * Tests for tier-based feature restrictions and upgrade prompts
 */

import { tierEnforcementService } from '@/lib/services/HybridTierEnforcementService'
import { useAuthStore } from '@/stores/auth-store'

// Mock the auth store
jest.mock('@/stores/auth-store')

describe('HybridTierEnforcementService', () => {
  let mockAuthStore: any

  beforeEach(() => {
    mockAuthStore = {
      canPerformAction: jest.fn(),
      tierStatus: null,
      user: null,
    }

    ;(useAuthStore as any).getState = jest.fn(() => mockAuthStore)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Project Limits', () => {
    it('should allow project creation for premium users', async () => {
      mockAuthStore.canPerformAction.mockResolvedValueOnce(true)
      mockAuthStore.tierStatus = {
        tier: 'premium',
        features: { max_projects: -1 },
        usage: { projects_count: 10 },
      }

      const result = await tierEnforcementService.checkProjectLimit()

      expect(result.allowed).toBe(true)
      expect(result.upgradeRequired).toBeUndefined()
    })

    it('should deny project creation when free tier limit reached', async () => {
      mockAuthStore.canPerformAction.mockResolvedValueOnce(false)
      mockAuthStore.tierStatus = {
        tier: 'free',
        features: { max_projects: 3 },
        usage: { projects_count: 3 },
      }

      const result = await tierEnforcementService.checkProjectLimit()

      expect(result.allowed).toBe(false)
      expect(result.upgradeRequired).toBe(true)
      expect(result.message).toContain('Project limit reached')
    })

    it('should fallback to legacy checking when offline', async () => {
      mockAuthStore.canPerformAction.mockRejectedValueOnce(new Error('Offline'))
      mockAuthStore.user = { tier: 'free' }

      const result = await tierEnforcementService.checkProjectLimit()

      expect(result.allowed).toBe(false)
      expect(result.upgradeRequired).toBe(true)
      expect(result.message).toContain('Free tier allows up to 3 projects')
    })
  })

  describe('Segment Limits', () => {
    it('should allow segment addition within limits', async () => {
      mockAuthStore.canPerformAction.mockResolvedValueOnce(true)
      mockAuthStore.tierStatus = {
        tier: 'free',
        features: { max_segments_per_project: 25 },
      }

      const result = await tierEnforcementService.checkSegmentLimit(20)

      expect(result.allowed).toBe(true)
      expect(mockAuthStore.canPerformAction).toHaveBeenCalledWith('add_segment', { segments_count: 20 })
    })

    it('should deny segment addition when limit reached', async () => {
      mockAuthStore.canPerformAction.mockResolvedValueOnce(false)
      mockAuthStore.tierStatus = {
        tier: 'free',
        features: { max_segments_per_project: 25 },
      }

      const result = await tierEnforcementService.checkSegmentLimit(25)

      expect(result.allowed).toBe(false)
      expect(result.upgradeRequired).toBe(true)
      expect(result.message).toContain('Segment limit reached')
    })

    it('should use legacy fallback for segment checking', async () => {
      mockAuthStore.canPerformAction.mockRejectedValueOnce(new Error('Offline'))
      mockAuthStore.user = { tier: 'free' }

      const result = await tierEnforcementService.checkSegmentLimit(30)

      expect(result.allowed).toBe(false)
      expect(result.message).toContain('Free tier allows up to 25 segments')
    })
  })

  describe('Export Features', () => {
    it('should allow high-res exports for premium users', async () => {
      mockAuthStore.canPerformAction.mockResolvedValueOnce(true)
      mockAuthStore.tierStatus = {
        tier: 'premium',
        features: {
          high_res_exports: true,
          watermarked_exports: false,
        },
      }

      const result = await tierEnforcementService.checkExportFeatures()

      expect(result.highRes).toBe(true)
      expect(result.watermarked).toBe(false)
      expect(result.message).toBeUndefined()
    })

    it('should deny high-res exports for free users', async () => {
      mockAuthStore.canPerformAction.mockResolvedValueOnce(false)
      mockAuthStore.tierStatus = {
        tier: 'free',
        features: {
          high_res_exports: false,
          watermarked_exports: true,
        },
      }

      const result = await tierEnforcementService.checkExportFeatures()

      expect(result.highRes).toBe(false)
      expect(result.watermarked).toBe(true)
      expect(result.message).toContain('Upgrade to Premium for high-resolution exports')
    })

    it('should use legacy fallback for export features', async () => {
      mockAuthStore.canPerformAction.mockRejectedValueOnce(new Error('Offline'))
      mockAuthStore.user = { tier: 'free' }

      const result = await tierEnforcementService.checkExportFeatures()

      expect(result.highRes).toBe(false)
      expect(result.watermarked).toBe(true)
      expect(result.message).toContain('Upgrade to Premium for high-resolution exports')
    })
  })

  describe('API Access', () => {
    it('should allow API access for premium users', async () => {
      mockAuthStore.canPerformAction.mockResolvedValueOnce(true)

      const result = await tierEnforcementService.checkApiAccess()

      expect(result.allowed).toBe(true)
    })

    it('should deny API access for free users', async () => {
      mockAuthStore.canPerformAction.mockResolvedValueOnce(false)

      const result = await tierEnforcementService.checkApiAccess()

      expect(result.allowed).toBe(false)
      expect(result.upgradeRequired).toBe(true)
      expect(result.message).toContain('API access is available with Premium subscription only')
    })

    it('should allow API access for super admin', async () => {
      mockAuthStore.canPerformAction.mockRejectedValueOnce(new Error('Offline'))
      mockAuthStore.user = { tier: 'super_admin' }

      const result = await tierEnforcementService.checkApiAccess()

      expect(result.allowed).toBe(true)
    })
  })

  describe('Computational Properties', () => {
    it('should allow access for premium users', async () => {
      mockAuthStore.tierStatus = { tier: 'premium' }

      const result = await tierEnforcementService.checkComputationalPropertiesAccess()

      expect(result.allowed).toBe(true)
    })

    it('should deny access for free users', async () => {
      mockAuthStore.tierStatus = { tier: 'free' }

      const result = await tierEnforcementService.checkComputationalPropertiesAccess()

      expect(result.allowed).toBe(false)
      expect(result.upgradeRequired).toBe(true)
      expect(result.message).toContain('Computational properties editing is available with Premium subscription')
    })

    it('should always allow access for super admin', async () => {
      mockAuthStore.user = { tier: 'super_admin' }

      const result = await tierEnforcementService.checkComputationalPropertiesAccess()

      expect(result.allowed).toBe(true)
    })
  })

  describe('Tier Information', () => {
    it('should return tier info from tier status', async () => {
      mockAuthStore.tierStatus = {
        tier: 'trial',
        trial_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        features: {
          max_projects: -1,
          max_segments_per_project: -1,
          high_res_exports: true,
          api_access: true,
        },
      }

      const result = await tierEnforcementService.getTierInfo()

      expect(result.tier).toBe('trial')
      expect(result.isTrialActive).toBe(true)
      expect(result.trialDaysRemaining).toBeGreaterThan(6)
      expect(result.features.maxProjects).toBe(-1)
      expect(result.features.highResExports).toBe(true)
    })

    it('should fallback to user tier when no tier status', async () => {
      mockAuthStore.user = { tier: 'free' }

      const result = await tierEnforcementService.getTierInfo()

      expect(result.tier).toBe('free')
      expect(result.isTrialActive).toBe(false)
      expect(result.features.maxProjects).toBe(3)
      expect(result.features.maxSegments).toBe(25)
      expect(result.features.highResExports).toBe(false)
    })
  })

  describe('Upgrade Prompts', () => {
    it('should not show upgrade prompts for super admin', async () => {
      mockAuthStore.user = { tier: 'super_admin' }

      const result = await tierEnforcementService.shouldShowUpgradePrompt('projects')

      expect(result.show).toBe(false)
    })

    it('should not show upgrade prompts for premium users', async () => {
      mockAuthStore.tierStatus = { tier: 'premium' }

      const result = await tierEnforcementService.shouldShowUpgradePrompt('projects')

      expect(result.show).toBe(false)
    })

    it('should show upgrade prompts for free users', async () => {
      mockAuthStore.tierStatus = { tier: 'free' }

      const result = await tierEnforcementService.shouldShowUpgradePrompt('projects')

      expect(result.show).toBe(true)
      expect(result.message).toContain('Upgrade to Premium for unlimited projects')
      expect(result.ctaText).toBe('Upgrade to Premium')
    })

    it('should show trial expiration warnings', async () => {
      mockAuthStore.tierStatus = {
        tier: 'trial',
        trial_expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
      }

      const result = await tierEnforcementService.shouldShowUpgradePrompt('any')

      expect(result.show).toBe(true)
      expect(result.message).toContain('Your trial expires in 2 days')
      expect(result.ctaText).toBe('Upgrade Now')
    })

    it('should not show warnings for trials with more than 3 days', async () => {
      mockAuthStore.tierStatus = {
        tier: 'trial',
        trial_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }

      const result = await tierEnforcementService.shouldShowUpgradePrompt('any')

      expect(result.show).toBe(false)
    })
  })

  describe('Feature-Specific Upgrade Messages', () => {
    beforeEach(() => {
      mockAuthStore.tierStatus = { tier: 'free' }
    })

    it('should show correct message for projects feature', async () => {
      const result = await tierEnforcementService.shouldShowUpgradePrompt('projects')

      expect(result.message).toBe('Upgrade to Premium for unlimited projects')
    })

    it('should show correct message for segments feature', async () => {
      const result = await tierEnforcementService.shouldShowUpgradePrompt('segments')

      expect(result.message).toBe('Upgrade to Premium for unlimited segments per project')
    })

    it('should show correct message for exports feature', async () => {
      const result = await tierEnforcementService.shouldShowUpgradePrompt('exports')

      expect(result.message).toBe('Upgrade to Premium for high-resolution, watermark-free exports')
    })

    it('should show correct message for API feature', async () => {
      const result = await tierEnforcementService.shouldShowUpgradePrompt('api')

      expect(result.message).toBe('Upgrade to Premium for API access')
    })

    it('should show correct message for computational feature', async () => {
      const result = await tierEnforcementService.shouldShowUpgradePrompt('computational')

      expect(result.message).toBe('Upgrade to Premium to edit computational properties')
    })

    it('should show default message for unknown feature', async () => {
      const result = await tierEnforcementService.shouldShowUpgradePrompt('unknown')

      expect(result.message).toBe('Upgrade to Premium for full access')
    })
  })
})
