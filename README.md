# SizeWise Suite

A modern Next.js-based HVAC engineering and estimating platform designed to unify duct sizing, vent design, and cost estimating in a single, standards-driven workspace with beautiful glassmorphism UI and 3D workspace.

## Overview

SizeWise Suite is specifically crafted for:
- **Mechanical Engineers**: Efficiently validate duct and vent designs against industry standards
- **Estimators**: Conduct precise quantity takeoffs and cost estimations
- **QA Professionals**: Utilize built-in validation features for standards compliance
- **Project Managers**: Access real-time project insights regarding costs, progress, and compliance

## Core Features

> **CI/CD Pipeline Status**: ✅ **FULLY CONFIGURED** - All critical fixes applied and tested

- **Unified HVAC Toolchain**: One platform for duct sizing, vent design, and estimating
- **Standards-Aligned Logic**: Integrated dynamic validation per SMACNA, NFPA, and ASHRAE
- **Offline-First Design**: Reliable operation in remote or disconnected environments
- **Structured Export System**: Automated PDF, Excel, CSV, and BIM-compatible exports
- **Plugin-Ready Architecture**: Highly scalable with minimal integration overhead
- **Glassmorphism UI**: Beautiful glass-effect components with backdrop blur and animations
- **3D Workspace**: Interactive Three.js-based 3D environment for duct system design
- **PDF Integration**: Import and overlay PDF plans in the 3D workspace
- **Modern Architecture**: Next.js with TypeScript for type safety and performance
- **🆕 Snap Logic System**: Advanced centerline drawing with magnetic snapping and SMACNA compliance

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

### Snap Logic System
Advanced centerline drawing with magnetic snapping, priority hierarchy, and automatic 3D conversion. Features include:
- **Magnetic Snapping**: Intelligent cursor attraction to endpoints, centerlines, and intersections
- **SMACNA Compliance**: Real-time validation against professional engineering standards
- **3D Conversion**: "Build Ductwork" functionality to convert centerlines to 3D geometry
- **Mid-span Branching**: Add branches anywhere along centerlines with fitting suggestions

## Technology Stack

- **Frontend**: Next.js 15 with React 18.3.1, TypeScript, and glassmorphism UI
- **3D Graphics**: Three.js for interactive 3D workspace and visualization
- **Styling**: Tailwind CSS with custom animations and glass effects
- **Backend**: Python (Flask) for API, calculations, and export logic
- **Database**: Multi-database architecture with offline-first design
  - **Dexie/IndexedDB**: Frontend offline storage (✅ Validated)
  - **SQLite**: Desktop application storage with encryption
  - **PostgreSQL**: Enterprise cloud features and microservices
  - **MongoDB**: Spatial data and complex geometries
- **Documentation**: MkDocs (guides), Sphinx (API)
- **State Management**: Zustand for client-side state management
- **Testing**: Jest for unit tests, Playwright for E2E testing
- **Deployment**: Next.js production build with future Electron desktop support

## Project Structure

```
SizeWise_Suite_App/
├── app/                         # Next.js application directory
│   ├── api/                     # API routes
│   ├── components/              # React components
│   │   ├── glassmorphism/       # Glass effect UI components
│   │   ├── ui/                  # Shared UI components
│   │   └── workspace/           # 3D workspace components
│   ├── features/                # Feature-specific modules
│   │   ├── air-duct-sizer/      # Air duct sizing module
│   │   ├── dashboard/           # Dashboard module
│   │   └── project-management/  # Project management
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility libraries
│   ├── stores/                  # Zustand state stores
│   ├── types/                   # TypeScript type definitions
│   └── globals.css              # Global styles
├── backend/                     # Python Flask backend
│   ├── app/                     # Flask application
│   │   ├── api/                 # API endpoints
│   │   ├── models/              # Database models
│   │   ├── services/            # Business logic
│   │   └── utils/               # Utility functions
│   ├── migrations/              # Database migrations
│   ├── tests/                   # Backend tests
│   └── requirements.txt         # Python dependencies
├── auth-server/                 # Authentication microservice
│   ├── app.py                   # Flask auth application
│   ├── models/                  # Auth database models
│   └── requirements.txt         # Auth dependencies
├── docs/                        # Documentation
│   ├── user-guide/              # User documentation
│   ├── developer-guide/         # Developer documentation
│   ├── operations/              # Operations and deployment
│   ├── project-management/      # Project management docs
│   └── reference/               # Reference materials
├── public/                      # Static assets
├── scripts/                     # Build and utility scripts
├── tests/                       # E2E and integration tests
├── docker-compose.yml           # Docker development setup
├── package.json                 # Node.js dependencies
└── README.md                    # This file
```

## Current Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **React 19**: Latest UI library with concurrent features
- **TypeScript 5**: Enhanced type safety and developer experience
- **Tailwind CSS 3**: Utility-first CSS framework
- **Three.js**: 3D graphics and interactive workspace
- **Zustand 4**: Lightweight state management

### Backend
- **Python 3.9+**: Backend runtime
- **Flask 2.3**: Web framework for APIs
- **SQLAlchemy**: Database ORM
- **PostgreSQL**: Production database
- **SQLite**: Development database

