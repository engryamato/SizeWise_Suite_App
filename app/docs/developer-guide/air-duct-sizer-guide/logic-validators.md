# 🧮 Logic & Validators – Engineering Calculations and Rules

_See docs/README.md for documentation map and update rules._

_Last updated: 2025-07-13_

---

## 1. What Is This Document?

This file defines **all calculation logic, engineering equations, and validation/warning rules** for the Air Duct Sizer.  
If you want to know how sizes, velocities, pressures, or warnings are computed, start here.

- **Does NOT contain:** UI layouts, JSON schemas, export/print details (see related markdowns).

---

## 2. Calculation Domains

- **Duct Sizing:**  
  - Calculates duct size from airflow and friction rate or velocity.
- **Air Velocity:**  
  - Computes velocity for a given duct size and airflow.
- **Pressure Loss:**  
  - Calculates static pressure drop using friction and duct length.
- **System Performance:**  
  - Sums losses, checks pressure classes, and validates overall system.
- **Heat Load:**  
  - (Pro) D-Load and J-Load calculations for HVAC design.

---

## 3. Master Calculation Formulas

### 3.1 Duct Sizing (Round & Rectangular)

- **For round ducts:**
  - \( Q = V \times A \)  
    - \( Q \): Airflow (CFM or L/s)
    - \( V \): Velocity (FPM or m/s)
    - \( A \): Area (ft² or m²)
  - \( D = \sqrt{\frac{Q}{V} \times \frac{4}{\pi}} \)

- **For rectangular ducts:**
  - \( Q = V \times A \)
  - \( A = \text{width} \times \text{height} \)
  - Equivalent diameter (for friction):
    - \( D_e = 1.3 \times \frac{(a \times b)^{0.625}}{(a + b)^{0.25}} \)
    - \( a, b \): width, height

---

### 3.2 Air Velocity

- \( V = \frac{Q}{A} \)
  - \( V \): Velocity (FPM or m/s)
  - \( Q \): Airflow
  - \( A \): Area

---

### 3.3 Pressure Loss

- **Darcy-Weisbach (General):**
  - \( \Delta P = f \times \frac{L}{D} \times \frac{\rho V^2}{2} \)
    - \( \Delta P \): Pressure loss (in. w.g. or Pa)
    - \( f \): Friction factor (from SMACNA tables or computed)
    - \( L \): Duct length
    - \( D \): Hydraulic diameter
    - \( \rho \): Air density (altitude/temp adjusted)
    - \( V \): Velocity

- **SMACNA Friction Charts:**
  - Used for fast lookup or reference (use code tables if possible)

---

### 3.4 Heat Load Calculations (Pro)

- **D-Calculation (Simplified):**
  - Uses room dimensions, occupancy, appliance load, walls/windows (see field list in `data-models-schemas.md`)
- **J-Calculation (Detailed):**
  - Includes R-value, infiltration, altitude, seasonal temps, equipment heat gain, etc.

---

## 4. Validation Rules & Warnings

| Rule ID         | Trigger/Condition                         | Message                                 | Severity    | Code Ref            |
|-----------------|-------------------------------------------|-----------------------------------------|-------------|---------------------|
| VELOCITY_HIGH   | Velocity > max allowed by code            | "Velocity exceeds SMACNA/ASHRAE limit"  | warning     | SMACNA Table 4-1    |
| VELOCITY_LOW    | Velocity < min practical                  | "Velocity very low; check design"       | info        | ASHRAE Guide        |
| ASPECT_RATIO    | Width:Height > 4:1                        | "Aspect ratio exceeds standard"         | warning     | SMACNA Table 2-3    |
| SIZE_TOO_SMALL  | Duct size < code minimum                  | "Duct size below code minimum"          | critical    | Local code          |
| SIZE_TOO_LARGE  | Duct size impractical (per config)        | "Duct size unusually large"             | warning     | Engineer review     |
| PRESSURE_DROP   | Pressure loss > design target             | "Pressure loss too high"                | warning     | ASHRAE/SMACNA       |
| DEFAULT_COMP    | Pro-only computational property missing   | "Default computational value used"      | info        | N/A                 |
| SEG_LIMIT_FREE  | Free user hits segment/room/project limit | "Upgrade to Pro to add more items"      | info        | Feature gating      |

*Add new rules as needed; always cross-link to code/table if possible.*

---

## 5. Calculation Inputs & Tier Rules

- **Free:**  
  - Can only use standard default computational properties (velocity, pressure, etc.)  
  - No access to advanced simulation or editable design targets
- **Pro:**  
  - Can set/override all computational properties at project or room/segment level  
  - Full access to simulation, D/J calculations, and advanced warnings

---

## 6. Logic Flow (How Calculations Are Applied)

1. On project/room/segment update, gather input fields (see `data-models-schemas.md`)
2. For each segment, calculate size, velocity, pressure loss
3. Apply all validations; attach warnings to objects as needed
4. Pro users: apply advanced calcs (simulation, heat load, custom code targets)
5. Return results to UI for live feedback and reporting (see `ui-components.md`, `exports-reports.md`)

---

## 7. How to Keep This File Updated

- Any time a formula or rule changes, **update this file and the README first**
- Cross-link to field and input definitions, never duplicate them
- Add new validation rules and warnings as required by new standards or user needs

---

## 8. Where to Find More Details

- Data field names/types: `data-models-schemas.md`
- UI feedback/presentation: `ui-components.md`
- Export/print rules: `exports-reports.md`
- Canvas drawing logic: `canvas-drawing.md`

---

*This file is your master reference for engineering calculations, validation logic, and all warnings/alerts used in the Air Duct Sizer.  
Keep it up to date as your formulas or code standards evolve!*
