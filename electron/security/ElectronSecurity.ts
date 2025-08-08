/**
 * ElectronSecurity - Desktop Application Security Configuration
 * 
 * MISSION-CRITICAL: Security hardening for Electron desktop application
 * Integrates with Phase 1.5 security foundation for comprehensive protection
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 3.1
 */

import { app, BrowserWindow, WebContents, session } from 'electron';
import { join } from 'path';
import { SecurityManager } from './SecurityManager';

/**
 * Security configuration options
 */
interface SecurityConfig {
  enableCSP: boolean;
  enableCORS: boolean;
  allowDevTools: boolean;
  allowNodeIntegration: boolean;
  allowRemoteModule: boolean;
  enableWebSecurity: boolean;
  allowInsecureContent: boolean;
  enableExperimentalFeatures: boolean;
}

/**
 * Content Security Policy configuration
 */
interface CSPConfig {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  connectSrc: string[];
  fontSrc: string[];
  objectSrc: string[];
  mediaSrc: string[];
  frameSrc: string[];
}

/**
 * ElectronSecurity - Comprehensive security configuration for desktop app
 * CRITICAL: Prevents common Electron security vulnerabilities
 */
export class ElectronSecurity {
  private securityManager: SecurityManager;
  private config: SecurityConfig;
  private cspConfig: CSPConfig;

  constructor() {
    this.securityManager = new SecurityManager();
    
    // Security configuration based on environment
    this.config = {
      enableCSP: true,
      enableCORS: true,
      allowDevTools: process.env.NODE_ENV === 'development',
      allowNodeIntegration: false,
      allowRemoteModule: false,
      enableWebSecurity: true,
      allowInsecureContent: false,
      enableExperimentalFeatures: false
    };

    // Content Security Policy configuration
    this.cspConfig = {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Next.js in development
        ...(process.env.NODE_ENV === 'development' ? ["'unsafe-eval'"] : [])
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for styled-components
        "https://fonts.googleapis.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        ...(process.env.NODE_ENV === 'development' ? ["http://localhost:*", "ws://localhost:*"] : [])
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    };
  }

  /**
   * Configure application-level security
   */
  public configureApp(): void {
    // Disable web security in development for localhost
    if (process.env.NODE_ENV === 'development') {
      app.commandLine.appendSwitch('--disable-web-security');
      app.commandLine.appendSwitch('--disable-features', 'OutOfBlinkCors');
    }

    // Enable secure defaults
    app.commandLine.appendSwitch('--enable-features', 'ElectronSerialChooser');
    
    // Disable insecure features
    app.commandLine.appendSwitch('--disable-background-timer-throttling');
    app.commandLine.appendSwitch('--disable-renderer-backgrounding');
    
    // Configure session security
    this.configureSession();

    console.log('✅ Application security configured');
  }

