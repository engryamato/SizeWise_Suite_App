# Pull Request

## 📋 Summary

<!-- Provide a clear and concise description of the changes -->

### What does this PR do?
- 

### Why is this change needed?
- 

### Related Issues/Documentation
- Fixes #(issue number)
- Related to #(issue number)
- Documentation: [link to relevant docs]

---

## 🧪 Testing Checklist

<!-- Check all that apply and ensure CI/CD requirements are met -->

### ✅ CI/CD Status Checks
- [ ] **Frontend Tests** - All Node.js 18.x and 20.x tests pass
- [ ] **Backend Tests** - All Python 3.9, 3.10, and 3.11 tests pass  
- [ ] **Security Scan** - npm audit, safety, and bandit checks pass
- [ ] **Test Summary** - Overall CI/CD validation complete

### 🔍 Manual Testing
- [ ] **Functionality** - Feature works as described
- [ ] **Edge Cases** - Boundary conditions and error scenarios tested
- [ ] **Performance** - No significant performance degradation
- [ ] **Cross-Platform** - Tested on multiple environments (if applicable)

### 📱 Frontend Testing (if applicable)
- [ ] **React Components** - Unit tests for new/modified components
- [ ] **TypeScript** - No type errors, proper type definitions
- [ ] **UI/UX** - Visual regression testing completed
- [ ] **Accessibility** - WCAG compliance verified
- [ ] **3D Workspace** - Three.js functionality tested (if applicable)

### 🐍 Backend Testing (if applicable)
- [ ] **API Endpoints** - All new/modified endpoints tested
- [ ] **HVAC Calculations** - Accuracy verified against standards
- [ ] **Data Validation** - Schema validation working correctly
- [ ] **Error Handling** - Proper error responses implemented

---

## 🏗️ Architecture & Code Quality

### 📐 SizeWise Suite Architecture Compliance
- [ ] **Offline-First** - Changes support offline functionality
- [ ] **Modular Design** - Code follows feature-based organization
- [ ] **Standards Compliance** - SMACNA/NFPA/ASHRAE requirements met
- [ ] **Type Safety** - Full TypeScript coverage for frontend changes

### 🔒 Security Review
- [ ] **Input Validation** - All user inputs properly validated
- [ ] **Authentication** - Auth requirements properly implemented
- [ ] **Data Privacy** - No sensitive data exposed in logs/responses
- [ ] **Dependencies** - No known security vulnerabilities introduced

### 📊 Performance Considerations
- [ ] **Calculation Performance** - HVAC calculations complete within acceptable time
- [ ] **Memory Usage** - No memory leaks or excessive resource consumption
- [ ] **Bundle Size** - Frontend bundle size impact assessed
- [ ] **Database Queries** - Efficient data access patterns used

---

## 📚 Documentation

### 📖 Documentation Updates
- [ ] **Code Comments** - Complex logic properly documented
- [ ] **API Documentation** - New endpoints documented
- [ ] **User Guide** - User-facing changes documented
- [ ] **Architecture Docs** - ADRs created for significant changes

### 🔄 Migration & Compatibility
- [ ] **Breaking Changes** - Breaking changes documented with migration guide
- [ ] **Backward Compatibility** - Existing functionality preserved
- [ ] **Database Migrations** - Schema changes properly handled
- [ ] **Configuration Changes** - Environment/config updates documented

---

## 👥 Review Requirements

### 🎯 Review Type Needed
- [ ] **Code Review** - Standard code quality and functionality review
- [ ] **Architecture Review** - Significant structural or design changes
- [ ] **Security Review** - Security-sensitive changes
- [ ] **Performance Review** - Performance-critical modifications
- [ ] **Standards Review** - HVAC calculation or compliance changes

### 📋 Reviewer Guidelines
<!-- For reviewers: Please verify the following -->
- [ ] **Branch Protection** - All required status checks pass
- [ ] **Code Quality** - Follows project coding standards
- [ ] **Test Coverage** - Adequate test coverage for changes
- [ ] **Documentation** - Changes are properly documented
- [ ] **Production Ready** - Code meets deployment standards

---

## 🚀 Deployment Considerations

### 🔧 Deployment Checklist
- [ ] **Environment Variables** - New config variables documented
- [ ] **Database Changes** - Migration scripts provided (if needed)
- [ ] **Feature Flags** - Feature toggles implemented (if applicable)
- [ ] **Rollback Plan** - Rollback procedure documented for significant changes

### 📈 Post-Deployment Monitoring
- [ ] **Metrics** - Key metrics identified for monitoring
- [ ] **Logging** - Appropriate logging added for debugging
- [ ] **Error Tracking** - Error scenarios properly tracked
- [ ] **Performance Monitoring** - Performance impact can be measured

---

## 📝 Additional Notes

<!-- Any additional context, concerns, or information for reviewers -->

### 🔍 Areas of Focus for Review
- 

### ⚠️ Known Issues or Limitations
- 

### 🔮 Future Considerations
- 

---

## 📋 Pre-Merge Checklist

<!-- Final verification before merge -->
- [ ] All CI/CD checks pass
- [ ] Required approvals obtained
- [ ] Branch is up to date with main
- [ ] No merge conflicts
- [ ] Documentation updated
- [ ] Ready for production deployment
