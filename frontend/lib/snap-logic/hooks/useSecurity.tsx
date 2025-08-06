/**
 * Security React Hook
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * React hook for additional security layers, input validation enhancements,
 * security audit capabilities, and threat detection systems.
 * 
 * @fileoverview Security React hook
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import {
  ISecurityService,
  SecurityEvent,
  SecurityEventType,
  ThreatLevel,
  ValidationRule,
  ValidationResult,
  SecurityAuditReport,
  SecurityMetrics,
  SecurityConfig
} from '../core/interfaces/ISecurityService';

/**
 * Security context interface
 */
interface SecurityContextValue {
  securityService: ISecurityService;
}

/**
 * Security context
 */
const SecurityContext = createContext<SecurityContextValue | null>(null);

/**
 * Security provider component
 */
export const SecurityProvider: React.FC<{
  children: React.ReactNode;
  securityService: ISecurityService;
  config?: SecurityConfig;
}> = ({ children, securityService, config }) => {
  useEffect(() => {
    securityService.initialize(config);
  }, [securityService, config]);

  return (
    <SecurityContext.Provider value={{ securityService }}>
      {children}
    </SecurityContext.Provider>
  );
};

/**
 * Hook return type
 */
export interface UseSecurityReturn {
  // Service access
  service: ISecurityService;

  // Input validation
  validateInput: (data: any, rules: ValidationRule[]) => Promise<ValidationResult>;
  sanitizeInput: (data: any, rules: ValidationRule[]) => Promise<any>;

  // Threat detection
  detectThreats: (event: Partial<SecurityEvent>) => Promise<SecurityEvent[]>;
  logSecurityEvent: (event: SecurityEvent) => Promise<void>;

  // Security auditing
  runSecurityAudit: (scope?: string[]) => Promise<SecurityAuditReport>;
  getSecurityEvents: (filters?: any) => Promise<SecurityEvent[]>;

  // Entity blocking
  blockEntity: (type: 'user' | 'ip', identifier: string, duration?: number) => Promise<void>;
  unblockEntity: (type: 'user' | 'ip', identifier: string) => Promise<void>;
  isBlocked: (type: 'user' | 'ip', identifier: string) => Promise<boolean>;

  // Encryption
  encryptData: (data: string) => Promise<string>;
  decryptData: (encryptedData: string) => Promise<string>;
  generateSecureToken: (length?: number) => Promise<string>;

  // Session management
  validateSession: (sessionId: string) => Promise<boolean>;

  // Rate limiting
  checkRateLimit: (resource: string, identifier: string) => Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
  }>;

  // Metrics
  getSecurityMetrics: () => Promise<SecurityMetrics>;

  // Current state
  securityEvents: SecurityEvent[];
  auditReports: SecurityAuditReport[];
  metrics: SecurityMetrics | null;

  // State
  isLoading: boolean;
  error: string | null;
}

/**
 * Main useSecurity hook
 */
