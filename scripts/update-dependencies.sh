#!/bin/bash

# =============================================================================
# SizeWise Suite - Automated Dependency Update Script
# =============================================================================
# 
# This script provides automated dependency updates with safety checks,
# rollback capabilities, and comprehensive validation.
#
# Usage:
#   ./scripts/update-dependencies.sh [--dry-run] [--frontend-only] [--backend-only]
#
# Options:
#   --dry-run        Show what would be updated without making changes
#   --frontend-only  Update only frontend dependencies
#   --backend-only   Update only backend dependencies
#   --force          Skip interactive confirmations
#   --rollback       Rollback to previous dependency versions
#
# =============================================================================

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/.dependency-backups"
LOG_FILE="$PROJECT_ROOT/dependency-update.log"
DATE_STAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
DRY_RUN=false
FRONTEND_ONLY=false
BACKEND_ONLY=false
FORCE=false
ROLLBACK=false

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

confirm() {
    if [ "$FORCE" = true ]; then
        return 0
    fi
    
    read -p "$1 (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# =============================================================================
# Backup Functions
# =============================================================================

create_backup() {
    log "Creating dependency backup..."
    
    mkdir -p "$BACKUP_DIR/$DATE_STAMP"
    
    # Backup frontend dependencies
    if [ -f "$PROJECT_ROOT/package.json" ]; then
        cp "$PROJECT_ROOT/package.json" "$BACKUP_DIR/$DATE_STAMP/package.json.backup"
        cp "$PROJECT_ROOT/package-lock.json" "$BACKUP_DIR/$DATE_STAMP/package-lock.json.backup" 2>/dev/null || true
    fi
    
    # Backup backend dependencies
    if [ -f "$PROJECT_ROOT/requirements.txt" ]; then
        cp "$PROJECT_ROOT/requirements.txt" "$BACKUP_DIR/$DATE_STAMP/requirements.txt.backup"
    fi
    
    # Create backup manifest
    cat > "$BACKUP_DIR/$DATE_STAMP/backup-manifest.json" << EOF
{
    "timestamp": "$DATE_STAMP",
    "created_by": "$(whoami)",
    "project_root": "$PROJECT_ROOT",
    "files_backed_up": [
        "package.json",
        "package-lock.json",
        "requirements.txt"
    ]
}
EOF
    
    log "Backup created at: $BACKUP_DIR/$DATE_STAMP"
}

restore_backup() {
    local backup_date="$1"
    
    if [ -z "$backup_date" ]; then
        # Find latest backup
        backup_date=$(ls -1 "$BACKUP_DIR" | sort -r | head -n 1)
    fi
    
    if [ ! -d "$BACKUP_DIR/$backup_date" ]; then
        error "Backup not found: $backup_date"
    fi
    
    log "Restoring backup from: $backup_date"
    
    # Restore frontend dependencies
    if [ -f "$BACKUP_DIR/$backup_date/package.json.backup" ]; then
        cp "$BACKUP_DIR/$backup_date/package.json.backup" "$PROJECT_ROOT/package.json"
        cp "$BACKUP_DIR/$backup_date/package-lock.json.backup" "$PROJECT_ROOT/package-lock.json" 2>/dev/null || true
        
        cd "$PROJECT_ROOT"
        npm ci
    fi
    
    # Restore backend dependencies
    if [ -f "$BACKUP_DIR/$backup_date/requirements.txt.backup" ]; then
        cp "$BACKUP_DIR/$backup_date/requirements.txt.backup" "$PROJECT_ROOT/requirements.txt"
        
        cd "$PROJECT_ROOT"
        pip install -r requirements.txt
    fi
    
    log "Backup restored successfully"
}

# =============================================================================
# Security Scanning Functions
# =============================================================================

scan_frontend_security() {
    log "Scanning frontend dependencies for security vulnerabilities..."
    
    cd "$PROJECT_ROOT"
    
    # Run npm audit
    if npm audit --audit-level=moderate; then
        log "Frontend security scan passed"
        return 0
    else
        warn "Frontend security vulnerabilities detected"
        return 1
    fi
}

scan_backend_security() {
    log "Scanning backend dependencies for security vulnerabilities..."
    
    cd "$PROJECT_ROOT"
    
    # Check if safety is installed
    if ! command -v safety &> /dev/null; then
        warn "Safety not installed, installing..."
        pip install safety
    fi
    
    # Run safety check
    if safety check; then
        log "Backend security scan passed"
        return 0
    else
        warn "Backend security vulnerabilities detected"
        return 1
    fi
}

# =============================================================================
# Update Functions
# =============================================================================

update_frontend_dependencies() {
    log "Updating frontend dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Check for outdated packages
    info "Checking for outdated packages..."
    npm outdated || true
    
    if [ "$DRY_RUN" = true ]; then
        info "DRY RUN: Would update frontend dependencies"
        return 0
    fi
    
    # Update high-priority packages
    log "Updating high-priority packages..."
    
    # Update @types/node (with caution for major version)
    if confirm "Update @types/node to latest version?"; then
        npm install --save-dev @types/node@latest
    fi
    
    # Update Electron (major version - requires testing)
    if confirm "Update Electron to latest version? (Major version change - requires testing)"; then
        npm install --save-dev electron@latest
    fi
    
    # Update development tools
    if confirm "Update development tools (concurrently, wait-on)?"; then
        npm install --save-dev concurrently@latest wait-on@latest
    fi
    
    # Update electron-is-dev
    if confirm "Update electron-is-dev?"; then
        npm install --save-dev electron-is-dev@latest
    fi
    
    log "Frontend dependencies updated"
}

update_backend_dependencies() {
    log "Updating backend dependencies..."
    
    cd "$PROJECT_ROOT"
    
    if [ "$DRY_RUN" = true ]; then
        info "DRY RUN: Would update backend dependencies"
        return 0
    fi
    
    # Update high-priority packages
    log "Updating high-priority packages..."
    
    # Update NumPy (performance improvements)
    if confirm "Update NumPy to latest version?"; then
        pip install --upgrade numpy
    fi
    
    # Update development tools
    if confirm "Update development tools (black, mypy, pytest)?"; then
        pip install --upgrade black mypy pytest pytest-cov
    fi
    
    # Update documentation tools
    if confirm "Update documentation tools (sphinx)?"; then
        pip install --upgrade sphinx sphinx-rtd-theme
    fi
    
    # Update other packages
    if confirm "Update other non-critical packages?"; then
        pip install --upgrade \
            structlog \
            python-dateutil \
            click \
            requests
    fi
    
    # Generate new requirements.txt
    log "Generating new requirements.txt..."
    pip freeze > requirements.txt
    
    log "Backend dependencies updated"
}

# =============================================================================
# Validation Functions
# =============================================================================

validate_frontend() {
    log "Validating frontend after updates..."
    
    cd "$PROJECT_ROOT"
    
    # TypeScript compilation check
    if command -v tsc &> /dev/null; then
        info "Checking TypeScript compilation..."
        if npx tsc --noEmit; then
            log "TypeScript compilation successful"
        else
            error "TypeScript compilation failed"
        fi
    fi
    
    # Build check
    info "Testing build process..."
    if npm run build; then
        log "Build process successful"
    else
        error "Build process failed"
    fi
    
    # Test suite
    info "Running test suite..."
    if npm test; then
        log "Test suite passed"
    else
        warn "Test suite failed - review required"
    fi
}

validate_backend() {
    log "Validating backend after updates..."
    
    cd "$PROJECT_ROOT"
    
    # Import test
    info "Testing Python imports..."
    if python -c "import numpy, pandas, flask, pydantic; print('All imports successful')"; then
        log "Python imports successful"
    else
        error "Python import test failed"
    fi
    
    # Test suite
    info "Running backend test suite..."
    if python -m pytest tests/ -v; then
        log "Backend test suite passed"
    else
        warn "Backend test suite failed - review required"
    fi
}

# =============================================================================
# Main Functions
# =============================================================================

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    --dry-run        Show what would be updated without making changes
    --frontend-only  Update only frontend dependencies
    --backend-only   Update only backend dependencies
    --force          Skip interactive confirmations
    --rollback       Rollback to previous dependency versions
    --help           Show this help message

Examples:
    $0                          # Interactive update of all dependencies
    $0 --dry-run               # Show what would be updated
    $0 --frontend-only         # Update only frontend dependencies
    $0 --backend-only --force  # Update backend dependencies without prompts
    $0 --rollback              # Rollback to previous versions

EOF
}

