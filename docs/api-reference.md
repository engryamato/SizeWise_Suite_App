# SizeWise Suite API Reference

Complete API documentation for the SizeWise Suite backend services.

## Base URL

- **Development**: `http://localhost:8000`
- **Staging**: `https://staging-api.sizewise.com`
- **Production**: `https://api.sizewise.com`

## Authentication

All API endpoints require authentication using JWT tokens, except for public endpoints.

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Authentication Flow

1. **Login**: POST `/auth/login` with credentials
2. **Receive**: JWT token in response
3. **Use**: Include token in Authorization header
4. **Refresh**: POST `/auth/refresh` when token expires

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "room_area",
      "issue": "must be positive number"
    }
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "request_id": "req_123456"
}
```

### Error Codes

- `VALIDATION_ERROR`: Invalid input parameters
- `AUTHENTICATION_ERROR`: Invalid or missing authentication
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Authentication Endpoints

### POST /auth/login

Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_here",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "engineer",
    "permissions": ["calculate", "collaborate", "export"]
  }
}
```

### POST /auth/refresh

Refresh expired JWT token.

**Request:**
```json
{
  "refresh_token": "refresh_token_here"
}
```

**Response:**
```json
{
  "access_token": "new_jwt_token",
  "expires_in": 3600
}
```

### POST /auth/logout

Logout and invalidate tokens.

**Request:**
```json
{
  "refresh_token": "refresh_token_here"
}
```

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

## HVAC Calculation Endpoints

### POST /api/calculations/air-duct

Calculate air duct sizing based on room requirements.

**Request:**
```json
{
  "room_area": 500,
  "cfm_required": 2000,
  "duct_material": "galvanized_steel",
  "pressure_class": "low",
  "velocity_limit": 1000,
  "aspect_ratio": 1.5
}
```

**Parameters:**
- `room_area` (number, required): Room area in square feet
- `cfm_required` (number, required): Required airflow in CFM
- `duct_material` (string, required): Material type (`galvanized_steel`, `aluminum`, `flexible`)
- `pressure_class` (string, optional): Pressure class (`low`, `medium`, `high`)
- `velocity_limit` (number, optional): Maximum velocity in FPM
- `aspect_ratio` (number, optional): Width to height ratio

**Response:**
```json
{
  "duct_size": {
    "width": 14,
    "height": 10,
    "diameter": null,
    "area": 140
  },
  "velocity": 800,
  "pressure_drop": 0.08,
  "material": "galvanized_steel",
  "reynolds_number": 45000,
  "friction_factor": 0.019,
  "calculation_id": "calc_123456",
  "created_at": "2024-01-01T12:00:00Z"
}
```

### POST /api/calculations/load

Calculate heating and cooling loads for a building.

**Request:**
```json
{
  "building_area": 5000,
  "occupancy": 50,
  "building_type": "office",
  "climate_zone": "zone_4a",
  "insulation": {
    "walls": 25,
    "roof": 30,
    "windows": 0.3
  },
  "orientation": "north",
  "internal_loads": {
    "lighting": 1.2,
    "equipment": 0.8,
    "people": 400
  }
}
```

**Parameters:**
- `building_area` (number, required): Building area in square feet
- `occupancy` (number, required): Number of occupants
- `building_type` (string, required): Building type (`office`, `retail`, `warehouse`, `residential`)
- `climate_zone` (string, required): ASHRAE climate zone
- `insulation` (object, optional): Insulation R-values
- `orientation` (string, optional): Building orientation
- `internal_loads` (object, optional): Internal load densities

**Response:**
```json
{
  "heating_load": 125000,
  "cooling_load": 170000,
  "sensible_load": 127500,
  "latent_load": 42500,
  "peak_heating": 140000,
  "peak_cooling": 185000,
  "breakdown": {
    "walls": 37500,
    "windows": 25000,
    "roof": 31250,
    "infiltration": 18750,
    "occupancy": 20000,
    "lighting": 15000,
    "equipment": 10000
  },
  "monthly_loads": [
    {"month": "January", "heating": 140000, "cooling": 0},
    {"month": "February", "heating": 120000, "cooling": 0}
  ],
  "calculation_id": "calc_789012",
  "created_at": "2024-01-01T12:00:00Z"
}
```

### POST /api/calculations/equipment

