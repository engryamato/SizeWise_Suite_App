# 🗂️ Air Duct Sizer MVP (Phase 1) — Comprehensive Implementation Task List

> **Goal:**  
> Implement all core features required for a professional HVAC Air Duct Sizer tool, with strict SMACNA/ASHRAE compliance, robust Free/Pro enforcement, accessibility, and complete documentation alignment.

---

## [ROOT] Phase 1: Core Functionality Implementation

---

### Task 1.1: Complete Calculation Engine

#### 1.1.1 Implement Darcy-Weisbach Pressure Loss
- [x] Write function for duct pressure loss using the Darcy-Weisbach equation.
- [x] Integrate all major duct materials and their roughness factors from SMACNA tables (galv. steel, aluminum, flex, etc.).
- [x] Validate outputs against at least three worked SMACNA example problems.
- [x] If any SMACNA data/table is missing or ambiguous, **pause and escalate for a decision** (record specific reference/section needed).

#### 1.1.2 Add Equivalent Diameter & Aspect Ratio
- [x] Write hydraulic/equivalent diameter calculation for rectangular ducts.
- [x] Validate and enforce aspect ratio per SMACNA (e.g., 4:1 or latest standard); trigger UI warning if exceeded.
- [x] Display UI suggestions for optimal ratios when user input is noncompliant.
- [x] Document all calculations for developer and user reference.

#### 1.1.3 Integrate Backend Calculator
- [ ] Finalize and document backend API endpoint for duct calculations (Python or approved stack).
- [ ] Write frontend service/module to call backend; ensure seamless calculation flow and UI updates.
- [ ] If backend is unavailable, fall back to client-side calculation and **display validator warning**.
- [ ] Test all flows (online/offline; backend/client-side fallback) and document behaviors.

---

### Task 1.2: Complete Drawing System