main() {
    log "Starting SizeWise Suite dependency update process..."
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --frontend-only)
                FRONTEND_ONLY=true
                shift
                ;;
            --backend-only)
                BACKEND_ONLY=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --rollback)
                ROLLBACK=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    # Handle rollback
    if [ "$ROLLBACK" = true ]; then
        restore_backup
        exit 0
    fi
    
    # Validate environment
    if [ ! -f "$PROJECT_ROOT/package.json" ] && [ ! -f "$PROJECT_ROOT/requirements.txt" ]; then
        error "No package.json or requirements.txt found in project root"
    fi
    
    # Create backup (unless dry run)
    if [ "$DRY_RUN" = false ]; then
        create_backup
    fi
    
    # Security scan before updates
    if [ "$FRONTEND_ONLY" = false ]; then
        scan_backend_security
    fi
    
    if [ "$BACKEND_ONLY" = false ]; then
        scan_frontend_security
    fi
    
    # Perform updates
    if [ "$BACKEND_ONLY" = false ]; then
        update_frontend_dependencies
    fi
    
    if [ "$FRONTEND_ONLY" = false ]; then
        update_backend_dependencies
    fi
    
    # Validation (unless dry run)
    if [ "$DRY_RUN" = false ]; then
        if [ "$BACKEND_ONLY" = false ]; then
            validate_frontend
        fi
        
        if [ "$FRONTEND_ONLY" = false ]; then
            validate_backend
        fi
        
        # Final security scan
        log "Running final security scan..."
        if [ "$FRONTEND_ONLY" = false ]; then
            scan_backend_security
        fi
        
        if [ "$BACKEND_ONLY" = false ]; then
            scan_frontend_security
        fi
    fi
    
    log "Dependency update process completed successfully!"
    
    if [ "$DRY_RUN" = false ]; then
        info "Backup created at: $BACKUP_DIR/$DATE_STAMP"
        info "To rollback: $0 --rollback"
    fi
}

# =============================================================================
# Script Execution
# =============================================================================

# Ensure script is run from project root or scripts directory
if [ ! -f "package.json" ] && [ ! -f "../package.json" ]; then
    error "Please run this script from the project root or scripts directory"
fi

# Change to project root if running from scripts directory
if [ -f "../package.json" ]; then
    cd ..
    PROJECT_ROOT="$(pwd)"
fi

# Initialize log file
echo "=== SizeWise Suite Dependency Update - $(date) ===" > "$LOG_FILE"

# Run main function
main "$@"
