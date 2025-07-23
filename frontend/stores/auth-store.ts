import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { User, AuthState, TierLimits } from '@/types/air-duct-sizer'

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string, company?: string) => Promise<boolean>
  logout: () => void
  refreshToken: () => Promise<boolean>
  setUser: (user: User) => void
  setToken: (token: string) => void
  setLoading: (loading: boolean) => void
  
  // Tier checking
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
  
  // Free tier limits
  return {
    maxRooms: 3,
    maxSegments: 25,
    maxProjects: 10,
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
        // Initialize with default Free tier user for MVP
        user: {
          id: 'default-free-user',
          email: 'demo@sizewise.com',
          name: 'Demo User',
          tier: 'free',
          company: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        token: null,
        isAuthenticated: false,
        isLoading: false,

        login: async (email, password) => {
          set({ isLoading: true }, false, 'login:start')
          
          try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            })

            if (!response.ok) {
              throw new Error('Login failed')
            }

            const data = await response.json()
            
            if (data.success) {
              set({
                user: data.user,
                token: data.token,
                isAuthenticated: true,
                isLoading: false,
              }, false, 'login:success')
              
              return true
            } else {
              throw new Error(data.error?.message || 'Login failed')
            }
          } catch (error) {
            console.error('Login error:', error)
            set({ isLoading: false }, false, 'login:error')
            return false
          }
        },

        register: async (email, password, name, company) => {
          set({ isLoading: true }, false, 'register:start')
          
          try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password, name, company }),
            })

            if (!response.ok) {
              throw new Error('Registration failed')
            }

            const data = await response.json()
            
            if (data.success) {
              set({
                user: data.user,
                token: data.token,
                isAuthenticated: true,
                isLoading: false,
              }, false, 'register:success')
              
              return true
            } else {
              throw new Error(data.error?.message || 'Registration failed')
            }
          } catch (error) {
            console.error('Registration error:', error)
            set({ isLoading: false }, false, 'register:error')
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
        name: 'air-duct-sizer-auth',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
)
