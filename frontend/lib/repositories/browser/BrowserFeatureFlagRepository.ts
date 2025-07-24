/**
 * Browser Feature Flag Repository
 * 
 * IndexedDB-based feature flag repository for browser environment.
 * Implements FeatureFlagRepository interface for offline desktop mode.
 */

import { FeatureFlagRepository } from '../interfaces/FeatureFlagRepository';
import { FeatureFlag } from '../interfaces/FeatureFlagRepository';
import { BrowserDatabaseManager } from '../../database/BrowserDatabaseManager';

export class BrowserFeatureFlagRepository implements FeatureFlagRepository {
  private dbManager: BrowserDatabaseManager;

  constructor(dbManager: BrowserDatabaseManager) {
    this.dbManager = dbManager;
  }

  async getFeatureFlag(featureName: string, userId?: string): Promise<FeatureFlag | null> {
    try {
      // First try to get user-specific flag
      if (userId) {
        const userFlags = await this.dbManager.getByIndex('feature_flags', 'userId', userId);
        const userFlag = userFlags.find(flag => flag.featureName === featureName);
        if (userFlag) {
          return this.mapToFeatureFlag(userFlag);
        }
      }

      // Fall back to global flag
      const globalFlags = await this.dbManager.getByIndex('feature_flags', 'userId', null);
      const globalFlag = globalFlags.find(flag => flag.featureName === featureName);
      return globalFlag ? this.mapToFeatureFlag(globalFlag) : null;
    } catch (error) {
      console.error('Failed to get feature flag:', error);
      throw error;
    }
  }

  async saveFeatureFlag(featureFlag: FeatureFlag): Promise<void> {
    try {
      const flagData = this.mapFromFeatureFlag(featureFlag);
      await this.dbManager.put('feature_flags', flagData);
    } catch (error) {
      console.error('Failed to save feature flag:', error);
      throw error;
    }
  }

  async deleteFeatureFlag(id: string): Promise<void> {
    try {
      await this.dbManager.delete('feature_flags', id);
    } catch (error) {
      console.error('Failed to delete feature flag:', error);
      throw error;
    }
  }

  async getFeatureFlagsByUser(userId: string): Promise<FeatureFlag[]> {
    try {
      const flagsData = await this.dbManager.getByIndex('feature_flags', 'userId', userId);
      return flagsData.map(flagData => this.mapToFeatureFlag(flagData));
    } catch (error) {
      console.error('Failed to get feature flags by user:', error);
      throw error;
    }
  }

  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      const flagsData = await this.dbManager.getAll('feature_flags');
      return flagsData.map(flagData => this.mapToFeatureFlag(flagData));
    } catch (error) {
      console.error('Failed to get all feature flags:', error);
      throw error;
    }
  }

  async getGlobalFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      const flagsData = await this.dbManager.getByIndex('feature_flags', 'userId', null);
      return flagsData.map(flagData => this.mapToFeatureFlag(flagData));
    } catch (error) {
      console.error('Failed to get global feature flags:', error);
      throw error;
    }
  }

  async bulkSaveFeatureFlags(featureFlags: FeatureFlag[]): Promise<void> {
    try {
      for (const flag of featureFlags) {
        await this.saveFeatureFlag(flag);
      }
    } catch (error) {
      console.error('Failed to bulk save feature flags:', error);
      throw error;
    }
  }

  async enableFeature(featureName: string, userId?: string): Promise<void> {
    try {
      const existingFlag = await this.getFeatureFlag(featureName, userId);
      
      if (existingFlag) {
        existingFlag.enabled = true;
        existingFlag.updatedAt = new Date();
        await this.saveFeatureFlag(existingFlag);
      } else {
        // Create new flag
        const newFlag: FeatureFlag = {
          id: `flag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: userId || null,
          organizationId: null,
          featureName,
          enabled: true,
          tierRequired: 'free',
          expiresAt: null,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await this.saveFeatureFlag(newFlag);
      }
    } catch (error) {
      console.error('Failed to enable feature:', error);
      throw error;
    }
  }

  async disableFeature(featureName: string, userId?: string): Promise<void> {
    try {
      const existingFlag = await this.getFeatureFlag(featureName, userId);
      
      if (existingFlag) {
        existingFlag.enabled = false;
        existingFlag.updatedAt = new Date();
        await this.saveFeatureFlag(existingFlag);
      }
    } catch (error) {
      console.error('Failed to disable feature:', error);
      throw error;
    }
  }

  private mapToFeatureFlag(flagData: any): FeatureFlag {
    return {
      id: flagData.id,
      userId: flagData.userId,
      organizationId: flagData.organizationId,
      featureName: flagData.featureName,
      enabled: flagData.enabled,
      tierRequired: flagData.tierRequired,
      expiresAt: flagData.expiresAt ? new Date(flagData.expiresAt) : null,
      metadata: flagData.metadata || {},
      createdAt: new Date(flagData.createdAt),
      updatedAt: new Date(flagData.updatedAt)
    };
  }

  private mapFromFeatureFlag(flag: FeatureFlag): any {
    return {
      id: flag.id,
      userId: flag.userId,
      organizationId: flag.organizationId,
      featureName: flag.featureName,
      enabled: flag.enabled,
      tierRequired: flag.tierRequired,
      expiresAt: flag.expiresAt ? flag.expiresAt.toISOString() : null,
      metadata: flag.metadata,
      createdAt: flag.createdAt.toISOString(),
      updatedAt: flag.updatedAt.toISOString()
    };
  }
}
