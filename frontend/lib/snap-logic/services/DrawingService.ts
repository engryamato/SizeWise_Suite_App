/**
 * Drawing Service Implementation
 * SizeWise Suite - Architectural Refactoring Priority Group
 * 
 * Refactored drawing service with single responsibility,
 * dependency injection, and clean interface implementation.
 * Focuses solely on centerline drawing operations and state management.
 * 
 * @fileoverview Drawing service implementation
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import { Point2D, Centerline } from '@/types/air-duct-sizer';
import {
  IDrawingService,
  IDrawingConfig,
  IDrawingContext,
  IDrawingOperationResult,
  IDrawingValidationResult,
  DrawingToolType,
  DrawingMode,
  DrawingState,
  ISnapDetectionService,
  ISnapResult
} from '../core/interfaces';

// Simplified interfaces for demo - in production these would be proper implementations
interface ILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error, ...args: any[]): void;
}

interface IRepository<T, TKey = string> {
  get(key: TKey): Promise<T | null>;
  getAll(): Promise<T[]>;
  add(entity: T): Promise<TKey>;
  update(key: TKey, entity: Partial<T>): Promise<boolean>;
  delete(key: TKey): Promise<boolean>;
  exists(key: TKey): Promise<boolean>;
  count(): Promise<number>;
  clear(): Promise<void>;
}

/**
 * Default drawing configuration
 */
const DEFAULT_CONFIG: IDrawingConfig = {
  defaultTool: DrawingToolType.PENCIL,
  defaultMode: DrawingMode.CONTINUOUS,
  autoSnap: true,
  validateSMACNA: true,
  showPreview: true,
  enableUndo: true,
  maxUndoSteps: 50,
  smoothingEnabled: true,
  smoothingTolerance: 2.0,
  minSegmentLength: 1.0,
  maxSegmentLength: 1000.0
};

/**
 * Drawing operation for undo/redo functionality
 */
interface IDrawingOperation {
  id: string;
  type: 'add_point' | 'complete_drawing' | 'delete_centerline' | 'update_centerline';
  timestamp: number;
  data: any;
  inverse?: IDrawingOperation;
}

/**
 * SMACNA validator interface
 */
interface ISMACNAValidator {
  validateCenterline(centerline: Centerline): Promise<IDrawingValidationResult>;
}

/**
 * Simple SMACNA validator implementation
 */
class SMACNAValidator implements ISMACNAValidator {
  async validateCenterline(centerline: Centerline): Promise<IDrawingValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic validation rules
    if (centerline.points.length < 2) {
      errors.push('Centerline must have at least 2 points');
    }

    // Check minimum segment length
    for (let i = 0; i < centerline.points.length - 1; i++) {
      const p1 = centerline.points[i];
      const p2 = centerline.points[i + 1];
      const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      
      if (distance < 1.0) {
        warnings.push(`Segment ${i + 1} is very short (${distance.toFixed(2)} units)`);
      }
    }

    // Check for sharp angles
    if (centerline.points.length >= 3) {
      for (let i = 1; i < centerline.points.length - 1; i++) {
        const p1 = centerline.points[i - 1];
        const p2 = centerline.points[i];
        const p3 = centerline.points[i + 1];
        
        const angle = this.calculateAngle(p1, p2, p3);
        if (angle < 30) {
          warnings.push(`Sharp angle detected at point ${i + 1} (${angle.toFixed(1)}°)`);
          suggestions.push('Consider using a curved fitting for sharp angles');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      smacnaCompliant: errors.length === 0 && warnings.length === 0,
      suggestions
    };
  }

  private calculateAngle(p1: Point2D, p2: Point2D, p3: Point2D): number {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    const cos = dot / (mag1 * mag2);
    return Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);
  }
}

/**
 * Drawing service implementation
 */
export class DrawingService implements IDrawingService {
  private config: IDrawingConfig;
  private snapDetectionService: ISnapDetectionService;
  private centerlineRepository: IRepository<Centerline>;
  private smacnaValidator: ISMACNAValidator;
  private logger: ILogger;

  // Drawing state
  private currentState: DrawingState = DrawingState.IDLE;
  private currentTool: DrawingToolType;
  private currentMode: DrawingMode;
  private currentPoints: Point2D[] = [];
  private previewPoints: Point2D[] = [];
  private lastSnapResult: ISnapResult | null = null;

