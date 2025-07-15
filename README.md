# SizeWise Suite

A modular, offline-capable HVAC engineering and estimating platform designed to unify duct sizing, vent design, and cost estimating in a single, standards-driven workspace with beautiful glassmorphism UI.

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
- **Glassmorphism UI**: Beautiful glass-effect components with backdrop blur and animations
- **Dual Frontend Options**: Choose between HTML/JS frontend or advanced Next.js frontend

## Frontend Options

### 1. HTML/CSS/JS Frontend (Original)
- Lightweight and fast
- Offline-first design
- Progressive Web App capabilities
- Located in `frontend/` directory

### 2. Next.js Glassmorphism Frontend (New)
- Modern React-based interface
- Beautiful glassmorphism UI components
- TypeScript for type safety
- Tailwind CSS with custom animations
- Located in `frontend-nextjs/` directory

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
- **Frontend Options**:
  - HTML/CSS/JS (offline-first, PWA)
  - Next.js 15 with TypeScript and glassmorphism UI
- **Documentation**: MkDocs (guides), Sphinx (API)
- **Local Data**: IndexedDB/JSON for persistent offline storage
- **Deployment**: Progressive Web App (PWA) with future Electron desktop support

## Project Structure

```
├── app/
│   ├── assets/
│   ├── config/
│   │   └── environment/
│   ├── core/
│   │   ├── calculations/
│   │   ├── validators/
│   │   ├── schemas/
│   │   ├── registrars/
│   │   └── i18n/
│   ├── data/
│   │   ├── seeds/
│   │   ├── backups/
│   │   └── examples/
│   ├── docs/
│   │   ├── architecture/
│   │   ├── api/
│   │   ├── guides/
│   │   ├── i18n/
│   │   └── tools/
│   ├── hooks/
│   ├── i18n/
│   ├── plugins/
│   ├── services/
│   ├── simulations/
│   ├── static/
│   ├── templates/
│   ├── tests/
│   └── tools/
│       ├── duct-sizer/
│       ├── grease-sizer/
│       ├── boiler-sizer/
│       ├── engine-exhaust/
│       └── estimating-app/
│           ├── components/
│           ├── calculations/
│           ├── validators/
│           ├── schemas/
│           ├── ui/
│           ├── data/
│           ├── docs/
│           ├── tests/
│           └── exports/
├── backend/
├── core/
├── frontend/
├── frontend-nextjs/
│   ├── app/
│   │   ├── demo/
│   │   │   └── page.tsx         # Components demo page
│   │   ├── globals.css          # Global styles with keyframes
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Main page with demo
│   ├── components/
│   │   └── glassmorphism/
│   │       ├── GlassEffect.tsx  # Base glass effect wrapper
│   │       ├── GlassDock.tsx    # Icon dock component
│   │       ├── GlassButton.tsx  # Glass button component
│   │       ├── GlassCard.tsx    # Glass card component
│   │       ├── GlassFilter.tsx  # SVG filter effects
│   │       └── index.ts         # Component exports
│   ├── next.config.js           # Next.js configuration
│   ├── tailwind.config.js       # Tailwind configuration with custom animations
│   └── package.json
├── docs/
├── scripts/
└── tests/
```

## Technologies Used

- **Next.js 15**: React framework with App Router
- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **tailwindcss-animate**: Additional animation utilities


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

4. **For Next.js Glassmorphism Frontend** (optional):
   ```bash
   cd frontend-nextjs
   npm install
   cd ..
   ```

5. Start the development server:

   **Option A: Original HTML Frontend**
   ```bash
   # Backend
   python backend/app.py

   # Frontend (in another terminal)
   npm run dev
   ```

   **Option B: Next.js Glassmorphism Frontend**
   ```bash
   # Backend
   python backend/app.py

   # Next.js Frontend (in another terminal)
   npm run dev:nextjs
   ```

6. Open your browser:
   - Original frontend: `http://localhost:3000`
   - Next.js frontend: `http://localhost:3000` (Next.js)

## Glassmorphism Components (Next.js Frontend)

The Next.js frontend includes several reusable glassmorphism components:

### GlassEffect
Base wrapper component that provides glass effect styling with backdrop blur, layered glass effects, and smooth transitions.

### GlassDock
Interactive icon dock with hover animations. Perfect for navigation or app launchers.

### GlassButton
Button component with glass effect and interactive animations. Supports both regular buttons and link buttons.

### GlassCard
Card component with glass effect, perfect for displaying content with beautiful backdrop blur.

### GlassFilter
SVG filter component that provides glass distortion effects using advanced SVG filters.

### Usage Examples

```tsx
import { GlassEffect, GlassButton, GlassDock } from '@/components/glassmorphism';

// Basic glass effect
<GlassEffect className="rounded-3xl p-6">
  <div className="text-white">Your content here</div>
</GlassEffect>

// Glass button
<GlassButton href="/calculator">
  <span className="text-white">Open Calculator</span>
</GlassButton>

// Glass dock
const icons = [
  { src: "/icon1.png", alt: "App 1" },
  { src: "/icon2.png", alt: "App 2" },
];
<GlassDock icons={icons} />
```

## Development

### Architecture Principles

- **Modular Design**: Each HVAC tool is a self-contained module
- **Schema-Driven**: AJV/Zod validation ensures data integrity
- **Offline-First**: All functionality works without internet connection
- **Standards Compliance**: Built-in validation against HVAC industry codes
- **Dual Frontend**: Choose between lightweight HTML or modern React interface

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
