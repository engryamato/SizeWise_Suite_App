/**
 * Mock SecurityManager for Jest tests
 */

export interface SecurityConfig {
  encryptionKey?: string;
  hashSalt?: string;
  tokenExpiry?: number;
}

export class MockSecurityManager {
  private config: SecurityConfig;

  constructor(config: SecurityConfig = {}) {
    this.config = {
      encryptionKey: 'mock-encryption-key',
      hashSalt: 'mock-salt',
      tokenExpiry: 3600000,
      ...config
    };
  }

  async encrypt(data: string): Promise<string> {
    return `encrypted:${data}`;
  }

  async decrypt(encryptedData: string): Promise<string> {
    return encryptedData.replace('encrypted:', '');
  }

  async hash(data: string): Promise<string> {
    return `hashed:${data}`;
  }

  async verifyHash(data: string, hash: string): Promise<boolean> {
    return hash === `hashed:${data}`;
  }

  generateToken(payload: any): string {
    return `mock-token-${JSON.stringify(payload)}`;
  }

  verifyToken(token: string): any {
    if (token.startsWith('mock-token-')) {
      try {
        return JSON.parse(token.replace('mock-token-', ''));
      } catch {
        return null;
      }
    }
    return null;
  }

  generateSecureId(): string {
    return `mock-secure-id-${Date.now()}`;
  }

  sanitizeInput(input: string): string {
    return input.replace(/[<>]/g, '');
  }

  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (password.length < 8) errors.push('Password too short');
    if (!/[A-Z]/.test(password)) errors.push('Missing uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Missing lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('Missing number');
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  generateCSRFToken(): string {
    return 'mock-csrf-token';
  }

  validateCSRFToken(token: string): boolean {
    return token === 'mock-csrf-token';
  }

  rateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
    return true; // Always allow in tests
  }

  auditLog(action: string, userId?: string, details?: any): void {
    // Mock audit logging
  }
}

export const securityManager = new MockSecurityManager();
export default MockSecurityManager;
