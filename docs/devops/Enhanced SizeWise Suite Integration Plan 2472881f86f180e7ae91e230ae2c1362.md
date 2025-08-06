# Enhanced SizeWise Suite Integration Plan

# 🏗️ **Enhanced SizeWise Suite Integration Plan**

## Refactored Snap Logic Architecture Integration

**Version**: 3.0.0 | **Prepared**: 2025‑08‑06 | **Review Date**: 2025‑08‑20

**Audience**: Engineering, QA, Product, Documentation, DevOps

**Scope**: Comprehensive integration of the refactored snap logic architecture into the entire SizeWise Suite, including Air Duct Sizer, HVAC Visualization, Export & Reporting, and Performance Monitoring, with full tier gating, standards compliance, accessibility, offline‑first operation, and documentation synchronization.

### 📖 Purpose

The original integration plan provided a broad outline of phases but lacked the granularity required for foolproof execution. This enhanced plan decomposes tasks to the file and function level, maps dependencies, defines rollback procedures, and specifies documentation and QA requirements. It ensures zero downtime migration, seamless user experience, and 100% feature parity while meeting regulatory and accessibility standards.

## 🪜 Phased Integration Overview

The integration remains staged across four phases (Foundation Setup, Core Service Migration, Advanced Features Integration, Legacy Cleanup & Optimization). The plan below describes how each SizeWise tool (Air Duct Sizer, HVAC Visualization, Reports, Export, Performance Monitor) integrates the refactored architecture across phases.

### 🔍 Phase 1: Foundation Setup (Weeks 1‑2)

### Objectives

- Introduce the refactored architecture alongside legacy system without disruption.
- Establish core services (DI container, configuration, event bus, feature flags, performance monitoring).
- Provide baseline metrics and health checks.
- Prepare documentation triggers and update process.

### Atomic Tasks

