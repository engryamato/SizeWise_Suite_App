# Tier and Feature Separation

A clean, future-proof way to separate **user tiers** (Free → Pro → Enterprise) from the rest of your codebase is to treat *“tier”* and *“feature”* as first-class data, drive **all gating through a single feature-flag service layer**, and isolate every storage concern behind a **repository pattern**.

This gives you four big wins:

1. **Zero duplicate logic** – the same calculator or UI component can serve all tiers.
2. **Hot-swappable back ends** – SQLite today, cloud API tomorrow.
3. **One confident place to test/secure** authorisation and limits.
4. **Fast experiments** – flip a flag, release a feature to a subset of users, or retire it safely.

Below is an expert-level blueprint—layer by layer—plus the DB tables, code snippets, and workflow that glue everything together.

---

## 1 Architecture Layers & Responsibilities

### 1.1 Presentation layer

- **Conditional rendering only**, never business rules.
- Ask the Feature Flag Service (`isEnabled("high_res_export")`) before showing buttons or menus. Using a single helper avoids “flag spaghetti.”

### 1.2 Service layer (Feature & Licence Gateway)

- Central class (`FeatureManager`) that merges:
    - **User tier** (free, pro, enterprise)
    - **Per-user overrides** (promos, beta flags)
    - **System flags** (canary, kill-switch)
- Reads from local DB offline, or from a remote **flag store** (LaunchDarkly/Flagsmith/Unleash) in SaaS. LaunchDarkly recommends a single source of truth and regular cleanup to avoid “flag debt.”

### 1.3 Domain layer (Calculations, Validation, Reports)

- **Completely tier-agnostic**.
- Accepts only plain objects (`Project`, `DuctSegment`) so code is reusable in desktop and cloud.

### 1.4 Repository layer

- Interface (`ProjectRepository`) defines CRUD. Concrete implementations:
    - `LocalSqliteRepository` – uses SQLite file in Phase 1.
    - `CloudApiRepository` – later calls REST/GraphQL.
- Swapping implementations requires no changes above this layer (classic repository pattern).

---

## 2 Database Schema (SQLite → PostgreSQL Ready)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,           -- UUID
  email TEXT UNIQUE,
  tier TEXT DEFAULT 'free',      -- free | pro | enterprise
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE feature_flags (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  feature_name TEXT,
  enabled BOOLEAN,
  tier_required TEXT,            -- free | pro | enterprise
  expires_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,         -- even in single-user mode
  name TEXT,
  data JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE change_log (       -- SaaS sync ready
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  entity_type TEXT,
  entity_id TEXT,
  operation TEXT,
  changes JSON,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

```

*The `tier` column lets you enforce hard caps (e.g., max 3 projects for Free) purely with SQL or a service check.*

*Row-level security in PostgreSQL later keeps tenant data isolated without new schemas.*

---

## 3 Feature-Flag Enforcement Flow

1. **App boots** → loads licence file (desktop) or JWT (cloud).
2. `FeatureManager` hydrates:
    
    ```
    const fm = new FeatureManager(localFlagRepo, user.tier);
    
    ```
    
3. UI asks:
    
    ```tsx
    if (fm.isEnabled('high_res_export')) {
      <Button onClick={exportPDF} />
    }
    
    ```
    
4. Service / API endpoints also guard business rules:
    
    ```
    if (!fm.isEnabled('unlimited_projects') && projectCount >= 3) {
        throw new Error('Upgrade to Pro for more projects');
    }
    
    ```
    
    *Backend validation is essential—never trust the client UI alone.*
    

---

## 4 Licensing & Offline Validations

- **Offline desktop**: signed licence file embeds allowed tier + permanent flags. Validate signature on startup and cache in `feature_flags` table. Best practice is to store that licence blob encrypted (e.g., via OS keystore APIs) and periodically verify integrity.
- **Online SaaS**: token or cookie carries `tier` claim; server consults central flag store. Flagsmith & LaunchDarkly both expose SDKs for per-request evaluation, supporting multitenancy out of the box.

---

## 5 Testing & Maintenance

| Layer | What to test | Tooling |
| --- | --- | --- |
| Feature flags | Matrix of tier × feature | Jest unit tests toggling mock flags |
| Repository | Save/load cycles | SQLite in-memory & Postgres test DB |
| End-to-end | Caps (e.g., 3-project limit) | Playwright with different licence files |
| Security | Row-level data isolation | RLS tests in Postgres CI job |

Regular “flag cleanup days” keep legacy flags from bloating the codebase—an industry-wide recommendation.

---

## 6 Why This Design Scales

- **Minimal branching** – tier differences live in data, not in forks of code.
- **Single enforcement point** – easier audits and ISO 27001 evidence.
- **Offline → Online** – swap repositories, sync `change_log`, keep everything else.
- **Experiment-friendly** – A/B or beta features per user without redeploy.

> Take-away: Treat tier as data, gate every action through a small Feature-Flag Service, and hide storage behind repositories.
> 
> 
> That single pattern gives you airtight separation now and a painless path to Pro & Enterprise SaaS later.
>