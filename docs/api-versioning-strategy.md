# API Versioning Strategy - SizeWise Suite

## Overview

SizeWise Suite implements a comprehensive API versioning strategy to ensure backward compatibility, smooth migrations, and clear deprecation policies. This document outlines the versioning approach, implementation details, and migration procedures.

## Versioning Strategy

### Semantic Versioning

SizeWise Suite APIs follow semantic versioning (SemVer) with the format `MAJOR.MINOR.PATCH`:

- **MAJOR**: Incompatible API changes
- **MINOR**: Backward-compatible functionality additions
- **PATCH**: Backward-compatible bug fixes

### Versioning Methods

#### 1. URL Path Versioning (Primary)
```
/api/v1/calculations
/api/v2/calculations
```

#### 2. Header Versioning (Alternative)
```
API-Version: 1.0.0
```

#### 3. Query Parameter Versioning (Fallback)
```
/api/calculations?version=1.0.0
```

#### 4. Content-Type Versioning (Specialized)
```
Content-Type: application/vnd.sizewise.v1.0.0+json
```

## Current API Versions

### Version 1.0.0 (Current)
- **Status**: Active
- **Endpoints**: All current API endpoints
- **Features**: Core HVAC calculations, project management, authentication
- **Support**: Full support until v2.0.0 + 6 months

### Version 1.1.0 (Planned)
- **Status**: In Development
- **New Features**: Enhanced validation endpoints, improved error reporting
- **Breaking Changes**: None
- **Migration**: Automatic (backward compatible)

### Version 2.0.0 (Future)
- **Status**: Planned
- **Major Changes**: Restructured authentication, enhanced project metadata
- **Breaking Changes**: Yes (see migration guide)
- **Migration**: Manual migration required

## Implementation Architecture

### Backend (Flask)

```python
from backend.middleware.api_versioning import init_api_versioning, versioned_endpoint

# Initialize versioning
init_api_versioning(app, versioning_config)

# Versioned endpoint decorator
@versioned_endpoint('1.0.0', '/calculations/air-duct', ['POST'])
def calculate_air_duct():
    # Implementation
    pass
```

### Frontend (Next.js)

```typescript
import { VersionedApiClient } from '@/lib/api/versioning';

const client = new VersionedApiClient({
  baseUrl: 'https://api.sizewise-suite.com',
  defaultVersion: { major: 1, minor: 0, patch: 0 }
});

const result = await client.request('/calculations/air-duct', {
  method: 'POST',
  version: { major: 1, minor: 0, patch: 0 }
});
```

## Backward Compatibility

### Compatibility Matrix

| From Version | To Version | Compatible | Migration Required |
|--------------|------------|------------|-------------------|
| 1.0.0        | 1.1.0      | ✅ Yes     | ❌ No             |
| 1.1.0        | 2.0.0      | ❌ No      | ✅ Yes            |

### Compatibility Rules

1. **Minor Version Updates**: Always backward compatible
2. **Major Version Updates**: May introduce breaking changes
3. **Patch Updates**: Always backward compatible
4. **Deprecation Period**: 6 months minimum for breaking changes

## Deprecation Policy

### Deprecation Timeline

1. **Announcement**: 3 months before deprecation
2. **Deprecation Warning**: Headers and documentation updated
3. **Support Period**: 6 months after deprecation announcement
4. **Removal**: After support period expires

### Deprecation Headers

```http
API-Deprecation: true
API-Deprecation-Date: 2024-06-01T00:00:00Z
API-Removal-Date: 2024-12-01T00:00:00Z
API-Replaced-By: /api/v2/calculations
```

### Deprecation Response

```json
{
  "result": { ... },
  "deprecation_warning": {
    "deprecated": true,
    "message": "This API version is deprecated and will be removed on 2024-12-01",
    "replacement": "/api/v2/calculations",
    "migration_guide": "/docs/migration/v1-to-v2"
  }
}
```

## Migration Support

### Migration Endpoints

#### Get Migration Guide
```http
GET /api/migration/1.0.0/to/2.0.0
```

Response:
```json
{
  "success": true,
  "migration": {
    "from_version": "1.0.0",
    "to_version": "2.0.0",
    "description": "Major update with restructured authentication",
    "breaking_changes": [
      "Authentication endpoints moved from /auth to /api/auth",
      "Project creation requires additional metadata fields"
    ],
    "auto_migration": false,
    "estimated_time": "1-2 hours",
    "steps": [
      {
        "step": 1,
        "title": "Update authentication endpoints",
        "description": "All authentication endpoints have been moved",
        "code_example": "...",
        "required": true,
        "estimated_time": "15 minutes"
      }
    ]
  }
}
```

