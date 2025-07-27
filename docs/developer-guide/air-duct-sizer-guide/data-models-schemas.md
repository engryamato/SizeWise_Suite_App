# 📦 Data Models & Schemas – Fields, Types, and JSON

_See [docs/README.md](../../README.md) for documentation map and update rules._

_Last updated: 2025-07-13_

---

## 1. What Is This Document?

This file defines **every entity, field, and data contract** in the Air Duct Sizer (Project, Room, Segment, Equipment, Warning).  
If you want to know what fields exist, what type/value they can take, or how the data looks in JSON, this is your one source of truth.

- **Does NOT contain:** UI details, calculation logic, validation rules (see related markdowns).

---

## 2. Master Data Entities

- **Project:** Overall container for user’s work
- **Room:** A physical space (e.g., classroom, office, lab)
- **Segment:** One duct section (straight, elbow, branch)
- **Equipment:** HVAC devices (AHU, VAV, terminal, etc.)
- **Warning:** Validator outputs and warning metadata

---

## 3. Project Schema

| Field                     | Type      | Required | Default   | Tier        | Notes                                      |
|---------------------------|-----------|----------|-----------|-------------|--------------------------------------------|
| `project_name`            | string    | Yes      |           | Free+Pro    | Always required                            |
| `user_name`               | string    | No       |           | Free+Pro    | Optional                                   |
| `contractor_name`         | string    | No       |           | Free+Pro    | Optional                                   |
| `project_location`        | string    | Yes*     | "N/A"     | Free+Pro    | "N/A" allowed if not provided              |
| `codes`                   | array     | No       | []        | Free+Pro    | E.g. ["SMACNA","ASHRAE"], can be empty     |
| `computational_properties`| object    | No       | per code  | **Pro only**| If missing (Pro), use default+emit warning |
| `rooms`                   | array     | Yes      | []        | Free+Pro    | List of Room objects                       |
| `segments`                | array     | Yes      | []        | Free+Pro    | List of Segment objects                    |
| `equipment`               | array     | No       | []        | Free+Pro    | List of Equipment objects                  |
| `created_at`              | datetime  | Yes      | now()     | Free+Pro    | ISO 8601                                   |
| `last_modified`           | datetime  | Yes      | now()     | Free+Pro    | ISO 8601                                   |

---

## 4. Computational Properties Object (Pro Only)

| Field                 | Type      | Default    | Notes                                                        |
|-----------------------|-----------|------------|--------------------------------------------------------------|
| `default_velocity`    | number    | per code   | fpm or m/s, from standard tables                             |
| `pressure_class`      | string    | per code   | e.g. "Low", "Medium", "High"; see SMACNA Table 1-2           |
| `altitude`            | number    | 0          | meters or feet; for density/pressure corrections             |
| `r_value`             | number    | per code   | Insulation value; used in heat loss/gain calculations        |
| `friction_rate`       | number    | per code   | in. w.g./100ft or Pa/m; used for sizing calculations         |
| ...more as required   | ...       | ...        | As needed by engineering/logic rules                         |

> *If a Pro field is missing, system uses standard default and emits a warning (“Default value used; consider reviewing in Pro settings”).*

---

## 5. Room Schema

| Field         | Type    | Required | Default | Notes                                      |
|---------------|---------|----------|---------|--------------------------------------------|
| `room_id`     | string  | Yes      |         | Unique identifier                          |
| `name`        | string  | Yes      |         | User label                                 |
| `function`    | string  | No       |         | E.g., "office", "classroom", "lab"         |
| `dimensions`  | object  | Yes      |         | {length: number, width: number, height: number} |
| `area`        | number  | No       | calc'd  | If not given, system calculates from dims   |
| `airflow`     | number  | No       | calc'd  | CFM/L/s; can be user-entered or calculated |
| `outlets`     | array   | No       | []      | List of outlet objects (see segment/equipment)|

---

## 6. Segment Schema

| Field         | Type    | Required | Default | Notes                                   |
|---------------|---------|----------|---------|-----------------------------------------|
| `segment_id`  | string  | Yes      |         | Unique identifier                       |
| `type`        | string  | Yes      |         | "straight", "elbow", "branch", etc.     |
| `material`    | string  | Yes      | "galv." | E.g., "galvanized", "aluminum", "SS"    |
| `size`        | object  | Yes      |         | {width: number, height: number, diameter: number (if round)} |
| `length`      | number  | Yes      |         | Linear feet or meters                   |
| `airflow`     | number  | No       | calc'd  | Passed down from upstream (or manual)   |
| `velocity`    | number  | No       | calc'd  | Calculated by logic                     |
| `pressure_loss`| number | No       | calc'd  | Calculated by logic                     |
| `warnings`    | array   | No       | []      | List of warning objects                  |

---

## 7. Equipment Schema

| Field         | Type    | Required | Default | Notes                                 |
|---------------|---------|----------|---------|---------------------------------------|
| `equipment_id`| string  | Yes      |         | Unique identifier                     |
| `type`        | string  | Yes      |         | E.g., "AHU", "VAV", "Fan Coil", etc.  |
| `manufacturer`| string  | No       |         | Optional                              |
| `model`       | string  | No       |         | Optional                              |
| `catalog_data`| object  | No       |         | User-defined or catalog-lookup fields |
| `airflow`     | number  | Yes      |         | CFM/L/s                               |
| `static_pressure`| number| No      |         | For advanced/pro calculations         |

---

## 8. Warning Object

| Field         | Type    | Required | Notes                                    |
|---------------|---------|----------|------------------------------------------|
| `warning_id`  | string  | Yes      | Unique identifier                        |
| `rule_id`     | string  | Yes      | Corresponds to a validation rule (see logic-validators.md) |
| `message`     | string  | Yes      | Human-readable description               |
| `severity`    | string  | Yes      | "info", "warning", "critical"            |
| `source_id`   | string  | Yes      | `room_id` or `segment_id` or `project_id`|
| `code_ref`    | string  | No       | SMACNA/ASHRAE/UL section, if available   |

---

## 9. Example Project JSON

```json
{
  "project_name": "Sample School Project",
  "user_name": "Alice",
  "contractor_name": "ABC Mechanical",
  "project_location": "Salt Lake City, UT",
  "codes": ["SMACNA", "ASHRAE"],
  "computational_properties": {
    "default_velocity": 1200,
    "pressure_class": "Medium",
    "altitude": 4200,
    "r_value": 4.2,
    "friction_rate": 0.08
  },
  "rooms": [
    {
      "room_id": "room-1",
      "name": "Classroom 1",
      "function": "classroom",
      "dimensions": {"length": 30, "width": 20, "height": 10},
      "airflow": 600,
      "outlets": []
    }
  ],
  "segments": [
    {
      "segment_id": "seg-1",
      "type": "straight",
      "material": "galvanized",
      "size": {"width": 12, "height": 10},
      "length": 25,
      "airflow": 600,
      "velocity": 1200,
      "pressure_loss": 0.06,
      "warnings": []
    }
  ],
  "equipment": [
    {
      "equipment_id": "eq-1",
      "type": "AHU",
      "manufacturer": "Carrier",
      "model": "35X",
      "airflow": 2000,
      "static_pressure": 2.2
    }
  ],
  "created_at": "2025-07-13T18:00:00Z",
  "last_modified": "2025-07-13T18:05:00Z"
}
