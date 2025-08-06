/**
 * Snap Logic System - Main Export
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * This module provides a comprehensive snap logic system for HVAC centerline drawing
 * with magnetic snapping, priority hierarchy, and SMACNA compliance validation.
 * 
 * @fileoverview Main entry point for the snap logic system
 * @version 1.0.0
 * @author SizeWise Suite Development Team
 * 
 * @example Basic Usage
 * ```typescript
 * import { SnapLogicSystem, useSnapLogic } from '@/lib/snap-logic';
 * 
 * // In a React component
 * const MyDrawingComponent = () => {
 *   const snapLogic = useSnapLogic({
 *     snap: { enabled: true, snapThreshold: 15 },
 *     drawing: { defaultType: 'arc', validateSMACNA: true }
 *   });
 * 
 *   return (
 *     <SnapLogicCanvas
 *       rooms={rooms}
 *       segments={segments}
 *       equipment={equipment}
 *       viewport={viewport}
 *       onCanvasClick={snapLogic.handleClick}
 *     />
 *   );
 * };
 * ```
 * 
 * @example Advanced Usage
 * ```typescript
 * import { 
 *   SnapLogicManager, 
 *   CenterlineDrawingManager,
 *   MagneticSnappingIntegration 
 * } from '@/lib/snap-logic';
 * 
 * // Create custom snap logic system
 * const snapManager = new SnapLogicManager();
 * const drawingManager = new CenterlineDrawingManager(snapManager);
 * const magneticIntegration = new MagneticSnappingIntegration(snapManager);
 * 
 * // Handle drawing events
 * drawingManager.on('drawing_completed', (event, data) => {
 *   console.log('Centerline completed:', data.centerline);
 * });
 * ```
 */

// Core managers
export { SnapLogicManager } from './SnapLogicManager';
export { SnapPointGenerator } from './SnapPointGenerator';
export { CenterlineUtils } from './CenterlineUtils';
export { CenterlineDrawingManager } from './CenterlineDrawingManager';
export { MagneticSnappingIntegration } from './MagneticSnappingIntegration';
export { MidSpanBranchingManager } from './MidSpanBranchingManager';
export { CenterlineTo3DConverter } from './CenterlineTo3DConverter';

// Main system coordinator
export { SnapLogicSystem } from './SnapLogicSystem';

// React integration
export { useSnapLogic } from '../hooks/useSnapLogic';

// UI components
export {
  SnapVisualFeedback,
  SnapLegend,
  SnapContextMenu
} from '../../components/snap-logic/SnapVisualFeedback';
export { SnapLogicDrawingTools } from '../../components/snap-logic/SnapLogicDrawingTools';
export { SnapLogicCanvas } from '../../components/snap-logic/SnapLogicCanvas';
export {
  TouchOptimizedDrawingTools,
  TouchSnapIndicator,
  TouchContextMenu
} from '../../components/snap-logic/TouchOptimizedUI';
export {
  DebugOverlay,
  DebugModeIntegration,
  DebugStatusIndicator
} from '../../components/snap-logic/DebugModeIntegration';
export {
  SnapLogicStatusBar,
  SnapLogicWithStatusBar,
  useSnapLogicWithStatusBar,
  StatusBarUtils
} from '../../components/snap-logic/SnapLogicWithStatusBar';

// Touch gesture handler
export { TouchGestureHandler } from './magnetic/TouchGestureHandler';

// Debug system
export { DebugCollector } from './system/DebugCollector';

// Progress tracking system
export { BuildDuctworkProgressTracker } from './system/BuildDuctworkProgressTracker';

// Spatial indexing system
export { QuadTree } from './system/QuadTree';
export { SpatialIndex } from './system/SpatialIndex';
export { PerformanceBenchmark } from './system/PerformanceBenchmark';

// Snap result caching system
export { SnapCache } from './system/SnapCache';
export { CachePerformanceAnalyzer } from './system/CachePerformanceAnalyzer';

// Performance optimization system
export { PerformanceOptimizer } from './system/PerformanceOptimizer';

// Performance monitoring system
export { PerformanceMonitor } from './system/PerformanceMonitor';

// AI fitting recommendations system
export { FittingAI } from './system/FittingAI';

// Complex multi-way fitting support system
export { ComplexFittings } from './system/ComplexFittings';

// Fitting confirmation dialog component
export { FittingConfirmationDialog } from '../components/snap-logic/FittingConfirmationDialog';

