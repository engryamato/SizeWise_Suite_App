# SizeWise Suite - Component Library

**Version**: 2.0  
**Last Updated**: 2025-08-03  
**Framework**: React + TypeScript + Next.js  

## Overview

The SizeWise Suite component library provides a comprehensive set of modular, reusable components designed for HVAC engineering applications. All components follow modern React patterns, TypeScript best practices, and accessibility standards.

## Component Architecture

### Design Principles
- **Modular**: Each component has a single responsibility
- **Reusable**: Components work across different contexts
- **Type-Safe**: Full TypeScript support with comprehensive interfaces
- **Accessible**: WCAG 2.1 AA compliance
- **Testable**: Easy to unit test and mock

### Component Categories

```
components/
├── analytics/          # Analytics and dashboard components
├── auth/              # Authentication and user management
├── hvac/              # HVAC-specific calculation components
├── shared/            # Reusable UI components
├── forms/             # Form components and validation
└── layout/            # Layout and navigation components
```

## Analytics Components

### AdvancedAnalyticsDashboard

**Location**: `components/analytics/AdvancedAnalyticsDashboard.tsx`  
**Size**: 205 lines (refactored from 893 lines)  

Comprehensive analytics dashboard with modular architecture.

#### Props Interface
```typescript
interface AdvancedAnalyticsDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialFilters?: AnalyticsFilters;
}
```

#### Usage Example
```typescript
import { AdvancedAnalyticsDashboard } from '@/components/analytics/AdvancedAnalyticsDashboard';

<AdvancedAnalyticsDashboard
  autoRefresh={true}
  refreshInterval={300000}
  initialFilters={{
    timeRange: '30d',
    metrics: ['energy', 'performance']
  }}
/>
```

#### Features
- Real-time data updates with auto-refresh
- Configurable time ranges and metrics
- Interactive charts and KPI cards
- Export functionality
- Responsive design

### KPICards

**Location**: `components/analytics/components/KPICards.tsx`

Displays key performance indicators with trend analysis.

#### Props Interface
```typescript
interface KPICardsProps {
  kpis: KPIData[];
  loading?: boolean;
  className?: string;
}
```

#### Usage Example
```typescript
<KPICards
  kpis={[
    {
      title: 'Energy Savings',
      value: 2.4,
      unit: 'MWh',
      trend: { direction: 'up', percentage: 12.5 },
      status: 'good'
    }
  ]}
/>
```

### EnergyAnalyticsTab

**Location**: `components/analytics/components/EnergyAnalyticsTab.tsx`

Specialized component for energy consumption and efficiency analytics.

#### Features
- Energy consumption trends
- Efficiency metrics
- Cost analysis
- Comparative charts

### PerformanceAnalyticsTab

**Location**: `components/analytics/components/PerformanceAnalyticsTab.tsx`

Performance metrics and system reliability analytics.

#### Features
- System performance metrics
- Reliability data
- Operational insights
- Maintenance scheduling

## Authentication Components

### AuthenticationManager

**Location**: `lib/auth/AuthenticationManager.ts`  
**Size**: 435 lines (refactored from 1,188 lines)  

Core authentication management with modular architecture.

#### Key Methods
```typescript
class AuthenticationManager {
  // Session management
  async createSession(credentials: LoginCredentials): Promise<AuthResult>
  async validateSession(sessionId: string): Promise<boolean>
  async refreshSession(token: string): Promise<AuthResult>
  
  // License validation
  async validateLicense(licenseKey: string): Promise<LicenseResult>
  
  // Super admin authentication
  async authenticateSuperAdmin(request: HardwareKeyAuthRequest): Promise<SuperAdminAuthResult>
}
```

#### Usage Example
```typescript
import { AuthenticationManager } from '@/lib/auth/AuthenticationManager';

const authManager = new AuthenticationManager();
const result = await authManager.createSession({
  email: 'user@example.com',
  password: 'password',
  licenseKey: 'optional-license'
});
```

### SessionManager

**Location**: `lib/auth/managers/SessionManager.ts`

Handles session lifecycle management with security features.

#### Features
- Secure session creation and storage
- Device fingerprinting
- Session expiration handling
- Activity tracking

### TokenManager

**Location**: `lib/auth/managers/TokenManager.ts`

JWT token operations with security best practices.

#### Features
- Token generation and validation
- Refresh token handling
- Token blacklisting
- Timing-safe comparisons

## HVAC Components

### DuctSizingCalculator

**Location**: `components/hvac/DuctSizingCalculator.tsx`

Interactive duct sizing calculation component.

#### Props Interface
```typescript
interface DuctSizingCalculatorProps {
  onCalculationComplete?: (result: DuctSizingResult) => void;
  defaultValues?: Partial<DuctSizingInput>;
  validationRules?: ValidationRules;
}
```

