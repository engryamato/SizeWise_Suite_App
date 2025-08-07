/**
 * Snap Logic System
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Main integration class that coordinates all snap logic components
 * and provides a unified interface for the UI components.
 */

import { 
  Centerline, 
  CenterlinePoint,
  SnapPoint,
  SnapResult,
  SnapConfig,
  DrawingTool,
  Room,
  Segment,
  Equipment
} from '@/types/air-duct-sizer';
import { DuctSegment, DuctFitting } from '@/components/3d/types/Canvas3DTypes';
import { SnapLogicManager } from './SnapLogicManager';
import { SnapPointGenerator } from './SnapPointGenerator';
import { CenterlineDrawingManager, CenterlineDrawingConfig } from './CenterlineDrawingManager';
import { MagneticSnappingIntegration } from './MagneticSnappingIntegration';
import { MidSpanBranchingManager, BranchPoint } from './MidSpanBranchingManager';
import { CenterlineTo3DConverter } from './CenterlineTo3DConverter';
import { DebugCollector } from './system/DebugCollector';
import { DebugData } from '../../components/snap-logic/DebugOverlay';
import { PerformanceOptimizer, PerformanceOptimizerConfig } from './system/PerformanceOptimizer';
import { PerformanceMonitor, PerformanceMonitorConfig } from './system/PerformanceMonitor';

/**
 * System configuration
 */
export interface SnapLogicSystemConfig {
  snap?: Partial<SnapConfig>;
  drawing?: Partial<CenterlineDrawingConfig>;
  magnetic?: any; // MagneticSnappingConfig
  conversion?: any; // ConversionConfig
  performance?: Partial<PerformanceOptimizerConfig>;
  monitoring?: Partial<PerformanceMonitorConfig>;
}

/**
 * System state
 */
export interface SnapLogicSystemState {
  isActive: boolean;
  currentTool: DrawingTool;
  isDrawing: boolean;
  currentCenterline: Centerline | null;
  snapResult: SnapResult | null;
  branchPoints: BranchPoint[];
  centerlines: Centerline[];
}

/**
 * Build ductwork result
 */
export interface BuildDuctworkResult {
  success: boolean;
  ductSegments: DuctSegment[];
  fittings: DuctFitting[];
  warnings: string[];
  errors: string[];
  stats: {
    totalLength: number;
    segmentCount: number;
    fittingCount: number;
  };
}

/**
 * Main snap logic system coordinator
 */
export class SnapLogicSystem {
  private snapManager: SnapLogicManager;
  private drawingManager: CenterlineDrawingManager;
  private magneticIntegration: MagneticSnappingIntegration;
  private branchingManager: MidSpanBranchingManager;
  private converter: CenterlineTo3DConverter;
  private debugCollector: DebugCollector;
  private performanceOptimizer: PerformanceOptimizer;
  private performanceMonitor: PerformanceMonitor;

  private state: SnapLogicSystemState;
  private eventCallbacks: Map<string, Function[]> = new Map();

  // Debug mode state
  private debugMode = false;

  constructor(config?: SnapLogicSystemConfig) {
    // Initialize core managers
    this.snapManager = new SnapLogicManager(config?.snap);
    this.drawingManager = new CenterlineDrawingManager(this.snapManager, config?.drawing);
    this.magneticIntegration = new MagneticSnappingIntegration(this.snapManager, config?.magnetic);
    this.branchingManager = new MidSpanBranchingManager();
    this.converter = new CenterlineTo3DConverter(config?.conversion);
    this.debugCollector = new DebugCollector();
    this.performanceOptimizer = new PerformanceOptimizer(config?.performance);
    this.performanceMonitor = new PerformanceMonitor(config?.monitoring);

    // Initialize state
    this.state = {
      isActive: false,
      currentTool: 'select',
      isDrawing: false,
      currentCenterline: null,
      snapResult: null,
      branchPoints: [],
      centerlines: []
    };

    this.setupEventHandlers();
    this.setupPerformanceOptimizer();
    this.setupPerformanceMonitor();
  }

