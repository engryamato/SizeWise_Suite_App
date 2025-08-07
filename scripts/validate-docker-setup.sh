#!/bin/bash

# SizeWise Suite Docker Setup Validation Script
# This script validates the Docker setup across different platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEV_COMPOSE_FILE="docker-compose.dev.yml"
PROD_COMPOSE_FILE="docker-compose.prod.yml"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get docker-compose command
get_compose_cmd() {
    if command_exists docker-compose; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

# Function to detect platform
detect_platform() {
    case "$(uname -s)" in
        Linux*)     echo "Linux";;
        Darwin*)    echo "macOS";;
        CYGWIN*|MINGW*|MSYS*) echo "Windows";;
        *)          echo "Unknown";;
    esac
}

# Function to check Docker installation
check_docker_installation() {
    print_status "Checking Docker installation..."
    
    local platform=$(detect_platform)
    print_status "Detected platform: $platform"
    
    # Check Docker
    if ! command_exists docker; then
        print_error "Docker is not installed"
        return 1
    fi
    
    # Check Docker version
    local docker_version=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    print_status "Docker version: $docker_version"
    
    # Check Docker Compose
    if command_exists docker-compose; then
        local compose_version=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        print_status "Docker Compose version: $compose_version (standalone)"
    elif docker compose version >/dev/null 2>&1; then
        local compose_version=$(docker compose version --short)
        print_status "Docker Compose version: $compose_version (plugin)"
    else
        print_error "Docker Compose is not available"
        return 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running"
        return 1
    fi
    
    print_success "Docker installation is valid"
    return 0
}

# Function to validate Docker Compose files
validate_compose_files() {
    print_status "Validating Docker Compose files..."
    
    local compose_cmd=$(get_compose_cmd)
    
    # Validate development compose file
    if [ -f "$DEV_COMPOSE_FILE" ]; then
        print_status "Validating $DEV_COMPOSE_FILE..."
        if $compose_cmd -f "$DEV_COMPOSE_FILE" config >/dev/null 2>&1; then
            print_success "$DEV_COMPOSE_FILE is valid"
        else
            print_error "$DEV_COMPOSE_FILE has syntax errors"
            $compose_cmd -f "$DEV_COMPOSE_FILE" config
            return 1
        fi
    else
        print_error "$DEV_COMPOSE_FILE not found"
        return 1
    fi
    
    # Validate production compose file
    if [ -f "$PROD_COMPOSE_FILE" ]; then
        print_status "Validating $PROD_COMPOSE_FILE..."
        if $compose_cmd -f "$PROD_COMPOSE_FILE" config >/dev/null 2>&1; then
            print_success "$PROD_COMPOSE_FILE is valid"
        else
            print_error "$PROD_COMPOSE_FILE has syntax errors"
            $compose_cmd -f "$PROD_COMPOSE_FILE" config
            return 1
        fi
    else
        print_error "$PROD_COMPOSE_FILE not found"
        return 1
    fi
    
    return 0
}

# Function to validate Dockerfiles
validate_dockerfiles() {
    print_status "Validating Dockerfiles..."
    
    local dockerfiles=(
        "docker/frontend/Dockerfile"
        "docker/backend/Dockerfile"
        "docker/auth-server/Dockerfile"
    )
    
    for dockerfile in "${dockerfiles[@]}"; do
        if [ -f "$dockerfile" ]; then
            print_status "Validating $dockerfile..."
            
            # Basic syntax check using docker build --dry-run (if available)
            # For now, just check if file exists and has content
            if [ -s "$dockerfile" ]; then
                print_success "$dockerfile exists and has content"
            else
                print_error "$dockerfile is empty"
                return 1
            fi
        else
            print_error "$dockerfile not found"
            return 1
        fi
    done
    
    return 0
}

# Function to validate environment files
validate_environment_files() {
    print_status "Validating environment files..."
    
    local env_files=(
        ".env.example"
        "docker/.env.example"
        "backend/.env.example"
        "frontend/.env.example"
        "auth-server/.env.example"
    )
    
    for env_file in "${env_files[@]}"; do
        if [ -f "$env_file" ]; then
            print_success "$env_file exists"
        else
            print_warning "$env_file not found (optional)"
        fi
    done
    
    return 0
}

# Function to validate configuration files
validate_config_files() {
    print_status "Validating configuration files..."
    
    local config_files=(
        "docker/nginx/nginx-prod.conf"
        "docker/redis/redis-dev.conf"
        "docker/redis/redis-prod.conf"
        "docker/postgres/postgresql.conf"
        "docker/postgres/postgresql-prod.conf"
    )
    
    for config_file in "${config_files[@]}"; do
        if [ -f "$config_file" ]; then
            print_success "$config_file exists"
        else
            print_warning "$config_file not found (will use defaults)"
        fi
    done
    
    return 0
}

