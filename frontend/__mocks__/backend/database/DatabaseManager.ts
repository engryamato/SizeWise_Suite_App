/**
 * Mock DatabaseManager for Jest tests
 */

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
