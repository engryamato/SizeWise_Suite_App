/**
 * Error Recovery Service Implementation
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * Intelligent error handling, user guidance systems, automatic error recovery
 * mechanisms, and enhanced error reporting implementation.
 * 
 * @fileoverview Error recovery service implementation
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import {
  IErrorRecoveryService,
  IErrorPatternMatcher,
  IRecoveryStrategyExecutor,
  IUserGuidanceProvider,
  EnhancedError,
  ErrorContext,
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  RecoveryAction,
  RecoveryResult,
  ErrorPattern,
  UserGuidance,
  ErrorReport,
  RecoveryAttempt,
  UserFeedback,
  ErrorAnalytics,
  ErrorRecoveryConfig,
  ErrorBreadcrumb,
  GuidanceStep,
  HelpLink,
  ContactInfo
} from '../core/interfaces/IErrorRecoveryService';

import { ILogger } from '../core/interfaces';

/**
 * Error Pattern Matcher Implementation
 */
export class ErrorPatternMatcher implements IErrorPatternMatcher {
  private patterns: Map<string, ErrorPattern> = new Map();

  constructor(private logger: ILogger) {}

  async matchPattern(error: Error): Promise<ErrorPattern | null> {
    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || '';

    for (const pattern of this.patterns.values()) {
      let matches = false;

      if (pattern.pattern instanceof RegExp) {
        matches = pattern.pattern.test(errorMessage) || pattern.pattern.test(errorStack);
      } else {
        matches = errorMessage.includes(pattern.pattern.toLowerCase()) || 
                 errorStack.includes(pattern.pattern.toLowerCase());
      }

      if (matches) {
        this.logger.debug(`Matched error pattern: ${pattern.name}`);
        return pattern;
      }
    }

    return null;
  }

  async addPattern(pattern: ErrorPattern): Promise<void> {
    this.patterns.set(pattern.id, pattern);
    this.logger.info(`Added error pattern: ${pattern.name}`);
  }

  async removePattern(patternId: string): Promise<boolean> {
    const removed = this.patterns.delete(patternId);
    if (removed) {
      this.logger.info(`Removed error pattern: ${patternId}`);
    }
    return removed;
  }

  async getPatterns(): Promise<ErrorPattern[]> {
    return Array.from(this.patterns.values());
  }

  async updatePattern(patternId: string, updates: Partial<ErrorPattern>): Promise<void> {
    const pattern = this.patterns.get(patternId);
    if (pattern) {
      const updatedPattern = { ...pattern, ...updates };
      this.patterns.set(patternId, updatedPattern);
      this.logger.info(`Updated error pattern: ${patternId}`);
    }
  }
}

/**
 * Recovery Strategy Executor Implementation
 */
export class RecoveryStrategyExecutor implements IRecoveryStrategyExecutor {
  private strategyHandlers: Map<RecoveryStrategy, (action: RecoveryAction) => Promise<RecoveryResult>> = new Map();

  constructor(private logger: ILogger) {
    this.setupDefaultHandlers();
  }

  async executeRetry(action: RecoveryAction, maxRetries: number, delay: number): Promise<RecoveryResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.info(`Retry attempt ${attempt}/${maxRetries} for action: ${action.name}`);
        
        const result = await action.execute();
        if (result.success) {
          return {
            ...result,
            message: `Retry successful on attempt ${attempt}`,
            timestamp: new Date()
          };
        }
        
