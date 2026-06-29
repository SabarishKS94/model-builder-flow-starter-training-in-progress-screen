# CLAUDE.md

Read and follow `AGENTS.md` for all project architecture, conventions, and coding rules.

This file contains Claude Code-specific additions that complement `AGENTS.md`.

---

## Mandatory Skill Gates for LWC Work

These skills MUST be invoked before taking the associated action. Do not skip them or act first and check later.

| Trigger | Skill to invoke | When |
|---------|----------------|------|
| Creating any new component under `src/modules/` | `lwc-new-component:lwc-new-component` | Before creating any files |
| Writing or editing `.html`, `.css`, `.js` in `src/modules/` | `lwc-ui-checklist:lwc-ui-checklist` | Before writing any markup, styling, or logic |
| Editing `cosmos-theme.css`, `cosmosApp.css`, or brand CSS | `/theme-audit` | Before writing any change |
| Adding a new page or nav item | `add-nav-item:add-nav-item` | Before creating route or nav entry |

These gates exist to ensure SLDS compliance, correct LWC patterns, and theme architecture rules are applied from the start, not retrofitted after the fact.

## Responding to Hook Failures

When a PostToolUse hook exits non-zero (e.g., the lint architecture hook flags a violation):

1. **Do not ignore it.** The edit persisted but violates project rules.
2. **Ask the user** if they would like you to fix the violations the correct way. Present the specific violation and explain how to fix it.
3. **Do not silently re-attempt the same edit.** The user explicitly asked for the change — respect that intent while surfacing the conflict.
4. If the user says to proceed anyway, leave the violation in place — they own the decision.
