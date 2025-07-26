/**
 * Browser Database Manager
 * 
 * Browser-compatible database manager using IndexedDB for offline storage.
 * Provides SQLite-like interface for the frontend application.
 * 
 * @see docs/implementation/tier-system/repository-pattern-guide.md
 */

/**
 * Database configuration for browser
 */
export interface BrowserDatabaseConfig {
  databaseName: string;
  version: number;
  stores: string[];
}

/**
 * Database manager for browser environment
 */
export class BrowserDatabaseManager {
  private db: IDBDatabase | null = null;
  private config: BrowserDatabaseConfig;

  constructor(config: BrowserDatabaseConfig) {
    this.config = config;
  }

  /**
   * Initialize IndexedDB database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.databaseName, this.config.version);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log(`✅ Browser database initialized: ${this.config.databaseName}`);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores if they don't exist
        for (const storeName of this.config.stores) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            
            // Add indexes based on store type
            if (storeName === 'users') {
              store.createIndex('email', 'email', { unique: true });
              store.createIndex('tier', 'tier');
            } else if (storeName === 'projects') {
              store.createIndex('userId', 'userId');
              store.createIndex('name', 'name');
            } else if (storeName === 'feature_flags') {
              store.createIndex('userId', 'userId');
              store.createIndex('featureName', 'featureName');
            }
          }
        }
      };
    });
  }

  /**
   * Get database connection
   */
  getConnection(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    storeNames: string | string[],
    mode: IDBTransactionMode,
    operation: (stores: IDBObjectStore | IDBObjectStore[]) => Promise<T>
  ): Promise<T> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(storeNames, mode);
    
    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
      
      const stores = Array.isArray(storeNames)
        ? storeNames.map(name => transaction.objectStore(name))
        : transaction.objectStore(storeNames);

      operation(stores).then(resolve).catch(reject);
    });
  }

  /**
   * Get a single record by ID
   */
  async get(storeName: string, id: string): Promise<any> {
    return this.transaction(storeName, 'readonly', async (store) => {
      return new Promise((resolve, reject) => {
        const request = (store as IDBObjectStore).get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Get all records from a store
   */
  async getAll(storeName: string): Promise<any[]> {
    return this.transaction(storeName, 'readonly', async (store) => {
      return new Promise((resolve, reject) => {
        const request = (store as IDBObjectStore).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Get records by index
   */
  async getByIndex(storeName: string, indexName: string, value: any): Promise<any[]> {
    return this.transaction(storeName, 'readonly', async (store) => {
      return new Promise((resolve, reject) => {
        const index = (store as IDBObjectStore).index(indexName);
        const request = index.getAll(value);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Put (insert or update) a record
   */
  async put(storeName: string, data: any): Promise<void> {
    return this.transaction(storeName, 'readwrite', async (store) => {
      return new Promise((resolve, reject) => {
        const request = (store as IDBObjectStore).put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Delete a record by ID
   */
  async delete(storeName: string, id: string): Promise<void> {
    return this.transaction(storeName, 'readwrite', async (store) => {
      return new Promise((resolve, reject) => {
        const request = (store as IDBObjectStore).delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Count records in a store
   */
  async count(storeName: string): Promise<number> {
    return this.transaction(storeName, 'readonly', async (store) => {
      return new Promise((resolve, reject) => {
        const request = (store as IDBObjectStore).count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Clear all records from a store
   */
  async clear(storeName: string): Promise<void> {
    return this.transaction(storeName, 'readwrite', async (store) => {
      return new Promise((resolve, reject) => {
        const request = (store as IDBObjectStore).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('🗄️ Browser database connection closed');
    }
  }

  /**
   * Delete the entire database
   */
  async deleteDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(this.config.databaseName);
      deleteRequest.onsuccess = () => {
        console.log('🗑️ Browser database deleted');
        resolve();
      };
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    if (!this.db) {
      return null;
    }

    const stats: any = {
      databaseName: this.config.databaseName,
      version: this.config.version,
      stores: {}
    };

    for (const storeName of this.config.stores) {
      try {
        const count = await this.count(storeName);
        stats.stores[storeName] = { count };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        stats.stores[storeName] = { count: 0, error: errorMessage };
      }
    }

    return stats;
  }
}

/**
 * Create default browser database configuration
 */
export function createBrowserDatabaseConfig(): BrowserDatabaseConfig {
  return {
    databaseName: 'sizewise-suite',
    version: 1,
    stores: ['users', 'projects', 'feature_flags', 'calculations', 'exports']
  };
}

/**
 * Singleton instance for browser database
 */
let browserDbInstance: BrowserDatabaseManager | null = null;

/**
 * Get browser database instance
 */
export function getBrowserDatabase(): BrowserDatabaseManager {
  if (!browserDbInstance) {
    const config = createBrowserDatabaseConfig();
    browserDbInstance = new BrowserDatabaseManager(config);
  }
  return browserDbInstance;
}

/**
 * Initialize browser database
 */
export async function initializeBrowserDatabase(): Promise<BrowserDatabaseManager> {
  const db = getBrowserDatabase();
  await db.initialize();
  return db;
}
