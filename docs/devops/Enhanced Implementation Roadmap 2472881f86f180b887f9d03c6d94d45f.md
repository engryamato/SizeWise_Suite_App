# Enhanced Implementation Roadmap

# 🗺️ **Enhanced Implementation Roadmap**

## SizeWise Suite – Refactored Snap Logic Adoption

**Version**: 3.0.0 | **Prepared**: 2025‑08‑06 | **Review Date**: 2025‑08‑20

**Audience**: Engineering, QA, Product, Documentation

**Scope**: All tasks required to fully adopt the refactored snap logic architecture across the SizeWise Suite with no regression, including tier gating, standards compliance (SMACNA/NFPA/ASHRAE), WCAG 2.1 AA accessibility, offline‑first PWA considerations, and documentation synchronization.

### 📖 Purpose

The original roadmap outlined high‑level milestones but left gaps in atomic task definition, dependency mapping, risk mitigation, and documentation processes. This enhanced roadmap provides a comprehensive, step‑by‑step blueprint so that any qualified developer can implement the changes without ambiguity.

## 📅 Phased Implementation Timeline

The migration follows the same four phases as the original roadmap, with tasks decomposed down to file‑level changes, explicit dependencies, tier gating and compliance checkpoints. Each deliverable includes acceptance criteria and documentation triggers. **All times refer to the Asia/Manila time zone.**

> Note on Tier Enforcement: Unless explicitly marked as Pro‑only, all tasks apply to both Free and Pro tiers. When adding or modifying UI components, include logic to disable or hide Pro‑only features for Free users. Use the useAccountTier() hook (in src/hooks/useAccountTier.ts) for runtime gating. Include test cases for both tiers.
> 

### 🔍 Phase 1 – Foundation Setup (Weeks 1‑2)

### 🧱 Week 1: Core Infrastructure

| Day | Atomic Task | Files/Modules | Dependencies | Deliverables & QA |
| --- | --- | --- | --- | --- |
| 1 | **Integrate dependency injection (DI) container** into the main application. Create `src/app/ioc/container.ts` that registers all services (`SnapDetectionService`, `DrawingService`, `ConfigurationService`, `EventBus`, `PerformanceMonitoringService`). Export a `getContainer()` function returning a singleton container. | `src/app/ioc/container.ts` | Depends on installation of `inversify` or similar DI library. | *Deliverable*: container file exists, tests ensure that services resolve correctly. *QA*: integration test `__tests__/unit/iocContainer.test.ts` verifies that each service can be resolved from the container. *Docs*: update `docs/architecture.md` to describe the DI container and add API references. |
| 1‑2 | **Configure centralized configuration service**. Create `src/config/index.ts` exporting environment‑specific configuration objects (development, production, testing). Implement `ConfigurationService` in `src/services/ConfigurationService.ts` that reads from `config/index.ts` and exposes `get(key)` and `set(key)` methods. Provide type definitions in `src/types/config.ts`. | `src/config/index.ts`, `src/services/ConfigurationService.ts`, `src/types/config.ts` | None | *Deliverable*: Config service resolves environment‑specific settings; unit tests verify default values and overrides. *Docs*: update `docs/configuration.md` with schema and examples. |
| 2‑3 | **Initialize event bus for inter‑service communication**. Create `src/services/EventBus.ts` implementing publish/subscribe semantics with types for snap events and drawing events. Register it in the DI container. | `src/services/EventBus.ts` | DI container must be ready. | *Deliverable*: event bus supports subscribe/unsubscribe and publishes events to multiple listeners; integration tests `__tests__/unit/eventBus.test.ts` cover edge cases. |
| 3 | **Enable feature flag system**. Integrate `launchdarkly` or internal feature flag provider in `src/services/FeatureFlagService.ts`. The service exposes `isEnabled(flagKey)` and `setFlag(flagKey, value)` (used for rollback). Register in DI container. | `src/services/FeatureFlagService.ts` | Configuration service and DI container | *Deliverable*: feature flags accessible via hooks; unit tests verify toggling flags; docs update `docs/feature-flags.md`. Ensure flags exist for `useRefactoredSnapDetection`, `useRefactoredDrawing`, and `useRefactoredPerformanceMonitoring`. |
| 4‑5 | **Update development scripts and build processes**. Modify `package.json` scripts to include `lint`, `test`, and `build:refactored` commands that compile both legacy and refactored code. Update `webpack`/`vite` configuration in `build/` to support code splitting and tree shaking for the new modules. | `package.json`, `build/webpack.config.js` or `vite.config.ts` | N/A | *Deliverable*: `npm run build:refactored` produces a bundle including the new architecture. *QA*: run `npm run build:refactored` in CI and ensure no errors. *Docs*: update `CONTRIBUTING.md` with new build instructions. |
| 4‑5 | **Configure testing infrastructure**. Update `jest.config.js` to include snapshot serializers for React components, configure `ts-jest` for TypeScript, and add global mocks for the DI container. Introduce `__mocks__/` directory for services. | `jest.config.js`, `__mocks__/` | Build process updated | *Deliverable*: tests run successfully using the new configuration; coverage thresholds remain at 90% or above. |
| 5 | **Set up performance monitoring baseline**. Implement `PerformanceMonitoringService` in `src/services/PerformanceMonitoringService.ts` that records metrics (e.g., snap detection time, drawing operation count, memory usage). Register service in DI container. Add `usePerformanceMonitoring()` hook. | `src/services/PerformanceMonitoringService.ts`, `src/hooks/usePerformanceMonitoring.ts` | Event bus must exist | *Deliverable*: baseline metrics accessible via hook; unit tests verify metrics update; docs update `docs/performance.md`. *Note*: use accurate timing functions and memory APIs. |

