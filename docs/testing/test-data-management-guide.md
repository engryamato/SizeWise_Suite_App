# Test Data Management Guide

## Overview

This guide provides comprehensive documentation for the SizeWise Suite test data management system, including data factories, database managers, validation utilities, and cleanup procedures.

## Architecture

### Backend Test Data Management

The backend test data management system consists of several key components:

- **TestDataFactory**: Generates realistic test data for users, projects, and calculations
- **TestDatabaseManager**: Manages isolated test databases with setup and cleanup
- **TestCleanupManager**: Handles comprehensive cleanup of test resources
- **Pytest Fixtures**: Provides reusable test components and configurations

### Frontend Test Data Management

The frontend system includes:

- **TestDataManager**: TypeScript-based test data generation and database management
- **TestDataValidator**: Validates test data integrity and HVAC calculation accuracy
- **Jest Integration**: Seamless integration with Jest testing framework

## Usage Examples

### Backend Usage

#### Basic Test with Database

```python
import pytest
from tests.fixtures.test_data_factory import create_basic_test_data
from tests.fixtures.test_database_manager import isolated_test_database

def test_user_creation():
    with isolated_test_database("test_user_creation", "basic_test") as db_manager:
        # Test data is automatically loaded
        users = db_manager.execute_query("SELECT * FROM users")
        assert len(users) > 0
        assert users[0]['tier'] in ['trial', 'free', 'premium', 'enterprise']
```

#### Using Test Data Factory

```python
from tests.fixtures.test_data_factory import TestDataFactory, UserTier, ProjectType

def test_hvac_calculation():
    factory = TestDataFactory(seed=42)  # Reproducible data
    
    # Create test user
    user = factory.create_user(tier=UserTier.PREMIUM)
    
    # Create test project
    project = factory.create_project(user.id, project_type=ProjectType.AIR_DUCT)
    
    # Create test calculation
    calculation = factory.create_calculation(project.id, user.id)
    
    # Verify realistic HVAC data
    assert 500 <= calculation.inputs['airflow'] <= 5000  # CFM
    assert 800 <= calculation.inputs['velocity'] <= 2000  # FPM
```

#### Performance Testing

```python
from tests.fixtures.test_data_factory import create_performance_test_data

@pytest.mark.performance
def test_large_dataset_performance():
    scenario = create_performance_test_data()
    
    # Test with 10 users, 50 projects, 1000 calculations
    assert len(scenario['users']) == 10
    assert len(scenario['projects']) == 50
    assert len(scenario['calculations']) == 1000
```

### Frontend Usage

#### Basic Test with Database

```typescript
import { withTestDatabase, createBasicTestData } from '@/tests/fixtures/TestDataManager';

describe('Project Management', () => {
  it('should create and retrieve projects', async () => {
    await withTestDatabase('project-test', 'basic', async (manager) => {
      const database = manager.getDatabase();
      
      const projects = await database.projects.toArray();
      expect(projects.length).toBeGreaterThan(0);
      
      const firstProject = projects[0];
      expect(firstProject.project_name).toBeDefined();
      expect(firstProject.codes).toContain('SMACNA');
    });
  });
});
```

#### Using Test Data Factory

```typescript
import { TestDataFactory } from '@/tests/fixtures/TestDataManager';

describe('HVAC Calculations', () => {
  it('should generate realistic calculation data', () => {
    const factory = new TestDataFactory(42);
    
    const user = factory.createUser('premium');
    const project = factory.createProject(user.id, 'air-duct');
    const calculation = factory.createCalculation(project.uuid, user.id, 'round_duct');
    
    // Verify realistic HVAC parameters
    expect(calculation.inputs.airflow).toBeGreaterThan(0);
    expect(calculation.inputs.velocity).toBeGreaterThan(0);
    expect(calculation.results.diameter).toBeGreaterThan(0);
  });
});
```

#### Data Validation

```typescript
import { TestDataValidator, validateTestData } from '@/tests/utils/TestDataValidator';

describe('Data Validation', () => {
  it('should validate test data integrity', () => {
    const factory = new TestDataFactory();
    const scenario = factory.createTestScenario('validation-test', 3, 2, 5);
    
    const validation = validateTestData(scenario);
    
    expect(validation.isValid).toBe(true);
    expect(validation.score).toBeGreaterThan(80);
    expect(validation.errors).toHaveLength(0);
  });
});
```

## Test Data Scenarios

### Basic Test Scenario
- 1 user (free tier)
- 1 project (air duct)
- 3 calculations
- 5 segments

### Performance Test Scenario
- 10 users (mixed tiers)
- 50 projects (various types)
- 1000 calculations
- 750 segments

