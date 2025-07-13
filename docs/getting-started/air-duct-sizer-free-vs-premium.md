## 📌 Air Duct Sizer – Critical Implementation Additions for Tier Enforcement

### 1. Feature Matrix & Boundary Specification

For every single feature in the Air Duct Sizer, maintain a **Feature Matrix** that defines:

| Feature                | Free User             | Pro User              | Enforced By                | UI State in Free |
|------------------------|-----------------------|-----------------------|----------------------------|------------------|
| Max Projects           | 1 active, 5 saved     | Unlimited             | API, UI, Data Model        | Locked after 5   |
| Max Rooms per Project  | 3                     | Unlimited             | API, UI                    | Lock + Tooltip   |
| Max Segments per Proj  | 25                    | Unlimited             | API, UI                    | Lock + Tooltip   |
| Snap-to-Grid           | Off                   | On/Off Toggle         | Feature Flag, UI           | Toggle disabled  |
| Input Mode             | Manual only           | Manual + Auto-suggest | UI, API                    | Button disabled  |
| Run Mode               | Single-run only       | Single/Full-system    | Feature Flag, API          | Button disabled  |
| Standards Validation   | Basic warnings        | Full (SMACNA/ASHRAE/UL + rule refs) | Validation Engine | Only basic text  |
| Advanced Mode          | Not available         | All advanced calc     | Feature Flag, UI           | Section hidden   |
| Equipment Catalog      | Manual entry only     | Catalog + manual      | Feature Flag, API          | Catalog grayed   |
| Simulation             | Not available         | Full animated         | Feature Flag, UI, Backend  | Button disabled  |
| Export Format          | PDF (single run)      | PDF (full), Excel, JSON | Export Engine, UI        | Options grayed   |
| Warnings/Validation    | Inline, simple text   | Grouped, mapped, code refs | Warning Engine       | Not shown        |
| Educated Mode Tooltips | Not available         | On (≤75 word refs)    | Feature Flag, UI           | Switch disabled  |
| Support                | Community/forum only  | Priority email/chat   | Docs, UI                   | N/A              |

**Instruction:**  
- Implement all UI controls for Pro-only features as visible but locked in Free.  
- Always display a tooltip (“Upgrade to Pro to unlock [feature]”) or an upsell modal when a Free user attempts to use a locked feature.
- Free users must never access Pro features via API, direct URL, or export. All checks must be at both UI and backend/API levels.

---

### 2. Upgrade, Downgrade, and Trial Flows

**Upgrade Flow**
- Upon upgrade, Pro features instantly unlock in current session—**no reload required**.  
- All previously locked features become available; all data becomes accessible (no migration required).

**Downgrade/Expiry Flow**
- If a Pro user lapses to Free:  
    - Pro-only data (e.g., extra rooms/segments, simulation results) is *locked but not deleted*.  
    - User sees a “locked” icon and “Upgrade to restore access” message.
    - No data loss: upon re-upgrade, all features/data instantly restored.

**Trial Logic** (if offered)
- 7-day Pro trial triggers on first “locked” action OR upon user request.
- All upgrade/downgrade logic applies after trial expiry.

---

### 3. Data Integrity & Enforcement

- Never allow a Free user to *create, edit, or export* beyond their tier:  
    - Creating a 4th room, 26th segment, or opening Simulation triggers a modal—not a silent failure.
    - Attempting Pro-only export yields clear message (“This feature requires Pro”).
- When viewing a Pro-created project in Free:  
    - Pro features/data are visible but grayed/locked, never deleted.
    - User prompted to upgrade to regain access.

---

### 4. Documentation & Onboarding

- User manual, onboarding flows, and tooltips must clearly distinguish Free vs Pro features.
- Every locked/Pro-only feature must have a short, friendly tooltip (“Unlock with Pro for [value proposition]”).

---

### 5. UI/UX Requirements for Locked Features

- **Always show** Pro-only features (not hidden), but as grayed out, with lock icon and tooltip.
- Clicking a locked feature in Free mode always prompts a non-intrusive upgrade modal/CTA.
- All upsell prompts should be subtle, helpful, and never break core Free workflows.

---

### 6. QA, Acceptance Criteria, and Test Cases

- **QA must test** every boundary:
    - Attempt to add 4th room, 26th segment as Free: modal appears, cannot proceed.
    - Attempt to run Simulation in Free: locked, modal appears.
    - Upgrade to Pro mid-session: all locked features unlock instantly.
    - Downgrade Pro to Free: Pro-only features lock but all data remains (not lost).
    - Attempt to export with Pro-only data as Free: limited to Free export, with locked features flagged in output.

- **Automated tests must cover** all UI, API, and export boundaries.

---

### 7. Export and Data Handling

- **Exports:**  
    - Free users: Only PDF summary (single run/branch), no simulation, no grouped warnings, no advanced data.
    - Pro users: Full export suite (PDF, Excel, JSON), including all segments, simulation images, and detailed warnings/code refs.
- All export and API logic must check user tier and prevent data leakage of Pro features to Free users.

---

### 8. Simulation, Validation, and Standards Logic

- Simulation engine and detailed code-linked validation is strictly Pro-only.  
- Free users never see animation, advanced pressure/altitude calcs, or code-linked warnings.
- Pro users see grouped, referenced warnings, and animated simulation as per spec.

---

### 9. Feature Flag Implementation

- Every Pro feature must be wrapped with a feature flag check in both frontend and backend.
- Flags must be persistent per user, per project, and enforced in all API, export, and UI logic.

---

### 10. Communication with Users

- All locked/Pro features always accompanied by a tooltip or modal: “Upgrade to Pro to unlock [specific feature/benefit].”
- Upgrade flows must be instant, with no risk of data loss or corruption.
- All trial, upgrade, and downgrade states must be tested and documented.

---

## Deliverable:  
- Update the implementation plan and task tree with these explicit boundary enforcement, QA, documentation, and data handling requirements.  
- All developers, testers, and documentation writers must reference this spec to ensure the Free/Pro split is definitive, visible, and unbreakable.

