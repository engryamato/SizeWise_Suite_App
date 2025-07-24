/**
 * SuperAdminConfig - Build Flag Configuration for Super Admin Features
 * 
 * MISSION-CRITICAL: Controls super administrator feature availability
 * Uses build flags and runtime checks to enable/disable super admin access
 * 
 * Security Features:
 * - Build-time feature flags
 * - Runtime environment checks
 * - Development vs production controls
 * - Emergency access configuration
 * 
 * @see docs/implementation/security/super-admin-architecture.md
 */

/**
 * Super Admin Build Configuration
 */
export interface SuperAdminBuildConfig {
  /** Whether super admin features are enabled */
  enabled: boolean;
  /** Development mode override */
  developmentMode: boolean;
  /** Production emergency access */
  emergencyAccessEnabled: boolean;
  /** Hardware key requirement */
  requireHardwareKey: boolean;
  /** Session timeout in milliseconds */
  sessionTimeout: number;
  /** Maximum concurrent sessions */
  maxConcurrentSessions: number;
  /** Audit logging enabled */
  auditLoggingEnabled: boolean;
  /** Debug mode for super admin */
  debugMode: boolean;
}

/**
 * Default Super Admin Configuration
 */
const DEFAULT_CONFIG: SuperAdminBuildConfig = {
  enabled: false,
  developmentMode: false,
  emergencyAccessEnabled: false,
  requireHardwareKey: true,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  maxConcurrentSessions: 2,
  auditLoggingEnabled: true,
  debugMode: false
};

/**
 * Super Admin Configuration Manager
 */
export class SuperAdminConfig {
  private static instance: SuperAdminConfig;
  private config: SuperAdminBuildConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  public static getInstance(): SuperAdminConfig {
    if (!SuperAdminConfig.instance) {
      SuperAdminConfig.instance = new SuperAdminConfig();
    }
    return SuperAdminConfig.instance;
  }

  /**
   * Load configuration from environment and build flags
   */
  private loadConfiguration(): SuperAdminBuildConfig {
    const config = { ...DEFAULT_CONFIG };

    // Environment-based configuration
    const nodeEnv = process.env.NODE_ENV;
    const isDevelopment = nodeEnv === 'development';
    const isTest = nodeEnv === 'test';

    // Build flag checks
    const explicitEnable = process.env.REACT_APP_ENABLE_SUPER_ADMIN === 'true';
    const emergencyEnable = process.env.REACT_APP_EMERGENCY_SUPER_ADMIN === 'true';
    const debugEnable = process.env.REACT_APP_SUPER_ADMIN_DEBUG === 'true';

    // Runtime window flag (for emergency access)
    const windowFlag = (window as any).__SIZEWISE_SUPER_ADMIN_ENABLED__;

    // Configuration logic
    config.enabled = isDevelopment || isTest || explicitEnable || windowFlag || emergencyEnable;
    config.developmentMode = isDevelopment;
    config.emergencyAccessEnabled = emergencyEnable || windowFlag;
    config.debugMode = debugEnable || isDevelopment;

    // Production overrides
    if (nodeEnv === 'production' && !emergencyEnable && !windowFlag) {
      config.enabled = false;
      config.debugMode = false;
    }

    // Security settings based on environment
    if (isDevelopment || isTest) {
      config.requireHardwareKey = false; // Easier testing
      config.sessionTimeout = 60 * 60 * 1000; // 1 hour for development
    }

    return config;
  }

  /**
   * Check if super admin features are enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Check if in development mode
   */
  public isDevelopmentMode(): boolean {
    return this.config.developmentMode;
  }

  /**
   * Check if emergency access is enabled
   */
  public isEmergencyAccessEnabled(): boolean {
    return this.config.emergencyAccessEnabled;
  }

  /**
   * Check if hardware key is required
   */
  public isHardwareKeyRequired(): boolean {
    return this.config.requireHardwareKey;
  }

  /**
   * Get session timeout
   */
  public getSessionTimeout(): number {
    return this.config.sessionTimeout;
  }

  /**
   * Get maximum concurrent sessions
   */
  public getMaxConcurrentSessions(): number {
    return this.config.maxConcurrentSessions;
  }

  /**
   * Check if audit logging is enabled
   */
  public isAuditLoggingEnabled(): boolean {
    return this.config.auditLoggingEnabled;
  }

  /**
   * Check if debug mode is enabled
   */
  public isDebugMode(): boolean {
    return this.config.debugMode;
  }

  /**
   * Get full configuration
   */
  public getConfig(): SuperAdminBuildConfig {
    return { ...this.config };
  }

