/**
 * SuperAdminTools - Individual Super Administrator Tools
 * 
 * MISSION-CRITICAL: Individual tools for super administrator operations
 * Each tool integrates with repository and authentication systems
 * 
 * Security Features:
 * - Permission-based access control
 * - Comprehensive audit logging
 * - Confirmation dialogs for destructive actions
 * - Real-time validation and feedback
 * 
 * @see docs/implementation/security/super-admin-architecture.md
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthenticationManager } from '../../lib/auth/AuthenticationManager';
import { UserRepository, SuperAdminUserInfo, SuperAdminUserFilters } from '../../lib/repositories/interfaces/UserRepository';
import { FeatureFlagRepository, FeatureFlagStats } from '../../lib/repositories/interfaces/FeatureFlagRepository';

interface SuperAdminToolsProps {
  authManager: AuthenticationManager;
  userRepository: UserRepository;
  featureFlagRepository: FeatureFlagRepository;
  tool: string;
  onClose: () => void;
}

interface ToolState {
  loading: boolean;
  error: string | null;
  success: string | null;
  data: any;
}

/**
 * User Recovery Tool
 */
export const UserRecoveryTool: React.FC<SuperAdminToolsProps> = ({
  authManager,
  userRepository,
  tool,
  onClose
}) => {
  const [state, setState] = useState<ToolState>({ loading: false, error: null, success: null, data: null });
  const [userId, setUserId] = useState('');
  const [newTier, setNewTier] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [reason, setReason] = useState('');
  const [users, setUsers] = useState<SuperAdminUserInfo[]>([]);

  const loadUsers = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const session = authManager.getCurrentSuperAdminSession();
      if (!session) {
        throw new Error('No super admin session');
      }

      const allUsers = await userRepository.superAdminGetAllUsers(session.superAdminSessionId, {
        accountStatus: 'locked'
      });

      setUsers(allUsers);
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  }, [authManager, userRepository]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleUserRecovery = async () => {
    if (!userId || !reason) {
      setState(prev => ({ ...prev, error: 'User ID and reason are required' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null, success: null }));

    try {
      const session = authManager.getCurrentSuperAdminSession();
      if (!session) {
        throw new Error('No super admin session');
      }

      await userRepository.superAdminRecoverUser(userId, session.superAdminSessionId, newTier, reason);
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        success: `User ${userId} recovered successfully with tier ${newTier}` 
      }));
      
      // Reload users to reflect changes
      await loadUsers();
      
      // Clear form
      setUserId('');
      setReason('');
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  };

  return (
    <div className="super-admin-tool">
      <div className="tool-header">
        <h3>🔓 User Recovery Tool</h3>
        <button className="close-tool-button" onClick={onClose}>×</button>
      </div>

      {state.error && <div className="tool-error">{state.error}</div>}
      {state.success && <div className="tool-success">{state.success}</div>}

      <div className="tool-content">
        <div className="locked-users-section">
          <h4>Locked Users</h4>
          {state.loading ? (
            <div>Loading users...</div>
          ) : (
            <div className="users-list">
              {users.length === 0 ? (
                <div>No locked users found</div>
              ) : (
                users.map(user => (
                  <div key={user.id} className="user-item">
                    <div className="user-info">
                      <strong>{user.email}</strong> ({user.tier})
                      <br />
                      <small>Failed attempts: {user.failedLoginAttempts}</small>
                      {user.lockedUntil && (
                        <small> | Locked until: {user.lockedUntil.toLocaleString()}</small>
                      )}
                    </div>
                    <button 
                      className="select-user-button"
                      onClick={() => setUserId(user.id)}
                    >
                      Select
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="recovery-form">
          <h4>Recover User</h4>
          <div className="form-group">
            <label>User ID:</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID to recover"
            />
          </div>
          
          <div className="form-group">
            <label>New Tier:</label>
            <select value={newTier} onChange={(e) => setNewTier(e.target.value as any)}>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Recovery Reason:</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for user recovery (required for audit)"
              rows={3}
            />
          </div>
          
          <button
            className="recovery-button"
            onClick={handleUserRecovery}
            disabled={state.loading || !userId || !reason}
          >
            {state.loading ? 'Recovering...' : 'Recover User'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * License Reset Tool
 */
export const LicenseResetTool: React.FC<SuperAdminToolsProps> = ({
  authManager,
  userRepository,
  onClose
}) => {
  const [state, setState] = useState<ToolState>({ loading: false, error: null, success: null, data: null });
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const handleLicenseReset = async () => {
    if (!userId || !reason) {
      setState(prev => ({ ...prev, error: 'User ID and reason are required' }));
      return;
    }

    if (!confirmReset) {
      setState(prev => ({ ...prev, error: 'Please confirm the license reset action' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null, success: null }));

    try {
      const session = authManager.getCurrentSuperAdminSession();
      if (!session) {
        throw new Error('No super admin session');
      }

      await userRepository.superAdminResetLicense(userId, session.superAdminSessionId, reason);
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        success: `License reset successfully for user ${userId}` 
      }));
      
      // Clear form
      setUserId('');
      setReason('');
      setConfirmReset(false);
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  };

  return (
    <div className="super-admin-tool">
      <div className="tool-header">
        <h3>🔑 License Reset Tool</h3>
        <button className="close-tool-button" onClick={onClose}>×</button>
      </div>

      <div className="security-warning">
        ⚠️ WARNING: This action will reset the user&apos;s license to free tier and clear their license key.
        This action cannot be undone and will be logged for audit purposes.
      </div>

      {state.error && <div className="tool-error">{state.error}</div>}
      {state.success && <div className="tool-success">{state.success}</div>}

      <div className="tool-content">
        <div className="form-group">
          <label>User ID:</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID for license reset"
          />
        </div>
        
        <div className="form-group">
          <label>Reset Reason:</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter detailed reason for license reset (required for audit)"
            rows={3}
          />
        </div>
        
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={confirmReset}
              onChange={(e) => setConfirmReset(e.target.checked)}
            />
            I confirm that I want to reset this user&apos;s license and understand this action cannot be undone
          </label>
        </div>
        
        <button
          className="reset-button destructive"
          onClick={handleLicenseReset}
          disabled={state.loading || !userId || !reason || !confirmReset}
        >
          {state.loading ? 'Resetting...' : 'Reset License'}
        </button>
      </div>
    </div>
  );
};

/**
 * Emergency Unlock Tool
 */
export const EmergencyUnlockTool: React.FC<SuperAdminToolsProps> = ({
  authManager,
  userRepository,
  onClose
}) => {
  const [state, setState] = useState<ToolState>({ loading: false, error: null, success: null, data: null });
  const [reason, setReason] = useState('');
  const [confirmUnlock, setConfirmUnlock] = useState(false);

  const handleEmergencyUnlock = async () => {
    if (!reason) {
      setState(prev => ({ ...prev, error: 'Emergency reason is required' }));
      return;
    }

    if (!confirmUnlock) {
      setState(prev => ({ ...prev, error: 'Please confirm the emergency unlock action' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null, success: null }));

    try {
      const session = authManager.getCurrentSuperAdminSession();
      if (!session) {
        throw new Error('No super admin session');
      }

      const unlockedCount = await userRepository.superAdminEmergencyUnlockAll(
        session.superAdminSessionId, 
        reason
      );
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        success: `Emergency unlock completed. ${unlockedCount} users unlocked.` 
      }));
      
      // Clear form
      setReason('');
      setConfirmUnlock(false);
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  };

  return (
    <div className="super-admin-tool">
      <div className="tool-header">
        <h3>🚨 Emergency Unlock Tool</h3>
        <button className="close-tool-button" onClick={onClose}>×</button>
      </div>

      <div className="security-warning">
        🚨 EMERGENCY ACTION: This will unlock ALL locked user accounts in the system.
        Use only in genuine emergency situations. All actions are logged and monitored.
      </div>

      {state.error && <div className="tool-error">{state.error}</div>}
      {state.success && <div className="tool-success">{state.success}</div>}

      <div className="tool-content">
        <div className="form-group">
          <label>Emergency Reason:</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter detailed emergency reason (minimum 10 characters, required for audit)"
            rows={4}
          />
        </div>
        
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={confirmUnlock}
              onChange={(e) => setConfirmUnlock(e.target.checked)}
            />
            I confirm this is a genuine emergency and I authorize unlocking ALL user accounts
          </label>
        </div>
        
        <button
          className="emergency-unlock-button destructive"
          onClick={handleEmergencyUnlock}
          disabled={state.loading || !reason || reason.length < 10 || !confirmUnlock}
        >
          {state.loading ? 'Unlocking...' : 'EMERGENCY UNLOCK ALL USERS'}
        </button>
      </div>
    </div>
  );
};

/**
 * Audit Trail Tool
 */
export const AuditTrailTool: React.FC<SuperAdminToolsProps> = ({
  authManager,
  onClose
}) => {
  const [state, setState] = useState<ToolState>({ loading: false, error: null, success: null, data: [] });
  const [limit, setLimit] = useState(50);

  const loadAuditTrail = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const auditTrail = authManager.getSuperAdminAuditTrail(limit);
      setState(prev => ({ ...prev, loading: false, data: auditTrail }));
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  }, [authManager, limit]);

  useEffect(() => {
    loadAuditTrail();
  }, [loadAuditTrail]);

  return (
    <div className="super-admin-tool">
      <div className="tool-header">
        <h3>📋 Audit Trail</h3>
        <button className="close-tool-button" onClick={onClose}>×</button>
      </div>

      {state.error && <div className="tool-error">{state.error}</div>}

      <div className="tool-content">
        <div className="audit-controls">
          <label>
            Show last:
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              <option value={25}>25 entries</option>
              <option value={50}>50 entries</option>
              <option value={100}>100 entries</option>
              <option value={200}>200 entries</option>
            </select>
          </label>
          <button onClick={loadAuditTrail} disabled={state.loading}>
            {state.loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="audit-trail">
          {state.data.length === 0 ? (
            <div>No audit entries found</div>
          ) : (
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Success</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {state.data.map((entry: any, index: number) => (
                  <tr key={index} className={entry.success ? 'success' : 'failure'}>
                    <td>{new Date(entry.timestamp).toLocaleString()}</td>
                    <td>{entry.action}</td>
                    <td>{entry.userId}</td>
                    <td>{entry.success ? '✅' : '❌'}</td>
                    <td>
                      <details>
                        <summary>View</summary>
                        <pre>{JSON.stringify(entry.details, null, 2)}</pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
