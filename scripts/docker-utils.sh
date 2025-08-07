#!/bin/bash

# SizeWise Suite Docker Utilities Script
# This script provides common Docker management utilities

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
PROD_ENV_FILE="docker/.env.prod"

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

# Function to show help
show_help() {
    echo "SizeWise Suite Docker Utilities"
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  dev-start       Start development environment"
    echo "  dev-stop        Stop development environment"
    echo "  dev-restart     Restart development environment"
    echo "  dev-logs        Show development logs"
    echo "  dev-status      Show development status"
    echo ""
    echo "  prod-start      Start production environment"
    echo "  prod-stop       Stop production environment"
    echo "  prod-restart    Restart production environment"
    echo "  prod-logs       Show production logs"
    echo "  prod-status     Show production status"
    echo ""
    echo "  backup          Create database backup"
    echo "  restore         Restore database from backup"
    echo "  clean           Clean up Docker resources"
    echo "  health          Check service health"
    echo "  shell           Open shell in container"
    echo ""
    echo "Options:"
    echo "  -f, --follow    Follow logs (for logs command)"
    echo "  -s, --service   Specify service name"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev-start"
    echo "  $0 dev-logs -f"
    echo "  $0 shell -s backend"
    echo "  $0 backup"
}

# Function to start development environment
dev_start() {
    print_status "Starting development environment..."
    $(get_compose_cmd) -f "$DEV_COMPOSE_FILE" up -d
    print_success "Development environment started"
    show_dev_urls
}

# Function to stop development environment
dev_stop() {
    print_status "Stopping development environment..."
    $(get_compose_cmd) -f "$DEV_COMPOSE_FILE" down
    print_success "Development environment stopped"
}

# Function to restart development environment
dev_restart() {
    print_status "Restarting development environment..."
    $(get_compose_cmd) -f "$DEV_COMPOSE_FILE" restart
    print_success "Development environment restarted"
}

# Function to show development logs
dev_logs() {
    local follow_flag=""
    local service=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--follow)
                follow_flag="-f"
                shift
                ;;
            -s|--service)
                service="$2"
                shift 2
                ;;
            *)
                service="$1"
                shift
                ;;
        esac
    done
    
    print_status "Showing development logs..."
    $(get_compose_cmd) -f "$DEV_COMPOSE_FILE" logs $follow_flag $service
}

# Function to show development status
dev_status() {
    print_status "Development environment status:"
    $(get_compose_cmd) -f "$DEV_COMPOSE_FILE" ps
}

# Function to start production environment
prod_start() {
    print_status "Starting production environment..."
    if [ -f "$PROD_ENV_FILE" ]; then
        $(get_compose_cmd) -f "$PROD_COMPOSE_FILE" --env-file "$PROD_ENV_FILE" up -d
    else
        $(get_compose_cmd) -f "$PROD_COMPOSE_FILE" up -d
    fi
    print_success "Production environment started"
}

# Function to stop production environment
prod_stop() {
    print_status "Stopping production environment..."
    $(get_compose_cmd) -f "$PROD_COMPOSE_FILE" down
    print_success "Production environment stopped"
}

# Function to restart production environment
prod_restart() {
    print_status "Restarting production environment..."
    $(get_compose_cmd) -f "$PROD_COMPOSE_FILE" restart
    print_success "Production environment restarted"
}

# Function to show production logs
prod_logs() {
    local follow_flag=""
    local service=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--follow)
                follow_flag="-f"
                shift
                ;;
            -s|--service)
                service="$2"
                shift 2
                ;;
            *)
                service="$1"
                shift
                ;;
        esac
    done
    
    print_status "Showing production logs..."
    $(get_compose_cmd) -f "$PROD_COMPOSE_FILE" logs $follow_flag $service
}

# Function to show production status
prod_status() {
    print_status "Production environment status:"
    $(get_compose_cmd) -f "$PROD_COMPOSE_FILE" ps
}

# Function to create database backup
backup() {
    print_status "Creating database backup..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="backups/sizewise_backup_$timestamp.sql"
    
    # Create backup directory if it doesn't exist
    mkdir -p backups
    
    # Determine which environment is running
    if docker ps --format "table {{.Names}}" | grep -q "sizewise-postgres-dev"; then
        print_status "Backing up development database..."
        docker exec sizewise-postgres-dev pg_dump -U sizewise sizewise_dev > "$backup_file"
    elif docker ps --format "table {{.Names}}" | grep -q "sizewise-postgres-prod"; then
        print_status "Backing up production database..."
        docker exec sizewise-postgres-prod pg_dump -U sizewise sizewise_suite > "$backup_file"
    else
        print_error "No running PostgreSQL container found"
        exit 1
    fi
    
    print_success "Database backup created: $backup_file"
}

# Function to restore database from backup
restore() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        print_error "Please specify backup file"
        echo "Usage: $0 restore <backup_file>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_warning "This will restore the database from backup. All current data will be lost!"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Restore cancelled"
        exit 0
    fi
    
    print_status "Restoring database from backup..."
    
    # Determine which environment is running
    if docker ps --format "table {{.Names}}" | grep -q "sizewise-postgres-dev"; then
        print_status "Restoring to development database..."
        docker exec -i sizewise-postgres-dev psql -U sizewise sizewise_dev < "$backup_file"
    elif docker ps --format "table {{.Names}}" | grep -q "sizewise-postgres-prod"; then
        print_status "Restoring to production database..."
        docker exec -i sizewise-postgres-prod psql -U sizewise sizewise_suite < "$backup_file"
    else
        print_error "No running PostgreSQL container found"
        exit 1
    fi
    
    print_success "Database restored from backup"
}

