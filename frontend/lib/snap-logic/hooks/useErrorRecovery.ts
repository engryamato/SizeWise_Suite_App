/**
 * Error Recovery React Hook
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * React hook for intelligent error handling, user guidance systems,
 * automatic error recovery mechanisms, and enhanced error reporting.
 * 
 * @fileoverview Error recovery React hook
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import {
  IErrorRecoveryService,
  EnhancedError,
  ErrorContext,
  RecoveryAction,
  RecoveryResult,
  UserGuidance,
  ErrorReport,
  ErrorAnalytics,
  UserFeedback,
  ErrorRecoveryConfig,
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy
} from '../core/interfaces/IErrorRecoveryService';

/**
 * Error recovery context interface
 */
interface ErrorRecoveryContextValue {
  errorRecoveryService: IErrorRecoveryService;
}

/**
 * Error recovery context
 */
const ErrorRecoveryContext = createContext<ErrorRecoveryContextValue | null>(null);

/**
 * Error recovery provider component
 */
export const ErrorRecoveryProvider: React.FC<{
  children: React.ReactNode;
  errorRecoveryService: IErrorRecoveryService;
  config?: ErrorRecoveryConfig;
}> = ({ children, errorRecoveryService, config }) => {
  useEffect(() => {
    errorRecoveryService.initialize(config);
  }, [errorRecoveryService, config]);

  return (
    <ErrorRecoveryContext.Provider value={{ errorRecoveryService }}>
      {children}
    </ErrorRecoveryContext.Provider>
  );
};

/**
 * Hook return type
 */
export interface UseErrorRecoveryReturn {
  // Service access
  service: IErrorRecoveryService;

  // Error handling
  handleError: (error: Error, context?: Partial<ErrorContext>) => Promise<RecoveryResult>;
  enhanceError: (error: Error, context?: Partial<ErrorContext>) => Promise<EnhancedError>;

  // Recovery actions
  getRecoveryActions: (error: EnhancedError) => Promise<RecoveryAction[]>;
  executeRecovery: (action: RecoveryAction) => Promise<RecoveryResult>;

  // User guidance
  getUserGuidance: (error: EnhancedError) => Promise<UserGuidance>;

  // Error reporting
  reportError: (error: EnhancedError) => Promise<string>;
  getErrorReport: (reportId: string) => Promise<ErrorReport>;
  addUserFeedback: (reportId: string, feedback: UserFeedback) => Promise<void>;

  // Analytics
  getErrorAnalytics: () => Promise<ErrorAnalytics>;

  // Settings
  autoRecoveryEnabled: boolean;
  setAutoRecoveryEnabled: (enabled: boolean) => Promise<void>;

  // Current error state
  currentError: EnhancedError | null;
  currentGuidance: UserGuidance | null;
  recoveryActions: RecoveryAction[];
  isRecovering: boolean;

  // State
  isLoading: boolean;
  error: string | null;
}

/**
 * Main useErrorRecovery hook
 */
