# Offline-to-SaaS Transition Architecture

**Source Documents:** `docs/developer-guide/air-duct-sizer-offline-version/air-duct-sizer-offline-first.md` section 14, `docs/developer-guide/Key remarks.md`  
**Purpose:** Complete SaaS transition roadmap enabling 70-80% code reuse and seamless user migration

---

## 1. Transition Strategy Overview

The offline-to-SaaS transition follows a carefully planned architecture that maximizes code reuse while providing clear upgrade paths for users.

### 1.1 Core Principles

- **70-80% code reuse**: Business logic, UI components, and validation remain unchanged
- **Data portability**: Seamless migration of offline projects to cloud storage
- **Feature continuity**: All offline features work identically in SaaS
- **Incremental migration**: Users can transition gradually without data loss

### 1.2 Migration Phases

```
Phase 1: Offline Desktop     Phase 1.5: Hybrid          Phase 2: Full SaaS
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│ • Local SQLite      │ ──► │ • Local + Cloud     │ ──► │ • Cloud PostgreSQL  │
│ • Manual updates    │     │ • Optional sync     │     │ • Real-time sync    │
│ • Single user       │     │ • Backup to cloud   │     │ • Multi-user        │
│ • Perpetual license │     │ • License + trial   │     │ • Subscription      │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

---

## 2. Data Migration Strategy

### 2.1 SQLite with Change-Log Architecture

**Recommended Approach**: Local SQLite with change-log table for cloud sync readiness

```sql
-- Core data tables (Phase 1)
CREATE TABLE projects (
  id TEXT PRIMARY KEY,              -- UUID for cloud compatibility
  user_id TEXT NOT NULL,           -- Multi-tenant ready
  name TEXT NOT NULL,
  data JSON,                       -- Flexible schema
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Change tracking for cloud sync (Phase 1.5+)
CREATE TABLE change_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,       -- 'project', 'user', 'feature_flag'
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,         -- 'INSERT', 'UPDATE', 'DELETE'
  changes JSON,                    -- Delta or full record
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced_at DATETIME,             -- NULL until synced to cloud
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'conflict'
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 2.2 Migration Benefits

| Benefit | Description | Impact |
|---------|-------------|---------|
| **Incremental Sync** | Change logs enable delta uploads | Faster sync, reduced bandwidth |
| **Conflict Resolution** | Track changes for merge strategies | Reliable multi-device sync |
| **Audit Trail** | Complete history of all changes | Enterprise compliance ready |
| **Rollback Capability** | Revert to previous states | Data safety and recovery |

---

## 3. Service Layer Architecture

### 3.1 Repository Pattern Implementation

```typescript
// Core abstraction enabling 70-80% code reuse
interface ProjectRepository {
  getProject(id: string): Promise<Project>;
  saveProject(project: Project): Promise<void>;
  listProjects(userId: string): Promise<Project[]>;
  deleteProject(id: string): Promise<void>;
}

// Phase 1: Local implementation
class LocalProjectRepository implements ProjectRepository {
  constructor(private db: SQLiteDatabase) {}
  
  async saveProject(project: Project): Promise<void> {
    await this.db.run(/* SQLite operations */);
    await this.logChange('project', project.id, 'UPSERT', project);
  }
}

// Phase 2: Cloud implementation (same interface!)
class CloudProjectRepository implements ProjectRepository {
  constructor(private apiClient: ApiClient) {}
  
  async saveProject(project: Project): Promise<void> {
    await this.apiClient.put(`/projects/${project.id}`, project);
  }
}
```

### 3.2 Business Logic Separation

```typescript
// Core calculation engines (100% reusable)
export class AirDuctCalculator {
  calculateDuctSizing(inputs: DuctSizingInputs): DuctSizingResults {
    // Pure calculation logic - no storage dependencies
    return this.performCalculations(inputs);
  }
}

// Service layer (95% reusable)
export class ProjectService {
  constructor(
    private projectRepository: ProjectRepository,  // Swappable!
    private calculator: AirDuctCalculator,
    private featureManager: FeatureManager
  ) {}

  async createProject(userId: string, data: ProjectData): Promise<Project> {
    // Same business logic for offline and SaaS
    const project = await this.projectRepository.saveProject(/* ... */);
    return project;
  }
}
```

---

## 4. Multi-Tenant Preparation

### 4.1 Database Schema Design

```sql
-- Multi-tenant ready from Phase 1
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- UUID
  email TEXT UNIQUE,
  tier TEXT DEFAULT 'free',
  organization_id TEXT,             -- For enterprise multi-tenancy
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organizations (
  id TEXT PRIMARY KEY,              -- UUID
  name TEXT NOT NULL,
  tier TEXT DEFAULT 'pro',          -- 'pro', 'enterprise'
  settings JSON,                    -- Org-specific configuration
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Row-level security ready
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization_id TEXT,             -- NULL for individual users
  -- ... other fields
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
```

### 4.2 PostgreSQL Migration Path

```sql
-- Phase 2: PostgreSQL with row-level security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can only access their own projects
CREATE POLICY user_projects_policy ON projects
  FOR ALL TO authenticated_users
  USING (user_id = current_user_id());

-- Organization members can access org projects
CREATE POLICY org_projects_policy ON projects
  FOR ALL TO authenticated_users
  USING (
    organization_id IS NOT NULL AND 
    organization_id IN (
      SELECT organization_id FROM users WHERE id = current_user_id()
    )
  );
```

---

## 5. Dormant Cloud Features (Phase 1)

### 5.1 Connectivity Check Module

```typescript
// Phase 1: Dormant, Phase 2: Active
export class ConnectivityManager {
  private isCloudEnabled = false;  // Disabled in Phase 1

  async checkCloudAvailability(): Promise<boolean> {
    if (!this.isCloudEnabled) return false;
    
    try {
      const response = await fetch('/api/health', { timeout: 5000 });
      return response.ok;
    } catch {
      return false;
    }
  }

  enableCloudFeatures(): void {
    this.isCloudEnabled = true;
  }
}
```

### 5.2 Sync Queue Component

```typescript
// Phase 1: Placeholder, Phase 2: Functional
export class SyncQueue {
  private isEnabled = false;

  async queueChange(change: ChangeLogEntry): Promise<void> {
    if (!this.isEnabled) {
      // Phase 1: Just log locally
      console.debug('Change queued for future sync:', change);
      return;
    }

    // Phase 2: Actually sync to cloud
    await this.syncToCloud(change);
  }

  enableCloudSync(): void {
    this.isEnabled = true;
  }
}
```

---

## 6. Anonymous Telemetry System

### 6.1 Privacy-First Analytics

```typescript
// Disabled by default, opt-in only
export class TelemetryManager {
  private isEnabled = false;
  private events: TelemetryEvent[] = [];

  async recordEvent(eventName: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isEnabled) return;

    const event: TelemetryEvent = {
      id: generateUUID(),
      name: eventName,
      properties: this.sanitizeProperties(properties),
      timestamp: new Date(),
      sessionId: this.getSessionId(),
      // No user identification - completely anonymous
    };

    this.events.push(event);
    await this.persistLocally(event);
  }

  async enableTelemetry(userConsent: boolean): Promise<void> {
    this.isEnabled = userConsent;
    if (userConsent) {
      await this.uploadQueuedEvents();
    }
  }

  private sanitizeProperties(properties?: Record<string, any>): Record<string, any> {
    // Remove any potentially identifying information
    const sanitized = { ...properties };
    delete sanitized.email;
    delete sanitized.name;
    delete sanitized.projectName;
    return sanitized;
  }
}
```

### 6.2 Usage Insights for SaaS Planning

```typescript
// Events to track for SaaS feature prioritization
const TELEMETRY_EVENTS = {
  PROJECT_CREATED: 'project_created',
  CALCULATION_PERFORMED: 'calculation_performed',
  EXPORT_GENERATED: 'export_generated',
  FEATURE_ACCESSED: 'feature_accessed',
  TIER_LIMIT_REACHED: 'tier_limit_reached',
  UPGRADE_PROMPT_SHOWN: 'upgrade_prompt_shown'
};

// Usage example
await telemetryManager.recordEvent(TELEMETRY_EVENTS.TIER_LIMIT_REACHED, {
  feature: 'unlimited_projects',
  currentTier: 'free',
  requiredTier: 'pro'
});
```

---

## 7. Migration Workflow

### 7.1 User Migration Process

```typescript
export class UserMigrationService {
  async migrateToSaaS(userId: string): Promise<MigrationResult> {
    const migrationId = generateUUID();
    
    try {
      // 1. Export offline data
      const exportData = await this.exportOfflineData(userId);
      
      // 2. Create cloud account
      const cloudUser = await this.createCloudAccount(exportData.user);
      
      // 3. Upload projects with preserved IDs
      await this.uploadProjects(cloudUser.id, exportData.projects);
      
      // 4. Migrate feature flags and settings
      await this.migrateUserSettings(cloudUser.id, exportData.settings);
      
      // 5. Verify data integrity
      const verification = await this.verifyMigration(cloudUser.id, exportData);
      
      return {
        migrationId,
        success: true,
        cloudUserId: cloudUser.id,
        migratedProjects: exportData.projects.length,
        verification
      };
      
    } catch (error) {
      await this.rollbackMigration(migrationId);
      throw new MigrationError(`Migration failed: ${error.message}`);
    }
  }

  async createMigrationWizard(): Promise<MigrationWizard> {
    return new MigrationWizard({
      steps: [
        'account_creation',
        'data_export',
        'cloud_upload',
        'verification',
        'cleanup'
      ],
      estimatedTime: '5-10 minutes',
      dataPortability: true
    });
  }
}
```

### 7.2 Transition Path Options

```typescript
// Option 1: Immediate full migration
export class ImmediateMigration {
  async migrate(userId: string): Promise<void> {
    await this.migrateAllData(userId);
    await this.switchToCloudMode();
    await this.cleanupLocalData(); // Optional
  }
}

// Option 2: Hybrid mode (Phase 1.5)
export class HybridMigration {
  async enableHybridMode(userId: string): Promise<void> {
    await this.createCloudAccount(userId);
    await this.enableCloudBackup();
    // Keep local data as primary, cloud as backup
  }
}

// Option 3: Gradual migration
export class GradualMigration {
  async migrateProjectByProject(userId: string): Promise<void> {
    const projects = await this.getLocalProjects(userId);
    
    for (const project of projects) {
      await this.migrateProject(project);
      await this.markProjectAsMigrated(project.id);
    }
  }
}
```

---

## 8. Feature Differentiation Strategy

### 8.1 Offline vs SaaS Feature Matrix

| Feature Category | Offline (Phase 1) | SaaS (Phase 2+) |
|------------------|-------------------|------------------|
| **Core Functionality** | ✅ Full air duct sizer | ✅ All HVAC tools |
| **Project Limits** | 3 projects max | Unlimited |
| **Collaboration** | ❌ Single user | ✅ Team sharing |
| **Cloud Storage** | ❌ Local only | ✅ Multi-device sync |
| **Version History** | ❌ No versioning | ✅ Full audit trail |
| **API Access** | ❌ No API | ✅ REST/GraphQL API |
| **Custom Templates** | ❌ Standard only | ✅ Custom branding |
| **Support Level** | 📚 Documentation | 📞 Priority support |

### 8.2 Upgrade Incentives

```typescript
export class UpgradeIncentiveManager {
  async showUpgradePrompt(context: UpgradeContext): Promise<void> {
    const prompts = {
      project_limit: {
        title: 'Unlock Unlimited Projects',
        message: 'Upgrade to Pro for unlimited projects and cloud sync',
        benefits: ['Unlimited projects', 'Cloud backup', 'Multi-device access'],
        cta: 'Start Free Trial'
      },
      collaboration: {
        title: 'Share with Your Team',
        message: 'Collaborate on projects with team members',
        benefits: ['Team sharing', 'Real-time collaboration', 'Role management'],
        cta: 'Upgrade to Pro'
      }
    };

    await this.displayPrompt(prompts[context.trigger]);
  }
}
```

---

## 9. Technical Implementation Roadmap

### 9.1 Phase 1: Offline Foundation (Weeks 1-8)

- ✅ Repository pattern implementation
- ✅ SQLite with change-log table
- ✅ Feature flag system
- ✅ Dormant cloud stubs
- ✅ Anonymous telemetry (opt-in)

### 9.2 Phase 1.5: Hybrid Mode (Weeks 9-12)

- 🔄 Enable cloud connectivity checks
- 🔄 Implement optional cloud backup
- 🔄 Add migration wizard UI
- 🔄 Beta test with select users

### 9.3 Phase 2: Full SaaS (Weeks 13-20)

- 🔄 Deploy cloud infrastructure
- 🔄 Implement real-time sync
- 🔄 Add team collaboration features
- 🔄 Launch subscription billing

### 9.4 Phase 3: Enterprise Features (Weeks 21+)

- 🔄 SSO integration
- 🔄 Advanced RBAC
- 🔄 Audit logging
- 🔄 Custom branding

---

## 10. Success Metrics

### 10.1 Code Reuse Validation

- **Target**: 70-80% code reuse from offline to SaaS
- **Measurement**: Lines of code analysis, component reuse tracking
- **Key Areas**: Business logic (90%+), UI components (80%+), validation (95%+)

### 10.2 Migration Success Metrics

- **Data Integrity**: 100% successful project migration
- **User Adoption**: >80% of offline users try SaaS trial
- **Conversion Rate**: >30% trial-to-paid conversion
- **Performance**: Migration completes in <10 minutes

---

**Status**: ✅ **COMPLETE** - SaaS transition roadmap documented with migration strategies  
**Next Step**: Create database schema documentation (Task 0.5)
