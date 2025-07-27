# 🖥️ UI Components – Panels, Properties, and Controls

_See [docs/README.md](../../README.md) for documentation map and update rules._

_Last updated: 2025-07-13_

---

## 1. What Is This Document?

This file describes **all user interface components** outside the main drawing canvas for the Air Duct Sizer.  
You’ll find onboarding wizards, project/room/segment sidebars, tooltips, accessibility, and Free/Pro gating rules for each field.

- **Does NOT cover:** Canvas drawing logic, calculation formulas, JSON schemas (see related markdowns).

---

## 2. Main UI Panels & Components

### 2.1 Onboarding Wizard

- Shown after login or new project creation
- Guides user through:
  - Project name (required)
  - User/contractor (optional)
  - Project location (required; can be N/A)
  - Select codes/standards (multi-select dropdown, optional; e.g. SMACNA, ASHRAE)
  - (Pro only) Set computational properties (default velocity, friction rate, altitude, pressure class, R-value, etc.)
- Fields are **editable at project start** and always from the sidebar (see below)
- Free users see Pro fields but cannot edit (tooltip: “Upgrade to Pro to customize”)

---

### 2.2 Sidebar – Project Properties Panel

- Always visible on main screen (expand/collapse)
- **Fields:**
  - Project name (editable)
  - User name, contractor (editable, optional)
  - Project location (editable)
  - Codes/standards (editable multi-select, warning if changed after drawing)
  - Computational properties (editable only for Pro, locked for Free)
    - Default velocity
    - Pressure class
    - Altitude
    - R-value
    - Others as needed by logic (see `logic-validators.md`)
- **Change Behavior:**
  - Editing computational properties updates all dependent rooms/segments instantly
  - Locked (Free): show value, lock icon, “Upgrade for advanced settings”

---

### 2.3 Room & Segment Property Panels

- Show when user selects a room or segment on canvas
- **Room Fields:**
  - Name (editable)
  - Function/type (dropdown: office, lab, classroom, etc.)
  - Dimensions (length, width, height)
  - Airflow requirements (calculated or manual input)
  - Outlets/terminals (add/edit/remove)
- **Segment Fields:**
  - Type (straight, elbow, branch, etc.)
  - Material (dropdown: galvanized, aluminum, etc.)
  - Size (width/height/diameter)
  - Length (editable)
  - Calculated properties (velocity, pressure loss, etc.; editable if Pro, read-only if Free)
- All field definitions and allowed values: see `data-models-schemas.md`
- All calculation rules: see `logic-validators.md`

---

### 2.4 Tooltips & Help Popovers

- Every advanced field, warning, or lock has a tooltip
  - Example: “Pressure class determines max safe operating pressure—see SMACNA Table 1-2”
- Pro-locked tooltips: “Upgrade to Pro to unlock this field”
- Help icon for every panel links to user-stories-flows.md

---

### 2.5 Accessibility Features

- All panels support:
  - Keyboard navigation (Tab/Shift+Tab for focus, arrows for dropdowns)
  - Color-contrast checked for WCAG AA/AAA compliance
  - Resizable text
  - ARIA labels on all inputs/buttons for screen reader support

---

## 3. Free vs Pro Behavior Table

| Field/Panel            | Free Tier        | Pro Tier              |
|------------------------|------------------|-----------------------|
| Onboarding Wizard      | All project fields editable, computational fields locked/read-only | All fields editable       |
| Project Properties     | Computational fields locked/read-only | All fields editable       |
| Room/Segment Properties| All structural fields editable, calculated fields read-only | All fields editable/calculated |
| Tooltips               | Upgrade prompts for Pro-locked fields | Full help/links           |
| Export/Print Buttons   | BOM/drawing (watermarked), limited project size | All export formats, unlimited  |

---

## 4. Where to Find More Details

- **Field names, types, defaults:** See `data-models-schemas.md`
- **Calculation logic & warning text:** See `logic-validators.md`
- **Drawing/editing rooms/segments:** See `canvas-drawing.md`
- **User journeys and flows:** See `user-stories-flows.md`

---

## 5. How to Keep This File Updated

- Any time a UI panel, field, or accessibility feature changes, **update this file and the README first**
- Cross-link to the schema and logic files for any new/changed field
- Never duplicate calculation rules or schema—just reference them

---

*This document is your single source of truth for all UI components, property panels, tooltips, and accessibility requirements.  
See linked markdowns in [README.md](../../README.md) for further details!*