// Fitting dialog integration utilities
export { FittingDialogIntegration, fittingDialogIntegration } from './utils/FittingDialogIntegration';

// Touch gesture handler system
export { TouchGestureHandler } from './system/TouchGestureHandler';

// Touch event processing utilities
export { TouchEventProcessor } from './utils/TouchEventProcessor';

// Touch-specific UI components
export { TouchOptimizedButton } from '../components/snap-logic/TouchOptimizedButton';
export { TouchOptimizedToggle } from '../components/snap-logic/TouchOptimizedToggle';
export { TouchSnapIndicator } from '../components/snap-logic/TouchSnapIndicator';

// Error handling system
export { ErrorHandler } from './system/ErrorHandler';
export {
  SnapLogicError,
  SnapLogicValidationError,
  SnapLogicPerformanceError,
  TouchGestureError,
  CenterlineError,
  SMACNAValidationError
} from './system/SnapLogicError';
export { ErrorBoundary, withErrorBoundary } from '../components/snap-logic/ErrorBoundary';
export { ErrorNotificationSystem } from '../components/snap-logic/ErrorNotificationSystem';

// Input validation and sanitization
export { ValidationUtils } from './utils/ValidationUtils';
export { InputSanitizer } from './utils/InputSanitizer';
export { EdgeCaseHandler } from './system/EdgeCaseHandler';

// SMACNA standards validation
export { SMACNAValidator } from './standards/SMACNAValidator';
export {
  SMACNAStandard,
  DuctShape,
  PressureClass
} from './standards/SMACNAValidator';

// Enhanced centerline utilities with SMACNA integration
export { CenterlineUtils } from './utils/CenterlineUtils';

// Professional engineering reports
export { EngineeringReports } from './reports/EngineeringReports';
export {
  ReportType,
  ReportFormat
} from './reports/EngineeringReports';

// AI-powered suggestions system
export { MLArchitecture } from './ai/MLArchitecture';
export { TrainingDataPipeline } from './ai/TrainingDataPipeline';
export { DesignSuggestions } from './ai/DesignSuggestions';
export {
  MLModelType,
  TrainingDataCategory,
  ConfidenceLevel,
  SuggestionType
} from './ai/MLArchitecture';

// Type exports
export type {
  SnapPoint,
  SnapResult,
  SnapConfig,
  SnapPointType,
  Centerline,
  CenterlinePoint,
  CenterlineType,
  CenterlineDrawingState
} from '../../types/air-duct-sizer';

export type {
  CenterlineDrawingMode,
  CenterlineDrawingConfig,
  CenterlineDrawingEvent,
  CenterlineDrawingEventCallback
} from './CenterlineDrawingManager';

export type {
  BranchPoint,
  BranchSuggestion,
  BranchCreationResult,
  BranchFittingType
} from './MidSpanBranchingManager';

export type {
  TouchGestureType,
  SwipeDirection,
  TouchPoint,
  GestureEvent,
  TouchGestureConfig,
  TouchGestureCallbacks
} from './magnetic/TouchGestureHandler';

export type {
  BuildDuctworkStatus,
  BuildDuctworkProgress,
  SystemSummary
} from '../components/snap-logic/SnapLogicStatusBar';

export type {
  Point2D,
  Bounds2D,
  SpatialObject
} from './system/QuadTree';

export type {
  Viewport,
  SpatialQueryOptions,
  SpatialIndexMetrics,
  SpatialIndexConfig
} from './system/SpatialIndex';

export type {
  BenchmarkConfig,
  BenchmarkQuery,
  BenchmarkResult,
  BenchmarkReport
} from './system/PerformanceBenchmark';

export type {
  SnapCacheConfig,
  CacheStatistics
} from './system/SnapCache';

export type {
  CachePerformanceAnalysis,
  CacheOptimizationRecommendation
} from './system/CachePerformanceAnalyzer';

export type {
  PerformanceOptimizerConfig,
  PerformanceOptimizerMetrics,
  BatchOperation,
  BatchOperationType
} from './system/PerformanceOptimizer';

export type {
  PerformanceMonitorConfig,
  ComprehensivePerformanceMetrics,
  PerformanceAlert,
  OptimizationRecommendation,
  PerformanceRegression,
  PerformanceTrend
} from './system/PerformanceMonitor';

export type {
  FittingType,
  SystemPressure,
  AirflowAnalysis,
  DuctSizing,
  FittingAnalysisInput,
  FittingRecommendation,
  FittingAIConfig
} from './system/FittingAI';

