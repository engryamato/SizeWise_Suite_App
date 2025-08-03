# SizeWise Suite - API Reference

**Version**: 2.0  
**Base URL**: `http://localhost:5000/api` (development)  
**Authentication**: JWT Bearer Token  
**Content-Type**: `application/json`  

## Overview

The SizeWise Suite API provides comprehensive endpoints for HVAC calculations, analytics, authentication, and system management. All endpoints follow RESTful conventions and return standardized JSON responses.

## Authentication

### JWT Token Authentication
```http
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "licenseKey": "optional_license_key"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "tier": "pro",
      "permissions": ["calculate", "export", "analytics"]
    },
    "expiresAt": "2025-08-04T12:00:00Z"
  }
}
```

#### POST /auth/refresh
Refresh JWT token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

#### POST /auth/logout
Logout and invalidate token.

**Headers:** `Authorization: Bearer <token>`

## HVAC Calculations

### Core Calculation Endpoints

#### POST /hvac/calculate/duct-sizing
Calculate duct sizing based on airflow requirements.

**Request Body:**
```json
{
  "airflow": 1000,
  "velocity": 800,
  "shape": "rectangular",
  "material": "galvanized_steel",
  "insulation": {
    "type": "fiberglass",
    "thickness": 2
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dimensions": {
      "width": 12,
      "height": 8,
      "diameter": null
    },
    "area": 96,
    "perimeter": 40,
    "velocity": 781.25,
    "pressureLoss": 0.08,
    "calculations": {
      "reynoldsNumber": 52000,
      "frictionFactor": 0.019,
      "roughness": 0.0003
    }
  }
}
```

#### POST /hvac/calculate/load-calculation
Perform heating/cooling load calculations.

**Request Body:**
```json
{
  "building": {
    "area": 2500,
    "height": 10,
    "occupancy": 50,
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "climate_zone": "4A"
    }
  },
  "envelope": {
    "walls": {
      "uValue": 0.08,
      "area": 1200
    },
    "windows": {
      "uValue": 0.35,
      "area": 300,
      "shgc": 0.4
    },
    "roof": {
      "uValue": 0.05,
      "area": 2500
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "heatingLoad": 85000,
    "coolingLoad": 120000,
    "breakdown": {
      "transmission": 45000,
      "infiltration": 25000,
      "ventilation": 30000,
      "internal": 20000
    },
    "peakConditions": {
      "heating": {
        "outdoor": -5,
        "indoor": 70
      },
      "cooling": {
        "outdoor": 95,
        "indoor": 75
      }
    }
  }
}
```

#### POST /hvac/calculate/pressure-loss
Calculate pressure loss through ductwork system.

**Request Body:**
```json
{
  "ductwork": [
    {
      "type": "straight",
      "length": 50,
      "diameter": 12,
      "roughness": 0.0003
    },
    {
      "type": "elbow",
      "angle": 90,
      "radius": 6
    }
  ],
  "airflow": 1000,
  "density": 0.075
}
```

## Analytics

### Analytics Endpoints

#### GET /analytics/dashboard
Get dashboard analytics data.

**Query Parameters:**
- `timeRange`: `7d`, `30d`, `90d`, `1y`
- `metrics`: `energy,performance,financial`

