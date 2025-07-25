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
   * Initialize periodic sync with server
   */
  private initializeSync() {
    // Sync every 5 minutes when online
    this.syncInterval = setInterval(() => {
      this.syncTierStatus();
    }, 5 * 60 * 1000);

    // Sync on window focus
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.syncTierStatus();
      });
    }
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
    if (await this.isSuperAdminCredentials(email, password)) {
      const superAdminResult = await this.authManager.authenticateUser(email, password);
      if (superAdminResult.success) {
        return {
          success: true,
          user: {
            id: 'super-admin',
            email,
            name: 'Super Administrator',
            tier: 'super_admin',
            created_at: new Date().toISOString(),
            is_super_admin: true,
          },
          token: superAdminResult.token,
        };
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

    return email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD;
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
