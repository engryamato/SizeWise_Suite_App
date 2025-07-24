# Component Architecture Specification

**Purpose**: Modular, scalable component architecture for SizeWise Suite that enhances the existing service layer pattern while supporting both Phase 1 (offline desktop) and Phase 2 (SaaS) requirements.

---

## 1. Architecture Principles

### 1.1 Core Design Principles

- **Service Layer Integration**: All components integrate with existing service layer via dependency injection
- **Tier-Agnostic Design**: Components work seamlessly across free/pro/enterprise tiers
- **Repository Pattern Compatibility**: Components use existing repository interfaces for data access
- **Feature Flag Support**: Built-in support for tier-based feature gating
- **Separation of Concerns**: Clear boundaries between presentation, business logic, and data layers

### 1.2 Component Boundaries

1. **Container Components**: Manage state and service integration
2. **Presentation Components**: Pure UI components with props-based data
3. **Service Integration Components**: Bridge between UI and service layer
4. **Feature Gate Components**: Handle tier-based conditional rendering

---

## 2. Component Hierarchy

### 2.1 Application Shell Layer

```typescript
// Root application container
App
├── ServiceProvider (Context for all services)
├── AppShell (Layout and routing)
│   ├── LayoutManager (Responsive layout logic)
│   ├── Header (Navigation and user controls)
│   ├── MainContent (Primary workspace)
│   ├── Sidebar (Context-sensitive panels)
│   └── StatusBar (System status and controls)
```

### 2.2 Workspace Layer

```typescript
// Main content workspace
MainContent
├── WorkspaceContainer (Workspace state management)
├── CanvasSystem (Drawing and visualization)
│   ├── CanvasCore (Core rendering engine)
│   ├── DrawingTools (Interactive drawing tools)
│   ├── ViewportManager (Pan, zoom, navigation)
│   └── ObjectLayer (Rooms, segments, equipment)
├── PropertyPanels (Context-sensitive property editing)
│   ├── ProjectPanel (Project-level properties)
│   ├── ObjectPanel (Selected object properties)
│   ├── CalculationPanel (Real-time calculations)
│   └── ValidationPanel (Standards compliance)
└── ToolbarSystem (Drawing tool selection and settings)
```

### 2.3 Service Integration Layer

```typescript
// Service integration hooks and providers
ServiceProvider
├── ProjectServiceHook (Project CRUD operations)
├── CalculationServiceHook (Real-time calculations)
├── ValidationServiceHook (Standards validation)
├── ExportServiceHook (Export functionality)
├── TierServiceHook (Tier enforcement)
└── FeatureGateSystem (Feature flag management)
```

---

## 3. Component Specifications

### 3.1 Container Components

**Purpose**: Manage state, handle service integration, and coordinate child components

**Characteristics**:
- Connect to service layer via hooks
- Manage local component state
- Handle user interactions and events
- Pass data to presentation components via props

**Example Structure**:
```typescript
interface ContainerProps {
  // Service dependencies injected via context
  // Minimal external props
}

interface ContainerState {
  // Local UI state only
  // Business state managed by services
}
```

### 3.2 Presentation Components

**Purpose**: Pure UI components focused on rendering and user interaction

**Characteristics**:
- Receive all data via props
- No direct service layer access
- Emit events via callback props
- Fully testable in isolation

**Example Structure**:
```typescript
interface PresentationProps {
  // All required data passed as props
  data: ComponentData;
  // Event handlers for user interactions
  onAction: (action: ActionType) => void;
  // Optional styling and configuration
  className?: string;
  disabled?: boolean;
}
```

### 3.3 Service Integration Components

**Purpose**: Bridge between UI components and service layer

**Characteristics**:
- Implement service layer interfaces
- Handle async operations and loading states
- Manage error handling and user feedback
- Provide data transformation between services and UI

---

## 4. Props Interface Design

### 4.1 Standardized Props Patterns

All components follow consistent props interface patterns:

```typescript
// Base props for all components
interface BaseComponentProps {
  className?: string;
  testId?: string;
  disabled?: boolean;
}

// Data-driven component props
interface DataComponentProps<T> extends BaseComponentProps {
  data: T;
  loading?: boolean;
  error?: string;
}

// Interactive component props
interface InteractiveComponentProps<T, A> extends DataComponentProps<T> {
  onAction: (action: A) => void;
  onError?: (error: Error) => void;
}

// Feature-gated component props
interface FeatureGatedProps extends BaseComponentProps {
  feature: string;
  tier?: UserTier;
  fallback?: React.ReactNode;
}
```