Size HVAC equipment based on calculated loads.

**Request:**
```json
{
  "heating_load": 125000,
  "cooling_load": 170000,
  "system_type": "heat_pump",
  "efficiency_requirements": {
    "heating_cop": 3.0,
    "cooling_seer": 14
  },
  "safety_factor": 1.15,
  "altitude": 1000
}
```

**Response:**
```json
{
  "air_handler": {
    "cfm": 5667,
    "model": "AH-5600-E",
    "efficiency": 0.85,
    "static_pressure": 0.5,
    "motor_hp": 3.0
  },
  "heating_equipment": {
    "capacity": 143750,
    "type": "heat_pump",
    "efficiency": 3.2,
    "model": "HP-144-32",
    "backup_heat": 50000
  },
  "cooling_equipment": {
    "capacity": 195500,
    "type": "heat_pump",
    "efficiency": 16,
    "model": "HP-196-16",
    "refrigerant": "R-410A"
  },
  "ductwork": {
    "supply_cfm": 5667,
    "return_cfm": 5100,
    "main_trunk": {"width": 24, "height": 16},
    "branches": [
      {"zone": "Zone 1", "cfm": 1200, "size": "12x8"},
      {"zone": "Zone 2", "cfm": 1000, "size": "10x8"}
    ]
  },
  "calculation_id": "calc_345678",
  "created_at": "2024-01-01T12:00:00Z"
}
```

## Project Management Endpoints

### GET /api/projects

List user projects with pagination and filtering.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `search` (string, optional): Search term
- `status` (string, optional): Project status filter
- `sort` (string, optional): Sort field (`name`, `created_at`, `updated_at`)
- `order` (string, optional): Sort order (`asc`, `desc`)