### 🛡 Risk Mitigation (Phase 1)

- **Parallel legacy system**: Keep the legacy snap logic in `src/lib/snap-logic/legacy/` untouched. Add feature flags to toggle between legacy and refactored services. Unit tests should cover both paths.
- **Rollback procedure**: Provide `rollbackPhase1.ts` script in `scripts/` that sets all feature flags to `false` and restarts services. The script should also reset DI registration to use legacy services.
- **Compliance checkpoint**: Validate that the configuration service includes SMACNA defaults (e.g., default duct material, pressure loss limits). QA verifies presence of SMACNA parameters described in the SMACNA standards such as pressure classes and material thickness[[1]](https://btrained.net/hvac-articles/understanding-smacna-standards-for-hvac-duct-fabrication#:~:text=SMACNA%20categorizes%20ducts%20based%20on,The%20main%20classifications%20include).
- **Accessibility checkpoint**: Perform an initial audit using automated tools (axe‑core) to ensure new UI components meet WCAG 2.1 AA guidelines for contrast, focus, and resize‑text support[[2]](https://accessibleweb.com/rating/aa/#:~:text=Double,of%C2%A0users%20with%20a%20reasonable%20budget). Fix any violations immediately.

### 📚 Week 2: Service Integration Foundation

| Day | Atomic Task | Files/Modules | Dependencies | Deliverables & QA |
| --- | --- | --- | --- | --- |
| 1‑2 | **Register services in SnapLogicProvider**. Update `src/app/providers/SnapLogicProvider.tsx` to use the DI container: import `getContainer()` and retrieve services via container rather than instantiating them inline. Remove direct calls to `new SizeWiseSnapLogicSuite()`; instead resolve `SnapLogicSuite` from container. Use `useEffect` to initialize and dispose services on mount/unmount. | `src/app/providers/SnapLogicProvider.tsx` | DI container created | *Deliverable*: provider registers all services; TypeScript types compile; integration test `__tests__/integration/SnapLogicProvider.integration.test.tsx` renders provider and verifies context contains services. |
| 1‑2 | **Document initialization flow**. Add a sequence diagram to `docs/architecture.md` showing how the provider resolves and initializes services. Include callouts for event bus, performance monitoring, and configuration service. | `docs/architecture.md` | Provider implementation | *Deliverable*: updated diagram and narrative. |
| 3‑4 | **Implement health check endpoints**. In the backend API (`src/api/health.ts`), add endpoints `/api/health/snap`, `/api/health/drawing`, and `/api/health/performance` that call respective service health methods. Each endpoint returns `{status:'healthy'|'degraded', metrics:{...}}`. Write integration tests in `__tests__/api/health.integration.test.ts` that mock degraded states. | `src/api/health.ts`, `__tests__/api/health.integration.test.ts` | Event bus and monitoring service | *Deliverable*: endpoints return HTTP 200 when healthy; degrade gracefully; docs update `docs/api-reference.md` with endpoint definitions. |
| 3‑4 | **Set up monitoring dashboard**. Implement `src/components/ImplementationDashboard.tsx` that consumes the `PerformanceMonitoringService` and displays progress for each phase. Use cards for progress and metrics. Include real‑time updates using `useInterval` hook. | `src/components/ImplementationDashboard.tsx` | PerformanceMonitoringService, EventBus | *Deliverable*: dashboard displays baseline metrics; accessibility validated via screen reader and contrast checks; unit test ensures metrics update. |
| 5 | **Configure alerting system**. Integrate an alerting library (e.g., Sentry) in `src/services/AlertingService.ts` that subscribes to performance alerts from `PerformanceMonitoringService`. Expose methods `sendPerformanceAlert(type, data)` and `sendHealthAlert(type, data)`. Register in container. | `src/services/AlertingService.ts` | Monitoring service | *Deliverable*: alerts triggered on high memory usage or degraded health; e2e test `__tests__/e2e/alerting.e2e.test.ts` ensures alerts fire; docs update `docs/alerting.md`. |
| 5 | **Establish documentation triggers**. Add a `docs/CHANGELOG.md` entry template requiring updates after each phase completion. Implement a lint rule using a custom ESLint plugin (`.eslintrc`) that warns if code touches `src/` without updating `CHANGELOG.md`. Document this process in `CONTRIBUTING.md`. | `.eslintrc`, `scripts/check-changelog.js`, `CONTRIBUTING.md` | All previous tasks | *Deliverable*: linter fails if changelog missing; docs updated; test ensures script runs in CI. |

### 🛡 Risk Mitigation (Phase 2)

- **Integration complexity**: Use `DependencyGraph.md` (created at project root) to map each service to its dependencies (e.g., `AirDuctCalculationService` depends on `SnapDetectionService`, `DrawingService` and `ConfigurationService`). This graph is updated whenever a new service is introduced.
- **Rollback**: Provide `scripts/rollbackPhase2.ts` to disable refactored integration flags and restore legacy services. Include steps to restore backups created in Phase 1.
- **Performance regression**: Run performance regression tests weekly. Fail the phase if `snapDetectionTime` increases by more than 2 ms relative to baseline. Use the monitoring dashboard to track metrics in real time.
- **Standards compliance**: Ensure that SMACNA defaults (pressure class, material thickness, reinforcement) and ASHRAE load calculations are included in the configuration schema; add validation rules in the `ConfigurationService` to prevent unsupported values[[1]](https://btrained.net/hvac-articles/understanding-smacna-standards-for-hvac-duct-fabrication#:~:text=SMACNA%20categorizes%20ducts%20based%20on,The%20main%20classifications%20include).
- **Accessibility**: Confirm that newly added dashboards and health status indicators meet double‑A requirements: strong color contrast (minimum 4.5:1), focus indicators, and text that resizes without breaking layout[[2]](https://accessibleweb.com/rating/aa/#:~:text=Double,of%C2%A0users%20with%20a%20reasonable%20budget).

### 🔁 Phase 2 – Core Service Migration (Weeks 3‑4)

This phase migrates snap detection and drawing services to the refactored architecture and enhances air duct sizing calculations. Each task includes explicit file‑level changes, dependencies, and test mappings.

### 🔨 Week 3: Snap Detection and Drawing Migration

| Day | Atomic Task | Files/Modules | Dependencies | Deliverables & QA |
| --- | --- | --- | --- | --- |
| 1 | **Implement new** `SnapDetectionService`. Create `src/services/SnapDetectionService.ts` implementing `ISnapDetectionService`. Use spatial indexing structures (e.g., R‑tree) for faster lookup. Methods include `findClosestSnapPoint(point)`, `findSnapPointsInArea(query)`, `addSnapPoint(snapPoint)`, and `getStatistics()`. Ensure the service publishes `snap_detected` events via the event bus when a snap occurs. | `src/services/SnapDetectionService.ts`, `src/types/snap.ts` | Event bus, DI container | *Deliverable*: service returns snap results within the performance target (<7.5 ms). *QA*: unit tests in `__tests__/services/SnapDetectionService.test.ts` cover typical and edge cases; integration test ensures events fire. |
| 1 | **Add** `useSnapDetection` **hook**. In `src/hooks/useSnapDetection.ts`, resolve `SnapDetectionService` from the DI container and expose memoized methods. Provide fallback to legacy service when `featureFlags.useRefactoredSnapDetection` is false. | `src/hooks/useSnapDetection.ts` | SnapDetectionService, FeatureFlagService | *Deliverable*: hook returns correct service; test toggling flags; integration test ensures drawing components react to service. |
| 2 | **Migrate drawing service**. Create `src/services/DrawingService.ts` implementing `IDrawingService` with methods `getAllCenterlines()`, `addCenterline()`, `undo()`, `redo()`, `getStatistics()`. Replace references to the legacy drawing manager in components (`AirDuctSizingPanel`, `HVACVisualization`, etc.) with `DrawingService`. Provide `useDrawing()` hook in `src/hooks/useDrawing.ts`. | `src/services/DrawingService.ts`, `src/hooks/useDrawing.ts` | Event bus, DI container | *Deliverable*: drawing operations maintain sub‑5 ms response time; integration test `__tests__/integration/DrawingService.integration.test.ts` ensures UI updates; manual QA for user experience. |
| 2‑3 | **Update undo/redo system**. Implement command pattern in `src/services/UndoRedoService.ts` to decouple from drawing service. Expose `execute(command)`, `undo()`, `redo()` methods. Register this service in DI container. Modify `DrawingService` to accept commands. | `src/services/UndoRedoService.ts` | DrawingService | *Deliverable*: undo/redo works across services; unit tests cover complex scenarios. |
| 3‑4 | **Integrate snap validation into air duct sizing calculations**. In `src/services/AirDuctCalculationService.ts`, update `calculateDuctSizing()` to call `SnapDetectionService.validatePathWithSnaps()` and ensure each duct path is properly snapped before calculation. Add SMACNA validation using `SMACNAValidator` (to be implemented). | `src/services/AirDuctCalculationService.ts`, `src/services/SMACNAValidator.ts` | SnapDetectionService, DrawingService | *Deliverable*: duct sizing results include validation status; integration test `__tests__/integration/AirDuctSizing.integration.test.ts` ensures calculations fail gracefully when path invalid. *Compliance*: verify duct classifications and gauge thickness comply with SMACNA pressure classes[[1]](https://btrained.net/hvac-articles/understanding-smacna-standards-for-hvac-duct-fabrication#:~:text=SMACNA%20categorizes%20ducts%20based%20on,The%20main%20classifications%20include). |
| 4 | **Add test cases for tier gating**. For each migrated service and UI component, create tests that simulate Free and Pro users using `useAccountTier()` hook. Verify that Pro‑only features (e.g., 3D HVAC visualization, advanced reports) remain disabled for Free users. | `__tests__/tier/AirDuctSizing.tier.test.tsx`, `__tests__/tier/SnapDetection.tier.test.tsx` | FeatureFlagService, Account tier service | *Deliverable*: tests pass; gating enforced correctly. |
| 5 | **Document updated API and services**. Update `docs/api-reference.md` with new methods in `SnapDetectionService`, `DrawingService`, `UndoRedoService`, and `AirDuctCalculationService`. Include diagrams showing data flow from UI to services. Document default SMACNA parameters and references to official guidelines for pressure classes, material thickness, reinforcement and sealing requirements[[1]](https://btrained.net/hvac-articles/understanding-smacna-standards-for-hvac-duct-fabrication#:~:text=SMACNA%20categorizes%20ducts%20based%20on,The%20main%20classifications%20include). | `docs/api-reference.md` | All above tasks | *Deliverable*: docs updated; cross‑checked during peer review; linter ensures references exist. |

### 🛡 Risk Mitigation (Week 3)

- **Performance regression**: Use the monitoring dashboard to watch average snap detection time. If the average exceeds baseline by >1 ms for two consecutive days, freeze further migrations and optimize algorithms.
- **Integration complexity**: Keep the legacy drawing manager available behind feature flags. A fallback function `getLegacySnapManager()` should remain accessible for e2e tests.
- **Compliance**: Provide code comments in `AirDuctCalculationService` referencing SMACNA pressure class tables; the validator should log classification information for audit.
- **Accessibility**: Ensure all interactive controls (undo/redo buttons, sizing results list) have proper `aria-label` attributes and are keyboard navigable. Provide high‑contrast focus states for interactive elements[[2]](https://accessibleweb.com/rating/aa/#:~:text=Double,of%C2%A0users%20with%20a%20reasonable%20budget).

### 📐 Week 4: Air Duct Sizing and UI Updates

| Day | Atomic Task | Files/Modules | Dependencies | Deliverables & QA |
| --- | --- | --- | --- | --- |
| 1 | **Implement** `SMACNAValidator`. Create `src/services/SMACNAValidator.ts` that loads duct classification tables (low, medium, high pressure) and material specifications. Provide `validateCenterline(centerline)` that returns errors/warnings when gauge thickness or reinforcement spacing does not meet SMACNA criteria[[1]](https://btrained.net/hvac-articles/understanding-smacna-standards-for-hvac-duct-fabrication#:~:text=SMACNA%20categorizes%20ducts%20based%20on,The%20main%20classifications%20include). Use configuration defaults when unspecified. | `src/services/SMACNAValidator.ts`, `src/data/smacna.json` | ConfigurationService | *Deliverable*: validator loaded with SMACNA tables; unit tests ensure detection of non‑compliant ducts; docs include description of each classification. |
| 1‑2 | **Update air duct sizing UI components**. Modify `src/components/AirDuctSizingPanel.tsx` to display validation results (errors, warnings) next to each sizing result. Include tooltips linking to SMACNA documentation. Add feature flag gating if advanced sizing options (e.g., custom materials) are Pro‑only. | `src/components/AirDuctSizingPanel.tsx` | AirDuctCalculationService, SMACNAValidator | *Deliverable*: UI displays validation and suggestions; accessible to screen readers; integration tests in `__tests__/integration/AirDuctSizingPanel.integration.test.tsx` verify UI behaviour for valid/invalid ducts. |
| 2‑3 | **Integrate real‑time calculation updates**. Use the event bus to publish `centerline_updated` events when users edit drawings. In `AirDuctSizingPanel`, subscribe to updates and recalculate sizing automatically. Debounce updates to avoid performance spikes. | `src/components/AirDuctSizingPanel.tsx`, `src/services/EventBus.ts` | DrawingService | *Deliverable*: sizing results update within 200 ms of changes; performance tests show no lag. |
| 3 | **Enhance validation feedback**. Implement `src/components/ValidationTooltip.tsx` showing suggestions to the user. Provide actionable fixes (e.g., “increase duct thickness to 18 gauge”). Ensure tooltips follow WCAG guidelines for tooltip behaviour (visible on focus/hover, keyboard accessible). | `src/components/ValidationTooltip.tsx` | SMACNAValidator | *Deliverable*: tooltips accessible and explanatory. |
| 4 | **Update undo/redo system for sizing operations**. Extend `UndoRedoService` to record sizing calculations as commands; implement `executeSizingCalculation()` that allows users to undo a sizing operation. | `src/services/UndoRedoService.ts` | AirDuctCalculationService | *Deliverable*: users can undo sizing; tests cover scenario. |
| 4‑5 | **Document UI and sizing enhancements**. Update `docs/user-guide.md` with instructions for using the new sizing panel, interpreting validation warnings, and adjusting SMACNA parameters. Add screen captures of the panel. Trigger documentation update tasks via `docs/update-log.md`. | `docs/user-guide.md`, `docs/update-log.md` | UI tasks | *Deliverable*: user guide updated; included in release notes. |

### 🛡 Risk Mitigation (Week 4)

- **User confusion due to new validations**: Provide clear in‑app tooltips and documentation. Offer a fallback mode (via feature flag) to disable SMACNA validation for Free tier during initial release.
- **Performance overhead**: Ensure that SMACNA validation uses memoization caches; run microbenchmarks to guarantee <5% overhead. Use the performance monitoring service to detect anomalies.
- **Accessibility**: Validate that tooltips and panels support keyboard navigation and screen reader announcements. Provide error suggestion messages as required by WCAG 2.1 AA guidelines[[2]](https://accessibleweb.com/rating/aa/#:~:text=Double,of%C2%A0users%20with%20a%20reasonable%20budget).

### 🔁 Phase 3 – Advanced Features Integration (Weeks 5‑6)

This phase introduces 3D visualization, export/reporting services, and performance monitoring enhancements. For each feature we define integration points, tier gating, compliance checks, documentation triggers, and test mappings.

### 🌐 Week 5: 3D HVAC Visualization

| Day | Atomic Task | Files/Modules | Dependencies | Deliverables & QA |
| --- | --- | --- | --- | --- |
| 1 | **Implement** `HVACVisualizationService`. Create `src/services/HVACVisualizationService.ts` encapsulating 3D rendering logic using a WebGL library (e.g., Three.js). Methods include `renderHVACSystem(components)`, `highlightSnapPoint(point)`, `dispose()`. Subscribe to snap events (`snap_detected`) via the event bus to highlight points. | `src/services/HVACVisualizationService.ts` | SnapDetectionService, EventBus | *Deliverable*: service renders simple shapes; integration tests using Jest with headless canvas; measure frames per second. |
| 1 | **Create** `useVisualizationService` **hook**. Implement `src/hooks/useVisualizationService.ts` to resolve the visualization service from DI container and memoize it. | `src/hooks/useVisualizationService.ts` | HVACVisualizationService, FeatureFlagService | *Deliverable*: hook provides service; test gating logic enabling/disabling 3D for Free users. |
| 2‑3 | **Develop** `HVAC3DVisualization` **component**. In `src/components/HVAC3DVisualization.tsx`, render `<canvas>` and initialize the visualization service. Add event handlers for selecting components; call `highlightSnapPoint()` when snap events are received. Provide fallback 2D visualization for Free tier. | `src/components/HVAC3DVisualization.tsx` | HVACVisualizationService, SnapDetectionService | *Deliverable*: component displays 3D model at 60 FPS for up to 5 000 objects; tests `__tests__/integration/HVAC3DVisualization.integration.test.tsx` validate gating and rendering. |
| 2‑3 | **Optimize Level of Detail (LOD)**. Implement LOD strategies in `HVACVisualizationService` (e.g., switch to simplified meshes when camera zooms out). Provide configuration values in `config/featureConfig.ts` (e.g., `maxRenderObjects`, `enableLOD`). | `src/services/HVACVisualizationService.ts`, `config/featureConfig.ts` | Config service | *Deliverable*: performance remains stable; performance tests show constant FPS when scaling objects. |
| 4 | **Add real‑time performance metrics overlay**. Extend `PerformanceMonitoringService` to collect rendering metrics (FPS, memory usage). Display metrics overlay within the 3D visualization component. | `src/services/PerformanceMonitoringService.ts`, `src/components/HVAC3DVisualization.tsx` | Monitoring service | *Deliverable*: overlay toggled via keyboard shortcut; accessible; tests ensure overlay updates. |
| 5 | **Document 3D feature and tier gating**. Update `docs/3d-visualization.md` describing how to enable 3D, hardware requirements, and Pro gating. Provide note that Free tier uses 2D; mention upcoming enhancements. | `docs/3d-visualization.md` | All tasks above | *Deliverable*: documentation updated; flagged for translation. |

### 🛡 Risk Mitigation (Week 5)

- **Rendering performance**: Use WebGL instancing and LOD; restrict number of objects per scene for Free vs Pro; degrade gracefully when GPU performance is low.
- **Browser compatibility**: Test across supported browsers; provide fallback to 2D when WebGL unavailable.
- **Accessibility**: Provide keyboard shortcuts for navigation; ensure color contrast and focus states meet WCAG 2.1 AA; for 3D, add text descriptions for screen readers describing selected components.
- **Offline readiness**: Cache 3D model assets using service worker; ensure a placeholder view is available offline with a message guiding the user[[3]](https://web.dev/learn/pwa/caching#:~:text=What%20to%20cache).

### 📤 Week 6: Export & Reporting Integration

| Day | Atomic Task | Files/Modules | Dependencies | Deliverables & QA |
| --- | --- | --- | --- | --- |
| 1 | **Create** `EnhancedVanPackerExport` **service**. Implement `src/services/EnhancedVanPackerExport.ts` encapsulating export logic. Gather project data from `DrawingService`, `SnapDetectionService`, `AirDuctCalculationService`, and `HVACVisualizationService`. Add validation step using `SMACNAValidator` and `SMCAVerifier` (for NFPA/ASHRAE if applicable). Include metadata (snap points, sizing calculations, materials, pressure classes) in export payload. | `src/services/EnhancedVanPackerExport.ts` | SnapDetectionService, DrawingService, AirDuctCalculationService, SMACNAValidator | *Deliverable*: export time <20 s; tests in `__tests__/integration/VanPackerExport.integration.test.ts` verify payload structure; gating ensures Pro tier only. |
| 1 | **Implement** `EngineeringReportsService`. Create `src/services/EngineeringReportsService.ts` to generate SMACNA compliance reports. Validate each centerline using `SMACNAValidator` and produce PDF/CSV with validation results and recommendations. Include snap point analysis (total points, active points, coverage percentages). Support both Free and Pro; Pro includes detailed breakdown. | `src/services/EngineeringReportsService.ts` | SnapDetectionService, DrawingService, SMACNAValidator | *Deliverable*: reports generated; PDF service integrated; tests verify content; gating ensures features properly limited in Free tier. |
| 2 | **Update export UI**. Modify `src/components/ExportPanel.tsx` to include new options: `Validate before export` (toggle), `Include SMACNA report`, `Select export format` (e.g., vanpacker v2, DWG, PDF). Add gating: advanced formats and batch export available only in Pro. Display validation warnings before export. | `src/components/ExportPanel.tsx` | EnhancedVanPackerExport, EngineeringReportsService | *Deliverable*: UI accessible, test gating; integration tests verify export triggers the service. |
| 3 | **Integrate validation into export**. In `EnhancedVanPackerExport`, ensure that `validateBeforeExport` flag triggers SMACNA validation; if errors found, show modal summarizing issues and allow user to continue or cancel. Provide `Retry` functionality that opens the validation panel. | `src/services/EnhancedVanPackerExport.ts`, `src/components/ExportValidationModal.tsx` | EngineeringReportsService | *Deliverable*: user sees validation summary; tests ensure warnings appear; abide by error suggestion guidelines (provide suggestions and allow corrections). |
| 4‑5 | **Implement automated report generation**. Provide CLI script `scripts/generateReport.ts` that runs nightly to generate reports for all projects flagged for compliance audits. The script uses the `EngineeringReportsService` and stores PDFs in `/reports/` with timestamps. | `scripts/generateReport.ts` | Node environment, EngineeringReportsService | *Deliverable*: nightly job scheduled in CI; test ensures reports generated; docs update `docs/reports.md`. |
| 5 | **Document export and reports**. Update `docs/export.md` and `docs/reports.md` describing export options, file formats, SMACNA/NFPA/ASHRAE compliance steps, and tier gating. Provide references to SMACNA guidelines for duct construction and reinforcement spacing[[1]](https://btrained.net/hvac-articles/understanding-smacna-standards-for-hvac-duct-fabrication#:~:text=SMACNA%20categorizes%20ducts%20based%20on,The%20main%20classifications%20include). | `docs/export.md`, `docs/reports.md` | All tasks | *Deliverable*: docs complete; translation tasks scheduled. |

### 🛡 Risk Mitigation (Week 6)

- **Export failure**: Provide fallback mechanism to generate legacy export when enhanced export fails. The `EnhancedVanPackerExport` service should catch exceptions and call `legacyVanPackerExporter` when needed.
- **Compliance**: Validate that exported files include necessary metadata; cross‑check against SMACNA requirements for material thickness and reinforcement.
- **Performance**: Keep export time under 20 seconds by streaming large data sets and compressing attachments. Use the performance monitoring service to track export durations.
- **Offline support**: When offline, disable export buttons and display message instructing users to reconnect. Use service worker to queue export requests and automatically send them once back online[[3]](https://web.dev/learn/pwa/caching#:~:text=What%20to%20cache).

### 🔁 Phase 4 – Optimization & Legacy Cleanup (Weeks 7‑8)

### 🔧 Week 7: System‑wide Optimization

| Day | Atomic Task | Files/Modules | Dependencies | Deliverables & QA |
| --- | --- | --- | --- | --- |
| 1 | **Optimize spatial indexing**. Enhance `SnapDetectionService` by implementing lazy updates to the R‑tree index. Use a separate worker thread to rebuild indexes. Add tests measuring memory usage before and after optimization. | `src/services/SnapDetectionService.ts` | SnapDetectionService implemented | *Deliverable*: memory usage reduced by 10%; snap lookup time unaffected. |
| 1 | **Optimize memory usage**. Use `WeakMap`/`WeakRef` in caching modules to avoid memory leaks. Add periodic cleanup tasks in `PerformanceMonitoringService` to free unused snap points and drawing objects. | `src/services/SnapDetectionService.ts`, `src/services/DrawingService.ts`, `src/services/PerformanceMonitoringService.ts` | Monitoring service | *Deliverable*: memory metrics < 38 MB; tests in `__tests__/performance/MemoryUsage.test.ts` verify improvement. |
| 2 | **Optimize caching strategies**. Implement a multi‑tier cache (in‑memory + local storage) for frequently accessed data (snap points, centerlines). Use `CacheStorage` via service worker to persist assets offline. Ensure cache eviction rules respect browser quota. Provide configuration options in `config/offlineCache.ts` for max sizes. | `src/services/CacheService.ts`, `config/offlineCache.ts`, `public/service-worker.js` | Service worker, offline configuration | *Deliverable*: offline experience improved; ensure caches include UI assets (HTML, CSS, images, JS, data) but avoid unnecessary files as recommended[[4]](https://web.dev/learn/pwa/caching#:~:text=What%20to%20cache). *QA*: offline tests ensure app loads and functions without network; use `web.dev` guidelines to decide what to cache and avoid caching dynamic data unnecessarily[[5]](https://web.dev/learn/pwa/caching#:~:text=experience%20without%20consuming%20too%20much,data). |
| 2‑3 | **Implement intelligent cache eviction**. Add logic to remove least‑recently used items when cache size exceeds limit. Use `CacheStorage.keys()` to list caches and `delete()` to remove. Provide user setting for clearing cache. | `src/services/CacheService.ts` | Cache service | *Deliverable*: cache never exceeds configured limit; tests verify eviction. |
| 3‑4 | **Fine‑tune spatial indexing**. Profile R‑tree insertion and search patterns; adjust node size and bounding boxes for typical HVAC project sizes. Document best‑performing parameters in `docs/performance.md`. | `src/services/SnapDetectionService.ts` | SnapDetectionService | *Deliverable*: search time improved by 5%; results documented. |
| 4‑5 | **Generate optimization report**. Extend `PerformanceOptimizer` in `src/utils/PerformanceOptimizer.ts` to record improvements (time savings, memory savings, success metrics). Output a JSON report summarizing optimizations. Use this report to update KPIs table. | `src/utils/PerformanceOptimizer.ts` | Monitoring service | *Deliverable*: report generated; tests verify JSON structure; docs update `docs/optimizations.md`. |

### 🗑️ Week 8: Legacy Cleanup & Final Testing

| Day | Atomic Task | Files/Modules | Dependencies | Deliverables & QA |
| --- | --- | --- | --- | --- |
| 1‑2 | **Remove feature flags and legacy code**. Search repository for legacy snap logic (e.g., `src/lib/snap-logic/legacy/`). Delete unused classes; update all imports to use refactored services. Remove feature flag checks (`useRefactoredSnapDetection`, etc.) and old fallback logic. | `src/lib/snap-logic/legacy/`, `src/hooks/useSnapLogic.ts` | All services fully migrated | *Deliverable*: no legacy code references remain; static analysis ensures removal; unit tests all pass. |
| 1‑2 | **Implement migration script**. Provide `scripts/migrateToRefactored.ts` that updates existing projects stored in IndexedDB or backend to the new format. The script should convert legacy snap points to the new format and update project metadata. | `scripts/migrateToRefactored.ts` | Data storage modules | *Deliverable*: script migrates sample projects; tests verify data consistency before and after. |
| 3 | **Comprehensive end‑to‑end testing**. Run `__tests__/e2e/CompleteWorkflow.e2e.test.ts` to simulate a full project workflow (draw duct, size, visualize, export, generate report). Ensure all steps complete without errors. Include both offline and online scenarios. Cover tier gating. | `__tests__/e2e/CompleteWorkflow.e2e.test.ts` | All services integrated | *Deliverable*: e2e tests pass; recorded video for manual QA; issues logged and fixed. |
| 3 | **Performance regression testing**. Execute `__tests__/performance/IntegrationPerformance.test.ts` comparing baseline metrics to final metrics. Accept migration only if performance meets or exceeds targets (snap detection <7.5 ms, memory <38 MB, export <20 s). | `__tests__/performance/IntegrationPerformance.test.ts` | Monitoring service | *Deliverable*: test results stored in `reports/performance-final.json`; failure blocks release. |
| 4‑5 | **Documentation and training**. Finalize all user‑facing documents: update `docs/user-guide.md`, `docs/api-reference.md`, `docs/architecture.md`, and `docs/troubleshooting.md`. Provide a training workshop for QA and support teams. Record a training video and store in `training/`. | `docs/`, `training/` | All tasks | *Deliverable*: docs complete and accurate; training delivered; update `CHANGELOG.md` and release notes. |

### 🛡 Risk Mitigation (Phase 4)

- **Data loss during migration**: Back up user projects before deleting legacy code. Use `BackupService` implemented in Phase 1 to snapshot data. Validate backups can be restored.
- **Undetected bugs**: Perform a bug bash across the team; allocate two days for exploratory testing. Encourage QA to test unusual flows, offline scenarios, and tier transitions.
- **Compliance drift**: Audit SMACNA validation logic after refactoring; ensure all classes, thickness, reinforcement, sealing, and material guidelines remain enforced[[1]](https://btrained.net/hvac-articles/understanding-smacna-standards-for-hvac-duct-fabrication#:~:text=SMACNA%20categorizes%20ducts%20based%20on,The%20main%20classifications%20include).
- **Accessibility regressions**: Use automated scanning and manual keyboard navigation tests. Ensure that final UI meets WCAG 2.1 AA success criteria across all pages[[2]](https://accessibleweb.com/rating/aa/#:~:text=Double,of%C2%A0users%20with%20a%20reasonable%20budget)[[6]](https://www.w3.org/WAI/standards-guidelines/wcag/#:~:text=What%20is%20in%20WCAG%202).

## 🔗 Dependency Mapping

Create `docs/DependencyGraph.md` summarizing the relationships between services, components, and utilities. Each node should list its imports and consumers. A simplified example (use this as a starting point):

```
SnapLogicProvider (component)
 ├─ resolves SnapDetectionService → EventBus → ConfigurationService
 ├─ resolves DrawingService → EventBus
 ├─ resolves PerformanceMonitoringService → SnapDetectionService, DrawingService
 ├─ resolves SMACNAValidator → ConfigurationService
 └─ provides context values to components

AirDuctCalculationService
 ├─ depends on SnapDetectionService
 ├─ depends on DrawingService
 ├─ depends on SMACNAValidator

EnhancedVanPackerExport
 ├─ depends on SnapDetectionService
 ├─ depends on DrawingService
 ├─ depends on AirDuctCalculationService
 └─ depends on SMACNAValidator
```

This graph must be updated whenever a new service or module is added. The file should be auto‑generated via a script (`scripts/generate-dependency-graph.ts`) run in CI.

## 🧪 Quality Assurance Integration

Quality assurance is integrated into each phase. QA must be involved in planning, test case creation, and acceptance reviews.

- **Test Case Mapping**: Every deliverable in this roadmap has associated test files. A central spreadsheet (`/test-mapping.csv`) maps each atomic task to its test case(s) with columns: *Task ID*, *Test File*, *Test Name*, *Tier*, *Phase*. This file is used by QA to ensure coverage.
- **Acceptance Criteria**: Each task includes explicit acceptance conditions (e.g., performance targets, gating behaviour, UI display). QA should reject tasks that do not meet all conditions.
- **Regression Suite**: Maintain a regression test suite covering legacy functionality. Run this suite after each sprint to detect regressions.
- **Performance Benchmarks**: Use `PerformanceMonitoringService` and dedicated performance tests to track metrics. QA must verify that metrics meet targets; failure requires root cause analysis and remediation.
- **Accessibility Tests**: Employ automated tools (axe‑core) and manual keyboard navigation tests. Document test results and file bug tickets for any WCAG 2.1 AA violations[[2]](https://accessibleweb.com/rating/aa/#:~:text=Double,of%C2%A0users%20with%20a%20reasonable%20budget)[[6]](https://www.w3.org/WAI/standards-guidelines/wcag/#:~:text=What%20is%20in%20WCAG%202).
- **Offline Tests**: QA must verify offline support by simulating network loss (e.g., Chrome DevTools offline mode). Ensure the PWA displays an offline page and that cached assets load correctly[[4]](https://web.dev/learn/pwa/caching#:~:text=What%20to%20cache). Data operations should queue and synchronize when connectivity returns.

## 📚 Documentation Synchronization

Documentation is part of the deliverables. To avoid drift:

1. **Doc Ownership**: Each feature or service has a designated owner responsible for updating documentation. Owners are listed in `docs/ownership.md` with contact information. If a doc is modified, the owner must review and approve.
2. **Update Triggers**: A documentation update is triggered when any of the following occur: new service or component created; public API changed; UI altered; feature flag added or removed; standards (e.g., SMACNA, WCAG) updated; performance targets changed. A CI script checks commit diffs for changes in `src/` and fails if there is no corresponding change in `docs/` or `CHANGELOG.md`.
3. **Review Process**: Documentation changes undergo peer review like code changes. The review checklist includes verifying citations to standards (e.g., SMACNA guidelines), ensuring that instructions match implementation, and confirming accessibility of examples.
4. **Versioning**: Use semantic versioning for documentation. Each major roadmap update increments the major version. Include version numbers at the top of each doc.
5. **Cross‑Reference**: Provide links in docs to the canonical markdowns (e.g., `logic-validators.md`, `air-duct-sizing-rules.md`). If a conflict arises between docs, the canonical doc wins. Document any conflicts in `docs/discrepancies.md`.

## 🎯 Definition of Done

For each task, the following conditions must be met to mark it complete:

1. **Code Completed**: All code changes implemented, committed, and pushed. The code follows the team's style guide and passes linting.
2. **Tests Written & Passing**: Unit, integration, end‑to‑end, performance, and accessibility tests exist for the functionality and all pass. Coverage remains ≥90%.
3. **Documentation Updated**: All relevant documentation (API reference, user guide, architecture diagrams) updated. CHANGELOG entry added.
4. **Peer Reviewed**: Code and documentation changes reviewed and approved by at least one other engineer and one QA representative.
5. **Compliance Verified**: The feature meets SMACNA/NFPA/ASHRAE guidelines (duct classifications, gauge thickness, reinforcement, sealing)[[1]](https://btrained.net/hvac-articles/understanding-smacna-standards-for-hvac-duct-fabrication#:~:text=SMACNA%20categorizes%20ducts%20based%20on,The%20main%20classifications%20include). Accessibility guidelines (WCAG 2.1 AA) verified[[2]](https://accessibleweb.com/rating/aa/#:~:text=Double,of%C2%A0users%20with%20a%20reasonable%20budget)[[6]](https://www.w3.org/WAI/standards-guidelines/wcag/#:~:text=What%20is%20in%20WCAG%202). Offline‑first criteria satisfied (service worker caches necessary assets and provides offline UI)[[4]](https://web.dev/learn/pwa/caching#:~:text=What%20to%20cache).
6. **Tier Gating Implemented & Tested**: Free vs Pro gating logic implemented, documented, and validated.
7. **Risk Mitigated**: Associated risks reviewed, contingency plans in place, and rollback scripts tested.
8. **Performance Benchmarks Met**: All metrics meet or exceed targets. Benchmarks recorded in `reports/performance-final.json`.

---

[[1]](https://btrained.net/hvac-articles/understanding-smacna-standards-for-hvac-duct-fabrication#:~:text=SMACNA%20categorizes%20ducts%20based%20on,The%20main%20classifications%20include) Understanding SMACNA Standards for HVAC Duct Fabrication - BTrained HVAC Training

[https://btrained.net/hvac-articles/understanding-smacna-standards-for-hvac-duct-fabrication](https://btrained.net/hvac-articles/understanding-smacna-standards-for-hvac-duct-fabrication)

[[2]](https://accessibleweb.com/rating/aa/#:~:text=Double,of%C2%A0users%20with%20a%20reasonable%20budget) WCAG 2.1 AA Standards | Accessible Web

[https://accessibleweb.com/rating/aa/](https://accessibleweb.com/rating/aa/)

[[3]](https://web.dev/learn/pwa/caching#:~:text=What%20to%20cache) [[4]](https://web.dev/learn/pwa/caching#:~:text=What%20to%20cache) [[5]](https://web.dev/learn/pwa/caching#:~:text=experience%20without%20consuming%20too%20much,data) Caching  |  web.dev

[https://web.dev/learn/pwa/caching](https://web.dev/learn/pwa/caching)

[[6]](https://www.w3.org/WAI/standards-guidelines/wcag/#:~:text=What%20is%20in%20WCAG%202) WCAG 2 Overview | Web Accessibility Initiative (WAI) | W3C

[https://www.w3.org/WAI/standards-guidelines/wcag/](https://www.w3.org/WAI/standards-guidelines/wcag/)