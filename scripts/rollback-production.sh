#!/bin/bash

# SizeWise Suite Production Rollback Script
# This script rolls back to the previous deployment backup

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="/var/backups/sizewise"
LOG_FILE="/var/log/sizewise-rollback.log"

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

# Find latest backup
find_latest_backup() {
    if [[ -f "$PROJECT_ROOT/.last_backup" ]]; then
        BACKUP_PATH=$(cat "$PROJECT_ROOT/.last_backup")
        if [[ -d "$BACKUP_PATH" ]]; then
            log "Found backup: $BACKUP_PATH"
            return 0
        fi
    fi
    
    # Find most recent backup directory
    BACKUP_PATH=$(find "$BACKUP_DIR" -name "backup_*" -type d | sort -r | head -n1)
    
    if [[ -z "$BACKUP_PATH" ]]; then
        error "No backup found in $BACKUP_DIR"
    fi
    
    log "Using backup: $BACKUP_PATH"
}

# Confirm rollback
confirm_rollback() {
    echo -e "${YELLOW}WARNING: This will rollback the production deployment!${NC}"
    echo "Backup to restore: $BACKUP_PATH"
    echo "Current services will be stopped and replaced."
    echo ""
    read -p "Are you sure you want to proceed? (yes/no): " -r
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "Rollback cancelled by user"
        exit 0
    fi
}

# Stop current services
stop_services() {
    log "Stopping current services..."
    cd "$PROJECT_ROOT"
    
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --timeout 30
    
    success "Services stopped"
}

# Restore configuration files
restore_config() {
    log "Restoring configuration files..."
    
    # Backup current files before restoring
    CURRENT_BACKUP="$BACKUP_DIR/pre_rollback_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$CURRENT_BACKUP"
    
    cp "$PROJECT_ROOT/$ENV_FILE" "$CURRENT_BACKUP/" 2>/dev/null || true
    cp "$PROJECT_ROOT/$COMPOSE_FILE" "$CURRENT_BACKUP/" 2>/dev/null || true
    
    # Restore from backup
    if [[ -f "$BACKUP_PATH/$ENV_FILE" ]]; then
        cp "$BACKUP_PATH/$ENV_FILE" "$PROJECT_ROOT/"
        success "Environment file restored"
    else
        warning "No environment file in backup"
    fi
    
    if [[ -f "$BACKUP_PATH/$COMPOSE_FILE" ]]; then
        cp "$BACKUP_PATH/$COMPOSE_FILE" "$PROJECT_ROOT/"
        success "Docker Compose file restored"
    else
        warning "No Docker Compose file in backup"
    fi
}

# Restore database
restore_database() {
    log "Restoring database..."
    
    if [[ ! -f "$BACKUP_PATH/database_backup.sql" ]]; then
        warning "No database backup found, skipping database restore"
        return 0
    fi
    
    # Start only PostgreSQL for restore
    cd "$PROJECT_ROOT"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres
    
    # Wait for PostgreSQL to be ready
    log "Waiting for PostgreSQL to be ready..."
    sleep 30
    
    # Restore database
    log "Restoring database from backup..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres psql -U sizewise -d postgres < "$BACKUP_PATH/database_backup.sql"
    
    success "Database restored"
}

# Start services
start_services() {
    log "Starting services..."
    cd "$PROJECT_ROOT"
    
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
        error "Some containers are not running properly after rollback"
    fi
    
    # Check health endpoints
    log "Checking health endpoints..."
    
    # Backend health check
    if ! curl -f http://localhost:5000/api/health &> /dev/null; then
        error "Backend health check failed after rollback"
    fi
    
    # Auth server health check
    if ! curl -f http://localhost:5001/api/health &> /dev/null; then
        error "Auth server health check failed after rollback"
    fi
    
    # Nginx health check
    if ! curl -f http://localhost/health &> /dev/null; then
        error "Nginx health check failed after rollback"
    fi
    
    success "All health checks passed after rollback"
}

# Main rollback function
main() {
    log "Starting SizeWise Suite production rollback..."
    
    find_latest_backup
    confirm_rollback
    stop_services
    restore_config
    restore_database
    start_services
    run_health_checks
    
    success "Rollback completed successfully!"
    log "Services have been restored to previous state"
    log "Restored from backup: $BACKUP_PATH"
}

# Handle script interruption
trap 'error "Rollback interrupted"' INT TERM

# Run main function
main "$@"
