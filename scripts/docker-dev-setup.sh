#!/bin/bash

# SizeWise Suite Development Environment Setup Script
# This script sets up the complete development environment using Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.dev.yml"
ENV_FILE=".env"
DOCKER_ENV_FILE="docker/.env"

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

# Function to check Docker installation
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check available memory (Linux/macOS)
    if command_exists free; then
        AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
        if [ "$AVAILABLE_MEM" -lt 2048 ]; then
            print_warning "Available memory is less than 2GB. Performance may be affected."
        fi
    elif command_exists vm_stat; then
        # macOS memory check
        FREE_BLOCKS=$(vm_stat | grep free | awk '{ print $3 }' | sed 's/\.//')
        FREE_MB=$((FREE_BLOCKS * 4096 / 1024 / 1024))
        if [ "$FREE_MB" -lt 2048 ]; then
            print_warning "Available memory is less than 2GB. Performance may be affected."
        fi
    fi
    
    # Check available disk space
    AVAILABLE_SPACE=$(df . | tail -1 | awk '{print $4}')
    if [ "$AVAILABLE_SPACE" -lt 5242880 ]; then  # 5GB in KB
        print_warning "Available disk space is less than 5GB. You may need more space."
    fi
    
    print_success "System requirements check completed"
}

# Function to setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Copy main environment file
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example "$ENV_FILE"
            print_success "Created $ENV_FILE from template"
        else
            print_error ".env.example not found. Please ensure you're in the project root directory."
            exit 1
        fi
    else
        print_warning "$ENV_FILE already exists. Skipping..."
    fi
    
    # Copy Docker environment file
    if [ ! -f "$DOCKER_ENV_FILE" ]; then
        if [ -f "docker/.env.example" ]; then
            cp docker/.env.example "$DOCKER_ENV_FILE"
            print_success "Created $DOCKER_ENV_FILE from template"
        else
            print_warning "docker/.env.example not found. Using default values."
        fi
    else
        print_warning "$DOCKER_ENV_FILE already exists. Skipping..."
    fi
    
    # Copy service-specific environment files
    for service in backend frontend auth-server; do
        if [ -f "$service/.env.example" ] && [ ! -f "$service/.env" ]; then
            cp "$service/.env.example" "$service/.env"
            print_success "Created $service/.env from template"
        fi
    done
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    directories=(
        "logs"
        "data"
        "uploads"
        "temp/exports"
        "backups"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_success "Created directory: $dir"
        fi
    done
}

# Function to pull Docker images
pull_images() {
    print_status "Pulling Docker images..."
    
    if command_exists docker-compose; then
        docker-compose -f "$COMPOSE_FILE" pull
    else
        docker compose -f "$COMPOSE_FILE" pull
    fi
    
    print_success "Docker images pulled successfully"
}

# Function to build custom images
build_images() {
    print_status "Building custom Docker images..."
    
    if command_exists docker-compose; then
        docker-compose -f "$COMPOSE_FILE" build --no-cache
    else
        docker compose -f "$COMPOSE_FILE" build --no-cache
    fi
    
    print_success "Docker images built successfully"
}

# Function to start services
start_services() {
    print_status "Starting development services..."
    
    if command_exists docker-compose; then
        docker-compose -f "$COMPOSE_FILE" up -d
    else
        docker compose -f "$COMPOSE_FILE" up -d
    fi
    
    print_success "Services started successfully"
}

# Function to wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for database
    print_status "Waiting for PostgreSQL..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker exec sizewise-postgres-dev pg_isready -U sizewise -d sizewise_dev >/dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "PostgreSQL failed to start within 60 seconds"
        exit 1
    fi
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    timeout=30
    while [ $timeout -gt 0 ]; do
        if docker exec sizewise-redis-dev redis-cli ping >/dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Redis failed to start within 30 seconds"
        exit 1
    fi
    
    # Wait for backend API
    print_status "Waiting for Backend API..."
    timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:5050/api/health >/dev/null 2>&1; then
            break
        fi
        sleep 3
        timeout=$((timeout - 3))
    done
    
    if [ $timeout -le 0 ]; then
        print_warning "Backend API health check failed, but continuing..."
    fi
    
    # Wait for auth server
    print_status "Waiting for Auth Server..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:5051/api/health >/dev/null 2>&1; then
            break
        fi
        sleep 3
        timeout=$((timeout - 3))
    done
    
    if [ $timeout -le 0 ]; then
        print_warning "Auth Server health check failed, but continuing..."
    fi
    
    # Wait for frontend
    print_status "Waiting for Frontend..."
    timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            break
        fi
        sleep 3
        timeout=$((timeout - 3))
    done
    
    if [ $timeout -le 0 ]; then
        print_warning "Frontend health check failed, but continuing..."
    fi
    
    print_success "Services are ready!"
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    
    if command_exists docker-compose; then
        docker-compose -f "$COMPOSE_FILE" ps
    else
        docker compose -f "$COMPOSE_FILE" ps
    fi
}

# Function to show access URLs
show_urls() {
    echo ""
    print_success "🎉 SizeWise Suite Development Environment is ready!"
    echo ""
    echo "Access URLs:"
    echo "  Frontend:     http://localhost:3000"
    echo "  Backend API:  http://localhost:5050/api"
    echo "  Auth API:     http://localhost:5051/api"
    echo "  Database:     localhost:5432"
    echo "  Redis:        localhost:6379"
    echo ""
    echo "Useful Commands:"
    echo "  View logs:    docker-compose -f $COMPOSE_FILE logs -f"
    echo "  Stop:         docker-compose -f $COMPOSE_FILE down"
    echo "  Restart:      docker-compose -f $COMPOSE_FILE restart"
    echo "  Clean up:     docker-compose -f $COMPOSE_FILE down -v"
    echo ""
}

# Main execution
main() {
    echo "🐳 SizeWise Suite Development Environment Setup"
    echo "=============================================="
    echo ""
    
    check_docker
    check_requirements
    setup_environment
    create_directories
    pull_images
    build_images
    start_services
    wait_for_services
    show_status
    show_urls
    
    print_success "Setup completed successfully! 🚀"
}

# Handle script interruption
trap 'print_error "Setup interrupted by user"; exit 1' INT TERM

# Run main function
main "$@"
