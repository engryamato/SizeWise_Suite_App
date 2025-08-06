# SizeWise Suite - Gap Remediation Action Plan

**Date:** August 6, 2025  
**Plan Type:** Comprehensive Gap Remediation Strategy  
**Timeline:** 16 weeks to full production excellence  
**Status:** 🎯 **STRATEGIC IMPLEMENTATION READY**  

---

## 📋 **Executive Summary**

This remediation plan addresses the 30+ identified gaps from the comprehensive gap analysis, providing a structured 4-phase approach to achieve full production readiness. The plan prioritizes critical blockers (4 items) that prevent production deployment, followed by systematic enhancement of reliability, security, and operational excellence.

**Key Metrics:**
- **Critical Gaps:** 4 items (production blockers)
- **High Priority Gaps:** 7 items (30-day timeline)
- **Medium Priority Gaps:** 12 items (90-day timeline)
- **Enhancement Items:** 15+ items (long-term excellence)

**Business Impact:** Successful completion enables enterprise-grade deployment with industry-leading reliability and performance.

---

## 🎯 **Phase 1: Critical Path Resolution** (Weeks 1-4)
*Production Blockers - Must Complete Before Go-Live*

### **Priority 1A: Performance & Scalability** ⚠️ CRITICAL
**Timeline:** Weeks 1-2 | **Risk Score:** 9.5/10 | **Business Impact:** Enterprise customer loss

#### **Gap 1.1: Large Project Performance Testing**
```yaml
Current State: No testing with 1000+ duct segments
Target State: Validate 5000+ segments with <5s response time
Risk: Application unusable for enterprise HVAC projects

Implementation Tasks:
  - [ ] Create performance testing framework with Jest/Playwright
  - [ ] Generate synthetic HVAC projects (1K, 2K, 5K duct segments)
  - [ ] Implement memory profiling with Chrome DevTools
  - [ ] Add database query optimization for large datasets
  - [ ] Test 3D rendering performance with complex geometries
  - [ ] Establish performance baseline metrics and monitoring
  
Success Criteria:
  ✅ Handle 5000+ duct segments with <5 second response
  ✅ Support 50+ concurrent users with <10% degradation
  ✅ Memory usage remains stable during 8+ hour sessions

Estimated Effort: 60-80 hours
Resources Required: 2 senior developers + 1 DevOps engineer
```

#### **Gap 1.2: Memory Leak Detection & Long-Running Sessions**
```yaml
Current State: No validation for 8+ hour professional sessions
Target State: Zero memory leaks in continuous 12-hour use
Risk: Application crashes during professional engineering work

Implementation Tasks:
  - [ ] Implement automated memory profiling (Chrome DevTools + Puppeteer)
  - [ ] Add garbage collection optimization for large objects
  - [ ] Create memory leak detection in CI/CD pipeline
  - [ ] Test Three.js memory management for complex 3D scenes
  - [ ] Add memory usage monitoring and alerting
  - [ ] Implement memory cleanup routines for inactive projects

Success Criteria:
  ✅ Zero memory leaks in 12-hour continuous sessions
  ✅ Memory growth <10MB per hour for active projects
  ✅ Graceful cleanup when switching between large projects

Estimated Effort: 40-60 hours
Resources Required: 2 senior developers + 1 QA engineer
```

### **Priority 1B: Production Deployment Validation** 🚨 CRITICAL
**Timeline:** Weeks 3-4 | **Risk Score:** 9.0/10 | **Business Impact:** Deployment failure

#### **Gap 1.3: Installer & Cross-Platform Testing**
```yaml
Current State: No Windows/macOS installer validation
Target State: 100% installer success rate across all platforms
Risk: Deployment failures in customer environments

Implementation Tasks:
  - [ ] Create Windows installer testing (NSIS/WiX automation)
  - [ ] Implement macOS installer testing (pkg/dmg validation)
  - [ ] Add cross-platform CI/CD testing matrix
  - [ ] Test Linux AppImage/Flatpak distributions
  - [ ] Validate database initialization across platforms
  - [ ] Implement installer rollback procedures

Test Matrix:
  Windows: [10, 11] x [x64, ARM64]
  macOS: [12, 13, 14] x [Intel, Apple Silicon]  
  Linux: [Ubuntu 20/22, RHEL 8/9, Debian 11/12]

Success Criteria:
  ✅ 100% installer success rate across all supported platforms
  ✅ Zero database corruption during installation
  ✅ All platform-specific features work correctly

Estimated Effort: 50-70 hours
Resources Required: 2 developers + 1 DevOps engineer + 1 QA
```

