# SizeWise Suite - Developer Onboarding Guide

**Version**: 2.0  
**Target Audience**: New developers joining the SizeWise Suite team  
**Estimated Onboarding Time**: 2-3 days (reduced from 5-7 days)  

## Welcome to SizeWise Suite! 🎉

This guide will help you get up and running with the SizeWise Suite codebase quickly and efficiently. Our modernized architecture makes onboarding faster and more intuitive.

## Prerequisites

### Required Knowledge
- **TypeScript/JavaScript**: Intermediate to advanced level
- **React/Next.js**: Familiarity with React hooks and Next.js patterns
- **Python/Flask**: Basic to intermediate backend development
- **Git**: Version control and collaboration workflows
- **HVAC Basics**: Understanding of HVAC systems (training provided)

### Development Environment
- **Node.js**: v18+ LTS
- **Python**: 3.11+
- **Git**: Latest version
- **VS Code**: Recommended IDE with extensions
- **Docker**: For local development (optional)

## Quick Start (30 minutes)

### 1. Repository Setup
```bash
# Clone the repository
git clone https://github.com/engryamato/SizeWise_Suite_App.git
cd SizeWise_Suite_App

# Install dependencies
npm install
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 2. Development Server
```bash
# Start frontend development server
npm run dev

# Start backend server (separate terminal)
python backend/app.py

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### 3. Verify Setup
- ✅ Frontend loads without errors
- ✅ Backend API responds to health check
- ✅ Authentication flow works
- ✅ HVAC calculations execute properly

## Architecture Overview (1 hour)

### Understanding the Codebase Structure

```
SizeWise_Suite_App/
├── frontend/                    # Next.js frontend application
│   ├── components/             # Modular React components
│   │   ├── analytics/          # Analytics dashboard modules
│   │   ├── auth/               # Authentication components
│   │   ├── hvac/               # HVAC-specific components
│   │   └── shared/             # Reusable components
│   ├── lib/                    # Utility libraries
│   │   ├── auth/               # Authentication managers
│   │   ├── errors/             # Error handling system
│   │   └── utils/              # Shared utilities
│   ├── pages/                  # Next.js pages and API routes
│   └── public/                 # Static assets
├── backend/                    # Flask backend application
│   ├── routes/                 # API route handlers
│   ├── services/               # Business logic services
│   ├── utils/                  # Backend utilities
│   └── config/                 # Configuration files
├── docs/                       # Documentation
├── tests/                      # Test suites
└── scripts/                    # Development scripts
```

### Key Architectural Concepts

#### 1. Modular Components
- **Small, focused components** (<500 lines each)
- **Single responsibility** principle
- **Reusable and testable** design
- **TypeScript interfaces** for type safety

#### 2. Authentication System
```typescript
// Modern authentication architecture
AuthenticationManager
├── SessionManager      // Session lifecycle
├── TokenManager        // JWT operations
├── LicenseValidator    // License validation
├── SuperAdminManager   // Admin authentication
└── SecurityLogger      // Audit logging
```

#### 3. Error Handling
```typescript
// Standardized error handling
try {
  const result = await apiCall();
  return result;
} catch (error) {
  return ErrorHandler.handle(error, {
    category: 'API_ERROR',
    severity: 'medium',
    context: { operation: 'apiCall' }
  });
}
```

## Development Workflow (2 hours)

### 1. Feature Development Process

#### Step 1: Create Feature Branch
```bash
# Create and switch to feature branch
git checkout -b feature/your-feature-name
```

#### Step 2: Follow Coding Standards
```typescript
// Example: Creating a new component
import React from 'react';
import { ComponentProps } from './types/ComponentTypes';
import { useErrorHandler } from '@/lib/errors/ErrorHandler';

interface MyComponentProps extends ComponentProps {
  title: string;
  onAction: (data: any) => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onAction,
  className = ''
}) => {
  const { handleError } = useErrorHandler();

  const handleClick = async () => {
    try {
      await onAction({ timestamp: Date.now() });
    } catch (error) {
      handleError(error, { component: 'MyComponent' });
    }
  };

  return (
    <div className={`my-component ${className}`}>
      <h2>{title}</h2>
      <button onClick={handleClick}>
        Execute Action
      </button>
    </div>
  );
};
```

#### Step 3: Write Tests
```typescript
// Example: Component test
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders title correctly', () => {
    render(<MyComponent title="Test Title" onAction={jest.fn()} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onAction when button clicked', () => {
    const mockAction = jest.fn();
    render(<MyComponent title="Test" onAction={mockAction} />);
    
    fireEvent.click(screen.getByText('Execute Action'));
    expect(mockAction).toHaveBeenCalled();
  });
});
```

#### Step 4: Run Quality Checks
```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build
```

### 2. Code Review Process

#### Before Submitting PR
- ✅ All tests pass
- ✅ TypeScript compilation successful
- ✅ Linting rules followed
- ✅ Documentation updated
- ✅ Performance impact assessed

#### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No performance regression
```

## Common Development Patterns (1 hour)

### 1. Creating New Components

#### Analytics Component Example
```typescript
// 1. Create types file
// components/analytics/types/NewWidgetTypes.ts
export interface NewWidgetProps {
  data: AnalyticsData;
  config: WidgetConfig;
  onUpdate?: (data: any) => void;
}

