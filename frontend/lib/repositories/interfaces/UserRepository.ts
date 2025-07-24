/**
 * UserRepository Interface
 * 
 * Repository interface for user data management with tier and license support.
 * Supports both local SQLite (offline) and cloud API (SaaS) implementations.
 * 
 * @see docs/api/repository-interfaces.md section 2
 * @see docs/implementation/tier-system/repository-pattern-guide.md
 */

/**
 * User tier enumeration for tier-based feature enforcement
 */
export type UserTier = 'free' | 'pro' | 'enterprise';

/**
 * User entity interface
 */
export interface User {
  /** UUID primary key */
  id: string;
  /** User email address (required) */
  email: string;
  /** User display name (optional) */
  name?: string;
  /** User's current tier */
  tier: UserTier;
  /** Company name (optional) */
  company?: string;
  /** License key for offline validation (optional) */
  licenseKey?: string;
  /** User creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * License information interface
 */
export interface LicenseInfo {
  /** Licensed tier */
  tier: UserTier;
  /** Array of enabled feature names */
  features: string[];
  /** License expiration date (optional) */
  expiresAt?: Date;
  /** Whether license is currently valid */
  isValid: boolean;
}

/**
 * Super Admin User Information (Extended user data for super admin operations)
 */
export interface SuperAdminUserInfo extends User {
  /** Account status */
  accountStatus: 'active' | 'locked' | 'suspended' | 'deleted';
  /** Last login timestamp */
  lastLoginAt?: Date;
  /** Failed login attempts count */
  failedLoginAttempts: number;
  /** Account locked until timestamp */
  lockedUntil?: Date;
  /** License validation history */
  licenseHistory: LicenseHistoryEntry[];
  /** Tier change history */
  tierHistory: TierChangeEntry[];
  /** Security events */
  securityEvents: SecurityEvent[];
}

/**
 * License history entry
 */
export interface LicenseHistoryEntry {
  /** License key */
  licenseKey: string;
  /** Tier associated with license */
  tier: UserTier;
  /** When license was activated */
  activatedAt: Date;
  /** When license expired or was revoked */
  deactivatedAt?: Date;
  /** Reason for deactivation */
  deactivationReason?: string;
  /** Who performed the action */
  actionBy: string;
}

/**
 * Tier change history entry
 */
export interface TierChangeEntry {
  /** Previous tier */
  fromTier: UserTier;
  /** New tier */
  toTier: UserTier;
  /** When change occurred */
  changedAt: Date;
  /** Reason for change */
  reason: string;
  /** Who performed the change */
  changedBy: string;
  /** Whether change was forced by super admin */
  forcedChange: boolean;
}

/**
 * Security event entry
 */
export interface SecurityEvent {
  /** Event ID */
  id: string;
  /** Event type */
  type: 'login_success' | 'login_failure' | 'license_validation' | 'tier_change' | 'account_locked' | 'account_unlocked';
  /** Event timestamp */
  timestamp: Date;
  /** IP address */
  ipAddress: string;
  /** User agent */
  userAgent: string;
  /** Additional event details */
  details: Record<string, any>;
}

/**
 * Super Admin User Filters
 */
export interface SuperAdminUserFilters {
  /** Filter by tier */
  tier?: UserTier;
  /** Filter by account status */
  accountStatus?: 'active' | 'locked' | 'suspended' | 'deleted';
  /** Filter by creation date range */
  createdAfter?: Date;
  createdBefore?: Date;
  /** Filter by last login date range */
  lastLoginAfter?: Date;
  lastLoginBefore?: Date;
  /** Filter by email pattern */
  emailPattern?: string;
  /** Filter by company */
  company?: string;
  /** Include deleted accounts */
  includeDeleted?: boolean;
}

/**
 * Repository interface for user data operations with tier and license management
 */
export interface UserRepository {
  /**
   * Retrieve user by ID
   * 
   * @param id - UUID of the user
   * @returns Promise resolving to User object if found, null otherwise
   * @throws {DatabaseError} If query fails
   * @throws {ValidationError} If ID format invalid
   */
  getUser(id: string): Promise<User | null>;

  /**
   * Get the currently authenticated user
   * 
   * Implementation notes:
   * - Offline mode: Returns first user in database
   * - SaaS mode: Returns user from authentication context
   * 
   * @returns Promise resolving to current user or null if none exists
   * @throws {DatabaseError} If query fails
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * Create or update a user
   * 
   * @param user - Complete user object to save
   * @returns Promise resolving when save operation completes
   * @throws {ValidationError} If user data is invalid
   * @throws {DatabaseError} If save operation fails
   */
  saveUser(user: User): Promise<void>;

