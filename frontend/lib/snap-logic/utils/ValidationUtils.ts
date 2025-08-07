/**
 * Validation and Sanitization Utilities
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Comprehensive input validation and sanitization utilities for all user interactions,
 * API calls, and data imports. Provides robust validation with error recovery and
 * sanitization for professional HVAC design workflows.
 * 
 * @fileoverview Input validation and sanitization utilities
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

import { Point2D, Centerline, SnapPoint } from '@/types/air-duct-sizer';
import { 
  SnapLogicError, 
  SnapLogicValidationError,
  ErrorCategory, 
  ErrorSeverity 
} from '../system/SnapLogicError';

/**
 * Validation result interface
 */
export interface ValidationResult<T = any> {
  isValid: boolean;
  sanitizedValue?: T;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, any>;
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
  // Coordinate validation
  maxCoordinateValue: number;
  minCoordinateValue: number;
  coordinatePrecision: number;
  
  // Geometric validation
  minDistance: number;
  maxDistance: number;
  minRadius: number;
  maxRadius: number;
  minAngle: number;
  maxAngle: number;
  
  // String validation
  maxStringLength: number;
  allowedCharacters: RegExp;
  
  // Numeric validation
  maxNumericValue: number;
  minNumericValue: number;
  numericPrecision: number;
  
  // Array validation
  maxArrayLength: number;
  minArrayLength: number;
  
  // Performance validation
  maxProcessingTime: number;
  maxMemoryUsage: number;
  
  // Security validation
  enableXSSProtection: boolean;
  enableSQLInjectionProtection: boolean;
  allowedFileTypes: string[];
  maxFileSize: number;
}

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  maxCoordinateValue: 1000000,
  minCoordinateValue: -1000000,
  coordinatePrecision: 6,
  
  minDistance: 0.1,
  maxDistance: 100000,
  minRadius: 1,
  maxRadius: 50000,
  minAngle: 0.001,
  maxAngle: Math.PI * 2,
  
  maxStringLength: 1000,
  allowedCharacters: /^[a-zA-Z0-9\s\-_.,()[\]{}:;'"!?@#$%^&*+=|\\/<>~`]*$/,
  
  maxNumericValue: Number.MAX_SAFE_INTEGER,
  minNumericValue: Number.MIN_SAFE_INTEGER,
  numericPrecision: 10,
  
  maxArrayLength: 10000,
  minArrayLength: 0,
  
  maxProcessingTime: 5000,
  maxMemoryUsage: 500,
  
  enableXSSProtection: true,
  enableSQLInjectionProtection: true,
  allowedFileTypes: ['.json', '.csv', '.txt', '.dwg', '.dxf'],
  maxFileSize: 50 * 1024 * 1024 // 50MB
};

/**
 * Validation utilities class
 */
export class ValidationUtils {
  private static config: ValidationConfig = DEFAULT_VALIDATION_CONFIG;

  /**
   * Update validation configuration
   */
  static updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current validation configuration
   */
  static getConfig(): ValidationConfig {
    return { ...this.config };
  }

  // ========================================
  // Coordinate and Point Validation
  // ========================================

  /**
   * Validate and sanitize a 2D point
   */
  static validatePoint2D(point: any, context?: string): ValidationResult<Point2D> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitizedPoint: Point2D | undefined;