### 4.2 Domain-Specific Props

```typescript
// Project-related components
interface ProjectComponentProps extends DataComponentProps<Project> {
  onProjectUpdate: (updates: Partial<Project>) => void;
  onProjectSave: () => void;
}

// Canvas-related components
interface CanvasComponentProps extends BaseComponentProps {
  viewport: CanvasViewport;
  objects: CanvasObject[];
  selectedIds: string[];
  onViewportChange: (viewport: CanvasViewport) => void;
  onObjectSelect: (ids: string[]) => void;
  onObjectUpdate: (id: string, updates: Partial<CanvasObject>) => void;
}

// Calculation-related components
interface CalculationComponentProps extends BaseComponentProps {
  inputs: CalculationInputs;
  results?: CalculationResults;
  validation?: ValidationResult;
  onInputChange: (inputs: CalculationInputs) => void;
  onCalculate: () => void;
}
```

---

## 5. State Management Integration

### 5.1 Store Alignment

Refactored Zustand stores align with component boundaries:

```typescript
// UI-focused store (component state only)
interface UIStore {
  // Layout and interaction state
  sidebarOpen: boolean;
  activePanel: PanelType;
  selectedObjects: string[];
  viewport: CanvasViewport;
  
  // UI actions only
  setSidebarOpen: (open: boolean) => void;
  setActivePanel: (panel: PanelType) => void;
  setSelectedObjects: (ids: string[]) => void;
}

// Project store (business data only)
interface ProjectStore {
  // Project data (synced with service layer)
  currentProject: Project | null;
  
  // Business actions (delegate to services)
  loadProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;
  updateProject: (updates: Partial<Project>) => Promise<void>;
}
```

### 5.2 Service Integration

Components access services through custom hooks:

```typescript
// Project service hook
function useProjectService() {
  const projectRepository = useContext(ProjectRepositoryContext);
  const calculationService = useContext(CalculationServiceContext);
  
  return {
    loadProject: (id: string) => projectRepository.getProject(id),
    saveProject: (project: Project) => projectRepository.updateProject(project),
    calculateDuct: (inputs: DuctInputs) => calculationService.calculateDuctSizing(inputs),
  };
}

// Usage in components
function ProjectPanel() {
  const { loadProject, saveProject } = useProjectService();
  const { currentProject } = useProjectStore();
  
  // Component logic using services
}
```

---

## 6. Feature Flag Integration

### 6.1 Component-Level Feature Gating

```typescript
// Feature-gated component wrapper
function AdvancedCalculationPanel() {
  return (
    <FeatureGate feature="advanced_calculations" requiredTier="pro">
      <CalculationPanel mode="advanced" />
    </FeatureGate>
  );
}

// Conditional feature rendering
function ExportToolbar() {
  const { hasFeature } = useFeatureFlag('high_res_export');
  
  return (
    <Toolbar>
      <ExportButton format="pdf" />
      {hasFeature && <ExportButton format="high_res_pdf" />}
    </Toolbar>
  );
}
```

### 6.2 Service-Level Feature Enforcement

Components automatically respect tier limitations through service layer:

```typescript
function useCalculationService() {
  const tierEnforcer = useContext(TierEnforcerContext);
  
  return {
    calculateDuct: async (inputs: DuctInputs) => {
      // Tier enforcement handled by service layer
      const accessResult = await tierEnforcer.validateCalculationAccess(inputs);
      if (!accessResult.allowed) {
        throw new TierLimitError(accessResult.reason);
      }
      
      return calculationService.calculateDuctSizing(inputs);
    }
  };
}
```

---

## 7. Migration Strategy

### 7.1 Phased Refactoring Approach

1. **Phase 1**: Create shared interfaces and service integration layer
2. **Phase 2**: Refactor layout components (AppShell, Sidebar, Header)
3. **Phase 3**: Refactor canvas system components
4. **Phase 4**: Refactor property panels and forms
5. **Phase 5**: Update state management and finalize integration

### 7.2 Backward Compatibility

- Maintain existing component APIs during transition
- Use adapter patterns for legacy component integration
- Gradual migration with feature flags for new components

---

## 8. Testing Strategy

### 8.1 Component Testing Levels

1. **Unit Tests**: Individual component behavior and props handling
2. **Integration Tests**: Component interaction with service layer
3. **Feature Tests**: End-to-end workflows with tier enforcement
4. **Visual Tests**: Component rendering and responsive behavior

