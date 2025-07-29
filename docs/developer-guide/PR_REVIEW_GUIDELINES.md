# Pull Request Review Guidelines

*Version: 2.0*  
*Last Updated: 2025-07-27*  
*Aligned with: CI/CD Pipeline v1.0 & Branch Protection Rules*

---

## 🎯 Overview

This document establishes comprehensive PR review guidelines for the SizeWise Suite repository, ensuring all changes meet our production-ready standards while maintaining the offline-first HVAC engineering platform's integrity.

---

## 🔒 Branch Protection Integration

### Required Status Checks
All PRs must pass these automated checks before review:

- ✅ **frontend-tests (18.x, 20.x)** - Node.js multi-version testing
- ✅ **backend-tests (3.9, 3.10, 3.11)** - Python multi-version testing  
- ✅ **security-scan** - npm audit, safety, bandit vulnerability checks
- ✅ **test-summary** - Overall CI/CD validation

### Review Requirements
- **Minimum 1 approving review** required
- **All conversations must be resolved**
- **Branch must be up-to-date** with main
- **No force pushes or deletions** allowed

---

## 👥 Reviewer Assignment Guidelines

### 🎯 Review Types & Expertise Areas

#### **Code Review** (Required for all PRs)
**Reviewers:** Any team member with relevant expertise  
**Focus:** Code quality, functionality, testing, documentation

#### **Architecture Review** (Required for structural changes)
**Reviewers:** Senior developers, tech leads  
**Triggers:**
- Changes to core architecture patterns
- New feature modules or major refactoring
- Database schema modifications
- API design changes

#### **Security Review** (Required for security-sensitive changes)
**Reviewers:** Security-conscious team members  
**Triggers:**
- Authentication/authorization changes
- Data validation modifications
- External API integrations
- Dependency updates with security implications

#### **Performance Review** (Required for performance-critical changes)
**Reviewers:** Performance specialists  
**Triggers:**
- HVAC calculation engine modifications
- 3D workspace performance changes
- Database query optimizations
- Large data processing changes

#### **Standards Review** (Required for HVAC compliance changes)
**Reviewers:** HVAC domain experts  
**Triggers:**
- SMACNA/NFPA/ASHRAE calculation changes
- Standards compliance logic modifications
- Engineering validation updates

---

## 📋 Code Quality Standards

### 🎨 Frontend (React/TypeScript) Standards

#### **Code Quality Requirements**
- ✅ **TypeScript Coverage:** 100% type coverage, no `any` types
- ✅ **Component Structure:** Functional components with hooks
- ✅ **State Management:** Zustand for global state, local state for components
- ✅ **Styling:** Tailwind CSS with glassmorphism design system
- ✅ **Performance:** React.memo for expensive components, useMemo/useCallback optimization

#### **Testing Requirements**
- ✅ **Unit Tests:** Jest + React Testing Library for all components
- ✅ **Integration Tests:** Key user workflows tested
- ✅ **E2E Tests:** Playwright for critical paths
- ✅ **Coverage:** Minimum 80% test coverage for new code

#### **Architecture Compliance**
- ✅ **Feature-Based Organization:** Code organized by feature modules
- ✅ **Offline-First:** All features work without internet connection
- ✅ **3D Integration:** Three.js components properly integrated
- ✅ **Accessibility:** WCAG 2.1 AA compliance

### 🐍 Backend (Python/Flask) Standards

#### **Code Quality Requirements**
- ✅ **Type Hints:** Full type annotation coverage
- ✅ **Code Style:** Black formatting, flake8 linting, mypy type checking
- ✅ **Error Handling:** Comprehensive exception handling with proper logging
- ✅ **API Design:** RESTful endpoints with proper HTTP status codes

#### **Testing Requirements**
- ✅ **Unit Tests:** pytest for all calculation functions
- ✅ **Integration Tests:** API endpoint testing
- ✅ **Calculation Accuracy:** HVAC calculations verified against standards
- ✅ **Coverage:** Minimum 85% test coverage for calculation logic

#### **HVAC Standards Compliance**
- ✅ **Calculation Accuracy:** Results verified against SMACNA/NFPA/ASHRAE
- ✅ **Input Validation:** Proper range checking and error handling
- ✅ **Performance:** Calculations complete within acceptable time limits
- ✅ **Documentation:** Engineering rationale documented for complex calculations

---

## 🧪 Testing Requirements

### 🔍 Test Categories

#### **Unit Tests**
- **Frontend:** Component behavior, utility functions, hooks
- **Backend:** Calculation functions, data validation, business logic
- **Coverage:** Minimum 80% for new code

#### **Integration Tests**
- **API Integration:** Frontend ↔ Backend communication
- **Database Integration:** Data persistence and retrieval
- **Third-party Integration:** External service connections

