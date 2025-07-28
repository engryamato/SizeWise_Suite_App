# Reviewer Assignment Guide

*Version: 1.0*  
*Last Updated: 2025-07-27*  
*Aligned with: Branch Protection Rules & CI/CD Pipeline*

---

## 🎯 Overview

This guide provides clear criteria for assigning appropriate reviewers to pull requests in the SizeWise Suite repository, ensuring expertise-based review assignments and efficient review processes.

---

## 👥 Review Types & Assignment Criteria

### 🔍 **Code Review** (Required for ALL PRs)
**Who:** Any team member with relevant technical expertise  
**When:** Every pull request  
**Focus:** Code quality, functionality, testing, documentation

**Assignment Criteria:**
- Frontend changes → Frontend-experienced reviewers
- Backend changes → Backend-experienced reviewers  
- Full-stack changes → Both frontend and backend reviewers
- Documentation-only → Any team member

---

### 🏗️ **Architecture Review** (Required for Structural Changes)
**Who:** Senior developers, tech leads, system architects  
**When:** PRs that modify core system architecture

**Triggers for Architecture Review:**
- ✅ New feature modules or major refactoring
- ✅ Changes to core architecture patterns
- ✅ Database schema modifications
- ✅ API design changes or new endpoints
- ✅ State management pattern changes
- ✅ Build system or deployment configuration changes
- ✅ Third-party service integrations
- ✅ Performance-critical infrastructure changes

**Required Reviewers:**
- At least 1 senior developer or tech lead
- Domain expert for affected area (if applicable)

---

### 🔒 **Security Review** (Required for Security-Sensitive Changes)
**Who:** Security-conscious team members, security specialists  
**When:** PRs that impact application security

**Triggers for Security Review:**
- ✅ Authentication/authorization changes
- ✅ Data validation modifications
- ✅ External API integrations
- ✅ Dependency updates with security implications
- ✅ File upload/download functionality
- ✅ User input handling changes
- ✅ Encryption/decryption implementations
- ✅ Session management modifications

**Required Reviewers:**
- At least 1 security-conscious team member
- Additional security specialist for high-risk changes

---

### ⚡ **Performance Review** (Required for Performance-Critical Changes)
**Who:** Performance specialists, senior developers  
**When:** PRs that may impact application performance

**Triggers for Performance Review:**
- ✅ HVAC calculation engine modifications
- ✅ 3D workspace performance changes
- ✅ Database query optimizations
- ✅ Large data processing changes
- ✅ Memory-intensive operations
- ✅ Real-time calculation updates
- ✅ Bundle size significant increases
- ✅ API response time modifications

**Required Reviewers:**
- At least 1 performance-focused team member
- Domain expert for calculation changes

---

### 📐 **Standards Review** (Required for HVAC Compliance Changes)
**Who:** HVAC domain experts, engineering specialists  
**When:** PRs that modify HVAC calculations or compliance logic

**Triggers for Standards Review:**
- ✅ SMACNA/NFPA/ASHRAE calculation changes
- ✅ Standards compliance logic modifications
- ✅ Engineering validation updates
- ✅ Calculation accuracy improvements
- ✅ New HVAC calculation features
- ✅ Regulatory requirement implementations
- ✅ Industry standard updates
- ✅ Calculation result validation changes

**Required Reviewers:**
- At least 1 HVAC domain expert
- Engineering specialist for complex calculations

---

## 🎯 Reviewer Expertise Areas

### 👨‍💻 **Frontend Expertise**
**Technologies:** React, TypeScript, Next.js, Three.js, Tailwind CSS  
**Focus Areas:**
- Component architecture and reusability
- State management with Zustand
- 3D workspace functionality
- UI/UX and accessibility
- Performance optimization
- Glassmorphism design system compliance

### 🐍 **Backend Expertise**
**Technologies:** Python, Flask, SQLAlchemy, pytest  
**Focus Areas:**
- API design and implementation
- HVAC calculation accuracy
- Data validation and schemas
- Database design and optimization
- Error handling and logging
- Performance optimization

### 🔒 **Security Expertise**
**Focus Areas:**
- Authentication and authorization
- Input validation and sanitization
- Dependency vulnerability assessment
- Data privacy and protection
- Secure coding practices
- Penetration testing insights

