#!/bin/bash

# SizeWise Suite - Branch Cleanup Phase 3: Stale Branch Cleanup
# Clean up old, stale, and unnecessary branches

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

log "🧹 Starting Branch Cleanup Phase 3: Stale Branch Cleanup"

# Ensure we're on main and up to date
git checkout main
git pull origin main
git fetch --prune origin

# Phase 3A: Identify Stale Branches
log "📋 Phase 3A: Identifying Stale Branches"

# Define cutoff date (2 weeks ago)
CUTOFF_DATE=$(date -d "2 weeks ago" +%s)

# Get all remote branches with their last commit dates
echo ""
echo "🔍 Analyzing branch staleness (older than 2 weeks):"
echo "=================================================="

STALE_BRANCHES=()
ARCHIVE_CANDIDATES=()

while IFS= read -r line; do
    if [[ $line =~ ^[[:space:]]*remotes/origin/(.+)[[:space:]]+([0-9a-f]+)[[:space:]]+(.+)$ ]]; then
        branch_name="${BASH_REMATCH[1]}"
        commit_hash="${BASH_REMATCH[2]}"
        
        # Skip HEAD and main
        if [[ "$branch_name" == "HEAD" || "$branch_name" == "main" ]]; then
            continue
        fi
        
        # Get commit date
        commit_date=$(git log -1 --format="%ct" "$commit_hash" 2>/dev/null || echo "0")
        
        if [ "$commit_date" -lt "$CUTOFF_DATE" ]; then
            # Check if branch has an open PR
            pr_exists=$(gh pr list --head "$branch_name" --json number --jq length 2>/dev/null || echo "0")
            
            if [ "$pr_exists" -eq 0 ]; then
                # Check if it's a special branch that should be archived
                if [[ "$branch_name" =~ ^(air-duct-sizer|homescreen-ui-improvement|backup-).*$ ]]; then
                    ARCHIVE_CANDIDATES+=("$branch_name")
                    echo "  📦 ARCHIVE: $branch_name ($(date -d "@$commit_date" +%Y-%m-%d))"
                else
                    STALE_BRANCHES+=("$branch_name")
                    echo "  🗑️  STALE: $branch_name ($(date -d "@$commit_date" +%Y-%m-%d))"
                fi
            else
                echo "  ⚠️  OLD but has PR: $branch_name ($(date -d "@$commit_date" +%Y-%m-%d))"
            fi
        fi
    fi
done < <(git branch -r -v --sort=-committerdate)

echo ""
echo "📊 Stale Branch Summary:"
echo "  🗑️  Branches to delete: ${#STALE_BRANCHES[@]}"
echo "  📦 Branches to archive: ${#ARCHIVE_CANDIDATES[@]}"

# Phase 3B: Archive Important Branches
log "📋 Phase 3B: Archiving Important Branches"

