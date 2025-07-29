# Project Structure

This document provides a comprehensive overview of the SizeWise Suite project structure, explaining the organization of directories, files, and their purposes.

## Root Directory Structure

```
SizeWise_Suite_App/
├── frontend/                 # Next.js 15 frontend application
├── backend/                  # Python Flask backend API
├── auth-server/             # Authentication server
├── docs/                    # Comprehensive documentation
├── scripts/                 # Build and deployment scripts
├── tests/                   # Cross-platform integration tests
├── .github/                 # GitHub workflows and templates
├── .vscode/                 # VS Code configuration
├── package.json             # Root package configuration
├── requirements.txt         # Python dependencies
├── docker-compose.yml       # Docker orchestration
└── README.md               # Project overview
```

## Frontend Structure (Next.js 15)

The frontend follows Next.js 15 App Router conventions with a feature-centric architecture:

```
frontend/
├── app/                     # Next.js app directory
│   ├── (auth)/             # Authentication route group
│   │   ├── login/          # Login page
│   │   └── register/       # Registration page
│   ├── dashboard/          # Main application dashboard
│   │   ├── page.tsx        # Dashboard page component
│   │   └── layout.tsx      # Dashboard layout
│   ├── api/                # API routes (Next.js API)
│   │   ├── auth/           # Authentication endpoints
│   │   └── calculations/   # Calculation proxy endpoints
│   ├── globals.css         # Global styles and Tailwind
│   ├── layout.tsx          # Root layout component
│   └── page.tsx            # Home page component
├── components/             # Reusable React components
│   ├── glassmorphism/      # Glass effect UI components
│   │   ├── GlassEffect.tsx # Base glass wrapper
│   │   ├── GlassButton.tsx # Glass button component
│   │   ├── GlassCard.tsx   # Glass card component
│   │   ├── GlassDock.tsx   # Icon dock component
│   │   └── GlassFilter.tsx # SVG filter effects
│   ├── ui/                 # Base UI components
│   │   ├── Button.tsx      # Button variants
│   │   ├── Input.tsx       # Form inputs
│   │   ├── Modal.tsx       # Modal dialogs
│   │   └── Card.tsx        # Card layouts
│   ├── canvas/             # 3D workspace components
│   │   ├── Canvas3D.tsx    # Three.js canvas wrapper
│   │   ├── Room.tsx        # Room drawing component
│   │   └── Segment.tsx     # Duct segment component
│   ├── forms/              # Form components
│   │   ├── AuthForm.tsx    # Authentication forms
│   │   └── CalculationForm.tsx # Calculation input forms
│   └── auth/               # Authentication components
│       ├── LoginForm.tsx   # Login form component
│       ├── RegisterForm.tsx # Registration form
│       └── AuthProvider.tsx # Auth context provider
├── lib/                    # Utilities and configurations
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication hook
│   │   ├── useCanvas.ts    # Canvas interaction hook
│   │   └── useCalculations.ts # Calculation hook
│   ├── utils/              # Helper functions
│   │   ├── calculations.ts # Calculation utilities
│   │   ├── validation.ts   # Input validation
│   │   └── formatting.ts   # Data formatting
│   ├── api.ts              # API client configuration
│   ├── auth.ts             # Authentication utilities
│   └── constants.ts        # Application constants
├── stores/                 # Zustand state management
│   ├── authStore.ts        # Authentication state
│   ├── projectStore.ts     # Project management state
│   ├── canvasStore.ts      # Canvas/drawing state
│   └── calculationStore.ts # Calculation state
├── types/                  # TypeScript type definitions
│   ├── auth.ts             # Authentication types
│   ├── project.ts          # Project data types
│   ├── calculations.ts     # Calculation types
│   └── canvas.ts           # Canvas/3D types
├── public/                 # Static assets
│   ├── icons/              # Application icons
│   ├── images/             # Images and graphics
│   └── manifest.json       # PWA manifest
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Frontend dependencies
```

## Backend Structure (Flask)

The backend follows a service-oriented architecture with clear separation of concerns:

