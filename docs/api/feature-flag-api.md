# Feature Flag API Documentation

**Purpose:** Complete API documentation for FeatureManager and feature flag system  
**Reference:** `docs/implementation/tier-system/feature-flag-implementation.md`

---

## 1. FeatureManager Class

### 1.1 Class Definition

```typescript
export interface FeatureEvaluationContext {
  userId: string;
  tier: UserTier;
  timestamp: Date;
}

export class FeatureManager {
  constructor(
    private flagRepository: FeatureFlagRepository,
    private userRepository: UserRepository
  );

  // Core Methods
  isEnabled(featureName: string, userId?: string): Promise<boolean>;
  isEnabledSync(featureName: string, userId?: string): boolean;
  evaluateFeature(featureName: string, userId?: string): Promise<FeatureEvaluationResult>;
  
  // Batch Operations
  evaluateMultiple(featureNames: string[], userId?: string): Promise<Record<string, boolean>>;
  getUserFeatures(userId: string): Promise<UserFeatureSet>;
  
  // Cache Management
  clearCache(): void;
  refreshUserFlags(userId: string): Promise<void>;
  preloadUserFeatures(userId: string): Promise<void>;
  
  // Tier Management
  getTierFeatures(tier: UserTier): string[];
  isFeatureAvailableForTier(featureName: string, tier: UserTier): boolean;
}

export type UserTier = 'free' | 'pro' | 'enterprise';
```

### 1.2 Core Methods Documentation

#### isEnabled(featureName: string, userId?: string): Promise<boolean>
**Purpose:** Check if a feature is enabled for a user

**Parameters:**
- `featureName` (string): Name of the feature to check
- `userId` (string, optional): User ID to check for. If omitted, checks global flags only

**Returns:**
- `Promise<boolean>`: true if feature is enabled, false otherwise

**Evaluation Logic:**
1. Check tier-based features first (fastest path)
2. Check user-specific overrides
3. Check global flags
4. Return false if no matches

**Caching:**
- Results cached for 5 minutes
- Cache key: `${userId || 'global'}:${featureName}`

**Performance:**
- Target: <50ms average response time
- Cache hits: <5ms response time

**Example:**
```typescript
const featureManager = new FeatureManager(flagRepository, userRepository);

// Check if user can create unlimited projects
const canCreateUnlimited = await featureManager.isEnabled('unlimited_projects', 'user-123');
if (canCreateUnlimited) {
  // Allow project creation
} else {
  // Check project count and enforce limit
}

// Check global feature
const isMaintenanceMode = await featureManager.isEnabled('maintenance_mode');
```

#### isEnabledSync(featureName: string, userId?: string): boolean
**Purpose:** Synchronous feature check using cached values only

**Parameters:**
- `featureName` (string): Name of the feature to check
- `userId` (string, optional): User ID to check for

**Returns:**
- `boolean`: true if feature is enabled in cache, false otherwise

**Usage:**
- Use when async evaluation is not possible (render functions, etc.)
- Requires prior call to `preloadUserFeatures()` or `isEnabled()`
- Returns false if feature not in cache

**Example:**
```typescript
// Preload features
await featureManager.preloadUserFeatures('user-123');

// Use sync check in render function
const showAdvancedFeatures = featureManager.isEnabledSync('advanced_features', 'user-123');
```

#### evaluateFeature(featureName: string, userId?: string): Promise<FeatureEvaluationResult>
**Purpose:** Get detailed feature evaluation result with metadata

**Parameters:**
- `featureName` (string): Name of the feature to evaluate
- `userId` (string, optional): User ID to evaluate for

**Returns:**
- `Promise<FeatureEvaluationResult>`: Detailed evaluation result

**FeatureEvaluationResult Interface:**
```typescript
export interface FeatureEvaluationResult {
  enabled: boolean;
  source: 'tier' | 'user_override' | 'global' | 'default';
  tier: UserTier;
  evaluatedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}
```

**Example:**
```typescript
const result = await featureManager.evaluateFeature('high_res_export', 'user-123');
console.log(`Feature enabled: ${result.enabled}`);
console.log(`Source: ${result.source}`);
console.log(`User tier: ${result.tier}`);
```

### 1.3 Batch Operations

#### evaluateMultiple(featureNames: string[], userId?: string): Promise<Record<string, boolean>>
**Purpose:** Evaluate multiple features in a single call for performance

**Parameters:**
- `featureNames` (string[]): Array of feature names to evaluate
- `userId` (string, optional): User ID to evaluate for

**Returns:**
- `Promise<Record<string, boolean>>`: Object mapping feature names to enabled status

**Performance Benefits:**
- Single database query for all features
- Batch cache operations
- Reduced network overhead for cloud mode

**Example:**
```typescript
const features = await featureManager.evaluateMultiple([
  'unlimited_projects',
  'high_res_export',
  'cloud_sync',
  'custom_templates'
], 'user-123');

if (features.unlimited_projects) {
  // Enable unlimited project creation
}
if (features.high_res_export) {
  // Show high-res export option
}
```

#### getUserFeatures(userId: string): Promise<UserFeatureSet>
**Purpose:** Get complete feature set for a user

