# Component Architecture Migration Guide

**Purpose**: Step-by-step guide for migrating from monolithic components to the new modular, scalable architecture while maintaining backward compatibility and preserving existing functionality.

---

## 1. Migration Overview

### 1.1 Migration Strategy

The refactoring follows a **phased approach** to minimize disruption:

1. **Phase 1**: Create new interfaces and service integration layer
2. **Phase 2**: Refactor layout components (AppShell, Sidebar, Header)
3. **Phase 3**: Refactor canvas system components
4. **Phase 4**: Refactor property panels and forms
5. **Phase 5**: Update state management and finalize integration

### 1.2 Backward Compatibility

- Existing components remain functional during migration
- New components use adapter patterns for legacy integration
- Gradual migration with feature flags for new components
- No breaking changes to existing APIs

---

## 2. Pre-Migration Checklist

### 2.1 Dependencies

Ensure the following are in place before starting migration:

```bash
# Install required dependencies (if not already present)
npm install zustand react-konva framer-motion
npm install -D @testing-library/react @testing-library/jest-dom
```

### 2.2 File Structure

Create the new directory structure:

```
frontend/
├── components/
│   ├── layout/           # New layout components
│   ├── canvas/           # Refactored canvas components
│   ├── panels/           # Refactored property panels
│   └── shared/           # Shared/utility components
├── types/
│   └── component-interfaces.ts  # New component interfaces
├── lib/
│   ├── hooks/
│   │   └── useServiceIntegration.ts  # Service integration hooks
│   └── providers/
│       └── ServiceProvider.tsx      # Service provider context
└── stores/
    └── refactored-ui-store.ts      # Refactored state management
```

---

## 3. Phase-by-Phase Migration

### Phase 1: Service Integration Layer

#### 3.1 Create Component Interfaces

```typescript
// frontend/types/component-interfaces.ts
// Copy the interfaces from the refactoring specification
```

#### 3.2 Implement Service Hooks

```typescript
// frontend/lib/hooks/useServiceIntegration.ts
// Implement service integration hooks
```

#### 3.3 Create Service Provider

```typescript
// frontend/lib/providers/ServiceProvider.tsx
// Implement service provider context
```

#### 3.4 Testing

```bash
npm test -- --testPathPattern="service"
```

### Phase 2: Layout Components

#### 3.1 Refactor AppShell

**Step 1**: Create container component
```typescript
// frontend/components/layout/AppShellContainer.tsx
// Implement business logic and state management
```

**Step 2**: Create presentation component
```typescript
// frontend/components/layout/AppShellPresentation.tsx
// Implement pure UI rendering
```

**Step 3**: Update imports gradually
```typescript
// Replace existing AppShell imports
import { AppShellContainer as AppShell } from '@/components/layout/AppShellContainer';
```

#### 3.2 Refactor Sidebar

Follow the same pattern as AppShell:
1. Create SidebarContainer
2. Create SidebarPresentation
3. Update imports

#### 3.3 Testing

```bash
npm test -- --testPathPattern="layout"
```

### Phase 3: Canvas System

#### 3.1 Refactor Canvas Components

**Step 1**: Create CanvasSystemContainer
```typescript
// frontend/components/canvas/CanvasSystemContainer.tsx
// Implement canvas state management and business logic
```

**Step 2**: Create CanvasSystemPresentation
```typescript
// frontend/components/canvas/CanvasSystemPresentation.tsx
// Implement pure canvas rendering
```

**Step 3**: Refactor drawing tools
```typescript
// frontend/components/canvas/DrawingToolsContainer.tsx
// frontend/components/canvas/DrawingToolsPresentation.tsx
```

#### 3.2 Testing

```bash
npm test -- --testPathPattern="canvas"
```

### Phase 4: Property Panels

#### 3.1 Refactor Project Panel

```typescript
// frontend/components/panels/ProjectPanelContainer.tsx
// frontend/components/panels/ProjectPanelPresentation.tsx
```

#### 3.2 Refactor Object Panels

```typescript
// frontend/components/panels/ObjectPanelContainer.tsx
// frontend/components/panels/ObjectPanelPresentation.tsx
```

#### 3.3 Testing

```bash
npm test -- --testPathPattern="panels"
```

### Phase 5: State Management

#### 3.1 Implement Refactored Stores

```typescript
// frontend/stores/refactored-ui-store.ts
// Implement new UI store with clear boundaries
```

#### 3.2 Migrate Store Usage

**Before**:
```typescript
const { sidebarOpen, setSidebarOpen, activePanel } = useUIStore();
```

**After**:
```typescript
const { sidebarOpen, setSidebarOpen, activePanel } = useRefactoredUIStore();
```

#### 3.3 Testing

```bash
npm test -- --testPathPattern="stores"
```

---

## 4. Component Migration Patterns

### 4.1 Container-Presentation Pattern

**Before** (Monolithic):
```typescript
export const MyComponent = () => {
  const [state, setState] = useState();
  const { service } = useService();
  
  const handleAction = async () => {
    // Business logic mixed with UI
    const result = await service.doSomething();
    setState(result);
  };
  
  return (
    <div>
      {/* UI rendering mixed with logic */}
      <button onClick={handleAction}>Action</button>
      {state && <div>{state.data}</div>}
    </div>
  );
};
```