  /**
   * Setup event handlers between components
   */
  private setupEventHandlers(): void {
    // Drawing manager events
    this.drawingManager.on('drawing_started', (event, data) => {
      this.state.isDrawing = true;
      this.state.currentCenterline = data.centerline || null;
      this.emitEvent('drawing_started', data);
    });

    this.drawingManager.on('drawing_completed', (event, data) => {
      this.state.isDrawing = false;
      if (data.centerline) {
        this.state.centerlines.push(data.centerline);
        this.updateSnapPointsFromCenterlines();
      }
      this.state.currentCenterline = null;
      this.emitEvent('drawing_completed', data);
    });

    this.drawingManager.on('drawing_cancelled', (event, data) => {
      this.state.isDrawing = false;
      this.state.currentCenterline = null;
      this.emitEvent('drawing_cancelled', data);
    });

    this.drawingManager.on('validation_warning', (event, data) => {
      this.emitEvent('validation_warning', data);
    });
  }

  /**
   * Setup performance optimizer with operation processors
   */
  private setupPerformanceOptimizer(): void {
    // Set up batch operation processor
    this.performanceOptimizer.setOperationProcessor(async (operation) => {
      switch (operation.target) {
        case 'snapPoint':
          await this.processSnapPointOperation(operation);
          break;
        case 'cache':
          await this.processCacheOperation(operation);
          break;
        case 'spatialIndex':
          await this.processSpatialIndexOperation(operation);
          break;
      }
    });
  }

  /**
   * Process snap point batch operations
   */
  private async processSnapPointOperation(operation: any): Promise<void> {
    const snapPoint = operation.data;

    switch (operation.type) {
      case 'add':
        this.snapManager.addSnapPoint(snapPoint);
        break;
      case 'remove':
        this.snapManager.removeSnapPoint(snapPoint.id);
        break;
      case 'update':
        this.snapManager.removeSnapPoint(snapPoint.id);
        this.snapManager.addSnapPoint(snapPoint);
        break;
    }
  }

  /**
   * Process cache batch operations
   */
  private async processCacheOperation(operation: any): Promise<void> {
    const { operation: cacheOp, data } = operation.data;

    switch (cacheOp) {
      case 'region':
        this.snapManager.invalidateCacheRegion(data);
        break;
      case 'type':
        this.snapManager.invalidateCacheByType(data);
        break;
      case 'clear':
        this.snapManager.clearSnapCache();
        break;
    }
  }

  /**
   * Process spatial index batch operations
   */
  private async processSpatialIndexOperation(operation: any): Promise<void> {
    switch (operation.type) {
      case 'rebuild':
        this.snapManager.rebuildSpatialIndex();
        break;
      case 'add':
        // Spatial index is automatically updated when snap points are added
        break;
      case 'remove':
        // Spatial index is automatically updated when snap points are removed
        break;
    }
  }

  /**
   * Setup performance monitor with data sources
   */
  private setupPerformanceMonitor(): void {
    // Set up data sources for performance monitoring
    this.performanceMonitor.setDataSources({
      spatialIndex: () => this.snapManager.getSpatialIndexMetrics(),
      cache: () => this.snapManager.getSnapCacheStatistics(),
      optimizer: () => this.performanceOptimizer.getMetrics(),
      snapLogic: () => this.snapManager.getSnapStatistics()
    });

    // Start monitoring if debug mode is enabled
    if (this.debugMode) {
      this.performanceMonitor.startMonitoring();
    }
  }

  /**
   * Activate the snap logic system
   */
  activate(): void {
    this.state.isActive = true;
    this.emitEvent('system_activated', {});
  }

