# Advanced Security Framework

## Overview

The Advanced Security Framework provides enterprise-grade security capabilities for the SizeWise Suite, including multi-factor authentication (MFA), role-based access control (RBAC), comprehensive audit trails, and data encryption. This framework ensures the platform meets enterprise security requirements and compliance standards.

## Architecture Components

### 1. Multi-Factor Authentication (MFA)

**Features:**
- TOTP (Time-based One-Time Password) support
- QR code generation for authenticator apps
- Backup codes for account recovery
- Hardware security key support (WebAuthn)
- SMS fallback (configurable)

**Implementation:**
- Backend: `backend/security/advanced_security_framework.py`
- Frontend: `frontend/components/security/MFASetup.tsx`
- Service: `frontend/lib/services/SecurityService.ts`

**Supported Authenticator Apps:**
- Google Authenticator
- Microsoft Authenticator
- Authy
- 1Password
- Bitwarden

### 2. Role-Based Access Control (RBAC)

**Default Roles:**

| Role | Permissions | Description |
|------|-------------|-------------|
| **Viewer** | project:read, calculation:basic, collaboration:join | Read-only access to projects and basic calculations |
| **Engineer** | All viewer permissions + project:create/update, calculation:advanced, calculation:export | Full engineering capabilities |
| **Project Manager** | All engineer permissions + project:delete/share, collaboration:moderate | Project management with team collaboration |
| **Administrator** | All permissions | Full system administration |

**Custom Roles:**
- Create custom roles with specific permission sets
- Assign multiple roles to users
- Dynamic permission checking
- Role inheritance support

### 3. Security Audit Trail

**Tracked Events:**
- Authentication attempts (success/failure)
- MFA setup and verification
- Password changes
- Data access and modifications
- Permission denied events
- Session timeouts
- Administrative actions

**Risk Levels:**
- **LOW**: Normal operations, successful authentications
- **MEDIUM**: Failed authentications, permission denials
- **HIGH**: Multiple failed attempts, suspicious activities
- **CRITICAL**: Security breaches, unauthorized access attempts

### 4. Data Encryption

**Encryption at Rest:**
- AES-256 encryption for sensitive data
- PBKDF2 key derivation with 100,000 iterations
- Encrypted file storage
- Database field-level encryption

**Encryption in Transit:**
- TLS 1.3 for all communications
- Certificate pinning
- HSTS headers
- Secure WebSocket connections

## Security Policies

### Password Policy
```typescript
{
  passwordMinLength: 12,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: true,
  passwordMaxAgeDays: 90,
  sessionTimeoutMinutes: 480, // 8 hours
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 30,
  mfaRequired: true
}
```

### Session Management
- Automatic session timeout after inactivity
- Session monitoring and activity tracking
- Secure session ID generation
- Cross-tab session synchronization
- Graceful session expiration handling

## Implementation Guide

### 1. Backend Setup

```python
from backend.security.advanced_security_framework import AdvancedSecurityFramework

# Initialize security framework
security = AdvancedSecurityFramework(
    master_key="your-master-encryption-key",
    db_service=your_database_service
)

# Authenticate user
result = await security.authenticate_user(
    user_id="user123",
    password="user_password",
    mfa_token="123456",
    ip_address="192.168.1.1",
    user_agent="Mozilla/5.0..."
)
```

### 2. Frontend Integration

```typescript
import { securityService } from '@/lib/services/SecurityService';

// Authenticate user
const result = await securityService.authenticate(
  'user@example.com',
  'password',
  '123456' // MFA token
);

// Check permissions
if (securityService.hasPermission('project:create')) {
  // User can create projects
}

// Check roles
if (securityService.hasRole(['admin', 'project_manager'])) {
  // User has admin or project manager role
}
```

### 3. MFA Setup Component

```tsx
import { MFASetup } from '@/components/security/MFASetup';

<MFASetup
  onComplete={(success) => {
    if (success) {
      // MFA setup completed successfully
    }
  }}
  onCancel={() => {
    // User cancelled MFA setup
  }}
/>
```

### 4. Security Audit Dashboard

