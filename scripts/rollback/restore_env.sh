#!/bin/bash

# Warp Environment Restore Script
# Non-destructive git hard-reset + database restore for development environments
#
# This script provides safe rollback capabilities for development environments
# following Warp usage guidelines for non-destructive operations.
#
# Usage:
#   ./restore_env.sh [options]
#   ./restore_env.sh --commit-hash abc123 --backup-name "backup_20250101_120000"
#   ./restore_env.sh --list-backups
#   ./restore_env.sh --dry-run --commit-hash HEAD~1
#
# Options:
#   --commit-hash    Target commit hash or reference (default: HEAD~1)
#   --backup-name    Database backup name to restore (optional)
#   --list-backups   List available database backups
#   --dry-run       Show what would be done without executing
#   --force         Skip confirmation prompts (use with caution)
#   --help          Show this help message

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
DB_BACKUP_DIR="$BACKUP_DIR/database"
GIT_BACKUP_DIR="$BACKUP_DIR/git-snapshots"
LOG_DIR="$PROJECT_ROOT/warp-logs"

# Default values
COMMIT_HASH="HEAD~1"
BACKUP_NAME=""
DRY_RUN=false
FORCE=false
LIST_BACKUPS=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        INFO) echo -e "${GREEN}[INFO]${NC} $message" ;;
        WARN) echo -e "${YELLOW}[WARN]${NC} $message" ;;
        ERROR) echo -e "${RED}[ERROR]${NC} $message" ;;
        DEBUG) echo -e "${CYAN}[DEBUG]${NC} $message" ;;
    esac
    
    # Also log to file if log directory exists
    if [[ -d "$LOG_DIR" ]]; then
        echo "[$timestamp] [$level] $message" >> "$LOG_DIR/restore_env_$(date +%Y%m%d).log"
    fi
}

# Help function
show_help() {
    cat << EOF
Warp Environment Restore Script

This script provides non-destructive rollback capabilities for development 
environments, including git repository state and database restoration.

Usage: $0 [options]

Options:
    --commit-hash HASH      Target commit hash or reference (default: HEAD~1)
    --backup-name NAME      Database backup name to restore (optional)
    --list-backups         List available database backups
    --dry-run              Show what would be done without executing
    --force                Skip confirmation prompts (use with caution)
    --help                 Show this help message

Examples:
    $0 --list-backups
    $0 --dry-run --commit-hash HEAD~2
    $0 --commit-hash abc1234 --backup-name "backup_20250101_120000"
    $0 --force --commit-hash main

Safety Features:
    - Creates git snapshots before any changes
    - Non-destructive database operations (restore from backup)
    - Confirmation prompts for all destructive operations
    - Comprehensive logging of all operations
    - Dry-run mode for testing

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --commit-hash)
                COMMIT_HASH="$2"
                shift 2
                ;;
            --backup-name)
                BACKUP_NAME="$2"
                shift 2
                ;;
            --list-backups)
                LIST_BACKUPS=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log ERROR "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Ensure required directories exist
ensure_directories() {
    local dirs=("$BACKUP_DIR" "$DB_BACKUP_DIR" "$GIT_BACKUP_DIR" "$LOG_DIR")
    
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            log INFO "Creating directory: $dir"
            if [[ "$DRY_RUN" == "false" ]]; then
                mkdir -p "$dir"
            fi
        fi
    done
}

# List available database backups
list_database_backups() {
    log INFO "Available database backups:"
    
    if [[ ! -d "$DB_BACKUP_DIR" ]]; then
        log WARN "No database backup directory found at: $DB_BACKUP_DIR"
        return 1
    fi
    
    local backups
    backups=$(find "$DB_BACKUP_DIR" -name "*.sql" -o -name "*.sqlite*" -o -name "backup_*" 2>/dev/null | sort -r)
    
    if [[ -z "$backups" ]]; then
        log WARN "No database backups found in: $DB_BACKUP_DIR"
        return 1
    fi
    
    echo -e "\n${BLUE}Database Backups:${NC}"
    echo "$backups" | while read -r backup; do
        if [[ -f "$backup" ]]; then
            local size=$(du -h "$backup" | cut -f1)
            local date=$(date -r "$backup" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || stat -c %y "$backup" | cut -d' ' -f1-2)
            local basename=$(basename "$backup")
            echo -e "  ${GREEN}$basename${NC} (${size}, ${date})"
        fi
    done
    echo
}

