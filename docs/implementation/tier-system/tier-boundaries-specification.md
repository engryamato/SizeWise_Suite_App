# Tier Boundaries Specification

**Source Documents:**
- `docs/developer-guide/air-duct-sizer-offline-version/air-duct-sizer-offline-first.md`
- `docs/developer-guide/Key remarks.md`
- `docs/developer-guide/Tier and Feature Separation.md`

**Purpose:** Define exact tier assignments and feature boundaries for SizeWise Suite's offline-to-SaaS transition strategy.

---

## 1. Tier Overview

SizeWise Suite implements a four-tier system designed for seamless offline-to-SaaS transition:

- **Free Tier (Offline Desktop)**: Limited feature set to validate product-market fit
- **Pro Tier (SaaS)**: Unlimited core features with cloud sync and collaboration
- **Enterprise Tier (SaaS)**: Advanced features for large organizations with SSO and audit requirements
- **Super Admin Tier (Internal)**: Emergency access and system recovery capabilities (support only)

---

## 2. Complete Feature Matrix

### 2.1 Core HVAC Functionality

| Feature | Free (Offline) | Pro (SaaS) | Enterprise (SaaS) | Super Admin (Internal) |
|---------|----------------|------------|-------------------|------------------------|
| **Air Duct Sizer** | ✅ Full | ✅ Full | ✅ Full | ✅ Full + Recovery |
| **Boiler Vent Sizer** | ❌ Phase 2 | ✅ Full | ✅ Full | ✅ Full + Recovery |
| **Grease Duct Sizer** | ❌ Phase 2 | ✅ Full | ✅ Full | ✅ Full + Recovery |
| **General Ventilation Calculations** | ❌ Phase 2 | ✅ Full | ✅ Full | ✅ Full + Recovery |
| **Equipment Selection** | ❌ Phase 2 | ✅ Full | ✅ Full | ✅ Full + Recovery |

### 2.2 Project Management

| Feature | Free (Offline) | Pro (SaaS) | Enterprise (SaaS) |
|---------|----------------|------------|-------------------|
| **Project Limit** | **3 projects max** | **Unlimited** | **Unlimited** |
| **Segments per Project** | **25 segments max** | **Unlimited** | **Unlimited** |
| **Multi-Project Management** | ✅ Local files | ✅ Cloud storage | ✅ Cloud storage |
| **Project Templates** | ❌ | ✅ Standard templates | ✅ Custom templates |
| **Building Metadata** | ✅ Basic (name, client, address) | ✅ Enhanced | ✅ Full metadata + custom fields |
| **Floors/Zones Hierarchy** | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |

### 2.3 Standards & Compliance

| Feature | Free (Offline) | Pro (SaaS) | Enterprise (SaaS) |
|---------|----------------|------------|-------------------|
| **SMACNA Standards** | ✅ Core tables only | ✅ Full table access | ✅ All + custom standards |
| **ASHRAE Standards** | ✅ Basic 62.1 tables | ✅ Full standards suite | ✅ All + early access |
| **Regional Standards** | ✅ US/Canada only | ✅ US/Canada/EU/AU | ✅ Global + custom regions |
| **Standards Updates** | **Manual download** | **Cloud-pushed** | **SLA-based, early access** |
| **Compliance Validation** | ✅ Basic pass/fail | ✅ Detailed reports | ✅ Audit trails + custom rules |

### 2.4 Drawing & Visualization

| Feature | Free (Offline) | Pro (SaaS) | Enterprise (SaaS) |
|---------|----------------|------------|-------------------|
| **PDF Floor Plan Import** | ✅ Basic overlay | ✅ Enhanced processing | ✅ Advanced CAD integration |
| **2D Drawing Canvas** | ✅ Basic tools | ✅ Full CAD tools | ✅ Advanced + custom layers |
| **3D Visualization** | ✅ Limited view | ✅ Enhanced rendering | ✅ BIM export capability |
| **Collision Detection** | ✅ Basic | ✅ Advanced | ✅ Real-time + reporting |
| **Airflow Visualization** | ✅ Basic coloring | ✅ Advanced analytics | ✅ Custom visualization |

### 2.5 Import/Export Capabilities