#### 1.2.1 Implement Room Drawing and Editing
- [ ] Enable drawing, resizing, moving, and deleting rooms in the canvas UI.
- [ ] Snap to grid (default 6" increments; allow user to change grid size).
- [ ] Allow property editing: name, type, dimensions, target flow, etc.
- [ ] Validate against Free tier room limit (max 3); **display lock UI and upgrade prompt if at max**.
- [ ] Ensure rooms can be uniquely identified and renamed.

#### 1.2.2 Implement Duct Segment Drawing and Editing
- [ ] Enable drawing of all segment types: straight, elbows, tees, wyes, etc.
- [ ] Each segment connects at node points (prevent dangling/invalid connections).
- [ ] Add property panel for size, length, insulation, pressure class, etc.
- [ ] Snap to grid and auto-align to room/equipment edges.
- [ ] Enforce Free tier segment limit (max 25); **display count, warnings, and lock tool at limit**.
- [ ] Allow for segment deletion/undo.

#### 1.2.3 Implement Equipment Placement
- [ ] Enable user to place up to 2 "equipment" units (AHU, FCU, RTU, exhaust fan, etc.).
- [ ] Manual entry required for name, type, airflow, static pressure, and location.
- [ ] Connect equipment to room/segment via nodes.
- [ ] Lock further placements and show upgrade prompt if Free tier limit (2) reached.
- [ ] Ensure correct counting: only major air-moving equipment, not outlets/registers.

#### 1.2.4 UI/UX Drawing Feedback
- [ ] All drawing actions must support undo/redo.
- [ ] Visual highlight for selection and mouse-over states.
- [ ] Clear error state for invalid connections or overlapping elements.
- [ ] Keyboard shortcuts: V (select), R (room), D (duct), E (equipment), H (hand/pan), G (grid), S (snap), Esc (cancel).
- [ ] Tooltip/inline help for each tool.

---

### Task 1.3: Standards Validation System

#### 1.3.1 Integrate SMACNA/ASHRAE Validation Rules
- [ ] Validate all duct sizes, velocities, pressure classes in real-time as user draws/edits.
- [ ] Warn if:
    - Duct velocity exceeds ASHRAE limit for room type.
    - Duct size is below SMACNA minimum for stated flow.
    - Aspect ratio, insulation, or pressure class is out of bounds.
- [ ] Free tier: Show warnings, Pro-only validations display tooltip (“Upgrade to Pro for full validation”).
- [ ] Pro tier: Enable all advanced validations, including heat load per ACCA Manual D/J.
- [ ] Reference validation rule by standard/section in warning tooltips.

#### 1.3.2 UI Feedback for Validation
- [ ] Color-code warnings/errors on both canvas and property panels (yellow = warning, red = error, green = compliant).
- [ ] Tooltip/inline help with standard citation (SMACNA/ASHRAE/ACCA).
- [ ] Real-time recalculation and warning update as user draws/edits.

---

### Task 1.4: Export System Implementation

#### 1.4.1 PDF Export (with Tier Enforcement)
- [ ] Export entire project as PDF, including:
    - Bill of Materials (BOM)
    - Room/Duct/Equipment schedules
    - Drawing snapshot
- [ ] Free tier: 150 DPI, 1200×800 px, **watermark** (“Made with SizeWise Free”, lower right).
- [ ] Pro tier: up to 600 DPI, up to 4096×4096 px, **no watermark**.
- [ ] Block export if project exceeds Free tier limits; show tooltip/upgrade prompt.

#### 1.4.2 Excel/CSV Export
- [ ] Export BOM and schedule tables to Excel (.xlsx) or CSV.
- [ ] Free: all visible data only; heat load/advanced columns hidden/locked.
- [ ] Pro: full export, all columns unlocked.

#### 1.4.3 PNG/SVG Export
- [ ] Drawing canvas export as PNG or SVG.
- [ ] Free: limited to 1200×800 px, watermarked.
- [ ] Pro: up to 4096×4096 px, no watermark.

#### 1.4.4 JSON Export/Import
- [ ] Export/import all project data, including drawing, properties, and settings.
- [ ] On import, validate that project does not exceed Free tier limits (else block and warn).
- [ ] Document all import validation and error handling.

---

## Cross-Cutting Tasks

### A. Free/Pro Tier Enforcement
- [ ] Enforce all Free tier limits in both UI (prevents adding) and export (blocks if over limit).
- [ ] Always display current usage (e.g., “2 of 3 rooms used”).
- [ ] Tooltips on all locked features (“Upgrade to Pro for unlimited...”).
- [ ] QA/test all possible edge cases of tier boundary crossing.

### B. Standards & Documentation Alignment
- [ ] All calculations/validations/exports strictly reference the latest SMACNA/ASHRAE (unless specified otherwise).
- [ ] Escalate/annotate any ambiguity or missing specification; never guess.
- [ ] Update code/doc comments to cite the rule source.

### C. Accessibility & Browser Support
- [ ] WCAG 2.1 AA compliance: all panels/canvas (keyboard navigation, color contrast, ARIA labels).
- [ ] Test on all required browsers: Chrome, Firefox, Edge, Safari (desktop); iOS/Android mobile browsers.
- [ ] Document any browser-specific UI deviations or issues.

### D. Offline Functionality
- [ ] All core features (drawing, calculation, export) must work fully offline after initial app load.
- [ ] Test and document offline behaviors, including browser refresh/reopen.

---

## Escalation & Approval Points

- **Pause and escalate if:**
    - Any spec (calc, standard, tier, export rule) is unclear or not feasible
    - SMACNA/ASHRAE data is missing or ambiguous
    - Any user workflow, UI, or error case not covered in documentation

- **Never guess—always escalate for decision and log open question.**

---

## Deliverables & QA

- [ ] Mark each atomic task complete only when all test cases pass, including edge cases and tier enforcement.
- [ ] Update documentation/code comments for any deviation, including rationale and owner approval.
- [ ] Prepare summary test report for sign-off before deployment.

---

> **This checklist is the direct implementation contract for MVP delivery. All parties (Augment, developers, PM) must align to these points, with no unapproved deviation.**