#### **Gap 1.4: Version Upgrade Path Testing**
```yaml
Current State: No automated upgrade testing or validation
Target State: Seamless version upgrades with zero data loss
Risk: Customer data loss during version updates

Implementation Tasks:
  - [ ] Create upgrade testing framework (version matrix)
  - [ ] Implement database migration validation
  - [ ] Add configuration file migration testing
  - [ ] Test project file format compatibility
  - [ ] Implement automated rollback procedures
  - [ ] Validate license tier enforcement after upgrades

Migration Test Matrix:
  v1.0 → v1.1, v1.1 → v1.2, v1.0 → v1.2 (skip versions)
  Test with: [small, medium, large, corrupted] project files

Success Criteria:
  ✅ Zero data loss during version upgrades
  ✅ 100% project file compatibility maintained
  ✅ Successful rollback procedures for failed upgrades

Estimated Effort: 45-65 hours
Resources Required: 2 senior developers + 1 QA engineer
```

---

## 🛡️ **Phase 2: Reliability & Quality Enhancement** (Weeks 5-8)
*High Priority Gaps - Essential for Enterprise Confidence*

### **Priority 2A: Error Handling & Recovery** ⚠️ HIGH PRIORITY
**Timeline:** Weeks 5-6 | **Risk Score:** 8.0/10 | **Business Impact:** Data loss potential

#### **Gap 2.1: Database Corruption Detection & Recovery**
```yaml
Current State: Limited database integrity checking
Target State: Automatic corruption detection with recovery procedures
Risk: Data loss from database corruption

Implementation Tasks:
  - [ ] Implement database integrity checking (SQLite PRAGMA, PostgreSQL pg_checksums)
  - [ ] Add automated backup validation and testing
  - [ ] Create offline data recovery mechanisms
  - [ ] Implement database repair procedures for common corruption
  - [ ] Add real-time data validation during critical operations
  - [ ] Create disaster recovery documentation and procedures

Recovery Scenarios:
  - Partial corruption (single table/record)
  - Full database corruption
  - Network partition during writes
  - Sudden application termination during transactions

Success Criteria:
  ✅ Automatic detection of database corruption within 5 minutes
  ✅ 95%+ data recovery success rate for partial corruption
  ✅ Complete disaster recovery procedures documented and tested

Estimated Effort: 55-75 hours
Resources Required: 2 senior developers + 1 DBA + 1 QA
```

#### **Gap 2.2: Network Resilience & Offline Recovery**
```yaml
Current State: Basic offline functionality, limited recovery
Target State: Robust offline-first architecture with conflict resolution
Risk: Data loss during network partitions or connectivity issues

Implementation Tasks:
  - [ ] Enhance offline data synchronization mechanisms
  - [ ] Implement conflict resolution for concurrent edits
  - [ ] Add network partition detection and handling
  - [ ] Create graceful degradation patterns for API failures
  - [ ] Implement offline queue for critical operations
  - [ ] Add network connectivity restoration procedures

Network Scenarios:
  - Complete network loss (offline mode)
  - Intermittent connectivity (flaky network)
  - Partial API failures (service degradation)
  - Multi-device conflicts (same project, multiple editors)

Success Criteria:
  ✅ Seamless offline-to-online transitions
  ✅ Zero data loss during network partitions
  ✅ Automatic conflict resolution for 90%+ cases

Estimated Effort: 40-60 hours
Resources Required: 2 developers + 1 UX designer
```

### **Priority 2B: Testing & Quality Assurance** 📊 HIGH PRIORITY
**Timeline:** Weeks 7-8 | **Risk Score:** 6.0-7.5/10 | **Business Impact:** Integration issues

