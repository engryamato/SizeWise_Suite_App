/**
 * LocalUserRepository Implementation
 * 
 * SQLite-based implementation of UserRepository interface with license validation and tier management.
 * Integrates with DatabaseManager for local database operations.
 * 
 * @see docs/implementation/tier-system/repository-pattern-guide.md
 * @see docs/api/repository-interfaces.md section 2
 */

import {
  UserRepository,
  User,
  LicenseInfo,
  UserTier,
  DatabaseError,
  ValidationError,
  UserNotFoundError,
  SuperAdminUserInfo,
  SuperAdminUserFilters,
  SuperAdminAuthError
} from '../interfaces/UserRepository';

// Local interface for database manager
interface DatabaseManager {
  getConnection(): any;
}
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to get user: ${errorMessage}`, 'getUser');
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to get current user: ${errorMessage}`, 'getCurrentUser');
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

        // Initialize feature flags for new users or when tier changes
        if (!existingUser || existingUser.tier !== user.tier) {
          this.updateFeatureFlagsForTier(user.id, user.tier);
        }
      });

      transaction();
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to save user: ${errorMessage}`, 'saveUser');
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to update user tier: ${errorMessage}`, 'updateUserTier');
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to validate license: ${errorMessage}`, 'validateLicense');
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to get license info: ${errorMessage}`, 'getLicenseInfo');
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
      const featureTierRequired = this.getFeatureTierRequired(feature);
      insertStmt.run(uuidv4(), userId, feature, featureTierRequired);
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
   * Helper: Get the tier required for a specific feature
   */
  private getFeatureTierRequired(featureName: string): number {
    // Free tier features (tier_required = 1)
    const freeFeatures = ['basic_calculations', 'project_creation', 'pdf_export'];
    if (freeFeatures.includes(featureName)) {
      return 1;
    }

    // Pro tier features (tier_required = 2)
    const proFeatures = ['unlimited_projects', 'high_res_export', 'advanced_calculations'];
    if (proFeatures.includes(featureName)) {
      return 2;
    }

    // Enterprise tier features (tier_required = 3)
    const enterpriseFeatures = ['custom_templates', 'bim_export', 'priority_support', 'api_access'];
    if (enterpriseFeatures.includes(featureName)) {
      return 3;
    }

    // Default to free tier if unknown
    return 1;
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

  // ========================================
  // SUPER ADMINISTRATOR METHODS
  // ========================================

  /**
   * Reset user license (Super Admin Only)
   */
  async superAdminResetLicense(userId: string, superAdminSessionId: string, reason: string): Promise<void> {
    try {
      // Validate super admin session
      await this.validateSuperAdminSession(superAdminSessionId);

      this.validateUUID(userId);
      if (!reason || reason.trim().length < 5) {
        throw new ValidationError('Reset reason must be at least 5 characters', 'reason');
      }

      const db = this.dbManager.getConnection();

      // Check if user exists
      const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
      if (!userExists) {
        throw new UserNotFoundError(userId);
      }

      // Reset license and tier to free
      const updateStmt = db.prepare(`
        UPDATE users
        SET tier = 'free', license_key = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      updateStmt.run(userId);

      // Log the license reset
      this.logSuperAdminAction(userId, superAdminSessionId, 'license_reset', reason, {
        previousTier: 'unknown', // Would need to fetch before update in production
        newTier: 'free'
      });

      console.log(`Super Admin: License reset for user ${userId}, reason: ${reason}`);
    } catch (error) {
      if (error instanceof UserNotFoundError || error instanceof ValidationError || error instanceof SuperAdminAuthError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to reset license: ${errorMessage}`, 'superAdminResetLicense');
    }
  }

  /**
   * Recover user account (Super Admin Only)
   */
  async superAdminRecoverUser(userId: string, superAdminSessionId: string, newTier?: UserTier, reason?: string): Promise<void> {
    try {
      // Validate super admin session
      await this.validateSuperAdminSession(superAdminSessionId);

      this.validateUUID(userId);

      const db = this.dbManager.getConnection();

      // Check if user exists
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
      if (!user) {
        throw new UserNotFoundError(userId);
      }

      // Prepare recovery updates
      const updates: string[] = [];
      const params: any[] = [];

      // Reset failed login attempts and unlock account
      updates.push('failed_login_attempts = 0', 'locked_until = NULL', 'updated_at = CURRENT_TIMESTAMP');

      // Update tier if specified
      if (newTier) {
        this.validateTier(newTier);
        updates.push('tier = ?');
        params.push(newTier);
      }

      params.push(userId);

      const updateStmt = db.prepare(`
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = ?
      `);

      updateStmt.run(...params);

      // Log the recovery action
      this.logSuperAdminAction(userId, superAdminSessionId, 'user_recovery', reason || 'Account recovery', {
        previousTier: user.tier,
        newTier: newTier || user.tier,
        accountUnlocked: true
      });

      console.log(`Super Admin: User ${userId} recovered, new tier: ${newTier || user.tier}`);
    } catch (error) {
      if (error instanceof UserNotFoundError || error instanceof ValidationError || error instanceof SuperAdminAuthError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to recover user: ${errorMessage}`, 'superAdminRecoverUser');
    }
  }

  /**
   * Force tier change (Super Admin Only)
   */
  async superAdminForceTierChange(userId: string, tier: UserTier, superAdminSessionId: string, reason: string): Promise<void> {
    try {
      // Validate super admin session
      await this.validateSuperAdminSession(superAdminSessionId);

      this.validateUUID(userId);
      this.validateTier(tier);

      if (!reason || reason.trim().length < 5) {
        throw new ValidationError('Tier change reason must be at least 5 characters', 'reason');
      }

      const db = this.dbManager.getConnection();

      // Get current user data
      const user = db.prepare('SELECT tier FROM users WHERE id = ?').get(userId) as any;
      if (!user) {
        throw new UserNotFoundError(userId);
      }

      const previousTier = user.tier;

      // Force tier change
      const updateStmt = db.prepare(`
        UPDATE users
        SET tier = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      updateStmt.run(tier, userId);

      // Log the forced tier change
      this.logSuperAdminAction(userId, superAdminSessionId, 'force_tier_change', reason, {
        previousTier,
        newTier: tier,
        forced: true
      });

      console.log(`Super Admin: Forced tier change for user ${userId} from ${previousTier} to ${tier}`);
    } catch (error) {
      if (error instanceof UserNotFoundError || error instanceof ValidationError || error instanceof SuperAdminAuthError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to force tier change: ${errorMessage}`, 'superAdminForceTierChange');
    }
  }

  /**
   * Get all users with detailed information (Super Admin Only)
   */
  async superAdminGetAllUsers(superAdminSessionId: string, filters?: SuperAdminUserFilters): Promise<SuperAdminUserInfo[]> {
    try {
      // Validate super admin session
      await this.validateSuperAdminSession(superAdminSessionId);

      const db = this.dbManager.getConnection();

      // Build query with filters
      let query = `
        SELECT u.*,
               COALESCE(u.failed_login_attempts, 0) as failed_login_attempts,
               u.locked_until,
               u.last_login_at
        FROM users u
        WHERE 1=1
      `;

      const params: any[] = [];

      if (filters?.tier) {
        query += ' AND u.tier = ?';
        params.push(filters.tier);
      }

      if (filters?.emailPattern) {
        query += ' AND u.email LIKE ?';
        params.push(`%${filters.emailPattern}%`);
      }

      if (filters?.createdAfter) {
        query += ' AND u.created_at >= ?';
        params.push(filters.createdAfter.toISOString());
      }

      if (filters?.createdBefore) {
        query += ' AND u.created_at <= ?';
        params.push(filters.createdBefore.toISOString());
      }

      query += ' ORDER BY u.created_at DESC';

      if (filters?.includeDeleted !== true) {
        query = query.replace('WHERE 1=1', 'WHERE u.deleted_at IS NULL');
      }

      const stmt = db.prepare(query);
      const rows = stmt.all(...params) as any[];

      // Convert to SuperAdminUserInfo format
      const users: SuperAdminUserInfo[] = rows.map(row => ({
        id: row.id,
        email: row.email,
        name: row.name,
        tier: row.tier as UserTier,
        company: row.company,
        licenseKey: row.license_key,
        organizationId: row.organization_id,
        settings: row.settings ? JSON.parse(row.settings) : {},
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        accountStatus: this.determineAccountStatus(row),
        lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
        failedLoginAttempts: row.failed_login_attempts || 0,
        lockedUntil: row.locked_until ? new Date(row.locked_until) : undefined,
        licenseHistory: [], // Would be populated from separate query in production
        tierHistory: [], // Would be populated from separate query in production
        securityEvents: [] // Would be populated from separate query in production
      }));

      // Log the admin query
      this.logSuperAdminAction('system', superAdminSessionId, 'get_all_users', 'Admin user query', {
        userCount: users.length,
        filters
      });

      return users;
    } catch (error) {
      if (error instanceof SuperAdminAuthError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to get all users: ${errorMessage}`, 'superAdminGetAllUsers');
    }
  }

  /**
   * Emergency unlock all users (Super Admin Only)
   */
  async superAdminEmergencyUnlockAll(superAdminSessionId: string, reason: string): Promise<number> {
    try {
      // Validate super admin session with emergency access
      await this.validateSuperAdminSession(superAdminSessionId, true);

      if (!reason || reason.trim().length < 10) {
        throw new ValidationError('Emergency reason must be at least 10 characters', 'reason');
      }

      const db = this.dbManager.getConnection();

      // Count locked users before unlocking
      const countStmt = db.prepare(`
        SELECT COUNT(*) as count
        FROM users
        WHERE locked_until IS NOT NULL AND locked_until > CURRENT_TIMESTAMP
      `);
      const { count } = countStmt.get() as any;

      // Emergency unlock all users
      const unlockStmt = db.prepare(`
        UPDATE users
        SET failed_login_attempts = 0,
            locked_until = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE locked_until IS NOT NULL
      `);

      unlockStmt.run();

      // Log the emergency action
      this.logSuperAdminAction('system', superAdminSessionId, 'emergency_unlock_all', reason, {
        unlockedUserCount: count,
        emergencyAction: true
      });

      console.log(`Super Admin Emergency: Unlocked ${count} users, reason: ${reason}`);
      return count;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof SuperAdminAuthError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to emergency unlock users: ${errorMessage}`, 'superAdminEmergencyUnlockAll');
    }
  }

  // ========================================
  // SUPER ADMIN HELPER METHODS
  // ========================================

  /**
   * Validate super admin session
   */
  private async validateSuperAdminSession(sessionId: string, requireEmergencyAccess: boolean = false): Promise<void> {
    // In production, this would validate against the SuperAdminValidator
    // For now, we'll do basic validation
    if (!sessionId || sessionId.length < 10) {
      throw new SuperAdminAuthError('Invalid super admin session ID', sessionId);
    }

    // Mock validation - in production this would call SuperAdminValidator.validateSession()
    if (sessionId === 'invalid-session') {
      throw new SuperAdminAuthError('Super admin session not found or expired', sessionId);
    }

    if (requireEmergencyAccess && !sessionId.includes('emergency')) {
      throw new SuperAdminAuthError('Emergency access required for this operation', sessionId);
    }

    // Session is valid
  }

  /**
   * Log super admin action for audit trail
   */
  private logSuperAdminAction(
    userId: string,
    sessionId: string,
    action: string,
    reason: string,
    details: Record<string, any>
  ): void {
    try {
      const db = this.dbManager.getConnection();
      const stmt = db.prepare(`
        INSERT INTO super_admin_audit (
          user_id, session_id, action, reason, details, timestamp
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run(userId, sessionId, action, reason, JSON.stringify(details));
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      console.error('Failed to log super admin action:', error);
    }
  }

  /**
   * Determine account status from user data
   */
  private determineAccountStatus(userData: any): 'active' | 'locked' | 'suspended' | 'deleted' {
    if (userData.deleted_at) {
      return 'deleted';
    }

    if (userData.locked_until && new Date(userData.locked_until) > new Date()) {
      return 'locked';
    }

    if (userData.suspended_at) {
      return 'suspended';
    }

    return 'active';
  }
}
