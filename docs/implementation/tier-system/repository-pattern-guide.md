# Repository Pattern Implementation Guide

**Source Document:** `docs/developer-guide/Tier and Feature Separation.md` section 1.4  
**Purpose:** Enable 70-80% code reuse for SaaS migration through clean data layer abstraction

---

## 1. Repository Pattern Overview

The repository pattern provides a clean abstraction layer between business logic and data storage, enabling seamless transitions from SQLite (offline) to cloud APIs (SaaS) without changing core application logic.

### 1.1 Key Benefits

- **Hot-swappable backends**: SQLite today, cloud API tomorrow
- **Tier-aware data access**: Built-in support for feature flag enforcement
- **SaaS migration ready**: 70-80% code reuse target achieved
- **Testing friendly**: Easy mocking and unit testing

### 1.2 Architecture Layers

```
┌─────────────────────────────────────┐
│           UI Components             │
├─────────────────────────────────────┤
│         Service Layer               │
│    (FeatureManager, Business Logic) │
├─────────────────────────────────────┤
│       Repository Interfaces        │
│   (ProjectRepository, UserRepository)│
├─────────────────────────────────────┤
│     Concrete Implementations       │
│  (LocalSQLite ↔ CloudAPI)          │
└─────────────────────────────────────┘
```

---

## 2. Core Repository Interfaces

### 2.1 ProjectRepository Interface

```typescript
// frontend/lib/repositories/interfaces/ProjectRepository.ts
export interface Project {
  id: string;                    // UUID
  userId: string;               // Foreign key to users table
  name: string;
  client?: string;
  address?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  lastModified: Date;
}

export interface ProjectRepository {
  // Core CRUD operations
  getProject(id: string): Promise<Project | null>;
  saveProject(project: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;
  
  // Tier-aware queries
  listProjects(userId: string, tier: UserTier): Promise<Project[]>;
  getProjectCount(userId: string): Promise<number>;
  
  // Tier enforcement
  canCreateProject(userId: string, tier: UserTier): Promise<boolean>;
  
  // SaaS migration support
  exportProjects(userId: string): Promise<Project[]>;
  importProjects(projects: Project[]): Promise<void>;
}

export type UserTier = 'free' | 'pro' | 'enterprise';
```

### 2.2 UserRepository Interface

```typescript
// frontend/lib/repositories/interfaces/UserRepository.ts
export interface User {
  id: string;                    // UUID
  email: string;
  name?: string;
  tier: UserTier;
  company?: string;
  licenseKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRepository {
  // User management
  getUser(id: string): Promise<User | null>;
  getCurrentUser(): Promise<User | null>;
  saveUser(user: User): Promise<void>;
  updateUserTier(userId: string, tier: UserTier): Promise<void>;
  
  // License management
  validateLicense(licenseKey: string): Promise<boolean>;
  getLicenseInfo(userId: string): Promise<LicenseInfo | null>;
}

export interface LicenseInfo {
  tier: UserTier;
  features: string[];
  expiresAt?: Date;
  isValid: boolean;
}
```

### 2.3 FeatureFlagRepository Interface

```typescript
// frontend/lib/repositories/interfaces/FeatureFlagRepository.ts
export interface FeatureFlag {
  id: string;
  userId?: string;              // null for global flags
  featureName: string;
  enabled: boolean;
  tierRequired: UserTier;
  expiresAt?: Date;
  createdAt: Date;
}

export interface FeatureFlagRepository {
  // Feature flag queries
  getFeatureFlag(userId: string, featureName: string): Promise<FeatureFlag | null>;
  getUserFlags(userId: string): Promise<FeatureFlag[]>;
  getGlobalFlags(): Promise<FeatureFlag[]>;
  
  // Feature flag management
  setFeatureFlag(flag: FeatureFlag): Promise<void>;
  removeFeatureFlag(userId: string, featureName: string): Promise<void>;
  
  // Tier-based queries
  getFlagsForTier(tier: UserTier): Promise<FeatureFlag[]>;
}
```

---

## 3. Local SQLite Implementations

### 3.1 LocalProjectRepository

