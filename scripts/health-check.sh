#!/bin/bash

# SizeWise Suite Health Check Script
# 
# Comprehensive health checks for automated rollback mechanisms
# Part of Phase 1 bridging plan for deployment reliability
# 
# @see docs/post-implementation-bridging-plan.md Task 1.3

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_ROOT}/logs/health-check.log"
TIMEOUT=30
MAX_RETRIES=3
HEALTH_CHECK_INTERVAL=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info() {
    log "INFO" "${BLUE}$*${NC}"
}

log_success() {
    log "SUCCESS" "${GREEN}$*${NC}"
}

log_warning() {
    log "WARNING" "${YELLOW}$*${NC}"
}

log_error() {
    log "ERROR" "${RED}$*${NC}"
}

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Health check functions
check_backend_health() {
    local backend_url="${BACKEND_URL:-http://localhost:5000}"
    local endpoint="${backend_url}/api/health"
    
    log_info "Checking backend health at ${endpoint}"
    
    for i in $(seq 1 $MAX_RETRIES); do
        if curl -f -s --max-time $TIMEOUT "$endpoint" > /dev/null 2>&1; then
            log_success "Backend health check passed (attempt $i/$MAX_RETRIES)"
            return 0
        else
            log_warning "Backend health check failed (attempt $i/$MAX_RETRIES)"
            if [ $i -lt $MAX_RETRIES ]; then
                sleep $HEALTH_CHECK_INTERVAL
            fi
        fi
    done
    
    log_error "Backend health check failed after $MAX_RETRIES attempts"
    return 1
}

check_frontend_health() {
    local frontend_url="${FRONTEND_URL:-http://localhost:3000}"
    
    log_info "Checking frontend health at ${frontend_url}"
    
    for i in $(seq 1 $MAX_RETRIES); do
        if curl -f -s --max-time $TIMEOUT "$frontend_url" > /dev/null 2>&1; then
            log_success "Frontend health check passed (attempt $i/$MAX_RETRIES)"
            return 0
        else
            log_warning "Frontend health check failed (attempt $i/$MAX_RETRIES)"
            if [ $i -lt $MAX_RETRIES ]; then
                sleep $HEALTH_CHECK_INTERVAL
            fi
        fi
    done
    
    log_error "Frontend health check failed after $MAX_RETRIES attempts"
    return 1
}

check_auth_service_health() {
    local auth_url="${AUTH_URL:-http://localhost:8000}"
    local endpoint="${auth_url}/api/health"
    
    log_info "Checking auth service health at ${endpoint}"
    
    for i in $(seq 1 $MAX_RETRIES); do
        if curl -f -s --max-time $TIMEOUT "$endpoint" > /dev/null 2>&1; then
            log_success "Auth service health check passed (attempt $i/$MAX_RETRIES)"
            return 0
        else
            log_warning "Auth service health check failed (attempt $i/$MAX_RETRIES)"
            if [ $i -lt $MAX_RETRIES ]; then
                sleep $HEALTH_CHECK_INTERVAL
            fi
        fi
    done
    
    log_error "Auth service health check failed after $MAX_RETRIES attempts"
    return 1
}

check_database_health() {
    local db_host="${POSTGRES_HOST:-localhost}"
    local db_port="${POSTGRES_PORT:-5432}"
    local db_name="${POSTGRES_DB:-sizewise}"
    local db_user="${POSTGRES_USER:-sizewise}"
    
    log_info "Checking database health at ${db_host}:${db_port}"
    
    # Check if database is accessible
    if command -v pg_isready > /dev/null 2>&1; then
        for i in $(seq 1 $MAX_RETRIES); do
            if pg_isready -h "$db_host" -p "$db_port" -d "$db_name" -U "$db_user" > /dev/null 2>&1; then
                log_success "Database health check passed (attempt $i/$MAX_RETRIES)"
                return 0
            else
                log_warning "Database health check failed (attempt $i/$MAX_RETRIES)"
                if [ $i -lt $MAX_RETRIES ]; then
                    sleep $HEALTH_CHECK_INTERVAL
                fi
            fi
        done
    else
        log_warning "pg_isready not available, skipping database health check"
        return 0
    fi
    
    log_error "Database health check failed after $MAX_RETRIES attempts"
    return 1
}

check_redis_health() {
    local redis_host="${REDIS_HOST:-localhost}"
    local redis_port="${REDIS_PORT:-6379}"
    
    log_info "Checking Redis health at ${redis_host}:${redis_port}"
    
    # Check if Redis is accessible
    if command -v redis-cli > /dev/null 2>&1; then
        for i in $(seq 1 $MAX_RETRIES); do
            if redis-cli -h "$redis_host" -p "$redis_port" ping > /dev/null 2>&1; then
                log_success "Redis health check passed (attempt $i/$MAX_RETRIES)"
                return 0
            else
                log_warning "Redis health check failed (attempt $i/$MAX_RETRIES)"
                if [ $i -lt $MAX_RETRIES ]; then
                    sleep $HEALTH_CHECK_INTERVAL
                fi
            fi
        done
    else
        log_warning "redis-cli not available, skipping Redis health check"
        return 0
    fi
    
    log_error "Redis health check failed after $MAX_RETRIES attempts"
    return 1
}