```tsx
import { SecurityAuditDashboard } from '@/components/security/SecurityAuditDashboard';

<SecurityAuditDashboard userId="optional-user-id" />
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication with MFA
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Change user password
- `POST /api/auth/mfa/setup` - Initialize MFA setup
- `POST /api/auth/mfa/verify-setup` - Verify MFA setup

### Security Events
- `GET /api/security/events` - Retrieve security events
- `POST /api/security/events` - Log security event

### User Management
- `GET /api/users/{id}/permissions` - Get user permissions
- `POST /api/users/{id}/roles` - Assign role to user
- `DELETE /api/users/{id}/roles/{role}` - Remove role from user

## Security Best Practices

### 1. Password Security
- Enforce strong password policies
- Regular password rotation
- Password history tracking
- Secure password storage with bcrypt/scrypt

### 2. Session Security
- Secure session ID generation
- Session fixation protection
- Automatic session timeout
- Cross-site request forgery (CSRF) protection

### 3. Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper access controls
- Regular security audits

### 4. Monitoring and Alerting
- Real-time security event monitoring
- Automated threat detection
- Security incident response procedures
- Regular security assessments

## Compliance Features

### SOC 2 Compliance
- Access controls and user management
- System monitoring and logging
- Data encryption and protection
- Incident response procedures

### GDPR Compliance
- Data subject rights management
- Consent tracking and management
- Data breach notification
- Privacy by design principles

### HIPAA Compliance (if applicable)
- Administrative safeguards
- Physical safeguards
- Technical safeguards
- Audit controls

## Testing and Validation

### Security Testing
```bash
# Run security tests
npm run test:security

# Backend security tests
pytest tests/security/

# Frontend security tests
npm run test -- --testPathPattern=security
```

### Penetration Testing
- Regular penetration testing
- Vulnerability assessments
- Security code reviews
- Third-party security audits

## Monitoring and Metrics

### Security Metrics
- Authentication success/failure rates
- MFA adoption rates
- Security event frequency
- Session timeout rates
- Password policy compliance

### Alerting
- Failed authentication attempts
- Suspicious activity patterns
- Security policy violations
- System security events

## Deployment Considerations

### Environment Variables
```env
# Security configuration
SECURITY_MASTER_KEY=your-master-encryption-key
MFA_ISSUER_NAME=SizeWise Suite
SESSION_TIMEOUT_MINUTES=480
MAX_FAILED_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30

# Encryption settings
ENCRYPTION_ALGORITHM=AES-256
KEY_DERIVATION_ITERATIONS=100000
```

### Database Setup
```sql
-- Security audit events table
CREATE TABLE security_audit_events (
    event_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    timestamp TIMESTAMP NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    details JSONB,
    risk_level VARCHAR(20) NOT NULL,
    session_id VARCHAR(255)
);

-- User MFA settings table
CREATE TABLE user_mfa_settings (
    user_id VARCHAR(255) PRIMARY KEY,
    secret VARCHAR(255) NOT NULL,
    backup_codes JSONB,
    enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User roles table
CREATE TABLE user_roles (
    user_id VARCHAR(255) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by VARCHAR(255),
    PRIMARY KEY (user_id, role_name)
);
```

## Troubleshooting

### Common Issues

1. **MFA Setup Fails**
   - Check system time synchronization
   - Verify QR code generation
   - Validate TOTP secret format

2. **Authentication Errors**
   - Check password policy compliance
   - Verify MFA token validity
   - Review audit logs for details

3. **Permission Denied**
   - Verify user role assignments
   - Check permission definitions
   - Review RBAC configuration

### Debug Mode
```typescript
// Enable security debug logging
localStorage.setItem('security_debug', 'true');
```

## Future Enhancements

### Planned Features
- Biometric authentication support
- Risk-based authentication
- Advanced threat detection
- Security analytics dashboard
- Integration with SIEM systems

### Roadmap
- Q1 2025: Biometric authentication
- Q2 2025: Risk-based authentication
- Q3 2025: Advanced threat detection
- Q4 2025: SIEM integration

---

This Advanced Security Framework provides enterprise-grade security capabilities while maintaining usability and performance. Regular security reviews and updates ensure the framework remains effective against evolving threats.