```
backend/
├── api/                    # API route handlers
│   ├── __init__.py         # API blueprint registration
│   ├── auth.py             # Authentication endpoints
│   ├── calculations.py     # Calculation endpoints
│   ├── projects.py         # Project management endpoints
│   └── health.py           # Health check endpoints
├── models/                 # Data models and schemas
│   ├── __init__.py         # Model exports
│   ├── user.py             # User data model
│   ├── project.py          # Project data model
│   ├── calculation.py      # Calculation result model
│   └── base.py             # Base model class
├── services/               # Business logic services
│   ├── __init__.py         # Service exports
│   ├── auth_service.py     # Authentication logic
│   ├── calculation_service.py # HVAC calculations
│   ├── project_service.py  # Project management
│   └── standards_service.py # Standards compliance
├── utils/                  # Utility functions
│   ├── __init__.py         # Utility exports
│   ├── validation.py       # Input validation
│   ├── calculations.py     # Calculation helpers
│   ├── standards.py        # Standards compliance
│   └── formatting.py       # Data formatting
├── tests/                  # Backend tests
│   ├── __init__.py         # Test configuration
│   ├── test_auth.py        # Authentication tests
│   ├── test_calculations.py # Calculation tests
│   └── test_projects.py    # Project tests
├── migrations/             # Database migrations
│   └── versions/           # Migration versions
├── config/                 # Configuration files
│   ├── __init__.py         # Config exports
│   ├── development.py      # Development config
│   ├── production.py       # Production config
│   └── testing.py          # Testing config
├── app.py                  # Flask application entry point
├── requirements.txt        # Python dependencies
└── .env.example            # Environment variables template
```

## Authentication Server

Separate authentication service for scalable user management:

```
auth-server/
├── src/                    # Source code
│   ├── controllers/        # Request handlers
│   ├── models/             # User models
│   ├── services/           # Auth services
│   └── utils/              # Utilities
├── tests/                  # Authentication tests
├── config/                 # Configuration
├── package.json            # Dependencies
└── README.md               # Auth server documentation
```

## Documentation Structure

Comprehensive documentation organized by audience:

```
docs/
├── README.md               # Documentation index
├── user-guide/             # End-user documentation
│   ├── README.md           # User guide index
│   ├── getting-started.md  # Quick start guide
│   ├── air-duct-sizer/     # Module-specific guides
│   ├── features/           # Feature documentation
│   └── troubleshooting.md  # User troubleshooting
├── developer-guide/        # Developer documentation
│   ├── README.md           # Developer guide index
│   ├── getting-started.md  # Development setup
│   ├── architecture/       # System architecture
│   │   ├── overview.md     # Architecture overview
│   │   ├── project-structure.md # This document
│   │   ├── technology-stack.md # Tech stack details
│   │   └── decisions/      # Architecture decisions
│   ├── api-reference/      # API documentation
│   ├── contributing.md     # Contribution guidelines
│   ├── testing.md          # Testing guidelines
│   └── modules/            # Module-specific docs
├── operations/             # Deployment and operations
│   ├── README.md           # Operations index
│   ├── deployment/         # Deployment guides
│   ├── docker/             # Docker documentation
│   ├── monitoring.md       # System monitoring
│   └── troubleshooting.md  # Ops troubleshooting
├── project-management/     # Project processes
│   ├── README.md           # PM index
│   ├── pr-guidelines.md    # PR process
│   ├── review-process.md   # Code review
│   └── stakeholder/        # Stakeholder materials
└── reference/              # Reference materials
    ├── README.md           # Reference index
    ├── standards/          # HVAC standards
    ├── glossary.md         # Terminology
    └── changelog.md        # Project changelog
```

## Key Architectural Patterns

### Feature-Centric Organization
- Each major tool (air-duct-sizer, grease-duct-sizer, etc.) is organized as a feature
- Features contain their own components, hooks, services, stores, and types
- Shared functionality is placed in common directories

### Separation of Concerns
- **Frontend**: UI components, state management, user interactions
- **Backend**: Business logic, calculations, data persistence
- **Auth Server**: User authentication and authorization
- **Documentation**: Comprehensive guides for all audiences

### Modular Architecture
- Components are designed for reusability and testability
- Services follow dependency injection patterns
- Clear interfaces between layers

### Standards Compliance
- HVAC standards (SMACNA, NFPA, ASHRAE) are integrated throughout
- Validation occurs at multiple layers
- Compliance checking is built into calculation workflows

## Development Workflow

### Local Development
1. **Backend**: Flask development server on port 5000
2. **Frontend**: Next.js development server on port 3000
3. **Auth Server**: Authentication service on port 8000
4. **Documentation**: MkDocs server on port 8080

### Testing Structure
- **Unit Tests**: Component and function level testing
- **Integration Tests**: API and workflow testing
- **E2E Tests**: Full application testing with Playwright
- **Performance Tests**: Load and stress testing

### Build and Deployment
- **Development**: Local development servers
- **Staging**: Docker containers for testing
- **Production**: Optimized builds with Docker orchestration

---

*This project structure is designed to support scalable development, clear separation of concerns, and maintainable code organization. For specific implementation details, refer to the individual module documentation.*
