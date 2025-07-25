/**
 * Super Administrator Configuration
 * 
 * Secure configuration for super administrator account with elevated privileges
 * for the SizeWise Suite application
 */

import { User } from '@/types/air-duct-sizer';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

// =============================================================================
// Super Admin Configuration
// =============================================================================

/**
 * Super Admin User Configuration
 * CRITICAL: This user has full access to all features and administrative functions
 */
export const SUPER_ADMIN_CONFIG = {
  // User credentials (secure generation)
  username: 'sizewise_admin',
  email: 'admin@sizewise.com',
  
  // Secure password generation (will be hashed)
  password: generateSecurePassword(),
  
  // User profile
  name: 'SizeWise Administrator',
  company: 'SizeWise Suite',
  
  // Permissions and access
  tier: 'super_admin' as const,
  permissions: [
    'admin:full_access',
    'admin:user_management',
    'admin:system_configuration',
    'admin:license_management',
    'admin:database_access',
    'admin:security_settings',
    'admin:audit_logs',
    'admin:emergency_access',
    'admin:super_admin_functions',
    'user:all_features',
    'user:unlimited_access',
    'user:export_without_watermark',
    'user:advanced_calculations',
    'user:simulation_access',
    'user:catalog_access',
    'user:computational_properties',
  ],
  
  // Security settings
  security: {
    requireMFA: false, // Phase 1 - offline mode
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
    maxConcurrentSessions: 3,
    passwordExpiry: null, // No expiry for super admin in Phase 1
    accountLockout: false, // No lockout for super admin
  },
  
  // Feature flags
  features: {
    allToolsAccess: true,
    unlimitedProjects: true,
    unlimitedRooms: true,
    unlimitedSegments: true,
    advancedExports: true,
    systemDiagnostics: true,
    userImpersonation: true,
    databaseManagement: true,
  },
} as const;

// =============================================================================
// Secure Password Generation
// =============================================================================

/**
 * Generate a secure password for the super admin account
 */
function generateSecurePassword(): string {
  // For Phase 1 offline mode, use a strong but memorable password
  // In Phase 2, this would be generated more securely and stored in environment variables
  const timestamp = Date.now().toString().slice(-6);
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `SizeWise2024!${randomPart}${timestamp}`;
}

/**
 * Hash password using crypto
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against hash
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// =============================================================================
// Super Admin User Creation
// =============================================================================

/**
 * Create super admin user object
 */
export function createSuperAdminUser(): User {
  const now = new Date().toISOString();
  
  return {
    id: 'super-admin-' + uuidv4(),
    email: SUPER_ADMIN_CONFIG.email,
    name: SUPER_ADMIN_CONFIG.name,
    tier: SUPER_ADMIN_CONFIG.tier,
    company: SUPER_ADMIN_CONFIG.company,
    subscription_expires: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 10 years
    created_at: now,
    updated_at: now,
    permissions: SUPER_ADMIN_CONFIG.permissions,
    is_super_admin: true,
  };
}

// =============================================================================
// Permission Checking
// =============================================================================

/**
 * Check if user has super admin privileges
 */
export function isSuperAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.tier === 'super_admin' || user.is_super_admin === true;
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true; // Super admin has all permissions
  return user.permissions?.includes(permission) || false;
}

/**
 * Check if user can access admin features
 */
export function canAccessAdmin(user: User | null): boolean {
  return hasPermission(user, 'admin:full_access');
}

/**
 * Get user's tier limits (super admin has unlimited access)
 */
export function getSuperAdminTierLimits() {
  return {
    maxRooms: Infinity,
    maxSegments: Infinity,
    maxProjects: Infinity,
    canEditComputationalProperties: true,
    canExportWithoutWatermark: true,
    canUseSimulation: true,
    canUseCatalog: true,
    canAccessAllTools: true,
    canManageUsers: true,
    canManageSystem: true,
    canAccessDiagnostics: true,
  };
}

// =============================================================================
// Environment Configuration
// =============================================================================

/**
 * Get super admin credentials for display (after creation)
 */
export function getSuperAdminCredentials() {
  return {
    username: SUPER_ADMIN_CONFIG.username,
    email: SUPER_ADMIN_CONFIG.email,
    password: SUPER_ADMIN_CONFIG.password,
    loginUrl: '/auth/login',
    note: 'These credentials provide full administrative access to SizeWise Suite',
  };
}

// =============================================================================
// Security Utilities
// =============================================================================

/**
 * Generate secure session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create secure session for super admin
 */
export function createSuperAdminSession(user: User) {
  return {
    sessionId: generateSessionToken(),
    userId: user.id,
    email: user.email,
    tier: user.tier,
    issuedAt: Date.now(),
    expiresAt: Date.now() + SUPER_ADMIN_CONFIG.security.sessionTimeout,
    lastActivity: Date.now(),
    deviceFingerprint: 'desktop-app',
    permissions: user.permissions || [],
    isSuperAdmin: true,
  };
}

// =============================================================================
// Export Configuration
// =============================================================================

export default SUPER_ADMIN_CONFIG;
