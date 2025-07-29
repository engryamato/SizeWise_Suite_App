/**
 * Browser User Repository
 * 
 * IndexedDB-based user repository for browser environment.
 * Implements UserRepository interface for offline desktop mode.
 */

import { UserRepository, User, UserTier } from '../interfaces/UserRepository';
import { BrowserDatabaseManager } from '../../database/BrowserDatabaseManager';

export class BrowserUserRepository implements UserRepository {
  private dbManager: BrowserDatabaseManager;

  constructor(dbManager: BrowserDatabaseManager) {
    this.dbManager = dbManager;
  }

  async getUser(id: string): Promise<User | null> {
    try {
      const userData = await this.dbManager.get('users', id);
      return userData ? this.mapToUser(userData) : null;
    } catch (error) {
      console.error('Failed to get user:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await this.dbManager.getByIndex('users', 'email', email);
      return users.length > 0 ? this.mapToUser(users[0]) : null;
    } catch (error) {
      console.error('Failed to get user by email:', error);
      throw error;
    }
  }

  async saveUser(user: User): Promise<void> {
    try {
      const userData = this.mapFromUser(user);
      await this.dbManager.put('users', userData);
    } catch (error) {
      console.error('Failed to save user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.dbManager.delete('users', id);
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const usersData = await this.dbManager.getAll('users');
      return usersData.map(userData => this.mapToUser(userData));
    } catch (error) {
      console.error('Failed to get all users:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // For offline mode, return the first user or create a default one
      const users = await this.getAllUsers();
      
      if (users.length > 0) {
        return users[0];
      }

      // Create default offline user
      const defaultUser: User = {
        id: 'offline-user-001',
        email: 'offline@sizewise.local',
        name: 'Offline User',
        tier: 'free',
        company: 'Local Company',
        licenseKey: 'OFFLINE-LICENSE-001',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.saveUser(defaultUser);
      return defaultUser;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  async updateUserTier(id: string, tier: UserTier): Promise<void> {
    try {
      const user = await this.getUser(id);
      if (user) {
        user.tier = tier;
        user.updatedAt = new Date();
        await this.saveUser(user);
      }
    } catch (error) {
      console.error('Failed to update user tier:', error);
      throw error;
    }
  }

  // License management methods (not implemented in browser environment)
  async validateLicense(licenseKey: string): Promise<boolean> {
    // In offline mode, always return true for basic validation
    return true;
  }

  async getLicenseInfo(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) return null;

    return {
      tier: user.tier,
      features: this.getFeaturesForTier(user.tier),
      expiresAt: undefined,
      isValid: true
    };
  }

  // Super Admin methods (not implemented in browser environment)
  async superAdminResetLicense(userId: string, superAdminSessionId: string, reason: string): Promise<void> {
    throw new Error('Super admin operations not supported in browser environment');
  }

  async superAdminRecoverUser(userId: string, superAdminSessionId: string, newTier?: UserTier, reason?: string): Promise<void> {
    throw new Error('Super admin operations not supported in browser environment');
  }

  async superAdminGetUserDetails(userId: string, superAdminSessionId: string): Promise<any> {
    throw new Error('Super admin operations not supported in browser environment');
  }

  async superAdminUpdateUserTier(userId: string, tier: UserTier, superAdminSessionId: string, reason: string): Promise<void> {
    throw new Error('Super admin operations not supported in browser environment');
  }

  async superAdminGetAllUsers(superAdminSessionId: string, filters?: any): Promise<any[]> {
    throw new Error('Super admin operations not supported in browser environment');
  }

  async superAdminLockUser(userId: string, superAdminSessionId: string, reason: string): Promise<void> {
    throw new Error('Super admin operations not supported in browser environment');
  }

  async superAdminUnlockUser(userId: string, superAdminSessionId: string, reason: string): Promise<void> {
    throw new Error('Super admin operations not supported in browser environment');
  }

  async superAdminForceTierChange(userId: string, newTier: UserTier, superAdminSessionId: string, reason: string): Promise<void> {
    throw new Error('Super admin operations not supported in browser environment');
  }

  async superAdminEmergencyUnlockAll(superAdminSessionId: string, reason: string): Promise<number> {
    throw new Error('Super admin operations not supported in browser environment');
  }

  private getFeaturesForTier(tier: UserTier): string[] {
    const tierFeatures = {
      free: ['basic_calculations', 'project_save'],
      pro: ['basic_calculations', 'project_save', 'advanced_calculations', 'export_pdf'],
      enterprise: ['basic_calculations', 'project_save', 'advanced_calculations', 'export_pdf', 'team_collaboration'],
      super_admin: ['all_features']
    };

    return tierFeatures[tier] || tierFeatures.free;
  }

  private mapToUser(userData: any): User {
    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      tier: userData.tier,
      company: userData.company,
      licenseKey: userData.licenseKey,
      createdAt: new Date(userData.createdAt),
      updatedAt: new Date(userData.updatedAt)
    };
  }

  private mapFromUser(user: User): any {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      company: user.company,
      licenseKey: user.licenseKey,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }
}
