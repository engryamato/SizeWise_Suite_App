/**
 * SizeWise Suite - Refactored Snap Logic System
 * Clean Architecture Export Module
 * 
 * Comprehensive export module for the refactored SizeWise Suite snap logic system
 * following clean architecture principles with dependency injection, interface
 * abstractions, and modular design for enterprise-grade maintainability.
 * 
 * @fileoverview Refactored snap logic system exports
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

// ===== CORE INTERFACES =====
export type {
  // Service Interfaces
  ISnapDetectionService,
  IDrawingService,
  IConfigurationService,
  IDependencyContainer,
  IEventBus,
  IService,
  ILogger,
  IHealthCheck,
  ICache,
  IRepository,
  IFactory,
  IDisposable,
  IConfigurable,
  IObservable,

  // Data Interfaces
  ISnapPoint,
  ISnapResult,
  ISnapDetectionConfig,
  ISpatialQueryOptions,
  IDrawingConfig,
  IDrawingContext,
  IDrawingOperationResult,
  IDrawingValidationResult,
  IConfigurationSchema,
  IConfigurationValidationResult,
  IConfigurationChangeEvent,
  IServiceRegistrationOptions,
  IServiceDescriptor,
  IResolutionContext,
  IResolutionResult,
  IBaseEvent,
  IEvent,
  IEventSubscription,
  IEventPublicationOptions,
  IEventPublicationResult,

  // Performance and Monitoring
  ISnapDetectionMetrics,
  ISnapDetectionPerformanceMonitor,
  IDrawingMetrics,
  IDrawingPerformanceMonitor,
  IPerformanceMetrics,
  HealthCheckResult,

  // Event Handlers
  SnapDetectionEventHandler,
  DrawingEventHandler,
  ConfigurationEventHandler,
  ContainerEventHandler,
  EventHandler,
  SafeEventHandler
} from './core/interfaces';

export {
  // Enums
  SnapPointType,
  SnapPriority,
  DrawingToolType,
  DrawingMode,
  DrawingState,
  ConfigurationEnvironment,
  ValidationSeverity,
  ServiceLifetime,
  ServiceStatus,
  EventPriority,
  EventDeliveryMode,
  SnapDetectionEventType,
  DrawingEventType,
  ConfigurationEventType,
  ContainerEventType
} from './core/interfaces';

// ===== INFRASTRUCTURE SERVICES =====
export { DependencyContainer, ContainerBuilder, ContainerFactory } from './infrastructure/DependencyContainer';
export { ConfigurationService } from './infrastructure/ConfigurationService';

// ===== CORE SERVICES =====
export { SnapDetectionService } from './services/SnapDetectionService';
export { DrawingService } from './services/DrawingService';

// ===== APPLICATION LAYER =====
export { 
  SnapLogicApplication, 
  SnapLogicApplicationFactory,
  type ISnapLogicApplicationConfig 
} from './application/SnapLogicApplication';

// ===== LEGACY COMPATIBILITY LAYER =====
// Export legacy components for backward compatibility during migration
export { SnapLogicManager } from './SnapLogicManager';
export { SnapLogicSystem } from './SnapLogicSystem';
export { CenterlineDrawingManager } from './CenterlineDrawingManager';
export { MidSpanBranchingManager } from './MidSpanBranchingManager';
export { MagneticSnappingIntegration } from './MagneticSnappingIntegration';

// Legacy UI Components
export { SnapVisualFeedback } from '../../components/snap-logic/SnapVisualFeedback';
export { SnapLogicCanvas } from '../../components/snap-logic/SnapLogicCanvas';
export { SnapLogicDrawingTools } from '../../components/snap-logic/SnapLogicDrawingTools';
export { DebugOverlay } from '../../components/snap-logic/DebugOverlay';

// Legacy Performance Components
export { SpatialIndex } from './system/SpatialIndex';
export { SnapCache } from './system/SnapCache';
export { PerformanceOptimizer } from './system/PerformanceOptimizer';
export { PerformanceMonitor } from './system/PerformanceMonitor';

// Legacy AI Components
export { FittingAI } from './system/FittingAI';
export { ComplexFittings } from './system/ComplexFittings';
export { MLArchitecture } from './ai/MLArchitecture';
export { TrainingDataPipeline } from './ai/TrainingDataPipeline';
export { DesignSuggestions } from './ai/DesignSuggestions';

// Legacy Standards and Validation
export { SMACNAValidator } from './standards/SMACNAValidator';
export { EngineeringReports } from './reports/EngineeringReports';

// Legacy Export Integration
export { VanPackerExporter } from './export/VanPackerExporter';

// Legacy 3D Visualization (if needed)
export { Renderer3D } from './3d/3DRenderer';
export { Scene3D } from './3d/Scene3D';
export { Camera3D } from './3d/Camera3D';
export { MeshGenerator } from './3d/MeshGenerator';
export { Tools3D } from './3d/3DTools';
export { SnapLogic3DIntegration } from './3d/SnapLogic3DIntegration';

// Legacy Cloud Integration (if needed)
export { CollaborationManager } from './cloud/CollaborationManager';

// ===== MIGRATION UTILITIES =====

/**
 * Migration helper to convert legacy SnapLogicSystem to new architecture
 */
