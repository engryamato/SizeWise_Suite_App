/**
 * Hybrid Authentication Manager
 * 
 * Combines offline-first authentication with online tier management
 * Maintains compatibility with existing super admin system
 */

import { AuthenticationManager } from './AuthenticationManager';

export interface HybridUser {
  id: string;
  email: string;
  name: string;
  tier: 'trial' | 'free' | 'premium' | 'super_admin';
  trial_expires?: string;
  subscription_expires?: string;
  created_at: string;
  last_sync?: string;
  is_super_admin?: boolean;
}

export interface TierFeatures {
  max_projects: number; // -1 = unlimited
  max_segments_per_project: number; // -1 = unlimited
  high_res_exports: boolean;
  watermarked_exports: boolean;
  api_access: boolean;
}

export interface TierStatus {
  tier: string;
  features: TierFeatures;
  trial_expires?: string;
  subscription_expires?: string;
  usage: {
    projects_count: number;
    segments_count: number;
  };
  last_validated: string;
}

export class HybridAuthManager {
  private authManager: AuthenticationManager;
  private serverUrl: string;
  private cachedTierStatus: TierStatus | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(serverUrl: string = process.env.NEXT_PUBLIC_AUTH_SERVER_URL || '') {
    this.authManager = new AuthenticationManager();
    this.serverUrl = serverUrl;
    this.initializeSync();
  }