| Feature | Free (Offline) | Pro (SaaS) | Enterprise (SaaS) |
|---------|----------------|------------|-------------------|
| **Project Files (JSON)** | ✅ Local save/load | ✅ Cloud sync | ✅ Version control |
| **Excel Import** | ✅ Basic equipment data | ✅ Full bulk import | ✅ Custom mappings |
| **CSV Export** | ✅ Basic results | ✅ Enhanced data | ✅ Custom formats |
| **PDF Reports** | **✅ With watermark** | **✅ High-res, no watermark** | **✅ Custom templates + branding** |
| **DXF/DWG Export** | ❌ | ✅ 2D layouts | ✅ 3D models + BIM |
| **GLTF/OBJ Export** | ❌ | ✅ Basic 3D | ✅ Advanced 3D + materials |

### 2.6 Cloud & Collaboration

| Feature | Free (Offline) | Pro (SaaS) | Enterprise (SaaS) |
|---------|----------------|------------|-------------------|
| **Cloud Storage/Sync** | ❌ Local only | ✅ Full sync | ✅ Advanced sync + backup |
| **Multi-Device Access** | ❌ | ✅ All devices | ✅ All devices + mobile |
| **Team Collaboration** | ❌ | ✅ Limited sharing | ✅ Advanced RBAC |
| **Version History** | ❌ | ✅ Basic history | ✅ Full audit trail |
| **Real-Time Collaboration** | ❌ | ❌ | ✅ Live editing |

### 2.7 Security & Administration

| Feature | Free (Offline) | Pro (SaaS) | Enterprise (SaaS) |
|---------|----------------|------------|-------------------|
| **User Authentication** | ✅ Local license | ✅ Cloud accounts | ✅ SSO integration |
| **Role-Based Access Control** | ❌ | ❌ | ✅ Advanced RBAC |
| **Audit Logs** | ❌ | ❌ | ✅ Comprehensive logging |
| **Data Encryption** | ✅ Local file encryption | ✅ Cloud encryption | ✅ Advanced security |
| **Compliance Certifications** | ❌ | ❌ | ✅ SOC 2, ISO 27001 |

### 2.8 Support & Updates

| Feature | Free (Offline) | Pro (SaaS) | Enterprise (SaaS) |
|---------|----------------|------------|-------------------|
| **Documentation** | ✅ Basic help | ✅ Full documentation | ✅ Custom documentation |
| **Support Level** | **Docs only** | **Standard email** | **Priority + phone** |
| **Update Frequency** | **Manual, quarterly** | **Automatic, monthly** | **SLA-based, immediate** |
| **Training Resources** | ✅ Basic tutorials | ✅ Video library | ✅ Custom training |

---

## 3. Enforcement Rules

### 3.1 Free Tier Limits (Hard Caps)

```typescript
const FREE_TIER_LIMITS = {
  MAX_PROJECTS: 3,
  MAX_SEGMENTS_PER_PROJECT: 25,
  WATERMARK_REQUIRED: true,
  CLOUD_SYNC_ENABLED: false,
  STANDARDS_ACCESS: 'core_only',
  EXPORT_FORMATS: ['pdf_watermarked', 'csv_basic']
};
```

### 3.2 Pro Tier Features

```typescript
const PRO_TIER_FEATURES = [
  'unlimited_projects',
  'unlimited_segments', 
  'high_res_export',
  'cloud_sync',
  'full_standards_access',
  'enhanced_3d_rendering',
  'advanced_import_export'
];
```

### 3.3 Enterprise Tier Features

```typescript
const ENTERPRISE_TIER_FEATURES = [
  ...PRO_TIER_FEATURES,
  'custom_templates',
  'bim_export',
  'sso_integration',
  'audit_logs',
  'rbac',
  'priority_support',
  'custom_branding',
  'api_access'
];
```

---

## 4. Implementation Guidelines

### 4.1 Feature Flag Naming Convention

- Use snake_case for consistency
- Prefix with tier when tier-specific: `pro_unlimited_projects`
- Use descriptive names: `high_res_export` not `export_v2`

### 4.2 UI Enforcement Patterns

```typescript
// Conditional rendering
{isFeatureEnabled('high_res_export') && (
  <ExportButton variant="high-res" />
)}

// Upgrade prompts
{!isFeatureEnabled('unlimited_projects') && projectCount >= 3 && (
  <UpgradePrompt feature="unlimited_projects" />
)}
```