### Development Tools
- **Jest**: Unit testing framework
- **Playwright**: End-to-end testing
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Docker**: Containerization


## Getting Started

### Prerequisites

- **Node.js 18+** and **npm 9+**
- **Python 3.9+** with **pip**
- **Git** for version control
- **Docker** and **Docker Compose** (optional, for containerized development)
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/engryamato/SizeWise_Suite_App.git
   cd SizeWise_Suite_App
   ```

2. **Install all dependencies:**
   ```bash
   # Install all project dependencies
   npm run install:all
   ```

3. **Set up environment variables:**
   ```bash
   # Copy environment templates
   cp .env.example .env.local
   cp backend/.env.example backend/.env
   cp auth-server/.env.example auth-server/.env
   ```

4. **Start the development environment:**
   ```bash
   # Start all services (frontend, backend, auth server, database)
   npm run dev:all

   # Or use Docker for isolated environment
   npm run docker:dev
   ```

5. **Access the application:**
   - **Frontend**: `http://localhost:3000`
   - **Backend API**: `http://localhost:5000`
   - **Auth Server**: `http://localhost:5001`

For detailed setup instructions, see the [Developer Getting Started Guide](docs/developer-guide/getting-started.md).

## 🐳 Docker Deployment

### Quick Docker Setup (Recommended)

The fastest way to get SizeWise Suite running is using Docker. This method works on any system with Docker installed and provides a consistent environment.

**Prerequisites:**
- Docker 24.0+ and Docker Compose 2.0+
- 4GB+ RAM (8GB+ recommended for production)
- 20GB+ free disk space

**One-Command Development Setup:**
```bash
# Clone and start development environment
git clone https://github.com/engryamato/SizeWise_Suite_App.git
cd SizeWise_Suite_App
./scripts/docker-dev-setup.sh
```

**Access URLs:**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5050/api
- **Auth API:** http://localhost:5051/api

**Docker Management Commands:**
```bash
# Development
./scripts/docker-utils.sh dev-start    # Start development environment
./scripts/docker-utils.sh dev-stop     # Stop development environment
./scripts/docker-utils.sh dev-logs -f  # Follow logs

# Production
./scripts/docker-utils.sh prod-start   # Start production environment
./scripts/docker-utils.sh health       # Check service health
./scripts/docker-utils.sh backup       # Create database backup

# Utilities
./scripts/docker-utils.sh shell -s backend  # Open shell in backend container
./scripts/docker-utils.sh clean             # Clean up Docker resources
```

**Manual Docker Commands:**
```bash
# Development environment
docker-compose -f docker-compose.dev.yml up -d

# Production environment
docker-compose -f docker-compose.prod.yml --env-file docker/.env.prod up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Docker Architecture

The Docker setup includes:
- **Frontend Container**: Next.js with hot reloading (development) or optimized build (production)
- **Backend Container**: Python Flask API with auto-reload (development) or Gunicorn (production)
- **Auth Server Container**: Authentication microservice with JWT support
- **PostgreSQL Container**: Primary database with health checks
- **Redis Container**: Caching and session storage
- **NGINX Container**: Reverse proxy and load balancer (production only)

### Cross-Platform Compatibility

The Docker setup works consistently across:
- **Windows**: Docker Desktop with WSL2
- **macOS**: Docker Desktop (Intel and Apple Silicon)
- **Linux**: Docker Engine with Docker Compose

For detailed Docker documentation, see [docker/README.md](docker/README.md).

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
- **Modern Frontend**: Next.js with TypeScript, 3D workspace, and glassmorphism UI

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
npm run test:unit          # Jest unit tests
npm run test:e2e           # Playwright E2E tests
npm run test:backend       # Python backend tests

# Run tests with coverage
npm run test:coverage

# Backend tests specifically
cd backend && python -m pytest tests/
```

## Documentation

The documentation is organized into several sections:

- **[User Guide](docs/user-guide/)**: End-user documentation and tutorials
- **[Developer Guide](docs/developer-guide/)**: Development setup, API reference, and architecture
- **[Operations](docs/operations/)**: Deployment, monitoring, and troubleshooting
- **[Project Management](docs/project-management/)**: Project planning and management docs
- **[Reference](docs/reference/)**: Standards, specifications, and reference materials

### Quick Documentation Links

- **[Getting Started (Users)](docs/user-guide/getting-started.md)**: User installation and first steps
- **[Getting Started (Developers)](docs/developer-guide/getting-started.md)**: Development environment setup
- **[API Reference](docs/developer-guide/api-reference/)**: Complete API documentation
- **[Contributing Guide](docs/developer-guide/contributing.md)**: How to contribute to the project
- **[Troubleshooting](docs/operations/troubleshooting.md)**: Common issues and solutions

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/developer-guide/contributing.md) for detailed information on:

- Development workflow and branch strategy
- Coding standards and conventions
- Testing requirements
- Pull request process
- Community guidelines

### Quick Contributing Steps

1. Fork the repository and create a feature branch
2. Follow our coding standards and conventions
3. Add tests for new functionality
4. Update documentation as needed
5. Submit a pull request with a clear description

## License

Licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Support

For questions and support, please refer to the documentation or create an issue in the repository.
