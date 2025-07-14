# Estimating App – Folder Rationale and Usage
**For the SizeWise Suite Platform**
_Last updated: 2025-07-13_

---

The `app/tools/estimating-app` directory centralizes all estimation logic for SizeWise Suite. Each subfolder fulfills a specific role and mirrors the overall standards-driven philosophy of the platform.

## Folder Overview

| Folder | Purpose |
| ------ | ------- |
| **components/** | Reusable UI widgets such as takeoff tables and bid summaries. |
| **calculations/** | Core math for labor, material, and markup computations. |
| **validators/** | Validates schedules and takeoffs against SMACNA and project rules. |
| **schemas/** | AJV/Zod schemas defining all data models (takeoff, schedule, export). |
| **ui/** | Theme files and layouts supporting metric/imperial workflows. |
| **data/** | Example bids, default rate tables, and sample takeoffs. |
| **docs/** | Developer and estimator guides for onboarding. |
| **tests/** | Unit and integration tests (≥85% coverage target). |
| **exports/** | Scripts for generating Excel, PDF, and CSV bids. |

## Usage

1. **Open the Estimating App** from the SizeWise Suite interface.
2. **Create or import a takeoff** using forms in `components/`.
3. **Adjust labor and material rates** stored in `data/` or pull defaults from `/core/` services.
4. **Run validation** to ensure compliance with project standards via the modules in `validators/`.
5. **Export bids** using the scripts found in `exports/` for Excel, PDF, or CSV output.

All modules are testable in isolation, and every `.json` file under `schemas/` or `data/` requires schema validation. This structure ensures easy maintenance and auditability while supporting future estimating verticals.
