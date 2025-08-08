import { create } from 'zustand';

// Cookie utilities for token storage
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document !== 'undefined') {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }
};

const getCookie = (name: string): string | null => {
  if (typeof document !== 'undefined') {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
};

const deleteCookie = (name: string) => {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
};

interface User {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise' | 'trial' | 'super_admin' | 'premium';
  is_super_admin?: boolean;
  permissions?: string[];
  company?: string;
  subscription_expires?: string;
  created_at: string;
  updated_at?: string;
}

interface TierStatus {
  tier: 'free' | 'pro' | 'enterprise' | 'trial' | 'super_admin' | 'premium';
  features: Record<string, boolean>;
  usage: Record<string, number>;
  limits: Record<string, number>;
  trial_expires?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  isOnline: boolean;
  lastSync: string | null;
  tierStatus: TierStatus | null;
  canEditComputationalProperties: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, company?: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  syncWithServer: () => Promise<boolean>;
  getTierStatus: () => Promise<TierStatus | null>;
  canPerformAction: (action: string, context?: any) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Initialize auth state from cookie if available
  const initializeAuth = () => {
    const existingToken = getCookie('auth-token');
    if (existingToken) {
      // For mock authentication, create a mock user if token exists
      const mockUser: User = {
        id: '1',
        email: 'user@example.com',
        name: 'Test User',
        tier: 'pro',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockTierStatus: TierStatus = {
        tier: mockUser.tier,
        features: { unlimited: mockUser.tier === 'enterprise' },
        usage: { projects: 1 },
        limits: { projects: mockUser.tier === 'free' ? 3 : 100 }
      };

      set({
        user: mockUser,
        isAuthenticated: true,
        token: existingToken,
        tierStatus: mockTierStatus,
        canEditComputationalProperties: mockUser.tier === 'pro' || mockUser.tier === 'enterprise' || mockUser.tier === 'super_admin'
      });
    }
  };

  // Initialize on store creation
  if (typeof window !== 'undefined') {
    // NEXT_PUBLIC_* envs are inlined by Next.js at build-time; use direct comparison
    const enableOfflineAuth = process.env.NEXT_PUBLIC_ENABLE_OFFLINE_AUTH !== 'false';
    if (enableOfflineAuth) {
      setTimeout(initializeAuth, 0);
    }
  }

  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    token: null,
    isOnline: true,
    lastSync: null,
    tierStatus: null,
    canEditComputationalProperties: false,

  login: async (email: string, password: string): Promise<boolean> => {
    set({ isLoading: true });

    // Simple mock authentication for testing
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validate credentials (only allow known super admin in mock)
      const VALID_EMAIL = 'admin@sizewise.com';
      const VALID_PASSWORD = 'SizeWise2024!6EAF4610705941';
      const isValid = email === VALID_EMAIL && password === VALID_PASSWORD;
      if (!isValid) {
        set({ isLoading: false });
        return false;
      }

      const mockUser: User = {
        id: '1',
        email,
        name: 'Super Admin',
        tier: 'super_admin',
        is_super_admin: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockToken = 'mock-jwt-token-' + Date.now();
      const mockTierStatus: TierStatus = {
        tier: mockUser.tier,
        features: { unlimited: true },
        usage: { projects: 1 },
        limits: { projects: 1000 }
      };

      // Store token in cookie for middleware access
      setCookie('auth-token', mockToken, 7);

      // Persist lightweight auth data for tests and app features expecting localStorage
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('sizewise_token', mockToken);
          localStorage.setItem('sizewise_user', JSON.stringify(mockUser));
          localStorage.setItem('sizewise_tier_status', JSON.stringify(mockTierStatus));
        }
      } catch (e) {
        console.warn('Failed to persist auth data to localStorage:', e);
      }

      set({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        token: mockToken,
        tierStatus: mockTierStatus,
        lastSync: new Date().toISOString(),
        canEditComputationalProperties: true
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      set({ isLoading: false });
      return false;
    }
  },

  register: async (email: string, password: string, name: string, company?: string): Promise<boolean> => {
    set({ isLoading: true });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockUser: User = {
        id: Date.now().toString(),
        email,
        name,
        tier: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockToken = 'mock-jwt-token-' + Date.now();
      const mockTierStatus: TierStatus = {
        tier: mockUser.tier,
        features: { unlimited: mockUser.tier === 'enterprise' },
        usage: { projects: 1 },
        limits: { projects: mockUser.tier === 'free' ? 3 : 100 }
      };

      set({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        token: mockToken,
        tierStatus: mockTierStatus,
        lastSync: new Date().toISOString(),
        canEditComputationalProperties: mockUser.tier === 'pro' || mockUser.tier === 'enterprise' || mockUser.tier === 'super_admin'
      });

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      set({ isLoading: false });
      return false;
    }
  },

  logout: () => {
    // Remove token from cookie
    deleteCookie('auth-token');

    // Clear persisted auth data
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sizewise_token');
        localStorage.removeItem('sizewise_user');
        localStorage.removeItem('sizewise_tier_status');
      }
    } catch {}

    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
      tierStatus: null,
      lastSync: null,
      canEditComputationalProperties: false
    });
  },
  
  setUser: (user: User) => {
    set({
      user,
      isAuthenticated: true
    });
  },

  setToken: (token: string) => {
    set({ token });
  },

  syncWithServer: async (): Promise<boolean> => {
    const { isOnline } = get();
    if (!isOnline) return false;

    try {
      // Simulate server sync
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ lastSync: new Date().toISOString() });
      return true;
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    }
  },

  getTierStatus: async (): Promise<TierStatus | null> => {
    const { user, isAuthenticated } = get();
    if (!isAuthenticated || !user) return null;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));

      const tierStatus: TierStatus = {
        tier: user.tier,
        features: { unlimited: user.tier === 'enterprise' },
        usage: { projects: 1 },
        limits: { projects: user.tier === 'free' ? 3 : 100 }
      };

      set({ tierStatus });
      return tierStatus;
    } catch (error) {
      console.error('Get tier status error:', error);
      return null;
    }
  },

  canPerformAction: async (action: string, context?: any) => {
    const { user, tierStatus } = get();

    if (!user || !tierStatus) {
      return false;
    }

    // Basic tier-based action permissions
    switch (action) {
      case 'create_project':
        return tierStatus.usage.projects < tierStatus.limits.projects;
      case 'add_segment': {
        // Check segment limits based on context
        const segmentCount = context?.segments_count || 0;
        let maxSegments = 10; // free tier
        if (user.tier === 'pro') maxSegments = 100;
        if (user.tier === 'enterprise') maxSegments = 1000;
        return segmentCount < maxSegments;
      }
      case 'export_project':
        return user.tier !== 'free';
      case 'advanced_calculations':
        return user.tier === 'pro' || user.tier === 'enterprise';
      case 'collaboration':
        return user.tier === 'enterprise';
      default:
        return true;
    }
  }
  };
});
