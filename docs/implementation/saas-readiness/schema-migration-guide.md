# Database Schema Migration Guide

**Source Documents:** `docs/developer-guide/Tier and Feature Separation.md` section 2, `docs/developer-guide/Key remarks.md` section 2  
**Purpose:** Complete database schema supporting multi-tenancy and seamless SQLite → PostgreSQL migration

---

## 1. Schema Design Principles

### 1.1 Multi-Tenant Ready from Day One

- **UUID primary keys**: Cloud-compatible identifiers
- **user_id foreign keys**: Even in single-user offline mode
- **Tier columns**: Built-in support for feature flag enforcement
- **Change tracking**: Complete audit trail for cloud sync

### 1.2 Migration Path Strategy

```
Phase 1: SQLite (Offline)    Phase 2: PostgreSQL (SaaS)
┌─────────────────────┐     ┌─────────────────────────┐
│ • Single file DB    │ ──► │ • Multi-tenant cloud    │
│ • Local transactions│     │ • Row-level security    │
│ • Change tracking   │     │ • Real-time sync        │
│ • UUID compatibility│     │ • Horizontal scaling    │
└─────────────────────┘     └─────────────────────────┘
```

---

## 2. Core SQLite Schema (Phase 1)

### 2.1 Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- UUID for cloud compatibility
  email TEXT UNIQUE,                -- Required for SaaS migration
  name TEXT,
  tier TEXT DEFAULT 'free',         -- 'free' | 'pro' | 'enterprise'
  company TEXT,
  license_key TEXT,                 -- Offline license validation
  organization_id TEXT,             -- NULL in Phase 1, used in Phase 2
  settings JSON,                    -- User preferences and configuration
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CHECK (tier IN ('free', 'pro', 'enterprise')),
  CHECK (email IS NOT NULL OR license_key IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_organization ON users(organization_id);
```

### 2.2 Organizations Table (SaaS Ready)

```sql
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,              -- UUID
  name TEXT NOT NULL,
  tier TEXT DEFAULT 'pro',          -- 'pro' | 'enterprise'
  domain TEXT,                      -- For SSO integration
  settings JSON,                    -- Org-wide configuration
  billing_info JSON,               -- Subscription details
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CHECK (tier IN ('pro', 'enterprise'))
);

CREATE INDEX idx_organizations_domain ON organizations(domain);
```

### 2.3 Projects Table

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,              -- UUID
  user_id TEXT NOT NULL,            -- Always include for multi-tenancy
  organization_id TEXT,             -- NULL for individual users
  name TEXT NOT NULL,
  client TEXT,
  address TEXT,
  building_type TEXT,               -- 'office', 'hospital', 'school', etc.
  metadata JSON,                    -- Flexible project data
  settings JSON,                    -- Project-specific settings
  status TEXT DEFAULT 'active',     -- 'active', 'archived', 'deleted'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Constraints
  CHECK (status IN ('active', 'archived', 'deleted')),
  CHECK (length(name) > 0)
);

-- Indexes for tier enforcement and performance
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_modified ON projects(last_modified);
```

### 2.4 Project Segments Table

```sql
CREATE TABLE project_segments (
  id TEXT PRIMARY KEY,              -- UUID
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,            -- Denormalized for RLS
  name TEXT NOT NULL,
  segment_type TEXT NOT NULL,       -- 'duct', 'fitting', 'equipment'
  calculation_data JSON,            -- Segment-specific calculations
  geometry_data JSON,               -- 3D positioning and dimensions
  validation_results JSON,          -- Compliance check results
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Constraints
  CHECK (segment_type IN ('duct', 'fitting', 'equipment', 'terminal'))
);

-- Indexes for performance and tier limits
CREATE INDEX idx_segments_project ON project_segments(project_id);
CREATE INDEX idx_segments_user ON project_segments(user_id);
CREATE INDEX idx_segments_type ON project_segments(segment_type);
```

