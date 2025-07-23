/**
 * DatabaseManager
 * 
 * SQLite database connection management, schema migration, and initialization.
 * Supports both development and production configurations with integrity checks.
 * 
 * @see docs/implementation/saas-readiness/schema-migration-guide.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 1.2
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  /** Path to the database file */
  filePath: string;
  /** Enable WAL mode for better concurrency */
  enableWAL?: boolean;
  /** Enable foreign key constraints */
  enableForeignKeys?: boolean;
  /** Database timeout in milliseconds */
  timeout?: number;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Migration information interface
 */
export interface MigrationInfo {
  version: string;
  description: string;
  appliedAt: Date;
  checksum: string;
}

/**
 * Database manager for SQLite operations with schema migration support
 */
export class DatabaseManager {
  private db: Database.Database | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = {
      enableWAL: true,
      enableForeignKeys: true,
      timeout: 30000,
      verbose: false,
      ...config
    };
  }

  /**
   * Initialize database connection and apply schema
   * 
   * @returns Promise resolving when initialization completes
   * @throws {DatabaseError} If initialization fails
   */
  async initialize(): Promise<void> {
    try {
      // Create database directory if it doesn't exist
      const dbDir = path.dirname(this.config.filePath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Open database connection
      this.db = new Database(this.config.filePath, {
        verbose: this.config.verbose ? console.log : undefined,
        timeout: this.config.timeout
      });

      // Configure database settings
      await this.configurePragmas();

      // Apply schema migrations
      await this.applyMigrations();

      // Verify database integrity
      await this.verifyIntegrity();

      console.log(`Database initialized successfully: ${this.config.filePath}`);
    } catch (error) {
      throw new DatabaseError(`Failed to initialize database: ${error.message}`, 'initialize');
    }
  }

  /**
   * Get database connection
   * 
   * @returns Database connection
   * @throws {DatabaseError} If database not initialized
   */
  getConnection(): Database.Database {
    if (!this.db) {
      throw new DatabaseError('Database not initialized. Call initialize() first.', 'getConnection');
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('Database connection closed');
    }
  }

  /**
   * Configure SQLite pragmas for optimal performance and safety
   */
  private async configurePragmas(): Promise<void> {
    if (!this.db) return;

    // Enable foreign key constraints
    if (this.config.enableForeignKeys) {
      this.db.pragma('foreign_keys = ON');
    }

    // Enable WAL mode for better concurrency
    if (this.config.enableWAL) {
      this.db.pragma('journal_mode = WAL');
    }

    // Set synchronous mode for balance between safety and performance
    this.db.pragma('synchronous = NORMAL');

    // Set cache size (10MB)
    this.db.pragma('cache_size = 10000');

    // Store temp tables in memory
    this.db.pragma('temp_store = MEMORY');

    // Enable memory-mapped I/O (256MB)
    this.db.pragma('mmap_size = 268435456');

    console.log('Database pragmas configured');
  }

  /**
   * Apply database schema migrations
   */
  private async applyMigrations(): Promise<void> {
    if (!this.db) return;

    try {
      // Create schema_migrations table if it doesn't exist
      this.createMigrationsTable();

      // Check current schema version
      const currentVersion = this.getCurrentSchemaVersion();
      const targetVersion = '1.0.0';

      if (currentVersion === targetVersion) {
        console.log(`Database schema up to date: ${currentVersion}`);
        return;
      }

      // Apply initial schema
      if (!currentVersion) {
        await this.applyInitialSchema();
        this.recordMigration('1.0.0', 'Initial schema with multi-tenant support');
        console.log('Initial schema applied successfully');
      }

    } catch (error) {
      throw new DatabaseError(`Migration failed: ${error.message}`, 'applyMigrations');
    }
  }

  /**
   * Create schema migrations tracking table
   */
  private createMigrationsTable(): void {
    if (!this.db) return;

    const createMigrationsTable = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        checksum TEXT NOT NULL
      )
    `;

    this.db.exec(createMigrationsTable);
  }

  /**
   * Get current schema version
   */
  private getCurrentSchemaVersion(): string | null {
    if (!this.db) return null;

    try {
      const stmt = this.db.prepare('SELECT version FROM schema_migrations ORDER BY applied_at DESC LIMIT 1');
      const result = stmt.get() as { version: string } | undefined;
      return result?.version || null;
    } catch (error) {
      // Table doesn't exist yet - this is expected on first run
      if (error instanceof Error && error.message.includes('no such table')) {
        return null;
      }
      // Re-throw unexpected errors
      throw error;
    }
  }

  /**
   * Apply initial database schema
   */
  private async applyInitialSchema(): Promise<void> {
    if (!this.db) return;

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new DatabaseError('Schema file not found: schema.sql', 'applyInitialSchema');
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema in a transaction
    const transaction = this.db.transaction(() => {
      this.db!.exec(schemaSQL);
    });

    transaction();
  }

  /**
   * Record migration in schema_migrations table
   */
  private recordMigration(version: string, description: string): void {
    if (!this.db) return;

    const checksum = this.calculateSchemaChecksum();
    const stmt = this.db.prepare(`
      INSERT INTO schema_migrations (version, description, checksum)
      VALUES (?, ?, ?)
    `);

    stmt.run(version, description, checksum);
  }

  /**
   * Calculate schema checksum for integrity verification
   */
  private calculateSchemaChecksum(): string {
    if (!this.db) return '';

    // Get table schemas for checksum calculation
    const stmt = this.db.prepare(`
      SELECT name, sql FROM sqlite_master 
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    const tables = stmt.all() as { name: string; sql: string }[];
    const schemaString = tables.map(t => t.sql).join('\n');

    // Simple checksum (in production, use crypto.createHash)
    return Buffer.from(schemaString).toString('base64').slice(0, 16);
  }

  /**
   * Verify database integrity
   */
  private async verifyIntegrity(): Promise<void> {
    if (!this.db) return;

    try {
      // Run SQLite integrity check
      const integrityResult = this.db.pragma('integrity_check');
      if (integrityResult[0].integrity_check !== 'ok') {
        throw new DatabaseError('Database integrity check failed', 'verifyIntegrity');
      }

      // Verify foreign key constraints
      const foreignKeyResult = this.db.pragma('foreign_key_check');
      if (foreignKeyResult.length > 0) {
        throw new DatabaseError('Foreign key constraint violations detected', 'verifyIntegrity');
      }

      // Verify critical tables exist
      const requiredTables = ['users', 'projects', 'project_segments', 'feature_flags', 'change_log'];
      for (const tableName of requiredTables) {
        const tableExists = this.db.prepare(`
          SELECT name FROM sqlite_master WHERE type='table' AND name=?
        `).get(tableName);

        if (!tableExists) {
          throw new DatabaseError(`Required table missing: ${tableName}`, 'verifyIntegrity');
        }
      }

      console.log('Database integrity verification passed');
    } catch (error) {
      throw new DatabaseError(`Integrity verification failed: ${error.message}`, 'verifyIntegrity');
    }
  }

  /**
   * Create backup of database
   */
  async createBackup(backupPath: string): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized', 'createBackup');
    }

    try {
      // Ensure backup directory exists
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Create backup using SQLite backup API
      await this.db.backup(backupPath);
      console.log(`Database backup created: ${backupPath}`);
    } catch (error) {
      throw new DatabaseError(`Backup failed: ${error.message}`, 'createBackup');
    }
  }

  /**
   * Get database statistics
   */
  getStatistics(): DatabaseStatistics {
    if (!this.db) {
      throw new DatabaseError('Database not initialized', 'getStatistics');
    }

    const stats = {
      userCount: this.getTableCount('users'),
      projectCount: this.getTableCount('projects'),
      segmentCount: this.getTableCount('project_segments'),
      featureFlagCount: this.getTableCount('feature_flags'),
      changeLogCount: this.getTableCount('change_log'),
      databaseSize: this.getDatabaseSize()
    };

    return stats;
  }

  private getTableCount(tableName: string): number {
    if (!this.db) return 0;
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`);
    const result = stmt.get() as { count: number };
    return result.count;
  }

  private getDatabaseSize(): number {
    if (!this.db) return 0;
    try {
      const stats = fs.statSync(this.config.filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }
}

/**
 * Database statistics interface
 */
export interface DatabaseStatistics {
  userCount: number;
  projectCount: number;
  segmentCount: number;
  featureFlagCount: number;
  changeLogCount: number;
  databaseSize: number;
}

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
 * Create default database configuration
 */
export function createDefaultConfig(environment: 'development' | 'production' | 'test'): DatabaseConfig {
  const baseConfig: DatabaseConfig = {
    filePath: '',
    enableWAL: true,
    enableForeignKeys: true,
    timeout: 30000,
    verbose: false
  };

  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        filePath: './data/sizewise-dev.db',
        verbose: true
      };
    case 'production':
      return {
        ...baseConfig,
        filePath: './data/sizewise.db',
        verbose: false
      };
    case 'test':
      return {
        ...baseConfig,
        filePath: ':memory:',
        enableWAL: false // WAL mode not supported in memory
      };
    default:
      return baseConfig;
  }
}
