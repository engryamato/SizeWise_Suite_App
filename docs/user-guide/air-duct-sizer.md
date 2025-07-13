# Air Duct Sizer Module – User Guide & Implementation Blueprint
**For the SizeWise Suite Platform**
_Last updated: 2025-07-13_

---

## 1. Vision and Strategic Purpose

The Air Duct Sizer is the centerpiece HVAC engineering tool within the SizeWise Suite, designed for both everyday field professionals and advanced consultants. Its mission is to replace static, error-prone spreadsheets and legacy “ductulator” calculators with an interactive, code-compliant platform that *actually models* real ductwork systems—start to finish.

**Unlike legacy tools, this module is:**
- **Fully graphical**: Enables users to *draw* entire duct runs, rooms, and outlet systems—not just crunch numbers
- **Standards-driven**: Provides live validation, code references, and compliance warnings as you work
- **Collaboration-ready**: Every project, calculation, and decision is exportable and traceable for team collaboration and auditability

---

## 2. Who It’s For

- **Beginners and Experts**: The UI is friendly enough for HVAC apprentices, but supports every detail a veteran mechanical engineer expects.
- **Estimators, Designers, Installers**: Not just office-based engineers; anyone who needs to model, validate, and deliver a compliant duct system.
- **Solo users or teams**: All calculations are project-based, saved, and ready for export or collaboration.

---

## 3. Core Value: The Two-Tier Approach

To make SizeWise Suite accessible to the widest audience, Air Duct Sizer is split into **Core (Free)** and **Pro (Premium)** tiers:

- **Free users** get a full-featured *single-room/single-run* calculator and layout tool, with essential compliance checking
- **Pro users** unlock the entire power of the system: unlimited projects, full-building layouts, advanced physics, simulation, exports, and enhanced support

---

## 4. Primary Workflows and Features

### 4.1 Drawing and Layout

- **Core**: Draw up to 3 rooms and 25 duct segments in an interactive canvas. Place outlets, elbows, branches, and connect to manually-entered equipment. Snap-to-grid is disabled
- **Pro**: Draw *unlimited* rooms, branches, and segments. Snap-to-grid toggle ON. Lay out whole-building systems without constraint
- In both tiers, users can always move, edit, or delete elements before export

### 4.2 Input, Calculation, and Validation

- **Room data**: Enter area, function, appliance(s). System performs D-Calc/J-Calc for airflow needs
- **Equipment**:
  - *Core*: Enter all specs manually
  - *Pro*: Pick from a built-in, searchable HVAC equipment catalog or enter custom data
- **Duct segment**: Choose shape, material, insulation, set length/connections
  - *Core*: All sizing is manual; warnings are for basic velocity and friction only
  - *Pro*: Auto-suggest sizes, gauges, joint/seam types per SMACNA/ASHRAE/UL. Advanced mode toggles on pressure, temp, altitude, humidity logic

### 4.3 Modes and Toggles

All toggles are persistent (per user/project) and visible:

- **Layout Mode** (always on): Draw, connect, and edit
- **Snap-to-Grid**:
  - *Pro*: Toggle on/off
  - *Core*: Off only
- **Sizing/Selection**:
  - *Core*: Manual entry
  - *Pro*: Manual or Auto
- **Run Mode**:
  - *Core*: Single-run analysis only
  - *Pro*: Full-system analysis (all branches, outlets, and rooms)
- **Advanced Mode**:
  - *Core*: Not available
  - *Pro*: On/off toggle; environmental factors and physics calculations enabled
- **Simulation Mode**:
  - *Core*: Not available
  - *Pro*: On/off; animates flow, velocity, pressure, temp, with warning highlights
- **Educated Mode**:
  - *Core*: Off
  - *Pro*: On; shows tooltips with code/standard snippets (≤75 words or paraphrased)

### 4.4 Validation and Warnings

- **Free users** get inline warnings (velocity, friction) with simple text
- **Pro users** get grouped warnings, in-canvas highlights, exportable warnings, and full code/standard references per violation (SMACNA, ASHRAE, UL, regional)
- All validations are warning-only: never blocks; always real-time; segment, branch, and room-specific

### 4.5 Simulation & Export