```typescript
// frontend/lib/repositories/local/LocalProjectRepository.ts
import { Database } from 'better-sqlite3';
import { ProjectRepository, Project, UserTier } from '../interfaces/ProjectRepository';

export class LocalProjectRepository implements ProjectRepository {
  constructor(private db: Database) {}

  async getProject(id: string): Promise<Project | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `);
    const row = stmt.get(id);
    return row ? this.mapRowToProject(row) : null;
  }

  async saveProject(project: Project): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO projects 
      (id, user_id, name, client, address, metadata, created_at, last_modified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      project.id,
      project.userId,
      project.name,
      project.client,
      project.address,
      JSON.stringify(project.metadata),
      project.createdAt.toISOString(),
      project.lastModified.toISOString()
    );

    // Log change for SaaS sync
    await this.logChange('project', project.id, 'UPSERT', project);
  }

  async listProjects(userId: string, tier: UserTier): Promise<Project[]> {
    let query = `SELECT * FROM projects WHERE user_id = ? ORDER BY last_modified DESC`;
    
    // Apply tier limits
    if (tier === 'free') {
      query += ` LIMIT 3`;  // Free tier: max 3 projects
    }
    
    const stmt = this.db.prepare(query);
    const rows = stmt.all(userId);
    return rows.map(row => this.mapRowToProject(row));
  }

  async getProjectCount(userId: string): Promise<number> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM projects WHERE user_id = ?
    `);
    const result = stmt.get(userId) as { count: number };
    return result.count;
  }

  async canCreateProject(userId: string, tier: UserTier): Promise<boolean> {
    const count = await this.getProjectCount(userId);
    
    switch (tier) {
      case 'free':
        return count < 3;  // Free tier limit
      case 'pro':
      case 'enterprise':
        return true;       // Unlimited
      default:
        return false;
    }
  }

  private async logChange(entityType: string, entityId: string, operation: string, data: any): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO change_log (user_id, entity_type, entity_id, operation, changes, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      data.userId,
      entityType,
      entityId,
      operation,
      JSON.stringify(data),
      new Date().toISOString()
    );
  }

  private mapRowToProject(row: any): Project {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      client: row.client,
      address: row.address,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }
}
```

### 3.2 LocalUserRepository

