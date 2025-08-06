/**
 * Error Recovery Service Interfaces
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * Intelligent error handling, user guidance systems, automatic error recovery
 * mechanisms, and enhanced error reporting for snap logic services.
 * 
 * @fileoverview Error recovery service interfaces
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  USER_INPUT = 'user_input',
  EXTERNAL_SERVICE = 'external_service',
  PERFORMANCE = 'performance',
  ACCESSIBILITY = 'accessibility'
}

/**
 * Recovery strategy types
 */
export enum RecoveryStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  ROLLBACK = 'rollback',
  IGNORE = 'ignore',
  USER_INTERVENTION = 'user_intervention',
  ESCALATE = 'escalate',
  GRACEFUL_DEGRADATION = 'graceful_degradation'
}

/**
 * Error context information
 */
export interface ErrorContext {
  userId?: string;
  sessionId: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  component: string;
  action: string;
  parameters: Record<string, any>;
  stackTrace?: string;
  breadcrumbs: ErrorBreadcrumb[];
  environment: 'development' | 'staging' | 'production';
  version: string;
}

/**
 * Error breadcrumb for tracking user actions
 */
export interface ErrorBreadcrumb {
  timestamp: Date;
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

/**
 * Enhanced error information
 */
export interface EnhancedError {
  id: string;
  originalError: Error;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  userMessage: string;
  technicalMessage: string;
  possibleCauses: string[];
  suggestedActions: string[];
  recoveryStrategies: RecoveryStrategy[];
  isRecoverable: boolean;
  requiresUserAction: boolean;
  metadata: Record<string, any>;
}

/**
 * Recovery action definition
 */
export interface RecoveryAction {
  id: string;
  name: string;
  description: string;
  strategy: RecoveryStrategy;
  priority: number;
  estimatedDuration: number; // milliseconds
  requiresUserConfirmation: boolean;
  parameters: Record<string, any>;
  execute: () => Promise<RecoveryResult>;
  validate?: () => Promise<boolean>;
}

/**
 * Recovery result
 */
export interface RecoveryResult {
  success: boolean;
  strategy: RecoveryStrategy;
  message: string;
  data?: any;
  nextActions?: RecoveryAction[];
  requiresUserAction: boolean;
  timestamp: Date;
}

/**
 * Error pattern for automatic detection
 */
export interface ErrorPattern {
  id: string;
  name: string;
  description: string;
  pattern: RegExp | string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoveryStrategies: RecoveryStrategy[];
  autoRecover: boolean;
  maxRetries: number;
  retryDelay: number;
  escalationThreshold: number;
}

/**
 * User guidance configuration
 */
export interface UserGuidance {
  title: string;
  message: string;
  steps: GuidanceStep[];
  helpLinks: HelpLink[];
  contactInfo?: ContactInfo;
  estimatedResolutionTime?: number;
}

/**
 * Guidance step
 */
export interface GuidanceStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  isRequired: boolean;
  order: number;
  validationRule?: string;
}

/**
 * Help link
 */
export interface HelpLink {
  title: string;
  url: string;
  type: 'documentation' | 'video' | 'faq' | 'support';
  description: string;
}

/**
 * Contact information
 */
export interface ContactInfo {
  email?: string;
  phone?: string;
  chatUrl?: string;
  supportTicketUrl?: string;
}

/**
 * Error report
 */
export interface ErrorReport {
  id: string;
  error: EnhancedError;
  recoveryAttempts: RecoveryAttempt[];
  resolution: ErrorResolution | null;
  reportedAt: Date;
  resolvedAt?: Date;
  userFeedback?: UserFeedback;
  similarErrors: string[];
  impactAssessment: ImpactAssessment;
}

/**
 * Recovery attempt
 */
export interface RecoveryAttempt {
  id: string;
  strategy: RecoveryStrategy;
  action: RecoveryAction;
  result: RecoveryResult;
  timestamp: Date;
  duration: number;
}

/**
 * Error resolution
 */
export interface ErrorResolution {
  method: 'automatic' | 'user_action' | 'manual_intervention';
  strategy: RecoveryStrategy;
  description: string;
  timestamp: Date;
  success: boolean;
}

/**
 * User feedback on error handling
 */
export interface UserFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  helpful: boolean;
  comments?: string;
  suggestedImprovements?: string;
  timestamp: Date;
}

/**
 * Impact assessment
 */
export interface ImpactAssessment {
  affectedUsers: number;
  affectedFeatures: string[];
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  dataLoss: boolean;
  serviceDisruption: boolean;
  estimatedCost?: number;
}

/**
 * Error analytics data
 */
export interface ErrorAnalytics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  recoverySuccessRate: number;
  averageResolutionTime: number;
  topErrorPatterns: ErrorPattern[];
  userSatisfactionScore: number;
  trends: ErrorTrend[];
}

/**
 * Error trend data
 */
export interface ErrorTrend {
  period: string;
  errorCount: number;
  recoveryRate: number;
  averageResolutionTime: number;
  userSatisfaction: number;
}

