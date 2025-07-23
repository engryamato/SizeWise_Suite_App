# Repository Interfaces API Documentation

**Purpose:** Complete API documentation for all repository interfaces enabling implementation without ambiguity  
**Reference:** `docs/implementation/tier-system/repository-pattern-guide.md`

---

## 1. ProjectRepository Interface

### 1.1 Interface Definition

```typescript
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
  getProject(id: string): Promise<Project | null>;
  saveProject(project: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;
  listProjects(userId: string, tier: UserTier): Promise<Project[]>;
  getProjectCount(userId: string): Promise<number>;
  canCreateProject(userId: string, tier: UserTier): Promise<boolean>;
  exportProjects(userId: string): Promise<Project[]>;
  importProjects(projects: Project[]): Promise<void>;
}

export type UserTier = 'free' | 'pro' | 'enterprise';
```

### 1.2 Method Documentation

#### getProject(id: string): Promise<Project | null>
**Purpose:** Retrieve a single project by ID

**Parameters:**
- `id` (string): UUID of the project to retrieve

**Returns:**
- `Promise<Project | null>`: Project object if found, null if not found

**Throws:**
- `DatabaseError`: If database operation fails
- `ValidationError`: If ID format is invalid

**Example:**
```typescript
const project = await projectRepository.getProject('123e4567-e89b-12d3-a456-426614174000');
if (project) {
  console.log(`Found project: ${project.name}`);
}
```

#### saveProject(project: Project): Promise<void>
**Purpose:** Create or update a project

**Parameters:**
- `project` (Project): Complete project object to save

**Returns:**
- `Promise<void>`: Resolves when save operation completes

**Throws:**
- `ValidationError`: If project data is invalid
- `DatabaseError`: If save operation fails
- `TierLimitExceededError`: If user has reached project limit

**Validation Rules:**
- `id` must be valid UUID
- `userId` must exist in users table
- `name` must be non-empty string
- `createdAt` and `lastModified` must be valid dates

**Example:**
```typescript
const newProject: Project = {
  id: generateUUID(),
  userId: 'user-123',
  name: 'Office Building HVAC',
  client: 'ABC Corporation',
  address: '123 Main St, City, State',
  metadata: { buildingType: 'office', floors: 5 },
  createdAt: new Date(),
  lastModified: new Date()
};

await projectRepository.saveProject(newProject);
```

#### deleteProject(id: string): Promise<void>
**Purpose:** Delete a project and all associated data

**Parameters:**
- `id` (string): UUID of the project to delete

**Returns:**
- `Promise<void>`: Resolves when deletion completes

**Throws:**
- `ProjectNotFoundError`: If project doesn't exist
- `DatabaseError`: If deletion fails

**Side Effects:**
- Deletes all project segments
- Removes project from change log
- Updates user's project count

**Example:**
```typescript
await projectRepository.deleteProject('123e4567-e89b-12d3-a456-426614174000');
```

#### listProjects(userId: string, tier: UserTier): Promise<Project[]>
**Purpose:** Get all projects for a user with tier-based filtering

**Parameters:**
- `userId` (string): UUID of the user
- `tier` (UserTier): User's current tier ('free' | 'pro' | 'enterprise')

**Returns:**
- `Promise<Project[]>`: Array of projects ordered by lastModified (newest first)

**Tier Behavior:**
- `free`: Returns maximum 3 projects
- `pro`: Returns all projects
- `enterprise`: Returns all projects

**Throws:**
- `UserNotFoundError`: If user doesn't exist
- `DatabaseError`: If query fails

**Example:**
```typescript
const projects = await projectRepository.listProjects('user-123', 'free');
console.log(`User has ${projects.length} projects`);
```

#### getProjectCount(userId: string): Promise<number>
**Purpose:** Get total number of projects for a user

**Parameters:**
- `userId` (string): UUID of the user

**Returns:**
- `Promise<number>`: Total project count

**Throws:**
- `UserNotFoundError`: If user doesn't exist
- `DatabaseError`: If query fails

**Example:**
```typescript
const count = await projectRepository.getProjectCount('user-123');
if (count >= 3) {
  console.log('User has reached free tier limit');
}
```

#### canCreateProject(userId: string, tier: UserTier): Promise<boolean>
**Purpose:** Check if user can create another project based on tier limits

**Parameters:**
- `userId` (string): UUID of the user
- `tier` (UserTier): User's current tier

**Returns:**
- `Promise<boolean>`: true if user can create project, false otherwise

**Tier Logic:**
- `free`: false if user has 3+ projects
- `pro`: always true
- `enterprise`: always true

**Throws:**
- `UserNotFoundError`: If user doesn't exist
- `DatabaseError`: If query fails

**Example:**
```typescript
const canCreate = await projectRepository.canCreateProject('user-123', 'free');
if (!canCreate) {
  throw new TierLimitExceededError('Upgrade to Pro for unlimited projects');
}
```

---

## 2. UserRepository Interface

### 2.1 Interface Definition

```typescript
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

export interface LicenseInfo {
  tier: UserTier;
  features: string[];
  expiresAt?: Date;
  isValid: boolean;
}

export interface UserRepository {
  getUser(id: string): Promise<User | null>;
  getCurrentUser(): Promise<User | null>;
  saveUser(user: User): Promise<void>;
  updateUserTier(userId: string, tier: UserTier): Promise<void>;
  validateLicense(licenseKey: string): Promise<boolean>;
  getLicenseInfo(userId: string): Promise<LicenseInfo | null>;
}
```

