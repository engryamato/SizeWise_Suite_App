#!/bin/bash

# SizeWise Suite Automated Rollback Script
# 
# Automated rollback mechanisms for failed deployments
# Part of Phase 1 bridging plan for deployment reliability
# 
# @see docs/post-implementation-bridging-plan.md Task 1.3

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_ROOT}/logs/rollback.log"
BACKUP_DIR="${PROJECT_ROOT}/backups"
ROLLBACK_TIMEOUT=300  # 5 minutes
DEPLOYMENT_HISTORY_FILE="${PROJECT_ROOT}/logs/deployment-history.json"

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

# Create necessary directories
mkdir -p "$(dirname "$LOG_FILE")" "$BACKUP_DIR"

# Notification function
send_notification() {
    local status=$1
    local message=$2
    local webhook_url="${SLACK_WEBHOOK_URL:-}"
    
    log_info "Sending rollback notification: $status"
    
    # Send to Slack if webhook is configured
    if [ -n "$webhook_url" ]; then
        local payload=$(cat <<EOF
{
    "text": "🔄 SizeWise Suite Rollback Alert",
    "attachments": [
        {
            "color": "$( [ "$status" = "success" ] && echo "good" || echo "danger" )",
            "fields": [
                {
                    "title": "Status",
                    "value": "$status",
                    "short": true
                },
                {
                    "title": "Environment",
                    "value": "${ENVIRONMENT:-production}",
                    "short": true
                },
                {
                    "title": "Message",
                    "value": "$message",
                    "short": false
                },
                {
                    "title": "Timestamp",
                    "value": "$(date -u '+%Y-%m-%d %H:%M:%S UTC')",
                    "short": true
                }
            ]
        }
    ]
}
EOF
        )
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$webhook_url" > /dev/null 2>&1 || log_warning "Failed to send Slack notification"
    fi
    
    # Log notification locally
    echo "{\"timestamp\": \"$(date -u '+%Y-%m-%d %H:%M:%S UTC')\", \"status\": \"$status\", \"message\": \"$message\"}" >> "${PROJECT_ROOT}/logs/rollback-notifications.log"
}

# Get last successful deployment
get_last_successful_deployment() {
    if [ -f "$DEPLOYMENT_HISTORY_FILE" ]; then
        # Get the most recent successful deployment
        local last_deployment=$(jq -r '.deployments | map(select(.status == "success")) | sort_by(.timestamp) | last | .deployment_id' "$DEPLOYMENT_HISTORY_FILE" 2>/dev/null)
        
        if [ "$last_deployment" != "null" ] && [ -n "$last_deployment" ]; then
            echo "$last_deployment"
            return 0
        fi
    fi
    
    log_warning "No successful deployment found in history"
    return 1
}

# Record deployment in history
record_deployment() {
    local deployment_id=$1
    local status=$2
    local timestamp=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
    
    # Create deployment history file if it doesn't exist
    if [ ! -f "$DEPLOYMENT_HISTORY_FILE" ]; then
        echo '{"deployments": []}' > "$DEPLOYMENT_HISTORY_FILE"
    fi
    
    # Add new deployment record
    local new_record=$(cat <<EOF
{
    "deployment_id": "$deployment_id",
    "status": "$status",
    "timestamp": "$timestamp",
    "environment": "${ENVIRONMENT:-production}"
}
EOF
    )
    
    jq ".deployments += [$new_record]" "$DEPLOYMENT_HISTORY_FILE" > "${DEPLOYMENT_HISTORY_FILE}.tmp" && \
    mv "${DEPLOYMENT_HISTORY_FILE}.tmp" "$DEPLOYMENT_HISTORY_FILE"
    
    log_info "Recorded deployment $deployment_id with status $status"
}

