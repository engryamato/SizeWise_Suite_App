/**
 * LocalFeatureFlagRepository Implementation
 * 
 * SQLite-based implementation of FeatureFlagRepository interface with tier-based feature management.
 * Supports both user-specific and global feature flags.
 * 
 * @see docs/implementation/tier-system/feature-flag-implementation.md
 * @see docs/api/repository-interfaces.md section 3
 */

import { DatabaseManager } from '../../../../backend/database/DatabaseManager';
import {
  FeatureFlagRepository,
  FeatureFlag,
  UserTier,
  DatabaseError,
  ValidationError,
  UserNotFoundError
} from '../interfaces/FeatureFlagRepository';

/**
 * Local SQLite implementation of FeatureFlagRepository
 */
export class LocalFeatureFlagRepository implements FeatureFlagRepository {
  private readonly dbManager: DatabaseManager;

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
  }

  /**
   * Get specific feature flag for user
   * Lookup order: 1. User-specific flag, 2. Global flag, 3. null
   */
  async getFeatureFlag(userId: string | null, featureName: string): Promise<FeatureFlag | null> {
    try {
      if (userId) {
        this.validateUUID(userId);
      }
      this.validateFeatureName(featureName);
      
      const db = this.dbManager.getConnection();
      
      // First, try to get user-specific flag
      if (userId) {
        const userStmt = db.prepare(`
          SELECT id, user_id, organization_id, feature_name, enabled, 
                 tier_required, expires_at, metadata, created_at, updated_at
          FROM feature_flags 
          WHERE user_id = ? AND feature_name = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
        `);
        
        const userRow = userStmt.get(userId, featureName) as any;
        if (userRow) {
          return this.mapRowToFeatureFlag(userRow);
        }
      }
      
      // If no user-specific flag, try global flag
      const globalStmt = db.prepare(`
        SELECT id, user_id, organization_id, feature_name, enabled, 
               tier_required, expires_at, metadata, created_at, updated_at
        FROM feature_flags 
        WHERE user_id IS NULL AND organization_id IS NULL AND feature_name = ? 
        AND (expires_at IS NULL OR expires_at > datetime('now'))
      `);
      
      const globalRow = globalStmt.get(featureName) as any;
      if (globalRow) {
        return this.mapRowToFeatureFlag(globalRow);
      }
      
      return null;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get feature flag: ${error.message}`, 'getFeatureFlag');
    }
  }

  /**
   * Get all feature flags for a specific user
   */
  async getUserFlags(userId: string): Promise<FeatureFlag[]> {
    try {
      this.validateUUID(userId);
      await this.validateUserExists(userId);
      
      const db = this.dbManager.getConnection();
      const stmt = db.prepare(`
        SELECT id, user_id, organization_id, feature_name, enabled, 
               tier_required, expires_at, metadata, created_at, updated_at
        FROM feature_flags 
        WHERE user_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
        ORDER BY feature_name
      `);
      
      const rows = stmt.all(userId) as any[];
      return rows.map(row => this.mapRowToFeatureFlag(row));
    } catch (error) {
      if (error instanceof ValidationError || error instanceof UserNotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get user flags: ${error.message}`, 'getUserFlags');
    }
  }

  /**
   * Get all global feature flags
   */
  async getGlobalFlags(): Promise<FeatureFlag[]> {
    try {
      const db = this.dbManager.getConnection();
      const stmt = db.prepare(`
        SELECT id, user_id, organization_id, feature_name, enabled, 
               tier_required, expires_at, metadata, created_at, updated_at
        FROM feature_flags 
        WHERE user_id IS NULL AND organization_id IS NULL 
        AND (expires_at IS NULL OR expires_at > datetime('now'))
        ORDER BY feature_name
      `);
      
      const rows = stmt.all() as any[];
      return rows.map(row => this.mapRowToFeatureFlag(row));
    } catch (error) {
      throw new DatabaseError(`Failed to get global flags: ${error.message}`, 'getGlobalFlags');
    }
  }

  /**
   * Create or update a feature flag
   */
  async setFeatureFlag(flag: FeatureFlag): Promise<void> {
    try {
      this.validateFeatureFlag(flag);
      
      if (flag.userId) {
        await this.validateUserExists(flag.userId);
      }
      
      const db = this.dbManager.getConnection();
      const existingFlag = await this.getFeatureFlag(flag.userId, flag.featureName);
      
      const transaction = db.transaction(() => {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO feature_flags (
            id, user_id, organization_id, feature_name, enabled, 
            tier_required, expires_at, metadata, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          flag.id,
          flag.userId || null,
          null, // organization_id for future use
          flag.featureName,
          flag.enabled ? 1 : 0,
          flag.tierRequired,
          flag.expiresAt ? flag.expiresAt.toISOString() : null,
          null, // metadata for future use
          existingFlag ? existingFlag.createdAt.toISOString() : new Date().toISOString(),
          new Date().toISOString()
        );

        // Log change for cloud sync
        if (flag.userId) {
          this.logChange(flag.userId, 'feature_flag', flag.id, existingFlag ? 'UPDATE' : 'INSERT', flag);
        }
      });

      transaction();
    } catch (error) {
      if (error instanceof ValidationError || error instanceof UserNotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to set feature flag: ${error.message}`, 'setFeatureFlag');
    }
  }

  /**
   * Remove a feature flag for a user
   */
  async removeFeatureFlag(userId: string, featureName: string): Promise<void> {
    try {
      this.validateUUID(userId);
      this.validateFeatureName(featureName);
      await this.validateUserExists(userId);
      
      const db = this.dbManager.getConnection();
      const transaction = db.transaction(() => {
        const stmt = db.prepare(`
          DELETE FROM feature_flags 
          WHERE user_id = ? AND feature_name = ?
        `);
        
        const result = stmt.run(userId, featureName);
        
        if (result.changes > 0) {
          // Log change for cloud sync
          this.logChange(userId, 'feature_flag', `${userId}-${featureName}`, 'DELETE', { 
            userId, 
            featureName 
          });
        }
      });

      transaction();
    } catch (error) {
      if (error instanceof ValidationError || error instanceof UserNotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to remove feature flag: ${error.message}`, 'removeFeatureFlag');
    }
  }

  /**
   * Get all feature flags available for a specific tier
   */
  async getFlagsForTier(tier: UserTier): Promise<FeatureFlag[]> {
    try {
      this.validateTier(tier);
      
      const db = this.dbManager.getConnection();
      const stmt = db.prepare(`
        SELECT id, user_id, organization_id, feature_name, enabled, 
               tier_required, expires_at, metadata, created_at, updated_at
        FROM feature_flags 
        WHERE tier_required <= ? AND (expires_at IS NULL OR expires_at > datetime('now'))
        ORDER BY tier_required, feature_name
      `);
      
      // Map tier to numeric value for comparison
      const tierValue = this.getTierValue(tier);
      const rows = stmt.all(tierValue) as any[];
      
      return rows.map(row => this.mapRowToFeatureFlag(row));
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get flags for tier: ${error.message}`, 'getFlagsForTier');
    }
  }

  /**
   * Helper: Map database row to FeatureFlag object
   */
  private mapRowToFeatureFlag(row: any): FeatureFlag {
    return {
      id: row.id,
      userId: row.user_id || undefined,
      featureName: row.feature_name,
      enabled: Boolean(row.enabled),
      tierRequired: row.tier_required as UserTier,
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      createdAt: new Date(row.created_at)
    };
  }

  /**
   * Helper: Validate UUID format
   */
  private validateUUID(id: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new ValidationError('Invalid UUID format', 'id');
    }
  }

  /**
   * Helper: Validate feature name
   */
  private validateFeatureName(featureName: string): void {
    if (!featureName || featureName.trim().length === 0) {
      throw new ValidationError('Feature name is required', 'featureName');
    }
    if (featureName.length > 100) {
      throw new ValidationError('Feature name too long (max 100 characters)', 'featureName');
    }
    if (!/^[a-z0-9_]+$/.test(featureName)) {
      throw new ValidationError('Feature name must contain only lowercase letters, numbers, and underscores', 'featureName');
    }
  }

  /**
   * Helper: Validate tier value
   */
  private validateTier(tier: UserTier): void {
    const validTiers: UserTier[] = ['free', 'pro', 'enterprise'];
    if (!validTiers.includes(tier)) {
      throw new ValidationError(`Invalid tier: ${tier}. Must be one of: ${validTiers.join(', ')}`, 'tier');
    }
  }

  /**
   * Helper: Validate feature flag object
   */
  private validateFeatureFlag(flag: FeatureFlag): void {
    if (!flag.id) {
      throw new ValidationError('Feature flag ID is required', 'id');
    }
    if (!flag.featureName) {
      throw new ValidationError('Feature name is required', 'featureName');
    }
    if (!flag.tierRequired) {
      throw new ValidationError('Tier required is required', 'tierRequired');
    }
    if (flag.expiresAt && flag.expiresAt <= new Date()) {
      throw new ValidationError('Expiration date must be in the future', 'expiresAt');
    }
    
    this.validateUUID(flag.id);
    if (flag.userId) {
      this.validateUUID(flag.userId);
    }
    this.validateFeatureName(flag.featureName);
    this.validateTier(flag.tierRequired);
  }

  /**
   * Helper: Get numeric value for tier comparison
   */
  private getTierValue(tier: UserTier): number {
    switch (tier) {
      case 'free': return 1;
      case 'pro': return 2;
      case 'enterprise': return 3;
      default: throw new ValidationError(`Invalid tier: ${tier}`, 'tier');
    }
  }

  /**
   * Helper: Validate user exists
   */
  private async validateUserExists(userId: string): Promise<void> {
    const db = this.dbManager.getConnection();
    const stmt = db.prepare('SELECT id FROM users WHERE id = ?');
    const user = stmt.get(userId);
    
    if (!user) {
      throw new UserNotFoundError(userId);
    }
  }

  /**
   * Helper: Log change for cloud sync
   */
  private logChange(userId: string, entityType: string, entityId: string, operation: string, changes: any): void {
    const db = this.dbManager.getConnection();
    const stmt = db.prepare(`
      INSERT INTO change_log (user_id, entity_type, entity_id, operation, changes)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(userId, entityType, entityId, operation, JSON.stringify(changes));
  }
}