### 2.2 Method Documentation

#### getUser(id: string): Promise<User | null>
**Purpose:** Retrieve user by ID

**Parameters:**
- `id` (string): UUID of the user

**Returns:**
- `Promise<User | null>`: User object if found, null otherwise

**Throws:**
- `DatabaseError`: If query fails
- `ValidationError`: If ID format invalid

#### getCurrentUser(): Promise<User | null>
**Purpose:** Get the currently authenticated user (offline mode: single user)

**Returns:**
- `Promise<User | null>`: Current user or null if none exists

**Implementation Notes:**
- Offline mode: Returns first user in database
- SaaS mode: Returns user from authentication context

#### updateUserTier(userId: string, tier: UserTier): Promise<void>
**Purpose:** Update user's tier (for license upgrades/downgrades)

**Parameters:**
- `userId` (string): UUID of the user
- `tier` (UserTier): New tier to assign

**Returns:**
- `Promise<void>`: Resolves when update completes

**Throws:**
- `UserNotFoundError`: If user doesn't exist
- `ValidationError`: If tier is invalid
- `DatabaseError`: If update fails

**Side Effects:**
- Updates user's tier in database
- Logs tier change in change_log table
- Triggers feature flag refresh

---

## 3. FeatureFlagRepository Interface

### 3.1 Interface Definition

```typescript
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
  getFeatureFlag(userId: string, featureName: string): Promise<FeatureFlag | null>;
  getUserFlags(userId: string): Promise<FeatureFlag[]>;
  getGlobalFlags(): Promise<FeatureFlag[]>;
  setFeatureFlag(flag: FeatureFlag): Promise<void>;
  removeFeatureFlag(userId: string, featureName: string): Promise<void>;
  getFlagsForTier(tier: UserTier): Promise<FeatureFlag[]>;
}
```

### 3.2 Method Documentation

#### getFeatureFlag(userId: string, featureName: string): Promise<FeatureFlag | null>
**Purpose:** Get specific feature flag for user

**Parameters:**
- `userId` (string): UUID of the user (null for global flags)
- `featureName` (string): Name of the feature flag

**Returns:**
- `Promise<FeatureFlag | null>`: Feature flag if found, null otherwise

**Lookup Order:**
1. User-specific flag
2. Global flag
3. null if neither exists

#### setFeatureFlag(flag: FeatureFlag): Promise<void>
**Purpose:** Create or update a feature flag

**Parameters:**
- `flag` (FeatureFlag): Complete feature flag object

**Validation Rules:**
- `featureName` must be non-empty
- `tierRequired` must be valid tier
- `userId` must exist if specified
- `expiresAt` must be future date if specified

---

## 4. Error Handling

### 4.1 Standard Error Types

```typescript
export class DatabaseError extends Error {
  constructor(message: string, public readonly operation: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export class ProjectNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Project not found: ${projectId}`);
    this.name = 'ProjectNotFoundError';
  }
}

export class TierLimitExceededError extends Error {
  constructor(
    message: string,
    public readonly requiredFeature: string,
    public readonly requiredTier: string
  ) {
    super(message);
    this.name = 'TierLimitExceededError';
  }
}
```

### 4.2 Error Handling Patterns

```typescript
// Repository method with proper error handling
async getProject(id: string): Promise<Project | null> {
  try {
    // Validate input
    if (!this.isValidUUID(id)) {
      throw new ValidationError('Invalid project ID format', 'id');
    }

    // Perform database operation
    const result = await this.db.get('SELECT * FROM projects WHERE id = ?', [id]);
    
    return result ? this.mapRowToProject(result) : null;
    
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error; // Re-throw validation errors
    }
    
    // Wrap database errors
    throw new DatabaseError(`Failed to get project: ${error.message}`, 'getProject');
  }
}
```

---

## 5. Implementation Guidelines

### 5.1 Local Implementation (SQLite)

```typescript
export class LocalProjectRepository implements ProjectRepository {
  constructor(private db: Database) {}

  async getProject(id: string): Promise<Project | null> {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapRowToProject(row) : null;
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

### 5.2 Cloud Implementation (API)

```typescript
export class CloudProjectRepository implements ProjectRepository {
  constructor(private apiClient: ApiClient) {}

  async getProject(id: string): Promise<Project | null> {
    try {
      const response = await this.apiClient.get(`/projects/${id}`);
      return response.data;
    } catch (error) {
      if (error.status === 404) return null;
      throw new DatabaseError(`API request failed: ${error.message}`, 'getProject');
    }
  }
}
```

### 5.3 Testing Patterns

```typescript
describe('ProjectRepository', () => {
  let repository: ProjectRepository;

  beforeEach(() => {
    const db = new Database(':memory:');
    repository = new LocalProjectRepository(db);
  });

  it('should return null for non-existent project', async () => {
    const result = await repository.getProject('non-existent-id');
    expect(result).toBeNull();
  });

  it('should enforce free tier project limit', async () => {
    // Create 3 projects
    for (let i = 0; i < 3; i++) {
      await repository.saveProject(createTestProject());
    }

    // 4th project should be blocked
    const canCreate = await repository.canCreateProject('user-id', 'free');
    expect(canCreate).toBe(false);
  });
});
```

---

**Status**: ✅ **COMPLETE** - Repository interfaces API documentation with complete method signatures  
**Next Step**: Create Feature Flag API documentation