### Tier Test Scenario
- 4 users (one of each tier)
- 12 projects
- 120 calculations
- 96 segments

## Data Validation Rules

### User Validation
- Required: ID, email, name, tier
- Email format validation
- Tier must be: trial, free, premium, enterprise
- Premium/Enterprise users should have license keys
- Enterprise users should have organization IDs

### Project Validation
- Required: UUID, name, location
- Must have at least one code standard
- Rooms must have valid area and occupancy
- Equipment must have valid capacity
- Dates must be valid ISO strings

### Calculation Validation
- Required: ID, project ID, user ID, type
- Inputs must match calculation type requirements
- Results must be realistic for HVAC calculations
- Cross-validation between inputs and results

### HVAC-Specific Validation
- Airflow: 50-50,000 CFM
- Velocity: 300-4,000 FPM
- Pressure Drop: 0.01-2.0 in. w.g. per 100 ft
- Diameter: 3-60 inches
- Reynolds Number: 10,000-1,000,000

## Database Management

### Isolation
Each test gets its own isolated database to prevent interference:

```python
# Backend - automatic isolation
with isolated_test_database("my_test") as db_manager:
    # Test code here
    pass  # Database automatically cleaned up
```

```typescript
// Frontend - automatic isolation
await withTestDatabase('my-test', 'basic', async (manager) => {
  // Test code here
  // Database automatically cleaned up
});
```

### Cleanup
Automatic cleanup includes:
- Database deletion
- Temporary file removal
- Cache clearing
- Resource deallocation

## Best Practices

### 1. Use Reproducible Data
```python
# Use seeds for reproducible test data
factory = TestDataFactory(seed=42)
```

### 2. Validate Test Data
```typescript
// Always validate generated test data
const validation = validateTestData(testData);
expect(validation.isValid).toBe(true);
```

### 3. Use Appropriate Scenarios
```python
# Use basic scenario for unit tests
scenario = create_basic_test_data()

# Use performance scenario for load tests
scenario = create_performance_test_data()
```

### 4. Clean Up Resources
```python
# Use context managers for automatic cleanup
with isolated_test_database("test") as db:
    # Test code
    pass  # Automatic cleanup
```

### 5. Test Data Relationships
```typescript
// Ensure data relationships are valid
const scenario = factory.createTestScenario('test', 3, 2, 5);
const validation = validator.validateDataRelationships(scenario);
expect(validation.isValid).toBe(true);
```

## Configuration

### Backend Configuration
```python
# pytest.ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = --strict-markers --disable-warnings
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
    unit: marks tests as unit tests
    performance: marks tests as performance tests
    database: marks tests that require database
```

### Frontend Configuration
```javascript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
  ],
};
```

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check if test database services are running
docker ps | grep postgres
docker ps | grep mongo
docker ps | grep redis
```

#### Memory Issues with Large Datasets
```python
# Use smaller datasets for memory-constrained environments
scenario = factory.create_test_scenario("small_test", 2, 1, 3)
```

#### Validation Failures
```typescript
// Check validation details
const validation = validateTestData(data);
console.log(generateValidationReport(validation));
```

### Performance Optimization

#### Database Performance
- Use SQLite for fast unit tests
- Use PostgreSQL for integration tests
- Use MongoDB for document-based tests

#### Memory Management
- Clean up test data after each test
- Use smaller datasets when possible
- Monitor memory usage in CI/CD

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run Backend Tests with Test Data
  run: |
    cd backend
    python -m pytest tests/ -v --cov=. --cov-report=xml
  env:
    DATABASE_URL: sqlite:///:memory:
    REDIS_URL: redis://localhost:6379/1

- name: Run Frontend Tests with Test Data
  run: |
    cd frontend
    npm test -- --coverage --watchAll=false
  env:
    NODE_ENV: test
```

## Monitoring and Metrics

### Test Data Quality Metrics
- Validation score (target: >90%)
- Data generation time
- Database setup time
- Cleanup success rate

### Performance Metrics
- Test execution time
- Memory usage
- Database query performance
- Data generation throughput

## Future Enhancements

### Planned Features
1. **Real-time Data Validation**: Continuous validation during test execution
2. **Advanced HVAC Scenarios**: More complex multi-system calculations
3. **Data Versioning**: Track test data schema changes
4. **Performance Benchmarking**: Automated performance regression detection
5. **Cloud Database Support**: AWS RDS, Azure SQL, Google Cloud SQL integration

### Contributing
When adding new test data features:
1. Follow existing patterns and conventions
2. Add comprehensive validation rules
3. Include realistic HVAC parameters
4. Provide clear documentation
5. Add appropriate test coverage