**Parameters:**
- `userId` (string): User ID to get features for

**Returns:**
- `Promise<UserFeatureSet>`: Complete user feature set

**UserFeatureSet Interface:**
```typescript
export interface UserFeatureSet {
  userId: string;
  tier: UserTier;
  features: Record<string, FeatureEvaluationResult>;
  evaluatedAt: Date;
  cacheExpiresAt: Date;
}
```

**Example:**
```typescript
const userFeatures = await featureManager.getUserFeatures('user-123');
console.log(`User tier: ${userFeatures.tier}`);
console.log(`Available features: ${Object.keys(userFeatures.features).join(', ')}`);
```

### 1.4 Cache Management

#### clearCache(): void
**Purpose:** Clear all cached feature flag results

**Usage:**
- Call when user tier changes
- Call when feature flags are updated
- Call during testing to reset state

**Example:**
```typescript
// Clear cache after tier upgrade
await userRepository.updateUserTier('user-123', 'pro');
featureManager.clearCache();
```

#### refreshUserFlags(userId: string): Promise<void>
**Purpose:** Refresh cached flags for a specific user

**Parameters:**
- `userId` (string): User ID to refresh flags for

**Usage:**
- Call when user-specific flags change
- More efficient than clearing entire cache

**Example:**
```typescript
// Refresh after user-specific flag update
await flagRepository.setFeatureFlag({
  userId: 'user-123',
  featureName: 'beta_features',
  enabled: true
});
await featureManager.refreshUserFlags('user-123');
```

#### preloadUserFeatures(userId: string): Promise<void>
**Purpose:** Preload all features for a user into cache

**Parameters:**
- `userId` (string): User ID to preload features for

**Usage:**
- Call during app initialization
- Call before using `isEnabledSync()`
- Improves performance for subsequent feature checks

**Example:**
```typescript
// Preload during app startup
const currentUser = await userRepository.getCurrentUser();
if (currentUser) {
  await featureManager.preloadUserFeatures(currentUser.id);
}
```

---

## 2. Tier-Based Feature Mapping

### 2.1 Feature Tier Definitions

```typescript
export const TIER_FEATURES = {
  free: [
    'basic_calculations',
    'pdf_export_watermark',
    'csv_export',
    '2d_drawing',
    '3d_view_limited'
  ],
  pro: [
    'unlimited_projects',
    'unlimited_segments',
    'high_res_export',
    'cloud_sync',
    'enhanced_3d_rendering',
    'full_standards_access'
  ],
  enterprise: [
    'custom_templates',
    'bim_export',
    'sso_integration',
    'audit_logs',
    'rbac',
    'priority_support',
    'api_access'
  ]
} as const;
```

### 2.2 Tier Methods

#### getTierFeatures(tier: UserTier): string[]
**Purpose:** Get all features available for a specific tier

**Parameters:**
- `tier` (UserTier): Tier to get features for

**Returns:**
- `string[]`: Array of feature names available for the tier

**Tier Inheritance:**
- Enterprise includes Pro and Free features
- Pro includes Free features
- Free includes only Free features

**Example:**
```typescript
const proFeatures = featureManager.getTierFeatures('pro');
console.log(`Pro tier includes: ${proFeatures.join(', ')}`);
// Output: Pro tier includes: basic_calculations, pdf_export_watermark, csv_export, 2d_drawing, 3d_view_limited, unlimited_projects, unlimited_segments, high_res_export, cloud_sync, enhanced_3d_rendering, full_standards_access
```

#### isFeatureAvailableForTier(featureName: string, tier: UserTier): boolean
**Purpose:** Check if a feature is available for a specific tier

**Parameters:**
- `featureName` (string): Name of the feature to check
- `tier` (UserTier): Tier to check against

**Returns:**
- `boolean`: true if feature is available for the tier

**Example:**
```typescript
const isAvailable = featureManager.isFeatureAvailableForTier('unlimited_projects', 'free');
console.log(isAvailable); // false

const isAvailablePro = featureManager.isFeatureAvailableForTier('unlimited_projects', 'pro');
console.log(isAvailablePro); // true
```

---

## 3. React Integration

### 3.1 useFeatureFlag Hook

```typescript
export function useFeatureFlag(featureName: string): boolean;
export function useFeatureFlagWithLoading(featureName: string): [boolean, boolean];

// Hook implementation
export function useFeatureFlag(featureName: string): boolean {
  const [isEnabled, setIsEnabled] = useState(false);
  const featureManager = useFeatureManager();
  const { user } = useAuthStore();

  useEffect(() => {
    const checkFeature = async () => {
      const enabled = await featureManager.isEnabled(featureName, user?.id);
      setIsEnabled(enabled);
    };
    checkFeature();
  }, [featureName, user?.id, featureManager]);

  return isEnabled;
}
```

**Usage:**
```typescript
function ExportButton() {
  const hasHighResExport = useFeatureFlag('high_res_export');
  
  return (
    <button disabled={!hasHighResExport}>
      {hasHighResExport ? 'Export High-Res PDF' : 'Export PDF (Upgrade for High-Res)'}
    </button>
  );
}
```

