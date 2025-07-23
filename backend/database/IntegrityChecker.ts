/**
 * IntegrityChecker - Database Integrity Verification
 * 
 * MISSION-CRITICAL: Detects database tampering and corruption
 * Prevents tier enforcement bypass through database modification
 * 
 * @see docs/implementation/security/application-security-guide.md section 3.2
 * @see docs/implementation/security/security-implementation-checklist.md section 1.2
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import Database from 'better-sqlite3';

/**
 * Integrity check result
 */
export interface IntegrityResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checksumValid: boolean;
  structureValid: boolean;
  dataValid: boolean;
}

/**
 * Database integrity metadata
 */
interface IntegrityMetadata {
  checksum: string;
  tableCount: number;
  recordCount: number;
  lastVerified: number;
  version: string;
}

/**
 * Production-grade database integrity checker
 * CRITICAL: Prevents database tampering and ensures data consistency
 */
export class IntegrityChecker {
  private readonly metadataTable = 'integrity_metadata';
  private readonly version = '1.0';

  /**
   * Perform comprehensive database integrity check
   * CRITICAL: Must be called on application startup
   */
  async checkIntegrity(db: Database.Database): Promise<IntegrityResult> {
    const result: IntegrityResult = {
      valid: true,
      errors: [],
      warnings: [],
      checksumValid: false,
      structureValid: false,
      dataValid: false
    };

    try {
      // 1. Initialize integrity metadata table if needed
      await this.initializeIntegrityTable(db);

      // 2. Check database structure integrity
      result.structureValid = await this.checkStructureIntegrity(db, result);

      // 3. Check data integrity
      result.dataValid = await this.checkDataIntegrity(db, result);

      // 4. Check database checksum
      result.checksumValid = await this.checkDatabaseChecksum(db, result);

      // 5. Verify critical tables and constraints
      await this.verifyCriticalTables(db, result);

      // 6. Check for suspicious modifications
      await this.checkForTampering(db, result);

      // Overall validity
      result.valid = result.structureValid && result.dataValid && result.checksumValid && result.errors.length === 0;

      // Update integrity metadata
      if (result.valid) {
        await this.updateIntegrityMetadata(db);
      }

      return result;

    } catch (error) {
      result.valid = false;
      result.errors.push(`Integrity check failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Generate database checksum for tamper detection
   */
  async generateDatabaseChecksum(db: Database.Database): Promise<string> {
    try {
      const hash = crypto.createHash('sha256');
      
      // Get all table schemas
      const tables = db.prepare(`
        SELECT name, sql FROM sqlite_master 
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != ?
        ORDER BY name
      `).all(this.metadataTable) as { name: string; sql: string }[];

      // Hash table structures
      for (const table of tables) {
        hash.update(table.sql || '');
      }

      // Hash critical data (users, projects, feature_flags)
      const criticalTables = ['users', 'projects', 'feature_flags'];
      for (const tableName of criticalTables) {
        if (tables.some(t => t.name === tableName)) {
          const rows = db.prepare(`SELECT * FROM ${tableName} ORDER BY id`).all();
          hash.update(JSON.stringify(rows));
        }
      }

      return hash.digest('hex');

    } catch (error) {
      throw new Error(`Checksum generation failed: ${error.message}`);
    }
  }

  /**
   * Verify database against known good checksum
   */
  async verifyChecksum(db: Database.Database, expectedChecksum: string): Promise<boolean> {
    try {
      const currentChecksum = await this.generateDatabaseChecksum(db);
      return currentChecksum === expectedChecksum;
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize integrity metadata table
   */
  private async initializeIntegrityTable(db: Database.Database): Promise<void> {
    try {
      // Create integrity metadata table if it doesn't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS ${this.metadataTable} (
          id INTEGER PRIMARY KEY,
          checksum TEXT NOT NULL,
          table_count INTEGER NOT NULL,
          record_count INTEGER NOT NULL,
          last_verified INTEGER NOT NULL,
          version TEXT NOT NULL
        )
      `);

    } catch (error) {
      throw new Error(`Failed to initialize integrity table: ${error.message}`);
    }
  }