  /**
   * Deactivate the snap logic system
   */
  deactivate(): void {
    this.state.isActive = false;
    this.state.isDrawing = false;
    this.state.currentCenterline = null;
    this.drawingManager.cancelDrawing();
    this.emitEvent('system_deactivated', {});
  }

  /**
   * Set current drawing tool
   */
  setCurrentTool(tool: DrawingTool): void {
    this.state.currentTool = tool;
    this.magneticIntegration.setCurrentTool(tool);
    
    // Activate/deactivate based on tool
    if (tool === ('pencil' as DrawingTool)) {
      this.activate();
    } else if (this.state.currentTool === ('pencil' as DrawingTool) && tool !== ('pencil' as DrawingTool)) {
      this.deactivate();
    }
  }

  /**
   * Update project elements for snap point generation
   */
  updateProjectElements(
    rooms: Room[],
    segments: Segment[],
    equipment: Equipment[]
  ): void {
    this.magneticIntegration.updateSnapPointsFromProject(
      rooms,
      segments,
      equipment,
      this.state.centerlines
    );
  }

  /**
   * Update snap points from centerlines
   */
  private updateSnapPointsFromCenterlines(): void {
    // Use debounced update for performance during rapid centerline changes
    this.performanceOptimizer.debounceDrawingOperation(
      'updateSnapPoints',
      () => this.updateSnapPointsFromCenterlinesInternal()
    );
  }

  /**
   * Internal snap point update (debounced)
   */
  private updateSnapPointsFromCenterlinesInternal(): void {
    // Batch remove existing centerline snap points
    const existingSnapPoints = Array.from(this.snapManager['snapPoints'].values());
    const centerlineSnapPoints = existingSnapPoints.filter(point => point.elementType === 'centerline');

    // Batch removal operations
    centerlineSnapPoints.forEach(point => {
      this.performanceOptimizer.batchSnapPointUpdate('remove', point, 1);
    });

    // Batch add new centerline snap points
    this.state.centerlines.forEach(centerline => {
      const snapPoints = SnapPointGenerator.generateCenterlineSnapPoints(centerline);
      snapPoints.forEach(point => {
        this.performanceOptimizer.batchSnapPointUpdate('add', point, 2);
      });
    });

    // Batch add intersection points (higher priority)
    const intersectionPoints = SnapPointGenerator.generateIntersectionSnapPoints([], this.state.centerlines);
    intersectionPoints.forEach(point => {
      this.performanceOptimizer.batchSnapPointUpdate('add', point, 1);
    });

    // Invalidate cache for affected regions
    this.state.centerlines.forEach(centerline => {
      const bounds = this.calculateCenterlineBounds(centerline);
      this.performanceOptimizer.batchCacheInvalidation('region', bounds, 3);
    });
  }

  /**
   * Handle mouse/cursor movement
   */
  handleCursorMovement(
    position: { x: number; y: number },
    viewport: { x: number; y: number; scale: number }
  ): {
    attractedPosition: { x: number; y: number };
    snapResult: SnapResult | null;
  } {
    if (!this.state.isActive) {
      return { attractedPosition: position, snapResult: null };
    }

    // Use debounced cursor movement for performance optimization
    this.performanceOptimizer.debounceMouseMove(position, (debouncedPosition) => {
      this.processCursorMovementInternal(debouncedPosition, viewport);
    });

    // Return current state immediately for responsive UI
    return {
      attractedPosition: this.state.snapResult?.snapPoint?.position || position,
      snapResult: this.state.snapResult
    };
  }

