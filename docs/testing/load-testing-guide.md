# Load Testing Guide for SizeWise Suite

This guide provides comprehensive instructions for running load tests on the SizeWise Suite application to ensure performance and scalability under various load conditions.

## Overview

Load testing is essential for:
- Identifying performance bottlenecks
- Validating system capacity
- Ensuring acceptable response times under load
- Planning for scaling requirements
- Preventing performance degradation in production

## Test Types

### 1. Backend Load Testing (Locust)

Located in: `backend/tests/load/test_load_performance.py`

#### Test Scenarios:
- **Light Load**: 10 users, 2 spawn rate, 5 minutes
- **Medium Load**: 50 users, 5 spawn rate, 10 minutes  
- **Heavy Load**: 100 users, 10 spawn rate, 15 minutes
- **Spike Load**: 200 users, 20 spawn rate, 5 minutes

#### Key Endpoints Tested:
- Health checks (`/api/health`)
- Authentication (`/api/auth/login`)
- HVAC calculations (`/api/calculations/*`)
- Project management (`/api/projects`)
- Export functionality (`/api/export/*`)

#### Running Backend Load Tests:

```bash
# Install dependencies
pip install locust requests

# Light load test
cd backend
python tests/load/test_load_performance.py

# Medium load test
python tests/load/test_load_performance.py medium

# Heavy load test
python tests/load/test_load_performance.py heavy

# Spike load test
python tests/load/test_load_performance.py spike

# Interactive mode with web UI
locust -f tests/load/test_load_performance.py --host http://localhost:5000
```

### 2. Frontend Load Testing (Playwright)

Located in: `frontend/e2e/load-testing.spec.ts`

#### Test Scenarios:
- **Light Load**: 5 concurrent users
- **Medium Load**: 15 concurrent users
- **Stress Test**: 25 concurrent users

#### Key Areas Tested:
- Home page loading performance
- Authentication flow performance
- Route navigation performance
- Web Vitals measurements (FCP, LCP, CLS)

#### Running Frontend Load Tests:

```bash
# Install dependencies
cd frontend
npm install

# Run all load tests
npm run test:load

# Run specific load test
npx playwright test load-testing.spec.ts -g "light load"

# Run with headed browser for debugging
npx playwright test load-testing.spec.ts --headed
```

## Performance Benchmarks

### Backend Performance Targets:
- **Health Check**: < 50ms response time
- **Authentication**: < 200ms response time
- **HVAC Calculations**: < 500ms response time
- **Project Operations**: < 300ms response time
- **Export Operations**: < 2000ms response time

### Frontend Performance Targets:
- **Page Load Time**: < 3 seconds
- **First Contentful Paint**: < 1.5 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **Cumulative Layout Shift**: < 0.1
- **Navigation Time**: < 2 seconds

## Load Test Configuration

### Environment Setup

1. **Test Environment**: Use dedicated test environment
2. **Database**: Use test database with realistic data volume
3. **Caching**: Enable Redis caching for realistic performance
4. **Monitoring**: Enable application monitoring during tests

### Test Data Preparation

```bash
# Create test users for load testing
cd backend
python scripts/create_load_test_users.py

# Populate test database with sample data
python scripts/populate_test_data.py
```

### Resource Monitoring

Monitor these metrics during load tests:
- CPU utilization
- Memory usage
- Database connections
- Response times
- Error rates
- Network I/O
- Disk I/O

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Load Testing
on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday at 2 AM
  workflow_dispatch:

jobs:
  backend-load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install locust
      - name: Run load tests
        run: |
          cd backend
          python tests/load/test_load_performance.py light
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: backend/load-test-results/

  frontend-load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
          npx playwright install
      - name: Run load tests
        run: |
          cd frontend
          npm run test:load
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: frontend-load-test-results
          path: frontend/test-results/
```

## Interpreting Results

### Backend Results (Locust)

Key metrics to analyze:
- **Requests per second (RPS)**: System throughput
- **Average response time**: User experience indicator
- **95th percentile response time**: Performance consistency
- **Error rate**: System reliability
- **Concurrent users supported**: Capacity planning

### Frontend Results (Playwright)

Key metrics to analyze:
- **Load time**: Overall page performance
- **Success rate**: Application reliability
- **Web Vitals**: User experience quality
- **Resource utilization**: Browser performance

## Troubleshooting Common Issues

### High Response Times
1. Check database query performance
2. Verify caching configuration
3. Review application logs for bottlenecks
4. Monitor resource utilization

### High Error Rates
1. Check application logs for errors
2. Verify database connection limits
3. Review rate limiting configuration
4. Check memory usage and garbage collection

### Frontend Performance Issues
1. Analyze network requests
2. Check bundle sizes
3. Review JavaScript execution time
4. Verify image optimization

## Best Practices

1. **Baseline Testing**: Establish performance baselines before changes
2. **Gradual Load Increase**: Ramp up load gradually to identify breaking points
3. **Realistic Data**: Use production-like data volumes and patterns
4. **Environment Consistency**: Use consistent test environments
5. **Regular Testing**: Run load tests regularly, not just before releases
6. **Documentation**: Document all test configurations and results
7. **Alerting**: Set up alerts for performance degradation

## Load Test Scenarios

### Scenario 1: Normal Business Hours
- 20-30 concurrent users
- Mix of authenticated and anonymous users
- Focus on HVAC calculation workflows
- Duration: 30 minutes

### Scenario 2: Peak Usage
- 50-75 concurrent users
- High calculation volume
- Multiple export operations
- Duration: 15 minutes

### Scenario 3: Stress Testing
- 100+ concurrent users
- Maximum system capacity testing
- Identify breaking points
- Duration: 10 minutes

### Scenario 4: Endurance Testing
- Moderate load (30 users)
- Extended duration (2+ hours)
- Test for memory leaks and degradation
- Monitor resource usage trends

## Reporting and Analysis

### Automated Reports
- Generate performance reports after each test run
- Compare results with previous baselines
- Identify performance trends over time
- Alert on performance regressions

### Manual Analysis
- Review detailed metrics for bottlenecks
- Analyze user journey performance
- Identify optimization opportunities
- Plan capacity scaling requirements

## Next Steps

1. Implement automated load testing in CI/CD pipeline
2. Set up performance monitoring dashboards
3. Establish performance SLAs
4. Create performance regression alerts
5. Plan regular load testing schedule
