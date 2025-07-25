/**
 * SuperAdminInterface - Hidden Super Administrator Interface
 * 
 * MISSION-CRITICAL: Super administrator interface with hardware key authentication
 * Hidden behind build flag and accessible only with proper authentication
 * 
 * Security Features:
 * - Build flag controlled visibility
 * - Hardware key authentication required
 * - Session-based access control
 * - Comprehensive audit logging
 * - Emergency access protocols
 * 
 * @see docs/implementation/security/super-admin-architecture.md
 */

import React, { useState, useEffect } from 'react';
import { AuthenticationManager, SuperAdminSession, HardwareKeyAuthRequest } from '../../lib/auth/AuthenticationManager';

// Local interface for emergency access
interface EmergencyAccessRequest {
  reason: string;
  contactInfo: string;
  timestamp?: string;
  requestedPermissions?: string[];
  hardwareKeyProof?: string;
}

// Build flag check - only show in development or with explicit flag
const SUPER_ADMIN_ENABLED = process.env.NODE_ENV === 'development' || 
                           process.env.REACT_APP_ENABLE_SUPER_ADMIN === 'true' ||
                           (window as any).__SIZEWISE_SUPER_ADMIN_ENABLED__;

interface SuperAdminInterfaceProps {
  authManager: AuthenticationManager;
  onClose?: () => void;
}

interface SuperAdminState {
  isAuthenticated: boolean;
  session: SuperAdminSession | null;
  isAuthenticating: boolean;
  authError: string | null;
  selectedTool: string | null;
}

/**
 * Super Administrator Interface Component
 * 
 * Provides secure access to administrative tools and emergency functions
 */
