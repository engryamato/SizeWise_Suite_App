/**
 * SuperAdminInterface Test Suite
 * 
 * CRITICAL: Validates super administrator interface functionality
 * Tests build flag controls, authentication flows, and tool integration
 * 
 * @see docs/implementation/security/super-admin-architecture.md
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SuperAdminInterface } from '../SuperAdminInterface';
import { AuthenticationManager } from '../../../lib/auth/AuthenticationManager';
import { SuperAdminConfig } from '../../../config/SuperAdminConfig';

// Mock dependencies
jest.mock('../../../lib/auth/AuthenticationManager');
jest.mock('../../../config/SuperAdminConfig');

// Mock environment variables
const originalEnv = process.env;

describe('SuperAdminInterface - Build Flag and Security Testing', () => {
  let mockAuthManager: jest.Mocked<AuthenticationManager>;
  let mockOnClose: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment
    process.env = { ...originalEnv };
    
    // Clear window flags
    delete (window as any).__SIZEWISE_SUPER_ADMIN_ENABLED__;

    // Mock AuthenticationManager
    mockAuthManager = {
      getCurrentSuperAdminSession: jest.fn().mockReturnValue(null),
      authenticateSuperAdmin: jest.fn(),
      requestEmergencyAccess: jest.fn(),
      revokeSuperAdminSession: jest.fn(),
      hasSuperAdminPermission: jest.fn().mockReturnValue(true),
      initializeSuperAdminValidator: jest.fn(),
      validateSuperAdminSession: jest.fn(),
      registerHardwareKey: jest.fn(),
      getSuperAdminSecurityStats: jest.fn(),
      getSuperAdminAuditTrail: jest.fn().mockReturnValue([])
    } as any;

    mockOnClose = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Build Flag Controls', () => {
    test('should not render in production without flags', () => {
      process.env.NODE_ENV = 'production';
      process.env.REACT_APP_ENABLE_SUPER_ADMIN = 'false';

      const { container } = render(
        <SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />
      );

      expect(container.firstChild).toBeNull();
    });

    test('should render in development mode', () => {
      process.env.NODE_ENV = 'development';

      render(<SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />);

      expect(screen.getByText('🔒 Super Administrator Access')).toBeInTheDocument();
    });

    test('should render with explicit enable flag', () => {
      process.env.NODE_ENV = 'production';
      process.env.REACT_APP_ENABLE_SUPER_ADMIN = 'true';

      render(<SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />);

      expect(screen.getByText('🔒 Super Administrator Access')).toBeInTheDocument();
    });

    test('should render with window flag', () => {
      process.env.NODE_ENV = 'production';
      (window as any).__SIZEWISE_SUPER_ADMIN_ENABLED__ = true;

      render(<SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />);

      expect(screen.getByText('🔒 Super Administrator Access')).toBeInTheDocument();
    });
  });

  describe('Authentication Flow', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'; // Enable for testing
    });

    test('should show authentication form when not authenticated', () => {
      render(<SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />);

      expect(screen.getByText('🔒 Super Administrator Access')).toBeInTheDocument();
      expect(screen.getByText('Hardware key authentication required')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter admin user ID')).toBeInTheDocument();
    });

    test('should handle hardware key authentication', async () => {
      mockAuthManager.authenticateSuperAdmin.mockResolvedValue({
        success: true,
        superAdminSession: {
          id: 'session-123',
          userId: 'admin-user',
          createdAt: Date.now(),
          expiresAt: Date.now() + 30 * 60 * 1000,
          lastActivity: Date.now(),
          isValid: true,
          superAdminSessionId: 'super-session-123',
          hardwareKeyId: 'hardware-key-456',
          emergencyAccess: false,
          superAdminPermissions: ['license_reset', 'user_recovery'],
          superAdminExpiresAt: Date.now() + 30 * 60 * 1000
        }
      });

      render(<SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />);

      // Fill in hardware key form
      fireEvent.change(screen.getByPlaceholderText('Enter admin user ID'), {
        target: { value: 'admin-user-123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter hardware key ID'), {
        target: { value: 'hardware-key-456' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter challenge data'), {
        target: { value: 'test-challenge' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter signature'), {
        target: { value: 'test-signature' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter client data'), {
        target: { value: 'test-client-data' }
      });

      // Submit authentication
      fireEvent.click(screen.getByText('Authenticate with Hardware Key'));

      await waitFor(() => {
        expect(mockAuthManager.authenticateSuperAdmin).toHaveBeenCalledWith({
          userId: 'admin-user-123',
          hardwareKeyId: 'hardware-key-456',
          challenge: 'test-challenge',
          signature: 'test-signature',
          clientData: 'test-client-data'
        });
      });

      // Should show tools interface after successful authentication
      await waitFor(() => {
        expect(screen.getByText('🛠️ Super Administrator Tools')).toBeInTheDocument();
      });
    });

    test('should handle authentication failure', async () => {
      mockAuthManager.authenticateSuperAdmin.mockResolvedValue({
        success: false,
        error: 'Invalid hardware key signature',
        requiresHardwareKey: true
      });

      render(<SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />);

      // Fill in form and submit
      fireEvent.change(screen.getByPlaceholderText('Enter admin user ID'), {
        target: { value: 'admin-user-123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter hardware key ID'), {
        target: { value: 'invalid-key' }
      });
      fireEvent.click(screen.getByText('Authenticate with Hardware Key'));

      await waitFor(() => {
        expect(screen.getByText('❌ Invalid hardware key signature')).toBeInTheDocument();
      });
    });

    test('should handle emergency access request', async () => {
      mockAuthManager.requestEmergencyAccess.mockResolvedValue({
        success: true,
        superAdminSession: {
          id: 'emergency-session',
          userId: 'emergency',
          createdAt: Date.now(),
          expiresAt: Date.now() + 60 * 60 * 1000,
          lastActivity: Date.now(),
          isValid: true,
          superAdminSessionId: 'emergency-session-123',
          hardwareKeyId: 'emergency',
          emergencyAccess: true,
          superAdminPermissions: ['user_recovery', 'emergency_unlock'],
          superAdminExpiresAt: Date.now() + 60 * 60 * 1000
        }
      });

      render(<SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />);

      // Switch to emergency access tab
      fireEvent.click(screen.getByText('Emergency Access'));

      // Fill in emergency form
      fireEvent.change(screen.getByPlaceholderText('Detailed reason for emergency access (minimum 10 characters)'), {
        target: { value: 'System lockout - need to recover user access for critical business operations' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter hardware key proof (base64)'), {
        target: { value: 'dGVzdC1wcm9vZi1kYXRh' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter contact email'), {
        target: { value: 'admin@company.com' }
      });

      // Select permissions
      fireEvent.click(screen.getByLabelText(/USER_RECOVERY/));
      fireEvent.click(screen.getByLabelText(/EMERGENCY_UNLOCK/));

      // Submit emergency request
      fireEvent.click(screen.getByText('Request Emergency Access'));

      await waitFor(() => {
        expect(mockAuthManager.requestEmergencyAccess).toHaveBeenCalledWith({
          reason: 'System lockout - need to recover user access for critical business operations',
          requestedPermissions: ['user_recovery', 'emergency_unlock'],
          hardwareKeyProof: 'dGVzdC1wcm9vZi1kYXRh',
          contactInfo: 'admin@company.com'
        });
      });

      // Should show tools interface after successful emergency access
      await waitFor(() => {
        expect(screen.getByText('🛠️ Super Administrator Tools')).toBeInTheDocument();
      });
    });
  });

  describe('Super Admin Tools Interface', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      
      // Mock existing session
      mockAuthManager.getCurrentSuperAdminSession.mockReturnValue({
        id: 'session-123',
        userId: 'admin-user',
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
        lastActivity: Date.now(),
        isValid: true,
        superAdminSessionId: 'super-session-123',
        hardwareKeyId: 'hardware-key-456',
        emergencyAccess: false,
        superAdminPermissions: ['license_reset', 'user_recovery', 'emergency_unlock'],
        superAdminExpiresAt: Date.now() + 30 * 60 * 1000
      });
    });

    test('should show tools interface when authenticated', () => {
      render(<SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />);

      expect(screen.getByText('🛠️ Super Administrator Tools')).toBeInTheDocument();
      expect(screen.getByText('Session: super-session-123')).toBeInTheDocument();
      expect(screen.getByText('User: admin-user')).toBeInTheDocument();
      expect(screen.getByText('Emergency: No')).toBeInTheDocument();
    });

    test('should show available tools based on permissions', () => {
      render(<SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />);

      expect(screen.getByText('User Recovery')).toBeInTheDocument();
      expect(screen.getByText('License Reset')).toBeInTheDocument();
      expect(screen.getByText('Emergency Unlock')).toBeInTheDocument();
    });

    test('should disable tools without permissions', () => {
      mockAuthManager.hasSuperAdminPermission.mockImplementation((permission) => {
        return permission !== 'database_repair'; // Disable database repair
      });

      render(<SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />);

      const databaseRepairButton = screen.getByText('Database Repair');
      expect(databaseRepairButton).toBeDisabled();
    });

    test('should handle logout', async () => {
      mockAuthManager.revokeSuperAdminSession.mockResolvedValue(true);

      render(<SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(mockAuthManager.revokeSuperAdminSession).toHaveBeenCalledWith('Manual logout');
      });

      // Should return to authentication form
      await waitFor(() => {
        expect(screen.getByText('🔒 Super Administrator Access')).toBeInTheDocument();
      });
    });

    test('should open and close tools', () => {
      render(<SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />);

      // Open audit trail tool
      fireEvent.click(screen.getByText('Audit Trail'));

      expect(screen.getByText('Tool: audit-trail')).toBeInTheDocument();

      // Close tool
      fireEvent.click(screen.getByText('Close Tool'));

      expect(screen.queryByText('Tool: audit-trail')).not.toBeInTheDocument();
    });
  });

  describe('Security Features', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    test('should validate form inputs', () => {
      render(<SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />);

      const authButton = screen.getByText('Authenticate with Hardware Key');
      expect(authButton).toBeDisabled(); // Should be disabled without required fields

      // Fill required fields
      fireEvent.change(screen.getByPlaceholderText('Enter admin user ID'), {
        target: { value: 'admin-user' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter hardware key ID'), {
        target: { value: 'hardware-key' }
      });

      expect(authButton).not.toBeDisabled();
    });

    test('should validate emergency access form', () => {
      render(<SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />);

      // Switch to emergency access
      fireEvent.click(screen.getByText('Emergency Access'));

      const emergencyButton = screen.getByText('Request Emergency Access');
      expect(emergencyButton).toBeDisabled();

      // Fill required fields
      fireEvent.change(screen.getByPlaceholderText('Detailed reason for emergency access (minimum 10 characters)'), {
        target: { value: 'Emergency reason' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter contact email'), {
        target: { value: 'admin@company.com' }
      });

      expect(emergencyButton).not.toBeDisabled();
    });

    test('should handle close callback', () => {
      render(<SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText('Close'));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    test('should handle authentication errors gracefully', async () => {
      mockAuthManager.authenticateSuperAdmin.mockRejectedValue(new Error('Network error'));

      render(<SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />);

      // Fill form and submit
      fireEvent.change(screen.getByPlaceholderText('Enter admin user ID'), {
        target: { value: 'admin-user' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter hardware key ID'), {
        target: { value: 'hardware-key' }
      });
      fireEvent.click(screen.getByText('Authenticate with Hardware Key'));

      await waitFor(() => {
        expect(screen.getByText(/Authentication error: Network error/)).toBeInTheDocument();
      });
    });

    test('should handle emergency access errors gracefully', async () => {
      mockAuthManager.requestEmergencyAccess.mockRejectedValue(new Error('Emergency access denied'));

      render(<SuperAdminInterface authManager={mockAuthManager} onClose={mockOnClose} />);

      // Switch to emergency access and fill form
      fireEvent.click(screen.getByText('Emergency Access'));
      fireEvent.change(screen.getByPlaceholderText('Detailed reason for emergency access (minimum 10 characters)'), {
        target: { value: 'Emergency reason' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter contact email'), {
        target: { value: 'admin@company.com' }
      });
      fireEvent.click(screen.getByText('Request Emergency Access'));

      await waitFor(() => {
        expect(screen.getByText(/Emergency access error: Emergency access denied/)).toBeInTheDocument();
      });
    });
  });
});
