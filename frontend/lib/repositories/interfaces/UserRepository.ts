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