### 3.2 FeatureGate Component

```typescript
interface FeatureGateProps {
  feature: string;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  requiredTier?: 'pro' | 'enterprise';
  children: React.ReactNode;
}

export function FeatureGate({ 
  feature, 
  fallback, 
  showUpgradePrompt = true,
  requiredTier,
  children 
}: FeatureGateProps): JSX.Element;
```

**Usage:**
```typescript
<FeatureGate feature="unlimited_projects" requiredTier="pro">
  <CreateProjectButton />
</FeatureGate>

<FeatureGate 
  feature="custom_templates" 
  fallback={<StandardTemplateSelector />}
  requiredTier="enterprise"
>
  <CustomTemplateSelector />
</FeatureGate>
```

---

## 4. Error Handling

### 4.1 Feature Flag Errors

```typescript
export class FeatureFlagError extends Error {
  constructor(message: string, public readonly featureName: string) {
    super(message);
    this.name = 'FeatureFlagError';
  }
}

export class FeatureEvaluationError extends FeatureFlagError {
  constructor(featureName: string, cause: Error) {
    super(`Failed to evaluate feature '${featureName}': ${cause.message}`, featureName);
    this.name = 'FeatureEvaluationError';
  }
}

export class TierLimitExceededError extends Error {
  constructor(
    message: string,
    public readonly requiredFeature: string,
    public readonly requiredTier: string,
    public readonly currentTier?: string
  ) {
    super(message);
    this.name = 'TierLimitExceededError';
  }
}
```

### 4.2 Error Handling Patterns

```typescript
// Service layer error handling
export class ProjectService {
  async createProject(userId: string, projectData: CreateProjectRequest): Promise<Project> {
    try {
      // Check feature availability
      const canCreateUnlimited = await this.featureManager.isEnabled('unlimited_projects', userId);
      
      if (!canCreateUnlimited) {
        const projectCount = await this.projectRepository.getProjectCount(userId);
        if (projectCount >= 3) {
          throw new TierLimitExceededError(
            'Free tier limited to 3 projects. Upgrade to Pro for unlimited projects.',
            'unlimited_projects',
            'pro'
          );
        }
      }

      // Create project
      return await this.projectRepository.saveProject(project);
      
    } catch (error) {
      if (error instanceof TierLimitExceededError) {
        // Handle tier limit gracefully
        throw error;
      }
      
      // Log unexpected errors
      console.error('Unexpected error in createProject:', error);
      throw new Error('Failed to create project');
    }
  }
}
```

---

## 5. Testing Utilities

### 5.1 Mock FeatureManager

```typescript
export class MockFeatureManager implements FeatureManager {
  private mockFlags = new Map<string, boolean>();

  setMockFlag(featureName: string, enabled: boolean): void {
    this.mockFlags.set(featureName, enabled);
  }

  async isEnabled(featureName: string, userId?: string): Promise<boolean> {
    return this.mockFlags.get(featureName) ?? false;
  }

  isEnabledSync(featureName: string, userId?: string): boolean {
    return this.mockFlags.get(featureName) ?? false;
  }

  // ... other methods
}
```

### 5.2 Test Helpers

```typescript
export function setupFeatureFlags(flags: Record<string, boolean>): MockFeatureManager {
  const mockManager = new MockFeatureManager();
  Object.entries(flags).forEach(([feature, enabled]) => {
    mockManager.setMockFlag(feature, enabled);
  });
  return mockManager;
}

// Usage in tests
describe('ProjectService', () => {
  it('should enforce free tier project limit', async () => {
    const featureManager = setupFeatureFlags({
      unlimited_projects: false
    });
    
    const projectService = new ProjectService(
      mockProjectRepository,
      mockUserRepository,
      featureManager
    );

    // Test tier enforcement
    await expect(projectService.createProject('user-id', projectData))
      .rejects.toThrow(TierLimitExceededError);
  });
});
```

---

## 6. Performance Considerations

### 6.1 Caching Strategy

- **Cache TTL**: 5 minutes for feature flag results
- **Cache Keys**: `${userId || 'global'}:${featureName}`
- **Cache Size**: Maximum 1000 entries with LRU eviction
- **Preloading**: Batch load user features during app initialization

### 6.2 Performance Targets

- **Feature evaluation**: <50ms average
- **Cache hits**: <5ms response time
- **Batch operations**: <100ms for 10 features
- **Memory usage**: <10MB for feature flag cache

### 6.3 Optimization Techniques

```typescript
// Batch feature evaluation for performance
const criticalFeatures = await featureManager.evaluateMultiple([
  'unlimited_projects',
  'high_res_export',
  'cloud_sync'
], userId);

// Preload features for UI rendering
await featureManager.preloadUserFeatures(userId);

// Use sync checks in performance-critical paths
const showFeature = featureManager.isEnabledSync('feature_name', userId);
```

---

**Status**: ✅ **COMPLETE** - Feature Flag API documentation with complete method signatures and usage examples  
**Next Step**: Create User-Facing Documentation (Task 0.10)
