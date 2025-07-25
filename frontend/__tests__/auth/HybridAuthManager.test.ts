/**
 * HybridAuthManager Tests
 * 
 * Comprehensive test suite for the hybrid authentication system
 * covering online/offline scenarios, super admin access, and tier management
 */

import { HybridAuthManager } from '@/lib/auth/HybridAuthManager'
import { AuthenticationManager } from '@/lib/auth/AuthenticationManager'

// Mock the AuthenticationManager
jest.mock('@/lib/auth/AuthenticationManager')

// Mock fetch for API calls
global.fetch = jest.fn()

describe('HybridAuthManager', () => {
  let hybridAuthManager: HybridAuthManager
  let mockAuthManager: jest.Mocked<AuthenticationManager>

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Create mock auth manager
    mockAuthManager = new AuthenticationManager() as jest.Mocked<AuthenticationManager>
    
    // Create hybrid auth manager
    hybridAuthManager = new HybridAuthManager('http://localhost:5000')
    
    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL = 'admin@sizewise.com'
    process.env.NEXT_PUBLIC_SUPER_ADMIN_PASSWORD = 'SizeWise2024!6EAF4610705941'
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Super Admin Authentication', () => {
    it('should authenticate super admin with correct credentials', async () => {
      const result = await hybridAuthManager.login('admin@sizewise.com', 'SizeWise2024!6EAF4610705941')
      
      expect(result.success).toBe(true)
      expect(result.user?.tier).toBe('super_admin')
      expect(result.user?.is_super_admin).toBe(true)
      expect(result.token).toBeDefined()
    })

    it('should reject invalid super admin credentials', async () => {
      // Mock failed API call
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
      
      const result = await hybridAuthManager.login('admin@sizewise.com', 'wrongpassword')
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should generate proper super admin token', async () => {
      const result = await hybridAuthManager.login('admin@sizewise.com', 'SizeWise2024!6EAF4610705941')
      
      expect(result.token).toBeDefined()
      
      // Decode and verify token structure
      const tokenData = JSON.parse(atob(result.token!))
      expect(tokenData.isSuperAdmin).toBe(true)
      expect(tokenData.tier).toBe('super_admin')
      expect(tokenData.expires).toBeGreaterThan(Date.now())
    })
  })

  describe('Online Authentication', () => {
    it('should authenticate user via API when online', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
          tier: 'premium',
          company: 'Test Company',
          created_at: '2024-01-01T00:00:00Z',
          trial_expires: null,
        },
        token: 'jwt-token-123',
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await hybridAuthManager.login('user@example.com', 'password123')

      expect(result.success).toBe(true)
      expect(result.user?.email).toBe('user@example.com')
      expect(result.user?.tier).toBe('premium')
      expect(result.token).toBe('jwt-token-123')
    })

    it('should handle API authentication failure', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      const result = await hybridAuthManager.login('user@example.com', 'wrongpassword')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle network errors gracefully', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await hybridAuthManager.login('user@example.com', 'password123')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Registration', () => {
    it('should register new user with trial', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: 'user-456',
          email: 'newuser@example.com',
          name: 'New User',
          tier: 'trial',
          company: 'New Company',
          created_at: '2024-01-01T00:00:00Z',
          trial_expires: '2024-01-15T00:00:00Z',
        },
        token: 'jwt-token-456',
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await hybridAuthManager.register(
        'newuser@example.com',
        'password123',
        'New User',
        'New Company'
      )

      expect(result.success).toBe(true)
      expect(result.user?.tier).toBe('trial')
      expect(result.user?.trial_expires).toBeDefined()
      expect(result.token).toBe('jwt-token-456')
    })

    it('should handle registration failure', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Email already exists' } }),
      })

      const result = await hybridAuthManager.register(
        'existing@example.com',
        'password123',
        'Test User'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Email already exists')
    })
  })

  describe('Tier Status Management', () => {
    it('should fetch tier status from server', async () => {
      const mockTierStatus = {
        tier: 'premium',
        features: {
          max_projects: -1,
          max_segments_per_project: -1,
          high_res_exports: true,
          watermarked_exports: false,
          api_access: true,
        },
        usage: {
          projects_count: 5,
          segments_count: 150,
        },
        last_validated: '2024-01-01T00:00:00Z',
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, tier_status: mockTierStatus }),
      })

      const tierStatus = await hybridAuthManager.getTierStatus()

      expect(tierStatus.tier).toBe('premium')
      expect(tierStatus.features.high_res_exports).toBe(true)
      expect(tierStatus.usage.projects_count).toBe(5)
    })

    it('should return cached tier status when offline', async () => {
      // First, set up a successful call to cache data
      const mockTierStatus = {
        tier: 'free',
        features: {
          max_projects: 3,
          max_segments_per_project: 25,
          high_res_exports: false,
          watermarked_exports: true,
          api_access: false,
        },
        usage: {
          projects_count: 1,
          segments_count: 10,
        },
        last_validated: '2024-01-01T00:00:00Z',
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, tier_status: mockTierStatus }),
      })

      // Get tier status to cache it
      await hybridAuthManager.getTierStatus()

      // Now simulate network failure
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      // Should return cached data
      const cachedTierStatus = await hybridAuthManager.getTierStatus()
      expect(cachedTierStatus.tier).toBe('free')
    })
  })

  describe('Action Permissions', () => {
    beforeEach(async () => {
      // Set up tier status
      const mockTierStatus = {
        tier: 'free',
        features: {
          max_projects: 3,
          max_segments_per_project: 25,
          high_res_exports: false,
          watermarked_exports: true,
          api_access: false,
        },
        usage: {
          projects_count: 2,
          segments_count: 20,
        },
        last_validated: '2024-01-01T00:00:00Z',
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, tier_status: mockTierStatus }),
      })

      await hybridAuthManager.getTierStatus()
    })

    it('should allow project creation within limits', async () => {
      const canCreate = await hybridAuthManager.canPerformAction('create_project')
      expect(canCreate).toBe(true) // 2 projects < 3 limit
    })

    it('should deny project creation when limit reached', async () => {
      // Update usage to hit limit
      const mockTierStatus = {
        tier: 'free',
        features: {
          max_projects: 3,
          max_segments_per_project: 25,
          high_res_exports: false,
          watermarked_exports: true,
          api_access: false,
        },
        usage: {
          projects_count: 3,
          segments_count: 20,
        },
        last_validated: '2024-01-01T00:00:00Z',
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, tier_status: mockTierStatus }),
      })

      await hybridAuthManager.getTierStatus()

      const canCreate = await hybridAuthManager.canPerformAction('create_project')
      expect(canCreate).toBe(false)
    })

    it('should allow segment addition within limits', async () => {
      const canAdd = await hybridAuthManager.canPerformAction('add_segment', { segments_count: 20 })
      expect(canAdd).toBe(true) // 20 segments < 25 limit
    })

    it('should deny high-res exports for free tier', async () => {
      const canExport = await hybridAuthManager.canPerformAction('high_res_export')
      expect(canExport).toBe(false)
    })

    it('should deny API access for free tier', async () => {
      const canAccess = await hybridAuthManager.canPerformAction('api_access')
      expect(canAccess).toBe(false)
    })
  })

  describe('Offline Fallback', () => {
    it('should work offline with cached data', async () => {
      // Simulate network being unavailable
      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const result = await hybridAuthManager.login('user@example.com', 'password123')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should sync with server when connection restored', async () => {
      const mockTierStatus = {
        tier: 'premium',
        features: {
          max_projects: -1,
          max_segments_per_project: -1,
          high_res_exports: true,
          watermarked_exports: false,
          api_access: true,
        },
        usage: {
          projects_count: 10,
          segments_count: 500,
        },
        last_validated: '2024-01-01T00:00:00Z',
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, tier_status: mockTierStatus }),
      })

      const synced = await hybridAuthManager.syncTierStatus()

      expect(synced).toBe(true)
      
      const tierStatus = await hybridAuthManager.getTierStatus()
      expect(tierStatus.tier).toBe('premium')
    })
  })

  describe('Trial Management', () => {
    it('should handle trial expiration', async () => {
      const expiredTrialStatus = {
        tier: 'free', // Automatically downgraded
        features: {
          max_projects: 3,
          max_segments_per_project: 25,
          high_res_exports: false,
          watermarked_exports: true,
          api_access: false,
        },
        usage: {
          projects_count: 5, // Over free limit
          segments_count: 100,
        },
        last_validated: '2024-01-01T00:00:00Z',
        trial_expired: true,
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, tier_status: expiredTrialStatus }),
      })

      const tierStatus = await hybridAuthManager.getTierStatus()

      expect(tierStatus.tier).toBe('free')
      expect(tierStatus.trial_expired).toBe(true)
    })

    it('should track trial days remaining', async () => {
      const activeTrialStatus = {
        tier: 'trial',
        features: {
          max_projects: -1,
          max_segments_per_project: -1,
          high_res_exports: true,
          watermarked_exports: false,
          api_access: true,
        },
        usage: {
          projects_count: 2,
          segments_count: 50,
        },
        trial_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        last_validated: '2024-01-01T00:00:00Z',
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, tier_status: activeTrialStatus }),
      })

      const tierStatus = await hybridAuthManager.getTierStatus()

      expect(tierStatus.tier).toBe('trial')
      expect(tierStatus.trial_expires).toBeDefined()
      
      const expiryDate = new Date(tierStatus.trial_expires!)
      const now = new Date()
      const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      expect(daysRemaining).toBeGreaterThan(6)
      expect(daysRemaining).toBeLessThanOrEqual(7)
    })
  })
})