# Function to clean up Docker resources
clean() {
    print_warning "This will remove all stopped containers, unused networks, images, and build cache"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Clean up cancelled"
        exit 0
    fi
    
    print_status "Cleaning up Docker resources..."
    
    # Remove stopped containers
    docker container prune -f
    
    # Remove unused networks
    docker network prune -f
    
    # Remove unused images
    docker image prune -a -f
    
    # Remove build cache
    docker builder prune -f
    
    print_success "Docker cleanup completed"
}

# Function to check service health
health() {
    print_status "Checking service health..."
    
    # Check development services
    if docker ps --format "table {{.Names}}" | grep -q "sizewise.*-dev"; then
        echo ""
        print_status "Development Services:"
        
        # Frontend
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            print_success "Frontend: ✓ Healthy"
        else
            print_error "Frontend: ✗ Unhealthy"
        fi
        
        # Backend
        if curl -f http://localhost:5050/api/health >/dev/null 2>&1; then
            print_success "Backend: ✓ Healthy"
        else
            print_error "Backend: ✗ Unhealthy"
        fi
        
        # Auth Server
        if curl -f http://localhost:5051/api/health >/dev/null 2>&1; then
            print_success "Auth Server: ✓ Healthy"
        else
            print_error "Auth Server: ✗ Unhealthy"
        fi
        
        # Database
        if docker exec sizewise-postgres-dev pg_isready -U sizewise >/dev/null 2>&1; then
            print_success "Database: ✓ Healthy"
        else
            print_error "Database: ✗ Unhealthy"
        fi
        
        # Redis
        if docker exec sizewise-redis-dev redis-cli ping >/dev/null 2>&1; then
            print_success "Redis: ✓ Healthy"
        else
            print_error "Redis: ✗ Unhealthy"
        fi
    fi
    
    # Check production services
    if docker ps --format "table {{.Names}}" | grep -q "sizewise.*-prod"; then
        echo ""
        print_status "Production Services:"
        
        # Check via NGINX if available
        if docker ps --format "table {{.Names}}" | grep -q "sizewise-nginx-prod"; then
            if curl -f http://localhost/health >/dev/null 2>&1; then
                print_success "Application: ✓ Healthy (via NGINX)"
            else
                print_error "Application: ✗ Unhealthy (via NGINX)"
            fi
        fi
        
        # Database
        if docker exec sizewise-postgres-prod pg_isready -U sizewise >/dev/null 2>&1; then
            print_success "Database: ✓ Healthy"
        else
            print_error "Database: ✗ Unhealthy"
        fi
        
        # Redis
        if docker exec sizewise-redis-prod redis-cli ping >/dev/null 2>&1; then
            print_success "Redis: ✓ Healthy"
        else
            print_error "Redis: ✗ Unhealthy"
        fi
    fi
    
    if ! docker ps --format "table {{.Names}}" | grep -q "sizewise"; then
        print_warning "No SizeWise services are currently running"
    fi
}

# Function to open shell in container
shell() {
    local service="backend"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -s|--service)
                service="$2"
                shift 2
                ;;
            *)
                service="$1"
                shift
                ;;
        esac
    done
    
    # Determine environment and container name
    local container_name=""
    if docker ps --format "table {{.Names}}" | grep -q "sizewise-${service}-dev"; then
        container_name="sizewise-${service}-dev"
    elif docker ps --format "table {{.Names}}" | grep -q "sizewise-${service}-prod"; then
        container_name="sizewise-${service}-prod"
    else
        print_error "Container for service '$service' not found or not running"
        exit 1
    fi
    
    print_status "Opening shell in $container_name..."
    docker exec -it "$container_name" /bin/bash
}

# Function to show development URLs
show_dev_urls() {
    echo ""
    echo "Development URLs:"
    echo "  Frontend:     http://localhost:3000"
    echo "  Backend API:  http://localhost:5050/api"
    echo "  Auth API:     http://localhost:5051/api"
    echo ""
}

# Main execution
main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    local command="$1"
    shift
    
    case $command in
        dev-start)
            dev_start "$@"
            ;;
        dev-stop)
            dev_stop "$@"
            ;;
        dev-restart)
            dev_restart "$@"
            ;;
        dev-logs)
            dev_logs "$@"
            ;;
        dev-status)
            dev_status "$@"
            ;;
        prod-start)
            prod_start "$@"
            ;;
        prod-stop)
            prod_stop "$@"
            ;;
        prod-restart)
            prod_restart "$@"
            ;;
        prod-logs)
            prod_logs "$@"
            ;;
        prod-status)
            prod_status "$@"
            ;;
        backup)
            backup "$@"
            ;;
        restore)
            restore "$@"
            ;;
        clean)
            clean "$@"
            ;;
        health)
            health "$@"
            ;;
        shell)
            shell "$@"
            ;;
        -h|--help|help)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