    try {
      // Type validation
      if (!point || typeof point !== 'object') {
        errors.push('Point must be an object');
        return { isValid: false, errors, warnings };
      }

      // Extract coordinates
      let x = point.x;
      let y = point.y;

      // Validate x coordinate
      const xValidation = this.validateNumeric(x, 'x coordinate');
      if (!xValidation.isValid) {
        errors.push(...xValidation.errors);
      } else {
        x = xValidation.sanitizedValue;
      }

      // Validate y coordinate
      const yValidation = this.validateNumeric(y, 'y coordinate');
      if (!yValidation.isValid) {
        errors.push(...yValidation.errors);
      } else {
        y = yValidation.sanitizedValue;
      }

      if (errors.length > 0) {
        return { isValid: false, errors, warnings };
      }

      // Range validation
      if (Math.abs(x!) > this.config.maxCoordinateValue) {
        if (this.config.maxCoordinateValue > 0) {
          x = Math.sign(x!) * this.config.maxCoordinateValue;
          warnings.push(`X coordinate clamped to ${this.config.maxCoordinateValue}`);
        } else {
          errors.push(`X coordinate exceeds maximum value: ${this.config.maxCoordinateValue}`);
        }
      }

      if (Math.abs(y!) > this.config.maxCoordinateValue) {
        if (this.config.maxCoordinateValue > 0) {
          y = Math.sign(y!) * this.config.maxCoordinateValue;
          warnings.push(`Y coordinate clamped to ${this.config.maxCoordinateValue}`);
        } else {
          errors.push(`Y coordinate exceeds maximum value: ${this.config.maxCoordinateValue}`);
        }
      }

      // Precision sanitization
      const precision = this.config.coordinatePrecision;
      const factor = Math.pow(10, precision);
      x = Math.round(x! * factor) / factor;
      y = Math.round(y! * factor) / factor;

      sanitizedPoint = { x: x!, y: y! };

      return {
        isValid: errors.length === 0,
        sanitizedValue: sanitizedPoint,
        errors,
        warnings,
        metadata: { context, originalX: point.x, originalY: point.y }
      };

    } catch (error) {
      errors.push(`Point validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Validate an array of points
   */
  static validatePointArray(points: any[], context?: string): ValidationResult<Point2D[]> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedPoints: Point2D[] = [];

    try {
      // Array validation
      const arrayValidation = this.validateArray(points, context);
      if (!arrayValidation.isValid) {
        return arrayValidation;
      }

      // Validate each point
      for (let i = 0; i < points.length; i++) {
        const pointValidation = this.validatePoint2D(points[i], `${context} point ${i}`);
        
        if (pointValidation.isValid && pointValidation.sanitizedValue) {
          sanitizedPoints.push(pointValidation.sanitizedValue);
        } else {
          errors.push(...pointValidation.errors.map(err => `Point ${i}: ${err}`));
        }
        
        warnings.push(...pointValidation.warnings.map(warn => `Point ${i}: ${warn}`));
      }

      // Check for minimum points
      if (sanitizedPoints.length < 2 && context?.includes('centerline')) {
        errors.push('Centerline must have at least 2 points');
      }

      return {
        isValid: errors.length === 0,
        sanitizedValue: sanitizedPoints,
        errors,
        warnings,
        metadata: { context, originalLength: points.length, sanitizedLength: sanitizedPoints.length }
      };

    } catch (error) {
      errors.push(`Point array validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  // ========================================
  // Numeric Validation
  // ========================================

  /**
   * Validate and sanitize numeric values
   */
  static validateNumeric(value: any, context?: string): ValidationResult<number> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitizedValue: number | undefined;

    try {
      // Type conversion and validation
      if (value === null || value === undefined) {
        errors.push(`${context || 'Value'} is required`);
        return { isValid: false, errors, warnings };
      }

      // Convert to number
      const numValue = Number(value);

      // Check for NaN
      if (isNaN(numValue)) {
        errors.push(`${context || 'Value'} must be a valid number`);
        return { isValid: false, errors, warnings };
      }

      // Check for infinity
      if (!isFinite(numValue)) {
        errors.push(`${context || 'Value'} must be finite`);
        return { isValid: false, errors, warnings };
      }

      // Range validation
      if (numValue > this.config.maxNumericValue) {
        errors.push(`${context || 'Value'} exceeds maximum: ${this.config.maxNumericValue}`);
        return { isValid: false, errors, warnings };
      }

      if (numValue < this.config.minNumericValue) {
        errors.push(`${context || 'Value'} below minimum: ${this.config.minNumericValue}`);
        return { isValid: false, errors, warnings };
      }

      // Precision sanitization
      const precision = this.config.numericPrecision;
      const factor = Math.pow(10, precision);
      sanitizedValue = Math.round(numValue * factor) / factor;

      // Check if precision adjustment was significant
      if (Math.abs(numValue - sanitizedValue) > Number.EPSILON) {
        warnings.push(`${context || 'Value'} precision adjusted from ${numValue} to ${sanitizedValue}`);
      }

      return {
        isValid: true,
        sanitizedValue,
        errors,
        warnings,
        metadata: { context, originalValue: value, type: typeof value }
      };

    } catch (error) {
      errors.push(`Numeric validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Validate distance values
   */
  static validateDistance(distance: any, context?: string): ValidationResult<number> {
    const numericValidation = this.validateNumeric(distance, context);
    
    if (!numericValidation.isValid) {
      return numericValidation;
    }

    const value = numericValidation.sanitizedValue!;
    const errors: string[] = [...numericValidation.errors];
    const warnings: string[] = [...numericValidation.warnings];

    // Distance-specific validation
    if (value < this.config.minDistance) {
      errors.push(`${context || 'Distance'} must be at least ${this.config.minDistance}`);
    }

    if (value > this.config.maxDistance) {
      errors.push(`${context || 'Distance'} cannot exceed ${this.config.maxDistance}`);
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: value,
      errors,
      warnings,
      metadata: { ...numericValidation.metadata, validationType: 'distance' }
    };
  }

  /**
   * Validate radius values
   */
  static validateRadius(radius: any, context?: string): ValidationResult<number> {
    const numericValidation = this.validateNumeric(radius, context);
    
    if (!numericValidation.isValid) {
      return numericValidation;
    }

    const value = numericValidation.sanitizedValue!;
    const errors: string[] = [...numericValidation.errors];
    const warnings: string[] = [...numericValidation.warnings];

    // Radius-specific validation
    if (value < this.config.minRadius) {
      errors.push(`${context || 'Radius'} must be at least ${this.config.minRadius}`);
    }

    if (value > this.config.maxRadius) {
      errors.push(`${context || 'Radius'} cannot exceed ${this.config.maxRadius}`);
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: value,
      errors,
      warnings,
      metadata: { ...numericValidation.metadata, validationType: 'radius' }
    };
  }

  /**
   * Validate angle values (in radians)
   */
  static validateAngle(angle: any, context?: string): ValidationResult<number> {
    const numericValidation = this.validateNumeric(angle, context);
    
    if (!numericValidation.isValid) {
      return numericValidation;
    }

    let value = numericValidation.sanitizedValue!;
    const errors: string[] = [...numericValidation.errors];
    const warnings: string[] = [...numericValidation.warnings];

    // Normalize angle to 0-2π range
    const originalValue = value;
    value = value % (Math.PI * 2);
    if (value < 0) {
      value += Math.PI * 2;
    }

    if (Math.abs(originalValue - value) > Number.EPSILON) {
      warnings.push(`${context || 'Angle'} normalized from ${originalValue} to ${value} radians`);
    }

    // Angle-specific validation
    if (value < this.config.minAngle) {
      errors.push(`${context || 'Angle'} must be at least ${this.config.minAngle} radians`);
    }

    if (value > this.config.maxAngle) {
      errors.push(`${context || 'Angle'} cannot exceed ${this.config.maxAngle} radians`);
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: value,
      errors,
      warnings,
      metadata: { ...numericValidation.metadata, validationType: 'angle', originalAngle: originalValue }
    };
  }

  // ========================================
  // String Validation
  // ========================================

  /**
   * Validate and sanitize string values
   */
  static validateString(value: any, context?: string, options?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowEmpty?: boolean;
  }): ValidationResult<string> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitizedValue: string | undefined;

    try {
      const opts = {
        required: false,
        minLength: 0,
        maxLength: this.config.maxStringLength,
        pattern: this.config.allowedCharacters,
        allowEmpty: true,
        ...options
      };

      // Required validation
      if (opts.required && (value === null || value === undefined)) {
        errors.push(`${context || 'Value'} is required`);
        return { isValid: false, errors, warnings };
      }

      // Convert to string
      let stringValue = value === null || value === undefined ? '' : String(value);

      // Empty string validation
      if (!opts.allowEmpty && stringValue.length === 0) {
        errors.push(`${context || 'Value'} cannot be empty`);
        return { isValid: false, errors, warnings };
      }

      // Length validation
      if (stringValue.length < opts.minLength) {
        errors.push(`${context || 'Value'} must be at least ${opts.minLength} characters`);
      }

      if (stringValue.length > opts.maxLength) {
        // Truncate if too long
        stringValue = stringValue.substring(0, opts.maxLength);
        warnings.push(`${context || 'Value'} truncated to ${opts.maxLength} characters`);
      }

      // Pattern validation
      if (opts.pattern && !opts.pattern.test(stringValue)) {
        // Remove invalid characters
        const originalValue = stringValue;
        stringValue = stringValue.replace(/[^\w\s\-_.,()[\]{}:;'"!?@#$%^&*+=|\\/<>~`]/g, '');
        if (originalValue !== stringValue) {
          warnings.push(`${context || 'Value'} contained invalid characters that were removed`);
        }
      }

      // XSS protection
      if (this.config.enableXSSProtection) {
        stringValue = this.sanitizeXSS(stringValue);
      }

      // SQL injection protection
      if (this.config.enableSQLInjectionProtection) {
        stringValue = this.sanitizeSQLInjection(stringValue);
      }

      sanitizedValue = stringValue;

      return {
        isValid: errors.length === 0,
        sanitizedValue,
        errors,
        warnings,
        metadata: { 
          context, 
          originalValue: value, 
          originalLength: String(value || '').length,
          sanitizedLength: stringValue.length
        }
      };

    } catch (error) {
      errors.push(`String validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  // ========================================
  // Array Validation
  // ========================================

  /**
   * Validate array structure
   */
  static validateArray(value: any, context?: string, options?: {
    minLength?: number;
    maxLength?: number;
    required?: boolean;
  }): ValidationResult<any[]> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const opts = {
        minLength: this.config.minArrayLength,
        maxLength: this.config.maxArrayLength,
        required: false,
        ...options
      };

      // Required validation
      if (opts.required && (value === null || value === undefined)) {
        errors.push(`${context || 'Array'} is required`);
        return { isValid: false, errors, warnings };
      }

      // Type validation
      if (!Array.isArray(value)) {
        errors.push(`${context || 'Value'} must be an array`);
        return { isValid: false, errors, warnings };
      }

      // Length validation
      if (value.length < opts.minLength) {
        errors.push(`${context || 'Array'} must have at least ${opts.minLength} items`);
      }

      if (value.length > opts.maxLength) {
        errors.push(`${context || 'Array'} cannot have more than ${opts.maxLength} items`);
      }

      return {
        isValid: errors.length === 0,
        sanitizedValue: value,
        errors,
        warnings,
        metadata: { context, length: value.length }
      };

    } catch (error) {
      errors.push(`Array validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  // ========================================
  // Security Sanitization
  // ========================================

  /**
   * Sanitize against XSS attacks
   */
  private static sanitizeXSS(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }

  /**
   * Sanitize against SQL injection
   */
  private static sanitizeSQLInjection(input: string): string {
    return input
      .replace(/('|(\\'))/g, "''")
      .replace(/(;|--|\||\/\*|\*\/)/g, '')
      .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b/gi, '');
  }

