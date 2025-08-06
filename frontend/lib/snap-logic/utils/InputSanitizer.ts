/**
 * Input Sanitizer System
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Comprehensive input sanitization system for protecting against malicious input,
 * data corruption, and security vulnerabilities. Provides sanitization for all
 * user inputs, API calls, and data imports in professional HVAC design workflows.
 * 
 * @fileoverview Input sanitization and security utilities
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

import { ValidationResult } from './ValidationUtils';
import { 
  SnapLogicError, 
  ErrorCategory, 
  ErrorSeverity 
} from '../system/SnapLogicError';

/**
 * Sanitization configuration
 */
export interface SanitizationConfig {
  // Security settings
  enableXSSProtection: boolean;
  enableSQLInjectionProtection: boolean;
  enablePathTraversalProtection: boolean;
  enableCommandInjectionProtection: boolean;
  
  // Data sanitization
  enableDataNormalization: boolean;
  enableEncodingNormalization: boolean;
  enableWhitespaceNormalization: boolean;
  
  // Geometric sanitization
  enableCoordinateNormalization: boolean;
  enablePrecisionNormalization: boolean;
  enableRangeNormalization: boolean;
  
  // Performance settings
  maxSanitizationTime: number;
  enableCaching: boolean;
  cacheSize: number;
  
  // Logging
  enableVerboseLogging: boolean;
  logSanitizationActions: boolean;
}

/**
 * Default sanitization configuration
 */
const DEFAULT_SANITIZATION_CONFIG: SanitizationConfig = {
  enableXSSProtection: true,
  enableSQLInjectionProtection: true,
  enablePathTraversalProtection: true,
  enableCommandInjectionProtection: true,
  
  enableDataNormalization: true,
  enableEncodingNormalization: true,
  enableWhitespaceNormalization: true,
  
  enableCoordinateNormalization: true,
  enablePrecisionNormalization: true,
  enableRangeNormalization: true,
  
  maxSanitizationTime: 100,
  enableCaching: true,
  cacheSize: 1000,
  
  enableVerboseLogging: false,
  logSanitizationActions: false
};

/**
 * Sanitization result interface
 */
export interface SanitizationResult<T = any> {
  sanitized: T;
  modified: boolean;
  actions: string[];
  warnings: string[];
  errors: string[];
  metadata: Record<string, any>;
}

/**
 * Input sanitizer class
 */
export class InputSanitizer {
  private config: SanitizationConfig;
  private sanitizationCache: Map<string, SanitizationResult> = new Map();
  private sanitizationStats: Map<string, number> = new Map();

  constructor(config?: Partial<SanitizationConfig>) {
    this.config = { ...DEFAULT_SANITIZATION_CONFIG, ...config };
  }

  // ========================================
  // Security Sanitization
  // ========================================

