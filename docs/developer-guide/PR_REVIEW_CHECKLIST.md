# Pull Request Review Checklist

*Version: 1.0*  
*Last Updated: 2025-07-15*

## 📋 Pre-Merge Checklist

Use this checklist for every PR before merging to maintain code quality and prevent conflicts.

### ✅ Technical Requirements

#### Code Quality
- [ ] All tests pass (unit, integration, e2e)
- [ ] No linting errors or warnings
- [ ] TypeScript compilation successful (if applicable)
- [ ] Code follows project style guidelines
- [ ] No console.log or debug statements in production code

#### Functionality
- [ ] Feature works as described in PR description
- [ ] Edge cases handled appropriately
- [ ] Error handling implemented
- [ ] Performance impact assessed and acceptable
- [ ] Mobile responsiveness verified (if UI changes)

#### Security & Accessibility
- [ ] No security vulnerabilities introduced
- [ ] WCAG 2.1 AA compliance maintained (for UI changes)
- [ ] Proper input validation and sanitization
- [ ] Authentication/authorization checks in place

### 🔍 Review Process

#### Documentation
- [ ] PR description clearly explains changes
- [ ] Code comments added for complex logic
- [ ] README or docs updated if needed
- [ ] API documentation updated (if applicable)
- [ ] Breaking changes documented

#### Testing Evidence
- [ ] Test plan provided or executed
- [ ] Screenshots/videos for UI changes
- [ ] Performance benchmarks (if applicable)
- [ ] Cross-browser testing completed
- [ ] Accessibility testing completed

### 🚨 Conflict Prevention

#### Dependencies
- [ ] No conflicts with other open PRs
- [ ] Dependencies properly managed (package.json, requirements.txt)
- [ ] Database migrations handled correctly
- [ ] Environment variables documented

#### Integration
- [ ] Backward compatibility maintained
- [ ] API contracts preserved
- [ ] Existing functionality not broken
- [ ] Integration tests pass

### 📊 Business Impact

#### Value Assessment
- [ ] Feature aligns with product roadmap
- [ ] User experience improved or maintained
- [ ] Performance impact acceptable
- [ ] Technical debt not significantly increased

#### Risk Assessment
- [ ] Change scope appropriate for PR size
- [ ] Rollback plan available for major changes
- [ ] Monitoring/alerting in place for critical changes
- [ ] Stakeholder approval for significant changes

## 🏷️ PR Labels and Categories

### Priority Labels
- `priority:critical` - Security fixes, production issues
- `priority:high` - Important features, significant bugs
- `priority:medium` - Standard features, minor improvements
- `priority:low` - Nice-to-have, documentation updates

### Type Labels
- `type:feature` - New functionality
- `type:bugfix` - Bug fixes
- `type:refactor` - Code improvements without functional changes
- `type:docs` - Documentation updates
- `type:infrastructure` - CI/CD, build, deployment changes

### Size Labels
- `size:small` - < 100 lines changed
- `size:medium` - 100-500 lines changed
- `size:large` - 500+ lines changed
- `size:xl` - Major changes requiring special coordination

## 🚫 Automatic Rejection Criteria

Reject PRs immediately if:
- [ ] Tests are failing
- [ ] Merge conflicts exist
- [ ] No description provided
- [ ] Introduces security vulnerabilities
- [ ] Breaks existing functionality
- [ ] Violates coding standards significantly

## ⚡ Fast-Track Criteria

PRs can be fast-tracked if:
- [ ] Documentation-only changes
- [ ] Security patches from dependabot
- [ ] Hot fixes for production issues
- [ ] Simple configuration updates
- [ ] Approved by tech lead

## 🔄 Review Assignment

### Automatic Assignment
- **Frontend changes:** Frontend team lead
- **Backend changes:** Backend team lead
- **Infrastructure:** DevOps engineer
- **Documentation:** Technical writer (if available)

### Required Reviewers
- **Major features:** 2+ reviewers including tech lead
- **Security changes:** Security team member
- **Database changes:** Database administrator
- **API changes:** API team lead

## 📈 Metrics to Track

- Time from PR creation to merge
- Number of review cycles per PR
- Test coverage impact
- Bug reports related to recent merges
- Developer satisfaction with review process

## 🆘 Escalation Process

### When to Escalate
- PR blocked for > 48 hours
- Disagreement between reviewers
- Technical complexity beyond reviewer expertise
- Urgent production fix needed

### Escalation Path
1. **Tech Lead** - Technical decisions and conflicts
2. **Engineering Manager** - Resource allocation and priorities
3. **CTO/VP Engineering** - Strategic decisions and major changes

---

*This checklist should be updated based on team feedback and lessons learned.*
