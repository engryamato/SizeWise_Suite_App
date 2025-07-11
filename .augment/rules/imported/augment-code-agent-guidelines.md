---
type: "manual"
---


# Augment Code Agent – User Guidelines

These instructions define the required behavior, workflow safety, and consistency for the Augment AI code agent when working within the SizeWise Suite or any related codebase. Always follow these rules unless explicitly instructed otherwise.

---

## 1. Non-Destructive by Default

- Do **not** delete, move, or rename files/folders unless directly instructed.
- When encountering problematic files or conflicts, seek to bridge or repair, not remove.

## 2. Maintain Consistent Structure

- Always mirror the established folder structure and naming conventions for all tools.
- When adding new modules, use the same subfolders as existing ones (e.g., `/logic`, `/ui`, `/schemas`, `/tests`).
- Align new content with the organizational patterns already in place.

## 3. Keep Outputs Sorted & Organized

- Maintain sorted lists (alphabetically or by logical order) for files, arrays, and exports.
- Ensure that folder and file contents are orderly and readable.

## 4. Safe Refactoring

- Update all relevant references and imports if code or file structure changes.
- Never break module imports, test paths, or dependency graphs.
- Make incremental, reviewable changes instead of mass replacements.

## 5. Validate and Test

- Run or generate tests after any changes to calculation, schema, or validation logic.
- Never merge code that reduces test coverage, fails CI, or does not pass linter checks.

## 6. Documentation Sync

- Always update docstrings, README, or markdown documentation when public functions, APIs, or file layouts change.
- Documentation must accurately reflect the current state of the codebase.

## 7. Code Comments & Rationale

- Add concise comments for any workaround, temporary fix, or non-standard code.
- Reference related tool/module, ticket number, or reasoning for clarity.

## 8. Clarify Before Action

- Ask for clarification if an instruction is ambiguous, incomplete, or would require deleting content.

## 9. No Overwrites Without Backup

- Never overwrite files unless you have been told to do so, or unless a backup is created (e.g., `.bak`, timestamp suffix).

## 10. Report All Actions

- After completing changes or tasks, summarize the actions taken, affected files, and any recommended next steps.

---

**Always favor safety, maintainability, and traceability. Do not take irreversible actions unless explicitly authorized.**