export const useErrorRecovery = (): UseErrorRecoveryReturn => {
  const context = useContext(ErrorRecoveryContext);
  
  if (!context) {
    throw new Error('useErrorRecovery must be used within an ErrorRecoveryProvider');
  }

  const { errorRecoveryService } = context;

  // State management
  const [currentError, setCurrentError] = useState<EnhancedError | null>(null);
  const [currentGuidance, setCurrentGuidance] = useState<UserGuidance | null>(null);
  const [recoveryActions, setRecoveryActions] = useState<RecoveryAction[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);
  const [autoRecoveryEnabled, setAutoRecoveryEnabledState] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Error handling
  const handleError = useCallback(async (
    error: Error,
    context?: Partial<ErrorContext>
  ): Promise<RecoveryResult> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await errorRecoveryService.handleError(error, context);
      
      if (result.data?.errorId) {
        // Get enhanced error details
        const enhancedError = await errorRecoveryService.enhanceError(error, context);
        setCurrentError(enhancedError);

        // Get user guidance
        const guidance = await errorRecoveryService.getUserGuidance(enhancedError);
        setCurrentGuidance(guidance);

        // Get recovery actions
        const actions = await errorRecoveryService.getRecoveryActions(enhancedError);
        setRecoveryActions(actions);
      }

      return result;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [errorRecoveryService]);

  const enhanceError = useCallback(async (
    error: Error,
    context?: Partial<ErrorContext>
  ): Promise<EnhancedError> => {
    try {
      return await errorRecoveryService.enhanceError(error, context);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [errorRecoveryService]);

  // Recovery actions
  const getRecoveryActions = useCallback(async (error: EnhancedError): Promise<RecoveryAction[]> => {
    try {
      const actions = await errorRecoveryService.getRecoveryActions(error);
      setRecoveryActions(actions);
      return actions;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [errorRecoveryService]);

  const executeRecovery = useCallback(async (action: RecoveryAction): Promise<RecoveryResult> => {
    try {
      setIsRecovering(true);
      const result = await errorRecoveryService.executeRecovery(action);
      
      if (result.success) {
        // Clear current error state on successful recovery
        setCurrentError(null);
        setCurrentGuidance(null);
        setRecoveryActions([]);
      }
      
      return result;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsRecovering(false);
    }
  }, [errorRecoveryService]);

  // User guidance
  const getUserGuidance = useCallback(async (error: EnhancedError): Promise<UserGuidance> => {
    try {
      const guidance = await errorRecoveryService.getUserGuidance(error);
      setCurrentGuidance(guidance);
      return guidance;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [errorRecoveryService]);

  // Error reporting
  const reportError = useCallback(async (error: EnhancedError): Promise<string> => {
    try {
      return await errorRecoveryService.reportError(error);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [errorRecoveryService]);

  const getErrorReport = useCallback(async (reportId: string): Promise<ErrorReport> => {
    try {
      return await errorRecoveryService.getErrorReport(reportId);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [errorRecoveryService]);

  const addUserFeedback = useCallback(async (
    reportId: string,
    feedback: UserFeedback
  ): Promise<void> => {
    try {
      await errorRecoveryService.addUserFeedback(reportId, feedback);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [errorRecoveryService]);

  // Analytics
  const getErrorAnalytics = useCallback(async (): Promise<ErrorAnalytics> => {
    try {
      return await errorRecoveryService.getErrorAnalytics();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [errorRecoveryService]);

  // Settings
  const setAutoRecoveryEnabled = useCallback(async (enabled: boolean): Promise<void> => {
    try {
      await errorRecoveryService.setAutoRecoveryEnabled(enabled);
      setAutoRecoveryEnabledState(enabled);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [errorRecoveryService]);

  return {
    // Service access
    service: errorRecoveryService,

    // Error handling
    handleError,
    enhanceError,

    // Recovery actions
    getRecoveryActions,
    executeRecovery,

    // User guidance
    getUserGuidance,

    // Error reporting
    reportError,
    getErrorReport,
    addUserFeedback,

    // Analytics
    getErrorAnalytics,

    // Settings
    autoRecoveryEnabled,
    setAutoRecoveryEnabled,

    // Current error state
    currentError,
    currentGuidance,
    recoveryActions,
    isRecovering,

    // State
    isLoading,
    error
  };
};

/**
 * Hook for automatic error boundary
 */
export const useErrorBoundary = () => {
  const { handleError } = useErrorRecovery();

  const captureError = useCallback((error: Error, errorInfo?: any) => {
    handleError(error, {
      component: errorInfo?.componentStack || 'unknown',
      action: 'component-error',
      parameters: errorInfo
    });
  }, [handleError]);

  return { captureError };
};

/**
 * Hook for error analytics
 */
export const useErrorAnalytics = () => {
  const { getErrorAnalytics } = useErrorRecovery();
  const [analytics, setAnalytics] = useState<ErrorAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getErrorAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load error analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getErrorAnalytics]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    isLoading,
    refresh: loadAnalytics
  };
};

/**
 * Hook for user feedback
 */
export const useErrorFeedback = () => {
  const { addUserFeedback } = useErrorRecovery();

  const submitFeedback = useCallback(async (
    reportId: string,
    rating: 1 | 2 | 3 | 4 | 5,
    helpful: boolean,
    comments?: string,
    suggestedImprovements?: string
  ) => {
    const feedback: UserFeedback = {
      rating,
      helpful,
      comments,
      suggestedImprovements,
      timestamp: new Date()
    };

    await addUserFeedback(reportId, feedback);
  }, [addUserFeedback]);

  return { submitFeedback };
};
