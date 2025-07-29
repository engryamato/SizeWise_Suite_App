#!/bin/bash

# SizeWise Suite - Branch Protection Setup Script
# Configures GitHub branch protection rules via API

set -euo pipefail

# Configuration
REPO_OWNER="engryamato"
REPO_NAME="SizeWise_Suite_App"
BRANCH="main"

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
    exit 1
}

# Check if GitHub CLI is installed and authenticated
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI (gh) is not installed. Please install it first."
    fi
    
    if ! gh auth status &> /dev/null; then
        error "GitHub CLI is not authenticated. Please run 'gh auth login' first."
    fi
    
    success "Prerequisites check passed"
}

# Configure branch protection rules
setup_branch_protection() {
    log "Setting up branch protection rules for '$BRANCH' branch..."
    
    # Create branch protection rule
    cat > branch_protection.json << EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "frontend-tests (18.x)",
      "frontend-tests (20.x)",
      "backend-tests (3.9)",
      "backend-tests (3.10)",
      "backend-tests (3.11)",
      "security-scan",
      "code-quality",
      "build-test"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
EOF

    # Apply branch protection using GitHub CLI
    if gh api \
        --method PUT \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "/repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection" \
        --input branch_protection.json; then
        success "Branch protection rules applied successfully"
    else
        error "Failed to apply branch protection rules"
    fi
    
    # Clean up temporary file
    rm -f branch_protection.json
}

# Setup CODEOWNERS file
setup_codeowners() {
    log "Setting up CODEOWNERS file..."
    
    if [ ! -d ".github" ]; then
        mkdir -p .github
    fi
    
    cat > .github/CODEOWNERS << EOF
# SizeWise Suite Code Owners
# These owners will be requested for review when someone opens a pull request.

# Global ownership
* @engryamato

# Frontend specific
/frontend/ @engryamato
/frontend/app/ @engryamato
/frontend/components/ @engryamato
/frontend/lib/ @engryamato

# Backend specific
/backend/ @engryamato
/core/ @engryamato
/auth-server/ @engryamato

# CI/CD and DevOps
/.github/ @engryamato
/scripts/ @engryamato
/docker/ @engryamato
docker-compose*.yml @engryamato

# Documentation
/docs/ @engryamato
README.md @engryamato
*.md @engryamato

# Configuration files
package.json @engryamato
requirements.txt @engryamato
/frontend/package.json @engryamato
/backend/requirements.txt @engryamato
/auth-server/requirements.txt @engryamato

# Security and quality
.github/workflows/security-and-quality.yml @engryamato
.github/dependabot.yml @engryamato
EOF

    success "CODEOWNERS file created"
}

# Setup issue and PR templates
setup_templates() {
    log "Setting up issue and PR templates..."
    
    # Create issue templates directory
    mkdir -p .github/ISSUE_TEMPLATE
    
    # Bug report template
    cat > .github/ISSUE_TEMPLATE/bug_report.yml << EOF
name: 🐛 Bug Report
description: Report a bug or unexpected behavior
title: "[BUG] "
labels: ["bug", "needs-triage"]
assignees:
  - engryamato

body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report!

  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: A clear and concise description of what the bug is.
      placeholder: Tell us what you see!
    validations:
      required: true

  - type: textarea
    id: expected-behavior
    attributes:
      label: Expected Behavior
      description: A clear and concise description of what you expected to happen.
    validations:
      required: true

  - type: textarea
    id: steps-to-reproduce
    attributes:
      label: Steps to Reproduce
      description: Steps to reproduce the behavior
      placeholder: |
        1. Go to '...'
        2. Click on '....'
        3. Scroll down to '....'
        4. See error
    validations:
      required: true

  - type: dropdown
    id: browsers
    attributes:
      label: What browsers are you seeing the problem on?
      multiple: true
      options:
        - Firefox
        - Chrome
        - Safari
        - Microsoft Edge

  - type: textarea
    id: logs
    attributes:
      label: Relevant log output
      description: Please copy and paste any relevant log output. This will be automatically formatted into code, so no need for backticks.
      render: shell
EOF

    # Feature request template
    cat > .github/ISSUE_TEMPLATE/feature_request.yml << EOF
name: 🚀 Feature Request
description: Suggest an idea for this project
title: "[FEATURE] "
labels: ["enhancement", "needs-triage"]
assignees:
  - engryamato

body:
  - type: markdown
    attributes:
      value: |
        Thanks for suggesting a new feature!

  - type: textarea
    id: problem
    attributes:
      label: Is your feature request related to a problem?
      description: A clear and concise description of what the problem is.
      placeholder: I'm always frustrated when...
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Describe the solution you'd like
      description: A clear and concise description of what you want to happen.
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Describe alternatives you've considered
      description: A clear and concise description of any alternative solutions or features you've considered.

  - type: textarea
    id: additional-context
    attributes:
      label: Additional context
      description: Add any other context or screenshots about the feature request here.
EOF

    # Pull request template
    cat > .github/pull_request_template.md << EOF
## 📋 Description

Brief description of what this PR does.

## 🔗 Related Issue

Fixes #(issue number)

## 🧪 Type of Change

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🧹 Code cleanup

## ✅ Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## 📝 Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## 📸 Screenshots (if applicable)

Add screenshots to help explain your changes.

## 🔍 Additional Notes

Any additional information that reviewers should know.
EOF

    success "Issue and PR templates created"
}

# Main function
main() {
    log "Starting SizeWise Suite branch protection setup..."
    
    check_prerequisites
    setup_branch_protection
    setup_codeowners
    setup_templates
    
    success "Branch protection setup completed successfully!"
    
    log "Next steps:"
    log "1. Commit and push the new .github files"
    log "2. Verify branch protection rules in GitHub repository settings"
    log "3. Test the protection by creating a test PR"
}

# Run main function
main "$@"
