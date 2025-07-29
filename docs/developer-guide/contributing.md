# Contributing to SizeWise Suite

Thank you for your interest in contributing to SizeWise Suite! This guide will help you understand our development process, coding standards, and how to submit contributions effectively.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Coding Standards](#coding-standards)
4. [Testing Requirements](#testing-requirements)
5. [Documentation Guidelines](#documentation-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Issue Reporting](#issue-reporting)
8. [Community Guidelines](#community-guidelines)

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** and **npm 9+**
- **Python 3.9+** with **pip**
- **Git** with proper configuration
- **Docker** and **Docker Compose** (for full development environment)
- **Code Editor** with TypeScript and Python support (VS Code recommended)

### Development Environment Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/SizeWise_Suite_App.git
   cd SizeWise_Suite_App
   ```

2. **Install Dependencies**
   ```bash
   # Install all dependencies
   npm run install:all
   
   # Or install individually
   npm install                              # Frontend
   cd backend && pip install -r requirements.txt
   cd auth-server && pip install -r requirements.txt
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment templates
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp auth-server/.env.example auth-server/.env
   
   # Configure your local settings
   ```

4. **Start Development Environment**
   ```bash
   # Start all services
   npm run dev:all
   
   # Or use Docker
   npm run docker:dev
   ```

5. **Verify Setup**
   ```bash
   # Run health checks
   npm run health:check
   
   # Run basic tests
   npm test
   ```

## Development Workflow

### Branch Strategy

We use **Git Flow** with the following branch structure:

- **`main`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/*`**: New features and enhancements
- **`bugfix/*`**: Bug fixes for develop branch
- **`hotfix/*`**: Critical fixes for production
- **`release/*`**: Release preparation branches

### Creating a Feature Branch

```bash
# Start from develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes and commit
git add .
git commit -m "feat: add new feature description"

# Push to your fork
git push origin feature/your-feature-name
```

### Commit Message Convention

We follow **Conventional Commits** specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(air-duct): add pressure loss calculation
fix(auth): resolve token refresh issue
docs(api): update authentication endpoints
test(calculations): add unit tests for duct sizing
```

### Code Review Process

1. **Self-Review**: Review your own changes before submitting
2. **Automated Checks**: Ensure all CI checks pass
3. **Peer Review**: At least one team member must approve
4. **Documentation**: Update relevant documentation
5. **Testing**: All tests must pass

## Coding Standards

### TypeScript/JavaScript Standards

#### Code Style
```typescript
// Use TypeScript strict mode
// Prefer interfaces over types for object shapes
interface CalculationInput {
  airflow: number;
  ductType: 'round' | 'rectangular';
  frictionRate: number;
  units: 'imperial' | 'metric';
}

// Use descriptive variable names
const calculateDuctSize = (input: CalculationInput): CalculationResult => {
  // Implementation
};

// Prefer const over let, avoid var
const API_BASE_URL = 'https://api.sizewise-suite.com';

// Use async/await over promises
const fetchUserData = async (userId: string): Promise<User> => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw error;
  }
};
```

#### File Organization
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components
│   └── feature/        # Feature-specific components
├── hooks/              # Custom React hooks
├── services/           # API and business logic
├── stores/             # State management (Zustand)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── constants/          # Application constants
```

#### Naming Conventions
- **Files**: `kebab-case.tsx`, `PascalCase.tsx` for components
- **Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Components**: `PascalCase`
- **Functions**: `camelCase`

### Python Standards

#### Code Style (PEP 8)
```python
# Use type hints
from typing import Dict, List, Optional

def calculate_duct_size(
    airflow: float,
    duct_type: str,
    friction_rate: float,
    units: str = 'imperial'
) -> Dict[str, float]:
    """Calculate optimal duct dimensions.
    
    Args:
        airflow: Air flow rate in CFM or L/s
        duct_type: 'round' or 'rectangular'
        friction_rate: Friction rate in in. w.g./100 ft or Pa/m
        units: Unit system ('imperial' or 'metric')
        
    Returns:
        Dictionary containing calculated dimensions
        
    Raises:
        ValueError: If input parameters are invalid
    """
    if airflow <= 0:
        raise ValueError("Airflow must be positive")
    
    # Implementation
    return {
        'width': calculated_width,
        'height': calculated_height,
        'area': calculated_area
    }

# Use descriptive class names
class AirDuctCalculator:
    """HVAC air duct sizing calculator."""
    
    def __init__(self, standards_data: Dict[str, Any]) -> None:
        self.standards = standards_data
        self._cache: Dict[str, Any] = {}
```

#### File Organization
```
backend/
├── app/
│   ├── models/         # Database models
│   ├── services/       # Business logic
│   ├── api/           # API endpoints
│   ├── utils/         # Utility functions
│   └── tests/         # Test files
├── migrations/        # Database migrations
└── config/           # Configuration files
```

### CSS/Styling Standards

#### Tailwind CSS Usage
```tsx
// Prefer Tailwind utility classes
const GlassCard = ({ children }: { children: React.ReactNode }) => (
  <div className="
    backdrop-blur-md 
    bg-white/10 
    border 
    border-white/20 
    rounded-xl 
    shadow-xl 
    p-6
  ">
    {children}
  </div>
);

// Use consistent spacing scale
const spacing = {
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
};
```

## Testing Requirements

### Frontend Testing

#### Unit Tests (Jest + React Testing Library)
```typescript
// Component testing
import { render, screen, fireEvent } from '@testing-library/react';
import { CalculationPanel } from './CalculationPanel';

describe('CalculationPanel', () => {
  it('should display calculation results', () => {
    const mockResults = {
      ductSize: '16" x 8"',
      velocity: 1500,
      pressureLoss: 0.08
    };
    
    render(<CalculationPanel results={mockResults} />);
    
    expect(screen.getByText('16" x 8"')).toBeInTheDocument();
    expect(screen.getByText('1500 FPM')).toBeInTheDocument();
  });
});

// Hook testing
import { renderHook, act } from '@testing-library/react';
import { useCalculation } from './useCalculation';

describe('useCalculation', () => {
  it('should calculate duct size correctly', async () => {
    const { result } = renderHook(() => useCalculation());
    
    await act(async () => {
      await result.current.calculate({
        airflow: 1000,
        ductType: 'rectangular',
        frictionRate: 0.08
      });
    });
    
    expect(result.current.results).toBeDefined();
    expect(result.current.results.ductSize).toBe('16" x 8"');
  });
});
```

#### E2E Tests (Playwright)
```typescript
import { test, expect } from '@playwright/test';

test('air duct calculation workflow', async ({ page }) => {
  await page.goto('/air-duct-sizer');
  
  // Enter calculation parameters
  await page.fill('[data-testid="airflow-input"]', '1000');
  await page.selectOption('[data-testid="duct-type"]', 'rectangular');
  await page.fill('[data-testid="friction-rate"]', '0.08');
  
  // Trigger calculation
  await page.click('[data-testid="calculate-button"]');
  
  // Verify results
  await expect(page.locator('[data-testid="duct-size"]')).toContainText('16" x 8"');
  await expect(page.locator('[data-testid="velocity"]')).toContainText('1500');
});
```

### Backend Testing

#### Unit Tests (pytest)
```python
import pytest
from app.services.calculation_service import AirDuctCalculator

class TestAirDuctCalculator:
    def setup_method(self):
        self.calculator = AirDuctCalculator()
    
    def test_rectangular_duct_calculation(self):
        """Test rectangular duct sizing calculation."""
        result = self.calculator.calculate({
            'airflow': 1000,
            'duct_type': 'rectangular',
            'friction_rate': 0.08,
            'units': 'imperial'
        })
        
        assert result['success'] is True
        assert result['results']['duct_size'] == '16" x 8"'
        assert result['results']['velocity'] == 1500.0
    
    def test_invalid_airflow_raises_error(self):
        """Test that invalid airflow raises ValueError."""
        with pytest.raises(ValueError, match="Airflow must be positive"):
            self.calculator.calculate({
                'airflow': -100,
                'duct_type': 'rectangular',
                'friction_rate': 0.08
            })

# API endpoint testing
def test_calculation_endpoint(client):
    """Test calculation API endpoint."""
    response = client.post('/api/calculations/air-duct', json={
        'airflow': 1000,
        'duct_type': 'rectangular',
        'friction_rate': 0.08,
        'units': 'imperial'
    })
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert 'results' in data
```

### Test Coverage Requirements

- **Minimum Coverage**: 80% for all new code
- **Critical Paths**: 95% coverage for calculation logic
- **API Endpoints**: 100% coverage for all endpoints
- **UI Components**: 85% coverage for interactive components

## Documentation Guidelines

### Code Documentation

#### TypeScript/JavaScript
```typescript
/**
 * Calculate optimal duct dimensions based on airflow and system parameters.
 * 
 * @param input - Calculation input parameters
 * @param input.airflow - Air flow rate in CFM or L/s
 * @param input.ductType - Type of duct ('round' or 'rectangular')
 * @param input.frictionRate - Friction rate in in. w.g./100 ft or Pa/m
 * @param input.units - Unit system ('imperial' or 'metric')
 * @returns Promise resolving to calculation results
 * 
 * @example
 * ```typescript
 * const result = await calculateDuctSize({
 *   airflow: 1000,
 *   ductType: 'rectangular',
 *   frictionRate: 0.08,
 *   units: 'imperial'
 * });
 * console.log(result.ductSize); // "16\" x 8\""
 * ```
 */
export const calculateDuctSize = async (
  input: CalculationInput
): Promise<CalculationResult> => {
  // Implementation
};
```

#### Python
```python
def calculate_duct_size(
    airflow: float,
    duct_type: str,
    friction_rate: float,
    units: str = 'imperial'
) -> Dict[str, Any]:
    """Calculate optimal duct dimensions.
    
    This function implements the equal friction method for duct sizing
    according to SMACNA standards.
    
    Args:
        airflow: Air flow rate in CFM (imperial) or L/s (metric)
        duct_type: Type of duct, either 'round' or 'rectangular'
        friction_rate: Friction rate in in. w.g./100 ft (imperial) 
                      or Pa/m (metric)
        units: Unit system, either 'imperial' or 'metric'
        
    Returns:
        Dictionary containing:
            - duct_size: Formatted duct size string
            - width: Duct width (rectangular only)
            - height: Duct height (rectangular only)
            - diameter: Duct diameter (round only)
            - area: Cross-sectional area
            - velocity: Air velocity
            - pressure_loss: Pressure loss per unit length
            
    Raises:
        ValueError: If airflow is not positive
        ValueError: If duct_type is not 'round' or 'rectangular'
        ValueError: If friction_rate is not positive
        
    Example:
        >>> result = calculate_duct_size(1000, 'rectangular', 0.08)
        >>> print(result['duct_size'])
        '16" x 8"'
    """
```

### Markdown Documentation

#### Structure
```markdown
# Title (H1 - Only one per document)

Brief description of the document's purpose.

## Section (H2)

### Subsection (H3)

#### Sub-subsection (H4)

- Use bullet points for lists
- Keep lines under 100 characters when possible
- Use code blocks for examples

```typescript
// Code example with syntax highlighting
const example = "value";
```

**Bold** for emphasis, *italic* for subtle emphasis.

> Use blockquotes for important notes or warnings.

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data     | Data     | Data     |
```

## Pull Request Process

### Before Submitting

1. **Update Documentation**: Ensure all relevant docs are updated
2. **Run Tests**: All tests must pass locally
3. **Code Quality**: Run linting and formatting tools
4. **Self-Review**: Review your own changes thoroughly
5. **Rebase**: Rebase on latest develop branch

### PR Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Tests added for new functionality
```

### Review Process

1. **Automated Checks**: CI/CD pipeline must pass
2. **Code Review**: At least one approving review required
3. **Documentation Review**: Technical writer review for docs changes
4. **Testing**: QA review for significant features
5. **Final Approval**: Maintainer approval before merge

## Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
**Bug Description**
A clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. Windows 10, macOS 12.0]
- Browser: [e.g. Chrome 96, Firefox 95]
- Version: [e.g. 1.2.3]

**Additional Context**
Any other context about the problem.
```

### Feature Requests

Use the feature request template:

```markdown
**Feature Description**
A clear description of what you want to happen.

**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
Describe the solution you'd like.

**Alternatives Considered**
Describe alternatives you've considered.

**Additional Context**
Any other context or screenshots.
```

## Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment:

1. **Be Respectful**: Treat everyone with respect and kindness
2. **Be Inclusive**: Welcome newcomers and help them learn
3. **Be Constructive**: Provide helpful feedback and suggestions
4. **Be Professional**: Maintain professional communication
5. **Be Patient**: Remember that everyone has different experience levels

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Discord**: Real-time chat and community support
- **Email**: security@sizewise-suite.com for security issues

### Recognition

Contributors are recognized through:

- **Contributors List**: Listed in README.md
- **Release Notes**: Mentioned in release announcements
- **Hall of Fame**: Featured on project website
- **Swag**: Stickers and merchandise for significant contributions

---

*Thank you for contributing to SizeWise Suite! Your contributions help make HVAC engineering more efficient and accessible for everyone.*
