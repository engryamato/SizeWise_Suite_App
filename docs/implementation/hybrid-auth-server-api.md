# Hybrid Authentication Server API Design

## Overview

This document outlines the server-side API design for the hybrid authentication system that combines offline-first capabilities with online tier management.

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "tier": "trial|free|premium",
    "trial_expires": "2024-08-15T00:00:00Z",
    "subscription_expires": "2025-01-15T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": "jwt-token",
  "refresh_token": "refresh-token"
}
```

#### POST /api/auth/register
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "company": "ACME Corp"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "tier": "trial",
    "trial_expires": "2024-08-15T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": "jwt-token"
}
```

#### POST /api/auth/refresh
```json
{
  "refresh_token": "refresh-token"
}
```

### Tier Management Endpoints

#### GET /api/user/tier-status
**Headers:** `Authorization: Bearer jwt-token`

**Response:**
```json
{
  "success": true,
  "tier": "trial",
  "trial_expires": "2024-08-15T00:00:00Z",
  "subscription_expires": null,
  "features": {
    "max_projects": -1,
    "max_segments_per_project": -1,
    "high_res_exports": true,
    "watermarked_exports": false,
    "api_access": false
  },
  "usage": {
    "projects_count": 5,
    "segments_count": 150
  }
}
```

#### POST /api/admin/update-tier
**Headers:** `Authorization: Bearer admin-jwt-token`

```json
{
  "user_id": "user-uuid",
  "tier": "premium",
  "subscription_expires": "2025-01-15T00:00:00Z"
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  tier VARCHAR(20) DEFAULT 'trial',
  trial_expires TIMESTAMP,
  subscription_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
```

### User Sessions Table
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);
```

### Tier Configurations Table
```sql
CREATE TABLE tier_configurations (
  tier VARCHAR(20) PRIMARY KEY,
  max_projects INTEGER DEFAULT -1, -- -1 means unlimited
  max_segments_per_project INTEGER DEFAULT -1,
  high_res_exports BOOLEAN DEFAULT true,
  watermarked_exports BOOLEAN DEFAULT false,
  api_access BOOLEAN DEFAULT false,
  trial_duration_days INTEGER DEFAULT 14
);
```

## Implementation Notes

### Security Considerations
- Use bcrypt for password hashing
- Implement rate limiting on auth endpoints
- Use secure JWT tokens with short expiration
- Implement refresh token rotation
- Log all authentication events

### Trial Management
- New users automatically get 14-day trial with Premium features
- Trial expiration is checked on each tier validation request
- Expired trials automatically revert to Free tier
- Grace period of 3 days for expired trials

### Offline Handling
- Client caches last known tier status
- Offline mode uses cached tier information
- Periodic sync when connection is restored
- Graceful degradation for extended offline periods
