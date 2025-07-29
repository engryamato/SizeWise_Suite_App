/**
 * Mock KeystoreManager for Jest tests
 */

export interface LicenseKey {
  id: string;
  type: 'trial' | 'pro' | 'enterprise';
  expiresAt: number;
  features: string[];
  isValid: boolean;
}

export interface KeystoreConfig {
  encryptionKey?: string;
  storePath?: string;
  backupPath?: string;
}

export class MockKeystoreManager {
  private keys = new Map<string, LicenseKey>();
  private config: KeystoreConfig;

  constructor(config: KeystoreConfig = {}) {
    this.config = {
      encryptionKey: 'mock-encryption-key',
      storePath: 'mock-keystore.db',
      backupPath: 'mock-keystore-backup.db',
      ...config
    };

    // Add some default mock keys
    this.keys.set('trial-key-1', {
      id: 'trial-key-1',
      type: 'trial',
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
      features: ['basic-calculations', 'pdf-export'],
      isValid: true
    });

    this.keys.set('pro-key-1', {
      id: 'pro-key-1',
      type: 'pro',
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      features: ['basic-calculations', 'pdf-export', 'advanced-calculations', 'batch-processing'],
      isValid: true
    });
  }

  async initialize(): Promise<void> {
    // Mock initialization
  }

  async close(): Promise<void> {
    // Mock cleanup
  }

  async addKey(key: LicenseKey): Promise<void> {
    this.keys.set(key.id, key);
  }

  async removeKey(keyId: string): Promise<boolean> {
    return this.keys.delete(keyId);
  }

  async getKey(keyId: string): Promise<LicenseKey | null> {
    return this.keys.get(keyId) || null;
  }

  async getAllKeys(): Promise<LicenseKey[]> {
    return Array.from(this.keys.values());
  }

  async validateKey(keyId: string): Promise<boolean> {
    const key = this.keys.get(keyId);
    if (!key) return false;
    
    return key.isValid && key.expiresAt > Date.now();
  }

  async getActiveKey(): Promise<LicenseKey | null> {
    for (const key of this.keys.values()) {
      if (key.isValid && key.expiresAt > Date.now()) {
        return key;
      }
    }
    return null;
  }

  async setActiveKey(keyId: string): Promise<boolean> {
    const key = this.keys.get(keyId);
    if (!key || !key.isValid || key.expiresAt <= Date.now()) {
      return false;
    }
    
    // In a real implementation, this would set the active key
    return true;
  }

  async renewKey(keyId: string, newExpiryDate: number): Promise<boolean> {
    const key = this.keys.get(keyId);
    if (!key) return false;
    
    key.expiresAt = newExpiryDate;
    return true;
  }

  async upgradeKey(keyId: string, newType: 'trial' | 'pro' | 'enterprise'): Promise<boolean> {
    const key = this.keys.get(keyId);
    if (!key) return false;
    
    key.type = newType;
    
    // Update features based on type
    switch (newType) {
      case 'trial':
        key.features = ['basic-calculations', 'pdf-export'];
        break;
      case 'pro':
        key.features = ['basic-calculations', 'pdf-export', 'advanced-calculations', 'batch-processing'];
        break;
      case 'enterprise':
        key.features = ['basic-calculations', 'pdf-export', 'advanced-calculations', 'batch-processing', 'api-access', 'custom-integrations'];
        break;
    }
    
    return true;
  }

  async backup(): Promise<string> {
    return this.config.backupPath || 'mock-backup-path';
  }

  async restore(backupPath: string): Promise<boolean> {
    return true;
  }

  async exportKeys(): Promise<string> {
    return JSON.stringify(Array.from(this.keys.values()));
  }

  async importKeys(keysData: string): Promise<number> {
    try {
      const keys = JSON.parse(keysData) as LicenseKey[];
      let imported = 0;
      
      for (const key of keys) {
        this.keys.set(key.id, key);
        imported++;
      }
      
      return imported;
    } catch {
      return 0;
    }
  }

  async getKeyStats(): Promise<{ total: number; active: number; expired: number }> {
    const now = Date.now();
    let active = 0;
    let expired = 0;
    
    for (const key of this.keys.values()) {
      if (key.isValid && key.expiresAt > now) {
        active++;
      } else {
        expired++;
      }
    }
    
    return {
      total: this.keys.size,
      active,
      expired
    };
  }
}

export const keystoreManager = new MockKeystoreManager();
export default MockKeystoreManager;