export const SuperAdminInterface: React.FC<SuperAdminInterfaceProps> = ({
  authManager,
  onClose
}) => {
  const [state, setState] = useState<SuperAdminState>({
    isAuthenticated: false,
    session: null,
    isAuthenticating: false,
    authError: null,
    selectedTool: null
  });

  const [hardwareKeyData, setHardwareKeyData] = useState({
    userId: '',
    hardwareKeyId: '',
    challenge: '',
    signature: '',
    clientData: ''
  });

  const [emergencyData, setEmergencyData] = useState({
    reason: '',
    requestedPermissions: [] as string[],
    hardwareKeyProof: '',
    contactInfo: ''
  });

  useEffect(() => {
    // Don't run effect if super admin is not enabled
    if (!SUPER_ADMIN_ENABLED) {
      return;
    }

    // Check for existing super admin session
    const existingSession = authManager.getCurrentSuperAdminSession();
    if (existingSession) {
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        session: existingSession
      }));
    }
  }, [authManager]);

  // Don't render if super admin is not enabled
  if (!SUPER_ADMIN_ENABLED) {
    return null;
  }

  // =============================================================================
  // Authentication Handlers
  // =============================================================================

  const handleHardwareKeyAuth = async () => {
    setState(prev => ({ ...prev, isAuthenticating: true, authError: null }));

    try {
      const request: HardwareKeyAuthRequest = {
        userId: hardwareKeyData.userId,
        hardwareKeyId: hardwareKeyData.hardwareKeyId,
        challenge: hardwareKeyData.challenge,
        signature: hardwareKeyData.signature,
        clientData: hardwareKeyData.clientData
      };

      const result = await authManager.authenticateSuperAdmin(request);

      if (result.success && result.superAdminSession) {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          session: result.superAdminSession || null,
          isAuthenticating: false,
          authError: null
        }));
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticating: false,
          authError: result.error || 'Authentication failed'
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        authError: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  };

  const handleEmergencyAccess = async () => {
    setState(prev => ({ ...prev, isAuthenticating: true, authError: null }));

    try {
      const request: EmergencyAccessRequest = {
        reason: emergencyData.reason,
        requestedPermissions: emergencyData.requestedPermissions,
        hardwareKeyProof: emergencyData.hardwareKeyProof,
        contactInfo: emergencyData.contactInfo
      };

      const result = await authManager.requestEmergencyAccess(request);

      if (result.success && result.superAdminSession) {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          session: result.superAdminSession || null,
          isAuthenticating: false,
          authError: null
        }));
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticating: false,
          authError: result.error || 'Emergency access denied'
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        authError: `Emergency access error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  };

  const handleLogout = async () => {
    await authManager.revokeSuperAdminSession('Manual logout');
    setState({
      isAuthenticated: false,
      session: null,
      isAuthenticating: false,
      authError: null,
      selectedTool: null
    });
  };

  const renderAuthenticationForm = () => (
    <div className="super-admin-auth">
      <div className="auth-header">
        <h2>🔒 Super Administrator Access</h2>
        <p>Hardware key authentication required</p>
      </div>

      {state.authError && (
        <div className="auth-error">
          <span>❌ {state.authError}</span>
        </div>
      )}

      <div className="auth-tabs">
        <button 
          className="tab-button active"
          onClick={() => setState(prev => ({ ...prev, selectedTool: 'hardware-key' }))}
        >
          Hardware Key
        </button>
        <button 
          className="tab-button"
          onClick={() => setState(prev => ({ ...prev, selectedTool: 'emergency' }))}
        >
          Emergency Access
        </button>
      </div>

      {(!state.selectedTool || state.selectedTool === 'hardware-key') && (
        <div className="hardware-key-form">
          <h3>Hardware Key Authentication</h3>
          <div className="form-group">
            <label>User ID:</label>
            <input
              type="text"
              value={hardwareKeyData.userId}
              onChange={(e) => setHardwareKeyData(prev => ({ ...prev, userId: e.target.value }))}
              placeholder="Enter admin user ID"
            />
          </div>
          <div className="form-group">
            <label>Hardware Key ID:</label>
            <input
              type="text"
              value={hardwareKeyData.hardwareKeyId}
              onChange={(e) => setHardwareKeyData(prev => ({ ...prev, hardwareKeyId: e.target.value }))}
              placeholder="Enter hardware key ID"
            />
          </div>
          <div className="form-group">
            <label>Challenge:</label>
            <input
              type="text"
              value={hardwareKeyData.challenge}
              onChange={(e) => setHardwareKeyData(prev => ({ ...prev, challenge: e.target.value }))}
              placeholder="Enter challenge data"
            />
          </div>
          <div className="form-group">
            <label>Signature:</label>
            <input
              type="text"
              value={hardwareKeyData.signature}
              onChange={(e) => setHardwareKeyData(prev => ({ ...prev, signature: e.target.value }))}
              placeholder="Enter signature"
            />
          </div>
          <div className="form-group">
            <label>Client Data:</label>
            <input
              type="text"
              value={hardwareKeyData.clientData}
              onChange={(e) => setHardwareKeyData(prev => ({ ...prev, clientData: e.target.value }))}
              placeholder="Enter client data"
            />
          </div>
          <button
            className="auth-button"
            onClick={handleHardwareKeyAuth}
            disabled={state.isAuthenticating || !hardwareKeyData.userId || !hardwareKeyData.hardwareKeyId}
          >
            {state.isAuthenticating ? 'Authenticating...' : 'Authenticate with Hardware Key'}
          </button>
        </div>
      )}

      {state.selectedTool === 'emergency' && (
        <div className="emergency-form">
          <h3>Emergency Access Request</h3>
          <div className="form-group">
            <label>Emergency Reason:</label>
            <textarea
              value={emergencyData.reason}
              onChange={(e) => setEmergencyData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Detailed reason for emergency access (minimum 10 characters)"
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Requested Permissions:</label>
            <div className="permission-checkboxes">
              {['user_recovery', 'emergency_unlock', 'license_reset', 'database_repair'].map(permission => (
                <label key={permission} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={emergencyData.requestedPermissions.includes(permission)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEmergencyData(prev => ({
                          ...prev,
                          requestedPermissions: [...prev.requestedPermissions, permission]
                        }));
                      } else {
                        setEmergencyData(prev => ({
                          ...prev,
                          requestedPermissions: prev.requestedPermissions.filter(p => p !== permission)
                        }));
                      }
                    }}
                  />
                  {permission.replace('_', ' ').toUpperCase()}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Hardware Key Proof:</label>
            <input
              type="text"
              value={emergencyData.hardwareKeyProof}
              onChange={(e) => setEmergencyData(prev => ({ ...prev, hardwareKeyProof: e.target.value }))}
              placeholder="Enter hardware key proof (base64)"
            />
          </div>
          <div className="form-group">
            <label>Contact Information:</label>
            <input
              type="email"
              value={emergencyData.contactInfo}
              onChange={(e) => setEmergencyData(prev => ({ ...prev, contactInfo: e.target.value }))}
              placeholder="Enter contact email"
            />
          </div>
          <button
            className="emergency-button"
            onClick={handleEmergencyAccess}
            disabled={state.isAuthenticating || !emergencyData.reason || !emergencyData.contactInfo}
          >
            {state.isAuthenticating ? 'Requesting...' : 'Request Emergency Access'}
          </button>
        </div>
      )}

      {onClose && (
        <button className="close-button" onClick={onClose}>
          Close
        </button>
      )}
    </div>
  );

  const renderSuperAdminTools = () => (
    <div className="super-admin-tools">
      <div className="tools-header">
        <h2>🛠️ Super Administrator Tools</h2>
        <div className="session-info">
          <span>Session: {state.session?.superAdminSessionId}</span>
          <span>User: {state.session?.userId}</span>
          <span>Emergency: {state.session?.emergencyAccess ? 'Yes' : 'No'}</span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="tools-grid">
        <div className="tool-category">
          <h3>User Management</h3>
          <button 
            className="tool-button"
            onClick={() => setState(prev => ({ ...prev, selectedTool: 'user-recovery' }))}
            disabled={!authManager.hasSuperAdminPermission('user_recovery')}
          >
            User Recovery
          </button>
          <button 
            className="tool-button"
            onClick={() => setState(prev => ({ ...prev, selectedTool: 'license-reset' }))}
            disabled={!authManager.hasSuperAdminPermission('license_reset')}
          >
            License Reset
          </button>
          <button 
            className="tool-button"
            onClick={() => setState(prev => ({ ...prev, selectedTool: 'emergency-unlock' }))}
            disabled={!authManager.hasSuperAdminPermission('emergency_unlock')}
          >
            Emergency Unlock
          </button>
        </div>

        <div className="tool-category">
          <h3>System Management</h3>
          <button 
            className="tool-button"
            onClick={() => setState(prev => ({ ...prev, selectedTool: 'database-repair' }))}
            disabled={!authManager.hasSuperAdminPermission('database_repair')}
          >
            Database Repair
          </button>
          <button 
            className="tool-button"
            onClick={() => setState(prev => ({ ...prev, selectedTool: 'system-recovery' }))}
            disabled={!authManager.hasSuperAdminPermission('system_recovery')}
          >
            System Recovery
          </button>
        </div>

        <div className="tool-category">
          <h3>Monitoring</h3>
          <button 
            className="tool-button"
            onClick={() => setState(prev => ({ ...prev, selectedTool: 'audit-trail' }))}
          >
            Audit Trail
          </button>
          <button 
            className="tool-button"
            onClick={() => setState(prev => ({ ...prev, selectedTool: 'security-stats' }))}
          >
            Security Statistics
          </button>
        </div>
      </div>

      {state.selectedTool && (
        <div className="tool-content">
          {/* Tool-specific content would be rendered here */}
          <div className="tool-placeholder">
            <h4>Tool: {state.selectedTool}</h4>
            <p>Tool implementation would be here</p>
            <button onClick={() => setState(prev => ({ ...prev, selectedTool: null }))}>
              Close Tool
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="super-admin-interface">
      {!state.isAuthenticated ? renderAuthenticationForm() : renderSuperAdminTools()}
    </div>
  );
};