#### **Gap 2.3: API Contract Testing & Validation**
```yaml
Current State: No contract-based testing, limited API versioning
Target State: Comprehensive OpenAPI contract testing with backward compatibility
Risk: Breaking API changes affecting integrations

Implementation Tasks:
  - [ ] Generate comprehensive OpenAPI specifications
  - [ ] Implement contract testing with Pact or similar
  - [ ] Add API versioning strategy and testing
  - [ ] Create backward compatibility validation
  - [ ] Implement API response schema validation
  - [ ] Add integration testing for external APIs

API Testing Coverage:
  - All REST endpoints (200+ endpoints)
  - WebSocket connections (real-time updates)
  - File upload/download APIs
  - Authentication and authorization flows

Success Criteria:
  ✅ 100% API contract coverage with automated validation
  ✅ Zero breaking changes to existing API contracts
  ✅ Comprehensive integration testing (90%+ coverage)

Estimated Effort: 45-65 hours
Resources Required: 2 developers + 1 QA automation engineer
```

#### **Gap 2.4: Cross-Platform & Browser Compatibility**
```yaml
Current State: Limited cross-platform testing, focus on Chrome
Target State: Comprehensive testing across all supported platforms and browsers
Risk: Platform-specific bugs affecting customer experience

Implementation Tasks:
  - [ ] Expand Playwright testing to all major browsers
  - [ ] Add platform-specific feature testing
  - [ ] Implement responsive design validation
  - [ ] Test accessibility across different assistive technologies
  - [ ] Add performance testing on lower-end hardware
  - [ ] Create browser compatibility matrix and monitoring

Testing Matrix:
  Browsers: Chrome, Firefox, Safari, Edge (latest 3 versions)
  Platforms: Windows, macOS, Linux
  Mobile: iOS Safari, Android Chrome
  Assistive Tech: NVDA, JAWS, VoiceOver

Success Criteria:
  ✅ 100% feature parity across all supported browsers
  ✅ Zero critical bugs on any supported platform
  ✅ Accessibility compliance maintained across all platforms

Estimated Effort: 60-80 hours
Resources Required: 2 QA engineers + 1 accessibility specialist
```

---

## 🔒 **Phase 3: Security & Compliance Enhancement** (Weeks 9-12)
*Medium Priority Gaps - Advanced Security Features*

### **Priority 3A: Advanced Authentication & Security** 🔐 MEDIUM PRIORITY
**Timeline:** Weeks 9-10 | **Risk Score:** 5.0-6.0/10 | **Business Impact:** Enhanced security posture

#### **Gap 3.1: Multi-Factor Authentication (MFA) Implementation**
```yaml
Current State: Basic authentication with hardware key for super admin
Target State: Comprehensive MFA for all user tiers
Business Value: Enhanced security for enterprise customers

Implementation Tasks:
  - [ ] Implement TOTP-based MFA (Google Authenticator, Authy)
  - [ ] Add SMS-based MFA for regions without smartphone access
  - [ ] Integrate hardware key support for all admin tiers
  - [ ] Create MFA recovery procedures and backup codes
  - [ ] Implement adaptive authentication based on risk factors
  - [ ] Add MFA enforcement policies per organization

MFA Options by User Tier:
  Basic: TOTP or SMS
  Professional: TOTP + Hardware Key (optional)
  Enterprise: TOTP + Hardware Key (required)
  Super Admin: Hardware Key (mandatory)

Success Criteria:
  ✅ MFA adoption rate >80% within 30 days of rollout
  ✅ Zero security breaches related to authentication
  ✅ Seamless UX with <10 second authentication flow

Estimated Effort: 50-70 hours
Resources Required: 2 developers + 1 security engineer + 1 UX designer
```

#### **Gap 3.2: Session Analytics & Anomaly Detection**
```yaml
Current State: Basic session management with timeouts
Target State: Advanced session analytics with behavior-based anomaly detection
Business Value: Proactive security threat detection

Implementation Tasks:
  - [ ] Implement user behavior analytics (login patterns, usage times)
  - [ ] Add geolocation-based anomaly detection
  - [ ] Create device fingerprinting for suspicious activity detection
  - [ ] Implement automated session termination for anomalies
  - [ ] Add security incident response automation
  - [ ] Create security dashboard for administrators

Analytics Capabilities:
  - Login time patterns and geographic analysis
  - Feature usage patterns and deviations
  - Network and device behavior analysis
  - Failed authentication attempt patterns

Success Criteria:
  ✅ 95%+ accuracy in anomaly detection with <5% false positives
  ✅ Mean time to detection (MTTD) <5 minutes for critical threats
  ✅ Automated response for 80%+ of security incidents

Estimated Effort: 55-75 hours
Resources Required: 1 security engineer + 2 developers + 1 data analyst
```