  /**
   * Internal cursor movement processing (debounced)
   */
  private processCursorMovementInternal(
    position: { x: number; y: number },
    viewport: { x: number; y: number; scale: number }
  ): void {
    // Record performance if debug mode is enabled
    const startTime = this.debugMode ? performance.now() : 0;

    // Process magnetic attraction
    const attractionResult = this.magneticIntegration.processCursorMovement(position, viewport);

    // Get snap result
    const snapResult = this.magneticIntegration.getCurrentSnapResult();
    this.state.snapResult = snapResult;

    // Record snap operation performance
    if (this.debugMode && startTime > 0) {
      this.debugCollector.recordSnapOperation(performance.now() - startTime);
      this.updateDebugData();
    }

    // Update drawing preview if drawing (debounced)
    if (this.state.isDrawing) {
      this.performanceOptimizer.debounceDrawingOperation(
        'updatePreview',
        (pos: { x: number; y: number }) => {
          this.drawingManager.updatePreview(pos);
        },
        attractionResult.attractedPosition
      );
    }

    // Emit cursor movement event for UI updates
    this.emitEvent('cursor_moved', {
      position: attractionResult.attractedPosition,
      snapResult
    });
  }

  /**
   * Handle click/tap events
   */
  handleClick(position: { x: number; y: number }): boolean {
    if (!this.state.isActive || this.state.currentTool !== 'pencil') {
      return false;
    }

    if (this.state.isDrawing) {
      // Add point to current centerline
      return this.drawingManager.addPoint(position);
    } else {
      // Start new centerline
      this.drawingManager.startDrawing(position);
      return true;
    }
  }

  /**
   * Handle right-click events
   */
  handleRightClick(): boolean {
    if (!this.state.isActive || !this.state.isDrawing) {
      return false;
    }

    // Complete current centerline
    this.drawingManager.completeDrawing();
    return true;
  }

  /**
   * Handle keyboard events
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    if (!this.state.isActive) {
      return false;
    }

    switch (event.key) {
      case 'Escape':
        if (this.state.isDrawing) {
          this.drawingManager.cancelDrawing();
          return true;
        }
        break;
      
      case 'Backspace':
      case 'Delete':
        if (this.state.isDrawing) {
          this.drawingManager.removeLastPoint();
          return true;
        }
        break;
      
      case 'Enter':
        if (this.state.isDrawing) {
          this.drawingManager.completeDrawing();
          return true;
        }
        break;
      
      case 'Tab':
        if (this.state.isDrawing) {
          event.preventDefault();
          this.drawingManager.toggleCenterlineType();
          return true;
        }
        break;
    }

    return false;
  }

  /**
   * Add branch point at position
   */
  addBranchPoint(
    centerlineId: string,
    position: { x: number; y: number },
    angle: number = 45
  ): BranchPoint | null {
    const centerline = this.state.centerlines.find(cl => cl.id === centerlineId);
    if (!centerline) return null;

    // Find segment and position
    const branchLocation = this.findBranchLocationOnCenterline(centerline, position);
    if (!branchLocation) return null;

    const branchPoint = this.branchingManager.createBranchPoint(
      centerlineId,
      position,
      branchLocation.segmentIndex,
      branchLocation.segmentPosition,
      angle
    );

    this.state.branchPoints.push(branchPoint);
    this.emitEvent('branch_added', { branchPoint });

    return branchPoint;
  }

  /**
   * Find branch location on centerline
   */
  private findBranchLocationOnCenterline(
    centerline: Centerline,
    position: { x: number; y: number }
  ): { segmentIndex: number; segmentPosition: number } | null {
    // This is a simplified implementation
    // In practice, you'd use the logic from MidSpanBranchingManager
    for (let i = 0; i < centerline.points.length - 1; i++) {
      // Check if position is near this segment
      // Return first match for simplicity
      return { segmentIndex: i, segmentPosition: 0.5 };
    }
    return null;
  }

