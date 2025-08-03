# SizeWise Suite - API Contract Testing

Comprehensive API contract testing system for the SizeWise Suite application. This system ensures frontend-backend compatibility, validates API schemas, and maintains API versioning compliance.

## Overview

The API contract testing system provides:

- **Request/Response Schema Validation**: Validates all API endpoints against predefined schemas
- **API Versioning Compliance**: Ensures backward compatibility and proper versioning
- **Authentication Contract Testing**: Validates authentication flows and token formats
- **HVAC Calculation API Testing**: Specific tests for HVAC calculation endpoints
- **Error Response Validation**: Ensures consistent error response formats
- **Performance Contract Testing**: Validates API response times and performance metrics

## Quick Start

### Prerequisites

- Python 3.11+
- Required packages: `requests`, `jsonschema`, `pydantic`
- Backend server running on localhost:5000 (for live testing)

### Installation

```bash
# Install dependencies
pip install requests jsonschema pydantic

# Navigate to contract tests directory
cd tests/contract
```

### Running Contract Tests

#### Basic Usage

```bash
# Run all contract tests
python run_contract_tests.py

# Run tests for specific environment
python run_contract_tests.py --environment development

# Generate reports
python run_contract_tests.py --html-report --json-report
```

#### Advanced Usage

```bash
# Run with CI export and verbose logging
python run_contract_tests.py \
  --environment staging \
  --html-report \
  --json-report \
  --ci-export \
  --output-dir ./reports \
  --verbose
```

## Configuration

### Configuration File

The system uses `contract-test-config.json` for configuration:

```json
{
  "contract_test_config": {
    "environments": {
      "development": {
        "base_url": "http://localhost:5000",
        "timeout_seconds": 30
      }
    },
    "quality_gates": {
      "contract_compliance_threshold": 90,
      "performance_threshold": 95
    }
  }
}
```

### Environment Variables

- `FLASK_ENV`: Set to `testing` for test environment
- `DATABASE_URL`: Database connection string
- `REDIS_URL`: Redis connection string

## Test Categories

### 1. API Info Contract
- Validates `/api/info` endpoint
- Checks API version information
- Validates module availability

### 2. Health Check Contract
- Tests `/api/health` endpoint
- Validates health status response
- Checks response time

### 3. Air Duct Calculation Contract
- Tests `/api/calculations/air-duct` endpoint
- Validates calculation input/output schemas
- Checks calculation accuracy

### 4. Validation Endpoint Contract
- Tests `/api/validation/smacna` endpoint
- Validates input validation logic
- Checks warning/error responses

### 5. Error Response Contract
- Tests error response formats
- Validates error codes and messages
- Ensures consistent error structure

### 6. Authentication Contract
- Tests authentication endpoints
- Validates token formats
- Checks user data structure

### 7. API Versioning Contract
- Tests version header support
- Validates backward compatibility
- Checks version information

### 8. CORS Policy Contract
- Tests CORS preflight requests
- Validates CORS headers
- Checks cross-origin support

### 9. Rate Limiting Contract
- Tests rate limiting headers
- Validates rate limit enforcement
- Checks rate limit responses

### 10. Performance Contract
- Tests API response times
- Validates performance thresholds
- Checks endpoint performance

## Schema Definitions

### Air Duct Request Schema

```json
{
  "type": "object",
  "properties": {
    "airflow": {"type": "number", "minimum": 1, "maximum": 100000},
    "duct_type": {"type": "string", "enum": ["rectangular", "round", "oval"]},
    "friction_rate": {"type": "number", "minimum": 0.001, "maximum": 2.0},
    "units": {"type": "string", "enum": ["imperial", "metric"]}
  },
  "required": ["airflow", "duct_type", "friction_rate", "units"]
}
```

### API Response Schema

```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "data": {"type": "object"},
    "metadata": {
      "type": "object",
      "properties": {
        "timestamp": {"type": "string", "format": "date-time"},
        "version": {"type": "string"},
        "request_id": {"type": "string"}
      }
    }
  },
  "required": ["success"]
}
```

## Quality Gates

The system enforces quality gates to ensure API reliability:

- **Contract Compliance Threshold**: 90% (configurable)
- **Performance Threshold**: 95% (configurable)
- **Error Rate Threshold**: 1% (configurable)
- **Availability Threshold**: 99.9% (configurable)

## Reporting

### HTML Reports

Generated HTML reports include:
- Test execution summary
- Individual test results
- Performance metrics
- Quality assessment
- Recommendations

### JSON Reports

Machine-readable JSON reports for CI/CD integration:
- Test results data
- Validation scores
- Failed test details
- Performance metrics

### CI Export

Specialized export format for CI/CD systems:
- Summary statistics
- Quality gate results
- Failed test list
- Recommendations

## CI/CD Integration

### GitHub Actions

The system includes a GitHub Actions workflow (`api-contract-tests.yml`) that:

1. Sets up test environment
2. Starts backend services
3. Runs contract tests
4. Generates reports
5. Comments on PRs with results
6. Enforces quality gates

### Usage in CI/CD

```yaml
- name: Run API Contract Tests
  run: |
    cd tests/contract
    python run_contract_tests.py \
      --environment ${{ matrix.environment }} \
      --html-report \
      --json-report \
      --ci-export
```

## Troubleshooting

### Common Issues

1. **Backend Not Running**
   - Ensure backend server is running on configured port
   - Check database and Redis connections

2. **Schema Validation Failures**
   - Verify API response formats match schemas
   - Check for missing required fields

3. **Performance Test Failures**
   - Check network connectivity
   - Verify performance thresholds are realistic

### Debug Mode

Enable verbose logging for debugging:

```bash
python run_contract_tests.py --verbose
```

## Best Practices

1. **Run Tests Regularly**: Include in CI/CD pipeline
2. **Monitor Quality Gates**: Track compliance over time
3. **Update Schemas**: Keep schemas current with API changes
4. **Review Reports**: Analyze failed tests and recommendations
5. **Performance Monitoring**: Track API response times

## Contributing

When adding new contract tests:

1. Add test method to `APIContractTester` class
2. Define appropriate schemas
3. Update configuration if needed
4. Add documentation
5. Update validation tests

## Support

For issues or questions:
- Check troubleshooting section
- Review test logs
- Consult API documentation
- Contact development team

## License

Part of the SizeWise Suite application.