export class SnapLogicMigrationHelper {
  /**
   * Create new application from legacy configuration
   */
  static migrateFromLegacy(legacyConfig?: any): SnapLogicApplication {
    // Convert legacy configuration to new format
    const newConfig: Partial<ISnapLogicApplicationConfig> = {
      enableSnapDetection: true,
      enableDrawing: true,
      enablePerformanceMonitoring: legacyConfig?.enablePerformanceMonitoring ?? true,
      enableDebugMode: legacyConfig?.debugMode ?? false,
      logLevel: legacyConfig?.logLevel ?? 'info'
    };

    return SnapLogicApplicationFactory.createWithConfig(newConfig);
  }

  /**
   * Get migration status and recommendations
   */
  static getMigrationStatus(): {
    isLegacyInUse: boolean;
    recommendations: string[];
    migrationSteps: string[];
  } {
    return {
      isLegacyInUse: true, // Would check actual usage
      recommendations: [
        'Migrate to new SnapLogicApplication for better maintainability',
        'Use dependency injection for loose coupling',
        'Implement proper error handling with new interfaces',
        'Utilize configuration service for centralized settings'
      ],
      migrationSteps: [
        '1. Replace SnapLogicSystem with SnapLogicApplication',
        '2. Configure dependency injection container',
        '3. Migrate to interface-based service usage',
        '4. Update event handling to use new event bus',
        '5. Implement proper configuration management',
        '6. Add comprehensive error handling',
        '7. Set up performance monitoring',
        '8. Remove legacy dependencies'
      ]
    };
  }
}

/**
 * Facade for easy migration from legacy to new architecture
 */
export class SnapLogicFacade {
  private application: SnapLogicApplication;
  private initialized = false;

  constructor(config?: Partial<ISnapLogicApplicationConfig>) {
    this.application = SnapLogicApplicationFactory.createWithConfig(config || {});
  }

  /**
   * Initialize the snap logic system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.application.initialize();
    await this.application.start();
    this.initialized = true;
  }

  /**
   * Get snap detection service (replaces legacy SnapLogicManager)
   */
  getSnapDetection(): ISnapDetectionService {
    this.ensureInitialized();
    return this.application.getSnapDetectionService();
  }

  /**
   * Get drawing service (replaces legacy CenterlineDrawingManager)
   */
  getDrawing(): IDrawingService {
    this.ensureInitialized();
    return this.application.getDrawingService();
  }

  /**
   * Get configuration service
   */
  getConfiguration(): IConfigurationService {
    this.ensureInitialized();
    return this.application.getConfigurationService();
  }

  /**
   * Get event bus for inter-service communication
   */
  getEventBus(): IEventBus {
    this.ensureInitialized();
    return this.application.getEventBus();
  }

  /**
   * Get application health status
   */
  async getHealthStatus(): Promise<HealthCheckResult> {
    this.ensureInitialized();
    return await this.application.getHealthCheck().check();
  }

  /**
   * Get application statistics
   */
  getStatistics(): any {
    this.ensureInitialized();
    return this.application.getStatistics();
  }

