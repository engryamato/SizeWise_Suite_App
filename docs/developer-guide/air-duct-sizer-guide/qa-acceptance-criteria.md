# ✅ QA Acceptance Criteria & Test Scenarios

_See docs/README.md for documentation map and update rules._

_Last updated: 2025-07-13_

---

## 1. What Is This Document?

This file defines the **acceptance criteria, test scenarios, and QA checklists** for the Air Duct Sizer module.  
If you need to know what “working as intended” means for a feature or release, start here.

- **Does NOT contain:** Code, field layouts, engineering formulas, or detailed logic (see referenced markdowns).

---

## 2. Acceptance Criteria – Project/Feature Level

| Feature/Flow           | Acceptance Criteria                                                                                       | Test Cases/Scenarios                          |
|------------------------|----------------------------------------------------------------------------------------------------------|-----------------------------------------------|
| Onboarding Wizard      | All required fields must be filled, Free/Pro fields shown or locked correctly, validation triggers       | New user creates project, leaves optional fields blank, tries to skip required, attempts Pro-only fields in Free |
| Drawing Canvas         | User can draw, edit, and delete rooms and segments up to cap (Free); unlimited in Pro; snap works        | Draw up to 3 rooms, 25 segments (Free); test group edit, snap toggle (Pro); check warning badges                   |
| Property Panels        | Sidebars show correct fields per selection and tier; edits persist; Pro-only fields locked in Free       | Select room/segment, edit properties, downgrade/upgrade and check field lock/unlock                               |
| Computational Props    | Only editable by Pro; Free uses defaults and shows warning/tooltips                                      | Set comp. props as Pro, downgrade, confirm lock/default warning; upgrade, confirm fields become editable         |
| Validation & Warnings  | All logic rules trigger as specified, warnings appear in sidebar/canvas, code references link            | Enter out-of-range values, draw high-velocity duct, leave fields blank, see correct warnings                      |
| Export/Reports         | All export options trigger, correct content/tier limits, watermark for Free, full for Pro                | Export PDF, Excel, JSON; check BOM limits; Pro gets simulation in export, Free does not                           |
| Feature Flags/Gating   | All Free/Pro boundaries enforced in UI, API, exports; user is prompted to upgrade at limits              | Reach room/segment cap in Free, attempt Pro-only features; check UI/API lock and messaging                        |
| Error Handling         | Invalid actions/fields show clear messages, no crashes, edge cases handled gracefully                    | Enter invalid values, try to draw over limits, disconnect/reconnect, attempt exports while over limit             |

---

## 3. Regression & Upgrade/Downgrade Scenarios

- **Upgrade Pro → Free:**  
  - Project is locked if over cap, Pro fields revert to default, warning is shown
- **Free → Pro:**  
  - Previously locked fields become editable, all limits removed
- **Edge Cases:**  
  - User switches tiers mid-session, exports/edits reflect tier instantly

---

## 4. Non-Functional Criteria

- **Performance:**  
  - All UI interactions and calculations complete within 1 second (standard case, 99th percentile)
- **Accessibility:**  
  - Keyboard navigation, screen reader support, color contrast as per `ui-components.md`
- **Persistence:**  
  - All edits are saved in real time (auto-save) or with minimal loss on crash/reload

---

## 5. Out of Scope

- This file does **not** specify detailed UI layouts, engineering formulas, or data model schemas (see those markdowns for details).
- Multi-user/team collaboration (for future release).

---

## 6. How to Use/Update This File

- Add a row for each new feature or major scenario
- Link back to user stories and referenced docs for specifics
- Review and update for every release or major change

---

## 7. Where to Find More Details

- UI/fields/lock states: `ui-components.md`
- Data models: `data-models-schemas.md`
- Calculation rules/validators: `logic-validators.md`
- Exports: `exports-reports.md`
- Canvas/drawing: `canvas-drawing.md`
- User flows: `user-stories-flows.md`

---

*This file is your QA and acceptance “source of truth” for Air Duct Sizer.  
Update it with every release or when acceptance/test rules change!*