# Function to validate scripts
validate_scripts() {
    print_status "Validating setup scripts..."
    
    local scripts=(
        "scripts/docker-dev-setup.sh"
        "scripts/docker-utils.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            if [ -x "$script" ]; then
                print_success "$script exists and is executable"
            else
                print_warning "$script exists but is not executable"
                chmod +x "$script"
                print_success "Made $script executable"
            fi
        else
            print_error "$script not found"
            return 1
        fi
    done
    
    return 0
}

# Function to test image building
test_image_building() {
    print_status "Testing Docker image building..."
    
    local compose_cmd=$(get_compose_cmd)
    
    print_status "Testing development image builds..."
    if $compose_cmd -f "$DEV_COMPOSE_FILE" build --no-cache >/dev/null 2>&1; then
        print_success "Development images build successfully"
    else
        print_error "Failed to build development images"
        return 1
    fi
    
    # Clean up built images to save space
    print_status "Cleaning up test images..."
    docker image prune -f >/dev/null 2>&1
    
    return 0
}

# Function to test network connectivity
test_network_connectivity() {
    print_status "Testing network connectivity..."
    
    # Test if we can pull base images
    local base_images=(
        "node:20-alpine"
        "python:3.11-slim"
        "postgres:15-alpine"
        "redis:7-alpine"
        "nginx:alpine"
    )
    
    for image in "${base_images[@]}"; do
        print_status "Testing pull for $image..."
        if docker pull "$image" >/dev/null 2>&1; then
            print_success "Successfully pulled $image"
        else
            print_error "Failed to pull $image"
            return 1
        fi
    done
    
    return 0
}

# Function to check system resources
check_system_resources() {
    print_status "Checking system resources..."
    
    # Check available memory
    if command_exists free; then
        local available_mem=$(free -m | awk 'NR==2{printf "%.0f", $7}')
        print_status "Available memory: ${available_mem}MB"
        
        if [ "$available_mem" -lt 2048 ]; then
            print_warning "Available memory is less than 2GB. Performance may be affected."
        else
            print_success "Sufficient memory available"
        fi
    elif command_exists vm_stat; then
        # macOS memory check
        local free_blocks=$(vm_stat | grep free | awk '{ print $3 }' | sed 's/\.//')
        local free_mb=$((free_blocks * 4096 / 1024 / 1024))
        print_status "Available memory: ${free_mb}MB"
        
        if [ "$free_mb" -lt 2048 ]; then
            print_warning "Available memory is less than 2GB. Performance may be affected."
        else
            print_success "Sufficient memory available"
        fi
    else
        print_warning "Cannot determine available memory"
    fi
    
    # Check available disk space
    local available_space=$(df . | tail -1 | awk '{print $4}')
    local available_gb=$((available_space / 1024 / 1024))
    print_status "Available disk space: ${available_gb}GB"
    
    if [ "$available_gb" -lt 10 ]; then
        print_warning "Available disk space is less than 10GB. You may need more space."
    else
        print_success "Sufficient disk space available"
    fi
    
    return 0
}

# Function to run comprehensive validation
run_validation() {
    local failed_checks=0
    
    echo "🔍 SizeWise Suite Docker Setup Validation"
    echo "========================================"
    echo ""
    
    # Run all validation checks
    check_docker_installation || ((failed_checks++))
    echo ""
    
    validate_compose_files || ((failed_checks++))
    echo ""
    
    validate_dockerfiles || ((failed_checks++))
    echo ""
    
    validate_environment_files || ((failed_checks++))
    echo ""
    
    validate_config_files || ((failed_checks++))
    echo ""
    
    validate_scripts || ((failed_checks++))
    echo ""
    
    check_system_resources || ((failed_checks++))
    echo ""
    
    # Optional tests (don't count as failures)
    print_status "Running optional tests..."
    
    if test_network_connectivity; then
        print_success "Network connectivity test passed"
    else
        print_warning "Network connectivity test failed (may be due to network restrictions)"
    fi
    echo ""
    
    if test_image_building; then
        print_success "Image building test passed"
    else
        print_warning "Image building test failed (may be due to resource constraints)"
    fi
    echo ""
    
    # Summary
    if [ $failed_checks -eq 0 ]; then
        print_success "✅ All validation checks passed!"
        print_success "Your Docker setup is ready for SizeWise Suite deployment."
        echo ""
        echo "Next steps:"
        echo "  1. Run './scripts/docker-dev-setup.sh' to start development environment"
        echo "  2. Access the application at http://localhost:3000"
        echo "  3. Use './scripts/docker-utils.sh' for management commands"
        return 0
    else
        print_error "❌ $failed_checks validation check(s) failed!"
        print_error "Please fix the issues above before proceeding."
        return 1
    fi
}

# Main execution
main() {
    run_validation
}

# Handle script interruption
trap 'print_error "Validation interrupted by user"; exit 1' INT TERM

# Run main function
main "$@"
