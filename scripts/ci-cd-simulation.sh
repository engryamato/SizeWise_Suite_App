#!/bin/bash

# SizeWise Suite CI/CD Pipeline Simulation
# This script simulates a complete CI/CD pipeline for testing

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEST_ENV_FILE=".env.ci.test"
TEST_COMPOSE_FILE="docker-compose.ci.test.yml"
LOG_FILE="/tmp/sizewise-ci-test.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Create CI test environment
create_ci_environment() {
    log "Creating CI test environment..."
    
    # Create CI test environment file
    cat > "$PROJECT_ROOT/$TEST_ENV_FILE" << EOF
# CI/CD Test Environment
POSTGRES_DB=sizewise_ci_test
POSTGRES_USER=sizewise
POSTGRES_PASSWORD=ci_test_password
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=ci_test_redis

FLASK_ENV=testing
SECRET_KEY=ci_test_secret_key_not_for_production
JWT_SECRET_KEY=ci_test_jwt_secret

BACKEND_URL=http://backend:5000
AUTH_SERVER_URL=http://auth-server:5001
FRONTEND_URL=http://localhost:3000

SENTRY_DSN=
SENTRY_ENVIRONMENT=ci-test

CORS_ORIGINS=http://localhost:3000,http://frontend:3000
EOF
    
    # Create CI test Docker Compose file
    cat > "$PROJECT_ROOT/$TEST_COMPOSE_FILE" << EOF
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: \${POSTGRES_DB}
      POSTGRES_USER: \${POSTGRES_USER}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER} -d \${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass \${REDIS_PASSWORD}
    ports:
      - "6380:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: docker/backend/Dockerfile
      target: production
    environment:
      POSTGRES_DB: \${POSTGRES_DB}
      POSTGRES_USER: \${POSTGRES_USER}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_HOST: \${POSTGRES_HOST}
      POSTGRES_PORT: \${POSTGRES_PORT}
      REDIS_HOST: \${REDIS_HOST}
      REDIS_PORT: \${REDIS_PORT}
      REDIS_PASSWORD: \${REDIS_PASSWORD}
      FLASK_ENV: \${FLASK_ENV}
      SECRET_KEY: \${SECRET_KEY}
      CORS_ORIGINS: \${CORS_ORIGINS}
      SENTRY_DSN: \${SENTRY_DSN}
      SENTRY_ENVIRONMENT: \${SENTRY_ENVIRONMENT}
    ports:
      - "5002:5000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  auth-server:
    build:
      context: .
      dockerfile: docker/auth-server/Dockerfile
      target: production
    environment:
      POSTGRES_DB: \${POSTGRES_DB}
      POSTGRES_USER: \${POSTGRES_USER}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_HOST: \${POSTGRES_HOST}
      POSTGRES_PORT: \${POSTGRES_PORT}
      FLASK_ENV: \${FLASK_ENV}
      SECRET_KEY: \${SECRET_KEY}
      JWT_SECRET_KEY: \${JWT_SECRET_KEY}
      SENTRY_DSN: \${SENTRY_DSN}
      SENTRY_ENVIRONMENT: \${SENTRY_ENVIRONMENT}
    ports:
      - "5003:5001"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
EOF
    
    success "CI test environment created"
}

# Build and test images
build_and_test() {
    log "Building Docker images..."
    cd "$PROJECT_ROOT"
    
    # Build backend image
    log "Building backend image..."
    docker build -f docker/backend/Dockerfile --target production -t sizewise-backend:ci-test .
    
    # Build auth server image
    log "Building auth server image..."
    docker build -f docker/auth-server/Dockerfile --target production -t sizewise-auth:ci-test .
    
    success "Images built successfully"
}