1. **Dual system initialization** (`src/app/RootLayout.tsx`): Initialize both legacy (`SnapLogicSystem`) and refactored (`SizeWiseSnapLogicSuite`) systems. Provide context with both and allow feature flag toggling per service. Ensure services are disposed on unmount.
2. **DI container creation** (`src/app/ioc/container.ts`): Register services (`SnapDetectionService`, `DrawingService`, `ConfigurationService`, `PerformanceMonitoringService`, `SMACNAValidator`, etc.). Provide `getContainer()` for consumers.
3. **Configuration management** (`src/config/index.ts`, `src/services/ConfigurationService.ts`): Centralize environment‑specific settings and feature configurations. Add support for tier defaults and SMACNA parameters[[1]](https://btrained.net/hvac-articles/understanding-smacna-standards-for-hvac-duct-fabrication#:~:text=SMACNA%20categorizes%20ducts%20based%20on,The%20main%20classifications%20include).
4. **Event bus setup** (`src/services/EventBus.ts`): Implement publish/subscribe with typed events (snap events, drawing events, sizing updates, export events).
5. **Feature flags** (`src/services/FeatureFlagService.ts`): Integrate provider (e.g., LaunchDarkly) with methods to check and toggle flags. Define flags for each integrated tool.
6. **Performance monitoring baseline** (`src/services/PerformanceMonitoringService.ts`, `src/hooks/usePerformanceMonitoring.ts`): Capture snap detection time, drawing operations per second, memory usage; expose via hooks.
7. **Health endpoints** (`src/api/health.ts`): Add endpoints per service. Provide aggregated health at `/api/health`.
8. **Development and testing scripts** (`package.json`, `jest.config.js`): Add build and test scripts for both legacy and refactored code; integrate coverage thresholds.
9. **Documentation triggers** (`docs/CHANGELOG.md`, `.eslintrc`): Add template for changelog entries; implement linter rule to enforce doc updates.

### Dependency Mapping

- The dual system root layout depends on both the legacy `SnapLogicSystem` and new `SizeWiseSnapLogicSuite`.
- The DI container depends on configuration definitions.
- Feature flag service depends on configuration and environment variables.
- Event bus is independent but required by all services.
- Performance monitoring service depends on other services for metrics.
- Documentation triggers integrate with the CI environment.

### Rollback & Contingencies

- Provide `scripts/rollbackFoundation.ts` to disable refactored services and revert to legacy system via feature flags.
- Maintain a `backupState` snapshot of snap points, drawings, and configuration before activating new services. Use `BackupService` to restore if rollback required.
- Monitor metrics baseline; if performance degrades by >10%, delay migration.
- For health check failures, automatically switch to legacy endpoints and alert DevOps team.

### QA & Documentation

- QA writes test cases for DI container resolution, configuration retrieval, event bus subscriptions, and health endpoints.
- Manual QA verifies that both legacy and refactored systems run concurrently with no visible user difference.
- Document architecture in `docs/architecture.md`, with sequence diagrams showing initialization and service dependencies.
- Add `docs/ownership.md` listing owners for each service.

### 🧩 Phase 2: Core Service Migration (Weeks 3‑4)

### Objectives

- Migrate snap detection and drawing to the refactored architecture.
- Introduce SMACNA validation into sizing logic.
- Ensure gating for Free vs Pro tier.
- Provide detailed test case mapping and rollback scripts.

### Atomic Tasks

1. **Snap detection service migration**: Implement `SnapDetectionService` with spatial indexing; integrate event bus for snap events; replace legacy calls in Air Duct Sizer and HVAC Visualization; add `useSnapDetection()` hook.
2. **Drawing service migration**: Implement `DrawingService` (centerline management, undo/redo using command pattern). Provide `useDrawing()` hook.
3. **SMACNA validation integration**: Implement `SMACNAValidator` and `SMACNAValidator.validateCenterline()`; integrate into Air Duct Sizer. Use classification and material thickness requirements from SMACNA guidelines[[1]](https://btrained.net/hvac-articles/understanding-smacna-standards-for-hvac-duct-fabrication#:~:text=SMACNA%20categorizes%20ducts%20based%20on,The%20main%20classifications%20include).
4. **Update Air Duct Sizer UI**: Add validation result display, tooltips, auto‑update on drawing changes. Provide Pro‑only options for custom materials and batch sizing.
5. **Update Undo/Redo system**: Decouple undo/redo from drawing service; integrate with sizing operations.
6. **Implement Free vs Pro gating**: Use `useAccountTier()` hook to disable/enable advanced features across all tools; include tests for both tiers.
7. **Documentation**: Update `docs/air-duct-sizer.md` with new features, validation rules, and gating behaviour. Add diagrams showing sizing workflow.

### Dependency Mapping

- **SnapDetectionService** depends on event bus and DI container.
- **DrawingService** depends on event bus and command pattern implementation.
- **SMACNAValidator** depends on configuration for thickness/reinforcement values.
- **AirDuctCalculationService** depends on the above services.
- **UndoRedoService** depends on drawing and sizing operations.
- **Air Duct Sizer UI** depends on all services and tier service.
- **Documentation** depends on accurate service definitions.

### Rollback & Contingencies

- Provide `scripts/rollbackCoreMigration.ts` to set `useRefactoredSnapDetection` and `useRefactoredDrawing` flags to false and restore legacy services.
- Keep legacy code in `src/lib/snap-logic/legacy/` until Phase 4.
- Monitor metrics: if snap detection time increases beyond 1 ms or drawing operations exceed 5 ms, pause migration and optimize.
- If validation causes user confusion, temporarily disable SMACNA validation via feature flag for Free tier.

### QA & Documentation

- QA writes test cases for snap detection (unit & integration), drawing service, SMACNA validator, and UI behaviour.
- Performance tests ensure operations meet targets.
- Tier tests verify correct gating.
- Accessibility tests for new UI elements (validation tooltips, panels).
- Update documentation with validation rules, SMACNA references, and gating instructions. Provide user training for new validations.

### 🚀 Phase 3: Advanced Features Integration (Weeks 5‑6)

### Objectives

- Introduce 3D visualization, enhanced export & reporting, and expanded performance monitoring.
- Enforce tier gating (3D and advanced reports are Pro‑only).
- Ensure offline readiness and accessibility.
- Provide risk mitigation and rollback scripts.

### Atomic Tasks

1. **3D Visualization Service**: Implement `HVACVisualizationService` using WebGL; provide `renderHVACSystem()`, `highlightSnapPoint()`, `dispose()`. 3D features gated by `enable3D` flag and Pro tier. Provide fallback 2D component.
2. **Visualization UI**: Build `HVAC3DVisualization.tsx` with canvas, selection, property panel, and metrics overlay. Implement LOD; support keyboard navigation and accessible controls[[2]](https://accessibleweb.com/rating/aa/#:~:text=Double,of%C2%A0users%20with%20a%20reasonable%20budget).
3. **Export & Reporting**: Implement `EnhancedVanPackerExport` service and `EngineeringReportsService`. Allow users to choose formats, include SMACNA/NFPA validation, generate compliance reports. Integrate into Export panel. Provide offline queuing.
4. **Performance Monitoring Expansion**: Extend `PerformanceMonitoringService` to capture FPS, drawing operations, export times, memory usage; implement alerts and offline synchronization[[3]](https://web.dev/learn/pwa/caching#:~:text=What%20to%20cache). Provide `PerformanceDashboard.tsx` with charts and filters.
5. **Configuration Management**: Expand configuration schema to include 3D and export options; provide admin panel to manage feature settings. Enforce tier defaults and validation.
6. **Tier Gating**: Implement gating across visualization, export formats, report details, and performance analytics. Provide upgrade prompts in UI.
7. **Documentation & Training**: Update user guides (`docs/3d-visualization.md`, `docs/export.md`, `docs/performance.md`), create training materials and videos.

### Dependency Mapping

- **HVACVisualizationService** depends on SnapDetectionService and EventBus.
- **EnhancedVanPackerExport** depends on SnapDetectionService, DrawingService, AirDuctCalculationService, HVACVisualizationService, SMACNAValidator, NFPAValidator.
- **EngineeringReportsService** depends on SnapDetectionService, DrawingService, SMACNAValidator, PerformanceMonitoringService.
- **PerformanceMonitoringService** depends on metrics from all other services.
- **ConfigurationService** provides defaults and thresholds.
- **Tier service** determines access.
- **Service Worker** provides offline capabilities.

### Rollback & Contingencies

- Provide `scripts/rollbackAdvancedFeatures.ts` to disable 3D, enhanced export, reports, and extended performance monitoring; revert to 2D and basic export.
- If 3D rendering severely impacts performance (<30 FPS), automatically fallback to 2D.
- If export validation fails unexpectedly, allow user to force export or revert to legacy export.
- Use offline queueing; if offline export fails, notify user and log for manual review.
- For performance alerts, allow users to lower detail (LOD) or reduce dataset size.

### QA & Documentation

- QA develops tests for 3D components, export flows, reporting, performance dashboard, and configuration admin panel.
- Performance tests measure FPS, export durations, memory usage.
- Tier tests confirm gating.
- Offline tests ensure fallback views and export queues work.
- Accessibility tests ensure 3D UI is keyboard accessible and provides text alternatives[[2]](https://accessibleweb.com/rating/aa/#:~:text=Double,of%C2%A0users%20with%20a%20reasonable%20budget).
- Documentation updated for each feature, including user instructions, API references, and compliance notes. Provide cross‑links to canonical documents and standards (SMACNA, NFPA, ASHRAE).
- Conduct training sessions for support and sales teams, demonstrating new features and Pro benefits.

### 🧹 Phase 4: Legacy Cleanup & Optimization (Weeks 7‑8)

### Objectives

- Remove legacy code paths and feature flags.
- Perform system‑wide performance optimizations.
- Migrate existing projects/data to new format.
- Finalize documentation and training.
- Release refactored architecture for all users.

### Atomic Tasks

1. **Legacy removal**: Delete legacy snap logic code (`src/lib/snap-logic/legacy/`); update all imports to use refactored services; remove feature flags from code.
2. **Migration script**: Implement `scripts/migrateToRefactored.ts` to convert legacy snap points and drawings to new format. Provide CLI and unit tests.
3. **Optimization**: Fine‑tune spatial indexing, caching strategies, memory management. Use separate worker threads and multi‑tier caches; follow `web.dev` offline caching guidelines to decide what to cache (HTML, CSS, JS, images, data)[[3]](https://web.dev/learn/pwa/caching#:~:text=What%20to%20cache). Provide user option to clear caches; implement intelligent eviction.
4. **Final end‑to‑end testing**: Run regression and performance suites. Ensure complete workflow works offline and online, and across tiers. Confirm that performance meets targets and compliance checks pass.
5. **Documentation and release notes**: Update all docs and `CHANGELOG.md`. Remove references to legacy system. Provide release notes summarizing improvements and known issues.
6. **Training and support**: Conduct final training sessions for internal stakeholders. Provide updated support scripts and FAQs. Schedule webinar for customers explaining new features and Pro benefits.

### Dependency Mapping

- Migration script depends on storage APIs (IndexedDB or backend) and data models.
- Optimizations depend on performance monitoring data.
- Final tests depend on all services and UIs integrated.
- Documentation depends on final code and features.
- Training materials depend on final UI.

### Rollback & Contingencies

- Maintain backups of user data before migration. Provide `scripts/restoreLegacy.ts` to restore backups.
- If severe issues are discovered, revert to the last stable release using CI/CD rollback mechanisms.
- Provide customer communication plan in case of downtime or major issues.

### QA & Documentation

- QA executes comprehensive regression and performance tests; verifies offline support; ensures compliance with standards and accessibility.
- Final documentation review ensures all docs are consistent and cross‑referenced.
- Technical writers remove legacy references and clarify new workflows.
- Training materials reviewed by stakeholders.

## 📊 KPIs & Success Metrics

To track progress, define the following metrics and targets (baseline from legacy system vs target with refactored architecture):

| Metric | Baseline (Legacy) | Target (Refactored) | Measurement & Status |
| --- | --- | --- | --- |
| **Snap Detection Time** | 8.2 ms | < 7.5 ms | Use `PerformanceMonitoringService.getSnapDetectionMetrics()`; measure in CI. |
| **Drawing Operation Time** | 5 ms | < 4 ms | Capture via `DrawingService.getStatistics()`. |
| **Memory Usage** | 42 MB | < 38 MB | Monitor with browser performance tools and `PerformanceMonitoringService`. |
| **3D Rendering FPS** | N/A (not available) | ≥60 FPS with 5000 objects | Use headless WebGL tests; verify using `PerformanceMonitoringService`. |
| **Export Duration** | 45 s | < 20 s | Time exports in integration tests. |
| **SMACNA Compliance** | Manual validation | Automated with reports | Validate using `EngineeringReportsService`. |
| **Accessibility Violations** | Unknown | 0 Critical issues | Use axe‑core; manual review. |
| **Offline Availability** | None | Basic PWA offline experience | Simulate offline; app loads from cache; queued operations sync on reconnection[[3]](https://web.dev/learn/pwa/caching#:~:text=What%20to%20cache). |
| **User Satisfaction** | TBD | ≥95% satisfaction | Survey after release; track support tickets. |
| **Development Velocity** | Baseline | +20% | Measure story completion rate after migration. |

Status columns should be updated weekly in the project dashboard. Metrics that fail to meet targets trigger an investigation and remediation.

## 🛠️ Tools & Scripts

The following scripts and utilities support the integration:

- `scripts/generate-dependency-graph.ts`: Auto‑generates the dependency graph.
- `scripts/generate-report.ts`: Nightly report generation.
- `scripts/rollback*.ts`: Rollback scripts for each phase.
- `scripts/migrateToRefactored.ts`: Migration script for legacy data.
- `scripts/check-changelog.js`: Linter to ensure documentation updated.
- `public/service-worker.js`: Service worker for offline caching and synchronization.
- `docs/CHANGELOG.md`: Document all changes.
- `docs/ownership.md`: Map owners to docs and services.
- `test-mapping.csv`: Map tasks to test cases.

## 🔚 Conclusion

This enhanced integration plan provides an exhaustive roadmap for adopting the refactored snap logic architecture across the entire SizeWise Suite. By decomposing tasks to the atomic level, mapping dependencies, enforcing tier gating, defining rollback strategies, and integrating QA and documentation processes, the plan ensures a smooth, risk‑free transition. Adherence to this plan will deliver a robust, compliant, accessible, and offline‑capable platform for both Free and Pro users while enabling faster future innovation.

---

[[1]](https://btrained.net/hvac-articles/understanding-smacna-standards-for-hvac-duct-fabrication#:~:text=SMACNA%20categorizes%20ducts%20based%20on,The%20main%20classifications%20include) Understanding SMACNA Standards for HVAC Duct Fabrication - BTrained HVAC Training

[https://btrained.net/hvac-articles/understanding-smacna-standards-for-hvac-duct-fabrication](https://btrained.net/hvac-articles/understanding-smacna-standards-for-hvac-duct-fabrication)

[[2]](https://accessibleweb.com/rating/aa/#:~:text=Double,of%C2%A0users%20with%20a%20reasonable%20budget) WCAG 2.1 AA Standards | Accessible Web

[https://accessibleweb.com/rating/aa/](https://accessibleweb.com/rating/aa/)

[[3]](https://web.dev/learn/pwa/caching#:~:text=What%20to%20cache) Caching  |  web.dev

[https://web.dev/learn/pwa/caching](https://web.dev/learn/pwa/caching)