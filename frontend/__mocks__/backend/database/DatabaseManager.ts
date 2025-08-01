/**
 * Mock DatabaseManager for Jest tests
 * Enhanced with in-memory data storage for realistic testing
 */

/**
 * Mock Statement class that mimics SQLite prepared statements
 */
class MockStatement {
  private sql: string;
  private mockData: Map<string, any>;

  constructor(sql: string, mockData: Map<string, any>) {
    this.sql = sql;
    this.mockData = mockData;
  }

  get(...params: any[]): any {
    // Enhanced mock implementation with actual data storage
    const sql = this.sql.toLowerCase().trim();

    if (sql.includes('select') && sql.includes('from users') && sql.includes('where id = ?')) {
      // User lookup by ID
      const userId = params[0];
      return this.mockData.get(`user:${userId}`) || null;
    }

    if (sql.includes('select') && sql.includes('from users') && sql.includes('where license_key = ?')) {
      // License validation lookup
      const licenseKey = params[0];
      const users = Array.from(this.mockData.values()).filter((value: any) =>
        value && value.license_key === licenseKey
      );
      return users.length > 0 ? users[0] : undefined;
    }

    if (sql.includes('select') && sql.includes('from users') && sql.includes('order by created_at')) {
      // Get current user (first user) - only look at user data, not feature flags
      const users = Array.from(this.mockData.entries())
        .filter(([key, value]) => key.startsWith('user:') && value && value.id)
        .map(([key, value]) => value)
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return users.length > 0 ? users[0] : null;
    }

    return null;
  }

  all(...params: any[]): any[] {
    // Enhanced mock implementation with actual data storage
    const sql = this.sql.toLowerCase().trim();

    if (sql.includes('select') && sql.includes('from change_log')) {
      // Change log lookup
      const entityType = params[0];
      const operation = params[1];
      const logs = Array.from(this.mockData.values()).filter((value: any) =>
        value && value.entity_type === entityType && value.operation === operation
      );
      return logs;
    }

    if (sql.includes('select') && sql.includes('from feature_flags')) {
      if (sql.includes('where user_id = ? and tier_required > 1')) {
        // Feature flags lookup for tier filtering with hardcoded tier > 1
        const userId = params[0];
        const flags = Array.from(this.mockData.entries())
          .filter(([key, value]) => key.startsWith('flag:') && value && value.user_id === userId && value.tier_required > 1)
          .map(([key, value]) => value);
        return flags;
      } else if (sql.includes('where user_id = ? and tier_required > ?')) {
        // Feature flags lookup for tier filtering with parameterized tier
        const userId = params[0];
        const tierRequired = params[1];
        const flags = Array.from(this.mockData.entries())
          .filter(([key, value]) => key.startsWith('flag:') && value && value.user_id === userId && value.tier_required > tierRequired)
          .map(([key, value]) => value);
        return flags;
      } else if (sql.includes('where tier_required <= ? and enabled = 1')) {
        // Get features for tier
        const tierValue = params[0];
        const flags = Array.from(this.mockData.entries())
          .filter(([key, value]) => key.startsWith('flag:') && value && value.tier_required <= tierValue && value.enabled === 1)
          .map(([key, value]) => value);
        return flags;
      } else if (sql.includes('where user_id = ?')) {
        // General user feature flags lookup
        const userId = params[0];
        const flags = Array.from(this.mockData.entries())
          .filter(([key, value]) => key.startsWith('flag:') && value && value.user_id === userId)
          .map(([key, value]) => value);
        return flags;
      }
      return [];
    }

    return [];
  }

  run(...params: any[]): { changes: number; lastInsertRowid: number } {
    // Enhanced mock implementation with actual data storage
    const sql = this.sql.toLowerCase().trim();

    if (sql.includes('insert or replace into users')) {
      // Save user data
      const [id, email, name, tier, company, license_key, organization_id, settings, created_at, updated_at] = params;
      const userData = {
        id, email, name, tier, company, license_key: license_key || null,
        organization_id, settings, created_at, updated_at
      };
      this.mockData.set(`user:${id}`, userData);
      return { changes: 1, lastInsertRowid: 1 };
    }

    if (sql.includes('insert into change_log')) {
      // Save change log - handle both formats
      let logData;
      if (params.length === 5) {
        // Format: user_id, entity_type, entity_id, operation, changes
        const [user_id, entity_type, entity_id, operation, changes] = params;
        logData = {
          id: `log_${Date.now()}_${Math.random()}`,
          user_id, entity_type, entity_id, operation, changes,
          timestamp: new Date().toISOString()
        };
      } else {
        // Format: id, entity_type, entity_id, operation, user_id, changes, timestamp
        const [id, entity_type, entity_id, operation, user_id, changes, timestamp] = params;
        logData = {
          id, entity_type, entity_id, operation, user_id, changes, timestamp
        };
      }
      this.mockData.set(`log:${logData.id}`, logData);
      return { changes: 1, lastInsertRowid: 1 };
    }

    if (sql.includes('update users set tier = ?')) {
      // Update user tier - params: [tier, updated_at, userId]
      const [tier, updated_at, userId] = params;
      const userData = this.mockData.get(`user:${userId}`);
      if (userData) {
        userData.tier = tier;
        userData.updated_at = updated_at;
        this.mockData.set(`user:${userId}`, userData);
        return { changes: 1, lastInsertRowid: 1 };
      }
      return { changes: 0, lastInsertRowid: 0 };
    }

    if (sql.includes('delete from feature_flags')) {
      // Delete feature flags
      const userId = params[0];
      const tierRequired = params[1];
      const flagsToDelete = Array.from(this.mockData.keys()).filter(key => {
        const value = this.mockData.get(key);
        return key.startsWith('flag:') && value && value.user_id === userId && value.tier_required > tierRequired;
      });
      flagsToDelete.forEach(key => this.mockData.delete(key));
      return { changes: flagsToDelete.length, lastInsertRowid: 0 };
    }

    if (sql.includes('insert or ignore into feature_flags')) {
      // Insert feature flag - check if enabled is hardcoded in SQL
      let flagData;
      if (sql.includes('values (?, ?, ?, 1, ?)')) {
        // Format: [id, user_id, feature_name, tier_required] with enabled=1 hardcoded
        const [id, user_id, feature_name, tier_required] = params;
        flagData = {
          id, user_id, feature_name, enabled: 1, tier_required
        };
      } else {
        // Format: [id, user_id, feature_name, enabled, tier_required]
        const [id, user_id, feature_name, enabled, tier_required] = params;
        flagData = {
          id, user_id, feature_name, enabled, tier_required
        };
      }

      // Only insert if it doesn't already exist
      const existingKey = Array.from(this.mockData.keys()).find(key => {
        const value = this.mockData.get(key);
        return key.startsWith('flag:') && value && value.user_id === flagData.user_id && value.feature_name === flagData.feature_name;
      });
      if (!existingKey) {
        // Use a composite key to ensure uniqueness: user_id + feature_name
        const compositeKey = `flag:${flagData.user_id}:${flagData.feature_name}`;
        this.mockData.set(compositeKey, flagData);
        return { changes: 1, lastInsertRowid: 1 };
      }
      return { changes: 0, lastInsertRowid: 0 };
    }

    return { changes: 1, lastInsertRowid: 1 };
  }
}

