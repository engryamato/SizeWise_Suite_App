# 🏗️ Air Duct Sizer – Product Overview & Vision

_See docs/README.md for documentation map and update rules._

_Last updated: 2025-07-13_

---

## 1. What is the Air Duct Sizer?

The **Air Duct Sizer** is a professional tool in the SizeWise Suite that helps you design, size, and validate air duct systems for any HVAC project—whether you’re a complete beginner, a seasoned engineer, or an installer.  
It automates complex calculations, provides code-compliant outputs, and supports both simple and advanced workflows.

---

## 2. Who is it for?

- **Beginners** (just starting in HVAC design or estimating)
- **Expert engineers** (demanding full standards compliance and simulation)
- **Contractors, fabricators, installers**
- **Anyone who needs to lay out, size, or validate air ductwork—fast and accurately**

---

## 3. Key Product Goals

- Make duct design and validation **accessible** to everyone, not just specialists
- Support both **manual and “draw on canvas” workflows**
- Maintain the **highest standard of engineering accuracy**
- Provide **instant feedback and warnings**
- Allow easy **export, print, or share** of every design
- Be the **fastest way** to design and check HVAC air ductwork on any project

---

## 4. Free vs Pro Features

**Free Tier**
- Draw up to **3 rooms and 25 duct segments** per project
- Manual entry or basic drawing mode
- Access to basic calculation (size, area, velocity) and warnings
- Can save, print, and export Bill of Materials (BOM) and drawing (with watermark)
- Project properties: name, location, user, codes (read-only for some advanced fields)
- View—but cannot edit—advanced computational properties (velocity, pressure, etc.)
- Can select industry codes/standards for reference

**Pro Tier**
- Unlimited rooms and duct segments
- Advanced calculation (full pressure, temp, CFM, system simulation)
- Auto-suggest sizes, gauges, and warnings (live feedback as you draw)
- Edit all computational properties (velocity, pressure, R-value, altitude, etc.)
- Unlock all export formats (full PDF/Excel/JSON, no watermark)
- Simulation mode (visualizes airflow, pressure, temp in real time)
- Inherits all Free features

---

## 5. Main Workflow Steps

1. **Create or open a project**  
   - Input project name, location, contractor/user, select codes/standards
2. **Define project-level properties**  
   - (Pro) Edit computational properties—otherwise, defaults used (with warning)
3. **Draw or define rooms and duct segments**  
   - Snap to grid, drag to create/edit segments, select outlets/equipment
4. **Enter or select equipment/airflows**  
   - Manual entry or use catalog (Pro)
5. **System auto-calculates**  
   - See sizes, velocity, warnings live on canvas or property panel
6. **Export results**  
   - Bill of Materials, drawings, calculation reports (PDF/Excel/JSON, tier-dependent)

---

## 6. What Codes/Standards Are Used?

- **SMACNA HVAC Duct Construction Standards (4th Edition)**
- **ASHRAE Fundamentals (2025)**
- **UL, IMC, and relevant local codes**

_All warnings and auto-sizing recommendations reference these standards (in “Educated Mode” you get code snippets/tooltips, subject to legal review)._

---

## 7. Out of Scope for This File

**This file does NOT cover:**
- How UI panels or drawing tools actually work (see `ui-components.md`, `canvas-drawing.md`)
- Engineering formulas or validator details (see `logic-validators.md`)
- Exact field names, types, or JSON schemas (see `data-models-schemas.md`)
- Export/report structure (see `exports-reports.md`)
- QA/test criteria (see `qa-acceptance-criteria.md`)

---

## 8. Keeping This File Up To Date

- Whenever you add a major feature or change Free/Pro boundaries, **update this file and the README index FIRST**
- All new detailed logic/UI/schema/export rules should live in their own dedicated markdowns (see README)

---

*This document is your master reference for what the Air Duct Sizer is, who it’s for, what it can/can’t do, and how to keep the boundaries clear as you add new features. For everything else, see the docs listed in README.md!*
