import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { User, AuthState, TierLimits } from '@/types/air-duct-sizer'
import { HybridAuthManager, HybridUser, TierStatus } from '@/lib/auth/HybridAuthManager'

interface AuthStore extends AuthState {
  // Hybrid authentication properties
  tierStatus: TierStatus | null
  isOnline: boolean
  lastSync: string | null

  // Actions
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string, company?: string) => Promise<boolean>
  logout: () => void
  refreshToken: () => Promise<boolean>
  setUser: (user: User) => void
  setToken: (token: string) => void
  setLoading: (loading: boolean) => void

  // Hybrid authentication methods
  getTierStatus: () => Promise<TierStatus>
  canPerformAction: (action: string, context?: any) => Promise<boolean>
  syncWithServer: () => Promise<boolean>

  // Tier checking (legacy compatibility)
  getTierLimits: () => TierLimits
  canAddRoom: () => boolean
  canAddSegment: () => boolean
  canEditComputationalProperties: () => boolean
  canExportWithoutWatermark: () => boolean
  canUseSimulation: () => boolean
  canUseCatalog: () => boolean

  // Subscription management
  upgradeToPro: () => Promise<boolean>
  downgradeToFree: () => Promise<boolean>
  checkSubscriptionStatus: () => Promise<boolean>
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
const AUTH_SERVER_URL = process.env.NEXT_PUBLIC_AUTH_SERVER_URL || 'http://localhost:5000'

// Initialize hybrid authentication manager
const hybridAuthManager = new HybridAuthManager(AUTH_SERVER_URL)