  /**
   * Initialize periodic sync with server (non-blocking)
   */
  private initializeSync() {
    // Only initialize sync if server URL is configured
    if (!this.serverUrl) {
      console.log('🔧 No auth server URL configured, skipping tier sync');
      return;
    }

    // Sync every 5 minutes when online (non-blocking)
    this.syncInterval = setInterval(() => {
      this.syncTierStatus().catch(error => {
        console.log('Tier sync failed (background):', error.message);
      });
    }, 5 * 60 * 1000);

    // Sync on window focus (non-blocking)
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.syncTierStatus().catch(error => {
          console.log('Tier sync failed (focus):', error.message);
        });
      });
    }

    // Initial sync (non-blocking, don't wait for result)
    this.syncTierStatus().catch(error => {
      console.log('Initial tier sync failed, using cached data:', error.message);
    });
  }

  /**
   * Login with hybrid authentication
   */
  async login(email: string, password: string): Promise<{
    success: boolean;
    user?: HybridUser;
    token?: string;
    error?: string;
  }> {
    // Check for super admin first (offline)
    const isSuperAdmin = await this.isSuperAdminCredentials(email, password);

    if (isSuperAdmin) {
      console.log('✅ Super admin credentials detected, calling authManager.authenticateUser...');
      const superAdminResult = await this.authManager.authenticateUser(email, password);
      console.log('🔍 AuthManager result:', superAdminResult);

      if (superAdminResult.success) {
        console.log('✅ Super admin authentication successful');
        const superAdminUser = {
          id: 'super-admin',
          email,
          name: 'Super Administrator',
          tier: 'super_admin' as const,
          created_at: new Date().toISOString(),
          is_super_admin: true,
        };

        // Cache user data locally
        await this.cacheUserData(superAdminUser, superAdminResult.token!);

        return {
          success: true,
          user: superAdminUser,
          token: superAdminResult.token,
        };
      } else {
        console.log('❌ Super admin authentication failed:', superAdminResult.error);
      }
    }

    // Try online authentication
    try {
      const response = await fetch(`${this.serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Cache user data locally
          await this.cacheUserData(data.user, data.token);
          
          // Sync tier status
          await this.syncTierStatus();

          return {
            success: true,
            user: data.user,
            token: data.token,
          };
        }
      }
    } catch (error) {
      console.log('Online authentication failed, checking offline cache');
    }

    // Fallback to offline authentication with cached data
    return this.offlineLogin(email, password);
  }

  /**
   * Register new user (online only)
   */
  async register(email: string, password: string, name: string, company?: string): Promise<{
    success: boolean;
    user?: HybridUser;
    token?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.serverUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, company }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Cache user data locally
          await this.cacheUserData(data.user, data.token);
          
          return {
            success: true,
            user: data.user,
            token: data.token,
          };
        }
      }

      return {
        success: false,
        error: 'Registration failed',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Registration requires internet connection',
      };
    }
  }

  /**
   * Get current tier status with offline fallback
   */
  async getTierStatus(): Promise<TierStatus> {
    // Try to sync with server first
    const synced = await this.syncTierStatus();
    
    if (synced && this.cachedTierStatus) {
      return this.cachedTierStatus;
    }

    // Fallback to cached status
    const cached = await this.getCachedTierStatus();
    if (cached) {
      return cached;
    }

    // Default to free tier if no cache
    return this.getDefaultTierStatus();
  }

  /**
   * Check if user can perform action based on tier
   */
  async canPerformAction(action: string, context?: any): Promise<boolean> {
    const tierStatus = await this.getTierStatus();
    
    switch (action) {
      case 'create_project':
        if (tierStatus.features.max_projects === -1) return true;
        return tierStatus.usage.projects_count < tierStatus.features.max_projects;
      
      case 'add_segment':
        if (tierStatus.features.max_segments_per_project === -1) return true;
        return context?.segments_count < tierStatus.features.max_segments_per_project;
      
      case 'high_res_export':
        return tierStatus.features.high_res_exports;
      
      case 'api_access':
        return tierStatus.features.api_access;
      
      default:
        return true;
    }
  }

  /**
   * Sync tier status with server
   */
  private async syncTierStatus(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      if (!token) return false;

      const response = await fetch(`${this.serverUrl}/api/user/tier-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.cachedTierStatus = {
            ...data,
            last_validated: new Date().toISOString(),
          };
          
          // Cache to localStorage
          localStorage.setItem('sizewise_tier_status', JSON.stringify(this.cachedTierStatus));
          return true;
        }
      }
    } catch (error) {
      console.log('Tier sync failed, using cached data');
    }

    return false;
  }

  /**
   * Offline login using cached credentials
   */
  private async offlineLogin(email: string, password: string): Promise<{
    success: boolean;
    user?: HybridUser;
    token?: string;
    error?: string;
  }> {
    // Check cached user data
    const cachedUser = localStorage.getItem('sizewise_user');
    const cachedToken = localStorage.getItem('sizewise_token');

    if (cachedUser && cachedToken) {
      const user = JSON.parse(cachedUser);
      if (user.email === email) {
        // In a real implementation, you'd verify the password hash
        return {
          success: true,
          user,
          token: cachedToken,
        };
      }
    }

    return {
      success: false,
      error: 'Invalid credentials or no cached login available',
    };
  }

  /**
   * Cache user data locally
   */
  private async cacheUserData(user: HybridUser, token: string): Promise<void> {
    localStorage.setItem('sizewise_user', JSON.stringify(user));
    localStorage.setItem('sizewise_token', token);
  }

  /**
   * Get cached tier status
   */
  private async getCachedTierStatus(): Promise<TierStatus | null> {
    const cached = localStorage.getItem('sizewise_tier_status');
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Get default tier status for offline mode
   */
  private getDefaultTierStatus(): TierStatus {
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
    };
  }

  /**
   * Check if credentials are for super admin
   */
  private async isSuperAdminCredentials(email: string, password: string): Promise<boolean> {
    // Use existing super admin validation logic from SizeWise Suite
    const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'admin@sizewise.com'
    const SUPER_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_SUPER_ADMIN_PASSWORD || 'SizeWise2024!6EAF4610705941'

    console.log('🔍 isSuperAdminCredentials check:', {
      inputEmail: email,
      inputPassword: password,
      expectedEmail: SUPER_ADMIN_EMAIL,
      expectedPassword: SUPER_ADMIN_PASSWORD,
      emailMatch: email === SUPER_ADMIN_EMAIL,
      passwordMatch: password === SUPER_ADMIN_PASSWORD
    });

    return email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD;
  }

  /**
   * Logout user and clear all authentication data
   */
  async logout(): Promise<void> {
    try {
      // Get current token for server logout
      const token = await this.getStoredToken();

      // Try to logout from server if online
      if (token) {
        try {
          await fetch(`${this.serverUrl}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          // Server logout failed, but continue with local cleanup
          console.log('Server logout failed, continuing with local cleanup');
        }
      }

      // Clear all local storage data
      this.clearLocalStorage();

      // Clear cached data
      this.cachedTierStatus = null;

      // Clear sync interval
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      // Use AuthenticationManager for session cleanup if available
      if (this.authManager) {
        await this.authManager.logout();
      }

    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear local data
      this.clearLocalStorage();
    }
  }

  /**
   * Clear all authentication data from localStorage
   */
  private clearLocalStorage(): void {
    // Clear user and authentication data
    localStorage.removeItem('sizewise_user');
    localStorage.removeItem('sizewise_token');
    localStorage.removeItem('sizewise_tier_status');

    // Clear any other SizeWise related data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sizewise_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Get stored authentication token
   */
  private async getStoredToken(): Promise<string | null> {
    return localStorage.getItem('sizewise_token');
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}