check_hvac_calculations() {
    local backend_url="${BACKEND_URL:-http://localhost:5000}"
    local endpoint="${backend_url}/api/calculations/air-duct"
    
    log_info "Checking HVAC calculation functionality"
    
    # Test data for air duct calculation
    local test_data='{
        "airflow": 1000,
        "velocity": 1500,
        "duct_type": "rectangular",
        "material": "galvanized_steel"
    }'
    
    for i in $(seq 1 $MAX_RETRIES); do
        local response=$(curl -f -s --max-time $TIMEOUT \
            -H "Content-Type: application/json" \
            -d "$test_data" \
            "$endpoint" 2>/dev/null)
        
        if [ $? -eq 0 ] && echo "$response" | grep -q "duct_size"; then
            log_success "HVAC calculation health check passed (attempt $i/$MAX_RETRIES)"
            return 0
        else
            log_warning "HVAC calculation health check failed (attempt $i/$MAX_RETRIES)"
            if [ $i -lt $MAX_RETRIES ]; then
                sleep $HEALTH_CHECK_INTERVAL
            fi
        fi
    done
    
    log_error "HVAC calculation health check failed after $MAX_RETRIES attempts"
    return 1
}

check_compliance_system() {
    local backend_url="${BACKEND_URL:-http://localhost:5000}"
    local endpoint="${backend_url}/api/compliance/check"
    
    log_info "Checking compliance system functionality"
    
    # Test data for compliance check
    local test_data='{
        "velocity": 1500,
        "duct_type": "rectangular",
        "application": "supply"
    }'
    
    for i in $(seq 1 $MAX_RETRIES); do
        local response=$(curl -f -s --max-time $TIMEOUT \
            -H "Content-Type: application/json" \
            -d "$test_data" \
            "$endpoint" 2>/dev/null)
        
        if [ $? -eq 0 ] && echo "$response" | grep -q "validation"; then
            log_success "Compliance system health check passed (attempt $i/$MAX_RETRIES)"
            return 0
        else
            log_warning "Compliance system health check failed (attempt $i/$MAX_RETRIES)"
            if [ $i -lt $MAX_RETRIES ]; then
                sleep $HEALTH_CHECK_INTERVAL
            fi
        fi
    done
    
    log_error "Compliance system health check failed after $MAX_RETRIES attempts"
    return 1
}

check_advanced_compliance() {
    local backend_url="${BACKEND_URL:-http://localhost:5000}"
    local endpoint="${backend_url}/api/compliance/standards-info"
    
    log_info "Checking advanced compliance standards (ASHRAE 90.2, IECC 2024)"
    
    for i in $(seq 1 $MAX_RETRIES); do
        local response=$(curl -f -s --max-time $TIMEOUT "$endpoint" 2>/dev/null)
        
        if [ $? -eq 0 ] && echo "$response" | grep -q "ASHRAE 90.2" && echo "$response" | grep -q "IECC 2024"; then
            log_success "Advanced compliance health check passed (attempt $i/$MAX_RETRIES)"
            return 0
        else
            log_warning "Advanced compliance health check failed (attempt $i/$MAX_RETRIES)"
            if [ $i -lt $MAX_RETRIES ]; then
                sleep $HEALTH_CHECK_INTERVAL
            fi
        fi
    done
    
    log_error "Advanced compliance health check failed after $MAX_RETRIES attempts"
    return 1
}

# Main health check function
run_health_checks() {
    local start_time=$(date +%s)
    local failed_checks=0
    local total_checks=8
    
    log_info "Starting comprehensive health checks..."
    log_info "Timeout: ${TIMEOUT}s, Max retries: ${MAX_RETRIES}, Check interval: ${HEALTH_CHECK_INTERVAL}s"
    
    # Core infrastructure checks
    check_backend_health || ((failed_checks++))
    check_frontend_health || ((failed_checks++))
    check_auth_service_health || ((failed_checks++))
    check_database_health || ((failed_checks++))
    check_redis_health || ((failed_checks++))
    
    # Application functionality checks
    check_hvac_calculations || ((failed_checks++))
    check_compliance_system || ((failed_checks++))
    check_advanced_compliance || ((failed_checks++))
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_info "Health checks completed in ${duration} seconds"
    log_info "Results: $((total_checks - failed_checks))/${total_checks} checks passed"
    
    if [ $failed_checks -eq 0 ]; then
        log_success "All health checks passed! System is healthy."
        return 0
    else
        log_error "${failed_checks}/${total_checks} health checks failed! System requires attention."
        return 1
    fi
}

# Script execution
main() {
    log_info "SizeWise Suite Health Check Script v1.0"
    log_info "Starting health checks for automated rollback system..."
    
    if run_health_checks; then
        log_success "Health check completed successfully"
        exit 0
    else
        log_error "Health check failed - triggering rollback procedures"
        exit 1
    fi
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
