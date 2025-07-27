#!/bin/bash

# SizeWise Suite Production Deployment Script
# This script automates the production deployment process with safety checks

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="/var/backups/sizewise"
LOG_FILE="/var/log/sizewise-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Pre-deployment checks
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if running as root or with sudo
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root. Consider using a dedicated deployment user."
    fi
    
    # Check Docker installation
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running. Please start Docker service."
    fi
    
    # Check if project files exist
    if [[ ! -f "$PROJECT_ROOT/$COMPOSE_FILE" ]]; then
        error "Production Docker Compose file not found: $COMPOSE_FILE"
    fi
    
    if [[ ! -f "$PROJECT_ROOT/$ENV_FILE" ]]; then
        error "Production environment file not found: $ENV_FILE"
    fi
    
    success "Prerequisites check passed"
}

# Create backup of current deployment
create_backup() {
    log "Creating backup of current deployment..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Backup timestamp
    BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/backup_$BACKUP_TIMESTAMP"
    
    # Create backup directory for this deployment
    mkdir -p "$BACKUP_PATH"
    
    # Backup database if containers are running
    if docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" --env-file "$PROJECT_ROOT/$ENV_FILE" ps postgres | grep -q "Up"; then
        log "Backing up PostgreSQL database..."
        docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" --env-file "$PROJECT_ROOT/$ENV_FILE" exec -T postgres pg_dumpall -U sizewise > "$BACKUP_PATH/database_backup.sql"
        success "Database backup created: $BACKUP_PATH/database_backup.sql"
    else
        warning "PostgreSQL container not running, skipping database backup"
    fi
    
    # Backup environment file
    cp "$PROJECT_ROOT/$ENV_FILE" "$BACKUP_PATH/"
    
    # Backup Docker Compose file
    cp "$PROJECT_ROOT/$COMPOSE_FILE" "$BACKUP_PATH/"
    
    success "Backup created: $BACKUP_PATH"
    echo "$BACKUP_PATH" > "$PROJECT_ROOT/.last_backup"
}

# Pull latest images
pull_images() {
    log "Pulling latest Docker images..."
    cd "$PROJECT_ROOT"
    
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
    
    success "Images pulled successfully"
}

# Deploy services
deploy_services() {
    log "Deploying services..."
    cd "$PROJECT_ROOT"
    
    # Stop existing services gracefully
    log "Stopping existing services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --timeout 30
    
    # Start services
    log "Starting services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    success "Services started"
}

# Health checks
run_health_checks() {
    log "Running health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check container status
    log "Checking container status..."
    if ! docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" --env-file "$PROJECT_ROOT/$ENV_FILE" ps | grep -q "Up"; then
        error "Some containers are not running properly"
    fi
    
    # Check health endpoints
    log "Checking health endpoints..."
    
    # Backend health check
    if ! curl -f http://localhost:5000/api/health &> /dev/null; then
        error "Backend health check failed"
    fi
    
    # Auth server health check
    if ! curl -f http://localhost:5001/api/health &> /dev/null; then
        error "Auth server health check failed"
    fi
    
    # Nginx health check
    if ! curl -f http://localhost/health &> /dev/null; then
        error "Nginx health check failed"
    fi
    
    success "All health checks passed"
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old images and containers..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f
    
    success "Cleanup completed"
}

# Main deployment function
main() {
    log "Starting SizeWise Suite production deployment..."
    
    check_prerequisites
    create_backup
    pull_images
    deploy_services
    run_health_checks
    cleanup
    
    success "Deployment completed successfully!"
    log "Services are running and healthy"
    log "Backup location: $(cat "$PROJECT_ROOT/.last_backup" 2>/dev/null || echo "No backup created")"
}

# Handle script interruption
trap 'error "Deployment interrupted"' INT TERM

# Run main function
main "$@"
