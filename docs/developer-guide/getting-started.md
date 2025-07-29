# Developer Getting Started Guide

**📍 Navigation:** [Documentation Home](../README.md) > [Developer Guide](README.md) > Getting Started

Welcome to SizeWise Suite development! This comprehensive guide will help you set up your development environment and start contributing to the project.

## Prerequisites

### Required Software
- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher (or yarn 3.0+)
- **Python**: Version 3.9 or higher
- **Git**: Version 2.30 or higher

### Recommended Tools
- **VS Code**: With recommended extensions (see `.vscode/extensions.json`)
- **Docker**: For containerized development (optional)
- **Postman**: For API testing

### System Requirements
- **RAM**: 8GB+ recommended for development
- **Storage**: 5GB+ free disk space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)

## Quick Setup

### 1. Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/engryamato/SizeWise_Suite_App.git
cd SizeWise_Suite_App

# Install root dependencies (for testing and tooling)
npm install
```

### 2. Backend Setup

```bash
# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 4. Database Setup

```bash
# Initialize database (from backend directory)
cd backend
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"
```

## Development Workflow

### Starting Development Servers

**Option 1: Using npm scripts (Recommended)**
```bash
# Start both backend and frontend
npm run start:dev

# Or start individually:
# Backend only
npm run start:backend

# Frontend only (in another terminal)
npm run dev
```

**Option 2: Manual startup**
```bash
# Terminal 1: Backend Server
cd backend
python app.py
# Server runs on http://localhost:5000

# Terminal 2: Frontend Server
cd frontend
npm run dev
# Server runs on http://localhost:3000
```

### Accessing the Application
- **Frontend**: http://localhost:3000 (Next.js application)
- **Backend API**: http://localhost:5000 (Flask API)
- **API Documentation**: http://localhost:5000/docs (when available)

## Environment Configuration

### Frontend Environment (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_ENABLE_DEBUG=true
```

### Backend Environment (.env)
```env
FLASK_ENV=development
FLASK_DEBUG=true
SECRET_KEY=your-secret-key-for-development
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///development.db
CORS_ORIGINS=http://localhost:3000
```

## Project Structure

### Frontend Structure (Next.js 15)
```
frontend/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Main application
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # Reusable components
│   ├── glassmorphism/    # Glass effect components
│   ├── ui/               # UI components
│   └── forms/            # Form components
├── lib/                  # Utilities and configurations
├── stores/               # Zustand stores
├── types/                # TypeScript definitions
└── public/               # Static assets
```

### Backend Structure (Flask)
```
backend/
├── api/                  # API route handlers
├── models/               # Data models
├── services/             # Business logic
├── utils/                # Utility functions
├── tests/                # Test files
├── migrations/           # Database migrations
└── app.py               # Flask application entry
```

## Development Scripts

### Frontend Scripts
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting and formatting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Testing
npm run test
npm run test:watch
npm run test:coverage
```

### Backend Scripts
```bash
# Development server
python app.py

# Testing
python -m pytest
python -m pytest --cov=.

# Code formatting
black .
isort .

# Linting
flake8 .
mypy .
```

### Root Scripts
```bash
# Run all tests
npm run test:all

# Format all code
npm run format

# Lint all code
npm run lint:all

# Build for production
npm run build:all
```

## Development Guidelines

### Code Style

**Frontend (TypeScript/React)**
- Use TypeScript for all new code
- Follow React functional components with hooks
- Use Tailwind CSS for styling
- Implement proper error boundaries
- Write unit tests for components and utilities

**Backend (Python)**
- Follow PEP 8 style guidelines
- Use type hints for all functions
- Implement proper error handling
- Write unit tests for all endpoints
- Document API endpoints with docstrings

### Git Workflow

**Branch Naming Convention**
- `feature/canvas-drawing-engine`
- `bugfix/calculation-validation-error`
- `hotfix/authentication-security-issue`

**Commit Message Format**
Follow conventional commits:
```
feat(canvas): add room drawing functionality
fix(auth): resolve JWT token expiration issue
docs(api): update endpoint documentation
test(calc): add unit tests for duct sizing
```

## Testing Strategy

### Frontend Testing
```bash
# Unit tests (Jest + React Testing Library)
npm test

# E2E tests (Playwright)
npm run test:e2e

# Component testing
npm run test:components
```

### Backend Testing
```bash
# Unit tests
python -m pytest

# API integration tests
python -m pytest tests/integration/

# Coverage report
python -m pytest --cov=api --cov-report=html
```

## Debugging

### Frontend Debugging
- **React Developer Tools**: Browser extension for React debugging
- **VS Code Debugging**: Launch configuration available
- **Browser DevTools**: Network tab for API calls, Console for errors

### Backend Debugging
```python
# Python debugger
import pdb; pdb.set_trace()

# Flask debug mode
export FLASK_DEBUG=1
python app.py
```

## Common Development Tasks

### Adding a New Feature
1. Create feature branch: `git checkout -b feature/new-feature`
2. Implement frontend components in `frontend/components/`
3. Add backend API endpoints in `backend/api/`
4. Write tests for both frontend and backend
5. Update documentation
6. Submit pull request

### Adding a New API Endpoint
1. Create route handler in `backend/api/`
2. Add data models if needed in `backend/models/`
3. Implement business logic in `backend/services/`
4. Write unit tests
5. Update API documentation

### Adding a New Component
1. Create component in `frontend/components/`
2. Add TypeScript types in `frontend/types/`
3. Write unit tests
4. Add to component exports
5. Update Storybook if applicable

## Troubleshooting

### Common Issues

**Frontend Issues**
- **Module not found**: Check import paths and dependencies
- **Build errors**: Clear `.next` cache: `rm -rf .next && npm run dev`
- **Type errors**: Update TypeScript definitions

**Backend Issues**
- **Import errors**: Check Python path and virtual environment
- **Database errors**: Verify database connection and run migrations
- **CORS errors**: Check CORS configuration in Flask app

**Environment Issues**
- **Port conflicts**: Change ports in environment files
- **Permission errors**: Check file permissions and user access
- **Path issues**: Verify working directory and file paths

### Getting Help
1. Check existing GitHub issues
2. Review documentation in `docs/` directory
3. Ask in team discussions or create new issue
4. Contact maintainers for urgent issues

## Next Steps

### For New Contributors
1. Read the [Contributing Guidelines](contributing.md)
2. Review [Architecture Overview](architecture/overview.md)
3. Explore [API Reference](api-reference/)
4. Check [Project Structure](architecture/project-structure.md)

### For Core Development
1. Review [Module Development Guide](modules/creating-modules.md)
2. Understand [Testing Requirements](testing.md)
3. Learn [Deployment Process](../operations/deployment/)
4. Study [Performance Guidelines](performance.md)

---

**Ready to start developing?** Run `npm run start:dev` and begin exploring the SizeWise Suite codebase!

## 📚 Related Documentation

- **[Contributing Guidelines](contributing.md)**: Development workflow and contribution process
- **[Project Structure](architecture/project-structure.md)**: Understanding the codebase organization
- **[API Reference](api-reference/README.md)**: Complete API documentation
- **[Troubleshooting](../operations/troubleshooting.md)**: Common development issues and solutions

**📍 Navigation:** [Documentation Home](../README.md) > [Developer Guide](README.md) > Getting Started
