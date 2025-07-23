-- SizeWise Suite SQLite Database Schema
-- Multi-tenant ready schema with UUID primary keys for SaaS migration
-- Source: docs/implementation/saas-readiness/schema-migration-guide.md section 2

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Users Table
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

-- Organizations Table (SaaS Ready)
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

-- Projects Table
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

-- Project Segments Table
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

-- Feature Flags Table
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

-- Change Log Table (Cloud Sync Ready)
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
