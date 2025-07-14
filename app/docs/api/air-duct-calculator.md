# Air Duct Calculator API

The Air Duct Calculator API provides programmatic access to HVAC duct sizing calculations with SMACNA standards compliance.

## Base URL

```
http://localhost:5000/api/calculations/air-duct
```

## Authentication

Currently, no authentication is required for the API. This may change in future versions.

## Endpoints

### Calculate Duct Size

Calculate optimal duct dimensions for given parameters.

#### Request

```http
POST /api/calculations/air-duct
Content-Type: application/json
```

#### Request Body

```json
{
  "airflow": 1000,
  "duct_type": "rectangular",
  "friction_rate": 0.08,
  "units": "imperial",
  "material": "galvanized_steel",
  "pressure_class": "low"
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `airflow` | number | Yes | Airflow rate (CFM for imperial, L/s for metric) |
| `duct_type` | string | Yes | "rectangular" or "round" |
| `friction_rate` | number | Yes | Friction rate (in. w.g./100 ft for imperial, Pa/m for metric) |
| `units` | string | Yes | "imperial" or "metric" |
| `material` | string | No | Duct material type (default: "galvanized_steel") |
| `pressure_class` | string | No | "low", "medium", or "high" (default: "low") |

#### Response

```json
{
  "success": true,
  "input_data": {
    "airflow": 1000,
    "duct_type": "rectangular",
    "friction_rate": 0.08,
    "units": "imperial"
  },
  "results": {
    "duct_size": "16\" x 6\"",
    "width": {
      "value": 16.0,
      "unit": "in"
    },
    "height": {
      "value": 6.0,
      "unit": "in"
    },
    "area": {
      "value": 0.67,
      "unit": "sq_ft"
    },
    "velocity": {
      "value": 1500.0,
      "unit": "fpm"
    },
    "equivalent_diameter": {
      "value": 10.41,
      "unit": "in"
    },
    "pressure_loss": {
      "value": 1002.59,
      "unit": "in_wg_per_100ft"
    }
  },
  "compliance": {
    "smacna": {
      "velocity": {
        "passed": true,
        "value": 1500.0,
        "limit": 2500,
        "message": "Velocity within SMACNA limits"
      }
    }
  },
  "warnings": [],
  "errors": [],
  "metadata": {
    "calculated_at": "2024-01-15T10:30:00.000Z",
    "version": "0.1.0"
  }
}
```

#### Error Response

```json
{
  "success": false,
  "errors": [
    "Airflow must be a positive number",
    "Duct type must be 'rectangular' or 'round'"
  ],
  "warnings": []
}
```

### Validate Input

Validate input parameters without performing calculation.

#### Request

```http
POST /api/calculations/air-duct/validate
Content-Type: application/json
```

#### Request Body

```json
{
  "airflow": 25,
  "duct_type": "rectangular",
  "friction_rate": 0.08,
  "units": "imperial"
}
```

#### Response

```json
{
  "is_valid": true,
  "errors": [],
  "warnings": [
    "Very low airflow - verify this is correct"
  ]
}
```

### Get Standard Sizes

Retrieve standard duct sizes for a given type.

#### Request

```http
GET /api/calculations/air-duct/standard-sizes/{duct_type}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `duct_type` | string | Yes | "rectangular" or "round" |

#### Response

```json
{
  "success": true,
  "duct_type": "round",
  "sizes": [4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 24, 26, 28, 30, 32, 34, 36]
}
```

### Get Materials

Retrieve available duct materials and their properties.

#### Request

```http
GET /api/calculations/air-duct/materials
```

#### Response

```json
{
  "success": true,
  "materials": {
    "galvanized_steel": {
      "name": "Galvanized Steel",
      "roughness": 0.0003,
      "description": "Standard galvanized steel ductwork"
    },
    "aluminum": {
      "name": "Aluminum",
      "roughness": 0.0002,
      "description": "Lightweight aluminum ductwork"
    },
    "stainless_steel": {
      "name": "Stainless Steel",
      "roughness": 0.0002,
      "description": "Corrosion-resistant stainless steel"
    },
    "flexible": {
      "name": "Flexible Duct",
      "roughness": 0.003,
      "description": "Flexible ductwork for short runs"
    }
  }
}
```

## Data Models

### Input Data Model

