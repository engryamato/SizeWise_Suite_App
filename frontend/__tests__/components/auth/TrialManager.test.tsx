/**
 * TrialManager Component Tests
 * 
 * Tests for trial management UI components
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TrialManager, TrialManagerCompact } from '@/components/auth/TrialManager'
import { useAuthStore } from '@/stores/auth-store'
import { tierEnforcementService } from '@/lib/services/HybridTierEnforcementService'

// Mock dependencies
jest.mock('@/stores/auth-store', () => ({
  useAuthStore: jest.fn()
}))
jest.mock('@/lib/services/HybridTierEnforcementService')

// Mock window.open
Object.defineProperty(window, 'open', {
  writable: true,
  value: jest.fn(),
})

describe('TrialManager', () => {
  let mockAuthStore: any
  let mockTierEnforcementService: any

  beforeEach(() => {
    mockAuthStore = {
      tierStatus: null,
      user: null,
    }

    mockTierEnforcementService = {
      getTierInfo: jest.fn(),
    }

    ;(useAuthStore as any).mockReturnValue(mockAuthStore)
    ;(tierEnforcementService.getTierInfo as jest.Mock) = mockTierEnforcementService.getTierInfo
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Trial Active State', () => {
    it('should display trial active message with days remaining', async () => {
      const trialExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      mockAuthStore.tierStatus = {
        tier: 'trial',
        trial_expires: trialExpires,
      }

      render(<TrialManager />)

      await waitFor(() => {
        expect(screen.getByText('Premium Trial Active')).toBeInTheDocument()
        expect(screen.getByText(/7 days remaining/)).toBeInTheDocument()
      })
    })

    it('should show trial expiring soon warning', async () => {
      const trialExpires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      mockAuthStore.tierStatus = {
        tier: 'trial',
        trial_expires: trialExpires,
      }

      render(<TrialManager />)

      await waitFor(() => {
        expect(screen.getByText('Trial Expiring Soon')).toBeInTheDocument()
        expect(screen.getByText(/expires in 2 days/)).toBeInTheDocument()
        expect(screen.getByText('Upgrade Now')).toBeInTheDocument()
      })
    })

    it('should show trial expired message', async () => {
      const trialExpires = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      mockAuthStore.tierStatus = {
        tier: 'trial',
        trial_expires: trialExpires,
      }

      render(<TrialManager />)

      await waitFor(() => {
        expect(screen.getByText('Trial Expired')).toBeInTheDocument()
        expect(screen.getByText(/trial has expired/)).toBeInTheDocument()
        expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument()
      })
    })
  })

  describe('Free Tier State', () => {
    it('should display free tier information', () => {
      mockAuthStore.tierStatus = { tier: 'free' }
      mockAuthStore.user = { tier: 'free' }

      render(<TrialManager />)

      expect(screen.getByText('Free Tier Active')).toBeInTheDocument()
      expect(screen.getByText(/using the Free tier/)).toBeInTheDocument()
      expect(screen.getByText('✓ 3 Projects')).toBeInTheDocument()
      expect(screen.getByText('✓ 25 Segments/Project')).toBeInTheDocument()
      expect(screen.getByText('✗ High-Res Exports')).toBeInTheDocument()
      expect(screen.getByText('✗ API Access')).toBeInTheDocument()
    })

    it('should show upgrade button for free tier', () => {
      mockAuthStore.tierStatus = { tier: 'free' }
      mockAuthStore.user = { tier: 'free' }

      render(<TrialManager />)

      const upgradeButton = screen.getByText('Upgrade to Premium')
      expect(upgradeButton).toBeInTheDocument()

      fireEvent.click(upgradeButton)
      expect(window.open).toHaveBeenCalledWith('https://sizewise.com/pricing', '_blank')
    })
  })

  describe('Visibility Rules', () => {
    it('should not render for super admin users', () => {
      mockAuthStore.user = { tier: 'super_admin' }

      const { container } = render(<TrialManager />)
      expect(container.firstChild).toBeNull()
    })

    it('should not render for premium users', () => {
      mockAuthStore.tierStatus = { tier: 'premium' }

      const { container } = render(<TrialManager />)
      expect(container.firstChild).toBeNull()
    })

    it('should be dismissible when showDismiss is true', () => {
      mockAuthStore.tierStatus = { tier: 'free' }
      const onDismiss = jest.fn()

      render(<TrialManager showDismiss={true} onDismiss={onDismiss} />)

      const dismissButton = screen.getByLabelText('Dismiss notification')
      fireEvent.click(dismissButton)

      expect(onDismiss).toHaveBeenCalled()
    })
  })

  describe('Fallback to Service', () => {
    it('should get tier info from service when tierStatus is not available', async () => {
      mockAuthStore.tierStatus = null
      mockTierEnforcementService.getTierInfo.mockResolvedValueOnce({
        isTrialActive: true,
        trialDaysRemaining: 5,
      })

      render(<TrialManager />)

      await waitFor(() => {
        expect(mockTierEnforcementService.getTierInfo).toHaveBeenCalled()
      })
    })

    it('should handle service errors gracefully', async () => {
      mockAuthStore.tierStatus = null
      mockTierEnforcementService.getTierInfo.mockRejectedValueOnce(new Error('Service error'))

      const { container } = render(<TrialManager />)

      await waitFor(() => {
        expect(mockTierEnforcementService.getTierInfo).toHaveBeenCalled()
      })

      // Should not crash and not render anything
      expect(container.firstChild).toBeNull()
    })
  })
})

describe('TrialManagerCompact', () => {
  let mockAuthStore: any

  beforeEach(() => {
    mockAuthStore = {
      tierStatus: null,
      user: null,
    }

    // Properly mock the useAuthStore function
    const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
    mockUseAuthStore.mockReturnValue(mockAuthStore)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Trial Display', () => {
    it('should show compact trial info', () => {
      const trialExpires = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      mockAuthStore.tierStatus = {
        tier: 'trial',
        trial_expires: trialExpires,
      }

      render(<TrialManagerCompact />)

      expect(screen.getByText('Trial: 5d')).toBeInTheDocument()
      expect(screen.getByText('Upgrade')).toBeInTheDocument()
    })

    it('should show expiring soon state', () => {
      const trialExpires = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
      mockAuthStore.tierStatus = {
        tier: 'trial',
        trial_expires: trialExpires,
      }

      render(<TrialManagerCompact />)

      expect(screen.getByText('1d left')).toBeInTheDocument()
    })

    it('should show expired state', () => {
      const trialExpires = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      mockAuthStore.tierStatus = {
        tier: 'trial',
        trial_expires: trialExpires,
      }

      render(<TrialManagerCompact />)

      expect(screen.getByText('Trial Expired')).toBeInTheDocument()
    })
  })

  describe('Free Tier Display', () => {
    it('should show free tier compact info', () => {
      mockAuthStore.tierStatus = { tier: 'free' }
      mockAuthStore.user = { tier: 'free' }

      render(<TrialManagerCompact />)

      expect(screen.getByText('Free Tier')).toBeInTheDocument()
      expect(screen.getByText('Upgrade')).toBeInTheDocument()
    })

    it('should handle upgrade click', () => {
      mockAuthStore.tierStatus = { tier: 'free' }
      mockAuthStore.user = { tier: 'free' }

      render(<TrialManagerCompact />)

      const upgradeButton = screen.getByText('Upgrade')
      fireEvent.click(upgradeButton)

      expect(window.open).toHaveBeenCalledWith('https://sizewise.com/pricing', '_blank')
    })
  })

  describe('Visibility Rules', () => {
    it('should not render for super admin', () => {
      mockAuthStore.user = { tier: 'super_admin' }

      const { container } = render(<TrialManagerCompact />)
      expect(container.firstChild).toBeNull()
    })

    it('should not render for premium users', () => {
      mockAuthStore.tierStatus = { tier: 'premium' }

      const { container } = render(<TrialManagerCompact />)
      expect(container.firstChild).toBeNull()
    })

    it('should not render for non-trial/non-free users', () => {
      mockAuthStore.tierStatus = { tier: 'premium' }
      mockAuthStore.user = { tier: 'premium' }

      const { container } = render(<TrialManagerCompact />)
      expect(container.firstChild).toBeNull()
    })
  })
})
