/**
 * FeatureFlagRepository Interface
 * 
 * Repository interface for feature flag data management with tier-based support.
 * Supports both local SQLite (offline) and cloud API (SaaS) implementations.
 * 
 * @see docs/api/repository-interfaces.md section 3
 * @see docs/implementation/tier-system/feature-flag-implementation.md
 */

/**
 * User tier enumeration for tier-based feature enforcement
 */
export type UserTier = 'free' | 'pro' | 'enterprise';

/**
 * Feature flag entity interface
 */
export interface FeatureFlag {
  /** UUID primary key */
  id: string;
  /** User ID for user-specific flags (null for global flags) */
  userId?: string;
  /** Name of the feature flag */
  featureName: string;
  /** Whether the feature is enabled */
  enabled: boolean;
  /** Minimum tier required for this feature */
  tierRequired: UserTier;
  /** Optional expiration date */
  expiresAt?: Date;
  /** Flag creation timestamp */
  createdAt: Date;
}

/**
 * Repository interface for feature flag data operations with tier-based queries
 */
export interface FeatureFlagRepository {
  /**
   * Get specific feature flag for user
   * 
   * Lookup order:
   * 1. User-specific flag
   * 2. Global flag
   * 3. null if neither exists
   * 
   * @param userId - UUID of the user (null for global flags)
   * @param featureName - Name of the feature flag
   * @returns Promise resolving to FeatureFlag if found, null otherwise
   * @throws {DatabaseError} If query fails
   * @throws {ValidationError} If parameters are invalid
   */
  getFeatureFlag(userId: string | null, featureName: string): Promise<FeatureFlag | null>;

  /**
   * Get all feature flags for a specific user
   * 
   * @param userId - UUID of the user
   * @returns Promise resolving to array of user's feature flags
   * @throws {UserNotFoundError} If user doesn't exist
   * @throws {DatabaseError} If query fails
   */
  getUserFlags(userId: string): Promise<FeatureFlag[]>;

  /**
   * Get all global feature flags
   * 
   * @returns Promise resolving to array of global feature flags
   * @throws {DatabaseError} If query fails
   */
  getGlobalFlags(): Promise<FeatureFlag[]>;

  /**
   * Create or update a feature flag
   * 
   * Validation rules:
   * - featureName must be non-empty
   * - tierRequired must be valid tier
   * - userId must exist if specified
   * - expiresAt must be future date if specified
   * 
   * @param flag - Complete feature flag object
   * @returns Promise resolving when save operation completes
   * @throws {ValidationError} If flag data is invalid
   * @throws {UserNotFoundError} If userId doesn't exist
   * @throws {DatabaseError} If save operation fails
   */
  setFeatureFlag(flag: FeatureFlag): Promise<void>;

  /**
   * Remove a feature flag for a user
   * 
   * @param userId - UUID of the user
   * @param featureName - Name of the feature flag to remove
   * @returns Promise resolving when removal completes
   * @throws {UserNotFoundError} If user doesn't exist
   * @throws {DatabaseError} If removal fails
   */
  removeFeatureFlag(userId: string, featureName: string): Promise<void>;

  /**
   * Get all feature flags available for a specific tier
   * 
   * Returns flags where tierRequired <= specified tier
   * (e.g., 'pro' tier gets 'free' and 'pro' flags)
   * 
   * @param tier - Tier to get flags for
   * @returns Promise resolving to array of feature flags for the tier
   * @throws {ValidationError} If tier is invalid
   * @throws {DatabaseError} If query fails
   */
  getFlagsForTier(tier: UserTier): Promise<FeatureFlag[]>;
}

/**
 * Standard error types for repository operations
 */

/**
 * Database operation error
 */
export class DatabaseError extends Error {
  constructor(message: string, public readonly operation: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Data validation error
 */
export class ValidationError extends Error {
  constructor(message: string, public readonly field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * User not found error
 */
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}
