# 🏷️ Feature Flags & Free/Pro Boundaries

_See [docs/README.md](../../README.md) for documentation map and update rules._

_Last updated: 2025-07-13_

---

## 1. What Is This Document?

This document defines **how every Free vs Pro feature split is enforced** in the Air Duct Sizer module—covering UI, logic, API, export, and even warning messaging.  
If you’re building or maintaining tier gating, this is your “single source of truth” for feature flag rules.

- **Does NOT contain:** Product vision, UI layouts, data schemas, or calculation logic (see related markdowns).

---

## 2. Tier Enforcement Principles

- **Every feature, input, or output that differs by user tier is enforced by a feature flag**—never “soft hidden” in UI only.
- Enforcement applies at:
  - **UI level:** Show/hide or lock controls, show upgrade prompts/tooltips
  - **API/backend:** Prevent unauthorized operations, enforce project/segment limits
  - **Calculation:** Use defaults for Pro-only computational props if Free
  - **Export:** Omit/lock premium content, add watermark if Free
- Always provide feedback (“Upgrade to Pro…”) at the point of interaction.

---

## 3. Feature Gating Matrix

| Feature/Limit                      | Free Tier                      | Pro Tier                | Enforcement Point         |
|------------------------------------|--------------------------------|-------------------------|---------------------------|
| Max rooms per project              | 3                              | Unlimited               | UI/API/Export             |
| Max duct segments per project      | 25                             | Unlimited               | UI/API/Export             |
| Drawing on canvas                  | Basic (grid snap only)         | Advanced (snap toggle, group edit) | UI/Canvas                 |
| Computational property editing     | View-only (locked fields)      | Editable                | UI/API/Logic              |
| Room/segment calculated fields     | Read-only (basic calcs)        | Editable/full detail    | UI/Sidebar                |
| BOM/Export limits                  | Up to Free item cap, watermark | Unlimited, no watermark | Export                    |
| Simulation mode                    | Not available                  | Full access             | UI/Canvas/Export          |
| Catalog import                     | Not available                  | Full access             | UI/Sidebar/API            |
| Heat load (D/J) calculations       | Not available                  | Full access             | Logic/API                 |
| Validation/warnings                | For Free inputs only           | All, including Pro-only | Logic/API/Sidebar         |
| Code compliance tooltips           | Tooltip/footnote only          | Inline/full refs        | UI/Export                 |
| Onboarding wizard fields           | All, but comp. locked          | All fields editable     | UI/Sidebar                |

---

## 4. Upgrade/Downgrade Handling

- **Upgrade:**  
  - Unlocks all features, removes item/segment/project/export limits
  - All previously “locked” fields become editable
  - Any previously hidden content is restored and re-calculated

- **Downgrade:**  
  - If a Pro user downgrades and is over Free limits:
    - Project is locked to view-only until reduced to Free limits
    - Pro-only fields revert to default, edits disabled, upgrade prompts shown
    - Exports revert to Free content/format (with watermark)

- **Edge Cases:**  
  - If a project started as Free, upgrading always “unlocks” previously entered defaults for editing
  - If a Pro project is opened in Free mode, all above downgrade rules apply

---

## 5. Enforcement Best Practices

- All feature gating is **hard-enforced** (never just hidden in UI)
- Always show clear, actionable upgrade messaging
- Cross-check limits on all create/edit/export operations
- Validate tier on every API call that mutates tiered fields or objects

---

## 6. Keeping This File Up To Date

- When any feature boundary, limit, or gating mechanism changes, **update this file and README first**
- Never duplicate gating logic elsewhere—always reference this document

---

## 7. Where to Find More Details

- UI component lock states: `ui-components.md`
- Data field tiering: `data-models-schemas.md`
- Calculation/logic field tiering: `logic-validators.md`
- Export content limits: `exports-reports.md`
- Product vision (high-level boundaries): `air-duct-sizer.md`

---

*This file is your master reference for all Free vs Pro boundaries and gating logic.  
If a feature or limit changes, start here to update and enforce it across the system!*
