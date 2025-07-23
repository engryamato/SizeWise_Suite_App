# Feature Flag Architecture Specification

**Source Documents:** `docs/developer-guide/Tier and Feature Separation.md` sections 2-3  
**Purpose:** Complete feature flag system architecture enabling tier-based feature management and SaaS transition

---

## 1. Feature Flag System Overview

The feature flag system provides centralized control over tier-based features, enabling seamless offline-to-SaaS transition while maintaining consistent enforcement across all application layers.

### 1.1 Core Principles

- **Single enforcement point**: All feature access goes through FeatureManager
- **Tier-based evaluation**: Features automatically enabled based on user tier
- **Repository integration**: Works seamlessly with repository pattern
- **Hot-swappable backends**: Local flags (offline) → cloud flags (SaaS)

### 1.2 Architecture Components

```
┌─────────────────────────────────────┐
│           UI Components             │
│    (Conditional Rendering)          │
├─────────────────────────────────────┤
│         FeatureManager              │
│   (Central Feature Evaluation)      │
├─────────────────────────────────────┤
│      FeatureFlagRepository          │
│   (Local SQLite ↔ Cloud API)       │
├─────────────────────────────────────┤
│         Database Schema             │
│    (feature_flags table)            │
└─────────────────────────────────────┘
```

---

## 2. Database Schema Integration

### 2.1 Feature Flags Table

```sql
CREATE TABLE feature_flags (
  id TEXT PRIMARY KEY,              -- UUID
  user_id TEXT,                     -- NULL for global flags
  feature_name TEXT NOT NULL,       -- e.g., 'unlimited_projects'
  enabled BOOLEAN DEFAULT FALSE,
  tier_required TEXT,               -- 'free' | 'pro' | 'enterprise'
  expires_at DATETIME,              -- Optional expiration
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_feature_flags_user_feature ON feature_flags(user_id, feature_name);
CREATE INDEX idx_feature_flags_tier ON feature_flags(tier_required);
CREATE INDEX idx_feature_flags_global ON feature_flags(feature_name) WHERE user_id IS NULL;
```

### 2.2 Integration with Users Table

```sql
-- Users table includes tier for feature evaluation
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- UUID
  email TEXT UNIQUE,
  tier TEXT DEFAULT 'free',         -- 'free' | 'pro' | 'enterprise'
  license_key TEXT,                 -- Offline license validation
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. FeatureManager Class Design

### 3.1 Core FeatureManager Implementation

```typescript
// frontend/lib/features/FeatureManager.ts
import { FeatureFlagRepository } from '../repositories/interfaces/FeatureFlagRepository';
import { UserRepository } from '../repositories/interfaces/UserRepository';

export type UserTier = 'free' | 'pro' | 'enterprise';

export interface FeatureEvaluationContext {
  userId: string;
  tier: UserTier;
  timestamp: Date;
}