  // Undo/Redo system
  private undoStack: IDrawingOperation[] = [];
  private redoStack: IDrawingOperation[] = [];

  constructor(
    snapDetectionService: ISnapDetectionService,
    centerlineRepository: IRepository<Centerline>,
    logger?: ILogger,
    config?: Partial<IDrawingConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.snapDetectionService = snapDetectionService;
    this.centerlineRepository = centerlineRepository;
    this.smacnaValidator = new SMACNAValidator();
    this.logger = logger || console as any;
    
    this.currentTool = this.config.defaultTool;
    this.currentMode = this.config.defaultMode;
  }

  async startDrawing(
    startPoint: Point2D,
    tool?: DrawingToolType,
    mode?: DrawingMode
  ): Promise<IDrawingOperationResult> {
    try {
      if (this.currentState === DrawingState.DRAWING) {
        await this.cancelDrawing();
      }

      this.currentTool = tool || this.currentTool;
      this.currentMode = mode || this.currentMode;
      this.currentState = DrawingState.DRAWING;
      this.currentPoints = [];
      this.previewPoints = [];

      // Apply snap detection if enabled
      let adjustedStartPoint = startPoint;
      if (this.config.autoSnap) {
        const snapResult = await this.snapDetectionService.findClosestSnapPoint(startPoint);
        if (snapResult.isSnapped) {
          adjustedStartPoint = snapResult.adjustedPosition;
          this.lastSnapResult = snapResult;
        }
      }

      this.currentPoints.push(adjustedStartPoint);
      
      this.logger.debug(`Started drawing with tool: ${this.currentTool}, mode: ${this.currentMode}`);

      return {
        success: true,
        centerlineId: undefined,
        centerline: undefined,
        validationResult: undefined
      };

    } catch (error) {
      this.logger.error('Error starting drawing:', error as Error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async addPoint(point: Point2D): Promise<IDrawingOperationResult> {
    try {
      if (this.currentState !== DrawingState.DRAWING) {
        throw new Error('No active drawing session');
      }

      // Apply snap detection if enabled
      let adjustedPoint = point;
      if (this.config.autoSnap) {
        const snapResult = await this.snapDetectionService.findClosestSnapPoint(point);
        if (snapResult.isSnapped) {
          adjustedPoint = snapResult.adjustedPosition;
          this.lastSnapResult = snapResult;
        }
      }

      // Check minimum segment length
      if (this.currentPoints.length > 0) {
        const lastPoint = this.currentPoints[this.currentPoints.length - 1];
        const distance = this.calculateDistance(lastPoint, adjustedPoint);
        
        if (distance < this.config.minSegmentLength) {
          return {
            success: false,
            error: `Segment too short: ${distance.toFixed(2)} < ${this.config.minSegmentLength}`
          };
        }
      }

      this.currentPoints.push(adjustedPoint);

      // Update preview points if smoothing is enabled
      if (this.config.smoothingEnabled) {
        this.updatePreviewPoints();
      }

      // Record operation for undo
      if (this.config.enableUndo) {
        this.recordOperation({
          id: this.generateOperationId(),
          type: 'add_point',
          timestamp: Date.now(),
          data: { point: adjustedPoint }
        });
      }

      this.logger.debug(`Added point: (${adjustedPoint.x}, ${adjustedPoint.y})`);

      return {
        success: true,
        centerlineId: undefined,
        centerline: undefined
      };

    } catch (error) {
      this.logger.error('Error adding point:', error as Error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async completeDrawing(): Promise<IDrawingOperationResult> {
    try {
      if (this.currentState !== DrawingState.DRAWING) {
        throw new Error('No active drawing session');
      }

      if (this.currentPoints.length < 2) {
        throw new Error('Centerline must have at least 2 points');
      }

      // Create centerline
      const centerline: Centerline = {
        id: this.generateCenterlineId(),
        type: this.determineCenterlineType(),
        points: this.config.smoothingEnabled ? this.previewPoints : this.currentPoints
      };

      // Validate centerline
      let validationResult: IDrawingValidationResult | undefined;
      if (this.config.validateSMACNA) {
        validationResult = await this.smacnaValidator.validateCenterline(centerline);
        if (!validationResult.isValid) {
          return {
            success: false,
            error: 'Centerline validation failed',
            validationResult
          };
        }
      }

      // Save centerline
      const centerlineId = await this.centerlineRepository.add(centerline);

      // Record operation for undo
      if (this.config.enableUndo) {
        this.recordOperation({
          id: this.generateOperationId(),
          type: 'complete_drawing',
          timestamp: Date.now(),
          data: { centerlineId, centerline }
        });
      }

      // Reset drawing state
      this.currentState = DrawingState.COMPLETED;
      this.currentPoints = [];
      this.previewPoints = [];
      this.lastSnapResult = null;

      this.logger.debug(`Completed drawing: ${centerlineId}`);

      return {
        success: true,
        centerlineId,
        centerline,
        validationResult
      };

    } catch (error) {
      this.logger.error('Error completing drawing:', error as Error);
      this.currentState = DrawingState.ERROR;
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async cancelDrawing(): Promise<void> {
    this.currentState = DrawingState.CANCELLED;
    this.currentPoints = [];
    this.previewPoints = [];
    this.lastSnapResult = null;
    this.logger.debug('Cancelled drawing');
  }

  async pauseDrawing(): Promise<void> {
    if (this.currentState === DrawingState.DRAWING) {
      this.currentState = DrawingState.PAUSED;
      this.logger.debug('Paused drawing');
    }
  }

  async resumeDrawing(): Promise<void> {
    if (this.currentState === DrawingState.PAUSED) {
      this.currentState = DrawingState.DRAWING;
      this.logger.debug('Resumed drawing');
    }
  }

  async setTool(tool: DrawingToolType): Promise<void> {
    this.currentTool = tool;
    this.logger.debug(`Set tool: ${tool}`);
  }

  async setMode(mode: DrawingMode): Promise<void> {
    this.currentMode = mode;
    this.logger.debug(`Set mode: ${mode}`);
  }

  async getContext(): Promise<IDrawingContext> {
    return {
      currentTool: this.currentTool,
      currentMode: this.currentMode,
      state: this.currentState,
      activeSnapPoint: this.lastSnapResult?.snapPoint || null,
      lastSnapResult: this.lastSnapResult,
      previewPoints: [...this.previewPoints],
      isSnapping: this.config.autoSnap && this.lastSnapResult?.isSnapped === true,
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0
    };
  }

  async getState(): Promise<DrawingState> {
    return this.currentState;
  }

  async undo(): Promise<IDrawingOperationResult> {
    if (!this.config.enableUndo || this.undoStack.length === 0) {
      return {
        success: false,
        error: 'Nothing to undo'
      };
    }

    const operation = this.undoStack.pop()!;
    this.redoStack.push(operation);

    try {
      await this.reverseOperation(operation);
      this.logger.debug(`Undid operation: ${operation.type}`);
      
      return {
        success: true
      };
    } catch (error) {
      this.logger.error('Error during undo:', error as Error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async redo(): Promise<IDrawingOperationResult> {
    if (!this.config.enableUndo || this.redoStack.length === 0) {
      return {
        success: false,
        error: 'Nothing to redo'
      };
    }

    const operation = this.redoStack.pop()!;
    this.undoStack.push(operation);

    try {
      await this.applyOperation(operation);
      this.logger.debug(`Redid operation: ${operation.type}`);
      
      return {
        success: true
      };
    } catch (error) {
      this.logger.error('Error during redo:', error as Error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async clearHistory(): Promise<void> {
    this.undoStack = [];
    this.redoStack = [];
    this.logger.debug('Cleared undo/redo history');
  }

  async validateCenterline(centerline: Centerline): Promise<IDrawingValidationResult> {
    return await this.smacnaValidator.validateCenterline(centerline);
  }

  async getPreviewPoints(): Promise<Point2D[]> {
    return [...this.previewPoints];
  }

  async updateConfig(config: Partial<IDrawingConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    this.logger.debug('Updated drawing configuration');
  }

  async getConfig(): Promise<IDrawingConfig> {
    return { ...this.config };
  }

  async getAllCenterlines(): Promise<Centerline[]> {
    return await this.centerlineRepository.getAll();
  }

  async getCenterline(id: string): Promise<Centerline | null> {
    return await this.centerlineRepository.get(id);
  }

  async deleteCenterline(id: string): Promise<boolean> {
    const success = await this.centerlineRepository.delete(id);
    
    if (success && this.config.enableUndo) {
      this.recordOperation({
        id: this.generateOperationId(),
        type: 'delete_centerline',
        timestamp: Date.now(),
        data: { centerlineId: id }
      });
    }
    
    return success;
  }

  async updateCenterline(id: string, updates: Partial<Centerline>): Promise<boolean> {
    const success = await this.centerlineRepository.update(id, updates);
    
    if (success && this.config.enableUndo) {
      this.recordOperation({
        id: this.generateOperationId(),
        type: 'update_centerline',
        timestamp: Date.now(),
        data: { centerlineId: id, updates }
      });
    }
    
    return success;
  }

  async getStatistics() {
    const centerlines = await this.centerlineRepository.getAll();
    const totalLength = centerlines.reduce((sum, cl) => sum + this.calculateCenterlineLength(cl), 0);
    const validCenterlines = await Promise.all(
      centerlines.map(cl => this.validateCenterline(cl))
    );
    
    return {
      totalCenterlines: centerlines.length,
      totalLength,
      averageLength: centerlines.length > 0 ? totalLength / centerlines.length : 0,
      validCenterlines: validCenterlines.filter(v => v.isValid).length,
      smacnaCompliantCenterlines: validCenterlines.filter(v => v.smacnaCompliant).length
    };
  }

  // Private helper methods
  private updatePreviewPoints(): void {
    if (this.currentPoints.length < 2) {
      this.previewPoints = [...this.currentPoints];
      return;
    }

    // Simple smoothing algorithm
    this.previewPoints = this.applySmoothingFilter(this.currentPoints);
  }

  private applySmoothingFilter(points: Point2D[]): Point2D[] {
    if (points.length < 3) {
      return [...points];
    }

    const smoothed: Point2D[] = [points[0]]; // Keep first point

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      // Simple averaging
      const smoothedPoint: Point2D = {
        x: (prev.x + curr.x + next.x) / 3,
        y: (prev.y + curr.y + next.y) / 3
      };

      smoothed.push(smoothedPoint);
    }

    smoothed.push(points[points.length - 1]); // Keep last point
    return smoothed;
  }

  private determineCenterlineType(): Centerline['type'] {
    switch (this.currentTool) {
      case DrawingToolType.ARC:
        return 'arc';
      case DrawingToolType.SEGMENTED:
        return 'segmented';
      default:
        return 'straight';
    }
  }

  private calculateDistance(p1: Point2D, p2: Point2D): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateCenterlineLength(centerline: Centerline): number {
    let length = 0;
    for (let i = 0; i < centerline.points.length - 1; i++) {
      length += this.calculateDistance(centerline.points[i], centerline.points[i + 1]);
    }
    return length;
  }

  private recordOperation(operation: IDrawingOperation): void {
    this.undoStack.push(operation);
    this.redoStack = []; // Clear redo stack when new operation is recorded

    // Limit undo stack size
    if (this.undoStack.length > this.config.maxUndoSteps) {
      this.undoStack.shift();
    }
  }

  private async reverseOperation(operation: IDrawingOperation): Promise<void> {
    switch (operation.type) {
      case 'add_point':
        if (this.currentPoints.length > 0) {
          this.currentPoints.pop();
        }
        break;
      case 'complete_drawing':
        await this.centerlineRepository.delete(operation.data.centerlineId);
        break;
      case 'delete_centerline':
        // Would need to restore the deleted centerline
        break;
      case 'update_centerline':
        // Would need to revert the updates
        break;
    }
  }

  private async applyOperation(operation: IDrawingOperation): Promise<void> {
    switch (operation.type) {
      case 'add_point':
        this.currentPoints.push(operation.data.point);
        break;
      case 'complete_drawing':
        await this.centerlineRepository.add(operation.data.centerline);
        break;
      case 'delete_centerline':
        await this.centerlineRepository.delete(operation.data.centerlineId);
        break;
      case 'update_centerline':
        await this.centerlineRepository.update(operation.data.centerlineId, operation.data.updates);
        break;
    }
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private generateCenterlineId(): string {
    return `cl_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}
