# Testing Guidelines

**📍 Navigation:** [Documentation Home](../README.md) > [Developer Guide](README.md) > Testing

This guide covers testing standards, procedures, and best practices for SizeWise Suite development.

## Testing Philosophy

SizeWise Suite follows a comprehensive testing strategy to ensure reliability, maintainability, and user satisfaction:

- **Test-Driven Development (TDD)**: Write tests before implementing features
- **Comprehensive Coverage**: Aim for 80%+ code coverage across all modules
- **Automated Testing**: All tests run automatically in CI/CD pipeline
- **Quality Gates**: Tests must pass before code can be merged

## Testing Stack

### Frontend Testing
- **Jest**: JavaScript testing framework
- **React Testing Library**: React component testing utilities
- **Playwright**: End-to-end testing framework
- **MSW (Mock Service Worker)**: API mocking for tests

### Backend Testing
- **pytest**: Python testing framework
- **pytest-cov**: Coverage reporting
- **Factory Boy**: Test data generation
- **requests-mock**: HTTP request mocking

## Test Types

### Unit Tests
Test individual functions, components, and modules in isolation.

**Frontend Unit Tests**:
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

**Backend Unit Tests**:
```bash
# Run all unit tests
python -m pytest tests/unit/

# Run with coverage
python -m pytest --cov=api tests/unit/
```

### Integration Tests
Test interactions between different parts of the system.

**API Integration Tests**:
```bash
# Run API integration tests
python -m pytest tests/integration/

# Run specific test file
python -m pytest tests/integration/test_auth_api.py
```

**Frontend Integration Tests**:
```bash
# Run component integration tests
npm run test:integration
```

### End-to-End Tests
Test complete user workflows across the entire application.

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e -- --headed

# Run specific test file
npm run test:e2e -- tests/e2e/auth.spec.ts
```

## Testing Standards

### Code Coverage Requirements
- **Minimum Coverage**: 80% for all new code
- **Critical Paths**: 95% coverage for authentication, calculations, and data persistence
- **UI Components**: 70% coverage minimum
- **Utility Functions**: 90% coverage minimum

### Test Organization
```
tests/
├── unit/                 # Unit tests
│   ├── frontend/        # Frontend unit tests
│   └── backend/         # Backend unit tests
├── integration/         # Integration tests
│   ├── api/            # API integration tests
│   └── components/     # Component integration tests
└── e2e/                # End-to-end tests
    ├── auth/           # Authentication workflows
    ├── calculations/   # Calculation workflows
    └── projects/       # Project management workflows
```

### Naming Conventions
- **Test Files**: `*.test.ts` for unit tests, `*.spec.ts` for E2E tests
- **Test Functions**: Descriptive names starting with "should" or "it"
- **Test Data**: Use factories and fixtures for consistent test data

## Writing Good Tests

### Test Structure (AAA Pattern)
```typescript
describe('Air Duct Calculator', () => {
  it('should calculate correct duct size for given airflow', () => {
    // Arrange
    const airflow = 1000; // CFM
    const velocity = 800; // FPM
    
    // Act
    const result = calculateDuctSize(airflow, velocity);
    
    // Assert
    expect(result.diameter).toBe(14.2);
    expect(result.area).toBe(158.4);
  });
});
```

### Frontend Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DuctSizeCalculator } from './DuctSizeCalculator';

describe('DuctSizeCalculator', () => {
  it('should display calculated results when form is submitted', async () => {
    // Arrange
    render(<DuctSizeCalculator />);
    
    // Act
    fireEvent.change(screen.getByLabelText('Airflow (CFM)'), {
      target: { value: '1000' }
    });
    fireEvent.click(screen.getByText('Calculate'));
    
    // Assert
    expect(await screen.findByText('Duct Diameter: 14.2"')).toBeInTheDocument();
  });
});
```

### Backend API Testing
```python
import pytest
from api.calculations import calculate_duct_size

class TestDuctCalculations:
    def test_calculate_duct_size_returns_correct_diameter(self):
        # Arrange
        airflow = 1000  # CFM
        velocity = 800  # FPM
        
        # Act
        result = calculate_duct_size(airflow, velocity)
        
        # Assert
        assert result['diameter'] == pytest.approx(14.2, rel=1e-2)
        assert result['area'] == pytest.approx(158.4, rel=1e-2)
```

## Test Data Management

### Fixtures and Factories
Use consistent test data across tests:

```python
# conftest.py
@pytest.fixture
def sample_project():
    return {
        'name': 'Test HVAC Project',
        'location': 'Test Building',
        'engineer': 'Test Engineer'
    }

@pytest.fixture
def authenticated_user():
    return create_test_user(
        email='test@example.com',
        tier='premium'
    )
```

### Mock Data
Use realistic mock data that represents actual use cases:

```typescript
// test-utils/mockData.ts
export const mockProject = {
  id: 'test-project-1',
  name: 'Office Building HVAC',
  systems: [
    {
      id: 'system-1',
      type: 'supply',
      ducts: [
        { size: '12x8', airflow: 800, velocity: 750 }
      ]
    }
  ]
};
```

## Continuous Integration

### GitHub Actions Workflow
Tests run automatically on:
- Pull request creation and updates
- Pushes to main branch
- Scheduled daily runs

### Test Pipeline
1. **Lint and Format Check**: Code quality validation
2. **Unit Tests**: Fast feedback on individual components
3. **Integration Tests**: API and component interaction testing
4. **E2E Tests**: Full workflow validation
5. **Coverage Report**: Ensure coverage requirements are met

## Performance Testing

### Load Testing
```bash
# Run load tests for API endpoints
npm run test:load

# Test specific endpoint
npm run test:load -- --endpoint /api/calculations
```

### Performance Benchmarks
- **API Response Time**: < 200ms for calculation endpoints
- **Page Load Time**: < 2 seconds for initial load
- **Memory Usage**: < 100MB for typical user session

## Debugging Tests

### Common Issues
- **Flaky Tests**: Use proper waits and avoid timing dependencies
- **Test Isolation**: Ensure tests don't depend on each other
- **Mock Management**: Reset mocks between tests

### Debugging Tools
```bash
# Debug specific test
npm test -- --testNamePattern="should calculate" --verbose

# Run tests with debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Best Practices

### Do's
- Write tests before implementing features (TDD)
- Use descriptive test names that explain the expected behavior
- Test edge cases and error conditions
- Keep tests simple and focused on one behavior
- Use proper setup and teardown for test isolation

### Don'ts
- Don't test implementation details, test behavior
- Don't write tests that depend on external services
- Don't ignore failing tests or skip them without good reason
- Don't write overly complex tests that are hard to understand
- Don't forget to test error handling and edge cases

---

## Related Documentation

- **[Contributing Guidelines](contributing.md)**: Development workflow and standards
- **[Getting Started](getting-started.md)**: Development environment setup
- **[API Reference](api-reference/README.md)**: API documentation for testing
- **[Troubleshooting](../operations/troubleshooting.md)**: Common development issues

**📍 Navigation:** [Documentation Home](../README.md) > [Developer Guide](README.md) > Testing
