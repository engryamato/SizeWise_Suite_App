# 📚 SizeWise Suite – Documentation Index & Governance

_Last updated: 2025-07-13_  
_Maintainer: [Your Name, or leave blank for now]_

---

## Welcome to the SizeWise Suite Docs!

This folder contains **all the documentation you (or any future developer or AI agent) need** to understand, extend, and maintain the Air Duct Sizer module inside the SizeWise Suite.  
**Every topic has its own markdown file, so you always know where to look or update.**

**👉 If you’re new, read this file first before touching any other docs!**

---

## 📖 How This Documentation Works

- **Every topic only appears once** (no duplication!)—if you’re looking for UI details, you go to the UI file. For engineering logic, the logic file. For JSON schema, the schema file.
- This README.md is your “**map**” (table of contents + ownership).
- Whenever you add or change a feature, **start here**: update the map, then the right file.
- If you’re unsure, always reference this file first!

---

## 🗂️ Documentation Table of Contents

| Filename                       | What’s In It? (Single Source)                                         | What’s NOT In It?                  |
|---------------------------------|-----------------------------------------------------------------------|-------------------------------------|
| **README.md**                   | This file! Docs map, change rules, file list, update workflow, owners | Product or UI/logic details         |
| **air-duct-sizer.md**           | Product vision, workflow, Free/Pro features, user types, main rules   | UI fields, engineering, schema      |
| **canvas-drawing.md**           | How drawing/editing on canvas works (rooms/ducts, snap-to-grid, etc.) | UI panels outside canvas, logic     |
| **ui-components.md**            | Every UI panel/component (wizard, sidebar, tooltips, accessibility)   | Logic, schema, formulas             |
| **data-models-schemas.md**      | JSON/data schemas for everything (Project, Room, Segment, etc.)       | UI flows, calculations, validation  |
| **logic-validators.md**         | All engineering formulas, calculation rules, warnings, validator logic| UI, schema, field types             |
| **exports-reports.md**          | What exports/prints, in what format, Free/Pro export rules            | Data models, logic, UI              |
| **feature-flags-boundaries.md** | How Free/Pro gating works everywhere (UI/API/logic/exports)           | UI/logic/schema outside gating      |
| **user-stories-flows.md**       | User journeys, onboarding, troubleshooting, export simulation example | Product vision, schema, logic       |
| **qa-acceptance-criteria.md**   | QA test and acceptance checklist, edge cases, UAT, version signoff    | UI wireframes, formulas, vision     |
| **00_CHANGELOG.md**             | Log of every docs/product change (date, version, reason)              | Product details, rules, logic       |

---

## 📝 How to Update the Docs

1. **Want to add a new feature, field, or rule?**  
   - Update this README first—add to the table above.
   - Then go to the relevant markdown file (see “What’s In It?”).
   - Write your details there.  
   - Make an entry in `00_CHANGELOG.md` (date, what changed, why).
2. **Never duplicate info!**  
   - If it’s already defined in one file, **link** to it from others, don’t copy it.
3. **If you’re not sure where something belongs, put it here in a comment and ask for help!**

---

## 📍 Where Are Project-Level Fields Defined?

- **Project name, location, codes, user/contractor, computational properties:**  
  - Overview: see `air-duct-sizer.md`
  - UI: see `ui-components.md`
  - JSON schema: see `data-models-schemas.md`
  - Logic use: see `logic-validators.md`
  - Export rules: see `exports-reports.md`

---

## 👤 Ownership Table

| Area                      | Owner (for now: you!)      |
|---------------------------|----------------------------|
| Product Vision/Boundaries | You                        |
| UI/Components             | You                        |
| Data Models/Schemas       | You                        |
| Calculations/Validators   | You                        |
| Docs Index                | You                        |

(When you add AI agents or new team members, update this table!)

---

## 📚 Full File Tree Example

