/**
 * Browser User Repository
 * 
 * IndexedDB-based user repository for browser environment.
 * Implements UserRepository interface for offline desktop mode.
 */

import { UserRepository } from '../interfaces/UserRepository';
import { User, UserTier } from '../interfaces/UserRepository';
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
        organizationId: null,
        settings: {
          theme: 'system',
          units: 'imperial',
          autoSave: true
        },
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

  private mapToUser(userData: any): User {
    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      tier: userData.tier,
      company: userData.company,
      licenseKey: userData.licenseKey,
      organizationId: userData.organizationId,
      settings: userData.settings || {},
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
      organizationId: user.organizationId,
      settings: user.settings,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }
}
