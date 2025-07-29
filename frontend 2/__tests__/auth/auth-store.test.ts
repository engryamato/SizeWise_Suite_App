/**
 * Auth Store Integration Tests
 * 
 * Tests for the Zustand auth store with hybrid authentication integration
 */

// Mock HybridAuthManager using factory function to avoid hoisting issues
jest.mock('@/lib/auth/HybridAuthManager', () => {
  const mockInstance = {
    login: jest.fn(),
    register: jest.fn(),
    getTierStatus: jest.fn(),
    canPerformAction: jest.fn(),
    syncTierStatus: jest.fn(),
    logout: jest.fn(),
  };

  return {
    HybridAuthManager: jest.fn().mockImplementation(() => mockInstance),
    __mockInstance: mockInstance, // Export for test access
  };
});

// Now import auth store after mocking
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/stores/auth-store'
import { __mockInstance } from '@/lib/auth/HybridAuthManager'

// Mock fetch
global.fetch = jest.fn()

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
})

describe('Auth Store', () => {
  beforeEach(async () => {
    // Reset mocks first
    jest.clearAllMocks()

    // Set up default mock implementations
    __mockInstance.logout.mockResolvedValue(undefined)

    // Clear store state after setting up mocks
    await useAuthStore.getState().logout()
  })

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        tier: 'premium',
        company: 'Test Company',
        created_at: '2024-01-01T00:00:00Z',
      }

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

      __mockInstance.login.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        token: 'jwt-token-123',
      })

      __mockInstance.getTierStatus.mockResolvedValueOnce(mockTierStatus)

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        const success = await result.current.login('user@example.com', 'password123')
        expect(success).toBe(true)
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user?.email).toBe('user@example.com')
      expect(result.current.token).toBe('jwt-token-123')
      expect(result.current.tierStatus?.tier).toBe('premium')
      expect(result.current.isOnline).toBe(true)
      expect(result.current.lastSync).toBeDefined()
    })

    it('should handle login failure', async () => {
      __mockInstance.login.mockResolvedValueOnce({
        success: false,
        error: 'Invalid credentials',
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        const success = await result.current.login('user@example.com', 'wrongpassword')
        expect(success).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isOnline).toBe(false)
    })

    it('should handle super admin login', async () => {
      const mockSuperAdmin = {
        id: 'super-admin-001',
        email: 'admin@sizewise.com',
        name: 'SizeWise Administrator',
        tier: 'super_admin',
        company: 'SizeWise Suite',
        created_at: '2024-01-01T00:00:00Z',
        is_super_admin: true,
      }

      __mockInstance.login.mockResolvedValueOnce({
        success: true,
        user: mockSuperAdmin,
        token: 'super-admin-token',
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        const success = await result.current.login('admin@sizewise.com', 'SizeWise2024!6EAF4610705941')
        expect(success).toBe(true)
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user?.tier).toBe('super_admin')
      expect(result.current.user?.is_super_admin).toBe(true)
    })
  })

  describe('Registration Flow', () => {
    it('should handle successful registration with trial', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'newuser@example.com',
        name: 'New User',
        tier: 'trial',
        company: 'New Company',
        created_at: '2024-01-01T00:00:00Z',
        trial_expires: '2024-01-15T00:00:00Z',
      }

      const mockTierStatus = {
        tier: 'trial',
        features: {
          max_projects: -1,
          max_segments_per_project: -1,
          high_res_exports: true,
          watermarked_exports: false,
          api_access: true,
        },
        usage: {
          projects_count: 0,
          segments_count: 0,
        },
        trial_expires: '2024-01-15T00:00:00Z',
        last_validated: '2024-01-01T00:00:00Z',
      }

      __mockInstance.register.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        token: 'jwt-token-456',
      })

      __mockInstance.getTierStatus.mockResolvedValueOnce(mockTierStatus)

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        const success = await result.current.register(
          'newuser@example.com',
          'password123',
          'New User',
          'New Company'
        )
        expect(success).toBe(true)
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user?.tier).toBe('trial')
      expect(result.current.tierStatus?.tier).toBe('trial')
      expect(result.current.tierStatus?.trial_expires).toBeDefined()
    })
  })

  describe('Tier Status Management', () => {
    it('should get tier status', async () => {
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

      __mockInstance.getTierStatus.mockResolvedValueOnce(mockTierStatus)

      const { result } = renderHook(() => useAuthStore())

      let tierStatus
      await act(async () => {
        tierStatus = await result.current.getTierStatus()
      })

      expect(tierStatus.tier).toBe('free')
      expect(result.current.tierStatus?.tier).toBe('free')
      expect(result.current.isOnline).toBe(true)
      expect(result.current.lastSync).toBeDefined()
    })

    it('should handle offline tier status', async () => {
      __mockInstance.getTierStatus.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useAuthStore())

      let tierStatus
      await act(async () => {
        tierStatus = await result.current.getTierStatus()
      })

      expect(tierStatus.tier).toBe('free') // Default fallback
      expect(result.current.isOnline).toBe(false)
    })

    it('should check action permissions', async () => {
      __mockInstance.canPerformAction.mockResolvedValueOnce(true)

      const { result } = renderHook(() => useAuthStore())

      let canPerform
      await act(async () => {
        canPerform = await result.current.canPerformAction('create_project')
      })

      expect(canPerform).toBe(true)
      expect(__mockInstance.canPerformAction).toHaveBeenCalledWith('create_project', undefined)
    })

    it('should sync with server', async () => {
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

      __mockInstance.getTierStatus.mockResolvedValueOnce(mockTierStatus)

      const { result } = renderHook(() => useAuthStore())

      let synced
      await act(async () => {
        synced = await result.current.syncWithServer()
      })

      expect(synced).toBe(true)
      expect(result.current.tierStatus?.tier).toBe('premium')
      expect(result.current.isOnline).toBe(true)
    })
  })

  describe('Legacy Compatibility', () => {
    it('should maintain legacy tier checking methods', () => {
      const { result } = renderHook(() => useAuthStore())

      // Set up a user
      act(() => {
        result.current.setUser({
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
          tier: 'pro',
          company: 'Test Company',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        })
      })

      // Test legacy methods
      expect(result.current.canAddRoom()).toBe(true)
      expect(result.current.canAddSegment()).toBe(true)
      expect(result.current.canEditComputationalProperties()).toBe(true)
      expect(result.current.canExportWithoutWatermark()).toBe(true)
      expect(result.current.canUseSimulation()).toBe(true)
      expect(result.current.canUseCatalog()).toBe(true)
    })

    it('should get tier limits for free tier', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setUser({
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
          tier: 'free',
          company: 'Test Company',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        })
      })

      const limits = result.current.getTierLimits()
      expect(limits.maxProjects).toBe(3)
      expect(limits.maxSegments).toBe(25)
      expect(limits.canEditComputationalProperties).toBe(false)
      expect(limits.canExportWithoutWatermark).toBe(false)
    })
  })

  describe('Persistence', () => {
    it('should persist auth state', () => {
      const { result } = renderHook(() => useAuthStore())

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        tier: 'premium',
        company: 'Test Company',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

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

      act(() => {
        result.current.setUser(mockUser)
        result.current.setToken('jwt-token-123')
        // Simulate setting tier status
        useAuthStore.setState({
          tierStatus: mockTierStatus,
          lastSync: '2024-01-01T00:00:00Z',
          isAuthenticated: true,
        })
      })

      // Check that state is set correctly
      expect(result.current.user?.email).toBe('user@example.com')
      expect(result.current.token).toBe('jwt-token-123')
      expect(result.current.tierStatus?.tier).toBe('premium')
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should clear state on logout', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set up authenticated state
      act(() => {
        result.current.setUser({
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
          tier: 'premium',
          company: 'Test Company',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        })
        result.current.setToken('jwt-token-123')
        useAuthStore.setState({ isAuthenticated: true })
      })

      // Logout (async)
      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })
})