  /**
   * Sanitize against XSS attacks
   */
  sanitizeXSS(input: string): SanitizationResult<string> {
    const startTime = performance.now();
    const actions: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    let sanitized = input;
    let modified = false;

    try {
      if (!this.config.enableXSSProtection) {
        return {
          sanitized: input,
          modified: false,
          actions,
          warnings,
          errors,
          metadata: { type: 'xss', skipped: true }
        };
      }

      const originalInput = input;

      // Remove script tags
      const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
      if (scriptPattern.test(sanitized)) {
        sanitized = sanitized.replace(scriptPattern, '');
        actions.push('Removed script tags');
        modified = true;
      }

      // Remove javascript: protocols
      const jsProtocolPattern = /javascript:/gi;
      if (jsProtocolPattern.test(sanitized)) {
        sanitized = sanitized.replace(jsProtocolPattern, '');
        actions.push('Removed javascript: protocols');
        modified = true;
      }

      // Remove event handlers
      const eventHandlerPattern = /on\w+\s*=\s*["'][^"']*["']/gi;
      if (eventHandlerPattern.test(sanitized)) {
        sanitized = sanitized.replace(eventHandlerPattern, '');
        actions.push('Removed event handlers');
        modified = true;
      }

      // Encode dangerous characters
      const dangerousChars = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '&': '&amp;'
      };

      for (const [char, encoded] of Object.entries(dangerousChars)) {
        if (sanitized.includes(char)) {
          sanitized = sanitized.replace(new RegExp(char, 'g'), encoded);
          actions.push(`Encoded ${char} characters`);
          modified = true;
        }
      }

      // Check for potential XSS patterns
      const xssPatterns = [
        /eval\s*\(/gi,
        /expression\s*\(/gi,
        /vbscript:/gi,
        /data:text\/html/gi
      ];

      for (const pattern of xssPatterns) {
        if (pattern.test(sanitized)) {
          sanitized = sanitized.replace(pattern, '');
          actions.push(`Removed XSS pattern: ${pattern.source}`);
          modified = true;
        }
      }

      if (modified && this.config.logSanitizationActions) {
        console.log('[InputSanitizer] XSS sanitization:', { originalInput, sanitized, actions });
      }

      const duration = performance.now() - startTime;
      this.updateStats('xss', duration);

      return {
        sanitized,
        modified,
        actions,
        warnings,
        errors,
        metadata: {
          type: 'xss',
          originalLength: originalInput.length,
          sanitizedLength: sanitized.length,
          duration
        }
      };

    } catch (error) {
      errors.push(`XSS sanitization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        sanitized: input,
        modified: false,
        actions,
        warnings,
        errors,
        metadata: { type: 'xss', failed: true }
      };
    }
  }

  /**
   * Sanitize against SQL injection
   */
  sanitizeSQLInjection(input: string): SanitizationResult<string> {
    const startTime = performance.now();
    const actions: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    let sanitized = input;
    let modified = false;

    try {
      if (!this.config.enableSQLInjectionProtection) {
        return {
          sanitized: input,
          modified: false,
          actions,
          warnings,
          errors,
          metadata: { type: 'sql', skipped: true }
        };
      }

      const originalInput = input;

      // Escape single quotes
      if (sanitized.includes("'")) {
        sanitized = sanitized.replace(/'/g, "''");
        actions.push('Escaped single quotes');
        modified = true;
      }

      // Remove SQL keywords
      const sqlKeywords = [
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
        'EXEC', 'EXECUTE', 'UNION', 'DECLARE', 'CAST', 'CONVERT'
      ];

      for (const keyword of sqlKeywords) {
        const pattern = new RegExp(`\\b${keyword}\\b`, 'gi');
        if (pattern.test(sanitized)) {
          sanitized = sanitized.replace(pattern, '');
          actions.push(`Removed SQL keyword: ${keyword}`);
          modified = true;
        }
      }

      // Remove SQL comment patterns
      const commentPatterns = [
        /--.*$/gm,
        /\/\*[\s\S]*?\*\//g,
        /#.*$/gm
      ];

      for (const pattern of commentPatterns) {
        if (pattern.test(sanitized)) {
          sanitized = sanitized.replace(pattern, '');
          actions.push(`Removed SQL comment pattern: ${pattern.source}`);
          modified = true;
        }
      }

      // Remove dangerous characters
      const dangerousChars = [';', '|', '&', '$', '`'];
      for (const char of dangerousChars) {
        if (sanitized.includes(char)) {
          sanitized = sanitized.replace(new RegExp(`\\${char}`, 'g'), '');
          actions.push(`Removed dangerous character: ${char}`);
          modified = true;
        }
      }

      const duration = performance.now() - startTime;
      this.updateStats('sql', duration);

      return {
        sanitized,
        modified,
        actions,
        warnings,
        errors,
        metadata: {
          type: 'sql',
          originalLength: originalInput.length,
          sanitizedLength: sanitized.length,
          duration
        }
      };

    } catch (error) {
      errors.push(`SQL injection sanitization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        sanitized: input,
        modified: false,
        actions,
        warnings,
        errors,
        metadata: { type: 'sql', failed: true }
      };
    }
  }

  /**
   * Sanitize against path traversal attacks
   */
  sanitizePathTraversal(input: string): SanitizationResult<string> {
    const startTime = performance.now();
    const actions: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    let sanitized = input;
    let modified = false;

    try {
      if (!this.config.enablePathTraversalProtection) {
        return {
          sanitized: input,
          modified: false,
          actions,
          warnings,
          errors,
          metadata: { type: 'path', skipped: true }
        };
      }

      const originalInput = input;

      // Remove path traversal patterns
      const pathTraversalPatterns = [
        /\.\.\//g,
        /\.\.\\g,
        /%2e%2e%2f/gi,
        /%2e%2e%5c/gi,
        /\.\.%2f/gi,
        /\.\.%5c/gi
      ];

      for (const pattern of pathTraversalPatterns) {
        if (pattern.test(sanitized)) {
          sanitized = sanitized.replace(pattern, '');
          actions.push(`Removed path traversal pattern: ${pattern.source}`);
          modified = true;
        }
      }

      // Remove absolute path indicators
      if (sanitized.startsWith('/') || sanitized.match(/^[a-zA-Z]:\\/)) {
        sanitized = sanitized.replace(/^(\/|[a-zA-Z]:\\)/, '');
        actions.push('Removed absolute path indicator');
        modified = true;
      }

      const duration = performance.now() - startTime;
      this.updateStats('path', duration);

      return {
        sanitized,
        modified,
        actions,
        warnings,
        errors,
        metadata: {
          type: 'path',
          originalLength: originalInput.length,
          sanitizedLength: sanitized.length,
          duration
        }
      };

    } catch (error) {
      errors.push(`Path traversal sanitization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        sanitized: input,
        modified: false,
        actions,
        warnings,
        errors,
        metadata: { type: 'path', failed: true }
      };
    }
  }

  // ========================================
  // Data Normalization
  // ========================================

  /**
   * Normalize whitespace in strings
   */
  normalizeWhitespace(input: string): SanitizationResult<string> {
    const startTime = performance.now();
    const actions: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    let sanitized = input;
    let modified = false;

    try {
      if (!this.config.enableWhitespaceNormalization) {
        return {
          sanitized: input,
          modified: false,
          actions,
          warnings,
          errors,
          metadata: { type: 'whitespace', skipped: true }
        };
      }

      const originalInput = input;

      // Normalize line endings
      if (sanitized.includes('\r\n') || sanitized.includes('\r')) {
        sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        actions.push('Normalized line endings');
        modified = true;
      }

      // Remove excessive whitespace
      if (/\s{2,}/.test(sanitized)) {
        sanitized = sanitized.replace(/\s{2,}/g, ' ');
        actions.push('Collapsed excessive whitespace');
        modified = true;
      }

      // Trim leading and trailing whitespace
      const trimmed = sanitized.trim();
      if (trimmed !== sanitized) {
        sanitized = trimmed;
        actions.push('Trimmed leading/trailing whitespace');
        modified = true;
      }

      const duration = performance.now() - startTime;
      this.updateStats('whitespace', duration);

      return {
        sanitized,
        modified,
        actions,
        warnings,
        errors,
        metadata: {
          type: 'whitespace',
          originalLength: originalInput.length,
          sanitizedLength: sanitized.length,
          duration
        }
      };

    } catch (error) {
      errors.push(`Whitespace normalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        sanitized: input,
        modified: false,
        actions,
        warnings,
        errors,
        metadata: { type: 'whitespace', failed: true }
      };
    }
  }

  /**
   * Normalize numeric precision
   */
  normalizePrecision(input: number, precision: number = 6): SanitizationResult<number> {
    const startTime = performance.now();
    const actions: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    let sanitized = input;
    let modified = false;

    try {
      if (!this.config.enablePrecisionNormalization) {
        return {
          sanitized: input,
          modified: false,
          actions,
          warnings,
          errors,
          metadata: { type: 'precision', skipped: true }
        };
      }

      const originalInput = input;

      // Check for valid number
      if (!isFinite(input)) {
        errors.push('Input is not a finite number');
        return {
          sanitized: 0,
          modified: true,
          actions: ['Replaced invalid number with 0'],
          warnings,
          errors,
          metadata: { type: 'precision', invalid: true }
        };
      }

      // Apply precision normalization
      const factor = Math.pow(10, precision);
      sanitized = Math.round(input * factor) / factor;

      if (Math.abs(originalInput - sanitized) > Number.EPSILON) {
        actions.push(`Normalized precision to ${precision} decimal places`);
        modified = true;
      }

      const duration = performance.now() - startTime;
      this.updateStats('precision', duration);

      return {
        sanitized,
        modified,
        actions,
        warnings,
        errors,
        metadata: {
          type: 'precision',
          originalValue: originalInput,
          precision,
          duration
        }
      };

    } catch (error) {
      errors.push(`Precision normalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        sanitized: input,
        modified: false,
        actions,
        warnings,
        errors,
        metadata: { type: 'precision', failed: true }
      };
    }
  }

  // ========================================
  // Comprehensive Sanitization
  // ========================================

  /**
   * Sanitize string input with all security measures
   */
  sanitizeString(input: string): SanitizationResult<string> {
    const startTime = performance.now();
    let result = input;
    const allActions: string[] = [];
    const allWarnings: string[] = [];
    const allErrors: string[] = [];
    let totalModified = false;

    try {
      // Check cache first
      const cacheKey = `string_${input}`;
      if (this.config.enableCaching && this.sanitizationCache.has(cacheKey)) {
        return this.sanitizationCache.get(cacheKey)!;
      }

      // Apply all string sanitizations
      const xssResult = this.sanitizeXSS(result);
      result = xssResult.sanitized;
      allActions.push(...xssResult.actions);
      allWarnings.push(...xssResult.warnings);
      allErrors.push(...xssResult.errors);
      totalModified = totalModified || xssResult.modified;

      const sqlResult = this.sanitizeSQLInjection(result);
      result = sqlResult.sanitized;
      allActions.push(...sqlResult.actions);
      allWarnings.push(...sqlResult.warnings);
      allErrors.push(...sqlResult.errors);
      totalModified = totalModified || sqlResult.modified;

      const pathResult = this.sanitizePathTraversal(result);
      result = pathResult.sanitized;
      allActions.push(...pathResult.actions);
      allWarnings.push(...pathResult.warnings);
      allErrors.push(...pathResult.errors);
      totalModified = totalModified || pathResult.modified;

      const whitespaceResult = this.normalizeWhitespace(result);
      result = whitespaceResult.sanitized;
      allActions.push(...whitespaceResult.actions);
      allWarnings.push(...whitespaceResult.warnings);
      allErrors.push(...whitespaceResult.errors);
      totalModified = totalModified || whitespaceResult.modified;

      const duration = performance.now() - startTime;
      
      const finalResult: SanitizationResult<string> = {
        sanitized: result,
        modified: totalModified,
        actions: allActions,
        warnings: allWarnings,
        errors: allErrors,
        metadata: {
          type: 'comprehensive_string',
          originalLength: input.length,
          sanitizedLength: result.length,
          duration,
          actionCount: allActions.length
        }
      };

      // Cache result
      if (this.config.enableCaching) {
        this.setCacheEntry(cacheKey, finalResult);
      }

      this.updateStats('comprehensive_string', duration);

      return finalResult;

    } catch (error) {
      allErrors.push(`Comprehensive string sanitization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        sanitized: input,
        modified: false,
        actions: allActions,
        warnings: allWarnings,
        errors: allErrors,
        metadata: { type: 'comprehensive_string', failed: true }
      };
    }
  }

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * Update sanitization statistics
   */
  private updateStats(type: string, duration: number): void {
    const currentCount = this.sanitizationStats.get(type) || 0;
    this.sanitizationStats.set(type, currentCount + 1);

    if (duration > this.config.maxSanitizationTime) {
      console.warn(`[InputSanitizer] Sanitization type ${type} took ${duration.toFixed(2)}ms (limit: ${this.config.maxSanitizationTime}ms)`);
    }
  }

  /**
   * Set cache entry with size management
   */
  private setCacheEntry(key: string, value: SanitizationResult): void {
    if (this.sanitizationCache.size >= this.config.cacheSize) {
      // Remove oldest entry
      const firstKey = this.sanitizationCache.keys().next().value;
      this.sanitizationCache.delete(firstKey);
    }
    this.sanitizationCache.set(key, value);
  }

  /**
   * Get sanitization statistics
   */
  getStatistics(): Record<string, number> {
    return Object.fromEntries(this.sanitizationStats);
  }

  /**
   * Clear sanitization cache
   */
  clearCache(): void {
    this.sanitizationCache.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SanitizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): SanitizationConfig {
    return { ...this.config };
  }

  /**
   * Dispose of the sanitizer
   */
  dispose(): void {
    this.sanitizationCache.clear();
    this.sanitizationStats.clear();
  }
}