- **Simulation** (*Pro only*):
  - Manual trigger. Animates airflow through the system. Visualizes velocity zones, pressure drops, temperature gradients. Highlights any segment with code violations
- **Export**:
  - *Core*: PDF summary (single run, basic warnings)
  - *Pro*: PDF (full project), Excel, JSON; all segment/system data, all warnings, simulation images, compliance tables

### 4.6 Saving, Loading, and Data Model

- **Core**: One active project, up to 5 saved layouts; only manual inputs
- **Pro**: Unlimited projects and versions. Auto-saves all inputs, settings, toggles, and results
- **All data models** (Room, Segment, Equipment, Project) follow explicit JSON schemas, fully documented

---

## 5. Example Scenario: The Pro Workflow

An HVAC engineer logs in as a Pro user, sets their project location (Utah, US), draws a building with five rooms, and connects an AHU from the catalog. They use Advanced Mode to factor in altitude and seasonal temperatures. Snap-to-grid is on for precise layout.

As they draw branches, the system auto-suggests duct sizes and gauges per SMACNA, and flags a branch where velocity exceeds 1500 FPM. The engineer clicks the warning, reads the cited standard, and adjusts the segment.

With Simulation Mode, they visualize airflow and pressure, capturing a color-coded PDF export (with warnings and code references) for their submittal.

---

## 6. Strategic Rationale

**Why this feature split?**

- **Free tier** gives real value to any user and lets them solve basic jobs
- **Pro tier** unlocks everything a consultant, large contractor, or designer needs to justify the price:
  - Full-system analysis
  - Advanced physics
  - Code traceability
  - Visual simulation
  - Rich export
  - Unlimited data and support

---

## 7. Implementation & QA Notes

- Every feature is **gated via feature flags**—one code base, safe premium gating
- All validation, warning, and code reference logic must be explicit in UI, backend, and export logic
- All user actions and system outputs must be auditable and re-importable
- Pro features should always appear (with a lock or tooltip) for free users—upsell must be non-intrusive, but visible

---

## 8. References & Compliance

- All validation, sizing, and gauge selection must cite and comply with:
  - SMACNA HVAC Duct Construction Standards – 4th Edition
  - ASHRAE Fundamentals Handbook (2025)
  - UL, IMC, and local codes where relevant
- All code citations must respect fair use and licensing rules

---

## 9. Future-Proofing

- All data and layouts saved in Pro must be portable to future SizeWise modules (Estimating, Reports, BIM integration, etc.)
- Core/Pro logic should be easily upgradable if tiers evolve

---

## 10. Feature Comparison Table

| Functional Area           | Free (Core User)                           | Pro (Premium User)                   |
|--------------------------|--------------------------------------------|--------------------------------------|
| **Projects & Layouts**   | 1 active project, 5 saved layouts          | Unlimited projects and versions      |
| **Rooms/Segments**       | Max 3 rooms, 25 duct segments per project  | Unlimited rooms, unlimited segments  |
| **Drawing Features**     | Draw/edit ducts, outlets, equipment        | All Free features + snap-to-grid     |
| **Input Modes**          | Manual entry only                          | Manual + Auto-suggest (sizes, gauges)|
| **Run Mode**             | Single-run analysis only                   | Full-system (multi-branch) analysis  |
| **Standards Validation** | Basic: velocity/friction warnings (SMACNA) | Full: SMACNA/ASHRAE/UL, rule-linked  |
| **Advanced Mode**        | Not available                              | Full pressure, temp, altitude, env.  |
| **Equipment**            | Manual input only                          | Built-in searchable catalog + manual |
| **Simulation Mode**      | Not available                              | Airflow/pressure/temp animation      |
| **Export**               | PDF summary (single run)                   | PDF (full), Excel, JSON; simulation  |
| **Warnings**             | Inline simple text                         | Grouped panel, in-canvas, exportable |
| **Educated Mode**        | Off                                        | On (tooltips, code refs ≤75 words)   |
| **Support/Updates**      | Community forum, quarterly updates         | Priority support, frequent updates   |

---

*This narrative supersedes all prior drafts and must guide all implementation, QA, documentation, and product decisions for the Air Duct Sizer module.*
