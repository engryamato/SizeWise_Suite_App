/**
 * SuperAdminTypes - Type Definitions for Super Administrator System
 * 
 * MISSION-CRITICAL: Type definitions for super administrator security system
 * Provides comprehensive type safety for hardware key authentication and emergency access
 * 
 * @see docs/implementation/security/super-admin-architecture.md
 */

/**
 * Super Administrator Permission Actions
 */
export enum SuperAdminAction {
  LICENSE_RESET = 'license_reset',
  USER_RECOVERY = 'user_recovery',
  DATABASE_REPAIR = 'database_repair',
  EMERGENCY_UNLOCK = 'emergency_unlock',
  SYSTEM_RECOVERY = 'system_recovery'
}

/**
 * Super Administrator Permission Scopes
 */
export enum SuperAdminScope {
  GLOBAL = 'global',
  USER = 'user',
  LICENSE = 'license',
  DATABASE = 'database'
}

/**
 * Hardware Key Algorithms
 */
export enum HardwareKeyAlgorithm {
  ES256 = 'ES256',
  RS256 = 'RS256'
}

/**
 * Super Administrator Audit Actions
 */
export enum SuperAdminAuditAction {
  HARDWARE_KEY_REGISTERED = 'hardware_key_registered',
  HARDWARE_KEY_REGISTRATION_FAILED = 'hardware_key_registration_failed',
  HARDWARE_KEY_REGISTRATION_ERROR = 'hardware_key_registration_error',
  SUPER_ADMIN_AUTHENTICATED = 'super_admin_authenticated',
  SUPER_ADMIN_AUTH_FAILED = 'super_admin_auth_failed',
  SUPER_ADMIN_AUTH_ERROR = 'super_admin_auth_error',
  EMERGENCY_ACCESS_GRANTED = 'emergency_access_granted',
  EMERGENCY_ACCESS_DENIED = 'emergency_access_denied',
  EMERGENCY_ACCESS_ERROR = 'emergency_access_error',
  SESSION_EXPIRED = 'session_expired',
  SESSION_REVOKED = 'session_revoked',
  SESSION_CLEANUP = 'session_cleanup'
}

/**
 * Hardware Key Credential Interface
 */
export interface IHardwareKeyCredential {
  keyId: string;
  publicKey: string;
  algorithm: HardwareKeyAlgorithm;
  counter: number;
  attestation?: string;
  registeredAt: Date;
  lastUsed?: Date;
}

/**
 * Super Administrator Permission Interface
 */
export interface ISuperAdminPermission {
  action: SuperAdminAction;
  scope: SuperAdminScope;
  granted: boolean;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
  conditions?: Record<string, any>;
}

/**
 * Super Administrator Session Interface
 */
export interface ISuperAdminSession {
  sessionId: string;
  userId: string;
  hardwareKeyId: string;
  createdAt: Date;
  expiresAt: Date;
  permissions: ISuperAdminPermission[];
  emergencyAccess: boolean;
  ipAddress: string;
  userAgent: string;
  auditTrail: ISuperAdminAuditEntry[];
}

/**
 * Super Administrator Audit Entry Interface
 */
