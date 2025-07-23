/**
 * ProjectRepository Interface
 * 
 * Repository interface for project data management with tier-aware operations.
 * Supports both local SQLite (offline) and cloud API (SaaS) implementations.
 * 
 * @see docs/api/repository-interfaces.md section 1
 * @see docs/implementation/tier-system/repository-pattern-guide.md
 */

/**
 * User tier enumeration for tier-based feature enforcement
 */
export type UserTier = 'free' | 'pro' | 'enterprise';

/**
 * Project entity interface
 */
export interface Project {
  /** UUID primary key */
  id: string;
  /** Foreign key to users table */
  userId: string;
  /** Project name (required, non-empty) */
  name: string;
  /** Client name (optional) */
  client?: string;
  /** Project address (optional) */
  address?: string;
  /** Flexible metadata storage */
  metadata?: Record<string, any>;
  /** Project creation timestamp */
  createdAt: Date;
  /** Last modification timestamp */
  lastModified: Date;
}

/**
 * Repository interface for project data operations with tier enforcement
 */
export interface ProjectRepository {
  /**
   * Retrieve a single project by ID
   * 
   * @param id - UUID of the project to retrieve
   * @returns Promise resolving to Project object if found, null if not found
   * @throws {DatabaseError} If database operation fails
   * @throws {ValidationError} If ID format is invalid
   */
  getProject(id: string): Promise<Project | null>;

  /**
   * Create or update a project
   * 
   * @param project - Complete project object to save
   * @returns Promise resolving when save operation completes
   * @throws {ValidationError} If project data is invalid
   * @throws {DatabaseError} If save operation fails
   * @throws {TierLimitExceededError} If user has reached project limit
   */
  saveProject(project: Project): Promise<void>;

  /**
   * Delete a project and all associated data
   * 
   * Side effects:
   * - Deletes all project segments
   * - Removes project from change log
   * - Updates user's project count
   * 
   * @param id - UUID of the project to delete
   * @returns Promise resolving when deletion completes
   * @throws {ProjectNotFoundError} If project doesn't exist
   * @throws {DatabaseError} If deletion fails
   */
  deleteProject(id: string): Promise<void>;

  /**
   * Get all projects for a user with tier-based filtering
   * 
   * Tier behavior:
   * - free: Returns maximum 3 projects
   * - pro: Returns all projects
   * - enterprise: Returns all projects
   * 
   * @param userId - UUID of the user
   * @param tier - User's current tier for filtering
   * @returns Promise resolving to array of projects ordered by lastModified (newest first)
   * @throws {UserNotFoundError} If user doesn't exist
   * @throws {DatabaseError} If query fails
   */
  listProjects(userId: string, tier: UserTier): Promise<Project[]>;

  /**
   * Get total number of projects for a user
   * 
   * @param userId - UUID of the user
   * @returns Promise resolving to total project count
   * @throws {UserNotFoundError} If user doesn't exist
   * @throws {DatabaseError} If query fails
   */
  getProjectCount(userId: string): Promise<number>;

  /**
   * Check if user can create another project based on tier limits
   * 
   * Tier logic:
   * - free: false if user has 3+ projects
   * - pro: always true
   * - enterprise: always true
   * 
   * @param userId - UUID of the user
   * @param tier - User's current tier
   * @returns Promise resolving to true if user can create project, false otherwise
   * @throws {UserNotFoundError} If user doesn't exist
   * @throws {DatabaseError} If query fails
   */
  canCreateProject(userId: string, tier: UserTier): Promise<boolean>;

  /**
   * Export all projects for a user (for SaaS migration)
   * 
   * @param userId - UUID of the user
   * @returns Promise resolving to array of all user's projects
   * @throws {UserNotFoundError} If user doesn't exist
   * @throws {DatabaseError} If export fails
   */
  exportProjects(userId: string): Promise<Project[]>;

  /**
   * Import projects (for SaaS migration)
   * 
   * @param projects - Array of projects to import
   * @returns Promise resolving when import completes
   * @throws {ValidationError} If project data is invalid
   * @throws {DatabaseError} If import fails
   */
  importProjects(projects: Project[]): Promise<void>;
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
 * Project not found error
 */
export class ProjectNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Project not found: ${projectId}`);
    this.name = 'ProjectNotFoundError';
  }
}

/**
 * Tier limit exceeded error
 */
export class TierLimitExceededError extends Error {
  constructor(
    message: string,
    public readonly requiredFeature: string,
    public readonly requiredTier: string
  ) {
    super(message);
    this.name = 'TierLimitExceededError';
  }
}
