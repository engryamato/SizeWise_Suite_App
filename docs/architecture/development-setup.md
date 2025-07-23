# Development Setup - Air Duct Sizer

_Last updated: 2025-07-13_  
_Maintainer: Development Team_

---

## Overview

This guide covers local development environment setup, contribution guidelines, and development workflows for the Air Duct Sizer project.

---

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

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/engryamato/SizeWise_Suite_App.git
cd SizeWise_Suite_App
git checkout air-duct-sizer
```

### 2. Install Dependencies

#### Frontend Dependencies
```bash
cd frontend
npm install
```

#### Backend Dependencies
```bash
cd ../backend
pip install -r ../requirements.txt
```

#### Root Dependencies (for testing and tooling)
```bash
cd ..
npm install
```

### 3. Environment Configuration

#### Frontend Environment
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_ENABLE_DEBUG=true
```

#### Backend Environment
Create `backend/.env`:
```env
FLASK_ENV=development
FLASK_DEBUG=true
SECRET_KEY=your-secret-key-for-development
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///development.db
CORS_ORIGINS=http://localhost:3000
```

### 4. Database Setup

```bash
cd backend
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"
```

---

## Development Workflow

### Starting Development Servers

#### Terminal 1: Backend Server
```bash
cd backend
python app.py
# Server runs on http://localhost:5000
```

#### Terminal 2: Frontend Server
```bash
cd frontend
npm run dev
# Server runs on http://localhost:3001
```

#### Terminal 3: Testing (optional)
```bash
npm run test:watch
```

### Development Scripts

#### Frontend Scripts
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Testing
npm run test
npm run test:watch
npm run test:coverage
```

#### Backend Scripts
```bash
# Development server
python app.py

# Run tests
python -m pytest

# Run with coverage
python -m pytest --cov=.

# Format code
black .
isort .

# Lint code
flake8 .
mypy .
```

#### Root Scripts
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

---

## Code Organization

### Frontend Structure
```
frontend/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Main application
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── canvas/           # Canvas-related components
│   ├── ui/               # UI components
│   └── forms/            # Form components
├── lib/                  # Utilities and configurations
├── stores/               # Zustand stores
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

### Backend Structure
```
backend/
├── api/                  # API route handlers
├── models/               # Data models
├── services/             # Business logic
├── utils/                # Utility functions
├── tests/                # Test files
└── migrations/           # Database migrations
```

---

## Development Guidelines

### Code Style

#### Frontend (TypeScript/React)
- Use TypeScript for all new code
- Follow React functional components with hooks
- Use Tailwind CSS for styling
- Implement proper error boundaries
- Write unit tests for components and utilities

#### Backend (Python)
- Follow PEP 8 style guidelines
- Use type hints for all functions
- Implement proper error handling
- Write unit tests for all endpoints
- Document API endpoints with docstrings

### Git Workflow

#### Branch Naming
- `feature/canvas-drawing-engine`
- `bugfix/calculation-validation-error`
- `hotfix/authentication-security-issue`

#### Commit Messages
Follow conventional commits format:
```
feat(canvas): add room drawing functionality
fix(auth): resolve JWT token expiration issue
docs(api): update endpoint documentation
test(calc): add unit tests for duct sizing
```

#### Pull Request Process
1. Create feature branch from `air-duct-sizer`
2. Implement changes with tests
3. Run full test suite
4. Create PR with description and screenshots
5. Request code review
6. Address feedback and merge

---

## Testing Strategy

### Frontend Testing

#### Unit Tests (Jest + React Testing Library)
```bash
# Run specific test file
npm test components/canvas/Room.test.tsx

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

#### E2E Tests (Cypress)
```bash
# Open Cypress UI
npm run cypress:open

# Run headless tests
npm run cypress:run
```

### Backend Testing

#### Unit Tests (pytest)
```bash
# Run all tests
python -m pytest

# Run specific test file
python -m pytest tests/test_calculations.py

# Run with coverage
python -m pytest --cov=api --cov-report=html
```

#### API Tests
```bash
# Run API integration tests
python -m pytest tests/integration/
```

---

## Debugging

### Frontend Debugging

#### Browser DevTools
- React Developer Tools extension
- Redux DevTools for state inspection
- Network tab for API calls
- Console for error messages

#### VS Code Debugging
Launch configuration in `.vscode/launch.json`:
```json
{
  "name": "Next.js: debug client-side",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/frontend/node_modules/.bin/next",
  "args": ["dev"],
  "cwd": "${workspaceFolder}/frontend"
}
```

### Backend Debugging

#### Python Debugger
```python
import pdb; pdb.set_trace()  # Set breakpoint
```

#### Flask Debug Mode
```bash
export FLASK_DEBUG=1
python app.py
```

---

## Performance Monitoring

### Frontend Performance
- Use React DevTools Profiler
- Monitor bundle size with `npm run analyze`
- Check Core Web Vitals in browser
- Use Lighthouse for performance audits

### Backend Performance
- Monitor API response times
- Use Flask profiling tools
- Check database query performance
- Monitor memory usage

---

## Deployment

### Development Deployment
```bash
# Build and test locally
npm run build:all
npm run test:all

# Deploy to staging
npm run deploy:staging
```

### Production Deployment
```bash
# Create production build
npm run build:production

# Deploy to production
npm run deploy:production
```

---

## Troubleshooting

### Common Issues

#### Frontend Issues
- **Module not found**: Check import paths and dependencies
- **Build errors**: Clear `.next` cache and reinstall dependencies
- **Type errors**: Update TypeScript definitions

#### Backend Issues
- **Import errors**: Check Python path and virtual environment
- **Database errors**: Verify database connection and migrations
- **CORS errors**: Check CORS configuration in Flask app

### Getting Help

1. Check existing GitHub issues
2. Review documentation in `docs/` directory
3. Ask in team chat or create new issue
4. Contact maintainers for urgent issues

---

## Contributing

### Before Contributing
1. Read the business documentation in `docs/developer-guide/air-duct-sizer-guide/`
2. Review technical architecture documents
3. Set up development environment
4. Run existing tests to ensure setup is correct

### Contribution Process
1. Create issue for new features or bugs
2. Discuss approach with team
3. Implement changes with tests
4. Submit pull request with clear description
5. Address code review feedback
6. Merge after approval

---

*This development setup guide should be updated as the project evolves and new tools or processes are introduced.*
