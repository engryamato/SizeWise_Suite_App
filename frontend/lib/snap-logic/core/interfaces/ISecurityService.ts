/**
 * Security Service Interfaces
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * Additional security layers, input validation enhancements, security audit
 * capabilities, and threat detection systems for snap logic services.
 * 
 * @fileoverview Security service interfaces
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

/**
 * Security threat levels
 */
export enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Security event types
 */
export enum SecurityEventType {
  AUTHENTICATION_FAILURE = 'authentication_failure',
  AUTHORIZATION_VIOLATION = 'authorization_violation',
  INPUT_VALIDATION_FAILURE = 'input_validation_failure',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_ACCESS_VIOLATION = 'data_access_violation',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  MALICIOUS_INPUT_DETECTED = 'malicious_input_detected',
  PRIVILEGE_ESCALATION_ATTEMPT = 'privilege_escalation_attempt',
  SESSION_HIJACKING_ATTEMPT = 'session_hijacking_attempt',
  CSRF_ATTACK_DETECTED = 'csrf_attack_detected',
  XSS_ATTEMPT_DETECTED = 'xss_attempt_detected',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt'
}

/**
 * Validation rule types
 */
export enum ValidationRuleType {
  REQUIRED = 'required',
  TYPE = 'type',
  LENGTH = 'length',
  PATTERN = 'pattern',
  RANGE = 'range',
  CUSTOM = 'custom',
  SANITIZATION = 'sanitization',
  WHITELIST = 'whitelist',
  BLACKLIST = 'blacklist'
}

/**
 * Security audit result severity
 */
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Security event
 */
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  threatLevel: ThreatLevel;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  action: string;
  details: Record<string, any>;
  blocked: boolean;
  mitigationActions: string[];
}

/**
 * Validation rule
 */
export interface ValidationRule {
  id: string;
  name: string;
  type: ValidationRuleType;
  field: string;
  required: boolean;
  parameters: Record<string, any>;
  errorMessage: string;
  sanitize: boolean;
  validate: (value: any) => ValidationResult;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  sanitizedValue?: any;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  value: any;
  severity: 'error' | 'warning';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string;
  rule: string;
  message: string;
  suggestion: string;
}

/**
 * Security audit finding
 */
export interface SecurityAuditFinding {
  id: string;
  category: string;
  severity: AuditSeverity;
  title: string;
  description: string;
  location: string;
  evidence: any;
  recommendation: string;
  cweId?: string;
  cvssScore?: number;
  remediation: RemediationStep[];
}

/**
 * Remediation step
 */
export interface RemediationStep {
  id: string;
  title: string;
  description: string;
  priority: number;
  estimatedEffort: string;
  automated: boolean;
  execute?: () => Promise<boolean>;
}

/**
 * Security audit report
 */
export interface SecurityAuditReport {
  id: string;
  timestamp: Date;
  scope: string[];
  findings: SecurityAuditFinding[];
  summary: AuditSummary;
  recommendations: string[];
  complianceStatus: ComplianceStatus;
}

/**
 * Audit summary
 */
export interface AuditSummary {
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  overallRiskScore: number;
  complianceScore: number;
}

/**
 * Compliance status
 */
export interface ComplianceStatus {
  framework: string;
  version: string;
  compliant: boolean;
  score: number;
  requirements: ComplianceRequirement[];
}

/**
 * Compliance requirement
 */
export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence: string[];
  gaps: string[];
}

/**
 * Threat detection rule
 */
export interface ThreatDetectionRule {
  id: string;
  name: string;
  description: string;
  eventTypes: SecurityEventType[];
  conditions: ThreatCondition[];
  threshold: number;
  timeWindow: number; // minutes
  severity: ThreatLevel;
  enabled: boolean;
  actions: ThreatMitigationAction[];
}

/**
 * Threat condition
 */
export interface ThreatCondition {
  field: string;
  operator: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than';
  value: any;
  caseSensitive?: boolean;
}

/**
 * Threat mitigation action
 */
export interface ThreatMitigationAction {
  type: 'block_user' | 'block_ip' | 'require_mfa' | 'log_event' | 'alert_admin' | 'rate_limit';
  parameters: Record<string, any>;
  duration?: number; // minutes
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  enableThreatDetection: boolean;
  enableInputValidation: boolean;
  enableSecurityAuditing: boolean;
  enableRateLimiting: boolean;
  validationRules: ValidationRule[];
  threatDetectionRules: ThreatDetectionRule[];
  rateLimits: RateLimit[];
  auditSettings: AuditSettings;
  encryptionSettings: EncryptionSettings;
  sessionSettings: SessionSettings;
}

/**
 * Rate limit configuration
 */
export interface RateLimit {
  id: string;
  name: string;
  resource: string;
  limit: number;
  window: number; // seconds
  scope: 'user' | 'ip' | 'global';
  enabled: boolean;
  actions: string[];
}

/**
 * Audit settings
 */