  /**
   * Enable super admin features at runtime (emergency use)
   */
  public enableEmergencyAccess(reason: string): boolean {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Emergency super admin access requested in production:', reason);
      
      // In production, require additional verification
      const confirmationCode = prompt('Enter emergency confirmation code:');
      if (confirmationCode !== 'SIZEWISE_EMERGENCY_2024') {
        console.error('Invalid emergency confirmation code');
        return false;
      }
    }

    this.config.enabled = true;
    this.config.emergencyAccessEnabled = true;
    
    // Set window flag for persistence
    (window as any).__SIZEWISE_SUPER_ADMIN_ENABLED__ = true;
    (window as any).__SIZEWISE_EMERGENCY_REASON__ = reason;
    (window as any).__SIZEWISE_EMERGENCY_TIMESTAMP__ = new Date().toISOString();

    console.log('Emergency super admin access enabled:', reason);
    return true;
  }

  /**
   * Disable super admin features
   */
  public disableAccess(): void {
    this.config.enabled = false;
    this.config.emergencyAccessEnabled = false;
    
    // Clear window flags
    delete (window as any).__SIZEWISE_SUPER_ADMIN_ENABLED__;
    delete (window as any).__SIZEWISE_EMERGENCY_REASON__;
    delete (window as any).__SIZEWISE_EMERGENCY_TIMESTAMP__;

    console.log('Super admin access disabled');
  }

  /**
   * Get emergency access information
   */
  public getEmergencyInfo(): { reason?: string; timestamp?: string } | null {
    if (!this.config.emergencyAccessEnabled) {
      return null;
    }

    return {
      reason: (window as any).__SIZEWISE_EMERGENCY_REASON__,
      timestamp: (window as any).__SIZEWISE_EMERGENCY_TIMESTAMP__
    };
  }

  /**
   * Log configuration for debugging
   */
  public logConfiguration(): void {
    if (this.config.debugMode) {
      console.group('🔒 Super Admin Configuration');
      console.log('Enabled:', this.config.enabled);
      console.log('Development Mode:', this.config.developmentMode);
      console.log('Emergency Access:', this.config.emergencyAccessEnabled);
      console.log('Hardware Key Required:', this.config.requireHardwareKey);
      console.log('Session Timeout:', this.config.sessionTimeout / 1000 / 60, 'minutes');
      console.log('Max Sessions:', this.config.maxConcurrentSessions);
      console.log('Audit Logging:', this.config.auditLoggingEnabled);
      console.log('Debug Mode:', this.config.debugMode);
      
      const emergencyInfo = this.getEmergencyInfo();
      if (emergencyInfo) {
        console.log('Emergency Info:', emergencyInfo);
      }
      
      console.groupEnd();
    }
  }
}

/**
 * Super Admin Feature Guard Hook
 */
export function useSuperAdminGuard(): {
  isEnabled: boolean;
  isDevelopment: boolean;
  isEmergencyAccess: boolean;
  config: SuperAdminBuildConfig;
} {
  const configManager = SuperAdminConfig.getInstance();
  
  return {
    isEnabled: configManager.isEnabled(),
    isDevelopment: configManager.isDevelopmentMode(),
    isEmergencyAccess: configManager.isEmergencyAccessEnabled(),
    config: configManager.getConfig()
  };
}

/**
 * Super Admin Access Control Decorator
 */
export function withSuperAdminAccess<T extends React.ComponentType<any>>(
  Component: T,
  fallbackComponent?: React.ComponentType
): T {
  const WrappedComponent = (props: any) => {
    const { isEnabled } = useSuperAdminGuard();

    if (!isEnabled) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return React.createElement(FallbackComponent, props);
      }
      return null;
    }

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withSuperAdminAccess(${Component.displayName || Component.name})`;

  return WrappedComponent as T;
}

/**
 * Emergency Access Utilities
 */
export const EmergencyAccess = {
  /**
   * Enable emergency access from browser console
   */
  enable: (reason: string) => {
    const config = SuperAdminConfig.getInstance();
    return config.enableEmergencyAccess(reason);
  },

  /**
   * Disable emergency access
   */
  disable: () => {
    const config = SuperAdminConfig.getInstance();
    config.disableAccess();
  },

  /**
   * Check emergency status
   */
  status: () => {
    const config = SuperAdminConfig.getInstance();
    return {
      enabled: config.isEnabled(),
      emergency: config.isEmergencyAccessEnabled(),
      info: config.getEmergencyInfo()
    };
  }
};

// Expose emergency access utilities to window for console access
if (typeof window !== 'undefined') {
  (window as any).SizeWiseEmergencyAccess = EmergencyAccess;
}

// Export singleton instance
export const superAdminConfig = SuperAdminConfig.getInstance();
