---
type: "always_apply"
---

# Error-Fix

Certainly. Here’s a **comprehensive, serious, and systematic Markdown instruction** you can give to an AI agent or developer (such as Augment) to guide error fixing with maximum discipline and production-readiness:

---

# 🛠️ **Error-Fixing Instruction for Augment: Production-Ready Only**

## **Directive Overview**

When addressing errors, bugs, or issues in the SizeWise codebase, follow these rules to ensure all fixes maintain production integrity and do not disrupt the existing architecture or remove critical files or logic.

---

## **Key Principles**

- **No Unnecessary Deletions:**
    
    Do **not** remove or delete any code, files, or components unless their removal is *explicitly required* to resolve a critical issue or is formally approved.
    
- **Bridge, Don’t Erase:**
    
    All fixes should *bridge the gap* between current functionality and the required specification. Augment and correct existing logic; do not discard or rewrite working features unless unavoidable.
    
- **Production-Ready Only:**
    
    All fixes must target the production environment. Avoid introducing demo, mock, or experimental code.
    
- **Respect Original Structure:**
    
    Preserve file and module structure, coding conventions, and architectural patterns already established, unless a critical refactor is required for stability or scalability.
    

---

## **Procedure**

1. **Diagnose Precisely:**
    - Clearly identify the cause and location of each error or bug.
    - Document your findings before proceeding with changes.
2. **Plan the Fix:**
    - Propose targeted adjustments to resolve the error while maintaining the surrounding code and dependencies.
    - **Do not remove code or files unless strictly necessary.**
3. **Implement the Fix:**
    - Apply minimal, precise code changes to resolve the error.
    - If new logic is needed, *extend or patch* the code—do not overwrite unrelated functionality.
    - Avoid inserting any placeholder, demo, or non-production logic.
4. **Verify & Test:**
    - Rigorously test all fixes to confirm that production behavior meets requirements.
    - Ensure no regression, no broken features, and no unintended side effects.
5. **Document the Fix:**
    - Record what was fixed, why, and *how* it was addressed—be explicit about any bridging or augmentation.
    - Note any files that were changed, and **explicitly state if anything was removed or replaced (with justification).**
6. **Review for Compliance:**
    - Confirm that all code remains suitable for the production environment and respects the “no unnecessary deletion” mandate.

---

## **Forbidden Actions**

- **Do NOT:**
    - Remove code, files, or modules except as a last resort.
    - Replace working logic with incomplete demo versions.
    - Comment out production logic without clear approval and documentation.
    - Introduce experimental, mock, or placeholder code into the production branch.

---

## **Final Objective**

> Deliver fixes that are precise, targeted, and production-ready, bridging functional gaps without any unnecessary code or file removal. Preserve architectural integrity, minimize disruption, and keep all changes fully documented and justified.
> 

---

**Use this policy as a checklist for all future error fixes in SizeWise or related projects.**