```typescript
// frontend/lib/repositories/local/LocalUserRepository.ts
import { Database } from 'better-sqlite3';
import { UserRepository, User, UserTier, LicenseInfo } from '../interfaces/UserRepository';

export class LocalUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async getCurrentUser(): Promise<User | null> {
    // In offline mode, there's typically one user
    const stmt = this.db.prepare(`SELECT * FROM users LIMIT 1`);
    const row = stmt.get();
    return row ? this.mapRowToUser(row) : null;
  }

  async getUser(id: string): Promise<User | null> {
    const stmt = this.db.prepare(`SELECT * FROM users WHERE id = ?`);
    const row = stmt.get(id);
    return row ? this.mapRowToUser(row) : null;
  }

  async updateUserTier(userId: string, tier: UserTier): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE users SET tier = ?, updated_at = ? WHERE id = ?
    `);
    
    stmt.run(tier, new Date().toISOString(), userId);
    
    // Log tier change for audit
    await this.logChange('user', userId, 'UPDATE', { tier });
  }

  async validateLicense(licenseKey: string): Promise<boolean> {
    // Implement license validation logic
    // This would typically verify signature, expiration, etc.
    return licenseKey.length > 0; // Simplified for example
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      tier: row.tier as UserTier,
      company: row.company,
      licenseKey: row.license_key,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
```

---

## 4. Future Cloud API Implementations

### 4.1 CloudProjectRepository

```typescript
// frontend/lib/repositories/cloud/CloudProjectRepository.ts
import { ProjectRepository, Project, UserTier } from '../interfaces/ProjectRepository';
import { ApiClient } from '../api/ApiClient';

export class CloudProjectRepository implements ProjectRepository {
  constructor(private apiClient: ApiClient) {}

  async getProject(id: string): Promise<Project | null> {
    try {
      const response = await this.apiClient.get(`/projects/${id}`);
      return response.data;
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  async saveProject(project: Project): Promise<void> {
    await this.apiClient.put(`/projects/${project.id}`, project);
  }

  async listProjects(userId: string, tier: UserTier): Promise<Project[]> {
    const response = await this.apiClient.get(`/users/${userId}/projects`, {
      params: { tier } // Server applies tier limits
    });
    return response.data;
  }

  async canCreateProject(userId: string, tier: UserTier): Promise<boolean> {
    const response = await this.apiClient.get(`/users/${userId}/project-limits`, {
      params: { tier }
    });
    return response.data.canCreate;
  }

  // Real-time sync capabilities
  async syncChanges(since: Date): Promise<Project[]> {
    const response = await this.apiClient.get('/projects/changes', {
      params: { since: since.toISOString() }
    });
    return response.data;
  }
}
```

---

## 5. Dependency Injection & Configuration

### 5.1 Repository Factory

```typescript
// frontend/lib/repositories/RepositoryFactory.ts
import { ProjectRepository } from './interfaces/ProjectRepository';
import { UserRepository } from './interfaces/UserRepository';
import { FeatureFlagRepository } from './interfaces/FeatureFlagRepository';
import { LocalProjectRepository } from './local/LocalProjectRepository';
import { CloudProjectRepository } from './cloud/CloudProjectRepository';

export interface RepositoryContainer {
  projectRepository: ProjectRepository;
  userRepository: UserRepository;
  featureFlagRepository: FeatureFlagRepository;
}

export class RepositoryFactory {
  static createLocal(database: Database): RepositoryContainer {
    return {
      projectRepository: new LocalProjectRepository(database),
      userRepository: new LocalUserRepository(database),
      featureFlagRepository: new LocalFeatureFlagRepository(database)
    };
  }

  static createCloud(apiClient: ApiClient): RepositoryContainer {
    return {
      projectRepository: new CloudProjectRepository(apiClient),
      userRepository: new CloudUserRepository(apiClient),
      featureFlagRepository: new CloudFeatureFlagRepository(apiClient)
    };
  }
}
```

### 5.2 Application Configuration

```typescript
// frontend/lib/config/AppConfig.ts
export class AppConfig {
  static async initialize(): Promise<RepositoryContainer> {
    const isOfflineMode = !navigator.onLine || process.env.NODE_ENV === 'development';
    
    if (isOfflineMode) {
      const database = await this.initializeDatabase();
      return RepositoryFactory.createLocal(database);
    } else {
      const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL);
      return RepositoryFactory.createCloud(apiClient);
    }
  }
}
```

---

## 6. Integration with Feature Flag System

### 6.1 Tier-Aware Repository Usage

```typescript
// frontend/lib/services/ProjectService.ts
export class ProjectService {
  constructor(
    private projectRepository: ProjectRepository,
    private featureManager: FeatureManager
  ) {}

  async createProject(userId: string, projectData: Partial<Project>): Promise<Project> {
    const user = await this.userRepository.getUser(userId);
    
    // Check tier limits before creation
    const canCreate = await this.projectRepository.canCreateProject(userId, user.tier);
    if (!canCreate) {
      throw new TierLimitError('Project limit reached. Upgrade to Pro for unlimited projects.');
    }

    const project: Project = {
      id: generateUUID(),
      userId,
      ...projectData,
      createdAt: new Date(),
      lastModified: new Date()
    };

    await this.projectRepository.saveProject(project);
    return project;
  }
}
```

---

## 7. Migration Strategy

### 7.1 Data Export for SaaS Migration

```typescript
// frontend/lib/migration/DataMigrator.ts
export class DataMigrator {
  async exportForSaaS(localRepositories: RepositoryContainer): Promise<MigrationData> {
    const user = await localRepositories.userRepository.getCurrentUser();
    const projects = await localRepositories.projectRepository.exportProjects(user.id);
    const flags = await localRepositories.featureFlagRepository.getUserFlags(user.id);

    return {
      user,
      projects,
      featureFlags: flags,
      exportedAt: new Date()
    };
  }

  async importToCloud(cloudRepositories: RepositoryContainer, data: MigrationData): Promise<void> {
    // Import user first
    await cloudRepositories.userRepository.saveUser(data.user);
    
    // Import projects with preserved IDs
    for (const project of data.projects) {
      await cloudRepositories.projectRepository.saveProject(project);
    }
    
    // Import feature flags
    for (const flag of data.featureFlags) {
      await cloudRepositories.featureFlagRepository.setFeatureFlag(flag);
    }
  }
}
```

---

## 8. Validation & Testing

### 8.1 Repository Testing Strategy

```typescript
// frontend/tests/repositories/ProjectRepository.test.ts
describe('ProjectRepository', () => {
  let repository: ProjectRepository;
  
  beforeEach(() => {
    // Test with in-memory SQLite
    const db = new Database(':memory:');
    repository = new LocalProjectRepository(db);
  });

  describe('tier enforcement', () => {
    it('should enforce free tier project limit', async () => {
      const userId = 'test-user';
      
      // Create 3 projects (free tier limit)
      for (let i = 0; i < 3; i++) {
        const canCreate = await repository.canCreateProject(userId, 'free');
        expect(canCreate).toBe(true);
        
        await repository.saveProject(createTestProject(userId));
      }
      
      // 4th project should be blocked
      const canCreateFourth = await repository.canCreateProject(userId, 'free');
      expect(canCreateFourth).toBe(false);
    });
  });
});
```

---

**Status**: ✅ **COMPLETE** - Repository pattern architecture documented with concrete code examples  
**Next Step**: Implement feature flag architecture specification (Task 0.3)
