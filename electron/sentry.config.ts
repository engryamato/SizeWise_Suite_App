/**
 * Sentry Configuration for SizeWise Suite Electron Desktop Application
 * 
 * Configures Sentry error monitoring and performance tracking for the
 * Electron main process, renderer process, and preload scripts.
 */

import * as Sentry from '@sentry/electron';
import { app } from 'electron';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

// Sentry DSN - same as frontend for unified monitoring
const SENTRY_DSN = "https://7c66eaefa7b2dde6957e18ffb03bf28f@o4509734387056640.ingest.us.sentry.io/4509734389481472";

/**
 * Initialize Sentry for the Electron application
 */
export function initSentry(): void {
  // Only initialize if DSN is available and not in development
  if (!SENTRY_DSN || process.env.NODE_ENV === 'development') {
    console.log('Sentry initialization skipped (development mode or no DSN)');
    return;
  }

  try {
    // Get app version from package.json
    const packagePath = join(__dirname, '..', 'package.json');
    let appVersion = 'unknown';
    
    if (existsSync(packagePath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
        appVersion = packageJson.version || 'unknown';
      } catch (error) {
        console.warn('Failed to read package.json for version:', error);
      }
    }

    // Initialize Sentry
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || 'production',
      
      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
      
      // Error filtering
      beforeSend: filterElectronErrors,
      
      // Release tracking
      release: `electron@${appVersion}`,
      
      // Additional options
      attachStacktrace: true,
      maxBreadcrumbs: 50,
      
      // Custom tags
      initialScope: {
        tags: {
          component: 'electron',
          service: 'sizewise-suite',
          platform: 'desktop',
          process: (process as any).type || 'main',
          'electron.version': process.versions.electron || 'unknown',
          'node.version': process.versions.node || 'unknown',
          'chrome.version': process.versions.chrome || 'unknown',
          'os.platform': process.platform,
          'os.arch': process.arch
        }
      }
    });

    // Set user context
    setElectronUserContext();
    
    console.log('Sentry initialized for Electron application');
    
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

/**
 * Filter out certain errors from being sent to Sentry
 */
function filterElectronErrors(event: Sentry.Event, hint: Sentry.EventHint): Sentry.Event | null {
  // Don't send certain common Electron errors
  if (hint.originalException) {
    const error = hint.originalException;
    const errorMessage = error.toString().toLowerCase();
    
    // Filter out common Electron/Chromium errors that aren't actionable
    const ignoredErrors = [
      'non-context-aware native module',
      'cannot read property of undefined', // Too generic
      'network error', // Network issues
      'fetch failed', // Network issues
      'loading chunk', // Code splitting issues
      'script error' // Cross-origin script errors
    ];
    
    if (ignoredErrors.some(ignored => errorMessage.includes(ignored))) {
      return null;
    }
  }
  
  // Filter out development-only errors
  if (event.environment === 'development') {
    // Allow all errors in development for debugging
  }
  
  return event;
}

/**
 * Set user context for Sentry
 */
function setElectronUserContext(): void {
  try {
    // Get system information (non-PII)
    const systemInfo = {
      platform: process.platform,
      arch: process.arch,
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      chromeVersion: process.versions.chrome
    };
    
    Sentry.setContext('system', systemInfo);
    
    // Set app-specific context
    if (app) {
      Sentry.setContext('app', {
        name: app.getName(),
        version: app.getVersion(),
        locale: app.getLocale(),
        isPackaged: app.isPackaged
      });
    }
    
  } catch (error) {
    console.warn('Failed to set Sentry user context:', error);
  }
}

/**
 * Capture desktop-specific performance metrics
 */
export function captureDesktopPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
): void {
  try {
    Sentry.startSpan(
      {
        op: 'desktop.performance',
        name: `desktop.${operation}`,
      },
      (span) => {
        span.setAttribute('desktop.operation', operation);
        span.setAttribute('desktop.duration', duration);
        
        if (metadata) {
          Object.entries(metadata).forEach(([key, value]) => {
            span.setAttribute(`desktop.${key}`, value);
          });
        }
        
        // Record custom metric
        Sentry.setMeasurement(`desktop.${operation}.duration`, duration, 'millisecond');
      }
    );
  } catch (error) {
    console.warn('Failed to capture desktop performance:', error);
  }
}

/**
 * Capture window lifecycle events
 */
export function captureWindowEvent(
  eventType: 'created' | 'closed' | 'focused' | 'blurred' | 'minimized' | 'maximized',
  windowId: number,
  metadata?: Record<string, any>
): void {
  try {
    Sentry.addBreadcrumb({
      category: 'window',
      message: `Window ${eventType}`,
      level: 'info',
      data: {
        windowId,
        eventType,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
    
    // Track window metrics
    Sentry.setTag('window.last_event', eventType);
    
  } catch (error) {
    console.warn('Failed to capture window event:', error);
  }
}

/**
 * Capture file operation events
 */
export function captureFileOperation(
  operation: 'open' | 'save' | 'export' | 'import',
  fileType: string,
  success: boolean,
  metadata?: Record<string, any>
): void {
  try {
    Sentry.addBreadcrumb({
      category: 'file',
      message: `File ${operation} ${success ? 'succeeded' : 'failed'}`,
      level: success ? 'info' : 'warning',
      data: {
        operation,
        fileType,
        success,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
    
    // Track file operation metrics
    if (success) {
      Sentry.setMeasurement(`file.${operation}.success`, 1, 'none');
    } else {
      Sentry.setMeasurement(`file.${operation}.failure`, 1, 'none');
    }
    
  } catch (error) {
    console.warn('Failed to capture file operation:', error);
  }
}

/**
 * Capture license validation events
 */
export function captureLicenseEvent(
  eventType: 'validation' | 'activation' | 'deactivation' | 'renewal',
  success: boolean,
  details?: Record<string, any>
): void {
  try {
    Sentry.addBreadcrumb({
      category: 'license',
      message: `License ${eventType} ${success ? 'succeeded' : 'failed'}`,
      level: success ? 'info' : 'warning',
      data: {
        eventType,
        success,
        timestamp: new Date().toISOString(),
        // Don't include sensitive license details
        hasDetails: !!details
      }
    });
    
    // Set license status context (without sensitive data)
    Sentry.setContext('license', {
      lastEvent: eventType,
      lastEventSuccess: success,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.warn('Failed to capture license event:', error);
  }
}

/**
 * Capture Electron-specific errors with context
 */
export function captureElectronError(
  error: Error,
  context: {
    component: string;
    operation?: string;
    windowId?: number;
    metadata?: Record<string, any>;
  }
): void {
  try {
    Sentry.withScope((scope) => {
      scope.setTag('electron.component', context.component);
      
      if (context.operation) {
        scope.setTag('electron.operation', context.operation);
      }
      
      if (context.windowId) {
        scope.setTag('electron.window_id', context.windowId);
      }
      
      if (context.metadata) {
        scope.setContext('electron_metadata', context.metadata);
      }
      
      scope.setLevel('error');
      Sentry.captureException(error);
    });
    
  } catch (sentryError) {
    console.error('Failed to capture Electron error:', sentryError);
    // Still log the original error
    console.error('Original error:', error);
  }
}

// Export commonly used functions
export {
  Sentry as ElectronSentry
};