  /**
   * Build ductwork from centerlines
   */
  buildDuctwork(): BuildDuctworkResult {
    if (this.state.centerlines.length === 0) {
      return {
        success: false,
        ductSegments: [],
        fittings: [],
        warnings: ['No centerlines to convert'],
        errors: [],
        stats: { totalLength: 0, segmentCount: 0, fittingCount: 0 }
      };
    }

    const conversionResult = this.converter.convertCenterlinesToDuctwork(
      this.state.centerlines,
      this.state.branchPoints
    );

    const result: BuildDuctworkResult = {
      success: conversionResult.success,
      ductSegments: conversionResult.ductSegments,
      fittings: conversionResult.fittings,
      warnings: conversionResult.validationWarnings,
      errors: conversionResult.validationErrors,
      stats: {
        totalLength: conversionResult.systemStats.totalLength,
        segmentCount: conversionResult.systemStats.segmentCount,
        fittingCount: conversionResult.systemStats.fittingCount
      }
    };

    this.emitEvent('ductwork_built', result);
    return result;
  }

  /**
   * Get current system state
   */
  getState(): SnapLogicSystemState {
    return { ...this.state };
  }

  /**
   * Get all snap points
   */
  getAllSnapPoints(): SnapPoint[] {
    return Array.from(this.snapManager['snapPoints'].values());
  }

  /**
   * Get current snap result
   */
  getCurrentSnapResult(): SnapResult | null {
    return this.state.snapResult;
  }

  /**
   * Get drawing preview data
   */
  getDrawingPreview(): {
    isDrawing: boolean;
    currentCenterline: Centerline | null;
    previewPoint: CenterlinePoint | null;
  } {
    return {
      isDrawing: this.state.isDrawing,
      currentCenterline: this.state.currentCenterline,
      previewPoint: this.drawingManager.getPreviewPoint()
    };
  }

  /**
   * Clear all centerlines
   */
  clearCenterlines(): void {
    this.state.centerlines = [];
    this.state.branchPoints = [];
    this.updateSnapPointsFromCenterlines();
    this.emitEvent('centerlines_cleared', {});
  }