### 2.5 Feature Flags Table

```sql
CREATE TABLE feature_flags (
  id TEXT PRIMARY KEY,              -- UUID
  user_id TEXT,                     -- NULL for global flags
  organization_id TEXT,             -- NULL for user-specific flags
  feature_name TEXT NOT NULL,       -- e.g., 'unlimited_projects'
  enabled BOOLEAN DEFAULT FALSE,
  tier_required TEXT,               -- 'free' | 'pro' | 'enterprise'
  expires_at DATETIME,              -- Optional expiration
  metadata JSON,                    -- Additional flag configuration
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Constraints
  CHECK (tier_required IN ('free', 'pro', 'enterprise')),
  CHECK (user_id IS NOT NULL OR organization_id IS NOT NULL OR 
         (user_id IS NULL AND organization_id IS NULL)) -- Global flags
);

-- Indexes for feature evaluation performance
CREATE INDEX idx_feature_flags_user_feature ON feature_flags(user_id, feature_name);
CREATE INDEX idx_feature_flags_org_feature ON feature_flags(organization_id, feature_name);
CREATE INDEX idx_feature_flags_global ON feature_flags(feature_name) WHERE user_id IS NULL AND organization_id IS NULL;
CREATE INDEX idx_feature_flags_tier ON feature_flags(tier_required);
```

### 2.6 Change Log Table (Cloud Sync Ready)

```sql
CREATE TABLE change_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  organization_id TEXT,             -- For org-level changes
  entity_type TEXT NOT NULL,        -- 'user', 'project', 'segment', 'feature_flag'
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,          -- 'INSERT', 'UPDATE', 'DELETE'
  changes JSON NOT NULL,            -- Delta or full record
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Cloud sync fields
  synced_at DATETIME,               -- NULL until synced to cloud
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'conflict', 'failed'
  sync_attempts INTEGER DEFAULT 0,
  sync_error TEXT,                  -- Error message if sync failed
  
  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Constraints
  CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  CHECK (sync_status IN ('pending', 'synced', 'conflict', 'failed')),
  CHECK (entity_type IN ('user', 'organization', 'project', 'segment', 'feature_flag'))
);

-- Indexes for sync performance
CREATE INDEX idx_change_log_user ON change_log(user_id);
CREATE INDEX idx_change_log_sync_status ON change_log(sync_status);
CREATE INDEX idx_change_log_timestamp ON change_log(timestamp);
CREATE INDEX idx_change_log_entity ON change_log(entity_type, entity_id);
```

---

## 3. Tier Enforcement Queries

### 3.1 Project Count Validation

```sql
-- Check if user can create another project (Free tier: max 3)
SELECT 
  COUNT(*) as project_count,
  u.tier,
  CASE 
    WHEN u.tier = 'free' AND COUNT(*) >= 3 THEN FALSE
    ELSE TRUE
  END as can_create_project
FROM projects p
JOIN users u ON p.user_id = u.id
WHERE p.user_id = ? AND p.status = 'active'
GROUP BY u.tier;
```

### 3.2 Segment Count Validation

```sql
-- Check if user can add more segments (Free tier: max 25 per project)
SELECT 
  COUNT(*) as segment_count,
  u.tier,
  CASE 
    WHEN u.tier = 'free' AND COUNT(*) >= 25 THEN FALSE
    ELSE TRUE
  END as can_add_segment
FROM project_segments ps
JOIN users u ON ps.user_id = u.id
WHERE ps.project_id = ? AND u.tier = 'free';
```

### 3.3 Feature Access Validation