/**
 * Mock Database Connection class that mimics SQLite database interface
 */
class MockDatabaseConnection {
  private mockData: Map<string, any>;

  constructor(mockData: Map<string, any>) {
    this.mockData = mockData;
  }

  prepare(sql: string): MockStatement {
    return new MockStatement(sql, this.mockData);
  }

  transaction(fn: () => void): () => void {
    // Return a function that executes the transaction
    return () => {
      try {
        fn();
      } catch (error) {
        // Mock transaction rollback on error
        throw error;
      }
    };
  }

  exec(sql: string): void {
    // Mock implementation for direct SQL execution
  }

  close(): void {
    // Mock implementation for closing connection
  }
}

export class DatabaseManager {
  private isInitialized = false;
  private mockData = new Map<string, any>();

  constructor(options?: { filePath?: string }) {
    // Initialize with empty data store
    this.mockData.clear();
  }

  async initialize(): Promise<void> {
    this.isInitialized = true;
    // Clear data on initialization to ensure clean state
    this.mockData.clear();
    // Initialize default feature flags
    this.initializeDefaultFeatures();
  }

  /**
   * Initialize default feature flags for testing
   */
  private initializeDefaultFeatures(): void {
    const defaultFeatures = [
      // Free tier features (tier_required = 1)
      { id: 'feat_basic_calc', feature_name: 'basic_calculations', tier_required: 1, enabled: 1 },
      { id: 'feat_project_create', feature_name: 'project_creation', tier_required: 1, enabled: 1 },
      { id: 'feat_pdf_export', feature_name: 'pdf_export', tier_required: 1, enabled: 1 },

      // Pro tier features (tier_required = 2)
      { id: 'feat_unlimited_proj', feature_name: 'unlimited_projects', tier_required: 2, enabled: 1 },
      { id: 'feat_high_res_export', feature_name: 'high_res_export', tier_required: 2, enabled: 1 },
      { id: 'feat_advanced_calc', feature_name: 'advanced_calculations', tier_required: 2, enabled: 1 },

      // Enterprise tier features (tier_required = 3)
      { id: 'feat_custom_templates', feature_name: 'custom_templates', tier_required: 3, enabled: 1 },
      { id: 'feat_bim_export', feature_name: 'bim_export', tier_required: 3, enabled: 1 },
      { id: 'feat_priority_support', feature_name: 'priority_support', tier_required: 3, enabled: 1 },
      { id: 'feat_api_access', feature_name: 'api_access', tier_required: 3, enabled: 1 }
    ];

    defaultFeatures.forEach(feature => {
      this.mockData.set(`flag:${feature.id}`, feature);
    });
  }

  async close(): Promise<void> {
    this.isInitialized = false;
    this.mockData.clear();
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async query(sql: string, params?: any[]): Promise<any[]> {
    return [];
  }

  async run(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowid: number }> {
    return { changes: 1, lastInsertRowid: 1 };
  }

  async get(sql: string, params?: any[]): Promise<any> {
    return null;
  }

  async all(sql: string, params?: any[]): Promise<any[]> {
    return [];
  }

  transaction(fn: () => void): void {
    fn();
  }

  /**
   * COMPATIBILITY METHOD: getConnection - Returns mock database connection
   * Added for repository compatibility - provides SQLite-like interface
   */
  getConnection(): MockDatabaseConnection {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return new MockDatabaseConnection(this.mockData);
  }

  backup(destination: string): Promise<void> {
    return Promise.resolve();
  }

  vacuum(): Promise<void> {
    return Promise.resolve();
  }

  analyze(): Promise<void> {
    return Promise.resolve();
  }

  checkpoint(): Promise<void> {
    return Promise.resolve();
  }

  getStats(): { size: number; pageCount: number; pageSize: number } {
    return { size: 0, pageCount: 0, pageSize: 4096 };
  }
}

export const databaseManager = new DatabaseManager();
export default DatabaseManager;

// Also export as MockDatabaseManager for backward compatibility
export const MockDatabaseManager = DatabaseManager;