  /**
   * Register event callback
   */
  on(event: string, callback: Function): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  /**
   * Unregister event callback
   */
  off(event: string, callback: Function): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emitEvent(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Enable debug mode
   */
  enableDebugMode(): void {
    this.debugMode = true;
    this.debugCollector.startPerformanceMonitoring();
    this.performanceMonitor.startMonitoring();
    this.updateDebugData();
  }

  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    this.debugMode = false;
    this.debugCollector.stopPerformanceMonitoring();
    this.performanceMonitor.stopMonitoring();
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugModeEnabled(): boolean {
    return this.debugMode;
  }

  /**
   * Get debug data
   */
  getDebugData(): DebugData {
    return this.debugCollector.getDebugData();
  }

  /**
   * Update debug data with current system state
   */
  private updateDebugData(): void {
    if (!this.debugMode) return;

    // Update system state
    this.debugCollector.updateSystemState({
      isActive: this.state.isActive,
      currentTool: this.state.currentTool,
      isDrawing: this.state.isDrawing,
      snapEnabled: true, // Would need to get from snap manager
      touchOverrideActive: false // Would need to get from magnetic integration
    });

    // Update snap point statistics
    const allSnapPoints = Array.from(this.snapManager['snapPoints'].values());
    this.debugCollector.updateSnapPointStats(
      allSnapPoints,
      this.state.snapResult?.snapPoint || undefined,
      this.state.snapResult || undefined
    );

    // Update drawing state
    this.debugCollector.updateDrawingState({
      centerlines: this.state.centerlines,
      currentCenterline: this.state.currentCenterline,
      branchPoints: this.state.branchPoints.length
    });

    // Update spatial index performance metrics
    const spatialMetrics = this.snapManager.getSpatialIndexMetrics();
    this.debugCollector.updateSpatialIndexMetrics({
      quadTreeDepth: spatialMetrics.quadTreeDepth,
      quadTreeNodes: spatialMetrics.quadTreeNodes,
      cacheHitRate: spatialMetrics.cacheHitRate,
      spatialSearchTime: spatialMetrics.spatialSearchTime,
      linearSearchTime: spatialMetrics.linearSearchTime,
      performanceImprovement: spatialMetrics.performanceImprovement
    });

    // Update snap cache performance metrics using comprehensive metrics
    const comprehensiveMetrics = this.snapManager.getComprehensiveMetrics();
    this.debugCollector.updateSnapCacheMetrics({
      cacheHitRate: comprehensiveMetrics.hitRate,
      memoryUsage: comprehensiveMetrics.memoryUsage,
      entryCount: comprehensiveMetrics.entryCount,
      averageAccessTime: comprehensiveMetrics.averageAccessTime,
      evictionCount: comprehensiveMetrics.evictionCount,
      cachedSearchTime: comprehensiveMetrics.cachedSearchTime || 0
    });

    // Update performance optimizer metrics
    const optimizerMetrics = this.performanceOptimizer.getMetrics();
    (this.debugCollector as any).updatePerformanceOptimizerMetrics({
      debouncingEfficiency: optimizerMetrics.debouncing.debouncedMouseMoves / Math.max(1, optimizerMetrics.debouncing.mouseMoveEvents),
      batchingEfficiency: optimizerMetrics.batching.batchEfficiency,
      frameRate: optimizerMetrics.performance.frameRate,
      performanceScore: optimizerMetrics.performance.performanceScore,
      adaptiveLevel: optimizerMetrics.adaptive.optimizationLevel
    });
  }

  /**
   * Export debug data
   */
  exportDebugData(): string {
    return this.debugCollector.exportDebugData();
  }

  /**
   * Reset debug data
   */
  resetDebugData(): void {
    this.debugCollector.reset();
  }

  /**
   * Calculate bounds for a centerline (for cache invalidation)
   */
  private calculateCenterlineBounds(centerline: Centerline): { x: number; y: number; width: number; height: number } {
    if (centerline.points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = centerline.points[0].x;
    let maxX = centerline.points[0].x;
    let minY = centerline.points[0].y;
    let maxY = centerline.points[0].y;

    for (const point of centerline.points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    // Add padding for snap point influence
    const padding = 50; // Snap threshold + magnetic threshold

    return {
      x: minX - padding,
      y: minY - padding,
      width: (maxX - minX) + (padding * 2),
      height: (maxY - minY) + (padding * 2)
    };
  }

  /**
   * Get performance optimizer metrics
   */
  getPerformanceOptimizerMetrics() {
    return this.performanceOptimizer.getMetrics();
  }

  /**
   * Update performance optimizer configuration
   */
  updatePerformanceOptimizerConfig(config: Partial<PerformanceOptimizerConfig>): void {
    this.performanceOptimizer.updateConfig(config);
  }

  /**
   * Flush all pending operations (useful before important operations)
   */
  async flushPendingOperations(): Promise<void> {
    this.performanceOptimizer.flushAllDebounced();
    await this.performanceOptimizer.flushAllBatches();
  }

  /**
   * Get performance monitor metrics
   */
  getPerformanceMonitorMetrics() {
    return this.performanceMonitor.getCurrentMetrics();
  }

  /**
   * Get performance alerts
   */
  getPerformanceAlerts() {
    return this.performanceMonitor.getActiveAlerts();
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations() {
    return this.performanceMonitor.getOptimizationRecommendations();
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): string {
    return this.performanceMonitor.generatePerformanceReport();
  }

  /**
   * Update performance monitor configuration
   */
  updatePerformanceMonitorConfig(config: Partial<PerformanceMonitorConfig>): void {
    this.performanceMonitor.updateConfig(config);
  }

  /**
   * Start/stop performance monitoring
   */
  setPerformanceMonitoringEnabled(enabled: boolean): void {
    if (enabled) {
      this.performanceMonitor.startMonitoring();
    } else {
      this.performanceMonitor.stopMonitoring();
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    this.performanceOptimizer.destroy();
    this.performanceMonitor.destroy();
    this.magneticIntegration.destroy();
    this.debugCollector.destroy();
    this.eventCallbacks.clear();
  }
}
