# 💰 Estimating App Structure

The Estimating App lives under `app/tools/estimating-app/` and contains all logic, data, and tests for HVAC takeoff and bidding.

```
app/tools/estimating-app/
├── components/   # UI widgets like takeoff tables and bid summary panels
├── calculations/ # Core estimating math (labor, material, markup)
├── validators/   # Validation logic for schedules and code compliance
├── schemas/      # JSON schemas for takeoff and export formats
├── ui/           # Layout and theming files
├── data/         # Sample takeoffs and default rate tables
├── docs/         # Module-specific guides
├── tests/        # Jest unit/integration tests
└── exports/      # Export scripts for Excel, PDF, CSV
```

All JSON data is validated with AJV/Zod and the module integrates with services in `/services/` for exporting bids.
