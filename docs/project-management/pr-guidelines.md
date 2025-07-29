# Pull Request Guidelines

**📍 Navigation:** [Documentation Home](../README.md) > [Project Management](README.md) > PR Guidelines

This document outlines the pull request process, standards, and best practices for contributing to SizeWise Suite.

## Pull Request Process

### 1. Before Creating a PR

**Preparation Checklist**:
- [ ] Feature branch is up to date with main branch
- [ ] All tests pass locally
- [ ] Code follows project coding standards
- [ ] Documentation is updated if needed
- [ ] Self-review completed

**Branch Naming Convention**:
```
feature/canvas-drawing-engine
bugfix/calculation-validation-error
hotfix/authentication-security-issue
docs/api-documentation-update
refactor/component-structure-cleanup
```

### 2. Creating the Pull Request

**PR Title Format**:
```
feat(canvas): add room drawing functionality
fix(auth): resolve JWT token expiration issue
docs(api): update endpoint documentation
test(calc): add unit tests for duct sizing
refactor(ui): improve component structure
```

**PR Description Template**:
```markdown
## Description
Brief description of what this PR accomplishes.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)

## Changes Made
- List specific changes made
- Include any new dependencies
- Mention any configuration changes

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Include screenshots for UI changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] No breaking changes (or breaking changes documented)
```

### 3. PR Review Process

**Review Requirements**:
- **Minimum Reviewers**: 2 for core features, 1 for documentation/minor fixes
- **Required Reviewers**: Code owner for affected areas
- **Automated Checks**: All CI checks must pass

**Review Timeline**:
- **Initial Review**: Within 24 hours for urgent fixes, 48 hours for features
- **Follow-up Reviews**: Within 24 hours of updates
- **Final Approval**: Within 48 hours of all requirements met

## Code Review Standards

### What Reviewers Look For

**Code Quality**:
- Follows established coding standards and conventions
- Proper error handling and edge case coverage
- Performance considerations and optimization
- Security best practices implementation

**Architecture**:
- Maintains consistency with existing patterns
- Proper separation of concerns
- Appropriate abstraction levels
- Scalability considerations

**Testing**:
- Adequate test coverage for new functionality
- Tests are meaningful and test behavior, not implementation
- Edge cases and error conditions are tested
- Tests are maintainable and well-structured

**Documentation**:
- Code is self-documenting with clear variable/function names
- Complex logic includes explanatory comments
- Public APIs are properly documented
- README and documentation updates when needed

### Review Comments Guidelines

**Providing Feedback**:
- Be constructive and specific
- Explain the "why" behind suggestions
- Offer solutions, not just problems
- Use appropriate labels (nitpick, suggestion, required)

**Comment Types**:
- **Required**: Must be addressed before merge
- **Suggestion**: Recommended improvement
- **Nitpick**: Minor style or preference issue
- **Question**: Seeking clarification

**Example Comments**:
```
Required: This function doesn't handle the case where `airflow` is negative. 
Please add validation to ensure positive values.

Suggestion: Consider extracting this calculation into a separate utility 
function for reusability.

Nitpick: Variable name `d` could be more descriptive, perhaps `diameter`?

Question: Is there a specific reason for using this approach over the 
standard library method?
```

## Merge Requirements

### Automated Checks
All PRs must pass:
- [ ] Linting (ESLint, Prettier, Flake8, Black)
- [ ] Type checking (TypeScript, mypy)
- [ ] Unit tests (minimum 80% coverage)
- [ ] Integration tests
- [ ] Security scanning
- [ ] Build verification

### Manual Requirements
- [ ] Code review approval from required reviewers
- [ ] All review comments resolved
- [ ] Documentation updated if needed
- [ ] Breaking changes documented
- [ ] Migration guide provided (if applicable)

### Merge Strategies

**Squash and Merge** (Default):
- Use for feature branches with multiple commits
- Creates clean, linear history
- Commit message should summarize entire PR

**Merge Commit**:
- Use for complex features that benefit from preserving commit history
- Requires clean, meaningful commit messages throughout branch

**Rebase and Merge**:
- Use for simple changes with clean commit history
- Maintains linear history without merge commits

## Special Cases

### Hotfixes
**Expedited Process**:
- Can be merged with single reviewer approval
- Must include immediate testing verification
- Requires post-merge monitoring
- Follow-up PR for additional tests/documentation

**Hotfix Checklist**:
- [ ] Critical issue identified and documented
- [ ] Minimal, targeted fix implemented
- [ ] Immediate testing completed
- [ ] Monitoring plan in place
- [ ] Follow-up tasks created

### Documentation-Only Changes
**Simplified Process**:
- Single reviewer approval sufficient
- Focus on accuracy and clarity
- Verify all links work correctly
- Check formatting and consistency

### Breaking Changes
**Enhanced Process**:
- Requires architecture team approval
- Migration guide must be provided
- Deprecation warnings added (when possible)
- Communication plan for users/developers

## Common Issues and Solutions

### Failed CI Checks
```bash
# Fix linting issues
npm run lint:fix

# Fix formatting
npm run format

# Run tests locally
npm test
npm run test:e2e
```

### Merge Conflicts
```bash
# Update feature branch with latest main
git checkout main
git pull origin main
git checkout feature-branch
git rebase main

# Resolve conflicts and continue
git add .
git rebase --continue
```

### Large PRs
- Break into smaller, focused PRs when possible
- Use draft PRs for work-in-progress
- Provide detailed description and context
- Consider pair programming for complex changes

## Best Practices

### For PR Authors
- Keep PRs focused and reasonably sized (< 400 lines when possible)
- Write clear, descriptive commit messages
- Test thoroughly before submitting
- Respond promptly to review feedback
- Update PR description if scope changes

### For Reviewers
- Review promptly and thoroughly
- Focus on important issues, not just style
- Provide constructive, actionable feedback
- Approve when requirements are met
- Follow up on requested changes

### For Maintainers
- Ensure consistent application of standards
- Provide guidance on complex architectural decisions
- Monitor PR metrics and process effectiveness
- Update guidelines based on team feedback

---

## Related Documentation

- **[Contributing Guidelines](../developer-guide/contributing.md)**: Overall contribution process
- **[Code Review Process](review-process.md)**: Detailed review procedures
- **[Development Workflow](../developer-guide/getting-started.md#development-workflow)**: Daily development processes
- **[Testing Guidelines](../developer-guide/testing.md)**: Testing standards and procedures

**📍 Navigation:** [Documentation Home](../README.md) > [Project Management](README.md) > PR Guidelines