### 4.3 Backend Validation

```typescript
// Always validate on backend
if (!featureManager.isEnabled('unlimited_projects', userId) && projectCount >= 3) {
  throw new TierLimitExceededError('Upgrade to Pro for unlimited projects');
}
```

---

## 5. Migration Strategy

### 5.1 Free to Pro Transition

1. **Data Migration**: Upload local SQLite projects to cloud storage
2. **Feature Unlocking**: Remove project/segment limits immediately
3. **Cloud Sync**: Enable automatic synchronization
4. **Enhanced Features**: Unlock high-res exports, full standards access

### 5.2 Pro to Enterprise Transition

1. **SSO Integration**: Configure organization-wide authentication
2. **RBAC Setup**: Define roles and permissions
3. **Audit Logging**: Enable comprehensive activity tracking
4. **Custom Features**: Activate BIM export, custom templates

---

## 6. Validation Criteria

### 6.1 Technical Validation

- [ ] All feature flags compile without TypeScript errors
- [ ] Database schema supports tier assignments
- [ ] UI components respect tier boundaries
- [ ] Backend validation prevents tier violations

### 6.2 Functional Validation

- [ ] Free tier enforces 3-project limit correctly
- [ ] Free tier exports include watermarks
- [ ] Pro tier unlocks unlimited projects/segments
- [ ] Enterprise tier enables all advanced features

### 6.3 User Experience Validation

- [ ] Clear upgrade prompts when limits reached
- [ ] Smooth transition between tiers
- [ ] Feature discovery for higher tiers
- [ ] No data loss during tier transitions

## 7. Super Admin Tier (Internal Only)

### 7.1 Purpose and Scope

The Super Admin tier is an internal-only administrative tier designed for:
- Emergency system recovery and maintenance
- Customer support operations
- Security incident response
- Compliance and audit operations

**CRITICAL**: This tier is never exposed to end users and requires hardware authentication.

### 7.2 Super Admin Capabilities

| Category | Capability | Description |
|----------|------------|-------------|
| **License Management** | License Reset | Reset corrupted license validation state |
| | License Reissue | Generate new license for existing customer |
| | License Revocation | Immediately invalidate compromised licenses |
| | License Recovery | Restore license from backup or support database |
| **Database Operations** | Database Repair | Fix corrupted SQLite database structures |
| | Integrity Restoration | Repair failed integrity checks |
| | Backup/Restore | Emergency backup and restore procedures |
| | Schema Migration | Apply emergency schema fixes |
| **User Management** | Tier Adjustment | Modify user tier with full audit trail |
| | Account Recovery | Unlock stuck or corrupted user accounts |
| | Token Reset | Reset authentication tokens and sessions |
| | Password Recovery | Initiate secure password reset procedures |
| **System Configuration** | Global Feature Flags | Deploy system-wide feature flag changes |
| | Security Settings | Update global security configurations |
| | Compliance Settings | Modify audit and compliance parameters |
| | Emergency Maintenance | Enable maintenance mode |
| **Audit & Compliance** | Audit Log Access | Read-only access to complete audit trails |
| | Compliance Reports | Generate regulatory compliance reports |
| | Security Investigation | Investigate and respond to security events |
| | Forensic Analysis | Analyze system state for security investigations |

### 7.3 Security Restrictions

**What Super Admin CANNOT Do:**
- Bypass cryptographic license validation
- Access encrypted user data without proper keys
- Modify or delete audit logs
- Grant features without tier validation
- Access system without hardware authentication
- Perform actions without audit trail

### 7.4 Authentication Requirements

- **Hardware Security Key**: YubiKey or FIDO2 device required
- **Multi-Factor Authentication**: Hardware key + PIN + biometric
- **Support-Initiated Access**: Cannot be self-activated
- **Time-Limited Sessions**: 30-minute maximum duration
- **Two-Person Authorization**: Critical operations require dual approval
- **Immutable Audit Trail**: All actions logged to tamper-proof system

---

**Status**: ✅ **COMPLETE** - All features from source documents documented with exact tier assignments
**Next Step**: Implement repository pattern and feature flag system based on this specification
