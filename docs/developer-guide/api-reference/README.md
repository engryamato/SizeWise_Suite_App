# API Reference

Welcome to the SizeWise Suite API Reference! This comprehensive guide covers all APIs, endpoints, and integration patterns for the SizeWise Suite platform.

## API Architecture Overview

SizeWise Suite uses a microservices architecture with multiple API layers:

- **Frontend API Routes** (Next.js): Client-side API routes for frontend integration
- **Backend Calculation API** (Flask): Core HVAC calculation engine
- **Authentication API** (Flask): User authentication and tier management
- **Feature Flag API**: Dynamic feature management system

## Base URLs

### Development Environment
- **Frontend API**: `http://localhost:3000/api`
- **Backend API**: `http://localhost:5000/api`
- **Authentication API**: `http://localhost:5001/api`

### Production Environment
- **Frontend API**: `https://app.sizewise-suite.com/api`
- **Backend API**: `https://api.sizewise-suite.com/v1`
- **Authentication API**: `https://auth.sizewise-suite.com/api`

## Authentication

All API requests (except public endpoints) require authentication using JWT Bearer tokens.

### Authentication Header
```http
Authorization: Bearer <jwt_token>
```

### Token Management
- **Access Token**: Short-lived (15 minutes) for API requests
- **Refresh Token**: Long-lived (7 days) for token renewal
- **Session Management**: Automatic token refresh in client applications

## API Categories

### 🔐 [Authentication API](authentication.md)
User registration, login, logout, and session management.

**Key Endpoints:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Token refresh
- `GET /user/profile` - User profile information

### 🧮 [Calculation API](calculations.md)
HVAC calculation engines for all sizing modules.

**Key Endpoints:**
- `POST /calculations/air-duct` - Air duct sizing calculations
- `POST /calculations/grease-duct` - Grease duct sizing
- `POST /calculations/validate` - Input validation
- `GET /calculations/standards` - Standards reference data

### 📁 [Project API](projects.md)
Project and data management operations.

**Key Endpoints:**
- `GET /projects` - List user projects
- `POST /projects` - Create new project
- `PUT /projects/{id}` - Update project
- `DELETE /projects/{id}` - Delete project

### 🏗️ [Feature Flag API](feature-flags.md)
Dynamic feature management and tier-based access control.

**Key Endpoints:**
- `GET /features/{feature_name}` - Check feature availability
- `GET /features/user/{user_id}` - Get user feature set
- `POST /features/evaluate` - Batch feature evaluation

### 📊 [Export API](exports.md)
Document generation and export functionality.

**Key Endpoints:**
- `POST /exports/pdf` - Generate PDF reports
- `POST /exports/excel` - Generate Excel spreadsheets
- `GET /exports/{export_id}` - Download generated files

## Common Patterns

### Request/Response Format

All APIs use JSON for request and response bodies:

```http
Content-Type: application/json
Accept: application/json
```

### Standard Response Structure

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0",
    "request_id": "req_123456"
  }
}
```

### Error Response Structure

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "airflow",
      "reason": "Value must be greater than 0"
    }
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "request_id": "req_123456"
  }
}
```

### HTTP Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation errors
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

## Data Types and Validation

### Common Data Types

```typescript
// User identification
type UserId = string; // UUID format

// Project identification
type ProjectId = string; // UUID format

// Calculation parameters
interface CalculationInput {
  airflow: number;          // CFM or L/s
  duct_type: 'round' | 'rectangular';
  friction_rate: number;    // in. w.g./100 ft or Pa/m
  units: 'imperial' | 'metric';
  material?: string;
  pressure_class?: 'low' | 'medium' | 'high';
}

// Standards compliance
interface ComplianceResult {
  standard: 'SMACNA' | 'NFPA' | 'ASHRAE';
  passed: boolean;
  value: number;
  limit: number;
  message: string;
}
```

### Input Validation Rules

- **Airflow**: Must be positive number, max 100,000 CFM
- **Friction Rate**: 0.01 to 2.0 in. w.g./100 ft
- **Duct Dimensions**: Within standard size ranges
- **Email**: Valid email format for authentication
- **Password**: Minimum 8 characters with complexity requirements

## Rate Limiting

API requests are rate-limited to ensure fair usage:

- **Authentication Endpoints**: 10 requests per minute per IP
- **Calculation Endpoints**: 100 requests per minute per user
- **Project Endpoints**: 60 requests per minute per user
- **Export Endpoints**: 10 requests per minute per user

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

## Versioning

APIs use semantic versioning with the version included in the URL path:

- **Current Version**: v1
- **Version Header**: `API-Version: 1.0.0`
- **Deprecation**: 6-month notice for breaking changes

## CORS Policy

Cross-Origin Resource Sharing (CORS) is configured for:

- **Allowed Origins**: Configured frontend domains
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Authorization, Content-Type, API-Version
- **Credentials**: Supported for authenticated requests

## WebSocket APIs

Real-time features use WebSocket connections:

### Connection Endpoint
```
wss://api.sizewise-suite.com/ws
```

### Authentication
```javascript
// WebSocket authentication
const ws = new WebSocket('wss://api.sizewise-suite.com/ws', [], {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### Message Format
```json
{
  "type": "calculation_update",
  "data": {
    "project_id": "proj_123",
    "calculation_id": "calc_456",
    "status": "completed",
    "results": { /* calculation results */ }
  }
}
```

## SDK and Client Libraries

### JavaScript/TypeScript SDK
```bash
npm install @sizewise-suite/api-client
```

```typescript
import { SizeWiseClient } from '@sizewise-suite/api-client';

const client = new SizeWiseClient({
  baseUrl: 'https://api.sizewise-suite.com/v1',
  apiKey: 'your-api-key'
});

// Calculate air duct size
const result = await client.calculations.airDuct({
  airflow: 1000,
  duct_type: 'rectangular',
  friction_rate: 0.08,
  units: 'imperial'
});
```

### Python SDK
```bash
pip install sizewise-suite-api
```

```python
from sizewise_suite import SizeWiseClient

client = SizeWiseClient(
    base_url='https://api.sizewise-suite.com/v1',
    api_key='your-api-key'
)

# Calculate air duct size
result = client.calculations.air_duct(
    airflow=1000,
    duct_type='rectangular',
    friction_rate=0.08,
    units='imperial'
)
```

## Testing and Development

### API Testing Tools
- **Postman Collection**: Available for all endpoints
- **OpenAPI Specification**: Swagger documentation
- **Mock Server**: Development testing environment

### Development Environment
```bash
# Start all services
npm run dev:all

# Test API endpoints
npm run test:api

# Generate API documentation
npm run docs:api
```

## Support and Resources

### Documentation Links
- **[Authentication Guide](authentication.md)** - Complete authentication implementation
- **[Calculation Examples](calculations.md#examples)** - Calculation API usage examples
- **[Error Handling](error-handling.md)** - Error codes and troubleshooting
- **[Migration Guide](migration.md)** - API version migration instructions

### Getting Help
- **API Status**: [status.sizewise-suite.com](https://status.sizewise-suite.com)
- **Developer Forum**: [developers.sizewise-suite.com](https://developers.sizewise-suite.com)
- **Support Email**: api-support@sizewise-suite.com
- **GitHub Issues**: [github.com/sizewise-suite/api-issues](https://github.com/sizewise-suite/api-issues)

---

*This API reference is continuously updated. For the latest information, check the version timestamp and changelog in each section.*