```sql
-- Check if feature is enabled for user
SELECT 
  CASE 
    WHEN ff.enabled IS NOT NULL THEN ff.enabled
    WHEN u.tier = 'enterprise' THEN TRUE
    WHEN u.tier = 'pro' AND ff_global.tier_required IN ('free', 'pro') THEN TRUE
    WHEN u.tier = 'free' AND ff_global.tier_required = 'free' THEN TRUE
    ELSE FALSE
  END as feature_enabled
FROM users u
LEFT JOIN feature_flags ff ON ff.user_id = u.id AND ff.feature_name = ?
LEFT JOIN feature_flags ff_global ON ff_global.feature_name = ? AND ff_global.user_id IS NULL
WHERE u.id = ?;
```

---

## 4. PostgreSQL Migration Schema (Phase 2)

### 4.1 Enhanced Users Table

```sql
-- PostgreSQL version with additional SaaS features
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  company TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Authentication
  password_hash TEXT,               -- For email/password auth
  email_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMPTZ,
  
  -- SaaS features
  subscription_id TEXT,             -- Stripe/billing integration
  trial_ends_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Row-level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own record
CREATE POLICY users_self_policy ON users
  FOR ALL TO authenticated_users
  USING (id = current_user_id());

-- Organization admins can see org members
CREATE POLICY users_org_admin_policy ON users
  FOR SELECT TO authenticated_users
  USING (
    organization_id IS NOT NULL AND
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = current_user_id() AND role = 'admin'
    )
  );
```

### 4.2 Enhanced Projects Table with RLS

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  client TEXT,
  address TEXT,
  building_type TEXT,
  metadata JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  
  -- Collaboration features
  shared_with UUID[] DEFAULT '{}',  -- Array of user IDs
  permissions JSONB DEFAULT '{}',   -- Role-based permissions
  
  -- Version control
  version INTEGER DEFAULT 1,
  parent_version_id UUID REFERENCES projects(id),
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Row-level security policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can access their own projects
CREATE POLICY projects_owner_policy ON projects
  FOR ALL TO authenticated_users
  USING (user_id = current_user_id());

-- Users can access shared projects
CREATE POLICY projects_shared_policy ON projects
  FOR SELECT TO authenticated_users
  USING (current_user_id() = ANY(shared_with));

-- Organization members can access org projects
CREATE POLICY projects_org_policy ON projects
  FOR ALL TO authenticated_users
  USING (
    organization_id IS NOT NULL AND
    organization_id IN (
      SELECT organization_id FROM users WHERE id = current_user_id()
    )
  );
```

---

## 5. Migration Scripts

### 5.1 SQLite to PostgreSQL Data Migration

```sql
-- Migration script template
BEGIN;

-- 1. Migrate users (with UUID conversion)
INSERT INTO postgresql_users (id, email, name, tier, company, settings, created_at, updated_at)
SELECT 
  uuid_generate_v4(),              -- Convert to UUID
  email,
  name,
  tier,
  company,
  settings,
  created_at,
  updated_at
FROM sqlite_users;

-- 2. Create user ID mapping table for foreign key updates
CREATE TEMP TABLE user_id_mapping (
  sqlite_id TEXT,
  postgres_id UUID
);

-- 3. Migrate projects with updated foreign keys
INSERT INTO postgresql_projects (id, user_id, name, client, metadata, created_at, updated_at)
SELECT 
  uuid_generate_v4(),
  m.postgres_id,                   -- Use mapped UUID
  p.name,
  p.client,
  p.metadata::jsonb,
  p.created_at,
  p.updated_at
FROM sqlite_projects p
JOIN user_id_mapping m ON p.user_id = m.sqlite_id;

COMMIT;
```

### 5.2 Schema Validation Script

```sql
-- Validate migration completeness
SELECT 
  'users' as table_name,
  COUNT(*) as sqlite_count,
  (SELECT COUNT(*) FROM postgresql_users) as postgres_count,
  CASE 
    WHEN COUNT(*) = (SELECT COUNT(*) FROM postgresql_users) THEN 'PASS'
    ELSE 'FAIL'
  END as migration_status
FROM sqlite_users

UNION ALL