export const useSecurity = (): UseSecurityReturn => {
  const context = useContext(SecurityContext);
  
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }

  const { securityService } = context;

  // State management
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [auditReports, setAuditReports] = useState<SecurityAuditReport[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadSecurityData();
  }, []);

  // Setup periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refreshMetrics();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const [eventsData, metricsData] = await Promise.all([
        securityService.getSecurityEvents(),
        securityService.getSecurityMetrics()
      ]);

      setSecurityEvents(eventsData);
      setMetrics(metricsData);

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMetrics = async (): Promise<void> => {
    try {
      const metricsData = await securityService.getSecurityMetrics();
      setMetrics(metricsData);
    } catch (err) {
      console.warn('Failed to refresh security metrics:', err);
    }
  };

  // Input validation
  const validateInput = useCallback(async (
    data: any,
    rules: ValidationRule[]
  ): Promise<ValidationResult> => {
    try {
      return await securityService.validateInput(data, rules);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [securityService]);

  const sanitizeInput = useCallback(async (
    data: any,
    rules: ValidationRule[]
  ): Promise<any> => {
    try {
      return await securityService.sanitizeInput(data, rules);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [securityService]);

  // Threat detection
  const detectThreats = useCallback(async (
    event: Partial<SecurityEvent>
  ): Promise<SecurityEvent[]> => {
    try {
      const threats = await securityService.detectThreats(event);
      
      // Update security events
      const updatedEvents = await securityService.getSecurityEvents();
      setSecurityEvents(updatedEvents);
      
      return threats;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [securityService]);

  const logSecurityEvent = useCallback(async (event: SecurityEvent): Promise<void> => {
    try {
      await securityService.logSecurityEvent(event);
      
      // Update security events
      const updatedEvents = await securityService.getSecurityEvents();
      setSecurityEvents(updatedEvents);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [securityService]);

  // Security auditing
  const runSecurityAudit = useCallback(async (scope?: string[]): Promise<SecurityAuditReport> => {
    try {
      setIsLoading(true);
      const report = await securityService.runSecurityAudit(scope);
      setAuditReports(prev => [...prev, report]);
      return report;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [securityService]);

  const getSecurityEvents = useCallback(async (filters?: any): Promise<SecurityEvent[]> => {
    try {
      const events = await securityService.getSecurityEvents(filters);
      setSecurityEvents(events);
      return events;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [securityService]);

  // Entity blocking
  const blockEntity = useCallback(async (
    type: 'user' | 'ip',
    identifier: string,
    duration?: number
  ): Promise<void> => {
    try {
      await securityService.blockEntity(type, identifier, duration);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [securityService]);

  const unblockEntity = useCallback(async (
    type: 'user' | 'ip',
    identifier: string
  ): Promise<void> => {
    try {
      await securityService.unblockEntity(type, identifier);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [securityService]);

  const isBlocked = useCallback(async (
    type: 'user' | 'ip',
    identifier: string
  ): Promise<boolean> => {
    try {
      return await securityService.isBlocked(type, identifier);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [securityService]);

  // Encryption
  const encryptData = useCallback(async (data: string): Promise<string> => {
    try {
      return await securityService.encryptData(data);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [securityService]);

  const decryptData = useCallback(async (encryptedData: string): Promise<string> => {
    try {
      return await securityService.decryptData(encryptedData);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [securityService]);

  const generateSecureToken = useCallback(async (length?: number): Promise<string> => {
    try {
      return await securityService.generateSecureToken(length);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [securityService]);

  // Session management
  const validateSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      return await securityService.validateSession(sessionId);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [securityService]);

  // Rate limiting
  const checkRateLimit = useCallback(async (
    resource: string,
    identifier: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> => {
    try {
      return await securityService.checkRateLimit(resource, identifier);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [securityService]);

  // Metrics
  const getSecurityMetrics = useCallback(async (): Promise<SecurityMetrics> => {
    try {
      const metricsData = await securityService.getSecurityMetrics();
      setMetrics(metricsData);
      return metricsData;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [securityService]);

  return {
    // Service access
    service: securityService,

    // Input validation
    validateInput,
    sanitizeInput,

    // Threat detection
    detectThreats,
    logSecurityEvent,

    // Security auditing
    runSecurityAudit,
    getSecurityEvents,

    // Entity blocking
    blockEntity,
    unblockEntity,
    isBlocked,

    // Encryption
    encryptData,
    decryptData,
    generateSecureToken,

    // Session management
    validateSession,

    // Rate limiting
    checkRateLimit,

    // Metrics
    getSecurityMetrics,

    // Current state
    securityEvents,
    auditReports,
    metrics,

    // State
    isLoading,
    error
  };
};

/**
 * Hook for input validation with automatic sanitization
 */
export const useInputValidation = (rules: ValidationRule[]) => {
  const { validateInput, sanitizeInput } = useSecurity();

  const validateAndSanitize = useCallback(async (data: any) => {
    const validation = await validateInput(data, rules);
    
    if (validation.isValid) {
      const sanitized = await sanitizeInput(data, rules);
      return { ...validation, sanitizedValue: sanitized };
    }
    
    return validation;
  }, [validateInput, sanitizeInput, rules]);

  return { validateAndSanitize };
};

/**
 * Hook for security monitoring
 */
export const useSecurityMonitoring = () => {
  const { getSecurityMetrics, getSecurityEvents } = useSecurity();
  const [realtimeMetrics, setRealtimeMetrics] = useState<SecurityMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);

  const refreshData = useCallback(async () => {
    try {
      const [metrics, events] = await Promise.all([
        getSecurityMetrics(),
        getSecurityEvents({
          timeRange: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            end: new Date()
          }
        })
      ]);

      setRealtimeMetrics(metrics);
      setRecentEvents(events);
    } catch (error) {
      console.error('Failed to refresh security monitoring data:', error);
    }
  }, [getSecurityMetrics, getSecurityEvents]);

  useEffect(() => {
    refreshData();
    
    const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [refreshData]);

  return {
    metrics: realtimeMetrics,
    recentEvents,
    refresh: refreshData
  };
};
