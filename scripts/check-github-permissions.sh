#!/bin/bash

# SizeWise Suite - GitHub Actions Permissions Check
# Verifies that GitHub Actions have the necessary permissions

set -euo pipefail

# Configuration
REPO_OWNER="engryamato"
REPO_NAME="SizeWise_Suite_App"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check GitHub Actions permissions
check_actions_permissions() {
    log "Checking GitHub Actions permissions..."
    
    # Get repository settings
    REPO_INFO=$(gh api "/repos/$REPO_OWNER/$REPO_NAME" --jq '{
        permissions: .permissions,
        default_branch: .default_branch,
        private: .private
    }')
    
    echo "Repository Information:"
    echo "$REPO_INFO" | jq '.'
    
    # Check Actions permissions
    log "Checking Actions permissions..."
    ACTIONS_PERMISSIONS=$(gh api "/repos/$REPO_OWNER/$REPO_NAME/actions/permissions" 2>/dev/null || echo '{"error": "Could not fetch actions permissions"}')
    
    echo "Actions Permissions:"
    echo "$ACTIONS_PERMISSIONS" | jq '.'
    
    # Check if Actions are enabled
    if echo "$ACTIONS_PERMISSIONS" | jq -e '.enabled' > /dev/null 2>&1; then
        if [ "$(echo "$ACTIONS_PERMISSIONS" | jq -r '.enabled')" = "true" ]; then
            success "GitHub Actions are enabled"
        else
            error "GitHub Actions are disabled"
        fi
    else
        warning "Could not determine Actions status"
    fi
    
    # Check workflow permissions
    log "Checking workflow permissions..."
    WORKFLOW_PERMISSIONS=$(gh api "/repos/$REPO_OWNER/$REPO_NAME/actions/permissions/workflow" 2>/dev/null || echo '{"error": "Could not fetch workflow permissions"}')
    
    echo "Workflow Permissions:"
    echo "$WORKFLOW_PERMISSIONS" | jq '.'
    
    # Check security and analysis settings
    log "Checking security settings..."
    SECURITY_ANALYSIS=$(gh api "/repos/$REPO_OWNER/$REPO_NAME" --jq '{
        security_and_analysis: .security_and_analysis
    }')
    
    echo "Security and Analysis Settings:"
    echo "$SECURITY_ANALYSIS" | jq '.'
}

# Check branch protection status
check_branch_protection() {
    log "Checking branch protection status..."
    
    PROTECTION_STATUS=$(gh api "/repos/$REPO_OWNER/$REPO_NAME/branches/main/protection" 2>/dev/null || echo '{"error": "No protection rules found"}')
    
    if echo "$PROTECTION_STATUS" | jq -e '.required_status_checks' > /dev/null 2>&1; then
        success "Branch protection rules are active"
        echo "Required status checks:"
        echo "$PROTECTION_STATUS" | jq -r '.required_status_checks.contexts[]' | sed 's/^/  - /'
    else
        warning "Branch protection rules may not be active"
    fi
}

# Check recent workflow runs
check_recent_workflows() {
    log "Checking recent workflow runs..."
    
    RECENT_RUNS=$(gh api "/repos/$REPO_OWNER/$REPO_NAME/actions/runs?per_page=5" --jq '.workflow_runs[] | {
        name: .name,
        status: .status,
        conclusion: .conclusion,
        created_at: .created_at,
        html_url: .html_url
    }')
    
    if [ -n "$RECENT_RUNS" ]; then
        echo "Recent workflow runs:"
        echo "$RECENT_RUNS" | jq -r '. | "  - \(.name): \(.status) (\(.conclusion // "running"))"'
    else
        warning "No recent workflow runs found"
    fi
}

# Main function
main() {
    log "Starting GitHub permissions and settings check..."
    
    check_actions_permissions
    echo ""
    check_branch_protection
    echo ""
    check_recent_workflows
    
    success "GitHub permissions check completed!"
    
    log "Recommendations:"
    log "1. Ensure Actions have 'Read repository contents' permission"
    log "2. Ensure Actions have 'Write to Security tab' permission for SARIF uploads"
    log "3. Ensure Actions have 'Write to pull requests' permission for comments"
    log "4. Verify that all required status checks are configured"
}

# Run main function
main "$@"