#### **End-to-End Tests**
- **User Workflows:** Complete user journeys through the application
- **Cross-Platform:** Testing across different browsers and devices
- **Performance:** Load testing for calculation-heavy operations

#### **Security Tests**
- **Input Validation:** SQL injection, XSS prevention
- **Authentication:** Login/logout flows, session management
- **Authorization:** Role-based access control

---

## 🔒 Security Review Criteria

### 🛡️ Security Checklist

#### **Input Validation**
- ✅ All user inputs properly sanitized and validated
- ✅ SQL injection prevention measures in place
- ✅ XSS protection implemented
- ✅ File upload restrictions enforced

#### **Authentication & Authorization**
- ✅ Proper authentication flows implemented
- ✅ Session management secure
- ✅ Role-based access control working
- ✅ Password policies enforced

#### **Data Protection**
- ✅ Sensitive data properly encrypted
- ✅ No credentials in code or logs
- ✅ HTTPS enforced for all communications
- ✅ Data privacy requirements met

#### **Dependency Security**
- ✅ No known vulnerabilities in dependencies
- ✅ Regular security updates applied
- ✅ Minimal dependency footprint maintained

---

## ⚡ Performance Considerations

### 🚀 Performance Standards

#### **HVAC Calculations**
- ✅ **Response Time:** < 100ms for standard calculations
- ✅ **Complex Calculations:** < 500ms for system-wide analysis
- ✅ **Memory Usage:** < 50MB per calculation session
- ✅ **Accuracy:** Results within 0.1% of reference standards

#### **Frontend Performance**
- ✅ **Initial Load:** < 3 seconds for first meaningful paint
- ✅ **3D Rendering:** 60fps for 3D workspace interactions
- ✅ **Bundle Size:** < 2MB for main application bundle
- ✅ **Memory Usage:** < 100MB for typical user sessions

#### **Backend Performance**
- ✅ **API Response:** < 200ms for standard endpoints
- ✅ **Database Queries:** < 50ms for typical operations
- ✅ **Concurrent Users:** Support 100+ simultaneous users
- ✅ **Resource Usage:** < 512MB RAM per worker process

---

## 📚 Documentation Requirements

### 📖 Documentation Standards

#### **Code Documentation**
- ✅ **Complex Logic:** Inline comments explaining business logic
- ✅ **API Documentation:** OpenAPI/Swagger for all endpoints
- ✅ **Type Documentation:** JSDoc for TypeScript interfaces
- ✅ **Function Documentation:** Docstrings for all public functions

#### **User Documentation**
- ✅ **Feature Changes:** User guide updates for new features
- ✅ **API Changes:** Migration guides for breaking changes
- ✅ **Configuration:** Environment setup documentation
- ✅ **Troubleshooting:** Common issues and solutions

#### **Architecture Documentation**
- ✅ **ADRs:** Architecture Decision Records for major changes
- ✅ **Design Docs:** Technical specifications for new features
- ✅ **Migration Guides:** Step-by-step upgrade instructions
- ✅ **Deployment Docs:** Production deployment procedures

---

## 🚨 Escalation Procedures

### ⚠️ When to Escalate

#### **Immediate Escalation Required**
- Security vulnerabilities discovered
- Breaking changes to core functionality
- Performance regressions > 20%
- Standards compliance violations

#### **Architecture Review Required**
- New feature modules
- Database schema changes
- API design modifications
- Third-party integrations

#### **Domain Expert Review Required**
- HVAC calculation changes
- Standards compliance modifications
- Engineering validation updates
- Regulatory requirement changes

### 📞 Escalation Process
1. **Tag appropriate reviewers** in PR comments
2. **Document the concern** with specific details
3. **Provide context** and potential impact
4. **Wait for expert review** before proceeding
5. **Document resolution** in PR comments

---

## ✅ Review Completion Checklist

### 🎯 Before Approving a PR

- [ ] All CI/CD status checks pass
- [ ] Code quality standards met
- [ ] Testing requirements satisfied
- [ ] Security review completed (if applicable)
- [ ] Performance impact assessed
- [ ] Documentation updated
- [ ] Architecture compliance verified
- [ ] Standards compliance confirmed (for HVAC changes)
- [ ] Breaking changes properly documented
- [ ] Deployment considerations addressed

### 🚀 Ready for Merge

- [ ] All required approvals obtained
- [ ] All conversations resolved
- [ ] Branch up-to-date with main
- [ ] No merge conflicts
- [ ] Final validation complete
- [ ] Production deployment ready

---

*This document is maintained alongside our CI/CD pipeline and branch protection rules to ensure consistent, high-quality code delivery for the SizeWise Suite platform.*
