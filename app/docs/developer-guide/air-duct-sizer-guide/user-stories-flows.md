# 👤 User Stories & Workflow Flows

_See docs/README.md for documentation map and update rules._

_Last updated: 2025-07-13_

---

## 1. What Is This Document?

This file provides **step-by-step narrative walkthroughs (user stories and flows)** for the most common (and a few edge-case) scenarios in the Air Duct Sizer.  
If you want to see exactly how a real user will move through the system (Free or Pro), start here.

- **Does NOT contain:** UI field layouts, exact schema, or engineering formulas (see related markdowns).

---

## 2. Primary User Stories

### 2.1 New User – Free Tier – Simple Project

1. User signs up and is prompted by the **onboarding wizard** (see `ui-components.md`)
2. Enters:
    - Project name (“Sample Office”)
    - Location (“Manila, PH”)
    - Leaves user/contractor blank (optional)
    - Chooses SMACNA code (optional)
3. Completes onboarding; is taken to canvas
4. Draws up to 3 rooms and 25 duct segments (limit reached = prompt to upgrade)
5. Assigns airflow or lets system auto-calculate per room
6. Reviews basic calculations, warnings, and sizes in sidebar (comp. props view-only)
7. Clicks **Export** and downloads PDF (watermarked) or BOM (limited to cap)
8. (Optional) Edits project properties via sidebar
9. (Optional) Tries to draw more than 25 segments: sees modal “Upgrade to Pro…”

---

### 2.2 Returning User – Pro Tier – Advanced Project

1. User logs in (already upgraded)
2. Creates new project (“Hospital South Wing”)
3. Uses onboarding wizard to:
    - Enter advanced computational properties (velocity, pressure, altitude, R-value, code/standard, etc.)
    - Adds user/contractor and location
4. Draws unlimited rooms/segments (snap to grid toggle enabled)
5. Adds/edits equipment from catalog or manual entry
6. Assigns multiple air outlets per room, runs D/J heat load calculations
7. Views all advanced outputs: velocities, pressures, system warnings, live simulation overlay (airflow/pressure visuals)
8. Exports full PDF/Excel/JSON/BOM (unlimited, no watermark)
9. Shares project with team (future: multi-user)

---

### 2.3 Edge Case – Downgrade from Pro to Free

1. Pro user’s subscription lapses or they downgrade plan
2. Opens existing project with >3 rooms or >25 segments
3. Project is **locked as view-only** until reduced to Free limits or plan is upgraded again
4. Tries to edit Pro-only fields: sees tooltip/prompt to upgrade
5. Exports available, but limited: watermark shown, Pro fields/outputs locked or omitted

---

### 2.4 Error/Warning Handling

- User tries to export project with required computational field blank:
    - System fills with default, adds warning (“Default value used for [field]; review in Pro settings.”)
- User draws segment with velocity/pressure above SMACNA limit:
    - Segment turns red, warning badge appears, sidebar explains code reference

---

## 3. Special Flows

### 3.1 Project Onboarding Wizard

- Walks user through all required fields
- Free users: comp. fields shown as view-only (with tooltip to upgrade)
- Pro: all fields editable, help tooltips link to code references

### 3.2 Drawing Mode

- User clicks/taps to draw room(s), then draws duct segments (lines)
- Snap to grid ON by default, Pro can toggle
- Each object selectable; properties editable in sidebar

### 3.3 Export Workflow

- User hits Export; picks format (PDF, Excel, JSON, BOM)
- System checks tier and applies content gating (see `exports-reports.md`)
- Preview offered before download/print

---

## 4. How to Use and Update This Document

- Add a new user story/flow for any major new feature or user type
- Reference UI/components or logic files for field specifics—never duplicate those details
- Keep scenarios real, practical, and step-by-step for new hires or QA

---

## 5. Where to Find More Details

- Field definitions/schemas: `data-models-schemas.md`
- Calculation and logic: `logic-validators.md`
- Export/report content: `exports-reports.md`
- UI field layouts/sidebars: `ui-components.md`
- Canvas/drawing rules: `canvas-drawing.md`
- QA criteria: `qa-acceptance-criteria.md`

---

*This document is your master reference for user workflow, main flows, and real-life scenarios in the Air Duct Sizer.  
Keep it up to date as features and flows change!*