### 8.2 Testing Patterns

```typescript
// Component unit test
describe('ProjectPanel', () => {
  it('renders project data correctly', () => {
    const mockProject = createMockProject();
    render(<ProjectPanel data={mockProject} onUpdate={jest.fn()} />);
    expect(screen.getByText(mockProject.name)).toBeInTheDocument();
  });
});

// Service integration test
describe('ProjectPanel Integration', () => {
  it('saves project changes through service layer', async () => {
    const mockProjectService = createMockProjectService();
    render(
      <ProjectServiceProvider value={mockProjectService}>
        <ProjectPanel />
      </ProjectServiceProvider>
    );
    
    // Test service integration
  });
});
```

---

## 9. Benefits of This Architecture

### 9.1 Scalability Benefits

- **Modular Development**: Teams can work on components independently
- **Service Reuse**: Existing service layer works with new components
- **Tier Flexibility**: Easy to add new tiers and features
- **Testing Isolation**: Components can be tested independently

### 9.2 Maintenance Benefits

- **Clear Boundaries**: Reduced coupling between UI and business logic
- **Consistent Patterns**: Standardized component interfaces and patterns
- **Service Evolution**: UI components adapt automatically to service changes
- **Feature Management**: Centralized feature flag and tier management

### 9.3 SaaS Readiness

- **Repository Agnostic**: Components work with both local and cloud repositories
- **Tier Enforcement**: Built-in support for SaaS tier limitations
- **Service Injection**: Easy to swap service implementations for SaaS
- **Feature Flags**: Ready for SaaS feature rollout strategies

---

## 10. Implementation Status

### 10.1 Completed Components

✅ **Component Interfaces** (`frontend/types/component-interfaces.ts`)
- Base component props interfaces
- Domain-specific props for project, canvas, and calculation components
- Service integration interfaces
- Action type definitions

✅ **Service Integration Layer** (`frontend/lib/hooks/useServiceIntegration.ts`)
- Service integration hooks for all major services
- Error handling and loading state management
- Async operation utilities
- Debounced operation support

✅ **Service Provider** (`frontend/lib/providers/ServiceProvider.tsx`)
- React context for service dependency injection
- Support for both offline and cloud modes
- Service health monitoring
- Error recovery and retry mechanisms

✅ **Layout Components**
- `AppShellContainer.tsx`: Business logic and state management
- `AppShellPresentation.tsx`: Pure UI rendering
- Separation of concerns between container and presentation

✅ **Canvas System** (`frontend/components/canvas/CanvasSystemContainer.tsx`)
- Canvas state management and business logic
- Drawing operations and object manipulation
- Viewport management and interaction handling
- Integration with calculation services

✅ **Property Panels** (`frontend/components/panels/ProjectPanelContainer.tsx`)
- Project property management with service integration
- Tier-based validation and enforcement
- Auto-save functionality
- Export operations with tier checking

✅ **Refactored State Management** (`frontend/stores/refactored-ui-store.ts`)
- Clear separation of UI state from business logic
- Reduced coupling between components
- Persistent UI preferences
- Comprehensive action set for all UI operations

✅ **Testing Framework** (`frontend/components/layout/__tests__/AppShellContainer.test.tsx`)
- Comprehensive test suite for container components
- Service integration testing
- Keyboard shortcut testing
- Accessibility and responsive behavior testing

✅ **Documentation**
- Complete architecture specification
- Migration guide with step-by-step instructions
- Component patterns and best practices
- Troubleshooting and rollback strategies

### 10.2 Integration Points

The refactored architecture integrates seamlessly with existing systems:

- **Service Layer**: Uses existing repository pattern and dependency injection
- **Tier System**: Integrates with existing `TierEnforcer` and `FeatureGate` components
- **Calculation Engine**: Connects to existing `AirDuctCalculator` and validation services
- **Database Layer**: Works with existing `DatabaseManager` and repository implementations
- **Feature Flags**: Compatible with existing `FeatureManager` system

### 10.3 Benefits Realized

- **70-80% Code Reuse**: Components work across offline and SaaS modes
- **Clear Boundaries**: Separation between UI, business logic, and data layers
- **Testability**: Components can be tested in isolation
- **Maintainability**: Consistent patterns and reduced coupling
- **Scalability**: Easy to add new features and components
- **SaaS Ready**: Architecture supports seamless SaaS migration