#### Check Compatibility
```http
POST /api/migration/compatibility
Content-Type: application/json

{
  "from_version": "1.0.0",
  "to_version": "2.0.0"
}
```

#### Validate Migration Request
```http
POST /api/migration/validate-request
Content-Type: application/json

{
  "current_version": "1.0.0",
  "target_version": "2.0.0"
}
```

## Version Detection

### Automatic Version Detection

The API automatically detects the requested version using the following priority:

1. URL path version (`/api/v1/...`)
2. `API-Version` header
3. Query parameter (`?version=1.0.0`)
4. Content-Type header
5. Default version (1.0.0)

### Version Validation

```typescript
// Client-side version validation
const isSupported = await client.isVersionSupported({ major: 1, minor: 0, patch: 0 });

if (!isSupported) {
  const apiInfo = await client.getApiInfo();
  console.log('Supported versions:', apiInfo.supportedVersions);
}
```

## Error Handling

### Version Not Supported

```json
{
  "error": "API version not supported",
  "requested_version": "2.1.0",
  "supported_versions": ["1.0.0", "1.1.0", "2.0.0"],
  "latest_version": "2.0.0"
}
```

### Version Mismatch

```json
{
  "error": "Version mismatch",
  "message": "Requested version 1.5.0 not available, using 1.1.0",
  "requested_version": "1.5.0",
  "actual_version": "1.1.0"
}
```

## Best Practices

### For API Consumers

1. **Always specify version**: Don't rely on default versions
2. **Monitor deprecation headers**: Check for deprecation warnings
3. **Plan migrations early**: Start migration planning when deprecation is announced
4. **Test with new versions**: Test compatibility before upgrading
5. **Use migration endpoints**: Leverage migration guides and validation

### For API Developers

1. **Follow semantic versioning**: Strictly adhere to SemVer principles
2. **Maintain backward compatibility**: Avoid breaking changes in minor/patch updates
3. **Document all changes**: Provide clear migration guides
4. **Gradual deprecation**: Give consumers adequate time to migrate
5. **Version all endpoints**: Ensure consistent versioning across all APIs

## Configuration

### Environment Variables

```bash
# API Versioning Configuration
API_VERSION_STRATEGY=url          # url, header, query, content-type
API_STRICT_VERSIONING=false       # true/false
API_DEFAULT_VERSION=1.0.0         # Default version for unspecified requests
API_DEPRECATION_WARNING_MONTHS=3  # Months before deprecation
API_DEPRECATION_SUPPORT_MONTHS=6  # Months of support after deprecation
```

### Application Configuration

```python
# backend/config.py
VERSIONING_CONFIG = {
    'current_version': '1.0.0',
    'supported_versions': ['1.0.0'],
    'default_version': '1.0.0',
    'versioning_strategy': 'url',
    'strict_versioning': False,
    'deprecation_warning_months': 3,
    'deprecation_support_months': 6
}
```

## Monitoring and Analytics

### Version Usage Metrics

- Track version usage across all endpoints
- Monitor deprecation warning responses
- Analyze migration adoption rates
- Identify clients still using deprecated versions

### Alerts and Notifications

- Alert when deprecated versions are heavily used
- Notify when new versions are released
- Monitor for version-related errors
- Track migration completion rates

## Testing Strategy

### Version Compatibility Testing

1. **Backward Compatibility Tests**: Ensure new versions work with old clients
2. **Migration Testing**: Validate migration guides and procedures
3. **Deprecation Testing**: Test deprecation warnings and timelines
4. **Version Detection Testing**: Verify version detection logic
5. **Error Handling Testing**: Test version-related error scenarios

### Automated Testing

```python
# Example test for version compatibility
def test_version_compatibility():
    # Test v1.0.0 client with v1.1.0 API
    client_v1 = ApiClient(version='1.0.0')
    response = client_v1.post('/calculations/air-duct', data)
    assert response.status_code == 200
    assert 'API-Version' in response.headers
```

## Future Considerations

### Planned Enhancements

1. **Automatic Migration Tools**: Tools to automatically migrate client code
2. **Version Analytics Dashboard**: Real-time version usage analytics
3. **Smart Version Negotiation**: Automatic version selection based on client capabilities
4. **GraphQL Versioning**: Extend versioning strategy to GraphQL APIs
5. **SDK Version Management**: Automatic SDK updates based on API versions

### Long-term Strategy

- Maintain maximum 3 major versions simultaneously
- Implement rolling deprecation schedule
- Develop automated migration testing
- Create version-aware documentation
- Build client libraries with automatic version handling
