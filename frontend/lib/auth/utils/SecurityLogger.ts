/**
 * Security Logger for Authentication Events
 * 
 * Centralized security event logging and audit trail management
 * for the SizeWise Suite authentication system.
 */

import { SecurityEvent, AuditLogEntry, AuthErrorCode } from '../types/AuthTypes';

export class SecurityLogger {
  private static instance: SecurityLogger;
  private auditLog: AuditLogEntry[] = [];
  private securityEvents: SecurityEvent[] = [];
  private readonly maxLogEntries = 10000;
  private readonly maxEventEntries = 5000;

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(
    eventType: string, 
    details: Record<string, any> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    try {
      const event: SecurityEvent = {
        eventType,
        timestamp: Date.now(),
        userId: details.userId,
        sessionId: details.sessionId,
        ipAddress: details.ipAddress || this.getClientIP(),
        userAgent: details.userAgent || this.getUserAgent(),
        details,
        severity
      };

      // Add to in-memory log
      this.securityEvents.push(event);

      // Maintain log size limit
      if (this.securityEvents.length > this.maxEventEntries) {
        this.securityEvents = this.securityEvents.slice(-this.maxEventEntries);
      }

      // In production, send to external logging service
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        this.sendToExternalLogger(event);
      }

      // Console logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SECURITY] ${eventType}:`, details);
      }

      // Critical events should trigger immediate alerts
      if (severity === 'critical') {
        this.triggerSecurityAlert(event);
      }

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Log an audit trail entry
   */
  async logAuditEntry(
    userId: string,
    action: string,
    resource: string,
    details: Record<string, any> = {},
    success: boolean = true
  ): Promise<void> {
    try {
      const entry: AuditLogEntry = {
        id: this.generateAuditId(),
        timestamp: Date.now(),
        userId,
        action,
        resource,
        details,
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent(),
        success
      };

      // Add to in-memory log
      this.auditLog.push(entry);

      // Maintain log size limit
      if (this.auditLog.length > this.maxLogEntries) {
        this.auditLog = this.auditLog.slice(-this.maxLogEntries);
      }

      // In production, send to audit service
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        this.sendToAuditService(entry);
      }

    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  /**
   * Log authentication attempt
   */
  async logAuthenticationAttempt(
    email: string,
    success: boolean,
    method: string,
    errorCode?: AuthErrorCode,
    details: Record<string, any> = {}
  ): Promise<void> {
    const eventType = success ? 'authentication_success' : 'authentication_failed';
    const severity = success ? 'low' : 'medium';

    await this.logSecurityEvent(eventType, {
      email,
      method,
      errorCode,
      ...details
    }, severity);

    if (success) {
      await this.logAuditEntry(
        details.userId || 'unknown',
        'authenticate',
        'user_session',
        { email, method },
        true
      );
    }
  }

  /**
   * Log session activity
   */
  async logSessionActivity(
    sessionId: string,
    userId: string,
    activity: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logSecurityEvent('session_activity', {
      sessionId,
      userId,
      activity,
      ...details
    }, 'low');
  }

  /**
   * Log permission check
   */
  async logPermissionCheck(
    userId: string,
    permission: string,
    resource: string,
    granted: boolean,
    details: Record<string, any> = {}
  ): Promise<void> {
    const eventType = granted ? 'permission_granted' : 'permission_denied';
    const severity = granted ? 'low' : 'medium';

    await this.logSecurityEvent(eventType, {
      userId,
      permission,
      resource,
      ...details
    }, severity);

    await this.logAuditEntry(
      userId,
      'check_permission',
      resource,
      { permission, granted },
      granted
    );
  }

  /**
   * Log super admin activity
   */
  async logSuperAdminActivity(
    userId: string,
    action: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logSecurityEvent('super_admin_activity', {
      userId,
      action,
      ...details
    }, 'high');

    await this.logAuditEntry(
      userId,
      action,
      'super_admin',
      details,
      true
    );
  }

  /**
   * Get recent security events
   */
  getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }

  /**
   * Get audit trail
   */
  getAuditTrail(limit: number = 100): AuditLogEntry[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Get security statistics
   */
  getSecurityStatistics(): Record<string, any> {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const last7Days = now - (7 * 24 * 60 * 60 * 1000);

    const recent24h = this.securityEvents.filter(e => e.timestamp > last24Hours);
    const recent7d = this.securityEvents.filter(e => e.timestamp > last7Days);

    return {
      totalEvents: this.securityEvents.length,
      totalAuditEntries: this.auditLog.length,
      events24h: recent24h.length,
      events7d: recent7d.length,
      criticalEvents24h: recent24h.filter(e => e.severity === 'critical').length,
      highSeverityEvents24h: recent24h.filter(e => e.severity === 'high').length,
      authenticationFailures24h: recent24h.filter(e => e.eventType === 'authentication_failed').length,
      permissionDenials24h: recent24h.filter(e => e.eventType === 'permission_denied').length,
      lastEvent: this.securityEvents[this.securityEvents.length - 1]?.timestamp || null
    };
  }

  /**
   * Clear old logs (for maintenance)
   */
  clearOldLogs(olderThanDays: number = 30): void {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    this.securityEvents = this.securityEvents.filter(e => e.timestamp > cutoffTime);
    this.auditLog = this.auditLog.filter(e => e.timestamp > cutoffTime);
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIP(): string {
    // In a real application, this would get the actual client IP
    return '127.0.0.1';
  }

  private getUserAgent(): string {
    if (typeof window !== 'undefined' && window.navigator) {
      return window.navigator.userAgent;
    }
    return 'Unknown';
  }

  private async sendToExternalLogger(event: SecurityEvent): Promise<void> {
    try {
      // In production, send to external logging service like Sentry, LogRocket, etc.
      // For now, just store locally
      if (typeof window !== 'undefined' && window.localStorage) {
        const existingLogs = JSON.parse(localStorage.getItem('security_events') || '[]');
        existingLogs.push(event);
        localStorage.setItem('security_events', JSON.stringify(existingLogs.slice(-1000)));
      }
    } catch (error) {
      console.error('Failed to send to external logger:', error);
    }
  }

  private async sendToAuditService(entry: AuditLogEntry): Promise<void> {
    try {
      // In production, send to audit service
      // For now, just store locally
      if (typeof window !== 'undefined' && window.localStorage) {
        const existingAudit = JSON.parse(localStorage.getItem('audit_log') || '[]');
        existingAudit.push(entry);
        localStorage.setItem('audit_log', JSON.stringify(existingAudit.slice(-1000)));
      }
    } catch (error) {
      console.error('Failed to send to audit service:', error);
    }
  }

  private triggerSecurityAlert(event: SecurityEvent): void {
    // In production, this would trigger immediate alerts
    console.warn('CRITICAL SECURITY EVENT:', event);
    
    // Could integrate with alerting services like PagerDuty, Slack, etc.
    if (typeof window !== 'undefined') {
      // Store critical events separately for immediate attention
      const criticalEvents = JSON.parse(localStorage.getItem('critical_security_events') || '[]');
      criticalEvents.push(event);
      localStorage.setItem('critical_security_events', JSON.stringify(criticalEvents.slice(-100)));
    }
  }
}