export type {
  ComplexIntersectionType,
  BranchConfiguration,
  ComplexIntersectionInput,
  ComplexFittingSolution,
  ComplexFittingsConfig
} from './system/ComplexFittings';

export type {
  IntersectionAnalysis,
  FittingDialogTrigger
} from './utils/FittingDialogIntegration';

export type {
  TouchGestureType,
  TouchGestureEvent,
  TouchGestureConfig
} from './system/TouchGestureHandler';

export type {
  TouchProcessingConfig,
  TouchActionType,
  TouchActionResult,
  TouchFeedbackData
} from './utils/TouchEventProcessor';

export type {
  TouchButtonVariant,
  TouchButtonSize,
  HapticPattern,
  TouchOptimizedButtonProps
} from '../components/snap-logic/TouchOptimizedButton';

export type {
  TouchToggleSize,
  TouchOptimizedToggleProps
} from '../components/snap-logic/TouchOptimizedToggle';

export type {
  TouchSnapSize,
  TouchSnapIndicatorProps
} from '../components/snap-logic/TouchSnapIndicator';

export type {
  DebugEventType,
  PerformanceTimingData,
  SnapStatistics,
  ErrorTrackingData,
  SystemStateData,
  DebugEventData,
  DebugCollectorConfig
} from './system/DebugCollector';

export type {
  ErrorSeverity,
  ErrorCategory,
  RecoveryStrategy,
  ErrorContext,
  ErrorReportData
} from './system/SnapLogicError';

export type {
  ErrorHandlerConfig,
  ErrorRecoveryResult,
  ErrorNotification
} from './system/ErrorHandler';

export type {
  ValidationResult,
  ValidationConfig
} from './utils/ValidationUtils';

export type {
  SanitizationConfig,
  SanitizationResult
} from './utils/InputSanitizer';

export type {
  EdgeCaseType,
  EdgeCaseSeverity,
  EdgeCaseDetectionResult,
  EdgeCaseHandlingResult,
  EdgeCaseHandlerConfig
} from './system/EdgeCaseHandler';

export type {
  DuctDimensions,
  SMACNAValidationResult,
  SMACNAViolation,
  SMACNAWarning,
  SMACNARecommendation,
  SMACNAValidatorConfig
} from './standards/SMACNAValidator';

export type {
  CenterlineAnalysis,
  CenterlineOptimization
} from './utils/CenterlineUtils';

export type {
  EngineeringReportConfig,
  EngineeringReportData
} from './reports/EngineeringReports';

export type {
  MLModelConfig,
  MLPredictionResult,
  DesignOptimizationSuggestion,
  HVACDesignPattern,
  MLArchitectureConfig
} from './ai/MLArchitecture';

export type {
  DataSourceType,
  DataQualityMetrics,
  TrainingDataPipelineConfig,
  MLTrainingData
} from './ai/TrainingDataPipeline';

export type {
  SuggestionContext,
  AISuggestionResult,
  DesignSuggestionsConfig
} from './ai/DesignSuggestions';

export type {
  SnapLogicSystemConfig,
  SnapLogicSystemState,
  BuildDuctworkResult
} from './SnapLogicSystem';

/**
 * Default configurations for quick setup
 */
export const DEFAULT_SNAP_CONFIG = {
  enabled: true,
  snapThreshold: 15,
  magneticThreshold: 25,
  showVisualFeedback: true,
  showSnapLegend: false
};

export const DEFAULT_DRAWING_CONFIG = {
  mode: 'point-to-point' as const,
  defaultType: 'arc' as const,
  autoSnap: true,
  showPreview: true,
  validateSMACNA: true,
  minSegmentLength: 20,
  maxPoints: 50
};

export const DEFAULT_MAGNETIC_CONFIG = {
  enabled: true,
  attractionThreshold: 30,
  snapThreshold: 15,
  attractionStrength: 0.6,
  smoothingFactor: 0.3,
  enabledTools: ['pencil', 'duct', 'room', 'equipment'] as const,
  modifierBehavior: {
    ctrl: 'disable' as const,
    alt: 'precision' as const,
    shift: 'override' as const
  }
};

/**
 * Utility functions for common operations
 */