  // ========================================
  // Complex Object Validation
  // ========================================

  /**
   * Validate snap point object
   */
  static validateSnapPoint(snapPoint: any, context?: string): ValidationResult<SnapPoint> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (!snapPoint || typeof snapPoint !== 'object') {
        errors.push('Snap point must be an object');
        return { isValid: false, errors, warnings };
      }

      // Validate position
      const positionValidation = this.validatePoint2D(snapPoint.position, `${context} position`);
      if (!positionValidation.isValid) {
        errors.push(...positionValidation.errors);
        return { isValid: false, errors, warnings };
      }

      // Validate ID
      const idValidation = this.validateString(snapPoint.id, `${context} id`, {
        required: true,
        minLength: 1,
        maxLength: 100
      });
      if (!idValidation.isValid) {
        errors.push(...idValidation.errors);
      }

      // Validate type
      const validTypes = ['endpoint', 'centerline', 'midpoint', 'intersection', 'perpendicular', 'grid'];
      if (!validTypes.includes(snapPoint.type)) {
        errors.push(`Invalid snap point type: ${snapPoint.type}`);
      }

      // Validate priority
      const priorityValidation = this.validateNumeric(snapPoint.priority, `${context} priority`);
      if (!priorityValidation.isValid) {
        errors.push(...priorityValidation.errors);
      } else if (priorityValidation.sanitizedValue! < 1 || priorityValidation.sanitizedValue! > 10) {
        errors.push('Snap point priority must be between 1 and 10');
      }

