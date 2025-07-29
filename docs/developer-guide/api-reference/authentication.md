# Authentication API

The Authentication API handles user registration, login, session management, and tier-based access control for SizeWise Suite.

## Base URL

- **Development**: `http://localhost:5001/api`
- **Production**: `https://auth.sizewise-suite.com/api`

## Authentication Flow

SizeWise Suite uses JWT-based authentication with refresh tokens:

1. **Registration/Login**: User provides credentials
2. **Token Issuance**: Server returns access and refresh tokens
3. **API Requests**: Client includes access token in Authorization header
4. **Token Refresh**: Client uses refresh token to get new access token
5. **Logout**: Client invalidates tokens

## Endpoints

### User Registration

Register a new user account with automatic trial tier assignment.

#### Request

```http
POST /auth/register
Content-Type: application/json
```

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "company": "ACME Mechanical"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123456",
      "email": "user@example.com",
      "name": "John Doe",
      "company": "ACME Mechanical",
      "tier": "trial",
      "trial_expires_at": "2024-02-01T10:30:00.000Z",
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 900,
      "token_type": "Bearer"
    }
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0"
  }
}
```

#### Error Responses

```json
// Email already exists (409 Conflict)
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "An account with this email already exists",
    "details": {
      "field": "email",
      "value": "user@example.com"
    }
  }
}

// Invalid password (422 Unprocessable Entity)
{
  "success": false,
  "error": {
    "code": "WEAK_PASSWORD",
    "message": "Password must be at least 8 characters with uppercase, lowercase, and number",
    "details": {
      "field": "password",
      "requirements": [
        "minimum 8 characters",
        "at least one uppercase letter",
        "at least one lowercase letter",
        "at least one number"
      ]
    }
  }
}
```

### User Login

Authenticate user and return access tokens.

#### Request

```http
POST /auth/login
Content-Type: application/json
```

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123456",
      "email": "user@example.com",
      "name": "John Doe",
      "tier": "premium",
      "features": [
        "unlimited_projects",
        "high_res_exports",
        "api_access",
        "priority_support"
      ]
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 900,
      "token_type": "Bearer"
    }
  }
}
```

#### Error Responses

```json
// Invalid credentials (401 Unauthorized)
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}

// Account locked (423 Locked)
{
  "success": false,
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "Account temporarily locked due to multiple failed login attempts",
    "details": {
      "locked_until": "2024-01-15T11:00:00.000Z",
      "retry_after": 1800
    }
  }
}
```

### Token Refresh

Refresh access token using refresh token.

#### Request

```http
POST /auth/refresh
Content-Type: application/json
```

#### Request Body

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 900,
      "token_type": "Bearer"
    }
  }
}
```

### User Logout

Invalidate user tokens and end session.

#### Request

```http
POST /auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out"
  }
}
```

### Get User Profile

Retrieve current user profile information.

#### Request

```http
GET /user/profile
Authorization: Bearer <access_token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123456",
      "email": "user@example.com",
      "name": "John Doe",
      "company": "ACME Mechanical",
      "tier": "premium",
      "subscription": {
        "status": "active",
        "expires_at": "2024-12-31T23:59:59.000Z",
        "auto_renew": true
      },
      "usage": {
        "projects_count": 15,
        "calculations_this_month": 342,
        "exports_this_month": 28
      },
      "created_at": "2024-01-15T10:30:00.000Z",
      "last_login": "2024-01-20T14:22:00.000Z"
    }
  }
}
```

### Get Tier Status

Get user's current tier and available features.

#### Request

```http
GET /user/tier-status
Authorization: Bearer <access_token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "tier": "premium",
    "features": {
      "unlimited_projects": true,
      "unlimited_segments": true,
      "high_res_exports": true,
      "no_watermarks": true,
      "api_access": true,
      "priority_support": true,
      "advanced_calculations": true,
      "collaboration": true
    },
    "limits": {
      "projects": -1,
      "segments_per_project": -1,
      "exports_per_month": -1,
      "api_calls_per_day": 10000
    },
    "subscription": {
      "status": "active",
      "expires_at": "2024-12-31T23:59:59.000Z",
      "days_remaining": 345
    }
  }
}
```

## Tier System

### Tier Definitions

#### Trial Tier (14 days)
- **Duration**: 14 days from registration
- **Features**: All Premium features
- **Limits**: Time-limited access
- **Automatic**: Assigned to new registrations

#### Free Tier
- **Projects**: 3 maximum
- **Segments**: 25 per project
- **Exports**: Standard resolution with watermarks
- **API Access**: None
- **Support**: Community forum only

#### Premium Tier
- **Projects**: Unlimited
- **Segments**: Unlimited per project
- **Exports**: High resolution, no watermarks
- **API Access**: Full API access
- **Support**: Priority email support

### Feature Flags

Features are controlled by tier-based flags:

```json
{
  "feature_flags": {
    "unlimited_projects": ["trial", "premium"],
    "high_res_exports": ["trial", "premium"],
    "api_access": ["premium"],
    "priority_support": ["premium"],
    "advanced_calculations": ["trial", "premium"],
    "collaboration": ["premium"]
  }
}
```

## Security

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Special characters recommended

### Token Security
- **Access Token**: 15-minute expiration
- **Refresh Token**: 7-day expiration
- **Secure Storage**: HttpOnly cookies recommended
- **Token Rotation**: New refresh token on each refresh

### Rate Limiting
- **Login Attempts**: 5 attempts per 15 minutes per IP
- **Registration**: 3 attempts per hour per IP
- **Token Refresh**: 10 requests per minute per user

### Account Security
- **Failed Login Lockout**: 5 failed attempts = 30-minute lockout
- **Password Reset**: Secure email-based reset flow
- **Session Management**: Multiple device session tracking

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `EMAIL_EXISTS` | 409 | Email already registered |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `WEAK_PASSWORD` | 422 | Password doesn't meet requirements |
| `ACCOUNT_LOCKED` | 423 | Too many failed login attempts |
| `TOKEN_EXPIRED` | 401 | Access token expired |
| `INVALID_TOKEN` | 401 | Malformed or invalid token |
| `REFRESH_TOKEN_EXPIRED` | 401 | Refresh token expired |
| `TIER_LIMIT_EXCEEDED` | 403 | Feature not available in current tier |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

## Integration Examples

### Frontend Integration (React)

```typescript
import { AuthClient } from '@sizewise-suite/auth-client';

const authClient = new AuthClient({
  baseUrl: 'https://auth.sizewise-suite.com/api'
});

// Login
const loginResult = await authClient.login({
  email: 'user@example.com',
  password: 'password123'
});

// Store tokens securely
localStorage.setItem('access_token', loginResult.tokens.access_token);
localStorage.setItem('refresh_token', loginResult.tokens.refresh_token);

// Auto-refresh tokens
authClient.onTokenRefresh((tokens) => {
  localStorage.setItem('access_token', tokens.access_token);
  localStorage.setItem('refresh_token', tokens.refresh_token);
});
```

### Backend Integration (Node.js)

```javascript
const jwt = require('jsonwebtoken');

// Middleware to verify JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};
```

---

*For additional authentication patterns and advanced integration examples, see the [Authentication Integration Guide](../guides/authentication-integration.md).*