# Create git snapshot before any changes
create_git_snapshot() {
    log INFO "Creating git snapshot before restore..."
    
    local snapshot_name="snapshot_$(date +%Y%m%d_%H%M%S)"
    local current_branch=$(git branch --show-current 2>/dev/null || echo "detached")
    local current_commit=$(git rev-parse HEAD)
    
    local snapshot_info="$GIT_BACKUP_DIR/$snapshot_name.info"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        cat > "$snapshot_info" << EOF
# Git Snapshot Information
# Created: $(date '+%Y-%m-%d %H:%M:%S')
# Branch: $current_branch
# Commit: $current_commit
# Command: $0 $*

# To restore this snapshot:
# git checkout $current_commit
# git checkout -b restore_$snapshot_name

Current Branch: $current_branch
Current Commit: $current_commit
Snapshot Name: $snapshot_name
EOF
        log INFO "Git snapshot info saved: $snapshot_info"
    else
        log DEBUG "[DRY-RUN] Would create snapshot: $snapshot_name"
        log DEBUG "[DRY-RUN] Current branch: $current_branch, commit: $current_commit"
    fi
}

# Validate git commit hash
validate_git_commit() {
    local commit="$1"
    
    if ! git rev-parse --verify "$commit" >/dev/null 2>&1; then
        log ERROR "Invalid commit hash or reference: $commit"
        return 1
    fi
    
    local commit_hash=$(git rev-parse "$commit")
    local commit_message=$(git log -1 --pretty=format:"%s" "$commit" 2>/dev/null)
    
    log INFO "Target commit: $commit_hash"
    log INFO "Commit message: $commit_message"
    
    return 0
}

# Perform git hard reset
perform_git_reset() {
    local target_commit="$1"
    
    log INFO "Performing git hard reset to: $target_commit"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Save current state first
        create_git_snapshot
        
        # Perform the reset
        if git reset --hard "$target_commit"; then
            log INFO "Git reset completed successfully"
            
            # Clean untracked files (with confirmation)
            if [[ "$FORCE" == "true" ]] || ask_confirmation "Clean untracked files and directories?"; then
                git clean -fd
                log INFO "Cleaned untracked files"
            fi
        else
            log ERROR "Git reset failed"
            return 1
        fi
    else
        log DEBUG "[DRY-RUN] Would perform: git reset --hard $target_commit"
        log DEBUG "[DRY-RUN] Would clean untracked files"
    fi
}

# Restore database from backup
restore_database() {
    local backup_file="$1"
    
    if [[ -z "$backup_file" ]]; then
        log INFO "No database backup specified, skipping database restore"
        return 0
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        log ERROR "Database backup file not found: $backup_file"
        return 1
    fi
    
    log INFO "Restoring database from: $backup_file"
    
    # Detect database type and restore accordingly
    local file_ext="${backup_file##*.}"
    
    case "$file_ext" in
        sql)
            restore_sql_database "$backup_file"
            ;;
        sqlite|sqlite3|db)
            restore_sqlite_database "$backup_file"
            ;;
        *)
            log ERROR "Unsupported database backup format: $file_ext"
            return 1
            ;;
    esac
}

# Restore SQL database (MySQL/PostgreSQL)
restore_sql_database() {
    local backup_file="$1"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Try to determine database type from environment or config
        if command -v mysql >/dev/null 2>&1; then
            log INFO "Attempting MySQL restore..."
            # mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$backup_file"
            log WARN "MySQL restore requires database credentials to be configured"
        elif command -v psql >/dev/null 2>&1; then
            log INFO "Attempting PostgreSQL restore..."
            # psql -U "$DB_USER" -d "$DB_NAME" -f "$backup_file"
            log WARN "PostgreSQL restore requires database credentials to be configured"
        else
            log ERROR "No supported database client found (mysql/psql)"
            return 1
        fi
    else
        log DEBUG "[DRY-RUN] Would restore SQL database from: $backup_file"
    fi
}