**After** (Separated):
```typescript
// Container Component
export const MyComponentContainer = (props) => {
  const [state, setState] = useState();
  const { service } = useServices();
  
  const handleAction = async () => {
    // Pure business logic
    const result = await service.doSomething();
    setState(result);
  };
  
  return (
    <MyComponentPresentation
      data={state}
      onAction={handleAction}
      {...props}
    />
  );
};

// Presentation Component
export const MyComponentPresentation = ({ data, onAction }) => {
  return (
    <div>
      {/* Pure UI rendering */}
      <button onClick={onAction}>Action</button>
      {data && <div>{data.data}</div>}
    </div>
  );
};
```

### 4.2 Service Integration Pattern

**Before**:
```typescript
import { projectRepository } from '@/lib/repositories';

export const ProjectComponent = () => {
  const [project, setProject] = useState();
  
  useEffect(() => {
    projectRepository.getProject(id).then(setProject);
  }, [id]);
  
  // Component logic...
};
```

**After**:
```typescript
import { useProjectService } from '@/lib/hooks/useServiceIntegration';

export const ProjectComponentContainer = () => {
  const { loadProject } = useProjectService();
  const [project, setProject] = useState();
  
  useEffect(() => {
    loadProject(id).then(setProject);
  }, [id, loadProject]);
  
  // Component logic...
};
```

### 4.3 Feature Gate Integration

**Before**:
```typescript
export const AdvancedFeature = () => {
  const { user } = useAuth();
  
  if (user.tier !== 'pro') {
    return <div>Upgrade to Pro</div>;
  }
  
  return <div>Advanced Feature</div>;
};
```

**After**:
```typescript
export const AdvancedFeature = () => {
  return (
    <FeatureGate feature="advanced_feature" requiredTier="pro">
      <div>Advanced Feature</div>
    </FeatureGate>
  );
};
```

---

## 5. Testing Migration

### 5.1 Test Structure

```
__tests__/
├── components/
│   ├── layout/
│   │   ├── AppShellContainer.test.tsx
│   │   └── AppShellPresentation.test.tsx
│   ├── canvas/
│   │   └── CanvasSystemContainer.test.tsx
│   └── panels/
│       └── ProjectPanelContainer.test.tsx
├── hooks/
│   └── useServiceIntegration.test.ts
└── stores/
    └── refactored-ui-store.test.ts
```

### 5.2 Testing Patterns

**Container Component Tests**:
```typescript
describe('ComponentContainer', () => {
  it('integrates with service layer', async () => {
    const mockService = createMockService();
    render(
      <ServiceProvider services={{ myService: mockService }}>
        <ComponentContainer />
      </ServiceProvider>
    );
    
    await waitFor(() => {
      expect(mockService.method).toHaveBeenCalled();
    });
  });
});
```

**Presentation Component Tests**:
```typescript
describe('ComponentPresentation', () => {
  it('renders data correctly', () => {
    const mockData = createMockData();
    render(<ComponentPresentation data={mockData} onAction={jest.fn()} />);
    
    expect(screen.getByText(mockData.title)).toBeInTheDocument();
  });
});
```

---

## 6. Rollback Strategy

### 6.1 Feature Flags

Use feature flags to control migration:

```typescript
// Feature flag for new components
const useNewComponents = process.env.NEXT_PUBLIC_USE_NEW_COMPONENTS === 'true';

export const AppShell = useNewComponents ? AppShellContainer : LegacyAppShell;
```

### 6.2 Gradual Rollout

1. **Development**: Enable new components for development
2. **Staging**: Test with new components in staging environment
3. **Production**: Gradual rollout with feature flags
4. **Full Migration**: Remove legacy components after validation

### 6.3 Rollback Process

If issues are discovered:

1. **Immediate**: Disable feature flag to revert to legacy components
2. **Fix**: Address issues in new components
3. **Re-enable**: Gradually re-enable after fixes
4. **Monitor**: Continuous monitoring during rollout

---

## 7. Performance Considerations

### 7.1 Bundle Size

Monitor bundle size impact:

```bash
npm run build
npm run analyze  # If webpack-bundle-analyzer is configured
```

### 7.2 Runtime Performance

- Container components should be lightweight
- Presentation components should be optimized for rendering
- Use React.memo for presentation components when appropriate

### 7.3 Memory Usage

- Proper cleanup in useEffect hooks
- Avoid memory leaks in service integrations
- Monitor store state size

---

## 8. Troubleshooting

### 8.1 Common Issues

**Service Integration Errors**:
```typescript
// Ensure services are properly initialized
const { services, loading, error } = useServiceContext();

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

**Type Errors**:
```typescript
// Ensure proper interface implementation
interface MyComponentProps extends BaseComponentProps {
  // Component-specific props
}
```

**State Management Issues**:
```typescript
// Use proper store selectors
const { specificState } = useRefactoredUIStore(
  state => ({ specificState: state.specificState })
);
```

### 8.2 Debug Tools

- React DevTools for component inspection
- Redux DevTools for store debugging
- Service layer logging for integration issues

---

## 9. Post-Migration Validation

### 9.1 Functionality Testing

- [ ] All existing features work correctly
- [ ] New component architecture functions properly
- [ ] Service integration works as expected
- [ ] Tier enforcement is maintained

### 9.2 Performance Testing

- [ ] Bundle size is acceptable
- [ ] Runtime performance is maintained or improved
- [ ] Memory usage is stable

### 9.3 User Experience

- [ ] UI/UX is unchanged for end users
- [ ] Accessibility features are preserved
- [ ] Responsive design works correctly

---

## 10. Next Steps

After successful migration:

1. **Remove Legacy Code**: Clean up old components and unused code
2. **Optimize Performance**: Fine-tune new architecture for performance
3. **Enhance Features**: Leverage new architecture for feature development
4. **Documentation**: Update all documentation to reflect new architecture
5. **Team Training**: Train team on new patterns and best practices
