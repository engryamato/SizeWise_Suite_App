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
export type UserTier = 'free' | 'pro' | 'enterprise' | 'super_admin';

/**
 * Feature flag entity interface
 */
export interface FeatureFlag {
  /** UUID primary key */
  id: string;
  /** User ID for user-specific flags (null for global flags) */
  userId?: string | null;
  /** Organization ID for organization-specific flags */
  organizationId?: string | null;
  /** Name of the feature flag */
  featureName: string;
  /** Whether the feature is enabled */
  enabled: boolean;
  /** Minimum tier required for this feature */
  tierRequired: UserTier;
  /** Optional expiration date */
  expiresAt?: Date | null;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Flag creation timestamp */
  createdAt: Date;
  /** Flag last update timestamp */
  updatedAt: Date;
}

/**
 * Feature flag audit entry for super admin operations
 */
export interface FeatureFlagAuditEntry {
  /** Audit entry ID */
  id: string;
  /** Timestamp of the operation */
  timestamp: Date;
  /** Type of operation */
  operation: 'create' | 'update' | 'delete' | 'reset' | 'force_enable' | 'force_disable' | 'emergency_disable';
  /** User ID affected by the operation */
  userId?: string;
  /** Feature name affected */
  featureName: string;
  /** Previous state (for updates) */
  previousState?: boolean;
  /** New state */
  newState?: boolean;
  /** Who performed the operation */
  performedBy: string;
  /** Reason for the operation */
  reason: string;
  /** Whether this was a super admin operation */
  superAdminOperation: boolean;
  /** Session ID for super admin operations */
  sessionId?: string;
  /** IP address of the operator */
  ipAddress: string;
  /** Additional operation details */
  details: Record<string, any>;
}

/**
 * Feature flag audit filters for super admin queries
 */
export interface FeatureFlagAuditFilters {
  /** Filter by user ID */
  userId?: string;
  /** Filter by feature name */
  featureName?: string;
  /** Filter by operation type */
  operation?: string;
  /** Filter by date range */
  startDate?: Date;
  endDate?: Date;
  /** Filter by performer */
  performedBy?: string;
  /** Filter by super admin operations only */
  superAdminOnly?: boolean;
  /** Limit number of results */
  limit?: number;
}

/**
 * Feature flag statistics for super admin monitoring
 */
export interface FeatureFlagStats {
  /** Total number of feature flags */
  totalFlags: number;
  /** Number of global flags */
  globalFlags: number;
  /** Number of user-specific flags */
  userSpecificFlags: number;
  /** Flags by tier */
  flagsByTier: Record<UserTier, number>;
  /** Most used features */
  mostUsedFeatures: Array<{ featureName: string; userCount: number }>;
  /** Recent operations count */
  recentOperations: number;
  /** Emergency operations count */
  emergencyOperations: number;
  /** System health indicators */
  healthIndicators: {
    flagsWithErrors: number;
    expiredFlags: number;
    orphanedFlags: number;
  };
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

  // ========================================
  // SUPER ADMINISTRATOR METHODS
  // ========================================

  /**
   * Reset all feature flags for a user (Super Admin Only)
   *
   * CRITICAL: This method requires super admin authentication
   * Removes all user-specific feature flags and resets to tier defaults
   *
   * @param userId - UUID of the user to reset
   * @param superAdminSessionId - Valid super admin session ID
   * @param reason - Reason for flag reset (for audit)
   * @returns Promise resolving when reset completes
   * @throws {SuperAdminAuthError} If session is invalid
   * @throws {UserNotFoundError} If user doesn't exist
   * @throws {DatabaseError} If reset operation fails
   */
  superAdminResetUserFlags(userId: string, superAdminSessionId: string, reason: string): Promise<void>;

  /**
   * Force enable/disable feature for user (Super Admin Only)
   *
   * CRITICAL: This method requires super admin authentication
   * Bypasses tier restrictions and forces feature state
   *
   * @param userId - UUID of the user
   * @param featureName - Name of the feature flag
   * @param enabled - Whether to enable or disable the feature
   * @param superAdminSessionId - Valid super admin session ID
   * @param reason - Reason for forced change (for audit)
   * @returns Promise resolving when change completes
   * @throws {SuperAdminAuthError} If session is invalid
   * @throws {UserNotFoundError} If user doesn't exist
   * @throws {ValidationError} If feature name is invalid
   * @throws {DatabaseError} If update fails
   */
  superAdminForceFeatureState(userId: string, featureName: string, enabled: boolean, superAdminSessionId: string, reason: string): Promise<void>;

  /**
   * Get comprehensive feature flag audit trail (Super Admin Only)
   *
   * CRITICAL: This method requires super admin authentication
   * Returns detailed audit information for all feature flag operations
   *
   * @param superAdminSessionId - Valid super admin session ID
   * @param filters - Optional filters for audit search
   * @returns Promise resolving to array of audit entries
   * @throws {SuperAdminAuthError} If session is invalid
   * @throws {DatabaseError} If query fails
   */
  superAdminGetFeatureFlagAudit(superAdminSessionId: string, filters?: FeatureFlagAuditFilters): Promise<FeatureFlagAuditEntry[]>;

  /**
   * Emergency disable all features for user (Super Admin Only)
   *
   * CRITICAL: This method requires super admin authentication with emergency access
   * Disables all features for a user in emergency situations
   *
   * @param userId - UUID of the user
   * @param superAdminSessionId - Valid super admin session ID with emergency access
   * @param reason - Emergency reason (for audit)
   * @returns Promise resolving when emergency disable completes
   * @throws {SuperAdminAuthError} If session is invalid or lacks emergency access
   * @throws {UserNotFoundError} If user doesn't exist
   * @throws {DatabaseError} If disable operation fails
   */
  superAdminEmergencyDisableUserFeatures(userId: string, superAdminSessionId: string, reason: string): Promise<void>;

  /**
   * Get system-wide feature flag statistics (Super Admin Only)
   *
   * CRITICAL: This method requires super admin authentication
   * Returns comprehensive statistics about feature flag usage
   *
   * @param superAdminSessionId - Valid super admin session ID
   * @returns Promise resolving to feature flag statistics
   * @throws {SuperAdminAuthError} If session is invalid
   * @throws {DatabaseError} If query fails
   */
  superAdminGetFeatureFlagStats(superAdminSessionId: string): Promise<FeatureFlagStats>;
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

/**
 * Super Admin Authentication Error
 */
export class SuperAdminAuthError extends Error {
  constructor(message: string, public readonly sessionId?: string) {
    super(message);
    this.name = 'SuperAdminAuthError';
  }
}