      if (errors.length > 0) {
        return { isValid: false, errors, warnings };
      }

      const sanitizedSnapPoint: SnapPoint = {
        id: idValidation.sanitizedValue!,
        type: snapPoint.type,
        position: positionValidation.sanitizedValue!,
        priority: priorityValidation.sanitizedValue!,
        elementId: snapPoint.elementId || 'unknown',
        elementType: snapPoint.elementType || 'segment',
        distance: snapPoint.distance,
        metadata: snapPoint.metadata
      };

      return {
        isValid: true,
        sanitizedValue: sanitizedSnapPoint,
        errors,
        warnings,
        metadata: { context }
      };

    } catch (error) {
      errors.push(`Snap point validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Validate centerline object
   */
  static validateCenterline(centerline: any, context?: string): ValidationResult<Centerline> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (!centerline || typeof centerline !== 'object') {
        errors.push('Centerline must be an object');
        return { isValid: false, errors, warnings };
      }

      // Validate ID
      const idValidation = this.validateString(centerline.id, `${context} id`, {
        required: true,
        minLength: 1,
        maxLength: 100
      });
      if (!idValidation.isValid) {
        errors.push(...idValidation.errors);
      }

      // Validate points
      const pointsValidation = this.validatePointArray(centerline.points, `${context} points`);
      if (!pointsValidation.isValid) {
        errors.push(...pointsValidation.errors);
        return { isValid: false, errors, warnings };
      }

      // Validate type
      const validTypes = ['straight', 'arc', 'segmented'];
      if (!validTypes.includes(centerline.type)) {
        errors.push(`Invalid centerline type: ${centerline.type}`);
      }

      // Validate radius for arc type
      if (centerline.type === 'arc' && centerline.radius !== undefined) {
        const radiusValidation = this.validateRadius(centerline.radius, `${context} radius`);
        if (!radiusValidation.isValid) {
          errors.push(...radiusValidation.errors);
        }
      }

      if (errors.length > 0) {
        return { isValid: false, errors, warnings };
      }

      const sanitizedCenterline: Centerline = {
        id: idValidation.sanitizedValue!,
        type: centerline.type,
        points: pointsValidation.sanitizedValue!,
        isComplete: centerline.isComplete || false,
        isSMACNACompliant: centerline.isSMACNACompliant || false,
        warnings: centerline.warnings || [],
        radius: centerline.radius,
        width: centerline.width,
        height: centerline.height,
        metadata: centerline.metadata || {
          totalLength: 0,
          segmentCount: pointsValidation.sanitizedValue!.length - 1,
          hasArcs: centerline.type === 'arc',
          createdAt: new Date(),
          lastModified: new Date()
        }
      };

      return {
        isValid: true,
        sanitizedValue: sanitizedCenterline,
        errors,
        warnings,
        metadata: { context }
      };

    } catch (error) {
      errors.push(`Centerline validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  // ========================================
  // Validation Error Handling
  // ========================================

  /**
   * Create validation error from validation result
   */
  static createValidationError(
    result: ValidationResult,
    context: string,
    operation: string
  ): SnapLogicValidationError {
    const message = `Validation failed for ${context}: ${result.errors.join(', ')}`;
    
    return new SnapLogicValidationError(
      message,
      {
        component: 'ValidationUtils',
        operation,
        metadata: {
          validationErrors: result.errors,
          validationWarnings: result.warnings,
          context,
          ...result.metadata
        }
      }
    );
  }

  /**
   * Validate and throw on error
   */
  static validateOrThrow<T>(
    result: ValidationResult<T>,
    context: string,
    operation: string
  ): T {
    if (!result.isValid) {
      throw this.createValidationError(result, context, operation);
    }

    return result.sanitizedValue!;
  }

  // ========================================
  // Touch Event Validation
  // ========================================

  /**
   * Validate touch event data
   */
  static validateTouchEvent(event: any, context?: string): ValidationResult<{
    position: Point2D;
    timestamp: number;
    touchCount: number;
    pressure?: number;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (!event || typeof event !== 'object') {
        errors.push('Touch event must be an object');
        return { isValid: false, errors, warnings };
      }

      // Validate position
      const positionValidation = this.validatePoint2D(event.position || event, `${context} position`);
      if (!positionValidation.isValid) {
        errors.push(...positionValidation.errors);
        return { isValid: false, errors, warnings };
      }

      // Validate timestamp
      const timestampValidation = this.validateNumeric(event.timestamp || Date.now(), `${context} timestamp`);
      if (!timestampValidation.isValid) {
        errors.push(...timestampValidation.errors);
      }

      // Validate touch count
      const touchCountValidation = this.validateNumeric(event.touchCount || 1, `${context} touchCount`);
      if (!touchCountValidation.isValid) {
        errors.push(...touchCountValidation.errors);
      } else if (touchCountValidation.sanitizedValue! < 1 || touchCountValidation.sanitizedValue! > 10) {
        errors.push('Touch count must be between 1 and 10');
      }

      // Validate pressure (optional)
      let pressure: number | undefined;
      if (event.pressure !== undefined) {
        const pressureValidation = this.validateNumeric(event.pressure, `${context} pressure`);
        if (!pressureValidation.isValid) {
          warnings.push(...pressureValidation.errors);
        } else if (pressureValidation.sanitizedValue! < 0 || pressureValidation.sanitizedValue! > 1) {
          warnings.push('Pressure should be between 0 and 1');
          pressure = Math.max(0, Math.min(1, pressureValidation.sanitizedValue!));
        } else {
          pressure = pressureValidation.sanitizedValue;
        }
      }

      if (errors.length > 0) {
        return { isValid: false, errors, warnings };
      }

      const sanitizedEvent = {
        position: positionValidation.sanitizedValue!,
        timestamp: timestampValidation.sanitizedValue!,
        touchCount: touchCountValidation.sanitizedValue!,
        pressure
      };

      return {
        isValid: true,
        sanitizedValue: sanitizedEvent,
        errors,
        warnings,
        metadata: { context }
      };

    } catch (error) {
      errors.push(`Touch event validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Validate mouse event data
   */
  static validateMouseEvent(event: any, context?: string): ValidationResult<{
    position: Point2D;
    button: number;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (!event || typeof event !== 'object') {
        errors.push('Mouse event must be an object');
        return { isValid: false, errors, warnings };
      }

      // Validate position
      const position = { x: event.clientX || event.x || 0, y: event.clientY || event.y || 0 };
      const positionValidation = this.validatePoint2D(position, `${context} position`);
      if (!positionValidation.isValid) {
        errors.push(...positionValidation.errors);
        return { isValid: false, errors, warnings };
      }

      // Validate button
      const buttonValidation = this.validateNumeric(event.button || 0, `${context} button`);
      if (!buttonValidation.isValid) {
        errors.push(...buttonValidation.errors);
      } else if (buttonValidation.sanitizedValue! < 0 || buttonValidation.sanitizedValue! > 4) {
        errors.push('Mouse button must be between 0 and 4');
      }

      if (errors.length > 0) {
        return { isValid: false, errors, warnings };
      }

      const sanitizedEvent = {
        position: positionValidation.sanitizedValue!,
        button: buttonValidation.sanitizedValue!,
        ctrlKey: Boolean(event.ctrlKey),
        shiftKey: Boolean(event.shiftKey),
        altKey: Boolean(event.altKey)
      };

      return {
        isValid: true,
        sanitizedValue: sanitizedEvent,
        errors,
        warnings,
        metadata: { context }
      };

    } catch (error) {
      errors.push(`Mouse event validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  // ========================================
  // API Parameter Validation
  // ========================================

  /**
   * Validate API parameters for snap point queries
   */
  static validateSnapQueryParams(params: any): ValidationResult<{
    position: Point2D;
    distance: number;
    types?: string[];
    maxResults?: number;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (!params || typeof params !== 'object') {
        errors.push('Snap query parameters must be an object');
        return { isValid: false, errors, warnings };
      }

      // Validate position
      const positionValidation = this.validatePoint2D(params.position, 'query position');
      if (!positionValidation.isValid) {
        errors.push(...positionValidation.errors);
        return { isValid: false, errors, warnings };
      }

      // Validate distance
      const distanceValidation = this.validateDistance(params.distance, 'query distance');
      if (!distanceValidation.isValid) {
        errors.push(...distanceValidation.errors);
        return { isValid: false, errors, warnings };
      }

      // Validate types (optional)
      let types: string[] | undefined;
      if (params.types !== undefined) {
        const typesValidation = this.validateArray(params.types, 'snap types');
        if (!typesValidation.isValid) {
          warnings.push(...typesValidation.errors);
        } else {
          const validTypes = ['endpoint', 'centerline', 'midpoint', 'intersection', 'perpendicular', 'grid'];
          types = typesValidation.sanitizedValue!.filter(type => {
            if (typeof type === 'string' && validTypes.includes(type)) {
              return true;
            }
            warnings.push(`Invalid snap type ignored: ${type}`);
            return false;
          });
        }
      }

      // Validate maxResults (optional)
      let maxResults: number | undefined;
      if (params.maxResults !== undefined) {
        const maxResultsValidation = this.validateNumeric(params.maxResults, 'max results');
        if (!maxResultsValidation.isValid) {
          warnings.push(...maxResultsValidation.errors);
        } else if (maxResultsValidation.sanitizedValue! < 1 || maxResultsValidation.sanitizedValue! > 100) {
          maxResults = Math.max(1, Math.min(100, maxResultsValidation.sanitizedValue!));
          warnings.push(`Max results clamped to ${maxResults}`);
        } else {
          maxResults = maxResultsValidation.sanitizedValue;
        }
      }

      const sanitizedParams = {
        position: positionValidation.sanitizedValue!,
        distance: distanceValidation.sanitizedValue!,
        types,
        maxResults
      };

      return {
        isValid: errors.length === 0,
        sanitizedValue: sanitizedParams,
        errors,
        warnings,
        metadata: { parameterCount: Object.keys(params).length }
      };

    } catch (error) {
      errors.push(`Snap query parameter validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  // ========================================
  // File Upload Validation
  // ========================================

  /**
   * Validate file upload
   */
  static validateFileUpload(file: any, context?: string): ValidationResult<File> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (!file) {
        errors.push('File is required');
        return { isValid: false, errors, warnings };
      }

      // Check if it's a File object
      if (!(file instanceof File)) {
        errors.push('Invalid file object');
        return { isValid: false, errors, warnings };
      }

      // Validate file size
      if (file.size > this.config.maxFileSize) {
        errors.push(`File size ${file.size} exceeds maximum ${this.config.maxFileSize} bytes`);
      }

      // Validate file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!this.config.allowedFileTypes.includes(fileExtension)) {
        errors.push(`File type ${fileExtension} is not allowed`);
      }

      // Validate file name
      const nameValidation = this.validateString(file.name, 'file name', {
        required: true,
        maxLength: 255,
        pattern: /^[a-zA-Z0-9\s\-_.,()[\]{}]+\.[a-zA-Z0-9]+$/
      });
      if (!nameValidation.isValid) {
        errors.push(...nameValidation.errors);
      }

      return {
        isValid: errors.length === 0,
        sanitizedValue: file,
        errors,
        warnings,
        metadata: {
          context,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          lastModified: file.lastModified
        }
      };

    } catch (error) {
      errors.push(`File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  // ========================================
  // Performance Validation
  // ========================================

  /**
   * Validate performance-critical operations
   */
  static validatePerformanceOperation<T>(
    operation: () => T,
    context: string,
    maxTime?: number
  ): ValidationResult<T> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const startTime = performance.now();
    const timeLimit = maxTime || this.config.maxProcessingTime;

    try {
      const result = operation();
      const duration = performance.now() - startTime;

      if (duration > timeLimit) {
        warnings.push(`Operation ${context} took ${duration.toFixed(2)}ms (limit: ${timeLimit}ms)`);
      }

      return {
        isValid: true,
        sanitizedValue: result,
        errors,
        warnings,
        metadata: {
          context,
          duration,
          timeLimit,
          performanceScore: Math.max(0, 100 - (duration / timeLimit) * 100)
        }
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      errors.push(`Performance operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      return {
        isValid: false,
        errors,
        warnings,
        metadata: {
          context,
          duration,
          timeLimit,
          failed: true
        }
      };
    }
  }
}