  /**
   * Update user's tier (for license upgrades/downgrades)
   * 
   * Side effects:
   * - Updates user's tier in database
   * - Logs tier change in change_log table
   * - Triggers feature flag refresh
   * 
   * @param userId - UUID of the user
   * @param tier - New tier to assign
   * @returns Promise resolving when update completes
   * @throws {UserNotFoundError} If user doesn't exist
   * @throws {ValidationError} If tier is invalid
   * @throws {DatabaseError} If update fails
   */
  updateUserTier(userId: string, tier: UserTier): Promise<void>;

  /**
   * Validate a license key
   * 
   * @param licenseKey - License key to validate
   * @returns Promise resolving to true if license is valid, false otherwise
   * @throws {DatabaseError} If validation fails
   */
  validateLicense(licenseKey: string): Promise<boolean>;

  /**
   * Get license information for a user
   *
   * @param userId - UUID of the user
   * @returns Promise resolving to LicenseInfo if found, null otherwise
   * @throws {UserNotFoundError} If user doesn't exist
   * @throws {DatabaseError} If query fails
   */
  getLicenseInfo(userId: string): Promise<LicenseInfo | null>;

  // ========================================
  // SUPER ADMINISTRATOR METHODS
  // ========================================

  /**
   * Reset user license (Super Admin Only)
   *
   * CRITICAL: This method requires super admin authentication
   * Resets user's license to default state and clears license key
   *
   * @param userId - UUID of the user to reset
   * @param superAdminSessionId - Valid super admin session ID
   * @param reason - Reason for license reset (for audit)
   * @returns Promise resolving when reset completes
   * @throws {SuperAdminAuthError} If session is invalid
   * @throws {UserNotFoundError} If user doesn't exist
   * @throws {DatabaseError} If reset operation fails
   */
  superAdminResetLicense(userId: string, superAdminSessionId: string, reason: string): Promise<void>;

  /**
   * Recover user account (Super Admin Only)
   *
   * CRITICAL: This method requires super admin authentication
   * Unlocks user account and resets authentication state
   *
   * @param userId - UUID of the user to recover
   * @param superAdminSessionId - Valid super admin session ID
   * @param newTier - Optional new tier to assign during recovery
   * @param reason - Reason for account recovery (for audit)
   * @returns Promise resolving when recovery completes
   * @throws {SuperAdminAuthError} If session is invalid
   * @throws {UserNotFoundError} If user doesn't exist
   * @throws {DatabaseError} If recovery operation fails
   */
  superAdminRecoverUser(userId: string, superAdminSessionId: string, newTier?: UserTier, reason?: string): Promise<void>;

  /**
   * Force tier change (Super Admin Only)
   *
   * CRITICAL: This method requires super admin authentication
   * Bypasses normal tier validation and forces tier change
   *
   * @param userId - UUID of the user
   * @param tier - New tier to assign
   * @param superAdminSessionId - Valid super admin session ID
   * @param reason - Reason for forced tier change (for audit)
   * @returns Promise resolving when tier change completes
   * @throws {SuperAdminAuthError} If session is invalid
   * @throws {UserNotFoundError} If user doesn't exist
   * @throws {ValidationError} If tier is invalid
   * @throws {DatabaseError} If update fails
   */
  superAdminForceTierChange(userId: string, tier: UserTier, superAdminSessionId: string, reason: string): Promise<void>;

  /**
   * Get all users with detailed information (Super Admin Only)
   *
   * CRITICAL: This method requires super admin authentication
   * Returns comprehensive user information including sensitive data
   *
   * @param superAdminSessionId - Valid super admin session ID
   * @param filters - Optional filters for user search
   * @returns Promise resolving to array of users with detailed information
   * @throws {SuperAdminAuthError} If session is invalid
   * @throws {DatabaseError} If query fails
   */
  superAdminGetAllUsers(superAdminSessionId: string, filters?: SuperAdminUserFilters): Promise<SuperAdminUserInfo[]>;

  /**
   * Emergency unlock all users (Super Admin Only)
   *
   * CRITICAL: This method requires super admin authentication with emergency access
   * Unlocks all locked user accounts in the system
   *
   * @param superAdminSessionId - Valid super admin session ID with emergency access
   * @param reason - Emergency reason (for audit)
   * @returns Promise resolving to number of users unlocked
   * @throws {SuperAdminAuthError} If session is invalid or lacks emergency access
   * @throws {DatabaseError} If unlock operation fails
   */
  superAdminEmergencyUnlockAll(superAdminSessionId: string, reason: string): Promise<number>;
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