  /**
   * Dispose of all resources
   */
  async dispose(): Promise<void> {
    if (this.initialized) {
      await this.application.dispose();
      this.initialized = false;
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('SnapLogicFacade must be initialized before use. Call initialize() first.');
    }
  }
}

// ===== MAIN INTEGRATION CLASS (REFACTORED) =====

/**
 * Main SizeWise Suite Snap Logic Integration (Refactored)
 * 
 * Refactored integration point using clean architecture principles,
 * dependency injection, and modular design for enterprise-grade
 * maintainability and testability.
 */
export class SizeWiseSnapLogicSuite {
  private facade: SnapLogicFacade;

  constructor(config?: Partial<ISnapLogicApplicationConfig>) {
    this.facade = new SnapLogicFacade(config);
  }

  /**
   * Initialize the complete snap logic suite
   */
  async initialize(): Promise<void> {
    await this.facade.initialize();
  }

  /**
   * Get snap detection functionality
   */
  getSnapDetection(): ISnapDetectionService {
    return this.facade.getSnapDetection();
  }

  /**
   * Get drawing functionality
   */
  getDrawing(): IDrawingService {
    return this.facade.getDrawing();
  }

  /**
   * Get configuration management
   */
  getConfiguration(): IConfigurationService {
    return this.facade.getConfiguration();
  }

  /**
   * Get event bus for communication
   */
  getEventBus(): IEventBus {
    return this.facade.getEventBus();
  }

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<HealthCheckResult> {
    return await this.facade.getHealthStatus();
  }

  /**
   * Get system statistics
   */
  getStatistics(): any {
    return this.facade.getStatistics();
  }

  /**
   * Dispose of all resources
   */
  async dispose(): Promise<void> {
    await this.facade.dispose();
  }
}

// ===== DEFAULT EXPORT =====
export default SizeWiseSnapLogicSuite;

// ===== VERSION INFORMATION =====
export const VERSION = '2.0.0-refactored';
export const BUILD_DATE = new Date().toISOString();
export const ARCHITECTURE = 'clean-architecture';

export const REFACTORED_FEATURES = {
  DEPENDENCY_INJECTION: true,
  INTERFACE_ABSTRACTIONS: true,
  SINGLE_RESPONSIBILITY: true,
  CONFIGURATION_MANAGEMENT: true,
  EVENT_DRIVEN_ARCHITECTURE: true,
  PERFORMANCE_MONITORING: true,
  HEALTH_CHECKS: true,
  COMPREHENSIVE_LOGGING: true,
  ERROR_HANDLING: true,
  TESTABILITY: true,
  MAINTAINABILITY: true,
  SCALABILITY: true
};

/**
 * Refactored system information and capabilities
 */
export const REFACTORED_SYSTEM_INFO = {
  name: 'SizeWise Suite - Refactored Snap Logic System',
  version: VERSION,
  architecture: ARCHITECTURE,
  buildDate: BUILD_DATE,
  features: REFACTORED_FEATURES,
  description: 'Enterprise-grade snap logic system with clean architecture, dependency injection, and modular design',
  author: 'SizeWise Suite Development Team',
  license: 'Proprietary',
  principles: [
    'Single Responsibility Principle',
    'Open/Closed Principle',
    'Liskov Substitution Principle',
    'Interface Segregation Principle',
    'Dependency Inversion Principle',
    'Don\'t Repeat Yourself',
    'Keep It Simple, Stupid',
    'You Aren\'t Gonna Need It'
  ],
  benefits: [
    'Improved maintainability through modular design',
    'Enhanced testability with dependency injection',
    'Better scalability with loose coupling',
    'Easier debugging with comprehensive logging',
    'Robust error handling and recovery',
    'Performance monitoring and optimization',
    'Configuration management and validation',
    'Health checks and system monitoring'
  ]
};

console.log(`SizeWise Suite Refactored Snap Logic System v${VERSION} loaded successfully`);
console.log('Architecture:', ARCHITECTURE);
console.log('Refactored features:', Object.keys(REFACTORED_FEATURES).filter(key => REFACTORED_FEATURES[key as keyof typeof REFACTORED_FEATURES]));