/**
 * Main Error Recovery Service interface
 */
export interface IErrorRecoveryService {
  /**
   * Initialize error recovery service
   */
  initialize(config?: ErrorRecoveryConfig): Promise<void>;

  /**
   * Handle error with automatic recovery
   */
  handleError(error: Error, context?: Partial<ErrorContext>): Promise<RecoveryResult>;

  /**
   * Enhance error with additional information
   */
  enhanceError(error: Error, context?: Partial<ErrorContext>): Promise<EnhancedError>;

  /**
   * Get recovery actions for error
   */
  getRecoveryActions(error: EnhancedError): Promise<RecoveryAction[]>;

  /**
   * Execute recovery action
   */
  executeRecovery(action: RecoveryAction): Promise<RecoveryResult>;

  /**
   * Get user guidance for error
   */
  getUserGuidance(error: EnhancedError): Promise<UserGuidance>;

  /**
   * Report error
   */
  reportError(error: EnhancedError): Promise<string>;

  /**
   * Get error report
   */
  getErrorReport(reportId: string): Promise<ErrorReport>;

  /**
   * Register error pattern
   */
  registerErrorPattern(pattern: ErrorPattern): Promise<void>;

  /**
   * Get error analytics
   */
  getErrorAnalytics(timeRange?: { start: Date; end: Date }): Promise<ErrorAnalytics>;

  /**
   * Add user feedback
   */
  addUserFeedback(reportId: string, feedback: UserFeedback): Promise<void>;

  /**
   * Enable/disable automatic recovery
   */
  setAutoRecoveryEnabled(enabled: boolean): Promise<void>;

  /**
   * Get recovery history
   */
  getRecoveryHistory(userId?: string): Promise<RecoveryAttempt[]>;
}

/**
 * Error pattern matcher interface
 */
export interface IErrorPatternMatcher {
  /**
   * Match error against known patterns
   */
  matchPattern(error: Error): Promise<ErrorPattern | null>;

  /**
   * Add error pattern
   */
  addPattern(pattern: ErrorPattern): Promise<void>;

  /**
   * Remove error pattern
   */
  removePattern(patternId: string): Promise<boolean>;

  /**
   * Get all patterns
   */
  getPatterns(): Promise<ErrorPattern[]>;

  /**
   * Update pattern
   */
  updatePattern(patternId: string, updates: Partial<ErrorPattern>): Promise<void>;
}

/**
 * Recovery strategy executor interface
 */
export interface IRecoveryStrategyExecutor {
  /**
   * Execute retry strategy
   */
  executeRetry(action: RecoveryAction, maxRetries: number, delay: number): Promise<RecoveryResult>;

  /**
   * Execute fallback strategy
   */
  executeFallback(action: RecoveryAction, fallbackOptions: any[]): Promise<RecoveryResult>;

  /**
   * Execute rollback strategy
   */
  executeRollback(action: RecoveryAction, checkpointId: string): Promise<RecoveryResult>;

  /**
   * Execute graceful degradation
   */
  executeGracefulDegradation(action: RecoveryAction, degradationLevel: string): Promise<RecoveryResult>;

  /**
   * Register strategy handler
   */
  registerStrategyHandler(strategy: RecoveryStrategy, handler: (action: RecoveryAction) => Promise<RecoveryResult>): void;
}

/**
 * User guidance provider interface
 */
export interface IUserGuidanceProvider {
  /**
   * Generate guidance for error
   */
  generateGuidance(error: EnhancedError): Promise<UserGuidance>;

  /**
   * Get contextual help
   */
  getContextualHelp(component: string, action: string): Promise<HelpLink[]>;

  /**
   * Update guidance templates
   */
  updateGuidanceTemplate(category: ErrorCategory, template: UserGuidance): Promise<void>;

  /**
   * Get guidance effectiveness metrics
   */
  getGuidanceMetrics(): Promise<{
    viewCount: number;
    completionRate: number;
    userSatisfaction: number;
    commonDropOffPoints: string[];
  }>;
}

/**
 * Error recovery configuration
 */
export interface ErrorRecoveryConfig {
  enableAutoRecovery: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
  escalationThreshold: number;
  enableUserGuidance: boolean;
  enableErrorReporting: boolean;
  enableAnalytics: boolean;
  reportingEndpoint?: string;
  patterns: ErrorPattern[];
  guidanceTemplates: Record<ErrorCategory, UserGuidance>;
  contactInfo: ContactInfo;
}

/**
 * Error recovery metrics
 */
export interface ErrorRecoveryMetrics {
  totalErrorsHandled: number;
  automaticRecoveryRate: number;
  userGuidanceEffectiveness: number;
  averageResolutionTime: number;
  userSatisfactionScore: number;
  topErrorCategories: Array<{ category: ErrorCategory; count: number; recoveryRate: number }>;
  recoveryStrategiesEffectiveness: Array<{ strategy: RecoveryStrategy; successRate: number; averageTime: number }>;
}