**Response:**
```json
{
  "projects": [
    {
      "id": "proj_123",
      "name": "Office Building HVAC",
      "description": "HVAC design for 50,000 sq ft office",
      "status": "active",
      "building_area": 50000,
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-02T10:30:00Z",
      "owner": {
        "id": "user123",
        "name": "John Doe"
      },
      "calculations_count": 15,
      "collaborators_count": 3
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

### POST /api/projects

Create a new project.

**Request:**
```json
{
  "name": "New HVAC Project",
  "description": "Description of the project",
  "building_area": 10000,
  "building_type": "office",
  "location": {
    "address": "123 Main St, City, State",
    "climate_zone": "zone_4a",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "settings": {
    "units": "imperial",
    "precision": 2,
    "safety_factors": {
      "heating": 1.2,
      "cooling": 1.15
    }
  }
}
```

**Response:**
```json
{
  "id": "proj_456",
  "name": "New HVAC Project",
  "description": "Description of the project",
  "status": "active",
  "building_area": 10000,
  "building_type": "office",
  "location": {
    "address": "123 Main St, City, State",
    "climate_zone": "zone_4a",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "settings": {
    "units": "imperial",
    "precision": 2,
    "safety_factors": {
      "heating": 1.2,
      "cooling": 1.15
    }
  },
  "owner": {
    "id": "user123",
    "name": "John Doe"
  },
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### GET /api/projects/{project_id}

Get detailed project information.

**Response:**
```json
{
  "id": "proj_123",
  "name": "Office Building HVAC",
  "description": "HVAC design for 50,000 sq ft office",
  "status": "active",
  "building_area": 50000,
  "building_type": "office",
  "location": {
    "address": "456 Business Ave, City, State",
    "climate_zone": "zone_4a",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "calculations": [
    {
      "id": "calc_123",
      "type": "air_duct",
      "created_at": "2024-01-01T12:00:00Z",
      "parameters": {"room_area": 500, "cfm_required": 2000},
      "results": {"duct_size": {"width": 14, "height": 10}}
    }
  ],
  "collaborators": [
    {
      "id": "user456",
      "name": "Jane Smith",
      "role": "editor",
      "joined_at": "2024-01-01T14:00:00Z"
    }
  ],
  "owner": {
    "id": "user123",
    "name": "John Doe"
  },
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-02T10:30:00Z"
}
```

## Collaboration Endpoints

### WebSocket /ws/collaboration/{room_id}

Real-time collaboration WebSocket connection.

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/collaboration/proj_123');
```

**Authentication:**
Send JWT token immediately after connection:
```json
{
  "type": "auth",
  "token": "jwt_token_here"
}
```

**Events:**

#### User Events
```json
{
  "type": "user_joined",
  "user": {
    "id": "user123",
    "name": "John Doe",
    "color": "#3B82F6"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### Cursor Events
```json
{
  "type": "cursor_move",
  "user_id": "user123",
  "position": {
    "x": 100,
    "y": 200,
    "element": "input_room_area"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### Document Events
```json
{
  "type": "document_change",
  "operation": {
    "type": "insert",
    "path": "calculations.0.parameters.room_area",
    "value": 500,
    "position": 0
  },
  "user_id": "user123",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Analytics Endpoints

### GET /api/analytics/dashboard

Get comprehensive dashboard analytics.

**Query Parameters:**
- `time_range` (string, optional): Time range (`7d`, `30d`, `90d`, `1y`)
- `project_id` (string, optional): Filter by project

**Response:**
```json
{
  "performance": {
    "overall_score": 87,
    "efficiency_rating": "A+",
    "capacity_utilization": 78,
    "system_reliability": 94
  },
  "energy": {
    "total_consumption": 125000,
    "consumption_trend": -8.5,
    "efficiency_improvement": 12.3,
    "carbon_footprint": 45000
  },
  "financial": {
    "total_project_value": 2500000,
    "cost_savings": 125000,
    "roi": 15.8,
    "payback_period": 6.3
  },
  "compliance": {
    "overall_status": "compliant",
    "audit_score": 89,
    "violations_count": 2
  }
}
```

### GET /api/analytics/energy

Get detailed energy analytics.

**Response:**
```json
{
  "consumption": {
    "total": 125000,
    "trend": -8.5,
    "monthly_data": [
      {"month": "Jan", "consumption": 10500, "cost": 1312},
      {"month": "Feb", "consumption": 9800, "cost": 1225}
    ]
  },
  "efficiency": {
    "current": 87,
    "target": 90,
    "improvement": 12.3
  },
  "carbon_footprint": {
    "total": 45000,
    "reduction": 15.2,
    "renewable_percentage": 35
  }
}
```

## AI Optimization Endpoints

### POST /api/ai/optimize

Get AI-powered optimization recommendations.

**Request:**
```json
{
  "hvac_system": {
    "type": "central_air",
    "capacity": 50000,
    "efficiency": 0.85
  },
  "building_data": {
    "area": 10000,
    "occupancy": 100,
    "insulation": 25
  },
  "operational_data": {
    "operating_hours": 8760,
    "energy_cost": 0.12,
    "maintenance_cost": 5000
  }
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "type": "equipment_upgrade",
      "description": "Upgrade to high-efficiency heat pump",
      "energy_savings": 15.2,
      "cost_savings": 12000,
      "implementation_cost": 45000,
      "payback_period": 3.75,
      "confidence": 0.89
    }
  ],
  "predicted_performance": {
    "energy_consumption": 95000,
    "efficiency_rating": 92,
    "carbon_reduction": 8500
  },
  "analysis_id": "ai_123456",
  "created_at": "2024-01-01T12:00:00Z"
}
```

## Rate Limiting

API endpoints are rate limited to ensure fair usage:

- **Authentication**: 10 requests per minute
- **Calculations**: 100 requests per hour
- **Projects**: 1000 requests per hour
- **Analytics**: 500 requests per hour

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks

Configure webhooks to receive real-time notifications:

### POST /api/webhooks

Create webhook endpoint.

**Request:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["calculation.completed", "project.updated"],
  "secret": "webhook_secret"
}
```

### Webhook Events

- `calculation.completed`: Calculation finished
- `project.updated`: Project modified
- `collaboration.user_joined`: User joined collaboration
- `ai.analysis_completed`: AI analysis finished

## SDK and Libraries

Official SDKs available for:
- JavaScript/TypeScript
- Python
- C#
- Java

Example usage:
```javascript
import { SizeWiseAPI } from '@sizewise/sdk';

const api = new SizeWiseAPI({
  apiKey: 'your_api_key',
  baseURL: 'https://api.sizewise.com'
});

const result = await api.calculations.airDuct({
  roomArea: 500,
  cfmRequired: 2000,
  ductMaterial: 'galvanized_steel'
});
```
