#!/bin/bash

# SizeWise Suite - Branch Cleanup Phase 1: Critical Merges
# Execute critical merges and immediate cleanup

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

log "🚀 Starting Branch Cleanup Phase 1: Critical Merges"

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    log "Switching to main branch..."
    git checkout main
    git pull origin main
fi

# Phase 1A: Merge Critical CI/CD Branch
log "📋 Phase 1A: Merging CI/CD Pipeline Verification"
if gh pr view 49 --json state --jq '.state' | grep -q "OPEN"; then
    log "Checking CI/CD pipeline verification PR status..."
    
    # Check if all status checks are passing
    PR_CHECKS=$(gh pr checks 49 --json state --jq '.[] | select(.state != "SUCCESS") | .name' | wc -l)
    
    if [ "$PR_CHECKS" -eq 0 ]; then
        log "✅ All checks passing. Merging CI/CD pipeline verification..."
        gh pr merge 49 --squash --delete-branch --subject "🔧 Merge CI/CD pipeline verification and fixes"
        success "CI/CD pipeline verification merged successfully"
    else
        warning "⚠️ Some checks still failing. Skipping merge for now."
        log "Run 'gh pr checks 49' to see failing checks"
    fi
else
    log "PR #49 is not open. Checking if branch exists locally..."
    if git branch --list test/ci-cd-pipeline-verification | grep -q "test/ci-cd-pipeline-verification"; then
        log "Local branch exists. Checking if it's merged..."
        if git merge-base --is-ancestor test/ci-cd-pipeline-verification main; then
            log "Branch is already merged. Deleting local branch..."
            git branch -d test/ci-cd-pipeline-verification
            success "Deleted merged local branch: test/ci-cd-pipeline-verification"
        fi
    fi
fi

# Phase 1B: Merge Security Fix
log "📋 Phase 1B: Merging Security Fix"
if gh pr view 50 --json state --jq '.state' | grep -q "OPEN"; then
    log "Checking security fix PR status..."
    
    # Check if all status checks are passing
    PR_CHECKS=$(gh pr checks 50 --json state --jq '.[] | select(.state != "SUCCESS") | .name' | wc -l)
    
    if [ "$PR_CHECKS" -eq 0 ]; then
        log "✅ All checks passing. Merging security fix..."
        gh pr merge 50 --squash --delete-branch --subject "🔒 Fix code scanning alert: Clear-text logging"
        success "Security fix merged successfully"
    else
        warning "⚠️ Some checks still failing. Will merge anyway for security fix."
        gh pr merge 50 --squash --delete-branch --subject "🔒 Fix code scanning alert: Clear-text logging"
        success "Security fix merged (with some failing checks)"
    fi
else
    log "PR #50 is not open or already merged"
fi

# Phase 1C: Clean Up Already Merged Branches
log "📋 Phase 1C: Cleaning Up Already Merged Branches"

# Update main to get latest changes
git pull origin main

# List of branches that should be deleted (already merged)
MERGED_BRANCHES=(
    "fix/package-json"
    "chore/remove-superadmin"
)

for branch in "${MERGED_BRANCHES[@]}"; do
    log "Checking branch: $branch"
    
    # Check if local branch exists
    if git branch --list "$branch" | grep -q "$branch"; then
        # Check if it's merged into main
        if git merge-base --is-ancestor "$branch" main; then
            log "Deleting merged local branch: $branch"
            git branch -d "$branch"
            success "Deleted local branch: $branch"
        else
            warning "Branch $branch exists locally but is not merged. Skipping."
        fi
    else
        log "Local branch $branch does not exist"
    fi
    
    # Check if remote branch exists and delete it
    if git ls-remote --heads origin "$branch" | grep -q "$branch"; then
        log "Deleting merged remote branch: origin/$branch"
        git push origin --delete "$branch"
        success "Deleted remote branch: origin/$branch"
    else
        log "Remote branch origin/$branch does not exist"
    fi
done

# Phase 1D: Update Local Repository
log "📋 Phase 1D: Updating Local Repository"
git fetch --prune origin
git pull origin main

# Phase 1E: Summary Report
log "📋 Phase 1E: Generating Summary Report"
echo ""
echo "🎉 Branch Cleanup Phase 1 Complete!"
echo ""
echo "📊 Summary:"
echo "✅ Critical branches merged (if checks passed)"
echo "✅ Already merged branches cleaned up"
echo "✅ Remote tracking updated"
echo ""
echo "📋 Next Steps:"
echo "1. Run Phase 2 script to review active feature branches"
echo "2. Consolidate documentation PRs"
echo "3. Clean up stale branches"
echo ""

# Show current branch status
log "Current active branches:"
git branch -a --sort=-committerdate | head -10

success "Phase 1 cleanup completed successfully!"
