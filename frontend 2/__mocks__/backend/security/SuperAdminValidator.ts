/**
 * Mock SuperAdminValidator for Jest tests
 */

export interface HardwareKeyCredential {
  keyId: string;
  signature: string;
  timestamp: number;
  challenge: string;
}

export interface EmergencyAccessRequest {
  requestId: string;
  reason: string;
  timestamp: number;
  requesterInfo: any;
}

export interface SuperAdminValidationResult {
  isValid: boolean;
  adminLevel: 'super' | 'emergency' | 'none';
  permissions: string[];
  sessionToken?: string;
  expiresAt?: number;
  errors?: string[];
}

export class MockSuperAdminValidator {
  private validKeys = new Set(['mock-hardware-key-1', 'mock-hardware-key-2']);
  private emergencyAccess = false;

  async validateHardwareKey(credential: HardwareKeyCredential): Promise<SuperAdminValidationResult> {
    const isValid = this.validKeys.has(credential.keyId) && 
                   credential.signature === 'valid-signature' &&
                   Date.now() - credential.timestamp < 300000; // 5 minutes

    if (isValid) {
      return {
        isValid: true,
        adminLevel: 'super',
        permissions: ['*'],
        sessionToken: 'mock-super-admin-token',
        expiresAt: Date.now() + 3600000 // 1 hour
      };
    }

    return {
      isValid: false,
      adminLevel: 'none',
      permissions: [],
      errors: ['Invalid hardware key credential']
    };
  }

  async validateEmergencyAccess(request: EmergencyAccessRequest): Promise<SuperAdminValidationResult> {
    if (this.emergencyAccess && request.reason && request.reason.length > 10) {
      return {
        isValid: true,
        adminLevel: 'emergency',
        permissions: ['read', 'emergency-override'],
        sessionToken: 'mock-emergency-token',
        expiresAt: Date.now() + 1800000 // 30 minutes
      };
    }

    return {
      isValid: false,
      adminLevel: 'none',
      permissions: [],
      errors: ['Emergency access not authorized']
    };
  }

  async generateChallenge(): Promise<string> {
    return 'mock-challenge-' + Date.now();
  }

  async verifyChallenge(challenge: string, response: string): Promise<boolean> {
    return challenge.startsWith('mock-challenge-') && response === 'valid-response';
  }

  enableEmergencyAccess(enabled: boolean): void {
    this.emergencyAccess = enabled;
  }

  isEmergencyAccessEnabled(): boolean {
    return this.emergencyAccess;
  }

  addValidKey(keyId: string): void {
    this.validKeys.add(keyId);
  }

  removeValidKey(keyId: string): void {
    this.validKeys.delete(keyId);
  }

  getValidKeys(): string[] {
    return Array.from(this.validKeys);
  }

  async auditAccess(result: SuperAdminValidationResult, context: any): Promise<void> {
    // Mock audit logging
  }

  async revokeSession(sessionToken: string): Promise<boolean> {
    return sessionToken.startsWith('mock-');
  }

  async validateSession(sessionToken: string): Promise<SuperAdminValidationResult> {
    if (sessionToken === 'mock-super-admin-token') {
      return {
        isValid: true,
        adminLevel: 'super',
        permissions: ['*']
      };
    }

    if (sessionToken === 'mock-emergency-token') {
      return {
        isValid: true,
        adminLevel: 'emergency',
        permissions: ['read', 'emergency-override']
      };
    }

    return {
      isValid: false,
      adminLevel: 'none',
      permissions: [],
      errors: ['Invalid session token']
    };
  }
}

export const superAdminValidator = new MockSuperAdminValidator();
export default MockSuperAdminValidator;
