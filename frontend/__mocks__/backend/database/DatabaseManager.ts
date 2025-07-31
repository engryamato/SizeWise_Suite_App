/**
 * Mock DatabaseManager for Jest tests
 */

/**
 * Mock Statement class that mimics SQLite prepared statements
 */
class MockStatement {
  private sql: string;

  constructor(sql: string) {
    this.sql = sql;
  }

  get(...params: any[]): any {
    // Mock implementation - return null for most queries
    // This can be overridden in specific tests using jest.spyOn
    return null;
  }

  all(...params: any[]): any[] {
    // Mock implementation - return empty array for most queries
    // This can be overridden in specific tests using jest.spyOn
    return [];
  }

  run(...params: any[]): { changes: number; lastInsertRowid: number } {
    // Mock implementation - return success for most operations
    // This can be overridden in specific tests using jest.spyOn
    return { changes: 1, lastInsertRowid: 1 };
  }
}

/**
 * Mock Database Connection class that mimics SQLite database interface
 */
class MockDatabaseConnection {
  prepare(sql: string): MockStatement {
    return new MockStatement(sql);
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
  private mockData = new Map();

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async close(): Promise<void> {
    this.isInitialized = false;
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
    return new MockDatabaseConnection();
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
