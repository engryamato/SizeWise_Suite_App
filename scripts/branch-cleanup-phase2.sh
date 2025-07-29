#!/bin/bash

# SizeWise Suite - Branch Cleanup Phase 2: Review & Consolidation
# Review active branches and consolidate related changes

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

log "🔍 Starting Branch Cleanup Phase 2: Review & Consolidation"

# Ensure we're on main and up to date
git checkout main
git pull origin main

# Phase 2A: Review Active Feature Branches
log "📋 Phase 2A: Reviewing Active Feature Branches"

# List of active feature branches to review
FEATURE_BRANCHES=(
    "codex/integrate-service-worker-with-next-pwa:32"
    "codex/reorganize-project-directories-for-structure:33"
    "codex/delete-unnecessary-database-and-video-files:46"
    "codex/disable-anonymous-user-and-apply-access-rules:45"
    "codex/update-triggers-and-create-configuration-files:34"
)

echo ""
echo "🔍 Active Feature Branches Review:"
echo "=================================="

for branch_pr in "${FEATURE_BRANCHES[@]}"; do
    IFS=':' read -r branch pr_num <<< "$branch_pr"
    
    echo ""
    log "Reviewing: $branch (PR #$pr_num)"
    
    # Get PR status
    PR_STATE=$(gh pr view "$pr_num" --json state --jq '.state' 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$PR_STATE" = "OPEN" ]; then
        # Get PR details
        PR_INFO=$(gh pr view "$pr_num" --json title,updatedAt,additions,deletions,reviewDecision)
        PR_TITLE=$(echo "$PR_INFO" | jq -r '.title')
        PR_UPDATED=$(echo "$PR_INFO" | jq -r '.updatedAt')
        PR_ADDITIONS=$(echo "$PR_INFO" | jq -r '.additions')
        PR_DELETIONS=$(echo "$PR_INFO" | jq -r '.deletions')
        PR_REVIEW=$(echo "$PR_INFO" | jq -r '.reviewDecision // "PENDING"')
        
        echo "  📝 Title: $PR_TITLE"
        echo "  📅 Last Updated: $PR_UPDATED"
        echo "  📊 Changes: +$PR_ADDITIONS/-$PR_DELETIONS"
        echo "  👥 Review Status: $PR_REVIEW"
        
        # Check if branch is ahead/behind main
        if git ls-remote --heads origin "$branch" | grep -q "$branch"; then
            AHEAD_BEHIND=$(git rev-list --left-right --count main...origin/$branch 2>/dev/null || echo "0	0")
            BEHIND=$(echo "$AHEAD_BEHIND" | cut -f1)
            AHEAD=$(echo "$AHEAD_BEHIND" | cut -f2)
            echo "  🔄 Status: $AHEAD commits ahead, $BEHIND commits behind main"
            
            # Provide recommendation
            if [ "$AHEAD" -gt 0 ] && [ "$BEHIND" -eq 0 ]; then
                echo "  ✅ Recommendation: READY TO MERGE (up to date)"
            elif [ "$AHEAD" -gt 0 ] && [ "$BEHIND" -gt 0 ]; then
                echo "  ⚠️  Recommendation: NEEDS REBASE (behind main)"
            else
                echo "  ❓ Recommendation: REVIEW NEEDED"
            fi
        fi
    else
        echo "  ❌ PR #$pr_num is $PR_STATE or not found"
    fi
done

# Phase 2B: Consolidate Documentation Branches
log "📋 Phase 2B: Documentation Branch Consolidation Analysis"

# List of documentation branches
DOC_BRANCHES=(
    "codex/create-central-readme-for-documentation:44"
    "codex/update-documentation-for-initial-release:43"
    "codex/update-readme-project-structure-section:42"
    "codex/consolidate-offline-first-guide-documentation:41"
    "codex/align-node.js-version-in-docs:40"
    "codex/update-quick-start-link-in-index.md:38"
    "codex/standardize-react-version-in-readme:37"
    "codex/update-sentry-setup-documentation:36"
    "codex/update-readme-with-mit-license-reference:35"
    "1pp9re-codex/standardize-react-version-in-readme:39"
)

echo ""
echo "📚 Documentation Branches Analysis:"
echo "==================================="

TOTAL_DOC_CHANGES=0
OPEN_DOC_PRS=0

for branch_pr in "${DOC_BRANCHES[@]}"; do
    IFS=':' read -r branch pr_num <<< "$branch_pr"
    
    PR_STATE=$(gh pr view "$pr_num" --json state --jq '.state' 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$PR_STATE" = "OPEN" ]; then
        OPEN_DOC_PRS=$((OPEN_DOC_PRS + 1))
        PR_CHANGES=$(gh pr view "$pr_num" --json additions,deletions --jq '.additions + .deletions')
        TOTAL_DOC_CHANGES=$((TOTAL_DOC_CHANGES + PR_CHANGES))
        
        PR_TITLE=$(gh pr view "$pr_num" --json title --jq '.title')
        echo "  📝 PR #$pr_num: $PR_TITLE ($PR_CHANGES changes)"
    fi
done

echo ""
echo "📊 Documentation Summary:"
echo "  📋 Open Documentation PRs: $OPEN_DOC_PRS"
echo "  📝 Total Changes: $TOTAL_DOC_CHANGES lines"
echo ""

if [ "$OPEN_DOC_PRS" -gt 5 ]; then
    warning "⚠️  Too many documentation PRs open. Consider consolidation."
    echo ""
    echo "💡 Consolidation Recommendation:"
    echo "  1. Create a new branch: docs/consolidated-updates"
    echo "  2. Cherry-pick changes from related documentation PRs"
    echo "  3. Close individual PRs and create single consolidated PR"
    echo ""
    echo "  Commands to start consolidation:"
    echo "  git checkout -b docs/consolidated-updates"
    echo "  # Review and cherry-pick changes from each doc branch"
    echo "  # Create single PR with all documentation updates"
fi

# Phase 2C: Dependabot Branch Analysis
log "📋 Phase 2C: Dependabot Branch Analysis"

# Get all open dependabot PRs
DEPENDABOT_PRS=$(gh pr list --author "app/dependabot" --state open --json number,title,headRefName)

if [ "$DEPENDABOT_PRS" != "[]" ]; then
    echo ""
    echo "🤖 Open Dependabot PRs:"
    echo "======================="
    
    echo "$DEPENDABOT_PRS" | jq -r '.[] | "  PR #\(.number): \(.title)"'
    
    DEPENDABOT_COUNT=$(echo "$DEPENDABOT_PRS" | jq length)
    echo ""
    echo "📊 Total Open Dependabot PRs: $DEPENDABOT_COUNT"
    
    if [ "$DEPENDABOT_COUNT" -gt 3 ]; then
        warning "⚠️  Multiple dependency updates pending. Consider batch merging."
        echo ""
        echo "💡 Batch Merge Recommendation:"
        echo "  1. Review security-related updates first (high priority)"
        echo "  2. Merge compatible updates in batches"
        echo "  3. Test after each batch to ensure stability"
    fi
else
    success "✅ No open Dependabot PRs found"
fi

# Phase 2D: Generate Action Plan
log "📋 Phase 2D: Generating Action Plan"

echo ""
echo "🎯 Phase 2 Action Plan:"
echo "======================"
echo ""
echo "🔴 HIGH PRIORITY (This Week):"
echo "  1. Review and merge ready feature branches"
echo "  2. Rebase branches that are behind main"
echo "  3. Consolidate documentation PRs if needed"
echo ""
echo "🟡 MEDIUM PRIORITY (Next Week):"
echo "  1. Batch merge compatible Dependabot PRs"
echo "  2. Review and test PWA integration branch"
echo "  3. Clean up project structure changes"
echo ""
echo "🟢 LOW PRIORITY (This Month):"
echo "  1. Archive old feature branches"
echo "  2. Set up automated branch cleanup rules"
echo "  3. Implement branch naming conventions"
echo ""

# Phase 2E: Create Helper Scripts
log "📋 Phase 2E: Creating Helper Scripts"

# Create quick merge script for ready branches
cat > scripts/quick-merge-ready.sh << 'EOF'
#!/bin/bash
# Quick merge script for branches that are ready
set -euo pipefail

READY_PRS=(32 33)  # Update this list based on review

for pr in "${READY_PRS[@]}"; do
    echo "Checking PR #$pr..."
    if gh pr checks "$pr" --json state --jq '.[] | select(.state != "SUCCESS")' | grep -q .; then
        echo "⚠️  PR #$pr has failing checks. Skipping."
    else
        echo "✅ Merging PR #$pr..."
        gh pr merge "$pr" --squash --delete-branch
    fi
done
EOF

chmod +x scripts/quick-merge-ready.sh
success "Created scripts/quick-merge-ready.sh"

success "Phase 2 review completed! Check the action plan above."