```typescript
interface AirDuctInput {
  airflow: number;           // CFM (imperial) or L/s (metric)
  duct_type: "rectangular" | "round";
  friction_rate: number;     // in. w.g./100 ft (imperial) or Pa/m (metric)
  units: "imperial" | "metric";
  material?: string;         // Optional, default: "galvanized_steel"
  pressure_class?: "low" | "medium" | "high"; // Optional, default: "low"
}
```

### Result Data Model

```typescript
interface AirDuctResult {
  duct_size: string;         // Human-readable size description
  area: ValueWithUnit;       // Cross-sectional area
  velocity: ValueWithUnit;   // Air velocity
  equivalent_diameter: ValueWithUnit; // Hydraulic diameter
  pressure_loss: ValueWithUnit; // Friction loss per unit length
  
  // Rectangular ducts only
  width?: ValueWithUnit;
  height?: ValueWithUnit;
  
  // Round ducts only
  diameter?: ValueWithUnit;
}

interface ValueWithUnit {
  value: number;
  unit: string;
}
```

### Compliance Data Model

```typescript
interface ComplianceResult {
  smacna: {
    velocity: {
      passed: boolean;
      value: number;
      limit: number;
      message: string;
    };
  };
}
```

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input parameters |
| 422 | Unprocessable Entity - Validation errors |
| 500 | Internal Server Error |

### Error Types

#### Validation Errors

- **Missing Required Field**: Required parameter not provided
- **Invalid Type**: Parameter type doesn't match expected type
- **Out of Range**: Parameter value outside acceptable range
- **Invalid Combination**: Parameter combination is not valid

#### Calculation Errors

- **Calculation Failed**: Internal calculation error
- **Unrealistic Result**: Calculation produces impractical results
- **Standards Violation**: Result violates industry standards

## Rate Limiting

Currently, no rate limiting is implemented. This may be added in future versions.

## Versioning

The API uses semantic versioning. The current version is included in all responses under `metadata.version`.

## Examples

### Basic Rectangular Duct Calculation

```bash
curl -X POST http://localhost:5000/api/calculations/air-duct \
  -H "Content-Type: application/json" \
  -d '{
    "airflow": 1000,
    "duct_type": "rectangular",
    "friction_rate": 0.08,
    "units": "imperial"
  }'
```

### Round Duct with High Friction

```bash
curl -X POST http://localhost:5000/api/calculations/air-duct \
  -H "Content-Type: application/json" \
  -d '{
    "airflow": 2000,
    "duct_type": "round",
    "friction_rate": 0.2,
    "units": "imperial",
    "material": "stainless_steel"
  }'
```

### Metric Units Calculation

```bash
curl -X POST http://localhost:5000/api/calculations/air-duct \
  -H "Content-Type: application/json" \
  -d '{
    "airflow": 500,
    "duct_type": "rectangular",
    "friction_rate": 1.0,
    "units": "metric"
  }'
```

### Input Validation

```bash
curl -X POST http://localhost:5000/api/calculations/air-duct/validate \
  -H "Content-Type: application/json" \
  -d '{
    "airflow": 25,
    "duct_type": "rectangular",
    "friction_rate": 0.08,
    "units": "imperial"
  }'
```

## Integration Examples

### JavaScript/TypeScript

```typescript
class AirDuctCalculator {
  private baseUrl = 'http://localhost:5000/api/calculations/air-duct';
  
  async calculate(input: AirDuctInput): Promise<AirDuctResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
  
  async validate(input: AirDuctInput): Promise<ValidationResult> {
    const response = await fetch(`${this.baseUrl}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    
    return await response.json();
  }
}
```

### Python

```python
import requests
from typing import Dict, Any

class AirDuctCalculator:
    def __init__(self, base_url: str = "http://localhost:5000/api/calculations/air-duct"):
        self.base_url = base_url
    
    def calculate(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        response = requests.post(
            self.base_url,
            json=input_data,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        return response.json()
    
    def validate(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/validate",
            json=input_data,
            headers={"Content-Type": "application/json"}
        )
        return response.json()

# Usage example
calculator = AirDuctCalculator()
result = calculator.calculate({
    "airflow": 1000,
    "duct_type": "rectangular",
    "friction_rate": 0.08,
    "units": "imperial"
})
```

## Changelog

### Version 0.1.0
- Initial API implementation
- Basic duct sizing calculations
- SMACNA standards compliance
- Input validation
- Standard sizes and materials endpoints