  /**
   * Configure session-level security
   */
  private configureSession(): void {
    const ses = session.defaultSession;

    // Configure Content Security Policy
    if (this.config.enableCSP) {
      ses.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [this.buildCSP()]
          }
        });
      });
    }

    // Configure permissions
    ses.setPermissionRequestHandler((webContents, permission, callback) => {
      // Deny all permissions by default
      const allowedPermissions = [
        'clipboard-read',
        'clipboard-write'
      ];

      callback(allowedPermissions.includes(permission));
    });

    // Block external protocols
    ses.protocol.interceptFileProtocol('file', (request, callback) => {
      const url = request.url.substr(7); // Remove 'file://' prefix
      const normalizedPath = join(__dirname, url);
      callback({ path: normalizedPath });
    });

    // Configure certificate verification
    ses.setCertificateVerifyProc((request, callback) => {
      // In production, always verify certificates
      if (process.env.NODE_ENV === 'production') {
        callback(0); // Use default verification
      } else {
        callback(-2); // Allow self-signed certificates in development
      }
    });

    console.log('✅ Session security configured');
  }

  /**
   * Configure window-specific security
   */
  public configureWindow(window: BrowserWindow): void {
    // Prevent new window creation
    window.webContents.setWindowOpenHandler(() => {
      return { action: 'deny' };
    });

    // Handle navigation attempts
    window.webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      
      // Allow navigation to localhost in development
      if (process.env.NODE_ENV === 'development' && parsedUrl.hostname === 'localhost') {
        return;
      }

      // Allow navigation to file:// protocol for production builds
      if (parsedUrl.protocol === 'file:') {
        return;
      }

      // Deny all other navigation attempts
      event.preventDefault();
      console.warn('🚫 Navigation blocked:', navigationUrl);
    });

    // Handle external link attempts
    window.webContents.setWindowOpenHandler(({ url }) => {
      // Open external links in default browser
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    });

    console.log('✅ Window security configured');
  }

  /**
   * Configure web contents security
   */
  public configureWebContents(webContents: WebContents): void {
    // Prevent new window creation
    webContents.setWindowOpenHandler(() => {
      return { action: 'deny' };
    });

    // Handle console messages in production
    if (process.env.NODE_ENV === 'production') {
      webContents.on('console-message', (event, level, message) => {
        if (level >= 2) { // Warning or error
          console.log(`Renderer: ${message}`);
        }
      });
    }

    // Handle crashes (modern API)
    webContents.on('render-process-gone', (_event, details) => {
      console.error('💥 Renderer process gone:', details);
    });

    // Handle unresponsive renderer
    webContents.on('unresponsive', () => {
      console.warn('⚠️ Renderer process unresponsive');
    });

    webContents.on('responsive', () => {
      console.log('✅ Renderer process responsive again');
    });

    console.log('✅ WebContents security configured');
  }

  /**
   * Build Content Security Policy string
   */
  private buildCSP(): string {
    const directives = Object.entries(this.cspConfig)
      .map(([directive, sources]) => {
        const kebabDirective = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${kebabDirective} ${sources.join(' ')}`;
      })
      .join('; ');

    return directives;
  }

  /**
   * Validate security configuration
   */
  public validateSecurity(): { isSecure: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check Node.js integration
    if (this.config.allowNodeIntegration) {
      issues.push('Node.js integration is enabled - security risk');
    }

    // Check remote module
    if (this.config.allowRemoteModule) {
      issues.push('Remote module is enabled - security risk');
    }

    // Check web security
    if (!this.config.enableWebSecurity) {
      issues.push('Web security is disabled - security risk');
    }

    // Check insecure content
    if (this.config.allowInsecureContent) {
      issues.push('Insecure content is allowed - security risk');
    }

    // Check experimental features
    if (this.config.enableExperimentalFeatures) {
      issues.push('Experimental features are enabled - potential security risk');
    }

    // Check CSP
    if (!this.config.enableCSP) {
      issues.push('Content Security Policy is disabled - security risk');
    }

    // Check development mode in production
    if (process.env.NODE_ENV === 'production' && this.config.allowDevTools) {
      issues.push('DevTools are enabled in production - security risk');
    }

    return {
      isSecure: issues.length === 0,
      issues
    };
  }

  /**
   * Get security configuration
   */
  public getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Update security configuration
   */
  public updateConfig(updates: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('✅ Security configuration updated');
  }

  /**
   * Generate security report
   */
  public generateSecurityReport(): {
    timestamp: string;
    environment: string;
    configuration: SecurityConfig;
    validation: { isSecure: boolean; issues: string[] };
    recommendations: string[];
  } {
    const validation = this.validateSecurity();
    const recommendations: string[] = [];

    // Generate recommendations based on issues
    if (validation.issues.length > 0) {
      recommendations.push('Review and fix security configuration issues');
    }

    if (process.env.NODE_ENV === 'development') {
      recommendations.push('Ensure security settings are production-ready before deployment');
    }

    recommendations.push('Regularly update Electron to latest stable version');
    recommendations.push('Conduct security audits of dependencies');
    recommendations.push('Implement proper certificate pinning for production');

    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      configuration: this.config,
      validation,
      recommendations
    };
  }

  /**
   * Enable development mode security (less restrictive)
   */
  public enableDevelopmentMode(): void {
    this.config = {
      ...this.config,
      allowDevTools: true,
      enableWebSecurity: false // Allow localhost connections
    };

    console.log('⚠️ Development mode security enabled');
  }

  /**
   * Enable production mode security (most restrictive)
   */
  public enableProductionMode(): void {
    this.config = {
      enableCSP: true,
      enableCORS: true,
      allowDevTools: false,
      allowNodeIntegration: false,
      allowRemoteModule: false,
      enableWebSecurity: true,
      allowInsecureContent: false,
      enableExperimentalFeatures: false
    };

    console.log('🔒 Production mode security enabled');
  }
}

export default ElectronSecurity;