export class FeatureManager {
  private flagCache = new Map<string, boolean>();
  private cacheExpiry = new Map<string, Date>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private flagRepository: FeatureFlagRepository,
    private userRepository: UserRepository
  ) {}

  async isEnabled(featureName: string, userId?: string): Promise<boolean> {
    const cacheKey = `${userId || 'global'}:${featureName}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.flagCache.get(cacheKey) || false;
    }

    // Evaluate feature flag
    const result = await this.evaluateFeature(featureName, userId);
    
    // Cache result
    this.flagCache.set(cacheKey, result);
    this.cacheExpiry.set(cacheKey, new Date(Date.now() + this.CACHE_TTL));
    
    return result;
  }

  private async evaluateFeature(featureName: string, userId?: string): Promise<boolean> {
    // Get user context
    const user = userId ? await this.userRepository.getUser(userId) : null;
    const tier = user?.tier || 'free';

    // Check tier-based features first
    if (this.isTierFeature(featureName, tier)) {
      return true;
    }

    // Check user-specific overrides
    if (userId) {
      const userFlag = await this.flagRepository.getFeatureFlag(userId, featureName);
      if (userFlag && !this.isExpired(userFlag)) {
        return userFlag.enabled;
      }
    }

    // Check global flags
    const globalFlag = await this.flagRepository.getFeatureFlag(null, featureName);
    if (globalFlag && !this.isExpired(globalFlag)) {
      return globalFlag.enabled;
    }

    return false;
  }

  private isTierFeature(featureName: string, tier: UserTier): boolean {
    const tierFeatures = this.getTierFeatures(tier);
    return tierFeatures.includes(featureName);
  }

  private getTierFeatures(tier: UserTier): string[] {
    const features = {
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
    };

    // Include all lower tier features
    switch (tier) {
      case 'enterprise':
        return [...features.free, ...features.pro, ...features.enterprise];
      case 'pro':
        return [...features.free, ...features.pro];
      case 'free':
      default:
        return features.free;
    }
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? expiry > new Date() : false;
  }

  private isExpired(flag: FeatureFlag): boolean {
    return flag.expiresAt ? flag.expiresAt < new Date() : false;
  }

  // Cache management
  clearCache(): void {
    this.flagCache.clear();
    this.cacheExpiry.clear();
  }

  async refreshUserFlags(userId: string): Promise<void> {
    // Clear user-specific cache entries
    for (const [key] of this.flagCache) {
      if (key.startsWith(`${userId}:`)) {
        this.flagCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }
}
```

### 3.2 Feature Flag Enforcement Flow

```typescript
// 1. App boots → loads license file (desktop) or JWT (cloud)
const licenseManager = new LicenseManager();
const license = await licenseManager.loadLicense();

// 2. FeatureManager hydrates with repositories
const featureManager = new FeatureManager(flagRepository, userRepository);

// 3. UI asks for feature availability
if (await featureManager.isEnabled('high_res_export', userId)) {
  // Show high-res export button
}

// 4. Service/API endpoints guard business rules
if (!await featureManager.isEnabled('unlimited_projects', userId)) {
  const projectCount = await projectRepository.getProjectCount(userId);
  if (projectCount >= 3) {
    throw new TierLimitError('Upgrade to Pro for unlimited projects');
  }
}
```

---

## 4. UI Integration Patterns

### 4.1 React Hook for Feature Flags

```typescript
// frontend/lib/hooks/useFeatureFlag.ts
import { useEffect, useState } from 'react';
import { useFeatureManager } from './useFeatureManager';
import { useAuthStore } from '../stores/authStore';

export function useFeatureFlag(featureName: string): boolean {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const featureManager = useFeatureManager();
  const { user } = useAuthStore();

  useEffect(() => {
    const checkFeature = async () => {
      setIsLoading(true);
      try {
        const enabled = await featureManager.isEnabled(featureName, user?.id);
        setIsEnabled(enabled);
      } catch (error) {
        console.error(`Error checking feature ${featureName}:`, error);
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFeature();
  }, [featureName, user?.id, featureManager]);

  return isEnabled;
}

export function useFeatureFlagWithLoading(featureName: string): [boolean, boolean] {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const featureManager = useFeatureManager();
  const { user } = useAuthStore();

  useEffect(() => {
    const checkFeature = async () => {
      setIsLoading(true);
      try {
        const enabled = await featureManager.isEnabled(featureName, user?.id);
        setIsEnabled(enabled);
      } finally {
        setIsLoading(false);
      }
    };

    checkFeature();
  }, [featureName, user?.id, featureManager]);

  return [isEnabled, isLoading];
}
```

### 4.2 Feature Gate Component

```typescript
// frontend/components/ui/FeatureGate.tsx
import React from 'react';
import { useFeatureFlag } from '../../lib/hooks/useFeatureFlag';
import { UpgradePrompt } from './UpgradePrompt';

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
}: FeatureGateProps) {
  const isEnabled = useFeatureFlag(feature);

  if (isEnabled) {
    return <>{children}</>;
  }

  if (showUpgradePrompt && requiredTier) {
    return <UpgradePrompt feature={feature} requiredTier={requiredTier} />;
  }

  return fallback || null;
}

// Usage examples:
// <FeatureGate feature="high_res_export" requiredTier="pro">
//   <HighResExportButton />
// </FeatureGate>

// <FeatureGate feature="unlimited_projects" fallback={<ProjectLimitWarning />}>
//   <CreateProjectButton />
// </FeatureGate>
```

### 4.3 Conditional Rendering Patterns

```typescript
// Conditional button rendering
{isFeatureEnabled('high_res_export') && (
  <Button onClick={exportHighRes}>Export High-Res PDF</Button>
)}

// Feature-aware component props
<ExportDialog 
  showWatermarkOption={!isFeatureEnabled('high_res_export')}
  maxExportSize={isFeatureEnabled('unlimited_segments') ? Infinity : 25}
/>

// Tier-based UI variations
<ProjectList 
  maxProjects={isFeatureEnabled('unlimited_projects') ? undefined : 3}
  showUpgradePrompt={!isFeatureEnabled('unlimited_projects')}
/>
```

---

## 5. Backend Validation & Enforcement

### 5.1 Service Layer Validation

```typescript
// backend/services/ProjectService.ts
export class ProjectService {
  constructor(
    private projectRepository: ProjectRepository,
    private featureManager: FeatureManager
  ) {}

  async createProject(userId: string, projectData: CreateProjectRequest): Promise<Project> {
    // Always validate on backend - never trust client
    if (!await this.featureManager.isEnabled('unlimited_projects', userId)) {
      const projectCount = await this.projectRepository.getProjectCount(userId);
      if (projectCount >= 3) {
        throw new TierLimitExceededError(
          'Free tier limited to 3 projects. Upgrade to Pro for unlimited projects.',
          'unlimited_projects',
          'pro'
        );
      }
    }

    // Validate segment limits
    if (projectData.segments && projectData.segments.length > 25) {
      if (!await this.featureManager.isEnabled('unlimited_segments', userId)) {
        throw new TierLimitExceededError(
          'Free tier limited to 25 segments per project. Upgrade to Pro for unlimited segments.',
          'unlimited_segments',
          'pro'
        );
      }
    }

    return await this.projectRepository.saveProject(project);
  }

  async exportProject(userId: string, projectId: string, format: ExportFormat): Promise<ExportResult> {
    const project = await this.projectRepository.getProject(projectId);
    
    // Validate export permissions
    if (format === 'high_res_pdf' && !await this.featureManager.isEnabled('high_res_export', userId)) {
      throw new TierLimitExceededError(
        'High-resolution exports require Pro tier.',
        'high_res_export',
        'pro'
      );
    }

    // Apply watermark for free tier
    const shouldWatermark = !await this.featureManager.isEnabled('high_res_export', userId);
    
    return await this.exportService.exportProject(project, format, { watermark: shouldWatermark });
  }
}
```

### 5.2 Custom Error Types

```typescript
// backend/errors/TierLimitExceededError.ts
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

---

## 6. Offline License Integration

### 6.1 License-Based Feature Activation

```typescript
// electron/license/LicenseManager.ts
export class LicenseManager {
  async loadLicense(): Promise<LicenseInfo> {
    const licenseData = await this.loadFromKeystore();
    const isValid = await this.validateSignature(licenseData);
    
    if (!isValid) {
      throw new InvalidLicenseError('License signature validation failed');
    }

    return this.parseLicenseData(licenseData);
  }

  async activateFeatureFlags(license: LicenseInfo, flagRepository: FeatureFlagRepository): Promise<void> {
    // Clear existing flags for user
    await flagRepository.clearUserFlags(license.userId);

    // Activate tier-based features
    const tierFeatures = this.getTierFeatures(license.tier);
    for (const feature of tierFeatures) {
      await flagRepository.setFeatureFlag({
        id: generateUUID(),
        userId: license.userId,
        featureName: feature,
        enabled: true,
        tierRequired: license.tier,
        createdAt: new Date()
      });
    }

    // Activate any additional licensed features
    for (const feature of license.additionalFeatures || []) {
      await flagRepository.setFeatureFlag({
        id: generateUUID(),
        userId: license.userId,
        featureName: feature,
        enabled: true,
        tierRequired: license.tier,
        expiresAt: license.expiresAt,
        createdAt: new Date()
      });
    }
  }
}
```

---

## 7. SaaS Migration Strategy

### 7.1 Cloud Feature Flag Repository

```typescript
// frontend/lib/repositories/cloud/CloudFeatureFlagRepository.ts
export class CloudFeatureFlagRepository implements FeatureFlagRepository {
  constructor(private apiClient: ApiClient) {}

  async getFeatureFlag(userId: string, featureName: string): Promise<FeatureFlag | null> {
    const response = await this.apiClient.get(`/feature-flags/${featureName}`, {
      params: { userId }
    });
    return response.data;
  }

  async getUserFlags(userId: string): Promise<FeatureFlag[]> {
    const response = await this.apiClient.get(`/users/${userId}/feature-flags`);
    return response.data;
  }

  // Real-time flag updates via WebSocket
  subscribeToFlagUpdates(userId: string, callback: (flag: FeatureFlag) => void): () => void {
    const ws = this.apiClient.createWebSocket(`/feature-flags/subscribe/${userId}`);
    
    ws.onmessage = (event) => {
      const flag = JSON.parse(event.data);
      callback(flag);
    };

    return () => ws.close();
  }
}
```

### 7.2 Migration Workflow

```typescript
// Migration from offline to SaaS feature flags
export class FeatureFlagMigrator {
  async migrateToCloud(
    localRepository: FeatureFlagRepository,
    cloudRepository: FeatureFlagRepository,
    userId: string
  ): Promise<void> {
    // Export local flags
    const localFlags = await localRepository.getUserFlags(userId);
    
    // Import to cloud with conflict resolution
    for (const flag of localFlags) {
      const existingFlag = await cloudRepository.getFeatureFlag(userId, flag.featureName);
      
      if (!existingFlag || flag.updatedAt > existingFlag.updatedAt) {
        await cloudRepository.setFeatureFlag(flag);
      }
    }
  }
}
```

---

**Status**: ✅ **COMPLETE** - Feature flag system architecture with implementation examples  
**Next Step**: Create SaaS migration architecture documentation (Task 0.4)
