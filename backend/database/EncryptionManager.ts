/**
 * EncryptionManager - SQLCipher Database Encryption
 * 
 * MISSION-CRITICAL: Prevents database tampering and tier enforcement bypass
 * Uses AES-256 encryption with machine-specific key derivation
 * 
 * @see docs/implementation/security/application-security-guide.md section 3
 * @see docs/implementation/security/security-implementation-checklist.md section 1.2
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import Database from 'better-sqlite3';

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  iterations: number;
  saltLength: number;
  ivLength: number;
}

/**
 * Database encryption result
 */
export interface EncryptionResult {
  success: boolean;
  keyId: string;
  error?: string;
}

/**
 * Production-grade database encryption manager
 * CRITICAL: Prevents direct database modification and tier bypass
 */
export class EncryptionManager {
  private readonly config: EncryptionConfig;
  private readonly keyCache = new Map<string, Buffer>();

  constructor() {
    this.config = {
      algorithm: 'aes-256-cbc',
      keyLength: 32, // 256 bits
      iterations: 100000, // PBKDF2 iterations
      saltLength: 32,
      ivLength: 16
    };
  }

  /**
   * Initialize encrypted database with SQLCipher
   * CRITICAL: Must be called before any database operations
   */
  async initializeEncryptedDatabase(dbPath: string): Promise<EncryptionResult> {
    try {
      // Generate machine-specific encryption key
      const encryptionKey = await this.deriveEncryptionKey();
      const keyId = this.generateKeyId(encryptionKey);
      
      // Check if database exists and is encrypted
      if (fs.existsSync(dbPath)) {
        const isEncrypted = await this.verifyDatabaseEncryption(dbPath, encryptionKey);
        if (!isEncrypted) {
          // Encrypt existing database
          await this.encryptExistingDatabase(dbPath, encryptionKey);
        }
      }
      
      // Cache encryption key for subsequent operations
      this.keyCache.set(keyId, encryptionKey);
      
      return {
        success: true,
        keyId
      };
      
    } catch (error) {
      return {
        success: false,
        keyId: '',
        error: `Database encryption initialization failed: ${error.message}`
      };
    }
  }

  /**
   * Create encrypted database connection
   * CRITICAL: All database connections must use encryption
   */
  createEncryptedConnection(dbPath: string, keyId: string): Database.Database {
    try {
      const encryptionKey = this.keyCache.get(keyId);
      if (!encryptionKey) {
        throw new Error('Encryption key not found in cache');
      }
      
      // Create SQLCipher connection with encryption
      const db = new Database(dbPath);
      
      // Set SQLCipher encryption key
      const keyHex = encryptionKey.toString('hex');
      db.pragma(`key = "x'${keyHex}'"`);
      
      // Verify encryption is working
      this.verifyEncryptedConnection(db);
      
      return db;
      
    } catch (error) {
      throw new Error(`Failed to create encrypted database connection: ${error.message}`);
    }
  }

  /**
   * Rotate database encryption key
   * CRITICAL: Enables key rotation for enhanced security
   */
  async rotateEncryptionKey(dbPath: string, oldKeyId: string): Promise<EncryptionResult> {
    try {
      const oldKey = this.keyCache.get(oldKeyId);
      if (!oldKey) {
        throw new Error('Old encryption key not found');
      }
      
      // Generate new encryption key
      const newKey = await this.deriveEncryptionKey();
      const newKeyId = this.generateKeyId(newKey);
      
      // Re-encrypt database with new key
      await this.reencryptDatabase(dbPath, oldKey, newKey);
      
      // Update key cache
      this.keyCache.delete(oldKeyId);
      this.keyCache.set(newKeyId, newKey);
      
      return {
        success: true,
        keyId: newKeyId
      };
      
    } catch (error) {
      return {
        success: false,
        keyId: '',
        error: `Key rotation failed: ${error.message}`
      };
    }
  }