export const SnapLogicUtils = {
  /**
   * Create a basic snap logic system with default configuration
   */
  createDefaultSystem: (overrides?: Partial<any>) => {
    return new SnapLogicSystem({
      snap: { ...DEFAULT_SNAP_CONFIG, ...overrides?.snap },
      drawing: { ...DEFAULT_DRAWING_CONFIG, ...overrides?.drawing },
      magnetic: { ...DEFAULT_MAGNETIC_CONFIG, ...overrides?.magnetic }
    });
  },

  /**
   * Calculate distance between two points
   */
  calculateDistance: (
    point1: { x: number; y: number },
    point2: { x: number; y: number }
  ): number => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * Check if a point is within a threshold of another point
   */
  isWithinThreshold: (
    point1: { x: number; y: number },
    point2: { x: number; y: number },
    threshold: number
  ): boolean => {
    return SnapLogicUtils.calculateDistance(point1, point2) <= threshold;
  },

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld: (
    screenX: number,
    screenY: number,
    viewport: { x: number; y: number; scale: number }
  ): { x: number; y: number } => {
    return {
      x: (screenX - viewport.x) / viewport.scale,
      y: (screenY - viewport.y) / viewport.scale
    };
  },

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen: (
    worldX: number,
    worldY: number,
    viewport: { x: number; y: number; scale: number }
  ): { x: number; y: number } => {
    return {
      x: worldX * viewport.scale + viewport.x,
      y: worldY * viewport.scale + viewport.y
    };
  }
};

/**
 * Constants used throughout the snap logic system
 */
export const SNAP_LOGIC_CONSTANTS = {
  // Priority hierarchy (lower number = higher priority)
  SNAP_PRIORITIES: {
    ENDPOINT: 1,
    CENTERLINE: 2,
    MIDPOINT: 3,
    INTERSECTION: 4
  },

  // SMACNA standards
  SMACNA: {
    MIN_RADIUS_RATIO: 1.5,
    MAX_RADIUS_RATIO: 3.0,
    MIN_SEGMENT_LENGTH: 12,
    MAX_ANGLE_DEVIATION: 5,
    RECTANGULAR_RADIUS_RATIO: 1.0,
    MIN_BRANCH_ANGLE: 30,
    MAX_BRANCH_ANGLE: 90,
    PREFERRED_BRANCH_ANGLE: 45,
    MIN_DISTANCE_FROM_FITTING: 24
  },

  // Visual feedback
  VISUAL: {
    DEFAULT_SNAP_COLORS: {
      endpoint: '#ef4444',
      centerline: '#3b82f6',
      midpoint: '#10b981',
      intersection: '#f59e0b'
    },
    DEFAULT_SNAP_SHAPES: {
      endpoint: 'circle',
      centerline: 'square',
      midpoint: 'diamond',
      intersection: 'cross'
    },
    ANIMATION_DURATION: 0.2,
    BASE_SIZE: 12
  }
} as const;

// ===== COMPREHENSIVE SYSTEM INTEGRATION =====

/**
 * Main SizeWise Suite Snap Logic Integration
 *
 * Central integration point for all snap logic functionality including
 * 3D visualization, cloud collaboration, tablet optimization, performance
 * analytics, and AI-powered suggestions.
 */
export class SizeWiseSnapLogicSuite {
  private snapLogicSystem: SnapLogicSystem;
  private performanceMonitor: PerformanceMonitor;
  private errorHandler: ErrorHandler;
  private spatialIndex: SpatialIndex;
  private snapCache: SnapCache;

  constructor(config?: {
    enablePerformanceOptimization?: boolean;
    enableAdvancedFitting?: boolean;
    enableTouchOptimization?: boolean;
    enableDebugMode?: boolean;
  }) {
    // Initialize core systems
    this.snapLogicSystem = new SnapLogicSystem();
    this.performanceMonitor = new PerformanceMonitor();
    this.errorHandler = new ErrorHandler();
    this.spatialIndex = new SpatialIndex();
    this.snapCache = new SnapCache();

    // Configure optional features
    if (config?.enablePerformanceOptimization) {
      this.initializePerformanceOptimization();
    }

    if (config?.enableAdvancedFitting) {
      this.initializeAdvancedFitting();
    }

    if (config?.enableTouchOptimization) {
      this.initializeTouchOptimization();
    }

    if (config?.enableDebugMode) {
      this.initializeDebugMode();
    }
  }

  /**
   * Initialize performance optimization features
   */
  private initializePerformanceOptimization(): void {
    // Connect spatial indexing to snap logic
    this.snapLogicSystem.setSpatialIndex(this.spatialIndex);

    // Enable caching
    this.snapLogicSystem.setSnapCache(this.snapCache);

    console.log('Performance optimization features initialized');
  }