const getTierLimits = (tier: 'free' | 'pro'): TierLimits => {
  if (tier === 'pro') {
    return {
      maxRooms: Infinity,
      maxSegments: Infinity,
      maxProjects: Infinity,
      canEditComputationalProperties: true,
      canExportWithoutWatermark: true,
      canUseSimulation: true,
      canUseCatalog: true,
    }
  }
  
  // Free tier limits - aligned with business requirements
  return {
    maxRooms: 3,
    maxSegments: 25,
    maxProjects: 3, // Fixed: Free tier allows 3 projects, not 10
    canEditComputationalProperties: false,
    canExportWithoutWatermark: false,
    canUseSimulation: false,
    canUseCatalog: false,
  }
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initialize with Premium Pro tier user for testing
        user: {
          id: 'premium-pro-user',
          email: 'demo@sizewise.com',
          name: 'Demo User',
          tier: 'pro',
          company: 'SizeWise Engineering',
          subscription_expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        token: null,
        isAuthenticated: false,
        isLoading: false,

        // Hybrid authentication state
        tierStatus: null,
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        lastSync: null,

        login: async (email, password) => {
          set({ isLoading: true }, false, 'login:start')

          try {
            // Use HybridAuthManager for authentication
            const result = await hybridAuthManager.login(email, password)

            if (result.success && result.user && result.token) {
              // Convert HybridUser to User format for compatibility
              const user: User = {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                tier: result.user.tier as 'free' | 'pro' | 'super_admin',
                company: result.user.company || '',
                created_at: result.user.created_at,
                updated_at: new Date().toISOString(),
                is_super_admin: result.user.is_super_admin,
                permissions: result.user.is_super_admin ? [
                  'admin:full_access',
                  'admin:user_management',
                  'admin:system_configuration',
                  'admin:license_management',
                  'admin:database_access',
                  'admin:security_settings',
                  'admin:audit_logs',
                  'admin:emergency_access',
                  'admin:super_admin_functions',
                  'user:all_features',
                  'user:unlimited_access',
                  'user:export_without_watermark',
                  'user:advanced_calculations',
                  'user:simulation_access',
                  'user:catalog_access',
                  'user:computational_properties',
                ] : undefined,
              }

              // Set token in cookie for middleware authentication
              if (typeof document !== 'undefined') {
                document.cookie = `auth-token=${result.token}; path=/; max-age=${24 * 60 * 60}; secure; samesite=strict`;
              }

              // Get tier status
              const tierStatus = await hybridAuthManager.getTierStatus()

              set({
                user,
                token: result.token,
                isAuthenticated: true,
                isLoading: false,
                tierStatus,
                lastSync: new Date().toISOString(),
                isOnline: true,
              }, false, 'login:success')

              console.log('✅ Hybrid authentication successful')
              return true
            } else {
              throw new Error(result.error || 'Login failed')
            }
          } catch (error) {
            console.error('Login error:', error)
            set({
              isLoading: false,
              isOnline: false
            }, false, 'login:error')
            return false
          }
        },

        register: async (email, password, name, company) => {
          set({ isLoading: true }, false, 'register:start')

          try {
            // Use HybridAuthManager for registration
            const result = await hybridAuthManager.register(email, password, name, company)

            if (result.success && result.user && result.token) {
              // Convert HybridUser to User format for compatibility
              const user: User = {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                tier: result.user.tier as 'free' | 'pro' | 'super_admin',
                company: result.user.company || '',
                created_at: result.user.created_at,
                updated_at: new Date().toISOString(),
              }

              // Set token in cookie for middleware authentication
              if (typeof document !== 'undefined') {
                document.cookie = `auth-token=${result.token}; path=/; max-age=${24 * 60 * 60}; secure; samesite=strict`;
              }

              // Get tier status
              const tierStatus = await hybridAuthManager.getTierStatus()

              set({
                user,
                token: result.token,
                isAuthenticated: true,
                isLoading: false,
                tierStatus,
                lastSync: new Date().toISOString(),
                isOnline: true,
              }, false, 'register:success')

              return true
            } else {
              throw new Error(result.error || 'Registration failed')
            }
          } catch (error) {
            console.error('Registration error:', error)
            set({
              isLoading: false,
              isOnline: false
            }, false, 'register:error')
            return false
          }
        },

        logout: () => {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          }, false, 'logout')
        },

        refreshToken: async () => {
          const { token } = get()
          if (!token) return false

          try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            })

            if (!response.ok) {
              throw new Error('Token refresh failed')
            }

            const data = await response.json()
            
            if (data.success) {
              set({ token: data.token }, false, 'refreshToken:success')
              return true
            } else {
              throw new Error('Token refresh failed')
            }
          } catch (error) {
            console.error('Token refresh error:', error)
            get().logout()
            return false
          }
        },

        setUser: (user) => {
          set({ user }, false, 'setUser')
        },

        setToken: (token) => {
          set({ token }, false, 'setToken')
        },

        setLoading: (loading) => {
          set({ isLoading: loading }, false, 'setLoading')
        },

        // Hybrid authentication methods
        getTierStatus: async () => {
          try {
            const tierStatus = await hybridAuthManager.getTierStatus()
            set({
              tierStatus,
              lastSync: new Date().toISOString(),
              isOnline: true
            }, false, 'getTierStatus:success')
            return tierStatus
          } catch (error) {
            console.error('Get tier status error:', error)
            set({ isOnline: false }, false, 'getTierStatus:error')

            // Return cached tier status or default
            const { tierStatus } = get()
            if (tierStatus) {
              return tierStatus
            }

            // Default free tier status for offline mode
            return {
              tier: 'free',
              features: {
                max_projects: 3,
                max_segments_per_project: 25,
                high_res_exports: false,
                watermarked_exports: true,
                api_access: false,
              },
              usage: {
                projects_count: 0,
                segments_count: 0,
              },
              last_validated: new Date().toISOString(),
            }
          }
        },

        canPerformAction: async (action, context) => {
          try {
            return await hybridAuthManager.canPerformAction(action, context)
          } catch (error) {
            console.error('Can perform action error:', error)
            // Fallback to legacy tier checking for offline mode
            const { user } = get()
            if (!user) return false

            switch (action) {
              case 'create_project':
                return user.tier !== 'free' || true // Allow for now
              case 'add_segment':
                return user.tier !== 'free' || (context?.segments_count || 0) < 25
              case 'high_res_export':
                return user.tier !== 'free'
              case 'api_access':
                return user.tier === 'pro' || user.tier === 'super_admin'
              default:
                return true
            }
          }
        },

        syncWithServer: async () => {
          try {
            const tierStatus = await hybridAuthManager.getTierStatus()
            set({
              tierStatus,
              lastSync: new Date().toISOString(),
              isOnline: true
            }, false, 'syncWithServer:success')
            return true
          } catch (error) {
            console.error('Sync with server error:', error)
            set({ isOnline: false }, false, 'syncWithServer:error')
            return false
          }
        },

        getTierLimits: () => {
          const { user } = get()
          return getTierLimits(user?.tier || 'free')
        },

        canAddRoom: () => {
          const limits = get().getTierLimits()
          // This would need to check current room count from project store
          // For now, just return the tier capability
          return limits.maxRooms > 0
        },

        canAddSegment: () => {
          const limits = get().getTierLimits()
          // This would need to check current segment count from project store
          // For now, just return the tier capability
          return limits.maxSegments > 0
        },

        canEditComputationalProperties: () => {
          return get().getTierLimits().canEditComputationalProperties
        },

        canExportWithoutWatermark: () => {
          return get().getTierLimits().canExportWithoutWatermark
        },

        canUseSimulation: () => {
          return get().getTierLimits().canUseSimulation
        },

        canUseCatalog: () => {
          return get().getTierLimits().canUseCatalog
        },

        upgradeToPro: async () => {
          // This would integrate with payment system
          // For now, just simulate the upgrade
          const { user } = get()
          if (!user) return false

          try {
            // Simulate API call to upgrade subscription
            const updatedUser: User = {
              ...user,
              tier: 'pro',
              subscription_expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
            }

            set({ user: updatedUser }, false, 'upgradeToPro')
            return true
          } catch (error) {
            console.error('Upgrade error:', error)
            return false
          }
        },

        downgradeToFree: async () => {
          const { user } = get()
          if (!user) return false

          try {
            // Simulate API call to downgrade subscription
            const updatedUser: User = {
              ...user,
              tier: 'free',
              subscription_expires: undefined,
            }

            set({ user: updatedUser }, false, 'downgradeToFree')
            return true
          } catch (error) {
            console.error('Downgrade error:', error)
            return false
          }
        },

        checkSubscriptionStatus: async () => {
          const { user, token } = get()
          if (!user || !token) return false

          try {
            const response = await fetch(`${API_BASE_URL}/auth/subscription-status`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            })

            if (!response.ok) {
              throw new Error('Failed to check subscription status')
            }

            const data = await response.json()
            
            if (data.success && data.user) {
              set({ user: data.user }, false, 'checkSubscriptionStatus')
              return true
            }

            return false
          } catch (error) {
            console.error('Subscription status check error:', error)
            return false
          }
        },
      }),
      {
        name: 'sizewise-hybrid-auth',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          tierStatus: state.tierStatus,
          lastSync: state.lastSync,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
)