### **Priority 3B: Advanced Security Features** 🛡️ MEDIUM PRIORITY
**Timeline:** Weeks 11-12 | **Risk Score:** 4.5-5.5/10 | **Business Impact:** Enterprise compliance

#### **Gap 3.3: API Rate Limiting & DDoS Protection**
```yaml
Current State: Basic rate limiting, no advanced DDoS protection
Target State: Comprehensive rate limiting with intelligent DDoS mitigation
Business Value: Protection against abuse and service degradation

Implementation Tasks:
  - [ ] Implement tiered rate limiting based on user subscription
  - [ ] Add intelligent rate limiting based on user behavior
  - [ ] Create API quota management for enterprise customers
  - [ ] Implement distributed rate limiting for clustered deployments
  - [ ] Add real-time rate limiting monitoring and alerting
  - [ ] Create rate limiting bypass for critical operations

Rate Limiting Strategy:
  Basic Tier: 100 requests/hour, 10 concurrent
  Professional: 1000 requests/hour, 50 concurrent
  Enterprise: 10000 requests/hour, 200 concurrent
  API Integrations: Custom limits per contract

Success Criteria:
  ✅ Zero service degradation during traffic spikes
  ✅ 99.9% legitimate request success rate
  ✅ Mean response time <100ms for rate limit decisions

Estimated Effort: 35-50 hours
Resources Required: 2 developers + 1 DevOps engineer
```

---

## 🚀 **Phase 4: Operational Excellence & Advanced Features** (Weeks 13-16)
*Enhancement Items - Industry-Leading Capabilities*

### **Priority 4A: Advanced Deployment & Operations** ⚙️ ENHANCEMENT
**Timeline:** Weeks 13-14 | **Business Value:** Operational resilience and rapid deployment

#### **Gap 4.1: Blue-Green Deployment Strategy**
```yaml
Current State: Basic CI/CD deployment, no zero-downtime strategy
Target State: Full blue-green deployment with automated rollback
Business Value: Zero-downtime deployments and rapid rollback capabilities

Implementation Tasks:
  - [ ] Implement blue-green deployment infrastructure (Docker/Kubernetes)
  - [ ] Add automated health checking and traffic switching
  - [ ] Create database migration strategy for zero-downtime upgrades
  - [ ] Implement automated rollback triggers based on key metrics
  - [ ] Add deployment canary releases for gradual rollouts
  - [ ] Create deployment monitoring and alerting

Deployment Pipeline:
  1. Deploy to green environment
  2. Run comprehensive health checks
  3. Gradually shift traffic (10%, 25%, 50%, 100%)
  4. Monitor key metrics and user satisfaction
  5. Auto-rollback on threshold violations

Success Criteria:
  ✅ Zero-downtime deployments for 100% of releases
  ✅ Mean time to rollback (MTTR) <2 minutes
  ✅ 99.99% deployment success rate

Estimated Effort: 60-80 hours
Resources Required: 2 DevOps engineers + 1 developer
```

#### **Gap 4.2: Advanced Observability & Tracing**
```yaml
Current State: Basic logging and monitoring
Target State: Comprehensive observability with distributed tracing
Business Value: Faster issue resolution and proactive problem detection

Implementation Tasks:
  - [ ] Implement distributed tracing (OpenTelemetry/Jaeger)
  - [ ] Add comprehensive metrics collection (Prometheus)
  - [ ] Create custom dashboards for business and technical metrics
  - [ ] Implement log aggregation and analysis (ELK stack)
  - [ ] Add synthetic monitoring for critical user journeys
  - [ ] Create intelligent alerting with noise reduction

Observability Stack:
  - Metrics: Prometheus + Grafana
  - Tracing: OpenTelemetry + Jaeger
  - Logs: Elasticsearch + Logstash + Kibana
  - APM: Application Performance Monitoring
  - Synthetic: Automated user journey monitoring

Success Criteria:
  ✅ Mean time to detection (MTTD) <1 minute for critical issues
  ✅ Mean time to resolution (MTTR) <15 minutes for P1 incidents
  ✅ 99.95% uptime with comprehensive monitoring

Estimated Effort: 70-90 hours
Resources Required: 2 DevOps engineers + 1 SRE + 1 developer
```

