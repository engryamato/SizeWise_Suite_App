/**
 * Authentication Type Definitions for SizeWise Suite
 * 
 * Comprehensive type definitions for authentication, session management,
 * and authorization across the application.
 */

// ========================================
// CORE AUTHENTICATION TYPES
// ========================================

export interface AuthSession {
  sessionId: string;
  userId: string;
  email: string;
  tier: 'free' | 'pro' | 'enterprise' | 'super_admin';
  issuedAt: number;
  expiresAt: number;
  lastActivity: number;
  deviceFingerprint: string;
  permissions: string[];
}

// User tier type
export type UserTier = 'free' | 'pro' | 'enterprise' | 'super_admin';

// Permission type
export type Permission =
  // Basic permissions
  | 'basic_calculations'
  | 'unlimited_projects'
  | 'high_res_export'
  | 'advanced_analytics'
  | 'team_collaboration'
  | 'api_access'
  // Admin permissions
  | 'admin:user_management'
  | 'admin:system_settings'
  | 'admin:audit_logs'
  | 'admin:full_access'
  | 'admin:super_admin_functions';

// Permission set type
export interface PermissionSet {
  tier: UserTier;
  permissions: Permission[];
  features: string[];
  limits: {
    maxProjects: number;
    maxCalculations: number;
    maxTeamMembers: number;
    storageLimit: number;
    maxApiCalls: number;
    maxStorageGB: number;
  };
}

// Super admin validation result
export interface SuperAdminValidationResult {
  isValid: boolean;
  valid: boolean;
  session?: SuperAdminSession;
  error?: string;
  requiresReauth?: boolean;
}

// Emergency access request
export interface EmergencyAccessRequest {
  userId: string;
  reason: string;
  duration: number;
  justification: string;
  emergencyCode: string;
  requestedPermissions?: string[];
  hardwareKeyProof?: string;
  contactInfo?: string;
}

// Emergency access result
export interface EmergencyAccessResult {
  success: boolean;
  granted: boolean;
  superAdminSession?: SuperAdminSession;
  sessionId?: string;
  expiresAt?: number;
  error?: string;
  auditId: string;
}

export interface SuperAdminSession extends AuthSession {
  superAdminSessionId: string;
  hardwareKeyId: string;
  emergencyAccess: boolean;
  superAdminPermissions: string[];
  superAdminExpiresAt: number;
}

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  token?: string;
  error?: string;
  securityEvent?: string;
}

export interface SuperAdminAuthResult {
  success: boolean;
  session?: SuperAdminSession;
  token?: string;
  error?: string;
  requiresHardwareKey?: boolean;
  securityEvent?: string;
}

// ========================================
// HARDWARE KEY AUTHENTICATION
// ========================================

export interface HardwareKeyAuthRequest {
  userId: string;
  hardwareKeyId: string;
  challenge: string;
  signature: string;
  clientData: string;
}







// ========================================
// JWT TOKEN TYPES
// ========================================

export interface JWTPayload {
  sub: string; // userId
  email: string;
  tier: string;
  permissions: string[];
  sessionId: string;
  iat: number;
  exp: number;
  deviceFingerprint: string;
}

export interface JWTValidationResult {
  success: boolean;
  payload?: JWTPayload;
  error?: string;
  expired?: boolean;
}

// ========================================
// LICENSE VALIDATION TYPES
// ========================================

export interface LicenseInfo {
  licenseKey: string;
  userId: string;
  email: string;
  tier: 'free' | 'pro' | 'enterprise' | 'super_admin';
  permissions: string[];
  issuedAt: number;
  expiresAt: number;
  maxDevices: number;
  features: string[];
}

export interface LicenseValidationResult {
  valid: boolean;
  licenseInfo?: LicenseInfo;
  error?: string;
  expired?: boolean;
  deviceLimitExceeded?: boolean;
}

// ========================================
// SESSION MANAGEMENT TYPES
// ========================================

export interface SessionConfig {
  sessionTimeout: number;
  activityTimeout: number;
  superAdminTimeout: number;
  maxConcurrentSessions: number;
  requireDeviceFingerprint: boolean;
}

export interface SessionValidationResult {
  valid: boolean;
  session?: AuthSession;
  error?: string;
  expired?: boolean;
  requiresRefresh?: boolean;
}

export interface DeviceFingerprint {
  userAgent: string;
  screen: string;
  timezone: string;
  language: string;
  platform: string;
  hash: string;
}

// ========================================
// SECURITY LOGGING TYPES
// ========================================

export interface SecurityEvent {
  eventType: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  success: boolean;
}

// ========================================
// PERMISSION TYPES
// ========================================





// ========================================
// ERROR TYPES
// ========================================

export type AuthErrorCode = 
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'SESSION_NOT_FOUND'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'LICENSE_INVALID'
  | 'LICENSE_EXPIRED'
  | 'DEVICE_LIMIT_EXCEEDED'
  | 'PERMISSION_DENIED'
  | 'HARDWARE_KEY_REQUIRED'
  | 'SUPER_ADMIN_REQUIRED'
  | 'EMERGENCY_ACCESS_DENIED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SECURITY_VIOLATION'
  | 'AUTHENTICATION_ERROR'
  | 'VALIDATION_ERROR';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
  requestId?: string;
}

// ========================================
// CONFIGURATION TYPES
// ========================================

export interface AuthConfig {
  jwtSecret: string;
  sessionTimeout: number;
  activityTimeout: number;
  superAdminTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  requireDeviceFingerprint: boolean;
  enableSuperAdminMode: boolean;
  emergencyAccessEnabled: boolean;
  auditLogRetention: number;
}

// ========================================
// UTILITY TYPES
// ========================================

export type AuthenticationMethod = 'password' | 'license' | 'hardware_key' | 'emergency_access';

export interface AuthenticationContext {
  method: AuthenticationMethod;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  timestamp: number;
}

export interface SessionMetadata {
  createdAt: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  authenticationMethod: AuthenticationMethod;
}
