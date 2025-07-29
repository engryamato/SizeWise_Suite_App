/**
 * Super Administrator Service
 * 
 * Service layer for super administrator authentication and management
 * Integrates with existing AuthenticationManager and auth store
 */

import { User } from '@/types/air-duct-sizer';
import { useAuthStore } from '@/stores/auth-store';
import { AuthenticationManager } from './AuthenticationManager';
import { 
  SUPER_ADMIN_CONFIG, 
  createSuperAdminUser, 
  hashPassword, 
  verifyPassword,
  isSuperAdmin,
  hasPermission,
  getSuperAdminCredentials,
  createSuperAdminSession
} from './SuperAdminConfig';

// =============================================================================
// Super Admin Service Class
// =============================================================================

export class SuperAdminService {
  private authManager: AuthenticationManager;
  private static instance: SuperAdminService | null = null;

  constructor() {
    this.authManager = new AuthenticationManager();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SuperAdminService {
    if (!SuperAdminService.instance) {
      SuperAdminService.instance = new SuperAdminService();
    }
    return SuperAdminService.instance;
  }

  // =============================================================================
  // Super Admin Authentication
  // =============================================================================

  /**
   * Authenticate super admin user
   */
  async authenticateSuperAdmin(email: string, password: string): Promise<{
    success: boolean;
    user?: User;
    token?: string;
    error?: string;
  }> {
    try {
      // Check if credentials match super admin configuration
      if (email !== SUPER_ADMIN_CONFIG.email) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Verify password
      if (password !== SUPER_ADMIN_CONFIG.password) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Create super admin user
      const superAdminUser = createSuperAdminUser();

      // Create secure session
      const session = createSuperAdminSession(superAdminUser);

      // Generate token (simplified for Phase 1)
      const token = this.generateSuperAdminToken(session);

      // Update auth store
      const authStore = useAuthStore.getState();
      authStore.setUser(superAdminUser);
      authStore.setToken(token);

      return {
        success: true,
        user: superAdminUser,
        token
      };

    } catch (error) {
      console.error('Super admin authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Initialize super admin account
   */
  async initializeSuperAdmin(): Promise<{
    success: boolean;
    credentials?: any;
    error?: string;
  }> {
    try {
      // Create super admin user
      const superAdminUser = createSuperAdminUser();

      // Store in local database (if needed)
      await this.storeSuperAdminUser(superAdminUser);

      // Get credentials for display
      const credentials = getSuperAdminCredentials();

      return {
        success: true,
        credentials
      };

    } catch (error) {
      console.error('Super admin initialization error:', error);
      return {
        success: false,
        error: 'Failed to initialize super admin account'
      };
    }
  }

  /**
   * Validate super admin session
   */
  async validateSuperAdminSession(token: string): Promise<{
    valid: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      // Decode token (simplified for Phase 1)
      const session = this.decodeSuperAdminToken(token);
      
      if (!session) {
        return { valid: false, error: 'Invalid token' };
      }

      // Check if session is expired
      if (session.expiresAt < Date.now()) {
        return { valid: false, error: 'Session expired' };
      }

      // Create user object from session
      const user: User = {
        id: session.userId,
        email: session.email,
        name: 'SizeWise Administrator',
        tier: 'super_admin',
        company: 'SizeWise Suite',
        subscription_expires: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        permissions: session.permissions,
        is_super_admin: true,
      };

      return {
        valid: true,
        user
      };

    } catch (error) {
      console.error('Session validation error:', error);
      return {
        valid: false,
        error: 'Session validation failed'
      };
    }
  }

  // =============================================================================
  // Token Management
  // =============================================================================

  /**
   * Generate super admin token (simplified for Phase 1)
   */
  private generateSuperAdminToken(session: any): string {
    // In Phase 1, use a simple token format
    // In Phase 2, this would use proper JWT signing
    const tokenData = {
      sessionId: session.sessionId,
      userId: session.userId,
      email: session.email,
      tier: session.tier,
      isSuperAdmin: session.isSuperAdmin,
      issuedAt: session.issuedAt,
      expiresAt: session.expiresAt,
      permissions: session.permissions,
    };

    // Simple base64 encoding for Phase 1
    return Buffer.from(JSON.stringify(tokenData)).toString('base64');
  }

  /**
   * Decode super admin token
   */
  private decodeSuperAdminToken(token: string): any {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  }

  // =============================================================================
  // User Management
  // =============================================================================

  /**
   * Store super admin user (placeholder for database integration)
   */
  private async storeSuperAdminUser(user: User): Promise<void> {
    // In Phase 1, this could store in localStorage or IndexedDB
    // In Phase 2, this would integrate with the database
    try {
      localStorage.setItem('super-admin-user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store super admin user:', error);
    }
  }

  /**
   * Get stored super admin user
   */
  async getStoredSuperAdminUser(): Promise<User | null> {
    try {
      const stored = localStorage.getItem('super-admin-user');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get stored super admin user:', error);
      return null;
    }
  }

  // =============================================================================
  // Permission Checking
  // =============================================================================

  /**
   * Check if current user is super admin
   */
  isCurrentUserSuperAdmin(): boolean {
    const authStore = useAuthStore.getState();
    return isSuperAdmin(authStore.user);
  }

  /**
   * Check if current user has specific permission
   */
  hasCurrentUserPermission(permission: string): boolean {
    const authStore = useAuthStore.getState();
    return hasPermission(authStore.user, permission);
  }

  /**
   * Get current user's permissions
   */
  getCurrentUserPermissions(): string[] {
    const authStore = useAuthStore.getState();
    const user = authStore.user;
    
    if (!user) return [];
    if (isSuperAdmin(user)) return [...SUPER_ADMIN_CONFIG.permissions];
    return user.permissions || [];
  }

  // =============================================================================
  // Session Management
  // =============================================================================

  /**
   * Logout super admin
   */
  async logoutSuperAdmin(): Promise<void> {
    try {
      const authStore = useAuthStore.getState();
      authStore.logout();
      
      // Clear stored data
      localStorage.removeItem('super-admin-user');
      
    } catch (error) {
      console.error('Super admin logout error:', error);
    }
  }

  /**
   * Refresh super admin session
   */
  async refreshSuperAdminSession(): Promise<{
    success: boolean;
    token?: string;
    error?: string;
  }> {
    try {
      const authStore = useAuthStore.getState();
      const currentUser = authStore.user;

      if (!currentUser || !isSuperAdmin(currentUser)) {
        return {
          success: false,
          error: 'No valid super admin session'
        };
      }

      // Create new session
      const session = createSuperAdminSession(currentUser);
      const token = this.generateSuperAdminToken(session);

      // Update auth store
      authStore.setToken(token);

      return {
        success: true,
        token
      };

    } catch (error) {
      console.error('Session refresh error:', error);
      return {
        success: false,
        error: 'Failed to refresh session'
      };
    }
  }
}

// =============================================================================
// Export Singleton Instance
// =============================================================================

export const superAdminService = SuperAdminService.getInstance();
export default superAdminService;
