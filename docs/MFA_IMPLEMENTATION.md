# Multi-Factor Authentication (MFA) Implementation

This document describes the Multi-Factor Authentication implementation for the SizeWise Suite application.

## Overview

The MFA implementation provides an additional layer of security using Time-based One-Time Passwords (TOTP) compatible with standard authenticator apps like Google Authenticator, Authy, and Microsoft Authenticator.

## Features

- ✅ TOTP-based authentication using industry-standard algorithms
- ✅ QR code generation for easy setup
- ✅ Manual secret entry as alternative setup method
- ✅ Backup codes for account recovery (10 codes generated)
- ✅ User-friendly React wizard for setup process
- ✅ Secure backend API endpoints
- ✅ Database migration support
- ✅ Comprehensive unit tests
- ✅ End-to-end testing with Playwright

## Backend Implementation

### Database Schema

The `users` table has been extended with the following MFA-related columns:

```sql
-- New columns added via Alembic migration
mfa_secret VARCHAR(255) NULL          -- Base32 encoded TOTP secret
is_mfa_enabled BOOLEAN DEFAULT FALSE  -- Whether MFA is enabled for user
backup_codes TEXT NULL               -- JSON string of backup codes
```

### API Endpoints

#### Setup MFA
```
POST /api/auth/mfa/setup
Authorization: Bearer <token>

Response:
{
  "success": true,
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "data:image/png;base64,iVBOR...",
  "backup_codes": ["ABC123DEF456", ...],
  "provisioning_uri": "otpauth://totp/SizeWise%20Suite:user@example.com?..."
}
```

#### Verify MFA Setup
```
POST /api/auth/mfa/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456"
}

Response:
{
  "success": true,
  "message": "MFA verified and enabled successfully"
}
```

#### Get MFA Status
```
GET /api/auth/mfa/status
Authorization: Bearer <token>

Response:
{
  "success": true,
  "is_mfa_enabled": true,
  "has_mfa_secret": true,
  "backup_codes_remaining": 8
}
```

#### Disable MFA
```
POST /api/auth/mfa/disable
Authorization: Bearer <token>
Content-Type: application/json

{
  "password": "user_password"
}

Response:
{
  "success": true,
  "message": "MFA disabled successfully"
}
```

### Security Features

1. **Secure Secret Generation**: Uses `pyotp.random_base32()` for cryptographically secure secret generation
2. **Backup Code Management**: 10 unique backup codes generated, each can only be used once
3. **Password Verification**: Required for disabling MFA
4. **Token Validation**: TOTP tokens are validated with a 2-window tolerance for clock drift
5. **Database Security**: MFA secrets are stored securely in the database

## Frontend Implementation

### React Components

#### MFASetup Component
Located at: `frontend/components/security/MFASetup.tsx`

Features:
- Multi-step wizard (Setup → Verify → Backup Codes)
- QR code display for authenticator app setup
- Manual secret entry option
- Backup codes download functionality
- Form validation and error handling

#### SecurityService Integration
Located at: `frontend/lib/services/SecurityService.ts`

Methods:
- `setupMFA()`: Initialize MFA setup
- `verifyMFASetup(token)`: Verify TOTP token
- `getMFAStatus()`: Get current MFA status
- `disableMFA(password)`: Disable MFA with password

### User Experience Flow

1. **Setup Initiation**: User clicks "Enable MFA" in security settings
2. **App Installation**: User downloads authenticator app (Google Authenticator, Authy, etc.)
3. **QR Code Scanning**: User scans QR code with authenticator app
4. **Verification**: User enters 6-digit TOTP code to verify setup
5. **Backup Codes**: User downloads and securely stores backup codes
6. **Completion**: MFA is enabled and user returns to security settings

## Testing

### Unit Tests
Location: `auth-server/test_mfa.py`

Coverage includes:
- MFA setup workflow
- TOTP token verification
- Backup code functionality
- Error handling and edge cases
- Authentication flow
- Security validations

Run tests:
```bash
cd auth-server
python -m pytest test_mfa.py -v
```

### End-to-End Tests
Location: `frontend/tests/e2e/mfa-workflow.spec.ts`

Tests cover:
- Complete MFA setup workflow
- QR code display and interaction
- Verification step validation
- Backup codes download
- Error handling scenarios
- User interface interactions

Run E2E tests:
```bash
cd frontend
npx playwright test tests/e2e/mfa-workflow.spec.ts
```

## Security Considerations

1. **TOTP Standard Compliance**: Uses RFC 6238 compliant TOTP implementation
2. **Secure Storage**: MFA secrets are stored in database with proper encryption considerations
3. **Rate Limiting**: Should implement rate limiting on MFA endpoints (recommended)
4. **Session Management**: MFA verification doesn't affect existing sessions
5. **Backup Code Limitations**: Each backup code can only be used once
6. **Clock Skew Tolerance**: 2-window tolerance for time synchronization issues

## Dependencies

### Backend
- `pyotp==2.9.0`: TOTP implementation
- `qrcode[pil]==8.2`: QR code generation
- `Flask-Migrate`: Database migrations

### Frontend
- React 18+
- TypeScript
- Custom SecurityService for API integration

## Migration

The database migration adds the required MFA columns to the existing users table:

```bash
cd auth-server
export FLASK_APP=app.py
python -m flask db migrate -m "Add MFA columns to User model"
python -m flask db upgrade
```

## Configuration

### Environment Variables
- `SECRET_KEY`: Flask secret key for session management
- `JWT_SECRET_KEY`: JWT token signing key
- `DATABASE_URL`: Database connection string

### MFA Settings
- Token validity window: 30 seconds (TOTP standard)
- Clock skew tolerance: ±60 seconds (2 windows)
- Backup codes count: 10
- Backup code format: 16 character alphanumeric

## Troubleshooting

### Common Issues

1. **Time Synchronization**: Ensure server and authenticator app have correct time
2. **QR Code Issues**: Verify QR code contains valid TOTP URI format
3. **Backup Code Problems**: Check if codes have been used before
4. **Token Validation Failures**: Verify 6-digit format and timing

### Debug Logs

MFA operations are logged with appropriate levels:
- Setup initiation: INFO
- Successful verification: INFO  
- Failed verification: WARNING
- MFA disable: INFO (high security event)

## Future Enhancements

- [ ] SMS-based MFA as alternative
- [ ] Hardware token support (FIDO2/WebAuthn)
- [ ] Admin panel for MFA management
- [ ] MFA enforcement policies
- [ ] Rate limiting implementation
- [ ] Audit logging enhancements

## API Documentation

For detailed API documentation, see the auto-generated OpenAPI documentation or update your existing Postman collection with the new MFA endpoints.

Example Postman requests have been provided in the implementation and can be imported into your existing collection.