**Response:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalProjects": 156,
      "energySavings": 2.4,
      "costSavings": 125000,
      "efficiency": 94.2
    },
    "trends": {
      "energy": [
        { "date": "2025-07-01", "value": 2.1 },
        { "date": "2025-07-02", "value": 2.3 }
      ]
    },
    "lastUpdated": "2025-08-03T10:30:00Z"
  }
}
```

#### GET /analytics/energy
Get energy analytics data.

**Response:**
```json
{
  "success": true,
  "data": {
    "consumption": {
      "current": 1250,
      "previous": 1380,
      "change": -9.4
    },
    "efficiency": {
      "hvac": 92.5,
      "lighting": 88.3,
      "overall": 90.1
    },
    "breakdown": {
      "heating": 45,
      "cooling": 35,
      "ventilation": 15,
      "other": 5
    }
  }
}
```

## Compliance

### Compliance Checking Endpoints

#### POST /compliance/check
Check design compliance against standards.

**Request Body:**
```json
{
  "standard": "ASHRAE_90.1",
  "design": {
    "hvacSystem": {
      "type": "VAV",
      "efficiency": 0.85,
      "controls": ["economizer", "demand_control"]
    },
    "envelope": {
      "walls": { "uValue": 0.08 },
      "windows": { "uValue": 0.35, "shgc": 0.4 }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "compliant": true,
    "score": 92,
    "checks": [
      {
        "requirement": "Wall U-Value",
        "required": "≤ 0.10",
        "actual": 0.08,
        "status": "pass"
      },
      {
        "requirement": "HVAC Efficiency",
        "required": "≥ 0.80",
        "actual": 0.85,
        "status": "pass"
      }
    ],
    "recommendations": [
      "Consider upgrading to higher efficiency equipment for additional savings"
    ]
  }
}
```

## Export and Reporting

### Export Endpoints

#### POST /export/report
Generate and export calculation reports.

**Request Body:**
```json
{
  "format": "pdf",
  "calculations": ["calc_id_1", "calc_id_2"],
  "template": "standard",
  "options": {
    "includeCharts": true,
    "includeRawData": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "report_123",
    "downloadUrl": "/api/export/download/report_123",
    "expiresAt": "2025-08-04T12:00:00Z"
  }
}
```

#### GET /export/download/{reportId}
Download generated report.

**Response:** Binary file download

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "airflow",
      "reason": "Must be greater than 0"
    },
    "timestamp": "2025-08-03T10:30:00Z",
    "requestId": "req_123456"
  }
}
```

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Invalid input data | 400 |
| `AUTHENTICATION_ERROR` | Invalid credentials | 401 |
| `AUTHORIZATION_ERROR` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |
| `CALCULATION_ERROR` | HVAC calculation failed | 422 |
| `LICENSE_ERROR` | License validation failed | 402 |

## Rate Limiting

### Rate Limits
- **Authentication**: 5 requests per minute
- **Calculations**: 100 requests per hour
- **Analytics**: 1000 requests per hour
- **Export**: 10 requests per hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1691064000
```

## Pagination

### Paginated Endpoints
For endpoints returning lists, use pagination parameters:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field
- `order`: `asc` or `desc`

**Response Format:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "pages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Webhooks

### Webhook Events
- `calculation.completed`
- `report.generated`
- `compliance.checked`
- `user.authenticated`

### Webhook Payload
```json
{
  "event": "calculation.completed",
  "timestamp": "2025-08-03T10:30:00Z",
  "data": {
    "calculationId": "calc_123",
    "userId": "user_456",
    "type": "duct_sizing",
    "status": "completed"
  }
}
```

## SDK and Client Libraries

### JavaScript/TypeScript
```typescript
import { SizeWiseAPI } from '@sizewise/api-client';

const api = new SizeWiseAPI({
  baseURL: 'http://localhost:5000/api',
  token: 'your_jwt_token'
});

const result = await api.hvac.calculateDuctSizing({
  airflow: 1000,
  velocity: 800,
  shape: 'rectangular'
});
```

### Python
```python
from sizewise_api import SizeWiseClient

client = SizeWiseClient(
    base_url='http://localhost:5000/api',
    token='your_jwt_token'
)

result = client.hvac.calculate_duct_sizing(
    airflow=1000,
    velocity=800,
    shape='rectangular'
)
```

## Testing

### API Testing
Use the provided Postman collection or test with curl:

```bash
# Authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# HVAC Calculation
curl -X POST http://localhost:5000/api/hvac/calculate/duct-sizing \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"airflow":1000,"velocity":800,"shape":"rectangular"}'
```

## Support

### API Support
- **Documentation**: [API Docs](./api-reference.md)
- **Troubleshooting**: [Common Issues](../troubleshooting/api-issues.md)
- **Contact**: api-support@sizewise.com

### Version History
- **v2.0**: Modernized API with standardized responses
- **v1.5**: Added analytics and compliance endpoints
- **v1.0**: Initial API release

---

**Last Updated**: 2025-08-03  
**API Version**: 2.0  
**Status**: Production Ready