### **Priority 4B: Performance & User Experience Enhancement** 📈 ENHANCEMENT
**Timeline:** Weeks 15-16 | **Business Value:** Premium user experience

#### **Gap 4.3: Service Worker & Advanced Offline Capabilities**
```yaml
Current State: Basic offline functionality with local storage
Target State: Advanced service worker with intelligent caching and sync
Business Value: Superior offline experience for mobile and unreliable networks

Implementation Tasks:
  - [ ] Implement service worker with intelligent caching strategies
  - [ ] Add background sync for offline operations
  - [ ] Create progressive loading for large HVAC projects
  - [ ] Implement predictive prefetching based on user behavior
  - [ ] Add offline-first architecture with conflict resolution
  - [ ] Create offline capability indicators and user guidance

Service Worker Features:
  - Cache First: Static assets, UI components
  - Network First: Dynamic data, user content
  - Background Sync: Critical operations, data synchronization
  - Push Notifications: Project updates, system alerts

Success Criteria:
  ✅ 100% offline functionality for core features
  ✅ <3 second load time for cached content
  ✅ Seamless online-offline transitions

Estimated Effort: 45-65 hours
Resources Required: 2 frontend developers + 1 UX designer
```

#### **Gap 4.4: Advanced Performance Optimization**
```yaml
Current State: Good performance for typical usage
Target State: Optimized for enterprise-scale projects with advanced performance features
Business Value: Competitive advantage for large enterprise customers

Implementation Tasks:
  - [ ] Implement virtual scrolling for large component lists
  - [ ] Add progressive rendering for complex 3D scenes
  - [ ] Create performance budgets and monitoring
  - [ ] Implement lazy loading for non-critical features
  - [ ] Add memory pooling for frequently created objects
  - [ ] Create performance profiling tools for users

Performance Targets:
  - Time to Interactive (TTI): <2 seconds
  - First Contentful Paint (FCP): <1 second
  - Largest Contentful Paint (LCP): <2.5 seconds
  - Cumulative Layout Shift (CLS): <0.1

Success Criteria:
  ✅ 95th percentile load time <3 seconds for enterprise projects
  ✅ Smooth 60 FPS performance for 3D interactions
  ✅ Memory usage optimized for 8+ hour professional sessions

Estimated Effort: 55-75 hours
Resources Required: 2 senior developers + 1 performance engineer
```

---

## 📊 **Implementation Tracking & Metrics**

### **Success Metrics by Phase**

#### **Phase 1 - Critical Path (Weeks 1-4)**
```yaml
Performance Metrics:
  - [ ] 5000+ duct segments: <5 second response time
  - [ ] 50+ concurrent users: <10% performance degradation  
  - [ ] 12-hour sessions: zero memory leaks
  - [ ] Cross-platform installer: 100% success rate

Quality Metrics:
  - [ ] Production deployment: zero critical failures
  - [ ] Version upgrades: zero data loss
  - [ ] Platform compatibility: 100% feature parity
```

#### **Phase 2 - Reliability (Weeks 5-8)**
```yaml
Reliability Metrics:
  - [ ] Database corruption detection: <5 minute MTTD
  - [ ] Data recovery success rate: >95%
  - [ ] Network partition handling: zero data loss
  - [ ] API contract coverage: 100%

Quality Metrics:
  - [ ] Integration test coverage: >90%
  - [ ] Cross-browser compatibility: 100%
  - [ ] Accessibility compliance: maintained across platforms
```

#### **Phase 3 - Security (Weeks 9-12)**
```yaml
Security Metrics:
  - [ ] MFA adoption rate: >80% within 30 days
  - [ ] Anomaly detection accuracy: >95% with <5% false positives
  - [ ] Security incident MTTD: <5 minutes
  - [ ] Rate limiting: 99.9% legitimate request success

Compliance Metrics:
  - [ ] Zero security breaches related to authentication
  - [ ] API abuse incidents: <1 per month
  - [ ] Security dashboard operational: 24/7 monitoring
```

#### **Phase 4 - Excellence (Weeks 13-16)**
```yaml
Operational Metrics:
  - [ ] Zero-downtime deployments: 100% success rate
  - [ ] Mean time to rollback (MTTR): <2 minutes
  - [ ] System uptime: 99.99%
  - [ ] Issue detection MTTD: <1 minute

Performance Metrics:
  - [ ] Time to Interactive (TTI): <2 seconds
  - [ ] Offline functionality: 100% for core features
  - [ ] Enterprise project load time: <3 seconds (95th percentile)
  - [ ] 3D interaction performance: 60 FPS sustained
```