### ⚡ **Performance Expertise**
**Focus Areas:**
- Application performance profiling
- Database query optimization
- Frontend bundle optimization
- Memory usage optimization
- Real-time calculation performance
- Load testing and scalability

### 📐 **HVAC Domain Expertise**
**Focus Areas:**
- SMACNA/NFPA/ASHRAE standards
- HVAC calculation accuracy
- Engineering validation
- Industry best practices
- Regulatory compliance
- Technical documentation

---

## 🚀 Assignment Process

### 📋 **Step 1: Identify Review Types Needed**
1. Review the PR description and changes
2. Identify which review types are triggered
3. Check for multiple review type requirements

### 👥 **Step 2: Assign Appropriate Reviewers**
1. **Code Review:** Assign based on technical area
2. **Specialized Reviews:** Assign domain experts as needed
3. **Multiple Reviewers:** For complex changes requiring multiple expertise areas

### ⏰ **Step 3: Set Review Expectations**
1. **Standard Reviews:** 24-48 hours for initial review
2. **Architecture Reviews:** 48-72 hours for thorough analysis
3. **Security Reviews:** 24-48 hours with potential follow-up
4. **Performance Reviews:** 48-72 hours including testing
5. **Standards Reviews:** 72-96 hours for calculation verification

---

## 🚨 Escalation Procedures

### ⚠️ **When to Escalate**

#### **Immediate Escalation (< 4 hours)**
- Security vulnerabilities discovered
- Production-breaking changes
- Critical performance regressions
- Standards compliance violations

#### **Standard Escalation (24-48 hours)**
- Complex architectural decisions
- Conflicting review feedback
- Resource availability issues
- Technical disagreements

### 📞 **Escalation Process**
1. **Tag team lead** or senior developer in PR comments
2. **Document the issue** with specific details and context
3. **Provide impact assessment** and urgency level
4. **Suggest potential solutions** or alternatives
5. **Wait for guidance** before proceeding with changes

---

## 🏷️ **PR Labeling for Review Assignment**

### 📊 **Review Type Labels**
- `review:code` - Standard code review required
- `review:architecture` - Architecture review required
- `review:security` - Security review required
- `review:performance` - Performance review required
- `review:standards` - HVAC standards review required

### 🎯 **Expertise Labels**
- `expertise:frontend` - Frontend expertise needed
- `expertise:backend` - Backend expertise needed
- `expertise:hvac` - HVAC domain expertise needed
- `expertise:security` - Security expertise needed
- `expertise:performance` - Performance expertise needed

### ⚡ **Priority Labels**
- `priority:critical` - Immediate attention required
- `priority:high` - Review within 24 hours
- `priority:normal` - Standard review timeline
- `priority:low` - Review when available

---

## ✅ **Review Completion Criteria**

### 🎯 **All Reviews Must Verify:**
- [ ] All CI/CD status checks pass
- [ ] Code quality standards met
- [ ] Testing requirements satisfied
- [ ] Documentation updated appropriately
- [ ] No breaking changes without migration plan

### 🔍 **Specialized Review Criteria:**
- [ ] **Architecture:** Design patterns followed, scalability considered
- [ ] **Security:** Vulnerabilities addressed, secure practices followed
- [ ] **Performance:** Acceptable performance impact, optimization opportunities identified
- [ ] **Standards:** HVAC calculations accurate, compliance requirements met

---

## 📚 **Resources for Reviewers**

### 📖 **Documentation References**
- [PR Review Guidelines](./PR_REVIEW_GUIDELINES.md) - Comprehensive review standards
- [Architecture Documentation](../architecture/) - System design principles
- [Security Guidelines](../security/) - Security best practices
- [Performance Standards](../performance/) - Performance requirements
- [HVAC Standards](../hvac/) - Engineering compliance requirements

### 🛠️ **Review Tools**
- **Code Quality:** ESLint, TypeScript compiler, Black, flake8
- **Security:** npm audit, safety, bandit, Snyk
- **Performance:** Lighthouse, Bundle Analyzer, pytest-benchmark
- **Testing:** Jest, pytest, Playwright, React Testing Library

---

*This guide ensures efficient and thorough review processes while maintaining the high quality standards required for the SizeWise Suite HVAC engineering platform.*