export interface AuditSettings {
  enableEventLogging: boolean;
  logLevel: 'debug' | 'info' | 'warning' | 'error';
  retentionPeriod: number; // days
  auditFrequency: number; // hours
  complianceFrameworks: string[];
}

/**
 * Encryption settings
 */
export interface EncryptionSettings {
  algorithm: string;
  keySize: number;
  enableDataEncryption: boolean;
  enableTransportEncryption: boolean;
  keyRotationInterval: number; // days
}

/**
 * Session settings
 */
export interface SessionSettings {
  timeout: number; // minutes
  enableSecureCookies: boolean;
  enableHttpOnly: boolean;
  enableSameSite: boolean;
  enableSessionRotation: boolean;
  maxConcurrentSessions: number;
}

/**
 * Main Security Service interface
 */
export interface ISecurityService {
  /**
   * Initialize security service
   */
  initialize(config?: SecurityConfig): Promise<void>;

  /**
   * Validate input data
   */
  validateInput(data: any, rules: ValidationRule[]): Promise<ValidationResult>;

  /**
   * Sanitize input data
   */
  sanitizeInput(data: any, rules: ValidationRule[]): Promise<any>;

  /**
   * Detect security threats
   */
  detectThreats(event: Partial<SecurityEvent>): Promise<SecurityEvent[]>;

  /**
   * Log security event
   */
  logSecurityEvent(event: SecurityEvent): Promise<void>;

  /**
   * Run security audit
   */
  runSecurityAudit(scope?: string[]): Promise<SecurityAuditReport>;

  /**
   * Get security events
   */
  getSecurityEvents(
    filters?: {
      type?: SecurityEventType;
      threatLevel?: ThreatLevel;
      timeRange?: { start: Date; end: Date };
      userId?: string;
    }
  ): Promise<SecurityEvent[]>;

  /**
   * Block user or IP
   */
  blockEntity(type: 'user' | 'ip', identifier: string, duration?: number): Promise<void>;

  /**
   * Unblock user or IP
   */
  unblockEntity(type: 'user' | 'ip', identifier: string): Promise<void>;

  /**
   * Check if entity is blocked
   */
  isBlocked(type: 'user' | 'ip', identifier: string): Promise<boolean>;

  /**
   * Encrypt sensitive data
   */
  encryptData(data: string): Promise<string>;

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData: string): Promise<string>;

  /**
   * Generate secure token
   */
  generateSecureToken(length?: number): Promise<string>;

  /**
   * Validate session
   */
  validateSession(sessionId: string): Promise<boolean>;

  /**
   * Check rate limits
   */
  checkRateLimit(resource: string, identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
  }>;

  /**
   * Get security metrics
   */
  getSecurityMetrics(): Promise<SecurityMetrics>;
}

/**
 * Input validator interface
 */
export interface IInputValidator {
  /**
   * Add validation rule
   */
  addRule(rule: ValidationRule): void;

  /**
   * Remove validation rule
   */
  removeRule(ruleId: string): boolean;

  /**
   * Validate data against rules
   */
  validate(data: any, ruleIds?: string[]): Promise<ValidationResult>;

  /**
   * Sanitize data
   */
  sanitize(data: any, ruleIds?: string[]): Promise<any>;

  /**
   * Get validation rules
   */
  getRules(): ValidationRule[];
}

/**
 * Threat detector interface
 */
export interface IThreatDetector {
  /**
   * Add threat detection rule
   */
  addRule(rule: ThreatDetectionRule): void;

  /**
   * Remove threat detection rule
   */
  removeRule(ruleId: string): boolean;

  /**
   * Analyze event for threats
   */
  analyzeEvent(event: SecurityEvent): Promise<ThreatDetectionRule[]>;

  /**
   * Get detection rules
   */
  getRules(): ThreatDetectionRule[];

  /**
   * Update rule
   */
  updateRule(ruleId: string, updates: Partial<ThreatDetectionRule>): void;
}

/**
 * Security auditor interface
 */
export interface ISecurityAuditor {
  /**
   * Run comprehensive security audit
   */
  runAudit(scope: string[]): Promise<SecurityAuditReport>;

  /**
   * Check specific security control
   */
  checkControl(controlId: string): Promise<SecurityAuditFinding[]>;

  /**
   * Validate compliance
   */
  validateCompliance(framework: string): Promise<ComplianceStatus>;

  /**
   * Get audit history
   */
  getAuditHistory(): Promise<SecurityAuditReport[]>;
}

/**
 * Security metrics
 */
export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsByThreatLevel: Record<ThreatLevel, number>;
  blockedEntities: {
    users: number;
    ips: number;
  };
  validationFailures: number;
  threatDetections: number;
  averageResponseTime: number;
  securityScore: number;
  trends: SecurityTrend[];
}

/**
 * Security trend data
 */
export interface SecurityTrend {
  period: string;
  eventCount: number;
  threatLevel: ThreatLevel;
  blockedCount: number;
  validationFailures: number;
}