### **Resource Allocation Summary**

#### **Team Composition Required**
```yaml
Senior Developers: 4-6 FTE (Full-Time Equivalent)
DevOps Engineers: 2-3 FTE  
QA Engineers: 2-3 FTE
Security Engineer: 1 FTE
UX Designer: 1 FTE (part-time)
Performance Engineer: 1 FTE (part-time)
DBA/Data Specialist: 1 FTE (part-time)

Total Estimated Effort: 800-1200 hours over 16 weeks
Peak Team Size: 8-10 people
```

#### **Budget Estimation (USD)**
```yaml
Phase 1 (Critical): $80,000 - $120,000
Phase 2 (Reliability): $70,000 - $100,000  
Phase 3 (Security): $60,000 - $90,000
Phase 4 (Excellence): $75,000 - $110,000

Total Investment: $285,000 - $420,000
ROI Timeline: 6-12 months through enterprise customer acquisition
```

### **Risk Mitigation Strategy**

#### **High-Impact Risks**
```yaml
Risk: Performance targets not met for enterprise projects
Mitigation: Implement performance testing early, use proven optimization techniques
Contingency: Phased rollout with performance tiers

Risk: Cross-platform compatibility issues
Mitigation: Automated testing matrix, early platform testing
Contingency: Platform-specific builds with feature flags

Risk: Security implementation complexity
Mitigation: Use proven libraries, security expert review
Contingency: Staged security feature rollout

Risk: Resource availability and timeline pressure  
Mitigation: Cross-training, clear milestone definitions
Contingency: Scope reduction with stakeholder approval
```

---

## 📋 **Action Items & Next Steps**

### **Immediate Actions (Week 0)**
- [ ] **Stakeholder Approval:** Present plan to executive team and get budget approval
- [ ] **Team Assembly:** Recruit or assign team members to remediation project  
- [ ] **Environment Setup:** Prepare testing and staging environments for all phases
- [ ] **Baseline Metrics:** Establish current performance and quality baselines
- [ ] **Project Management:** Set up tracking tools and communication protocols

### **Phase 1 Kickoff (Week 1)**
- [ ] **Performance Testing Framework:** Begin implementation of large-scale testing
- [ ] **Memory Profiling Setup:** Implement automated memory leak detection  
- [ ] **Cross-Platform CI:** Expand testing matrix to all target platforms
- [ ] **Installer Testing:** Create automated installer validation framework

### **Ongoing Management**
- [ ] **Weekly Progress Reviews:** Track metrics and adjust timeline as needed
- [ ] **Risk Assessment Updates:** Monitor and mitigate emerging risks
- [ ] **Stakeholder Communication:** Regular updates on progress and challenges
- [ ] **Quality Gates:** Ensure each phase meets success criteria before proceeding

---

## 🏁 **Conclusion & Strategic Value**

This comprehensive remediation plan transforms the SizeWise Suite from a strong architectural foundation (76/100 current score) to an industry-leading HVAC platform (95+/100 target score) ready for enterprise-scale deployment.

**Strategic Benefits:**
- **Market Positioning:** Premium solution with enterprise-grade reliability
- **Customer Confidence:** Proven performance and security at scale  
- **Competitive Advantage:** Advanced features not available in competing solutions
- **Operational Excellence:** Minimal support overhead with proactive monitoring

**Success Timeline:**
- **4 weeks:** Production-ready with critical gaps resolved
- **8 weeks:** Enterprise-grade reliability and quality
- **12 weeks:** Advanced security and compliance features  
- **16 weeks:** Industry-leading operational excellence

The investment in this remediation plan positions SizeWise Suite as the premier HVAC design platform, enabling rapid enterprise customer acquisition and long-term market leadership.

---

**Document Metadata:**
- **Version:** 1.0
- **Plan Date:** August 6, 2025  
- **Implementation Start:** TBD (Stakeholder Approval)
- **Classification:** Strategic Implementation Plan
- **Prepared By:** Senior Technical Architecture Team
- **Next Review:** Weekly during implementation
