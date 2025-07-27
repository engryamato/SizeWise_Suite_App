/**
 * Mock for better-sqlite3 database
 * Used in Jest tests to avoid requiring actual SQLite database
 */

class MockDatabase {
  constructor(path) {
    this.path = path;
    this.isOpen = true;
    this.data = new Map();
    // Initialize mock tables
    this.tables = {
      users: new Map(),
      projects: new Map(),
      project_segments: new Map(),
      feature_flags: new Map(),
      change_log: [],
      schema_migrations: new Map()
    };
    // Set up initial schema migration
    this.tables.schema_migrations.set('1.0.0', {
      version: '1.0.0',
      description: 'Initial schema',
      applied_at: new Date().toISOString(),
      checksum: 'mock-checksum'
    });
  }

  prepare(sql) {
    const self = this;

    // Create mock statement with actual data operations
    const mockFn = (fn) => {
      if (typeof jest !== 'undefined') {
        return jest.fn().mockImplementation(fn);
      }
      return fn;
    };

    const mockReturnValue = (value) => {
      if (typeof jest !== 'undefined') {
        return jest.fn().mockReturnValue(value);
      }
      return () => value;
    };

    const mockReturnThis = () => {
      if (typeof jest !== 'undefined') {
        return jest.fn().mockReturnThis();
      }
      return () => self;
    };

    const mockStatement = {
      run: mockFn((...params) => {
        return self._executeRun(sql, params);
      }),
      get: mockFn((...params) => {
        return self._executeGet(sql, params);
      }),
      all: mockFn((...params) => {
        return self._executeAll(sql, params);
      }),
      iterate: mockReturnValue([]),
      pluck: mockReturnThis(),
      expand: mockReturnThis(),
      raw: mockReturnThis(),
      columns: mockReturnValue([]),
      bind: mockReturnThis(),
      safeIntegers: mockReturnThis()
    };

    return mockStatement;
  }

  _executeRun(sql, params) {
    // Handle INSERT OR REPLACE statements for users
    if (sql.includes('INSERT OR REPLACE INTO users')) {
      const [id, email, name, tier, company, licenseKey, organizationId, settings, createdAt, updatedAt] = params;

      // Ensure unique timestamps for testing by adding a small delay
      const existingUser = this.tables.users.get(id);
      let finalCreatedAt = createdAt;
      if (!existingUser && createdAt) {
        // For new users, ensure the timestamp is unique by adding milliseconds based on table size
        const timestamp = new Date(createdAt);
        timestamp.setMilliseconds(timestamp.getMilliseconds() + this.tables.users.size);
        finalCreatedAt = timestamp.toISOString();
      }

      this.tables.users.set(id, {
        id, email, name, tier, company, license_key: licenseKey,
        organization_id: organizationId, settings,
        created_at: finalCreatedAt, updated_at: updatedAt
      });
      return { changes: 1, lastInsertRowid: 1 };
    }

    // Handle INSERT INTO change_log
    if (sql.includes('INSERT INTO change_log')) {
      const [userId, entityType, entityId, operation, changes] = params;
      const logEntry = {
        id: this.tables.change_log.length + 1,
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        operation: operation,
        changes: changes,
        created_at: new Date().toISOString()
      };
      this.tables.change_log.push(logEntry);
      return { changes: 1, lastInsertRowid: logEntry.id };
    }

    // Handle INSERT INTO users (fallback)
    if (sql.includes('INSERT INTO users')) {
      const [id, name, email, tier, licenseKey, createdAt, updatedAt] = params;
      this.tables.users.set(id, {
        id, name, email, tier, license_key: licenseKey,
        created_at: createdAt, updated_at: updatedAt
      });
      return { changes: 1, lastInsertRowid: 1 };
    }

    // Handle UPDATE statements
    if (sql.includes('UPDATE users')) {
      if (sql.includes('SET tier')) {
        const [tier, updatedAt, id] = params;
        const user = this.tables.users.get(id);
        if (user) {
          user.tier = tier;
          user.updated_at = updatedAt;
          return { changes: 1 };
        }
        return { changes: 0 };
      }
    }

    // Handle INSERT INTO change_log
    if (sql.includes('INSERT INTO change_log')) {
      const [id, entityType, entityId, action, changes, userId, timestamp] = params;
      this.tables.change_log.push({
        id, entity_type: entityType, entity_id: entityId,
        action, changes, user_id: userId, timestamp
      });
      return { changes: 1, lastInsertRowid: this.tables.change_log.length };
    }

    return { changes: 1, lastInsertRowid: 1 };
  }