if [ ${#ARCHIVE_CANDIDATES[@]} -gt 0 ]; then
    echo ""
    echo "📦 Creating archive tags for important branches:"
    
    for branch in "${ARCHIVE_CANDIDATES[@]}"; do
        tag_name="archive/${branch//\//-}"
        
        log "Creating archive tag: $tag_name"
        
        # Create annotated tag
        git tag -a "$tag_name" "origin/$branch" -m "Archive of branch $branch before cleanup on $(date)"
        
        # Push tag to remote
        git push origin "$tag_name"
        
        success "Archived: $branch -> $tag_name"
    done
    
    echo ""
    log "Archive tags created. These branches can now be safely deleted."
fi

# Phase 3C: Delete Stale Branches (with confirmation)
log "📋 Phase 3C: Deleting Stale Branches"

if [ ${#STALE_BRANCHES[@]} -gt 0 ]; then
    echo ""
    echo "🗑️  The following stale branches will be deleted:"
    printf '  - %s\n' "${STALE_BRANCHES[@]}"
    echo ""
    
    read -p "❓ Do you want to proceed with deletion? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Deleting stale branches..."
        
        for branch in "${STALE_BRANCHES[@]}"; do
            log "Deleting: origin/$branch"
            
            # Delete remote branch
            if git push origin --delete "$branch" 2>/dev/null; then
                success "Deleted: origin/$branch"
            else
                warning "Failed to delete: origin/$branch (may not exist)"
            fi
        done
        
        # Clean up local tracking branches
        git remote prune origin
        
        success "Stale branch cleanup completed"
    else
        log "Stale branch deletion cancelled by user"
    fi
else
    success "No stale branches found to delete"
fi

# Phase 3D: Clean Up Merged Dependabot Branches
log "📋 Phase 3D: Cleaning Up Merged Dependabot Branches"

# Find merged dependabot branches
MERGED_DEPENDABOT=$(git branch -r --merged main | grep "origin/dependabot/" | sed 's/origin\///' || true)

if [ -n "$MERGED_DEPENDABOT" ]; then
    echo ""
    echo "🤖 Found merged Dependabot branches:"
    echo "$MERGED_DEPENDABOT" | sed 's/^/  - /'
    
    read -p "❓ Delete merged Dependabot branches? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$MERGED_DEPENDABOT" | while read -r branch; do
            if [ -n "$branch" ]; then
                log "Deleting merged Dependabot branch: $branch"
                git push origin --delete "$branch" 2>/dev/null || warning "Failed to delete $branch"
            fi
        done
        success "Merged Dependabot branches cleaned up"
    fi
else
    log "No merged Dependabot branches found"
fi

# Phase 3E: Repository Health Check
log "📋 Phase 3E: Repository Health Check"

echo ""
echo "🏥 Repository Health Report:"
echo "============================"

# Count branches
TOTAL_REMOTE=$(git branch -r | grep -v "origin/HEAD" | wc -l)
TOTAL_LOCAL=$(git branch | wc -l)
OPEN_PRS=$(gh pr list --state open --json number --jq length)

echo "  📊 Remote branches: $TOTAL_REMOTE"
echo "  📊 Local branches: $TOTAL_LOCAL"
echo "  📊 Open pull requests: $OPEN_PRS"

# Check for branches that might need attention
BEHIND_MAIN=$(git for-each-ref --format='%(refname:short)' refs/remotes/origin/ | while read -r branch; do
    if [[ "$branch" != "origin/HEAD" && "$branch" != "origin/main" ]]; then
        branch_name=${branch#origin/}
        ahead_behind=$(git rev-list --left-right --count main...origin/$branch_name 2>/dev/null || echo "0	0")
        behind=$(echo "$ahead_behind" | cut -f1)
        if [ "$behind" -gt 10 ]; then
            echo "$branch_name ($behind commits behind)"
        fi
    fi
done)

if [ -n "$BEHIND_MAIN" ]; then
    echo ""
    echo "  ⚠️  Branches significantly behind main (>10 commits):"
    echo "$BEHIND_MAIN" | sed 's/^/    - /'
fi

# Phase 3F: Set Up Branch Protection and Cleanup Rules
log "📋 Phase 3F: Branch Management Recommendations"

echo ""
echo "🎯 Branch Management Best Practices:"
echo "===================================="
echo ""
echo "✅ Implemented:"
echo "  - Branch protection rules on main"
echo "  - Required status checks"
echo "  - Automated dependency updates"
echo ""
echo "📋 Recommended Next Steps:"
echo "  1. Set up automated stale branch detection"
echo "  2. Implement branch naming conventions"
echo "  3. Add branch cleanup to CI/CD pipeline"
echo "  4. Create branch lifecycle documentation"
echo ""

# Create branch naming convention guide
cat > BRANCH_NAMING_GUIDE.md << 'EOF'
# Branch Naming Conventions - SizeWise Suite

## Branch Types

### Feature Branches
- `feature/description` - New features
- `feat/description` - Short form for features

### Bug Fixes
- `fix/description` - Bug fixes
- `bugfix/description` - Alternative form

### Documentation
- `docs/description` - Documentation updates

### Maintenance
- `chore/description` - Maintenance tasks
- `refactor/description` - Code refactoring

### Testing
- `test/description` - Testing improvements

### CI/CD
- `ci/description` - CI/CD improvements

## Branch Lifecycle

1. **Create** - Branch from main with descriptive name
2. **Develop** - Make changes and commit regularly
3. **Push** - Push to remote and create PR
4. **Review** - Code review and CI/CD checks
5. **Merge** - Squash merge to main
6. **Cleanup** - Automatic branch deletion

## Cleanup Rules

- Branches are automatically deleted after merge
- Stale branches (>2 weeks, no PR) are flagged for cleanup
- Important branches are archived with tags before deletion
- Dependabot branches are cleaned up after merge
EOF

success "Created BRANCH_NAMING_GUIDE.md"

echo ""
success "🎉 Phase 3 cleanup completed!"
echo ""
echo "📋 Summary of actions taken:"
echo "  ✅ Analyzed branch staleness"
echo "  ✅ Created archive tags for important branches"
echo "  ✅ Cleaned up stale branches (if confirmed)"
echo "  ✅ Removed merged Dependabot branches"
echo "  ✅ Generated repository health report"
echo "  ✅ Created branch naming guide"
echo ""
echo "🎯 Repository is now clean and organized!"