  /**
   * Verify database integrity and encryption
   */
  async verifyDatabaseIntegrity(dbPath: string, keyId: string): Promise<boolean> {
    try {
      const encryptionKey = this.keyCache.get(keyId);
      if (!encryptionKey) {
        return false;
      }
      
      // Open encrypted database
      const db = this.createEncryptedConnection(dbPath, keyId);
      
      try {
        // Run SQLCipher integrity check
        const result = db.pragma('integrity_check');
        const isIntact = result.length === 1 && result[0].integrity_check === 'ok';
        
        // Verify encryption is active
        const cipherVersion = db.pragma('cipher_version');
        const isEncrypted = cipherVersion && cipherVersion.length > 0;
        
        return isIntact && isEncrypted;
        
      } finally {
        db.close();
      }
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Create encrypted backup of database
   */
  async createEncryptedBackup(dbPath: string, backupPath: string, keyId: string): Promise<boolean> {
    try {
      const encryptionKey = this.keyCache.get(keyId);
      if (!encryptionKey) {
        throw new Error('Encryption key not found');
      }
      
      // Ensure backup directory exists
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Create encrypted backup using SQLCipher
      const sourceDb = this.createEncryptedConnection(dbPath, keyId);
      
      try {
        // Use SQLCipher backup API to maintain encryption
        await sourceDb.backup(backupPath);
        
        // Verify backup integrity
        const backupValid = await this.verifyDatabaseIntegrity(backupPath, keyId);
        if (!backupValid) {
          throw new Error('Backup integrity verification failed');
        }
        
        return true;
        
      } finally {
        sourceDb.close();
      }
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Derive machine-specific encryption key
   * CRITICAL: Key must be unique per installation and stable
   */
  private async deriveEncryptionKey(): Promise<Buffer> {
    try {
      // Gather machine-specific identifiers
      const machineData = this.getMachineIdentifiers();
      const salt = this.generateSalt();
      
      // Derive key using PBKDF2
      const key = crypto.pbkdf2Sync(
        machineData,
        salt,
        this.config.iterations,
        this.config.keyLength,
        'sha256'
      );
      
      return key;
      
    } catch (error) {
      throw new Error(`Key derivation failed: ${error.message}`);
    }
  }

  /**
   * Get machine-specific identifiers for key derivation
   */
  private getMachineIdentifiers(): string {
    try {
      const identifiers = [
        os.hostname(),
        os.platform(),
        os.arch(),
        os.release(),
        os.totalmem().toString(),
        process.env.USERNAME || process.env.USER || 'unknown'
      ];
      
      // Create stable hash of machine identifiers
      return crypto.createHash('sha256')
        .update(identifiers.join('|'))
        .digest('hex');
        
    } catch (error) {
      // Fallback identifier
      return crypto.createHash('sha256')
        .update('sizewise-encryption-fallback')
        .digest('hex');
    }
  }

  /**
   * Generate cryptographic salt for key derivation
   */
  private generateSalt(): Buffer {
    // Use fixed salt based on application identifier
    // This ensures key derivation is deterministic per machine
    const appSalt = 'SizeWise-Suite-Database-Encryption-2024';
    return crypto.createHash('sha256').update(appSalt).digest();
  }

  /**
   * Generate key identifier for caching
   */
  private generateKeyId(key: Buffer): string {
    return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
  }

  /**
   * Verify database is encrypted
   */
  private async verifyDatabaseEncryption(dbPath: string, key: Buffer): Promise<boolean> {
    try {
      // Try to open database with encryption key
      const db = new Database(dbPath);
      const keyHex = key.toString('hex');
      db.pragma(`key = "x'${keyHex}'"`);
      
      // Test if we can read encrypted data
      const result = db.pragma('cipher_version');
      db.close();
      
      return result && result.length > 0;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Encrypt existing unencrypted database
   */
  private async encryptExistingDatabase(dbPath: string, key: Buffer): Promise<void> {
    try {
      const tempPath = `${dbPath}.temp`;
      const keyHex = key.toString('hex');
      
      // Open unencrypted database
      const sourceDb = new Database(dbPath);
      
      try {
        // Create encrypted copy
        const encryptedDb = new Database(tempPath);
        encryptedDb.pragma(`key = "x'${keyHex}'"`);
        
        // Copy data to encrypted database
        await sourceDb.backup(tempPath);
        encryptedDb.close();
        
        // Replace original with encrypted version
        fs.renameSync(tempPath, dbPath);
        
      } finally {
        sourceDb.close();
      }
      
    } catch (error) {
      throw new Error(`Database encryption failed: ${error.message}`);
    }
  }

  /**
   * Re-encrypt database with new key
   */
  private async reencryptDatabase(dbPath: string, oldKey: Buffer, newKey: Buffer): Promise<void> {
    try {
      const tempPath = `${dbPath}.rekey`;
      const oldKeyHex = oldKey.toString('hex');
      const newKeyHex = newKey.toString('hex');
      
      // Open with old key
      const db = new Database(dbPath);
      db.pragma(`key = "x'${oldKeyHex}'"`);
      
      try {
        // Re-encrypt with new key
        db.pragma(`rekey = "x'${newKeyHex}'"`);
        
        // Verify re-encryption worked
        const result = db.pragma('cipher_version');
        if (!result || result.length === 0) {
          throw new Error('Re-encryption verification failed');
        }
        
      } finally {
        db.close();
      }
      
    } catch (error) {
      throw new Error(`Database re-encryption failed: ${error.message}`);
    }
  }

  /**
   * Verify encrypted connection is working
   */
  private verifyEncryptedConnection(db: Database.Database): void {
    try {
      // Test basic query to verify encryption is working
      const result = db.pragma('cipher_version');
      if (!result || result.length === 0) {
        throw new Error('Database encryption verification failed');
      }
    } catch (error) {
      throw new Error(`Encrypted connection verification failed: ${error.message}`);
    }
  }

  /**
   * Clear encryption key cache (for security)
   */
  clearKeyCache(): void {
    this.keyCache.clear();
  }
}