  _executeGet(sql, params) {
    // Handle schema migrations
    if (sql.includes('SELECT version FROM schema_migrations')) {
      return { version: '1.0.0' };
    }

    // Handle table existence checks
    if (sql.includes('SELECT name FROM sqlite_master WHERE type=\'table\'')) {
      const tableName = params[0];
      if (['users', 'projects', 'project_segments', 'feature_flags', 'change_log'].includes(tableName)) {
        return { name: tableName };
      }
      return null;
    }

    // Handle user queries with full column list (more flexible matching)
    if (sql.includes('FROM users') && sql.includes('WHERE id')) {
      const id = params[0];
      return this.tables.users.get(id) || null;
    }

    // Handle getCurrentUser query (more flexible pattern matching)
    if (sql.includes('FROM users') && sql.includes('ORDER BY created_at ASC') && sql.includes('LIMIT 1')) {
      const users = Array.from(this.tables.users.values()).sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      return users.length > 0 ? users[0] : null;
    }

    // Handle simple user queries (fallback)
    if (sql.includes('SELECT * FROM users WHERE id')) {
      const id = params[0];
      return this.tables.users.get(id) || null;
    }

    // Handle any SELECT query with ORDER BY created_at ASC LIMIT 1
    if (sql.includes('ORDER BY created_at ASC') && sql.includes('LIMIT 1') && sql.includes('FROM users')) {
      const users = Array.from(this.tables.users.values()).sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      return users.length > 0 ? users[0] : null;
    }

    // Handle count queries
    if (sql.includes('SELECT COUNT(*) as count FROM')) {
      if (sql.includes('FROM users')) {
        return { count: this.tables.users.size };
      }
      return { count: 0 };
    }

    return null;
  }

  _executeAll(sql, params) {
    // Handle schema table queries
    if (sql.includes('SELECT name, sql FROM sqlite_master')) {
      return [
        { name: 'users', sql: 'CREATE TABLE users (id TEXT PRIMARY KEY)' },
        { name: 'projects', sql: 'CREATE TABLE projects (id TEXT PRIMARY KEY)' },
        { name: 'feature_flags', sql: 'CREATE TABLE feature_flags (id TEXT PRIMARY KEY)' },
        { name: 'change_log', sql: 'CREATE TABLE change_log (id TEXT PRIMARY KEY)' }
      ];
    }

    // Handle change log queries
    if (sql.includes('SELECT * FROM change_log')) {
      return this.tables.change_log;
    }

    return [];
  }

  exec(sql) {
    return this;
  }

  close() {
    this.isOpen = false;
  }

  pragma(name, value) {
    // Handle specific pragma queries that return data
    if (value === undefined) {
      switch (name) {
        case 'integrity_check':
          return [{ integrity_check: 'ok' }];
        case 'foreign_key_check':
          return [];
        case 'cipher_version':
          return [{ cipher_version: '4.5.0' }];
        case 'journal_mode':
          return [{ journal_mode: 'wal' }];
        case 'synchronous':
          return [{ synchronous: 2 }];
        case 'cache_size':
          return [{ cache_size: 20000 }];
        case 'temp_store':
          return [{ temp_store: 2 }];
        case 'mmap_size':
          return [{ mmap_size: 536870912 }];
        case 'page_size':
          return [{ page_size: 4096 }];
        case 'busy_timeout':
          return [{ busy_timeout: 30000 }];
        case 'locking_mode':
          return [{ locking_mode: 'normal' }];
        case 'automatic_index':
          return [{ automatic_index: 1 }];
        default:
          return [{ [name]: 'ok' }];
      }
    }
    // Handle pragma settings (when value is provided)
    return this;
  }

  function(name, fn) {
    return this;
  }

  aggregate(name, fn) {
    return this;
  }

  backup(destination) {
    return {
      transfer: jest.fn().mockReturnValue(0),
      close: jest.fn()
    };
  }

  serialize() {
    return Buffer.alloc(0);
  }

  loadExtension(path) {
    return this;
  }

  defaultSafeIntegers(toggle) {
    return this;
  }

  unsafeMode(unsafe) {
    return this;
  }

  transaction(fn) {
    // Mock transaction function that executes the callback
    return function(...args) {
      return fn.apply(this, args);
    };
  }

  get inTransaction() {
    return false;
  }

  get open() {
    return this.isOpen;
  }

  get readonly() {
    return false;
  }

  get name() {
    return this.path;
  }

  get memory() {
    return this.path === ':memory:';
  }
}

module.exports = MockDatabase;
module.exports.default = MockDatabase;
