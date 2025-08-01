/**
 * LocalProjectRepository Implementation
 * 
 * SQLite-based implementation of ProjectRepository interface with tier-aware operations.
 * Integrates with DatabaseManager for local database operations.
 * 
 * @see docs/implementation/tier-system/repository-pattern-guide.md
 * @see docs/api/repository-interfaces.md section 1
 */

import {
  ProjectRepository,
  Project,
  UserTier,
  DatabaseError,
  ValidationError,
  UserNotFoundError,
  ProjectNotFoundError,
  TierLimitExceededError
} from '../interfaces/ProjectRepository';

// Local interface for database manager
interface DatabaseManager {
  getConnection(): any;
}
/**
 * Local SQLite implementation of ProjectRepository
 */
export class LocalProjectRepository implements ProjectRepository {
  private readonly dbManager: DatabaseManager;

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
  }

  /**
   * Retrieve a single project by ID
   */
  async getProject(id: string): Promise<Project | null> {
    try {
      this.validateUUID(id);
      
      const db = this.dbManager.getConnection();
      const stmt = db.prepare(`
        SELECT id, user_id, name, client, address, building_type, 
               metadata, settings, status, created_at, last_modified
        FROM projects 
        WHERE id = ? AND status != 'deleted'
      `);
      
      const row = stmt.get(id) as any;
      if (!row) {
        return null;
      }

      return this.mapRowToProject(row);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to get project: ${errorMessage}`, 'getProject');
    }
  }

  /**
   * Create or update a project
   */
  async saveProject(project: Project): Promise<void> {
    try {
      this.validateProject(project);
      
      // Check tier limits for new projects
      const existingProject = await this.getProject(project.id);
      if (!existingProject) {
        const userTier = await this.getUserTier(project.userId);
        const canCreate = await this.canCreateProject(project.userId, userTier);
        if (!canCreate) {
          throw new TierLimitExceededError(
            'Free tier limited to 3 projects. Upgrade to Pro for unlimited projects.',
            'unlimited_projects',
            'pro'
          );
        }
      }

      const db = this.dbManager.getConnection();
      const transaction = db.transaction(() => {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO projects (
            id, user_id, organization_id, name, client, address, 
            building_type, metadata, settings, status, created_at, last_modified
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          project.id,
          project.userId,
          null, // organization_id for future use
          project.project_name,
          project.client_name || null,
          project.project_location || null,
          null, // building_type for future use
          JSON.stringify({
            project_number: project.project_number,
            project_description: project.project_description,
            estimator_name: project.estimator_name,
            rooms: project.rooms,
            segments: project.segments,
            equipment: project.equipment,
            computational_properties: project.computational_properties,
            code_standards: project.code_standards
          }),
          null, // settings for future use
          'active',
          existingProject ? existingProject.date_created : new Date().toISOString(),
          new Date().toISOString()
        );

        // Log change for cloud sync
        this.logChange(project.userId, 'project', project.id, existingProject ? 'UPDATE' : 'INSERT', project);
      });

      transaction();
    } catch (error) {
      if (error instanceof ValidationError || error instanceof TierLimitExceededError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to save project: ${errorMessage}`, 'saveProject');
    }
  }

  /**
   * Delete a project and all associated data
   */
  async deleteProject(id: string): Promise<void> {
    try {
      this.validateUUID(id);
      
      const project = await this.getProject(id);
      if (!project) {
        throw new ProjectNotFoundError(id);
      }

      const db = this.dbManager.getConnection();
      const transaction = db.transaction(() => {
        // Soft delete the project
        const projectStmt = db.prepare(`
          UPDATE projects SET status = 'deleted', last_modified = ? WHERE id = ?
        `);
        projectStmt.run(new Date().toISOString(), id);

        // Delete associated segments
        const segmentsStmt = db.prepare(`
          DELETE FROM project_segments WHERE project_id = ?
        `);
        segmentsStmt.run(id);

        // Log change for cloud sync
        this.logChange(project.userId, 'project', id, 'DELETE', { id });
      });

      transaction();
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ProjectNotFoundError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to delete project: ${errorMessage}`, 'deleteProject');
    }
  }

  /**
   * Get all projects for a user with tier-based filtering
   */
  async listProjects(userId: string, tier: UserTier): Promise<Project[]> {
    try {
      this.validateUUID(userId);
      await this.validateUserExists(userId);

      const db = this.dbManager.getConnection();
      let query = `
        SELECT id, user_id, name, client, address, building_type, 
               metadata, settings, status, created_at, last_modified
        FROM projects 
        WHERE user_id = ? AND status = 'active'
        ORDER BY last_modified DESC
      `;

      // Apply tier limits
      if (tier === 'free') {
        query += ' LIMIT 3';
      }

      const stmt = db.prepare(query);
      const rows = stmt.all(userId) as any[];

      return rows.map(row => this.mapRowToProject(row));
    } catch (error) {
      if (error instanceof ValidationError || error instanceof UserNotFoundError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to list projects: ${errorMessage}`, 'listProjects');
    }
  }

  /**
   * Get total number of projects for a user
   */
  async getProjectCount(userId: string): Promise<number> {
    try {
      this.validateUUID(userId);
      await this.validateUserExists(userId);

      const db = this.dbManager.getConnection();
      const stmt = db.prepare(`
        SELECT COUNT(*) as count FROM projects 
        WHERE user_id = ? AND status = 'active'
      `);
      
      const result = stmt.get(userId) as { count: number };
      return result.count;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof UserNotFoundError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to get project count: ${errorMessage}`, 'getProjectCount');
    }
  }

  /**
   * Check if user can create another project based on tier limits
   */
  async canCreateProject(userId: string, tier: UserTier): Promise<boolean> {
    try {
      if (tier === 'pro' || tier === 'enterprise') {
        return true;
      }

      // Free tier: check if user has less than 3 projects
      const projectCount = await this.getProjectCount(userId);
      return projectCount < 3;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to check project creation limit: ${errorMessage}`, 'canCreateProject');
    }
  }

  /**
   * Export all projects for a user (for SaaS migration)
   */
  async exportProjects(userId: string): Promise<Project[]> {
    try {
      this.validateUUID(userId);
      await this.validateUserExists(userId);

      const db = this.dbManager.getConnection();
      const stmt = db.prepare(`
        SELECT id, user_id, name, client, address, building_type, 
               metadata, settings, status, created_at, last_modified
        FROM projects 
        WHERE user_id = ? AND status != 'deleted'
        ORDER BY created_at ASC
      `);
      
      const rows = stmt.all(userId) as any[];
      return rows.map(row => this.mapRowToProject(row));
    } catch (error) {
      if (error instanceof ValidationError || error instanceof UserNotFoundError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to export projects: ${errorMessage}`, 'exportProjects');
    }
  }

  /**
   * Import projects (for SaaS migration)
   */
  async importProjects(projects: Project[]): Promise<void> {
    try {
      if (!Array.isArray(projects)) {
        throw new ValidationError('Projects must be an array', 'projects');
      }

      const db = this.dbManager.getConnection();
      const transaction = db.transaction(() => {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO projects (
            id, user_id, organization_id, name, client, address, 
            building_type, metadata, settings, status, created_at, last_modified
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const project of projects) {
          this.validateProject(project);
          
          stmt.run(
            project.id,
            project.userId,
            null,
            project.project_name,
            project.client_name || null,
            project.project_location || null,
            null,
            JSON.stringify({
              project_number: project.project_number,
              project_description: project.project_description,
              estimator_name: project.estimator_name,
              rooms: project.rooms,
              segments: project.segments,
              equipment: project.equipment,
              computational_properties: project.computational_properties,
              code_standards: project.code_standards
            }),
            null,
            'active',
            project.date_created,
            project.last_modified
          );
        }
      });

      transaction();
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to import projects: ${errorMessage}`, 'importProjects');
    }
  }

  /**
   * Helper: Map database row to Project object
   */
  private mapRowToProject(row: any): Project {
    const metadata = row.metadata ? JSON.parse(row.metadata) : {};

    return {
      id: row.id,
      userId: row.user_id,
      project_name: row.name,
      project_number: metadata.project_number || '',
      project_description: metadata.project_description || '',
      project_location: row.address || '',
      client_name: row.client || '',
      estimator_name: metadata.estimator_name || '',
      date_created: row.created_at,
      last_modified: row.last_modified,
      version: '1.0',
      rooms: metadata.rooms || [],
      segments: metadata.segments || [],
      equipment: metadata.equipment || [],
      computational_properties: metadata.computational_properties || {},
      code_standards: metadata.code_standards || {}
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
   * Helper: Validate project object
   */
  private validateProject(project: Project): void {
    if (!project.id) {
      throw new ValidationError('Project ID is required', 'id');
    }
    if (!project.userId) {
      throw new ValidationError('User ID is required', 'userId');
    }
    if (!project.project_name || project.project_name.trim().length === 0) {
      throw new ValidationError('Project name is required', 'project_name');
    }
    if (project.project_name.length > 255) {
      throw new ValidationError('Project name too long (max 255 characters)', 'project_name');
    }
    
    this.validateUUID(project.id);
    this.validateUUID(project.userId);
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
   * Helper: Get user tier
   */
  private async getUserTier(userId: string): Promise<UserTier> {
    const db = this.dbManager.getConnection();
    const stmt = db.prepare('SELECT tier FROM users WHERE id = ?');
    const result = stmt.get(userId) as { tier: UserTier } | undefined;
    
    if (!result) {
      throw new UserNotFoundError(userId);
    }
    
    return result.tier;
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