#### Usage Example
```typescript
<DuctSizingCalculator
  onCalculationComplete={(result) => {
    console.log('Calculation result:', result);
  }}
  defaultValues={{
    airflow: 1000,
    velocity: 800
  }}
/>
```

### LoadCalculationForm

**Location**: `components/hvac/LoadCalculationForm.tsx`

Comprehensive heating/cooling load calculation form.

#### Features
- Building envelope inputs
- Occupancy and internal loads
- Climate data integration
- Real-time validation

### PressureLossCalculator

**Location**: `components/hvac/PressureLossCalculator.tsx`

Ductwork pressure loss calculation with visual feedback.

#### Features
- Ductwork system builder
- Fitting selection
- Pressure loss visualization
- Export capabilities

## Shared Components

### ErrorBoundary

**Location**: `components/shared/ErrorBoundary.tsx`

React error boundary with standardized error handling.

#### Props Interface
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
```

#### Usage Example
```typescript
<ErrorBoundary
  fallback={CustomErrorFallback}
  onError={(error, errorInfo) => {
    console.error('Component error:', error, errorInfo);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### LoadingSpinner

**Location**: `components/shared/LoadingSpinner.tsx`

Consistent loading indicator with customizable appearance.

#### Props Interface
```typescript
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  message?: string;
  overlay?: boolean;
}
```

### Modal

**Location**: `components/shared/Modal.tsx`

Accessible modal component with keyboard navigation.

#### Features
- Focus management
- Escape key handling
- Backdrop click closing
- Customizable content

## Form Components

### FormField

**Location**: `components/forms/FormField.tsx`

Standardized form field with validation and error handling.

#### Props Interface
```typescript
interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'email' | 'password';
  required?: boolean;
  validation?: ValidationRule[];
  helpText?: string;
}
```

### ValidationMessage

**Location**: `components/forms/ValidationMessage.tsx`

Consistent validation message display.

#### Features
- Error state styling
- Icon indicators
- Accessibility support
- Animation transitions

## Hooks

### useAnalyticsData

**Location**: `components/analytics/hooks/useAnalyticsData.ts`

Custom hook for analytics data management.

#### Features
- Data fetching and caching
- Auto-refresh capabilities
- Filter management
- Error handling

#### Usage Example
```typescript
const {
  data,
  isLoading,
  error,
  filters,
  setFilters,
  refresh
} = useAnalyticsData({
  autoRefresh: true,
  refreshInterval: 300000
});
```

### useErrorHandler

**Location**: `lib/errors/hooks/useErrorHandler.ts`

Standardized error handling hook.

#### Usage Example
```typescript
const { handleError, clearError } = useErrorHandler();

try {
  await riskyOperation();
} catch (error) {
  handleError(error, { context: 'MyComponent' });
}
```

## Styling Guidelines

### CSS Classes
All components use Tailwind CSS with consistent naming:

```css
/* Component base classes */
.component-name {
  @apply base-styles;
}

/* State modifiers */
.component-name--loading {
  @apply opacity-50 pointer-events-none;
}

.component-name--error {
  @apply border-red-500 bg-red-50;
}
```

### Theme Variables
```css
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}
```

## Testing Components

### Unit Testing Example
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { KPICards } from './KPICards';

describe('KPICards', () => {
  const mockKPIs = [
    {
      title: 'Energy Savings',
      value: 2.4,
      unit: 'MWh',
      trend: { direction: 'up', percentage: 12.5 }
    }
  ];

  it('renders KPI data correctly', () => {
    render(<KPICards kpis={mockKPIs} />);
    
    expect(screen.getByText('Energy Savings')).toBeInTheDocument();
    expect(screen.getByText('2.4')).toBeInTheDocument();
    expect(screen.getByText('MWh')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<KPICards kpis={[]} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

## Best Practices

### Component Development
1. **Start with TypeScript interfaces** for props and state
2. **Use functional components** with hooks
3. **Implement error boundaries** for error handling
4. **Add loading states** for async operations
5. **Include accessibility attributes** (ARIA labels, roles)

### Performance Optimization
1. **Use React.memo** for expensive components
2. **Implement lazy loading** for large components
3. **Optimize re-renders** with useCallback and useMemo
4. **Code splitting** at route and component level

### Testing Strategy
1. **Unit tests** for component logic
2. **Integration tests** for component interactions
3. **Visual regression tests** for UI consistency
4. **Accessibility tests** for WCAG compliance

## Migration Guide

### From Legacy Components
When migrating from legacy components:

1. **Extract types** to separate files
2. **Break down large components** into smaller modules
3. **Implement error handling** with ErrorBoundary
4. **Add comprehensive tests** for new components
5. **Update documentation** and examples

### Component Refactoring Checklist
- [ ] Component size <500 lines
- [ ] TypeScript interfaces defined
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Accessibility verified

---

**Next Steps**: Explore specific component documentation and implementation examples in the `/docs/components/` directory.
