#!/bin/bash

# SizeWise Suite Docker Development Script
# This script provides convenient commands for Docker-based development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if .env file exists
check_env() {
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f "docker/.env.example" ]; then
            cp docker/.env.example .env
            print_success "Created .env file from template. Please update it with your configuration."
        else
            print_error "Template .env file not found. Please create .env manually."
            exit 1
        fi
    fi
}

# Function to start development environment
start_dev() {
    print_status "Starting SizeWise Suite development environment..."
    check_docker
    check_env
    
    docker-compose -f docker-compose.dev.yml up -d
    
    print_success "Development environment started!"
    print_status "Services available at:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:5000"
    echo "  - Auth Server: http://localhost:5001"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
}

# Function to stop development environment
stop_dev() {
    print_status "Stopping SizeWise Suite development environment..."
    docker-compose -f docker-compose.dev.yml down
    print_success "Development environment stopped!"
}

# Function to restart development environment
restart_dev() {
    print_status "Restarting SizeWise Suite development environment..."
    stop_dev
    start_dev
}

# Function to view logs
logs() {
    local service=$1
    if [ -z "$service" ]; then
        print_status "Showing logs for all services..."
        docker-compose -f docker-compose.dev.yml logs -f
    else
        print_status "Showing logs for $service..."
        docker-compose -f docker-compose.dev.yml logs -f "$service"
    fi
}

# Function to run shell in container
shell() {
    local service=$1
    if [ -z "$service" ]; then
        print_error "Please specify a service: backend, frontend, auth-server, postgres"
        exit 1
    fi
    
    print_status "Opening shell in $service container..."
    docker-compose -f docker-compose.dev.yml exec "$service" /bin/bash
}

# Function to run tests
test() {
    local service=$1
    case $service in
        "frontend")
            print_status "Running frontend tests..."
            docker-compose -f docker-compose.dev.yml exec frontend npm test
            ;;
        "backend")
            print_status "Running backend tests..."
            docker-compose -f docker-compose.dev.yml exec backend python -m pytest
            ;;
        "all")
            print_status "Running all tests..."
            test frontend
            test backend
            ;;
        *)
            print_error "Please specify a service: frontend, backend, or all"
            exit 1
            ;;
    esac
}

# Function to clean up Docker resources
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker-compose -f docker-compose.dev.yml down -v
    docker system prune -f
    print_success "Cleanup completed!"
}

# Function to show status
status() {
    print_status "SizeWise Suite Docker Status:"
    docker-compose -f docker-compose.dev.yml ps
}

# Function to show help
show_help() {
    echo "SizeWise Suite Docker Development Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start the development environment"
    echo "  stop      Stop the development environment"
    echo "  restart   Restart the development environment"
    echo "  logs      Show logs for all services or specific service"
    echo "  shell     Open shell in specified container"
    echo "  test      Run tests for specified service or all"
    echo "  status    Show status of all services"
    echo "  cleanup   Stop services and clean up Docker resources"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs backend"
    echo "  $0 shell frontend"
    echo "  $0 test all"
}

# Main script logic
case "${1:-help}" in
    "start")
        start_dev
        ;;
    "stop")
        stop_dev
        ;;
    "restart")
        restart_dev
        ;;
    "logs")
        logs "$2"
        ;;
    "shell")
        shell "$2"
        ;;
    "test")
        test "$2"
        ;;
    "status")
        status
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|*)
        show_help
        ;;
esac