# Run integration tests
run_integration_tests() {
    log "Starting integration tests..."
    cd "$PROJECT_ROOT"
    
    # Start test environment
    docker-compose -f "$TEST_COMPOSE_FILE" --env-file "$TEST_ENV_FILE" up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 60
    
    # Check service health
    log "Checking service health..."
    
    # Check backend health
    if ! curl -f http://localhost:5002/api/health; then
        error "Backend health check failed"
    fi
    
    # Check auth server health
    if ! curl -f http://localhost:5003/api/health; then
        error "Auth server health check failed"
    fi
    
    # Test database connectivity
    log "Testing database connectivity..."
    docker-compose -f "$TEST_COMPOSE_FILE" --env-file "$TEST_ENV_FILE" exec -T postgres pg_isready -U sizewise -d sizewise_ci_test
    
    # Test Redis connectivity
    log "Testing Redis connectivity..."
    docker-compose -f "$TEST_COMPOSE_FILE" --env-file "$TEST_ENV_FILE" exec -T redis redis-cli -a ci_test_redis ping
    
    success "Integration tests passed"
}

# Simulate deployment
simulate_deployment() {
    log "Simulating deployment process..."
    
    # Test deployment script (dry run)
    log "Testing deployment script..."
    
    # Create a test production environment
    cp "$PROJECT_ROOT/$TEST_ENV_FILE" "$PROJECT_ROOT/.env.production.test"
    cp "$PROJECT_ROOT/$TEST_COMPOSE_FILE" "$PROJECT_ROOT/docker-compose.prod.test.yml"
    
    # Test backup functionality
    log "Testing backup functionality..."
    mkdir -p /tmp/sizewise-ci-backup
    
    # Simulate database backup
    docker-compose -f "$TEST_COMPOSE_FILE" --env-file "$TEST_ENV_FILE" exec -T postgres pg_dumpall -U sizewise > /tmp/sizewise-ci-backup/test_backup.sql
    
    if [[ -f "/tmp/sizewise-ci-backup/test_backup.sql" ]]; then
        success "Backup simulation successful"
    else
        error "Backup simulation failed"
    fi
    
    success "Deployment simulation completed"
}

# Performance tests
run_performance_tests() {
    log "Running basic performance tests..."
    
    # Test backend response time
    log "Testing backend response time..."
    BACKEND_RESPONSE=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:5002/api/health)
    log "Backend response time: ${BACKEND_RESPONSE}s"
    
    # Test auth server response time
    log "Testing auth server response time..."
    AUTH_RESPONSE=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:5003/api/health)
    log "Auth server response time: ${AUTH_RESPONSE}s"
    
    # Check if response times are reasonable (< 2 seconds)
    if (( $(echo "$BACKEND_RESPONSE > 2.0" | bc -l) )); then
        warning "Backend response time is slow: ${BACKEND_RESPONSE}s"
    fi
    
    if (( $(echo "$AUTH_RESPONSE > 2.0" | bc -l) )); then
        warning "Auth server response time is slow: ${AUTH_RESPONSE}s"
    fi
    
    success "Performance tests completed"
}

# Cleanup test environment
cleanup() {
    log "Cleaning up test environment..."
    cd "$PROJECT_ROOT"
    
    # Stop and remove test containers
    docker-compose -f "$TEST_COMPOSE_FILE" --env-file "$TEST_ENV_FILE" down -v
    
    # Remove test images
    docker rmi sizewise-backend:ci-test sizewise-auth:ci-test 2>/dev/null || true
    
    # Remove test files
    rm -f "$PROJECT_ROOT/$TEST_ENV_FILE"
    rm -f "$PROJECT_ROOT/$TEST_COMPOSE_FILE"
    rm -f "$PROJECT_ROOT/.env.production.test"
    rm -f "$PROJECT_ROOT/docker-compose.prod.test.yml"
    rm -rf /tmp/sizewise-ci-backup
    
    success "Cleanup completed"
}

# Main CI/CD simulation
main() {
    log "Starting SizeWise Suite CI/CD simulation..."
    
    create_ci_environment
    build_and_test
    run_integration_tests
    simulate_deployment
    run_performance_tests
    
    success "CI/CD simulation completed successfully!"
    log "All tests passed - deployment pipeline is ready"
}

# Handle script interruption
trap 'cleanup; error "CI/CD simulation interrupted"' INT TERM

# Ensure cleanup runs on exit
trap 'cleanup' EXIT

# Run main function
main "$@"