export interface ISuperAdminAuditEntry {
  id: string;
  timestamp: Date;
  action: SuperAdminAuditAction;
  userId: string;
  hardwareKeyId: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Emergency Access Request Interface
 */
export interface IEmergencyAccessRequest {
  requestId: string;
  reason: string;
  requestedPermissions: SuperAdminAction[];
  hardwareKeyProof: string;
  emergencyCode?: string;
  contactInfo: string;
  requestedAt: Date;
  requestedBy: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * Super Administrator Validation Result Interface
 */
export interface ISuperAdminValidationResult {
  valid: boolean;
  sessionId?: string;
  permissions: ISuperAdminPermission[];
  expiresAt?: Date;
  emergencyAccess: boolean;
  reason?: string;
  auditId: string;
  securityLevel: 'standard' | 'elevated' | 'emergency';
}

/**
 * Hardware Key Registration Request Interface
 */
export interface IHardwareKeyRegistrationRequest {
  adminUserId: string;
  keyCredential: IHardwareKeyCredential;
  attestationData?: ArrayBuffer;
  registrationChallenge: string;
  clientData: string;
}

/**
 * Super Administrator Authentication Request Interface
 */
export interface ISuperAdminAuthRequest {
  userId: string;
  hardwareKeyId: string;
  signature: string;
  challenge: string;
  clientData: string;
  ipAddress: string;
  userAgent: string;
  requestedPermissions?: SuperAdminAction[];
}

/**
 * Super Administrator Security Configuration Interface
 */
export interface ISuperAdminSecurityConfig {
  sessionTimeout: number;
  maxConcurrentSessions: number;
  emergencyAccessTimeout: number;
  auditRetentionDays: number;
  requireHardwareKey: boolean;
  allowEmergencyAccess: boolean;
  enableAuditLogging: boolean;
  securityLevel: 'standard' | 'high' | 'maximum';
}

/**
 * Super Administrator Security Statistics Interface
 */
export interface ISuperAdminSecurityStats {
  activeSessionCount: number;
  registeredKeyCount: number;
  auditLogSize: number;
  recentFailedAttempts: number;
  emergencyAccessCount: number;
  lastSuccessfulAuth?: Date;
  lastFailedAuth?: Date;
  securityAlerts: number;
}

/**
 * Hardware Key Validation Result Interface
 */
export interface IHardwareKeyValidationResult {
  valid: boolean;
  keyId?: string;
  algorithm?: HardwareKeyAlgorithm;
  reason?: string;
  securityLevel: 'basic' | 'enhanced' | 'maximum';
}

/**
 * Emergency Access Validation Result Interface
 */
export interface IEmergencyAccessValidationResult {
  valid: boolean;
  requestId?: string;
  approvedPermissions: SuperAdminAction[];
  reason?: string;
  requiresApproval: boolean;
  approvalRequired?: string[];
}

/**
 * Super Administrator Operation Context Interface
 */
export interface ISuperAdminOperationContext {
  sessionId: string;
  userId: string;
  action: SuperAdminAction;
  scope: SuperAdminScope;
  targetResource?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  auditRequired: boolean;
}

/**
 * Super Administrator Security Event Interface
 */
export interface ISuperAdminSecurityEvent {
  eventId: string;
  timestamp: Date;
  eventType: 'authentication' | 'authorization' | 'emergency' | 'security_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  sessionId?: string;
  description: string;
  details: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

/**
 * Type Guards for Super Administrator Types
 */
export class SuperAdminTypeGuards {
  static isValidAction(action: string): action is SuperAdminAction {
    return Object.values(SuperAdminAction).includes(action as SuperAdminAction);
  }

  static isValidScope(scope: string): scope is SuperAdminScope {
    return Object.values(SuperAdminScope).includes(scope as SuperAdminScope);
  }

  static isValidAlgorithm(algorithm: string): algorithm is HardwareKeyAlgorithm {
    return Object.values(HardwareKeyAlgorithm).includes(algorithm as HardwareKeyAlgorithm);
  }

  static isValidAuditAction(action: string): action is SuperAdminAuditAction {
    return Object.values(SuperAdminAuditAction).includes(action as SuperAdminAuditAction);
  }

  static isEmergencySession(session: ISuperAdminSession): boolean {
    return session.emergencyAccess === true;
  }

  static hasPermission(session: ISuperAdminSession, action: SuperAdminAction, scope: SuperAdminScope): boolean {
    return session.permissions.some(
      permission => permission.action === action && 
                   permission.scope === scope && 
                   permission.granted &&
                   (!permission.expiresAt || permission.expiresAt > new Date())
    );
  }

  static isSessionExpired(session: ISuperAdminSession): boolean {
    return session.expiresAt < new Date();
  }

  static isHighSeverityEvent(event: ISuperAdminSecurityEvent): boolean {
    return event.severity === 'high' || event.severity === 'critical';
  }
}

/**
 * Super Administrator Constants
 */
export const SUPER_ADMIN_CONSTANTS = {
  DEFAULT_SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  DEFAULT_EMERGENCY_TIMEOUT: 60 * 60 * 1000, // 1 hour
  MAX_CONCURRENT_SESSIONS: 2,
  MAX_AUDIT_LOG_SIZE: 10000,
  MIN_EMERGENCY_REASON_LENGTH: 10,
  MAX_EMERGENCY_REASON_LENGTH: 500,
  HARDWARE_KEY_CHALLENGE_SIZE: 32,
  AUDIT_RETENTION_DAYS: 365
} as const;
