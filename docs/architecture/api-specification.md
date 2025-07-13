# API Specification - Air Duct Sizer

_Last updated: 2025-07-13_  
_Maintainer: Development Team_

---

## Overview

This document defines the REST API endpoints, request/response formats, and data contracts for the Air Duct Sizer backend services.

**Base URL**: `https://api.sizewise-suite.com/v1`  
**Authentication**: JWT Bearer tokens  
**Content-Type**: `application/json`

---

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "company": "ABC Mechanical" // optional
}
```

**Response (201)**:
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "tier": "free",
    "created_at": "2025-07-13T18:00:00Z"
  },
  "token": "jwt-token-string"
}
```

### POST /auth/login
Authenticate user and receive JWT token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200)**:
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "tier": "pro",
    "subscription_expires": "2025-12-31T23:59:59Z"
  },
  "token": "jwt-token-string"
}
```

### POST /auth/refresh
Refresh JWT token.

**Headers**: `Authorization: Bearer <token>`

**Response (200)**:
```json
{
  "success": true,
  "token": "new-jwt-token-string"
}
```

---

## Project Management Endpoints

### GET /projects
List user's projects with pagination.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search term for project names

**Response (200)**:
```json
{
  "success": true,
  "projects": [
    {
      "id": "project-uuid",
      "name": "Office Building HVAC",
      "location": "New York, NY",
      "created_at": "2025-07-13T18:00:00Z",
      "last_modified": "2025-07-13T19:30:00Z",
      "room_count": 5,
      "segment_count": 23
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### POST /projects
Create a new project.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "project_name": "New Office Project",
  "user_name": "John Doe",
  "contractor_name": "ABC Mechanical",
  "project_location": "Salt Lake City, UT",
  "codes": ["SMACNA", "ASHRAE"],
  "computational_properties": {
    "default_velocity": 1200,
    "pressure_class": "Medium",
    "altitude": 4200,
    "r_value": 4.2,
    "friction_rate": 0.08
  }
}
```

**Response (201)**:
```json
{
  "success": true,
  "project": {
    "id": "project-uuid",
    "project_name": "New Office Project",
    "user_name": "John Doe",
    "contractor_name": "ABC Mechanical",
    "project_location": "Salt Lake City, UT",
    "codes": ["SMACNA", "ASHRAE"],
    "computational_properties": { /* ... */ },
    "rooms": [],
    "segments": [],
    "equipment": [],
    "created_at": "2025-07-13T18:00:00Z",
    "last_modified": "2025-07-13T18:00:00Z"
  }
}
```

### GET /projects/{project_id}
Get project details with full data.

**Headers**: `Authorization: Bearer <token>`

**Response (200)**:
```json
{
  "success": true,
  "project": {
    // Full project object as defined in data-models-schemas.md
  }
}
```

### PUT /projects/{project_id}
Update project data.

**Headers**: `Authorization: Bearer <token>`

**Request Body**: Full or partial project object

**Response (200)**:
```json
{
  "success": true,
  "project": {
    // Updated project object
  }
}
```

### DELETE /projects/{project_id}
Delete a project.

**Headers**: `Authorization: Bearer <token>`

**Response (204)**: No content

---

## Calculation Endpoints

### POST /calculations/air-duct
Perform air duct sizing calculation.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "airflow": 1000,
  "duct_type": "rectangular",
  "friction_rate": 0.08,
  "units": "imperial",
  "material": "galvanized_steel",
  "insulation": false
}
```

**Response (200)**:
```json
{
  "success": true,
  "input_data": { /* original input */ },
  "results": {
    "width": 12,
    "height": 10,
    "area": 0.833,
    "velocity": 1200,
    "pressure_loss": 0.08,
    "equivalent_diameter": 10.9
  },
  "compliance": {
    "SMACNA": {
      "velocity_check": {
        "passed": true,
        "value": 1200,
        "limit": 2500,
        "message": "Velocity within acceptable range"
      }
    }
  },
  "warnings": [],
  "errors": []
}
```

### POST /calculations/validate
Validate project data and return warnings.

**Headers**: `Authorization: Bearer <token>`

**Request Body**: Project object or partial data

**Response (200)**:
```json
{
  "success": true,
  "validation_results": [
    {
      "object_id": "segment-1",
      "object_type": "segment",
      "warnings": [
        {
          "rule_id": "VELOCITY_HIGH",
          "message": "Velocity exceeds SMACNA recommended limit",
          "severity": "warning",
          "code_ref": "SMACNA Table 4-1"
        }
      ]
    }
  ]
}
```

---

## Export Endpoints

### POST /exports/pdf
Generate PDF report.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "project_id": "project-uuid",
  "format": "full", // "full" | "summary" | "bom"
  "include_drawing": true,
  "include_calculations": true
}
```

**Response (200)**:
```json
{
  "success": true,
  "export_id": "export-uuid",
  "download_url": "https://cdn.example.com/exports/report.pdf",
  "expires_at": "2025-07-14T18:00:00Z"
}
```

### POST /exports/excel
Generate Excel/CSV export.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "project_id": "project-uuid",
  "format": "xlsx", // "xlsx" | "csv"
  "sheets": ["rooms", "segments", "equipment", "bom"]
}
```

**Response (200)**:
```json
{
  "success": true,
  "export_id": "export-uuid",
  "download_url": "https://cdn.example.com/exports/data.xlsx",
  "expires_at": "2025-07-14T18:00:00Z"
}
```

### GET /exports/{export_id}/status
Check export generation status.

**Headers**: `Authorization: Bearer <token>`

**Response (200)**:
```json
{
  "success": true,
  "status": "completed", // "pending" | "processing" | "completed" | "failed"
  "progress": 100,
  "download_url": "https://cdn.example.com/exports/file.pdf",
  "error_message": null
}
```

---

## Reference Data Endpoints

### GET /reference/materials
Get available duct materials.

**Response (200)**:
```json
{
  "success": true,
  "materials": {
    "galvanized_steel": {
      "name": "Galvanized Steel",
      "roughness": 0.0003,
      "description": "Standard galvanized steel ductwork"
    }
    // ... more materials
  }
}
```

### GET /reference/standards
Get available codes and standards.

**Response (200)**:
```json
{
  "success": true,
  "standards": [
    {
      "code": "SMACNA",
      "name": "SMACNA HVAC Duct Construction Standards",
      "version": "4th Edition",
      "description": "Industry standard for duct construction"
    }
    // ... more standards
  ]
}
```

### GET /reference/sizes/{duct_type}
Get standard duct sizes.

**Path Parameters**:
- `duct_type`: "round" | "rectangular"

**Response (200)**:
```json
{
  "success": true,
  "duct_type": "rectangular",
  "sizes": [
    {"width": 6, "height": 4},
    {"width": 8, "height": 6}
    // ... more sizes
  ]
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data provided",
    "details": {
      "field": "airflow",
      "reason": "Must be a positive number"
    }
  }
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED`: Missing or invalid JWT token
- `AUTHORIZATION_FAILED`: Insufficient permissions for operation
- `VALIDATION_ERROR`: Invalid request data
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `TIER_LIMIT_EXCEEDED`: Operation exceeds user tier limits
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server-side error

---

## Rate Limiting

### Free Tier Limits
- Authentication: 10 requests/minute
- Calculations: 100 requests/hour
- Exports: 5 requests/hour
- Projects: 50 requests/hour

### Pro Tier Limits
- Authentication: 20 requests/minute
- Calculations: 1000 requests/hour
- Exports: 50 requests/hour
- Projects: 500 requests/hour

Rate limit headers included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Window reset time (Unix timestamp)

---

## Versioning

API versioning is handled through URL path (`/v1/`). Breaking changes will increment the major version number. Backward compatibility is maintained for at least 6 months after new version release.

---

*This API specification serves as the contract between frontend and backend systems. Update it whenever endpoints are added, modified, or deprecated.*
