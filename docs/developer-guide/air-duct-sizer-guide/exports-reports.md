# 📤 Exports & Reports – Output Formats and Tier Rules

_See docs/README.md for documentation map and update rules._

_Last updated: 2025-07-13_

---

## 1. What Is This Document?

This file describes **how project data, calculations, and drawings are exported** from the Air Duct Sizer, what fields appear in each format, and what is included/excluded for Free vs Pro users.

- **Does NOT contain:** Calculation logic, UI/interaction flows, schema field definitions (see other markdowns for those).

---

## 2. Supported Export Formats

- **PDF Report**  
  - Print-friendly, formatted summary for sharing or record-keeping
- **Excel (.xlsx or .csv)**  
  - Data tables for BOM, segment schedules, and room/equipment lists
- **JSON**  
  - Full machine-readable project snapshot (for import into other apps)
- **BOM (Bill of Materials)**  
  - Summarized list of all materials, sizes, quantities, and equipment

---

## 3. Export/Report Content Rules (Free vs Pro)

| Export Content                 | Free Tier                                   | Pro Tier                         |
|-------------------------------|---------------------------------------------|----------------------------------|
| Project metadata (name, user, etc.)    | All fields                       | All fields                       |
| Room/segment/equipment fields  | All base fields (see schemas)               | All fields, including Pro-only   |
| Computational properties       | Defaults only (shown, locked)               | Custom values if set             |
| Calculated outputs             | Sizes, areas, velocities (basic)            | Full calculations, simulation, pressure loss, D/J loads |
| Warnings/alerts                | All, but limited to Free fields/inputs      | All, including Pro-only warnings |
| Drawing/canvas export          | PDF/PNG with watermark                      | PDF/PNG, no watermark            |
| BOM export                     | Limited to Free item/project/room limit     | Unlimited items/rooms/segments   |
| Export file types              | PDF, CSV/XLS (basic), JSON (basic, no custom props) | All formats, full content        |
| Code compliance references     | Shown as tooltips/footnotes only            | Inline, full references in report|
| Simulation visualizations      | Not included                                | Included if simulation run       |

---

## 4. Export Workflow

1. **User clicks Export/Print button** (from sidebar or toolbar)
2. **Selects format** (PDF, Excel, JSON, BOM)
3. **System checks user tier and export limits**:
    - Free: If over project/segment/room limit, prompt upgrade
    - Pro: Unlimited
4. **System assembles report/output**:
    - Pulls data from schemas (`data-models-schemas.md`)
    - Runs calculations as needed (`logic-validators.md`)
    - Applies tier-based content rules
5. **Preview shown** (optional for PDF/Excel)
6. **Download or print** (with/without watermark per tier)

---

## 5. Special Export Behaviors

- **Watermark:**  
  - All Free exports include a “Generated with Air Duct Sizer Free” watermark
  - Pro exports have no watermark

- **Tier-Locked Fields:**  
  - If Pro-only fields exist, Free users see a note (“Premium field: upgrade to access/edit”)
  - On JSON export, Pro fields are omitted or included as defaults with note

- **Warnings & Code References:**  
  - Warnings are grouped by segment/room, shown in the report; code references provided if available

- **BOM Export:**  
  - Includes all ducts, fittings, equipment in project; Free is capped at limit, Pro is unlimited

- **Simulation Export (Pro Only):**  
  - If simulation was run, PDF/Excel/JSON export includes airflow/pressure visuals and tables

---

## 6. Sample Export Structure

### 6.1 PDF

- Cover page: project name, user, date, codes
- Table of Contents
- Project summary
- Room list and airflow requirements
- Duct segment schedule (size, material, length, airflow, velocity, pressure loss, warnings)
- Equipment schedule
- BOM (with part numbers if catalogued)
- Drawing/canvas snapshot (with/without watermark)
- Simulation (Pro)
- Warning summary (grouped)

### 6.2 Excel/CSV

- Sheet 1: Rooms
- Sheet 2: Segments
- Sheet 3: Equipment
- Sheet 4: BOM
- Sheet 5 (Pro): Simulation results

### 6.3 JSON

- Full project export (see `data-models-schemas.md` for structure)
- Pro: Includes all custom/computational properties
- Free: Defaults, with note for Pro-only fields

---

## 7. Keeping This File Up To Date

- Whenever export content, field inclusion, or tier rules change, **update this file and README first**
- Cross-link to schema and logic docs for field definitions

---

## 8. Where to Find More Details

- Data field names and types: `data-models-schemas.md`
- Calculation/logic for outputs: `logic-validators.md`
- UI/export button behavior: `ui-components.md`
- Drawing/canvas rules: `canvas-drawing.md`
- QA/export test scenarios: `qa-acceptance-criteria.md`

---

*This file is your definitive guide to what exports from Air Duct Sizer, how, in what format, and what is shown for each user tier.  
Always update with changes to exports, reports, or tier boundaries!*