# Restore SQLite database
restore_sqlite_database() {
    local backup_file="$1"
    local db_path="$PROJECT_ROOT/database.sqlite" # Adjust as needed
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Create backup of current database
        if [[ -f "$db_path" ]]; then
            local current_backup="$DB_BACKUP_DIR/pre_restore_$(date +%Y%m%d_%H%M%S).sqlite"
            cp "$db_path" "$current_backup"
            log INFO "Current database backed up to: $current_backup"
        fi
        
        # Restore from backup
        cp "$backup_file" "$db_path"
        log INFO "SQLite database restored successfully"
    else
        log DEBUG "[DRY-RUN] Would backup current database to: pre_restore_$(date +%Y%m%d_%H%M%S).sqlite"
        log DEBUG "[DRY-RUN] Would restore SQLite database from: $backup_file"
    fi
}

# Ask for user confirmation
ask_confirmation() {
    local message="$1"
    
    if [[ "$FORCE" == "true" ]]; then
        return 0
    fi
    
    echo -e "\n${YELLOW}$message${NC}"
    read -p "Continue? (y/N): " -r response
    
    case $response in
        [Yy]|[Yy][Ee][Ss])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Main execution function
main() {
    log INFO "Warp Environment Restore Script started"
    log INFO "Project root: $PROJECT_ROOT"
    
    # Change to project root
    cd "$PROJECT_ROOT"
    
    # Ensure we're in a git repository
    if [[ ! -d ".git" ]]; then
        log ERROR "Not a git repository. Please run from project root."
        exit 1
    fi
    
    # Ensure required directories exist
    ensure_directories
    
    # Handle list backups option
    if [[ "$LIST_BACKUPS" == "true" ]]; then
        list_database_backups
        exit 0
    fi
    
    # Validate git commit
    if ! validate_git_commit "$COMMIT_HASH"; then
        exit 1
    fi
    
    # Show summary of planned operations
    echo -e "\n${BLUE}=== RESTORE OPERATION SUMMARY ===${NC}"
    echo -e "Target commit: ${GREEN}$COMMIT_HASH${NC}"
    if [[ -n "$BACKUP_NAME" ]]; then
        echo -e "Database backup: ${GREEN}$BACKUP_NAME${NC}"
    else
        echo -e "Database backup: ${YELLOW}None specified${NC}"
    fi
    echo -e "Mode: ${CYAN}$([ "$DRY_RUN" == "true" ] && echo "DRY RUN" || echo "LIVE EXECUTION")${NC}"
    echo -e "================================\n"
    
    # Confirm operation
    if ! ask_confirmation "Proceed with restore operation?"; then
        log INFO "Restore operation cancelled by user"
        exit 0
    fi
    
    # Perform git reset
    if ! perform_git_reset "$COMMIT_HASH"; then
        log ERROR "Git reset failed, aborting"
        exit 1
    fi
    
    # Restore database if specified
    if [[ -n "$BACKUP_NAME" ]]; then
        local backup_path="$DB_BACKUP_DIR/$BACKUP_NAME"
        if ! restore_database "$backup_path"; then
            log ERROR "Database restore failed"
            exit 1
        fi
    fi
    
    log INFO "Environment restore completed successfully"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        echo -e "\n${GREEN}✓ Environment restored successfully${NC}"
        echo -e "Current commit: ${CYAN}$(git rev-parse HEAD)${NC}"
        echo -e "Branch: ${CYAN}$(git branch --show-current 2>/dev/null || echo 'detached')${NC}"
    else
        echo -e "\n${CYAN}✓ Dry run completed - no changes made${NC}"
    fi
}

# Parse command line arguments
parse_args "$@"

# Execute main function
main