  /**
   * Check database structure integrity
   */
  private async checkStructureIntegrity(db: Database.Database, result: IntegrityResult): Promise<boolean> {
    try {
      // Check required tables exist
      const requiredTables = ['users', 'projects', 'project_segments', 'feature_flags', 'change_log'];
      const existingTables = db.prepare(`
        SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      `).all() as { name: string }[];

      const existingTableNames = existingTables.map(t => t.name);

      for (const requiredTable of requiredTables) {
        if (!existingTableNames.includes(requiredTable)) {
          result.errors.push(`Required table missing: ${requiredTable}`);
        }
      }

      // Check table schemas
      for (const requiredTable of requiredTables) {
        if (existingTableNames.includes(requiredTable)) {
          const isValid = await this.validateTableSchema(db, requiredTable);
          if (!isValid) {
            result.errors.push(`Invalid schema for table: ${requiredTable}`);
          }
        }
      }

      // Check indexes exist
      const requiredIndexes = [
        'idx_users_email',
        'idx_users_tier',
        'idx_projects_user',
        'idx_feature_flags_user_feature'
      ];

      const existingIndexes = db.prepare(`
        SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
      `).all() as { name: string }[];

      const existingIndexNames = existingIndexes.map(i => i.name);

      for (const requiredIndex of requiredIndexes) {
        if (!existingIndexNames.includes(requiredIndex)) {
          result.warnings.push(`Missing index: ${requiredIndex}`);
        }
      }

      return result.errors.length === 0;

    } catch (error) {
      result.errors.push(`Structure integrity check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Check data integrity
   */
  private async checkDataIntegrity(db: Database.Database, result: IntegrityResult): Promise<boolean> {
    try {
      // Check foreign key constraints
      const foreignKeyViolations = db.pragma('foreign_key_check');
      if (foreignKeyViolations.length > 0) {
        result.errors.push(`Foreign key violations detected: ${foreignKeyViolations.length}`);
      }

      // Check for orphaned records
      await this.checkOrphanedRecords(db, result);

      // Validate critical data formats
      await this.validateDataFormats(db, result);

      // Check for suspicious data patterns
      await this.checkSuspiciousPatterns(db, result);

      return result.errors.length === 0;

    } catch (error) {
      result.errors.push(`Data integrity check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Check database checksum
   */
  private async checkDatabaseChecksum(db: Database.Database, result: IntegrityResult): Promise<boolean> {
    try {
      // Get stored checksum
      const storedMetadata = db.prepare(`
        SELECT checksum FROM ${this.metadataTable} ORDER BY last_verified DESC LIMIT 1
      `).get() as { checksum: string } | undefined;

      if (!storedMetadata) {
        // First run - generate and store checksum
        const checksum = await this.generateDatabaseChecksum(db);
        await this.storeInitialChecksum(db, checksum);
        return true;
      }

      // Verify current checksum against stored
      const currentChecksum = await this.generateDatabaseChecksum(db);
      const checksumValid = currentChecksum === storedMetadata.checksum;

      if (!checksumValid) {
        result.errors.push('Database checksum mismatch - possible tampering detected');
      }

      return checksumValid;

    } catch (error) {
      result.errors.push(`Checksum verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify critical tables have required constraints
   */
  private async verifyCriticalTables(db: Database.Database, result: IntegrityResult): Promise<void> {
    try {
      // Check users table constraints
      const usersInfo = db.pragma('table_info(users)');
      const tierColumn = usersInfo.find((col: any) => col.name === 'tier');
      if (!tierColumn) {
        result.errors.push('Users table missing tier column');
      }

      // Check projects table constraints
      const projectsInfo = db.pragma('table_info(projects)');
      const userIdColumn = projectsInfo.find((col: any) => col.name === 'user_id');
      if (!userIdColumn || !userIdColumn.notnull) {
        result.errors.push('Projects table user_id column not properly constrained');
      }

      // Verify CHECK constraints exist (SQLite doesn't expose these easily)
      // We'll check by attempting to insert invalid data
      await this.verifyCheckConstraints(db, result);

    } catch (error) {
      result.warnings.push(`Critical table verification failed: ${error.message}`);
    }
  }

  /**
   * Check for signs of tampering
   */
  private async checkForTampering(db: Database.Database, result: IntegrityResult): Promise<void> {
    try {
      // Check for suspicious tier changes
      const suspiciousTierChanges = db.prepare(`
        SELECT COUNT(*) as count FROM change_log 
        WHERE entity_type = 'user' AND operation = 'UPDATE' 
        AND changes LIKE '%"newTier":"pro"%' OR changes LIKE '%"newTier":"enterprise"%'
      `).get() as { count: number };

      if (suspiciousTierChanges.count > 10) {
        result.warnings.push('High number of tier upgrades detected');
      }

      // Check for users with pro/enterprise tiers without license keys
      const unlicensedPremiumUsers = db.prepare(`
        SELECT COUNT(*) as count FROM users 
        WHERE tier IN ('pro', 'enterprise') AND (license_key IS NULL OR license_key = '')
      `).get() as { count: number };

      if (unlicensedPremiumUsers.count > 0) {
        result.errors.push('Premium tier users without license keys detected');
      }

      // Check for excessive project counts for free users
      const freeUserProjects = db.prepare(`
        SELECT u.id, COUNT(p.id) as project_count 
        FROM users u 
        LEFT JOIN projects p ON u.id = p.user_id AND p.status = 'active'
        WHERE u.tier = 'free' 
        GROUP BY u.id 
        HAVING project_count > 3
      `).all() as { id: string; project_count: number }[];

      if (freeUserProjects.length > 0) {
        result.errors.push(`Free tier users with excessive projects: ${freeUserProjects.length}`);
      }

    } catch (error) {
      result.warnings.push(`Tampering check failed: ${error.message}`);
    }
  }

  /**
   * Validate table schema matches expected structure
   */
  private async validateTableSchema(db: Database.Database, tableName: string): Promise<boolean> {
    try {
      const tableInfo = db.pragma(`table_info(${tableName})`);
      
      // Define expected schemas for critical tables
      const expectedSchemas: Record<string, string[]> = {
        users: ['id', 'email', 'name', 'tier', 'company', 'license_key'],
        projects: ['id', 'user_id', 'name', 'client', 'address', 'metadata'],
        feature_flags: ['id', 'user_id', 'feature_name', 'enabled', 'tier_required']
      };

      const expectedColumns = expectedSchemas[tableName];
      if (!expectedColumns) {
        return true; // Unknown table, assume valid
      }

      const actualColumns = tableInfo.map((col: any) => col.name);
      
      for (const expectedColumn of expectedColumns) {
        if (!actualColumns.includes(expectedColumn)) {
          return false;
        }
      }

      return true;

    } catch (error) {
      return false;
    }
  }

  /**
   * Check for orphaned records
   */
  private async checkOrphanedRecords(db: Database.Database, result: IntegrityResult): Promise<void> {
    try {
      // Check for projects without users
      const orphanedProjects = db.prepare(`
        SELECT COUNT(*) as count FROM projects p 
        LEFT JOIN users u ON p.user_id = u.id 
        WHERE u.id IS NULL
      `).get() as { count: number };

      if (orphanedProjects.count > 0) {
        result.errors.push(`Orphaned projects detected: ${orphanedProjects.count}`);
      }

      // Check for segments without projects
      const orphanedSegments = db.prepare(`
        SELECT COUNT(*) as count FROM project_segments ps 
        LEFT JOIN projects p ON ps.project_id = p.id 
        WHERE p.id IS NULL
      `).get() as { count: number };

      if (orphanedSegments.count > 0) {
        result.errors.push(`Orphaned segments detected: ${orphanedSegments.count}`);
      }

    } catch (error) {
      result.warnings.push(`Orphaned records check failed: ${error.message}`);
    }
  }

  /**
   * Validate data formats
   */
  private async validateDataFormats(db: Database.Database, result: IntegrityResult): Promise<void> {
    try {
      // Check UUID formats
      const invalidUUIDs = db.prepare(`
        SELECT COUNT(*) as count FROM users 
        WHERE id NOT GLOB '[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]-[0-9a-f][0-9a-f][0-9a-f][0-9a-f]-[0-9a-f][0-9a-f][0-9a-f][0-9a-f]-[0-9a-f][0-9a-f][0-9a-f][0-9a-f]-[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]'
      `).get() as { count: number };

      if (invalidUUIDs.count > 0) {
        result.errors.push(`Invalid UUID formats detected: ${invalidUUIDs.count}`);
      }

      // Check email formats
      const invalidEmails = db.prepare(`
        SELECT COUNT(*) as count FROM users 
        WHERE email IS NOT NULL AND email NOT LIKE '%@%.%'
      `).get() as { count: number };

      if (invalidEmails.count > 0) {
        result.warnings.push(`Invalid email formats detected: ${invalidEmails.count}`);
      }

    } catch (error) {
      result.warnings.push(`Data format validation failed: ${error.message}`);
    }
  }

  /**
   * Check for suspicious data patterns
   */
  private async checkSuspiciousPatterns(db: Database.Database, result: IntegrityResult): Promise<void> {
    try {
      // Check for duplicate license keys
      const duplicateLicenses = db.prepare(`
        SELECT license_key, COUNT(*) as count FROM users 
        WHERE license_key IS NOT NULL AND license_key != ''
        GROUP BY license_key 
        HAVING count > 1
      `).all() as { license_key: string; count: number }[];

      if (duplicateLicenses.length > 0) {
        result.errors.push(`Duplicate license keys detected: ${duplicateLicenses.length}`);
      }

      // Check for suspicious creation patterns
      const recentUsers = db.prepare(`
        SELECT COUNT(*) as count FROM users 
        WHERE created_at > datetime('now', '-1 hour')
      `).get() as { count: number };

      if (recentUsers.count > 100) {
        result.warnings.push('High number of recent user creations detected');
      }

    } catch (error) {
      result.warnings.push(`Suspicious pattern check failed: ${error.message}`);
    }
  }

  /**
   * Verify CHECK constraints
   */
  private async verifyCheckConstraints(db: Database.Database, result: IntegrityResult): Promise<void> {
    try {
      // Test tier constraint by attempting invalid insert
      const testTransaction = db.transaction(() => {
        try {
          db.prepare(`
            INSERT INTO users (id, email, tier) 
            VALUES ('test-id', 'test@test.com', 'invalid-tier')
          `).run();
          
          // If we get here, constraint is not working
          result.errors.push('Tier CHECK constraint not enforced');
          
          // Rollback test insert
          db.prepare('DELETE FROM users WHERE id = ?').run('test-id');
        } catch (error) {
          // Expected - constraint is working
        }
      });

      testTransaction();

    } catch (error) {
      // Ignore errors in constraint testing
    }
  }

  /**
   * Store initial checksum
   */
  private async storeInitialChecksum(db: Database.Database, checksum: string): Promise<void> {
    try {
      const tableCount = db.prepare(`
        SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table'
      `).get() as { count: number };

      const recordCount = db.prepare(`
        SELECT SUM(count) as total FROM (
          SELECT COUNT(*) as count FROM users
          UNION ALL SELECT COUNT(*) FROM projects
          UNION ALL SELECT COUNT(*) FROM feature_flags
        )
      `).get() as { total: number };

      db.prepare(`
        INSERT INTO ${this.metadataTable} 
        (checksum, table_count, record_count, last_verified, version)
        VALUES (?, ?, ?, ?, ?)
      `).run(checksum, tableCount.count, recordCount.total || 0, Date.now(), this.version);

    } catch (error) {
      throw new Error(`Failed to store initial checksum: ${error.message}`);
    }
  }

  /**
   * Update integrity metadata after successful check
   */
  private async updateIntegrityMetadata(db: Database.Database): Promise<void> {
    try {
      const checksum = await this.generateDatabaseChecksum(db);
      
      db.prepare(`
        UPDATE ${this.metadataTable} 
        SET checksum = ?, last_verified = ? 
        WHERE id = (SELECT MAX(id) FROM ${this.metadataTable})
      `).run(checksum, Date.now());

    } catch (error) {
      // Non-critical error
    }
  }
}