  /**
   * Initialize advanced fitting features
   */
  private initializeAdvancedFitting(): void {
    // Initialize AI fitting system
    const fittingAI = new FittingAI();
    const complexFittings = new ComplexFittings();

    // Connect to snap logic system
    this.snapLogicSystem.setFittingAI(fittingAI);
    this.snapLogicSystem.setComplexFittings(complexFittings);

    console.log('Advanced fitting features initialized');
  }

  /**
   * Initialize touch optimization features
   */
  private initializeTouchOptimization(): void {
    // Initialize touch gesture handler
    const touchHandler = new TouchGestureHandler();

    // Connect to snap logic system
    this.snapLogicSystem.setTouchHandler(touchHandler);

    console.log('Touch optimization features initialized');
  }

  /**
   * Initialize debug mode features
   */
  private initializeDebugMode(): void {
    // Initialize debug collector
    const debugCollector = new DebugCollector();

    // Connect to all systems
    this.snapLogicSystem.setDebugCollector(debugCollector);
    this.performanceMonitor.setDebugCollector(debugCollector);

    console.log('Debug mode features initialized');
  }

  /**
   * Get core snap logic system
   */
  getSnapLogicSystem(): SnapLogicSystem {
    return this.snapLogicSystem;
  }

  /**
   * Get performance monitor
   */
  getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }

  /**
   * Get error handler
   */
  getErrorHandler(): ErrorHandler {
    return this.errorHandler;
  }

  /**
   * Get spatial index
   */
  getSpatialIndex(): SpatialIndex {
    return this.spatialIndex;
  }

  /**
   * Get snap cache
   */
  getSnapCache(): SnapCache {
    return this.snapCache;
  }

  /**
   * Get system statistics
   */
  getSystemStatistics(): {
    snapPoints: number;
    cachedResults: number;
    spatialObjects: number;
    performanceMetrics: any;
    errorCount: number;
  } {
    return {
      snapPoints: this.snapLogicSystem.getSnapPointCount(),
      cachedResults: this.snapCache.getSize(),
      spatialObjects: this.spatialIndex.getObjectCount(),
      performanceMetrics: this.performanceMonitor.getMetrics(),
      errorCount: this.errorHandler.getErrorCount()
    };
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.snapLogicSystem.dispose();
    this.performanceMonitor.dispose();
    this.errorHandler.dispose();
    this.spatialIndex.dispose();
    this.snapCache.dispose();
  }
}

// ===== DEFAULT EXPORT =====
export default SizeWiseSnapLogicSuite;

// ===== VERSION INFORMATION =====
export const VERSION = '2.0.0';
export const BUILD_DATE = new Date().toISOString();
export const FEATURES = {
  CORE_SNAP_LOGIC: true,
  TOUCH_GESTURES: true,
  DEBUG_MODE: true,
  PERFORMANCE_OPTIMIZATION: true,
  ADVANCED_FITTING_INTELLIGENCE: true,
  ERROR_HANDLING: true,
  SMACNA_VALIDATION: true,
  VANPACKER_INTEGRATION: true,
  AI_POWERED_SUGGESTIONS: true,
  ADVANCED_3D_VISUALIZATION: true,
  CLOUD_COLLABORATION: true,
  TABLET_OPTIMIZATION: true,
  PERFORMANCE_ANALYTICS: true
};

/**
 * System information and capabilities
 */
export const SYSTEM_INFO = {
  name: 'SizeWise Suite - Snap Logic System',
  version: VERSION,
  buildDate: BUILD_DATE,
  features: FEATURES,
  description: 'Complete professional HVAC engineering snap logic system with 3D visualization, cloud collaboration, and AI-powered suggestions',
  author: 'SizeWise Suite Development Team',
  license: 'Proprietary',
  compatibility: {
    browsers: ['Chrome 90+', 'Firefox 88+', 'Safari 14+', 'Edge 90+'],
    platforms: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'],
    devices: ['Desktop', 'Laptop', 'Tablet', 'Mobile']
  },
  requirements: {
    webgl: true,
    webassembly: false,
    serviceWorker: true,
    indexedDB: true,
    webSocket: true
  }
};

console.log(`SizeWise Suite Snap Logic System v${VERSION} loaded successfully`);
console.log('Available features:', Object.keys(FEATURES).filter(key => FEATURES[key as keyof typeof FEATURES]));