# Docker-based rollback
rollback_docker_deployment() {
    local target_deployment_id=$1
    
    log_info "Starting Docker-based rollback to deployment: $target_deployment_id"
    
    # Check if target deployment images exist
    local frontend_image="sizewise-frontend:$target_deployment_id"
    local backend_image="sizewise-backend:$target_deployment_id"
    
    if ! docker image inspect "$frontend_image" > /dev/null 2>&1; then
        log_error "Frontend image $frontend_image not found"
        return 1
    fi
    
    if ! docker image inspect "$backend_image" > /dev/null 2>&1; then
        log_error "Backend image $backend_image not found"
        return 1
    fi
    
    # Stop current services
    log_info "Stopping current services..."
    docker-compose down --timeout 30 || log_warning "Some services may not have stopped gracefully"
    
    # Update docker-compose to use target images
    log_info "Updating service configuration for rollback..."
    
    # Create rollback compose file
    cat > docker-compose.rollback.yml <<EOF
version: '3.8'
services:
  frontend:
    image: $frontend_image
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=\${NODE_ENV:-production}
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    image: $backend_image
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=\${FLASK_ENV:-production}
      - POSTGRES_HOST=\${POSTGRES_HOST:-postgres}
      - REDIS_HOST=\${REDIS_HOST:-redis}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=\${POSTGRES_DB:-sizewise}
      - POSTGRES_USER=\${POSTGRES_USER:-sizewise}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass \${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
EOF
    
    # Start services with rollback configuration
    log_info "Starting services with rollback configuration..."
    if docker-compose -f docker-compose.rollback.yml up -d; then
        log_success "Services started successfully with rollback configuration"
        return 0
    else
        log_error "Failed to start services with rollback configuration"
        return 1
    fi
}

# Git-based rollback (for source code)
rollback_git_deployment() {
    local target_commit=$1
    
    log_info "Starting Git-based rollback to commit: $target_commit"
    
    # Verify target commit exists
    if ! git rev-parse --verify "$target_commit" > /dev/null 2>&1; then
        log_error "Target commit $target_commit not found"
        return 1
    fi
    
    # Create backup of current state
    local current_commit=$(git rev-parse HEAD)
    log_info "Creating backup of current state: $current_commit"
    
    # Perform rollback
    if git checkout "$target_commit"; then
        log_success "Git rollback completed to commit: $target_commit"
        
        # Restart services to apply changes
        log_info "Restarting services to apply rollback..."
        if docker-compose restart; then
            log_success "Services restarted successfully"
            return 0
        else
            log_error "Failed to restart services after Git rollback"
            # Attempt to restore previous state
            git checkout "$current_commit"
            return 1
        fi
    else
        log_error "Git rollback failed"
        return 1
    fi
}

# Database rollback (if needed)
rollback_database() {
    local target_migration=$1
    
    log_info "Starting database rollback to migration: $target_migration"
    
    # Check if Alembic is available
    if command -v alembic > /dev/null 2>&1; then
        if alembic downgrade "$target_migration"; then
            log_success "Database rollback completed"
            return 0
        else
            log_error "Database rollback failed"
            return 1
        fi
    else
        log_warning "Alembic not available, skipping database rollback"
        return 0
    fi
}

# Verify rollback success
verify_rollback() {
    log_info "Verifying rollback success..."
    
    # Wait for services to stabilize
    sleep 30
    
    # Run health checks
    if "${SCRIPT_DIR}/health-check.sh"; then
        log_success "Rollback verification passed - system is healthy"
        return 0
    else
        log_error "Rollback verification failed - system still unhealthy"
        return 1
    fi
}

# Main rollback function
perform_rollback() {
    local rollback_type="${1:-auto}"
    local target_deployment="${2:-}"
    local start_time=$(date +%s)
    
    log_info "Starting automated rollback process..."
    log_info "Rollback type: $rollback_type"
    
    # Get target deployment if not specified
    if [ -z "$target_deployment" ]; then
        if ! target_deployment=$(get_last_successful_deployment); then
            log_error "Cannot determine target deployment for rollback"
            send_notification "failed" "Rollback failed: No target deployment found"
            return 1
        fi
    fi
    
    log_info "Target deployment for rollback: $target_deployment"
    
    # Record rollback attempt
    local rollback_id="rollback-$(date +%Y%m%d-%H%M%S)"
    record_deployment "$rollback_id" "in_progress"
    
    # Perform rollback based on type
    local rollback_success=false
    
    case "$rollback_type" in
        "docker")
            if rollback_docker_deployment "$target_deployment"; then
                rollback_success=true
            fi
            ;;
        "git")
            if rollback_git_deployment "$target_deployment"; then
                rollback_success=true
            fi
            ;;
        "auto"|*)
            # Try Docker rollback first, then Git rollback
            if rollback_docker_deployment "$target_deployment" || rollback_git_deployment "$target_deployment"; then
                rollback_success=true
            fi
            ;;
    esac
    
    # Verify rollback
    if [ "$rollback_success" = true ] && verify_rollback; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_success "Rollback completed successfully in ${duration} seconds"
        record_deployment "$rollback_id" "success"
        send_notification "success" "Rollback completed successfully to deployment $target_deployment in ${duration}s"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_error "Rollback failed after ${duration} seconds"
        record_deployment "$rollback_id" "failed"
        send_notification "failed" "Rollback failed after ${duration}s - manual intervention required"
        return 1
    fi
}

# Manual rollback function
manual_rollback() {
    local target_deployment=$1
    
    log_info "Starting manual rollback to deployment: $target_deployment"
    
    if perform_rollback "auto" "$target_deployment"; then
        log_success "Manual rollback completed successfully"
        return 0
    else
        log_error "Manual rollback failed"
        return 1
    fi
}

# Script execution
main() {
    local command="${1:-auto}"
    local target="${2:-}"
    
    log_info "SizeWise Suite Automated Rollback Script v1.0"
    
    case "$command" in
        "auto")
            log_info "Starting automated rollback..."
            perform_rollback "auto" "$target"
            ;;
        "manual")
            if [ -z "$target" ]; then
                log_error "Manual rollback requires target deployment ID"
                echo "Usage: $0 manual <deployment_id>"
                exit 1
            fi
            manual_rollback "$target"
            ;;
        "docker")
            if [ -z "$target" ]; then
                log_error "Docker rollback requires target deployment ID"
                echo "Usage: $0 docker <deployment_id>"
                exit 1
            fi
            perform_rollback "docker" "$target"
            ;;
        "git")
            if [ -z "$target" ]; then
                log_error "Git rollback requires target commit"
                echo "Usage: $0 git <commit_hash>"
                exit 1
            fi
            perform_rollback "git" "$target"
            ;;
        *)
            echo "Usage: $0 {auto|manual|docker|git} [target]"
            echo "  auto   - Automatic rollback to last successful deployment"
            echo "  manual - Manual rollback to specified deployment"
            echo "  docker - Docker-based rollback to specified deployment"
            echo "  git    - Git-based rollback to specified commit"
            exit 1
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