// 2. Create component
// components/analytics/components/NewWidget.tsx
import React from 'react';
import { NewWidgetProps } from '../types/NewWidgetTypes';
import { useAnalyticsData } from '../hooks/useAnalyticsData';

export const NewWidget: React.FC<NewWidgetProps> = ({
  data,
  config,
  onUpdate
}) => {
  const { processData, isLoading, error } = useAnalyticsData();

  // Component implementation
  return (
    <div className="new-widget">
      {/* Widget content */}
    </div>
  );
};
```

### 2. Adding API Endpoints

#### Backend Route Example
```python
# backend/routes/new_feature_routes.py
from flask import Blueprint, request, jsonify
from utils.error_responses import handle_error, success_response
from services.new_feature_service import NewFeatureService

new_feature_bp = Blueprint('new_feature', __name__)

@new_feature_bp.route('/api/new-feature', methods=['POST'])
def create_new_feature():
    try:
        data = request.get_json()
        
        # Validate input
        if not data or 'required_field' not in data:
            return handle_error('VALIDATION_ERROR', 'Missing required field')
        
        # Process request
        service = NewFeatureService()
        result = service.create_feature(data)
        
        return success_response(result)
        
    except Exception as e:
        return handle_error('INTERNAL_ERROR', str(e))
```

### 3. Error Handling Patterns

#### Frontend Error Handling
```typescript
import { ErrorHandler } from '@/lib/errors/ErrorHandler';

// In component
const handleApiCall = async () => {
  try {
    const result = await api.call();
    setData(result);
  } catch (error) {
    ErrorHandler.handle(error, {
      category: 'API_ERROR',
      severity: 'medium',
      context: { component: 'MyComponent', operation: 'fetchData' }
    });
  }
};
```

#### Backend Error Handling
```python
from utils.error_responses import handle_error

try:
    # Operation that might fail
    result = risky_operation()
    return success_response(result)
except ValidationError as e:
    return handle_error('VALIDATION_ERROR', str(e))
except DatabaseError as e:
    return handle_error('DATABASE_ERROR', str(e))
except Exception as e:
    return handle_error('INTERNAL_ERROR', str(e))
```

## Testing Guidelines (1 hour)

### 1. Unit Testing
```bash
# Run specific test file
npm test -- MyComponent.test.tsx

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

### 2. Integration Testing
```bash
# Run E2E tests
npm run test:e2e

# Run specific E2E test
npx playwright test auth-flow.spec.ts
```

### 3. Visual Regression Testing
```bash
# Update visual baselines
npm run test:visual -- --update-snapshots

# Run visual tests
npm run test:visual
```

## Debugging Tips (30 minutes)

### 1. Frontend Debugging
```typescript
// Use React DevTools
// Add debugging breakpoints
debugger;

// Console logging with context
console.log('[MyComponent]', { data, error, state });

// Error boundary debugging
// Check ErrorBoundary component logs
```

### 2. Backend Debugging
```python
# Use Python debugger
import pdb; pdb.set_trace()

# Logging with context
import logging
logging.info(f'Processing request: {request_id}', extra={
    'user_id': user_id,
    'operation': 'create_feature'
})
```

### 3. Common Issues and Solutions

#### Issue: TypeScript Compilation Errors
```bash
# Solution: Check type definitions
npm run type-check
# Fix type mismatches in reported files
```

#### Issue: Test Failures
```bash
# Solution: Run tests with verbose output
npm test -- --verbose
# Check test setup and mock configurations
```

#### Issue: Authentication Problems
```typescript
// Solution: Check authentication flow
const session = AuthenticationManager.getCurrentSession();
console.log('Current session:', session);
```

## Resources and Next Steps

### Documentation Links
- [Architecture Overview](./architecture/modernized-architecture-overview.md)
- [API Documentation](./api/api-reference.md)
- [Component Library](./components/component-library.md)
- [Troubleshooting Guide](./troubleshooting/common-issues.md)

### Learning Path
1. **Week 1**: Complete onboarding, understand architecture
2. **Week 2**: Work on small bug fixes and documentation updates
3. **Week 3**: Implement first feature with mentorship
4. **Week 4**: Independent feature development

### Team Contacts
- **Tech Lead**: [Contact Information]
- **Frontend Lead**: [Contact Information]
- **Backend Lead**: [Contact Information]
- **DevOps Lead**: [Contact Information]

### Development Tools Setup
```bash
# Recommended VS Code extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension ms-python.python
```

## Checklist: Onboarding Complete ✅

- [ ] Development environment set up and working
- [ ] Successfully run the application locally
- [ ] Understand the modular architecture
- [ ] Created and tested a simple component
- [ ] Written and run unit tests
- [ ] Completed first code review
- [ ] Familiar with debugging tools and processes
- [ ] Know where to find documentation and help

**Congratulations!** You're now ready to contribute to the SizeWise Suite. Welcome to the team! 🚀

---

**Estimated Total Onboarding Time**: 2-3 days (50% reduction from previous 5-7 days)

**Next Step**: Start with your first assigned task or explore the codebase further using the component library documentation.
