# Harness Patterns for data360-starter-kit

**Date:** 2026-05-26
**Goal:** Bring QSL-style guardrails to this starter kit so all contributors (mixed experience levels) produce consistent, production-portable code via Claude Code.

## Deliverables

### 1. PostToolUse Lint Hook: `scripts/lint-architecture-rules.mjs`

**Trigger:** Runs after every Write/Edit via `.claude/settings.json` hook.

**Checks (all must pass or print warnings):**

| Check | What it validates |
|-------|-------------------|
| Namespace placement | Files under `src/modules/` are in `shell/`, `page/`, `ui/`, or `data/` |
| CSS responsibility | `cosmosApp.css` has no visual properties; `cosmos-theme.css` has no layout properties |
| Label enforcement | `.html` files in `src/modules/{page,ui,shell}/` don't contain new hardcoded strings (text content outside `{expressions}`) |
| Component completeness | Every dir in `page/` and `ui/` has at minimum `.html` + `.js` |

**Behavior:**
- `--hook` flag: only checks the files that were just written/edited (fast path)
- No flag: checks all files (full scan, for CI or manual runs)
- Exits 0 with warnings printed (non-blocking in Claude Code, informational)
- Exits 1 only for critical violations (file in wrong namespace)

---

### 2. CLAUDE.md Update

Add a "Mandatory Skill Gates" section:

```markdown
## Mandatory Skill Gates for LWC Work

These skills MUST be invoked before taking the associated action.

| Trigger | Skill to invoke | When |
|---------|----------------|------|
| Creating any new component under `src/modules/` | `lwc-new-component:lwc-new-component` | Before creating any files |
| Writing or editing `.html`, `.css`, `.js` in `src/modules/` | `lwc-ui-checklist:lwc-ui-checklist` | Before writing any markup, styling, or logic |
| Editing `cosmos-theme.css`, `cosmosApp.css`, or brand CSS | `/theme-audit` | Before writing any change |
| Adding a new page or nav item | `add-nav-item:add-nav-item` | Before creating route or nav entry |
```

Add a "Label Pattern" rule section:

```markdown
## i18n-Ready Label Pattern

No hardcoded user-facing strings in component templates. All user-visible text must be imported from `src/modules/data/labels/<FeatureArea>.js`.

- One file per page or feature area (e.g., `Home.js`, `Contacts.js`)
- Shared labels ("Cancel", "Save", "Close") go in `Common.js`
- Template binds via `{labels.MyLabel}`, never inline text
- Mirrors core's `@salesforce/label/` pattern — porting is a path swap
```

---

### 3. Labels Scaffolding

Create `src/modules/data/labels/` with:
- `Common.js` — shared labels (Cancel, Save, Close, Back, Next, etc.)
- One example feature file (e.g., `Home.js`) to demonstrate the pattern

---

### 4. Settings Update

Add to `.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node scripts/lint-architecture-rules.mjs --hook"
          }
        ]
      }
    ]
  }
}
```

---

## What's NOT in scope

- Retrofitting existing templates with labels (future task)
- Import boundary linting (no dependency graph enforcement yet)
- Pre-push git hooks (just Claude Code PostToolUse for now)
- Variant registry pattern (not needed in starter kit)

---

## Follow-up prompt

Copy/paste this into a new Claude Code session to tackle the next phase:

> We recently added harness patterns to data360-starter-kit (lint hook, CLAUDE.md skill gates, label scaffolding, PostToolUse settings). See `docs/superpowers/specs/2026-05-26-harness-patterns-design.md` for context. Now I want to tackle the follow-up work:
>
> 1. **Retrofit existing templates with labels** — migrate all hardcoded user-facing strings in `src/modules/{page,ui,shell}/` to use the `data/labels/<FeatureArea>.js` pattern. Create label files per feature area as needed.
> 2. **Import boundary linting** — add a `scripts/lint-import-boundaries.mjs` that enforces the namespace dependency rules (page can't import page, ui can't import shell/page, data can't import anything from UI layer). Wire it into the PostToolUse hook alongside lint-architecture-rules.
> 3. **Pre-push git hook** — add a git pre-push hook (installed via npm postinstall) that runs both lint scripts as a blocking gate before pushes land on remote.
>
> Start with the label retrofit since it's the most mechanical, then do import boundaries, then the git hook.