SELECT 
  'projects' as table_name,
  COUNT(*) as sqlite_count,
  (SELECT COUNT(*) FROM postgresql_projects) as postgres_count,
  CASE 
    WHEN COUNT(*) = (SELECT COUNT(*) FROM postgresql_projects) THEN 'PASS'
    ELSE 'FAIL'
  END as migration_status
FROM sqlite_projects;
```

---

## 6. Performance Optimization

### 6.1 SQLite Optimization (Phase 1)

```sql
-- Performance settings for SQLite
PRAGMA journal_mode = WAL;        -- Write-Ahead Logging for better concurrency
PRAGMA synchronous = NORMAL;      -- Balance between safety and performance
PRAGMA cache_size = 10000;        -- 10MB cache
PRAGMA temp_store = MEMORY;       -- Store temp tables in memory
PRAGMA mmap_size = 268435456;     -- 256MB memory-mapped I/O

-- Analyze tables for query optimization
ANALYZE;
```

### 6.2 PostgreSQL Optimization (Phase 2)

```sql
-- Partitioning for large change_log table
CREATE TABLE change_log_y2024m01 PARTITION OF change_log
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY idx_projects_active_user 
  ON projects(user_id) WHERE status = 'active';

CREATE INDEX CONCURRENTLY idx_change_log_pending_sync 
  ON change_log(user_id, timestamp) WHERE sync_status = 'pending';

-- Materialized view for tier statistics
CREATE MATERIALIZED VIEW tier_usage_stats AS
SELECT 
  tier,
  COUNT(*) as user_count,
  AVG(project_count) as avg_projects_per_user,
  SUM(project_count) as total_projects
FROM (
  SELECT 
    u.tier,
    COUNT(p.id) as project_count
  FROM users u
  LEFT JOIN projects p ON u.id = p.user_id AND p.status = 'active'
  GROUP BY u.id, u.tier
) user_stats
GROUP BY tier;
```

---

## 7. Backup and Recovery

### 7.1 SQLite Backup Strategy

```bash
#!/bin/bash
# Automated SQLite backup script

DB_PATH="/app/data/projects.db"
BACKUP_DIR="/app/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup with WAL checkpoint
sqlite3 "$DB_PATH" "PRAGMA wal_checkpoint(FULL);"
cp "$DB_PATH" "$BACKUP_DIR/projects_$TIMESTAMP.db"

# Compress and encrypt backup
gzip "$BACKUP_DIR/projects_$TIMESTAMP.db"
gpg --encrypt --recipient backup@sizewise.com "$BACKUP_DIR/projects_$TIMESTAMP.db.gz"

# Clean up old backups (keep 30 days)
find "$BACKUP_DIR" -name "*.gpg" -mtime +30 -delete
```

### 7.2 PostgreSQL Backup Strategy

```bash
#!/bin/bash
# PostgreSQL backup with point-in-time recovery

# Full backup
pg_dump --format=custom --compress=9 --file="backup_$(date +%Y%m%d).dump" sizewise_db

# Continuous WAL archiving for PITR
archive_command = 'cp %p /backup/wal_archive/%f'
```

---

## 8. Schema Versioning

### 8.1 Migration Version Table

```sql
CREATE TABLE schema_migrations (
  version TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  checksum TEXT NOT NULL
);

-- Track current schema version
INSERT INTO schema_migrations (version, description, checksum) 
VALUES ('1.0.0', 'Initial schema with multi-tenant support', 'sha256_hash_here');
```

### 8.2 Automated Migration System

```typescript
export class SchemaMigrator {
  async migrate(): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const targetVersion = '2.0.0';
    
    const migrations = await this.getMigrationsBetween(currentVersion, targetVersion);
    
    for (const migration of migrations) {
      await this.applyMigration(migration);
      await this.recordMigration(migration);
    }
  }
}
```

---

**Status**: ✅ **COMPLETE** - Database schema supporting multi-tenancy and SaaS transition  
**Next Step**: Continue with remaining Phase 0 documentation tasks