        lastError = new Error(result.message);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Retry attempt ${attempt} failed: ${lastError.message}`);
      }

      if (attempt < maxRetries) {
        await this.delay(delay * attempt); // Exponential backoff
      }
    }

    return {
      success: false,
      strategy: RecoveryStrategy.RETRY,
      message: `All ${maxRetries} retry attempts failed. Last error: ${lastError?.message}`,
      requiresUserAction: true,
      timestamp: new Date()
    };
  }

  async executeFallback(action: RecoveryAction, fallbackOptions: any[]): Promise<RecoveryResult> {
    for (let i = 0; i < fallbackOptions.length; i++) {
      try {
        this.logger.info(`Trying fallback option ${i + 1}/${fallbackOptions.length}`);
        
        // Create fallback action with modified parameters
        const fallbackAction: RecoveryAction = {
          ...action,
          parameters: { ...action.parameters, fallbackOption: fallbackOptions[i] }
        };

        const result = await fallbackAction.execute();
        if (result.success) {
          return {
            ...result,
            message: `Fallback successful with option ${i + 1}`,
            timestamp: new Date()
          };
        }
      } catch (error) {
        this.logger.warn(`Fallback option ${i + 1} failed: ${(error as Error).message}`);
      }
    }

    return {
      success: false,
      strategy: RecoveryStrategy.FALLBACK,
      message: 'All fallback options failed',
      requiresUserAction: true,
      timestamp: new Date()
    };
  }

  async executeRollback(action: RecoveryAction, checkpointId: string): Promise<RecoveryResult> {
    try {
      this.logger.info(`Executing rollback to checkpoint: ${checkpointId}`);
      
      // In real implementation, this would restore from checkpoint
      const rollbackAction: RecoveryAction = {
        ...action,
        parameters: { ...action.parameters, checkpointId }
      };

      const result = await rollbackAction.execute();
      return {
        ...result,
        message: `Rollback to checkpoint ${checkpointId} ${result.success ? 'successful' : 'failed'}`,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        strategy: RecoveryStrategy.ROLLBACK,
        message: `Rollback failed: ${(error as Error).message}`,
        requiresUserAction: true,
        timestamp: new Date()
      };
    }
  }

  async executeGracefulDegradation(action: RecoveryAction, degradationLevel: string): Promise<RecoveryResult> {
    try {
      this.logger.info(`Executing graceful degradation: ${degradationLevel}`);
      
      const degradedAction: RecoveryAction = {
        ...action,
        parameters: { ...action.parameters, degradationLevel }
      };

      const result = await degradedAction.execute();
      return {
        ...result,
        message: `Graceful degradation (${degradationLevel}) ${result.success ? 'successful' : 'failed'}`,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        strategy: RecoveryStrategy.GRACEFUL_DEGRADATION,
        message: `Graceful degradation failed: ${(error as Error).message}`,
        requiresUserAction: true,
        timestamp: new Date()
      };
    }
  }

  registerStrategyHandler(
    strategy: RecoveryStrategy,
    handler: (action: RecoveryAction) => Promise<RecoveryResult>
  ): void {
    this.strategyHandlers.set(strategy, handler);
    this.logger.info(`Registered strategy handler for: ${strategy}`);
  }

  private setupDefaultHandlers(): void {
    this.strategyHandlers.set(RecoveryStrategy.RETRY, async (action) => {
      return await this.executeRetry(action, 3, 1000);
    });

    this.strategyHandlers.set(RecoveryStrategy.FALLBACK, async (action) => {
      return await this.executeFallback(action, []);
    });

    this.strategyHandlers.set(RecoveryStrategy.ROLLBACK, async (action) => {
      return await this.executeRollback(action, 'last-known-good');
    });

    this.strategyHandlers.set(RecoveryStrategy.GRACEFUL_DEGRADATION, async (action) => {
      return await this.executeGracefulDegradation(action, 'basic');
    });

    this.strategyHandlers.set(RecoveryStrategy.IGNORE, async () => ({
      success: true,
      strategy: RecoveryStrategy.IGNORE,
      message: 'Error ignored as per strategy',
      requiresUserAction: false,
      timestamp: new Date()
    }));

    this.strategyHandlers.set(RecoveryStrategy.USER_INTERVENTION, async () => ({
      success: false,
      strategy: RecoveryStrategy.USER_INTERVENTION,
      message: 'User intervention required',
      requiresUserAction: true,
      timestamp: new Date()
    }));

    this.strategyHandlers.set(RecoveryStrategy.ESCALATE, async () => ({
      success: false,
      strategy: RecoveryStrategy.ESCALATE,
      message: 'Error escalated to support team',
      requiresUserAction: false,
      timestamp: new Date()
    }));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * User Guidance Provider Implementation
 */
export class UserGuidanceProvider implements IUserGuidanceProvider {
  private guidanceTemplates: Map<ErrorCategory, UserGuidance> = new Map();

  constructor(private logger: ILogger) {
    this.setupDefaultTemplates();
  }

  async generateGuidance(error: EnhancedError): Promise<UserGuidance> {
    const template = this.guidanceTemplates.get(error.category);
    
    if (template) {
      // Customize template based on specific error
      return {
        ...template,
        title: `${template.title}: ${error.userMessage}`,
        message: this.customizeMessage(template.message, error),
        steps: this.customizeSteps(template.steps, error)
      };
    }

    // Generate generic guidance
    return this.generateGenericGuidance(error);
  }

  async getContextualHelp(component: string, action: string): Promise<HelpLink[]> {
    // Return contextual help based on component and action
    const helpLinks: HelpLink[] = [
      {
        title: `${component} Documentation`,
        url: `/docs/${component.toLowerCase()}`,
        type: 'documentation',
        description: `Complete documentation for ${component}`
      },
      {
        title: `${action} Tutorial`,
        url: `/tutorials/${action.toLowerCase()}`,
        type: 'video',
        description: `Step-by-step tutorial for ${action}`
      },
      {
        title: 'Frequently Asked Questions',
        url: '/faq',
        type: 'faq',
        description: 'Common questions and answers'
      },
      {
        title: 'Contact Support',
        url: '/support',
        type: 'support',
        description: 'Get help from our support team'
      }
    ];

    return helpLinks;
  }

  async updateGuidanceTemplate(category: ErrorCategory, template: UserGuidance): Promise<void> {
    this.guidanceTemplates.set(category, template);
    this.logger.info(`Updated guidance template for category: ${category}`);
  }

  async getGuidanceMetrics(): Promise<{
    viewCount: number;
    completionRate: number;
    userSatisfaction: number;
    commonDropOffPoints: string[];
  }> {
    // In real implementation, this would fetch actual metrics
    return {
      viewCount: 1250,
      completionRate: 78.5,
      userSatisfaction: 4.2,
      commonDropOffPoints: ['Step 3: Verify Settings', 'Step 5: Test Connection']
    };
  }

  private setupDefaultTemplates(): void {
    // Network error guidance
    this.guidanceTemplates.set(ErrorCategory.NETWORK, {
      title: 'Network Connection Issue',
      message: 'It looks like there\'s a problem with your network connection. Let\'s try to resolve this.',
      steps: [
        {
          id: 'check-connection',
          title: 'Check Your Connection',
          description: 'Verify that your device is connected to the internet',
          isRequired: true,
          order: 1
        },
        {
          id: 'refresh-page',
          title: 'Refresh the Page',
          description: 'Try refreshing the page to re-establish the connection',
          action: 'window.location.reload()',
          isRequired: false,
          order: 2
        },
        {
          id: 'check-firewall',
          title: 'Check Firewall Settings',
          description: 'Ensure that your firewall isn\'t blocking the application',
          isRequired: false,
          order: 3
        }
      ],
      helpLinks: [
        {
          title: 'Network Troubleshooting Guide',
          url: '/docs/troubleshooting/network',
          type: 'documentation',
          description: 'Detailed guide for resolving network issues'
        }
      ],
      contactInfo: {
        email: 'support@sizewise.com',
        chatUrl: '/support/chat'
      },
      estimatedResolutionTime: 5
    });

    // Validation error guidance
    this.guidanceTemplates.set(ErrorCategory.VALIDATION, {
      title: 'Input Validation Error',
      message: 'The information you entered doesn\'t meet the required format. Please review and correct the highlighted fields.',
      steps: [
        {
          id: 'review-fields',
          title: 'Review Required Fields',
          description: 'Check all highlighted fields for errors',
          isRequired: true,
          order: 1
        },
        {
          id: 'check-format',
          title: 'Verify Format',
          description: 'Ensure all values match the expected format',
          isRequired: true,
          order: 2
        },
        {
          id: 'try-again',
          title: 'Submit Again',
          description: 'Once all fields are correct, try submitting again',
          isRequired: true,
          order: 3
        }
      ],
      helpLinks: [
        {
          title: 'Input Format Guide',
          url: '/docs/input-formats',
          type: 'documentation',
          description: 'Guide to acceptable input formats'
        }
      ],
      estimatedResolutionTime: 2
    });
  }

  private customizeMessage(template: string, error: EnhancedError): string {
    return template
      .replace('{error.message}', error.userMessage)
      .replace('{error.component}', error.context.component)
      .replace('{error.action}', error.context.action);
  }

  private customizeSteps(templateSteps: GuidanceStep[], error: EnhancedError): GuidanceStep[] {
    return templateSteps.map(step => ({
      ...step,
      description: step.description
        .replace('{error.component}', error.context.component)
        .replace('{error.action}', error.context.action)
    }));
  }

  private generateGenericGuidance(error: EnhancedError): UserGuidance {
    return {
      title: 'An Error Occurred',
      message: error.userMessage || 'Something went wrong. Please try the following steps to resolve the issue.',
      steps: [
        {
          id: 'refresh',
          title: 'Refresh the Page',
          description: 'Try refreshing the page to see if the issue resolves',
          isRequired: true,
          order: 1
        },
        {
          id: 'try-again',
          title: 'Try Again',
          description: 'Attempt the action again after a moment',
          isRequired: true,
          order: 2
        },
        {
          id: 'contact-support',
          title: 'Contact Support',
          description: 'If the issue persists, please contact our support team',
          isRequired: false,
          order: 3
        }
      ],
      helpLinks: [
        {
          title: 'General Troubleshooting',
          url: '/docs/troubleshooting',
          type: 'documentation',
          description: 'General troubleshooting guide'
        },
        {
          title: 'Contact Support',
          url: '/support',
          type: 'support',
          description: 'Get help from our support team'
        }
      ],
      contactInfo: {
        email: 'support@sizewise.com',
        chatUrl: '/support/chat'
      }
    };
  }
}

/**
 * Main Error Recovery Service Implementation
 */
export class ErrorRecoveryService implements IErrorRecoveryService {
  private config: ErrorRecoveryConfig;
  private patternMatcher: IErrorPatternMatcher;
  private strategyExecutor: IRecoveryStrategyExecutor;
  private guidanceProvider: IUserGuidanceProvider;
  private errorReports: Map<string, ErrorReport> = new Map();
  private recoveryHistory: RecoveryAttempt[] = [];
  private breadcrumbs: ErrorBreadcrumb[] = [];
  private autoRecoveryEnabled = true;

  constructor(private logger: ILogger) {
    this.patternMatcher = new ErrorPatternMatcher(logger);
    this.strategyExecutor = new RecoveryStrategyExecutor(logger);
    this.guidanceProvider = new UserGuidanceProvider(logger);
  }

  async initialize(config?: ErrorRecoveryConfig): Promise<void> {
    try {
      this.config = config || this.getDefaultConfig();
      this.autoRecoveryEnabled = this.config.enableAutoRecovery;

      // Load error patterns
      for (const pattern of this.config.patterns) {
        await this.patternMatcher.addPattern(pattern);
      }

      // Setup guidance templates
      for (const [category, template] of Object.entries(this.config.guidanceTemplates)) {
        await this.guidanceProvider.updateGuidanceTemplate(category as ErrorCategory, template);
      }

      // Setup global error handlers
      this.setupGlobalErrorHandlers();

      this.logger.info('Error recovery service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize error recovery service', error as Error);
      throw error;
    }
  }

  async handleError(error: Error, context?: Partial<ErrorContext>): Promise<RecoveryResult> {
    try {
      // Enhance error with additional information
      const enhancedError = await this.enhanceError(error, context);

      // Add to breadcrumbs
      this.addBreadcrumb({
        timestamp: new Date(),
        category: 'error',
        message: `Error occurred: ${error.message}`,
        level: 'error',
        data: { errorId: enhancedError.id }
      });

      // Report error
      const reportId = await this.reportError(enhancedError);

      // Try automatic recovery if enabled
      if (this.autoRecoveryEnabled && enhancedError.isRecoverable) {
        const recoveryActions = await this.getRecoveryActions(enhancedError);

        for (const action of recoveryActions) {
          if (!action.requiresUserConfirmation) {
            const result = await this.executeRecovery(action);

            // Record recovery attempt
            const attempt: RecoveryAttempt = {
              id: this.generateAttemptId(),
              strategy: action.strategy,
              action,
              result,
              timestamp: new Date(),
              duration: action.estimatedDuration
            };

            this.recoveryHistory.push(attempt);

            // Update error report
            const report = this.errorReports.get(reportId);
            if (report) {
              report.recoveryAttempts.push(attempt);

              if (result.success) {
                report.resolution = {
                  method: 'automatic',
                  strategy: action.strategy,
                  description: result.message,
                  timestamp: new Date(),
                  success: true
                };
                report.resolvedAt = new Date();
              }
            }

            if (result.success) {
              this.logger.info(`Automatic recovery successful: ${action.name}`);
              return result;
            }
          }
        }
      }

      // Return result indicating user action required
      return {
        success: false,
        strategy: RecoveryStrategy.USER_INTERVENTION,
        message: enhancedError.userMessage,
        requiresUserAction: true,
        timestamp: new Date(),
        data: {
          errorId: enhancedError.id,
          reportId,
          guidance: await this.getUserGuidance(enhancedError)
        }
      };

    } catch (recoveryError) {
      this.logger.error('Error during error recovery', recoveryError as Error);

      return {
        success: false,
        strategy: RecoveryStrategy.ESCALATE,
        message: 'Error recovery failed. Please contact support.',
        requiresUserAction: true,
        timestamp: new Date()
      };
    }
  }

  async enhanceError(error: Error, context?: Partial<ErrorContext>): Promise<EnhancedError> {
    const errorId = this.generateErrorId();

    // Build full context
    const fullContext: ErrorContext = {
      sessionId: this.generateSessionId(),
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      component: 'unknown',
      action: 'unknown',
      parameters: {},
      breadcrumbs: [...this.breadcrumbs],
      environment: process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development',
      version: process.env.REACT_APP_VERSION || '1.0.0',
      ...context
    };

    // Match against known patterns
    const pattern = await this.patternMatcher.matchPattern(error);

    const enhancedError: EnhancedError = {
      id: errorId,
      originalError: error,
      severity: pattern?.severity || this.determineSeverity(error),
      category: pattern?.category || this.determineCategory(error),
      context: fullContext,
      userMessage: this.generateUserMessage(error, pattern),
      technicalMessage: error.message,
      possibleCauses: this.generatePossibleCauses(error, pattern),
      suggestedActions: this.generateSuggestedActions(error, pattern),
      recoveryStrategies: pattern?.recoveryStrategies || this.getDefaultRecoveryStrategies(error),
      isRecoverable: pattern?.autoRecover ?? this.isErrorRecoverable(error),
      requiresUserAction: this.requiresUserAction(error, pattern),
      metadata: {
        pattern: pattern?.id,
        stackTrace: error.stack,
        timestamp: new Date().toISOString()
      }
    };

    this.logger.info(`Enhanced error: ${errorId} (${enhancedError.category}/${enhancedError.severity})`);
    return enhancedError;
  }

  async getRecoveryActions(error: EnhancedError): Promise<RecoveryAction[]> {
    const actions: RecoveryAction[] = [];

    for (const strategy of error.recoveryStrategies) {
      const action = await this.createRecoveryAction(error, strategy);
      if (action) {
        actions.push(action);
      }
    }

    // Sort by priority (lower number = higher priority)
    return actions.sort((a, b) => a.priority - b.priority);
  }

  async executeRecovery(action: RecoveryAction): Promise<RecoveryResult> {
    const startTime = Date.now();

    try {
      this.logger.info(`Executing recovery action: ${action.name} (${action.strategy})`);

      // Validate action if validator exists
      if (action.validate) {
        const isValid = await action.validate();
        if (!isValid) {
          return {
            success: false,
            strategy: action.strategy,
            message: 'Recovery action validation failed',
            requiresUserAction: true,
            timestamp: new Date()
          };
        }
      }

      // Execute the action
      const result = await action.execute();
      const duration = Date.now() - startTime;

      this.logger.info(`Recovery action completed in ${duration}ms: ${result.success ? 'success' : 'failed'}`);

      return {
        ...result,
        timestamp: new Date()
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Recovery action failed after ${duration}ms`, error as Error);

      return {
        success: false,
        strategy: action.strategy,
        message: `Recovery action failed: ${(error as Error).message}`,
        requiresUserAction: true,
        timestamp: new Date()
      };
    }
  }

  async getUserGuidance(error: EnhancedError): Promise<UserGuidance> {
    return await this.guidanceProvider.generateGuidance(error);
  }

  async reportError(error: EnhancedError): Promise<string> {
    const reportId = this.generateReportId();

    const report: ErrorReport = {
      id: reportId,
      error,
      recoveryAttempts: [],
      resolution: null,
      reportedAt: new Date(),
      similarErrors: await this.findSimilarErrors(error),
      impactAssessment: this.assessImpact(error)
    };

    this.errorReports.set(reportId, report);

    // Send to external reporting service if configured
    if (this.config.enableErrorReporting && this.config.reportingEndpoint) {
      try {
        await this.sendErrorReport(report);
      } catch (reportingError) {
        this.logger.warn('Failed to send error report to external service', reportingError as Error);
      }
    }

    this.logger.info(`Error reported: ${reportId}`);
    return reportId;
  }

  async getErrorReport(reportId: string): Promise<ErrorReport> {
    const report = this.errorReports.get(reportId);
    if (!report) {
      throw new Error(`Error report not found: ${reportId}`);
    }
    return report;
  }

  async registerErrorPattern(pattern: ErrorPattern): Promise<void> {
    await this.patternMatcher.addPattern(pattern);
  }

  async getErrorAnalytics(timeRange?: { start: Date; end: Date }): Promise<ErrorAnalytics> {
    const reports = Array.from(this.errorReports.values());
    const filteredReports = timeRange
      ? reports.filter(r => r.reportedAt >= timeRange.start && r.reportedAt <= timeRange.end)
      : reports;

    const totalErrors = filteredReports.length;
    const errorsByCategory = this.groupByCategory(filteredReports);
    const errorsBySeverity = this.groupBySeverity(filteredReports);
    const recoverySuccessRate = this.calculateRecoverySuccessRate(filteredReports);
    const averageResolutionTime = this.calculateAverageResolutionTime(filteredReports);

    return {
      totalErrors,
      errorsByCategory,
      errorsBySeverity,
      recoverySuccessRate,
      averageResolutionTime,
      topErrorPatterns: await this.getTopErrorPatterns(),
      userSatisfactionScore: this.calculateUserSatisfactionScore(filteredReports),
      trends: this.calculateTrends(filteredReports)
    };
  }

  async addUserFeedback(reportId: string, feedback: UserFeedback): Promise<void> {
    const report = this.errorReports.get(reportId);
    if (report) {
      report.userFeedback = feedback;
      this.logger.info(`User feedback added to report: ${reportId}`);
    }
  }

  async setAutoRecoveryEnabled(enabled: boolean): Promise<void> {
    this.autoRecoveryEnabled = enabled;
    this.logger.info(`Auto recovery ${enabled ? 'enabled' : 'disabled'}`);
  }

  async getRecoveryHistory(userId?: string): Promise<RecoveryAttempt[]> {
    if (userId) {
      // Filter by user ID if provided
      return this.recoveryHistory.filter(attempt =>
        attempt.action.parameters.userId === userId
      );
    }
    return [...this.recoveryHistory];
  }

  // Private helper methods
  private getDefaultConfig(): ErrorRecoveryConfig {
    return {
      enableAutoRecovery: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      escalationThreshold: 5,
      enableUserGuidance: true,
      enableErrorReporting: true,
      enableAnalytics: true,
      patterns: this.getDefaultErrorPatterns(),
      guidanceTemplates: this.getDefaultGuidanceTemplates(),
      contactInfo: {
        email: 'support@sizewise.com',
        chatUrl: '/support/chat'
      }
    };
  }

  private getDefaultErrorPatterns(): ErrorPattern[] {
    return [
      {
        id: 'network-timeout',
        name: 'Network Timeout',
        description: 'Request timed out due to network issues',
        pattern: /timeout|network|connection/i,
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        recoveryStrategies: [RecoveryStrategy.RETRY, RecoveryStrategy.FALLBACK],
        autoRecover: true,
        maxRetries: 3,
        retryDelay: 2000,
        escalationThreshold: 3
      },
      {
        id: 'validation-error',
        name: 'Validation Error',
        description: 'Input validation failed',
        pattern: /validation|invalid|required/i,
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.LOW,
        recoveryStrategies: [RecoveryStrategy.USER_INTERVENTION],
        autoRecover: false,
        maxRetries: 0,
        retryDelay: 0,
        escalationThreshold: 1
      },
      {
        id: 'authentication-error',
        name: 'Authentication Error',
        description: 'User authentication failed',
        pattern: /unauthorized|authentication|login/i,
        category: ErrorCategory.AUTHENTICATION,
        severity: ErrorSeverity.HIGH,
        recoveryStrategies: [RecoveryStrategy.USER_INTERVENTION],
        autoRecover: false,
        maxRetries: 0,
        retryDelay: 0,
        escalationThreshold: 1
      },
      {
        id: 'system-error',
        name: 'System Error',
        description: 'Internal system error',
        pattern: /internal|system|server/i,
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.CRITICAL,
        recoveryStrategies: [RecoveryStrategy.RETRY, RecoveryStrategy.ESCALATE],
        autoRecover: true,
        maxRetries: 2,
        retryDelay: 5000,
        escalationThreshold: 2
      }
    ];
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), {
        component: 'global',
        action: 'unhandled-promise-rejection'
      });
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        component: 'global',
        action: 'uncaught-error',
        parameters: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
  }

  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();

    if (message.includes('critical') || message.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    } else if (message.includes('warning') || message.includes('deprecated')) {
      return ErrorSeverity.LOW;
    } else if (message.includes('network') || message.includes('timeout')) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.MEDIUM;
  }

  private determineCategory(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return ErrorCategory.NETWORK;
    } else if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ErrorCategory.VALIDATION;
    } else if (message.includes('unauthorized') || message.includes('authentication')) {
      return ErrorCategory.AUTHENTICATION;
    } else if (message.includes('permission') || message.includes('forbidden')) {
      return ErrorCategory.AUTHORIZATION;
    } else if (stack.includes('accessibility') || message.includes('aria')) {
      return ErrorCategory.ACCESSIBILITY;
    }

    return ErrorCategory.SYSTEM;
  }

  private generateUserMessage(error: Error, pattern?: ErrorPattern): string {
    if (pattern) {
      switch (pattern.category) {
        case ErrorCategory.NETWORK:
          return 'There seems to be a connection issue. Please check your internet connection and try again.';
        case ErrorCategory.VALIDATION:
          return 'Please check your input and make sure all required fields are filled correctly.';
        case ErrorCategory.AUTHENTICATION:
          return 'Your session has expired. Please log in again to continue.';
        case ErrorCategory.AUTHORIZATION:
          return 'You don\'t have permission to perform this action. Please contact your administrator.';
        default:
          return 'Something went wrong. Please try again or contact support if the problem persists.';
      }
    }

    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  private generatePossibleCauses(error: Error, pattern?: ErrorPattern): string[] {
    const causes: string[] = [];

    if (pattern) {
      switch (pattern.category) {
        case ErrorCategory.NETWORK:
          causes.push('Poor internet connection', 'Server temporarily unavailable', 'Firewall blocking requests');
          break;
        case ErrorCategory.VALIDATION:
          causes.push('Missing required fields', 'Invalid data format', 'Data exceeds limits');
          break;
        case ErrorCategory.AUTHENTICATION:
          causes.push('Session expired', 'Invalid credentials', 'Account locked');
          break;
        case ErrorCategory.AUTHORIZATION:
          causes.push('Insufficient permissions', 'Account not activated', 'Feature not available for your plan');
          break;
        default:
          causes.push('System overload', 'Temporary service disruption', 'Configuration issue');
      }
    } else {
      causes.push('Unknown system error', 'Temporary service disruption');
    }

    return causes;
  }

  private generateSuggestedActions(error: Error, pattern?: ErrorPattern): string[] {
    const actions: string[] = [];

    if (pattern) {
      switch (pattern.category) {
        case ErrorCategory.NETWORK:
          actions.push('Check your internet connection', 'Try refreshing the page', 'Wait a moment and try again');
          break;
        case ErrorCategory.VALIDATION:
          actions.push('Review all form fields', 'Check data format requirements', 'Remove any special characters');
          break;
        case ErrorCategory.AUTHENTICATION:
          actions.push('Log in again', 'Clear browser cache', 'Check your credentials');
          break;
        case ErrorCategory.AUTHORIZATION:
          actions.push('Contact your administrator', 'Check your account status', 'Upgrade your plan if needed');
          break;
        default:
          actions.push('Try again later', 'Contact support', 'Check system status');
      }
    } else {
      actions.push('Refresh the page', 'Try again', 'Contact support if the problem persists');
    }

    return actions;
  }

  private getDefaultRecoveryStrategies(error: Error): RecoveryStrategy[] {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('timeout')) {
      return [RecoveryStrategy.RETRY, RecoveryStrategy.FALLBACK];
    } else if (message.includes('validation') || message.includes('invalid')) {
      return [RecoveryStrategy.USER_INTERVENTION];
    } else if (message.includes('unauthorized')) {
      return [RecoveryStrategy.USER_INTERVENTION];
    }

    return [RecoveryStrategy.RETRY, RecoveryStrategy.USER_INTERVENTION];
  }

  private isErrorRecoverable(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Non-recoverable errors
    if (message.includes('syntax') || message.includes('reference') || message.includes('type')) {
      return false;
    }

    // Recoverable errors
    if (message.includes('network') || message.includes('timeout') || message.includes('temporary')) {
      return true;
    }

    return true; // Default to recoverable
  }

  private requiresUserAction(error: Error, pattern?: ErrorPattern): boolean {
    if (pattern) {
      return pattern.recoveryStrategies.includes(RecoveryStrategy.USER_INTERVENTION);
    }

    const message = error.message.toLowerCase();
    return message.includes('validation') || message.includes('unauthorized') || message.includes('permission');
  }

  private async createRecoveryAction(error: EnhancedError, strategy: RecoveryStrategy): Promise<RecoveryAction | null> {
    const actionId = this.generateActionId();

    switch (strategy) {
      case RecoveryStrategy.RETRY:
        return {
          id: actionId,
          name: 'Retry Operation',
          description: 'Retry the failed operation',
          strategy,
          priority: 1,
          estimatedDuration: 2000,
          requiresUserConfirmation: false,
          parameters: { maxRetries: 3, delay: 1000 },
          execute: async () => {
            // In real implementation, this would retry the original operation
            return {
              success: Math.random() > 0.3, // 70% success rate simulation
              strategy,
              message: 'Retry operation completed',
              requiresUserAction: false,
              timestamp: new Date()
            };
          }
        };

      case RecoveryStrategy.FALLBACK:
        return {
          id: actionId,
          name: 'Use Fallback Method',
          description: 'Use an alternative method to complete the operation',
          strategy,
          priority: 2,
          estimatedDuration: 3000,
          requiresUserConfirmation: false,
          parameters: { fallbackMethod: 'alternative' },
          execute: async () => {
            return {
              success: Math.random() > 0.2, // 80% success rate simulation
              strategy,
              message: 'Fallback method completed',
              requiresUserAction: false,
              timestamp: new Date()
            };
          }
        };

      case RecoveryStrategy.ROLLBACK:
        return {
          id: actionId,
          name: 'Rollback Changes',
          description: 'Undo recent changes and restore previous state',
          strategy,
          priority: 3,
          estimatedDuration: 1000,
          requiresUserConfirmation: true,
          parameters: { checkpointId: 'last-known-good' },
          execute: async () => {
            return {
              success: true,
              strategy,
              message: 'Rollback completed successfully',
              requiresUserAction: false,
              timestamp: new Date()
            };
          }
        };

      case RecoveryStrategy.USER_INTERVENTION:
        return {
          id: actionId,
          name: 'User Action Required',
          description: 'Manual user intervention is required to resolve this error',
          strategy,
          priority: 4,
          estimatedDuration: 0,
          requiresUserConfirmation: true,
          parameters: {},
          execute: async () => {
            return {
              success: false,
              strategy,
              message: 'User intervention required',
              requiresUserAction: true,
              timestamp: new Date()
            };
          }
        };

      default:
        return null;
    }
  }

  private addBreadcrumb(breadcrumb: ErrorBreadcrumb): void {
    this.breadcrumbs.push(breadcrumb);

    // Keep only last 50 breadcrumbs
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs = this.breadcrumbs.slice(-50);
    }
  }

  private async findSimilarErrors(error: EnhancedError): Promise<string[]> {
    const similarErrors: string[] = [];

    for (const [reportId, report] of this.errorReports) {
      if (report.error.category === error.category &&
          report.error.severity === error.severity &&
          report.error.context.component === error.context.component) {
        similarErrors.push(reportId);
      }
    }

    return similarErrors.slice(0, 5); // Return up to 5 similar errors
  }

  private assessImpact(error: EnhancedError): any {
    return {
      affectedUsers: 1,
      affectedFeatures: [error.context.component],
      businessImpact: error.severity === ErrorSeverity.CRITICAL ? 'high' : 'low',
      dataLoss: false,
      serviceDisruption: error.category === ErrorCategory.SYSTEM
    };
  }

  private async sendErrorReport(report: ErrorReport): Promise<void> {
    if (this.config.reportingEndpoint) {
      // In real implementation, this would send to external service
      this.logger.info(`Error report sent to ${this.config.reportingEndpoint}: ${report.id}`);
    }
  }

  private groupByCategory(reports: ErrorReport[]): Record<ErrorCategory, number> {
    const grouped = {} as Record<ErrorCategory, number>;

    for (const category of Object.values(ErrorCategory)) {
      grouped[category] = 0;
    }

    for (const report of reports) {
      grouped[report.error.category]++;
    }

    return grouped;
  }

  private groupBySeverity(reports: ErrorReport[]): Record<ErrorSeverity, number> {
    const grouped = {} as Record<ErrorSeverity, number>;

    for (const severity of Object.values(ErrorSeverity)) {
      grouped[severity] = 0;
    }

    for (const report of reports) {
      grouped[report.error.severity]++;
    }

    return grouped;
  }

  private calculateRecoverySuccessRate(reports: ErrorReport[]): number {
    const resolvedReports = reports.filter(r => r.resolution?.success);
    return reports.length > 0 ? (resolvedReports.length / reports.length) * 100 : 0;
  }

  private calculateAverageResolutionTime(reports: ErrorReport[]): number {
    const resolvedReports = reports.filter(r => r.resolvedAt);

    if (resolvedReports.length === 0) return 0;

    const totalTime = resolvedReports.reduce((sum, report) => {
      const resolutionTime = report.resolvedAt!.getTime() - report.reportedAt.getTime();
      return sum + resolutionTime;
    }, 0);

    return totalTime / resolvedReports.length;
  }

  private async getTopErrorPatterns(): Promise<ErrorPattern[]> {
    return await this.patternMatcher.getPatterns();
  }

  private calculateUserSatisfactionScore(reports: ErrorReport[]): number {
    const reportsWithFeedback = reports.filter(r => r.userFeedback);

    if (reportsWithFeedback.length === 0) return 0;

    const totalRating = reportsWithFeedback.reduce((sum, report) => {
      return sum + report.userFeedback!.rating;
    }, 0);

    return totalRating / reportsWithFeedback.length;
  }

  private calculateTrends(reports: ErrorReport[]): any[] {
    // Simplified trend calculation
    return [
      {
        period: 'last_24h',
        errorCount: reports.filter(r => r.reportedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
        recoveryRate: 85,
        averageResolutionTime: 120000,
        userSatisfaction: 4.2
      }
    ];
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAttemptId(): string {
    return `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default guidance templates for all error categories
   */
  private getDefaultGuidanceTemplates(): Record<ErrorCategory, UserGuidance> {
    const defaultGuidance: UserGuidance = {
      title: 'Error Guidance',
      message: 'Please try the following steps to resolve this issue.',
      steps: [
        {
          id: 'refresh-page',
          title: 'Refresh the page',
          description: 'Try refreshing the page to see if the issue resolves.',
          action: 'refresh',
          isRequired: true,
          order: 1
        }
      ],
      helpLinks: [
        {
          title: 'Contact Support',
          url: '/support',
          type: 'support',
          description: 'Get help from our support team'
        }
      ],
      estimatedResolutionTime: 5
    };

    return {
      [ErrorCategory.SNAP_LOGIC]: { ...defaultGuidance, title: 'Snap Logic Error Guidance' },
      [ErrorCategory.PERFORMANCE]: { ...defaultGuidance, title: 'Performance Error Guidance' },
      [ErrorCategory.VALIDATION]: { ...defaultGuidance, title: 'Validation Error Guidance' },
      [ErrorCategory.CENTERLINE]: { ...defaultGuidance, title: 'Centerline Error Guidance' },
      [ErrorCategory.GEOMETRY]: { ...defaultGuidance, title: 'Geometry Error Guidance' },
      [ErrorCategory.SPATIAL_INDEX]: { ...defaultGuidance, title: 'Spatial Index Error Guidance' },
      [ErrorCategory.TOUCH_GESTURE]: { ...defaultGuidance, title: 'Touch Gesture Error Guidance' },
      [ErrorCategory.USER_INPUT]: { ...defaultGuidance, title: 'User Input Error Guidance' },
      [ErrorCategory.UI_COMPONENT]: { ...defaultGuidance, title: 'UI Component Error Guidance' },
      [ErrorCategory.CACHE]: { ...defaultGuidance, title: 'Cache Error Guidance' },
      [ErrorCategory.STORAGE]: { ...defaultGuidance, title: 'Storage Error Guidance' },
      [ErrorCategory.NETWORK]: { ...defaultGuidance, title: 'Network Error Guidance' },
      [ErrorCategory.SMACNA_VALIDATION]: { ...defaultGuidance, title: 'SMACNA Validation Error Guidance' },
      [ErrorCategory.FITTING_CALCULATION]: { ...defaultGuidance, title: 'Fitting Calculation Error Guidance' },
      [ErrorCategory.BRANCH_ANALYSIS]: { ...defaultGuidance, title: 'Branch Analysis Error Guidance' },
      [ErrorCategory.DEBUG_COLLECTION]: { ...defaultGuidance, title: 'Debug Collection Error Guidance' },
      [ErrorCategory.PERFORMANCE_MONITORING]: { ...defaultGuidance, title: 'Performance Monitoring Error Guidance' },
      [ErrorCategory.CONFIGURATION]: { ...defaultGuidance, title: 'Configuration Error Guidance' },
      [ErrorCategory.INITIALIZATION]: { ...defaultGuidance, title: 'Initialization Error Guidance' },
      [ErrorCategory.AUTHENTICATION]: { ...defaultGuidance, title: 'Authentication Error Guidance' },
      [ErrorCategory.AUTHORIZATION]: { ...defaultGuidance, title: 'Authorization Error Guidance' },
      [ErrorCategory.BUSINESS_LOGIC]: { ...defaultGuidance, title: 'Business Logic Error Guidance' },
      [ErrorCategory.SYSTEM]: { ...defaultGuidance, title: 'System Error Guidance' },
      [ErrorCategory.EXTERNAL_SERVICE]: { ...defaultGuidance, title: 'External Service Error Guidance' },
      [ErrorCategory.ACCESSIBILITY]: { ...defaultGuidance, title: 'Accessibility Error Guidance' },
      [ErrorCategory.UNKNOWN]: { ...defaultGuidance, title: 'Unknown Error Guidance' }
    };
  }
}
