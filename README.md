# SizeWise Suite

A modular, offline-capable HVAC engineering and estimating platform designed to unify duct sizing, vent design, and cost estimating in a single, standards-driven workspace.

## Overview

SizeWise Suite is specifically crafted for:
- **Mechanical Engineers**: Efficiently validate duct and vent designs against industry standards
- **Estimators**: Conduct precise quantity takeoffs and cost estimations
- **QA Professionals**: Utilize built-in validation features for standards compliance
- **Project Managers**: Access real-time project insights regarding costs, progress, and compliance

## Core Features

- **Unified HVAC Toolchain**: One platform for duct sizing, vent design, and estimating
- **Standards-Aligned Logic**: Integrated dynamic validation per SMACNA, NFPA, and ASHRAE
- **Offline-First Design**: Reliable operation in remote or disconnected environments
- **Structured Export System**: Automated PDF, Excel, CSV, and BIM-compatible exports
- **Plugin-Ready Architecture**: Highly scalable with minimal integration overhead

## Core Modules (Phase 0.0)

### Air Duct Sizer
Friction-loss sizing per SMACNA standards, including velocity and gauge validation.

### Grease Duct Sizer
Comprehensive NFPA 96 compliance, hood airflow optimization, and clearance management.

### Engine Exhaust Sizer
High-velocity exhaust design for generators and Combined Heat and Power (CHP) systems.

### Boiler Vent Sizer
Detailed sizing for Category I–IV appliance vents, incorporating draft pressures and temperature management.

### Estimating App
Comprehensive estimating solution addressing labor/material takeoffs and automated bid exports.

## Technology Stack

- **Backend**: Python (Flask) for API, calculations, and export logic
- **Frontend**: Modular JavaScript (offline-first, upgradeable to React/TypeScript)
- **Documentation**: MkDocs (guides), Sphinx (API)
- **Local Data**: IndexedDB/JSON for persistent offline storage
- **Deployment**: Progressive Web App (PWA) with future Electron desktop support

## Project Structure

```
├── app/
│   └── modules/           # Individual HVAC modules
│       ├── air-duct-sizer/
│       ├── grease-duct-sizer/
│       ├── engine-exhaust-sizer/
│       ├── boiler-vent-sizer/
│       └── estimating-app/
├── core/                  # Shared calculation logic and validation
│   ├── calculations/
│   ├── validation/
│   ├── units/
│   └── standards/
├── services/              # API, storage, and export services
│   ├── api/
│   ├── storage/
│   └── export/
├── frontend/              # UI components and PWA assets
│   ├── components/
│   ├── styles/
│   ├── assets/
│   └── workers/
├── backend/               # Flask API and calculation endpoints
│   ├── api/
│   ├── calculations/
│   └── exports/
├── docs/                  # Documentation
│   ├── user-guides/
│   ├── api-reference/
│   └── examples/
└── tests/                 # Testing infrastructure
    ├── unit/
    ├── integration/
    └── e2e/
```

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- Modern web browser with PWA support

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sizewise-suite
   ```

2. Set up Python environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Install frontend dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   # Backend
   python backend/app.py
   
   # Frontend (in another terminal)
   npm run dev
   ```

5. Open your browser to `http://localhost:3000`

## Development

### Architecture Principles

- **Modular Design**: Each HVAC tool is a self-contained module
- **Schema-Driven**: AJV/Zod validation ensures data integrity
- **Offline-First**: All functionality works without internet connection
- **Standards Compliance**: Built-in validation against HVAC industry codes

### Adding New Modules

1. Create module directory structure in `app/modules/`
2. Implement calculation logic in `logic/`
3. Create UI components in `ui/`
4. Define schemas in `schemas/`
5. Add tests in `tests/`

## Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Python backend tests
python -m pytest tests/
```

## Documentation

- User guides: `docs/user-guides/`
- API reference: `docs/api-reference/`
- Examples: `docs/examples/`

Build documentation:
```bash
# User guides (MkDocs)
mkdocs serve

# API reference (Sphinx)
cd docs/api-reference
make html
```

## Contributing

1. Follow the established folder structure and naming conventions
2. Maintain sorted lists for files, arrays, and exports
3. Update all relevant references when making structural changes
4. Run tests and ensure they pass before committing
5. Update documentation for any public API changes

## License

[License information to be added]

## Support

For questions and support, please refer to the documentation or create an issue in the repository.
