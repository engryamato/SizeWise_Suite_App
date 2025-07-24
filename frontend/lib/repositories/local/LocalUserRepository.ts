/**
 * LocalUserRepository Implementation
 * 
 * SQLite-based implementation of UserRepository interface with license validation and tier management.
 * Integrates with DatabaseManager for local database operations.
 * 
 * @see docs/implementation/tier-system/repository-pattern-guide.md
 * @see docs/api/repository-interfaces.md section 2
 */

import { DatabaseManager } from '../../../../backend/database/DatabaseManager';
import {
  UserRepository,
  User,
  LicenseInfo,
  UserTier,
  DatabaseError,
  ValidationError,
  UserNotFoundError
} from '../interfaces/UserRepository';
import { v4 as uuidv4 } from 'uuid';

/**
 * Local SQLite implementation of UserRepository
 */
export class LocalUserRepository implements UserRepository {
  private readonly dbManager: DatabaseManager;

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
  }

  /**
   * Retrieve user by ID
   */
  async getUser(id: string): Promise<User | null> {
    try {
      this.validateUUID(id);
      
      const db = this.dbManager.getConnection();
      const stmt = db.prepare(`
        SELECT id, email, name, tier, company, license_key, 
               organization_id, settings, created_at, updated_at
        FROM users 
        WHERE id = ?
      `);
      
      const row = stmt.get(id) as any;
      if (!row) {
        return null;
      }

      return this.mapRowToUser(row);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get user: ${error.message}`, 'getUser');
    }
  }

  /**
   * Get the currently authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const db = this.dbManager.getConnection();
      
      // In offline mode, return the first user in the database
      // In SaaS mode, this would use authentication context
      const stmt = db.prepare(`
        SELECT id, email, name, tier, company, license_key, 
               organization_id, settings, created_at, updated_at
        FROM users 
        ORDER BY created_at ASC 
        LIMIT 1
      `);
      
      const row = stmt.get() as any;
      if (!row) {
        return null;
      }

      return this.mapRowToUser(row);
    } catch (error) {
      throw new DatabaseError(`Failed to get current user: ${error.message}`, 'getCurrentUser');
    }
  }

  /**
   * Create or update a user
   */
  async saveUser(user: User): Promise<void> {
    try {
      this.validateUser(user);
      
      const db = this.dbManager.getConnection();
      const existingUser = await this.getUser(user.id);
      
      const transaction = db.transaction(() => {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO users (
            id, email, name, tier, company, license_key, 
            organization_id, settings, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          user.id,
          user.email,
          user.name || null,
          user.tier,
          user.company || null,
          user.licenseKey || null,
          null, // organization_id for future use
          null, // settings for future use
          existingUser ? existingUser.createdAt.toISOString() : new Date().toISOString(),
          new Date().toISOString()
        );

        // Log change for cloud sync
        this.logChange(user.id, 'user', user.id, existingUser ? 'UPDATE' : 'INSERT', user);
      });

      transaction();
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to save user: ${error.message}`, 'saveUser');
    }
  }

  /**
   * Update user's tier (for license upgrades/downgrades)
   */
  async updateUserTier(userId: string, tier: UserTier): Promise<void> {
    try {
      this.validateUUID(userId);
      this.validateTier(tier);
      
      const user = await this.getUser(userId);
      if (!user) {
        throw new UserNotFoundError(userId);
      }

      const db = this.dbManager.getConnection();
      const transaction = db.transaction(() => {
        // Update user tier
        const userStmt = db.prepare(`
          UPDATE users SET tier = ?, updated_at = ? WHERE id = ?
        `);
        userStmt.run(tier, new Date().toISOString(), userId);

        // Log tier change
        this.logChange(userId, 'user', userId, 'UPDATE', { 
          previousTier: user.tier, 
          newTier: tier,
          updatedAt: new Date().toISOString()
        });

        // Update feature flags based on new tier
        this.updateFeatureFlagsForTier(userId, tier);
      });

      transaction();
    } catch (error) {
      if (error instanceof ValidationError || error instanceof UserNotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update user tier: ${error.message}`, 'updateUserTier');
    }
  }

  /**
   * Validate a license key
   */
  async validateLicense(licenseKey: string): Promise<boolean> {
    try {
      if (!licenseKey || licenseKey.trim().length === 0) {
        return false;
      }

      // Basic license key validation
      // In production, this would use cryptographic signature validation
      const licensePattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
      if (!licensePattern.test(licenseKey)) {
        return false;
      }

      // Check if license exists in database
      const db = this.dbManager.getConnection();
      const stmt = db.prepare(`
        SELECT id FROM users WHERE license_key = ?
      `);
      
      const result = stmt.get(licenseKey);
      return result !== undefined;
    } catch (error) {
      throw new DatabaseError(`Failed to validate license: ${error.message}`, 'validateLicense');
    }
  }

  /**
   * Get license information for a user
   */
  async getLicenseInfo(userId: string): Promise<LicenseInfo | null> {
    try {
      this.validateUUID(userId);
      
      const user = await this.getUser(userId);
      if (!user) {
        throw new UserNotFoundError(userId);
      }

      // Get enabled features for user's tier
      const features = await this.getFeaturesForTier(user.tier);
      
      return {
        tier: user.tier,
        features,
        expiresAt: undefined, // No expiration for offline licenses
        isValid: user.licenseKey ? await this.validateLicense(user.licenseKey) : true
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof UserNotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get license info: ${error.message}`, 'getLicenseInfo');
    }
  }

  /**
   * Helper: Map database row to User object
   */
  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name || undefined,
      tier: row.tier as UserTier,
      company: row.company || undefined,
      licenseKey: row.license_key || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
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
   * Helper: Validate user object
   */
  private validateUser(user: User): void {
    if (!user.id) {
      throw new ValidationError('User ID is required', 'id');
    }
    if (!user.email || user.email.trim().length === 0) {
      throw new ValidationError('Email is required', 'email');
    }
    if (!this.isValidEmail(user.email)) {
      throw new ValidationError('Invalid email format', 'email');
    }
    if (!user.tier) {
      throw new ValidationError('User tier is required', 'tier');
    }
    
    this.validateUUID(user.id);
    this.validateTier(user.tier);
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
   * Helper: Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Helper: Get features available for a tier
   */
  private async getFeaturesForTier(tier: UserTier): Promise<string[]> {
    const db = this.dbManager.getConnection();
    const stmt = db.prepare(`
      SELECT DISTINCT feature_name 
      FROM feature_flags 
      WHERE tier_required <= ? AND enabled = 1
      ORDER BY feature_name
    `);
    
    // Map tier to numeric value for comparison
    const tierValue = this.getTierValue(tier);
    const rows = stmt.all(tierValue) as { feature_name: string }[];
    
    return rows.map(row => row.feature_name);
  }

  /**
   * Helper: Update feature flags when user tier changes
   */
  private updateFeatureFlagsForTier(userId: string, tier: UserTier): void {
    const db = this.dbManager.getConnection();
    
    // Remove user-specific flags that are no longer available
    const removeStmt = db.prepare(`
      DELETE FROM feature_flags 
      WHERE user_id = ? AND tier_required > ?
    `);
    
    const tierValue = this.getTierValue(tier);
    removeStmt.run(userId, tierValue);
    
    // Add default flags for new tier if they don't exist
    const defaultFeatures = this.getDefaultFeaturesForTier(tier);
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO feature_flags (id, user_id, feature_name, enabled, tier_required)
      VALUES (?, ?, ?, 1, ?)
    `);
    
    for (const feature of defaultFeatures) {
      insertStmt.run(uuidv4(), userId, feature, tierValue);
    }
  }

  /**
   * Helper: Get default features for a tier
   */
  private getDefaultFeaturesForTier(tier: UserTier): string[] {
    const features: string[] = [];
    
    // Free tier features
    features.push('basic_calculations', 'project_creation', 'pdf_export');
    
    if (tier === 'pro' || tier === 'enterprise') {
      features.push('unlimited_projects', 'high_res_export', 'advanced_calculations');
    }
    
    if (tier === 'enterprise') {
      features.push('custom_templates', 'bim_export', 'priority_support', 'api_access');
    }
    
    return features;
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
