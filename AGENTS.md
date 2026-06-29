# Agent Guidelines: Data 360 Starter Kit

This repository is a Salesforce Lightning Web Components (LWC) starter kit for prototyping and developing Salesforce UIs locally. It uses Vite as the build tool, SLDS (Salesforce Lightning Design System) v1 and v2, and Lightning Base Components. Synthetic Shadow DOM is enabled to match Salesforce platform behavior.

---

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:4360 (auto-runs icon prebuild)
npm run build        # Production build to dist/
npm run preview      # Preview production bundle locally
npm run clean        # Remove dist, .vite, node_modules
npm run lint:arch    # Check architecture rules (namespace, CSS, labels)
npm run skills:sync  # Sync D360 UX rules for Cursor (pulls from central repo)
```

---

## Architecture

### Component Namespaces

All LWC components live under `src/modules/` organized by namespace:

| Namespace        | Tag Prefix | Purpose                                                                      |
| ---------------- | ---------- | ---------------------------------------------------------------------------- |
| `shell/`         | `shell-*`  | App chrome: header, nav, theme switcher                                      |
| `page/`          | `page-*`   | Route-level **containers** — fetch data via services, pass to `ui/` children |
| `ui/`            | `ui-*`     | Reusable **presentational** components — props in, events out                |
| `data/`          | (import)   | Plain JS modules — not LWC tags                                              |
| `data/services/` | (import)   | Typed async service layer — the client-server boundary                       |
| `data/labels/`   | (import)   | i18n-ready label constants                                                   |

### Routing

- `src/routes.config.js` — single source of truth for all routes
- `src/router.js` — client-side History API router with path param support (`:id`)
- `shell/app` reads routes and dynamically renders the matching `page-*` component

### Service Layer (Client-Server Boundary)

Every data operation goes through a service module in `data/services/`. Services are async functions backed by local fixtures today, becoming Connect API clients when porting to core.

**Import rules:**
- `page/` can import from `data/services/` and `data/labels/` only — never raw `data/*`
- `ui/` can import from `data/labels/` only — never `data/services/` or raw `data/*`
- `data/services/` can import from any `data/` module (it wraps them)

**Service module pattern:**
```javascript
// data/services/contactService.js
import { getAllContacts as _getAll } from 'data/contacts';

/** @typedef {Object} Contact
 *  @property {string} id
 *  @property {string} name */

/** @returns {Promise<Contact[]>} */
export async function listContacts() { return _getAll(); }
```

### Container / Presentational Pattern

- **`page/`** = container — calls services, manages loading/error state, passes data down, handles events, owns navigation
- **`ui/`** = presentational — receives data via `@api` props, dispatches `CustomEvent` for actions, never fetches or navigates

When `ui/` needs navigation:
```javascript
this.dispatchEvent(new CustomEvent('navigate', {
    detail: { route: '/target' }, bubbles: true, composed: true
}));
```

### SLDS Version Policy — SLDS 2 (Cosmos) Only

All new code MUST use SLDS 2 (Cosmos). Do not use SLDS 1 class patterns when a Lightning Base Component or SLDS 2 equivalent exists.

| SLDS 1 (DO NOT USE)       | Use Instead                              |
| ------------------------- | ---------------------------------------- |
| `slds-tabs_default`       | `<lightning-tabset>` / `<lightning-tab>` |
| `slds-button` raw markup  | `<lightning-button>`                     |
| `slds-card` raw markup    | `<lightning-card>`                       |
| `slds-modal` raw markup   | Extend `LightningModal`                  |
| `slds-spinner` raw markup | `<lightning-spinner>`                    |
| `slds-badge` raw markup   | `<lightning-badge>`                      |

### Cosmos Glass Theme — CSS Split

| File                                        | Owns                                                            |
| ------------------------------------------- | --------------------------------------------------------------- |
| `public/cosmos-theme.css`                   | Semantic tokens (`--cos-*`) + SLDS/LBC overrides (global reach) |
| `src/modules/shell/cosmosApp/cosmosApp.css` | Layout + visual for `.cosmos-shell-*` elements                  |
| Component CSS                               | Visual + layout for classes they own, consuming `var(--cos-*)`  |

Rules:
- SLDS/LBC overrides go in `cosmos-theme.css`
- Custom component classes go in their own CSS file
- Never put layout/positioning in `cosmos-theme.css`

### Icon System

- `scripts/prebuild-icons.mjs` compiles 1,600+ SVGs into pre-built JS modules
- Runs automatically before `dev` and `build`; do not edit generated files

### Entry Point

`src/index.js` must import `@lwc/synthetic-shadow` before any LWC imports.

---

## Key Conventions

**Component hierarchy (prefer in this order):**
1. Lightning Base Components (`lightning-button`, `lightning-card`, etc.)
2. SLDS utility classes
3. SLDS styling hooks (CSS custom properties)
4. Custom CSS as last resort

**Styling:**
- No `!important`
- No inline styles
- No CSS that bleeds across component boundaries
- Use `lightning-layout` / `lightning-layout-item` for layout where possible

**Adding a new page:**
1. Create `src/modules/data/services/myPageService.js` with typed async functions
2. Create `src/modules/page/myPage/myPage.{html,js}` — imports from `data/services/` only
3. Add entry to `src/routes.config.js`
4. Register in BOTH shell apps (`shell/app/app.js` and `shell/cosmosApp/cosmosApp.js`)
5. Add nav entry if needed (`navPage` for tabs, `navHighlight` for child routes)

If you only register in one shell file, the page will render blank in the other app.

**Data access rules:**
- `page/` imports from `data/services/` and `data/labels/` — never raw `data/*`
- `ui/` imports from `data/labels/` only — receives all other data as `@api` props
- `ui/` dispatches `CustomEvent` for actions — never calls `navigate()` or mutates data directly

---

## i18n-Ready Label Pattern

No hardcoded user-facing strings in templates. All user-visible text must be imported from `src/modules/data/labels/<FeatureArea>.js`.

```javascript
// data/labels/Contacts.js
export const PageTitle = 'Contacts';
export const SearchPlaceholder = 'Search contacts...';
```

```javascript
import { PageTitle, SearchPlaceholder } from 'data/labels/Contacts';
export default class PageContacts extends LightningElement {
    labels = { PageTitle, SearchPlaceholder };
}
```

Rules:
- One file per page or feature area
- Shared labels ("Cancel", "Save") go in `Common.js`
- Template binds via `{labels.MyLabel}`, never inline text

---

## Synthetic Shadow DOM

Synthetic shadow is enabled in `vite.config.js` to mirror the Salesforce platform. Global SLDS styles penetrate components by design.

---

## D360 UX Skills

This project uses a central set of UX skills for design/development guidance. They're available as:
- **Claude Code plugins** — auto-loaded from the `d360-ux-skills` marketplace (see `.claude/settings.json`)
- **Cursor rules** — synced via `npm run skills:sync` into `.cursor/rules/d360/`

### Skill Reference

| Skill                          | Purpose                                                             | When to use                                                                                 |
| ------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **lwc-ui-checklist**           | 5-step UI decision tree (LBC > Blueprint > Utility > Hook > Custom) | Before writing any markup, styling, or logic                                                |
| **lwc-new-component**          | Component scaffolding workflow                                      | Before creating any new component                                                           |
| **add-nav-item**               | Page + nav wiring workflow                                          | Before adding a new page or nav entry                                                       |
| **new-app**                    | Full app scaffolding                                                | Before adding a new top-level app                                                           |
| **d360-eou**                   | Ease of Use principles evaluation                                   | Before building (PRD/plan/Figma) or after (code) — at least once before feature is complete |
| **a11y-audit**                 | WCAG 2.1 AA accessibility audit                                     | After building, before feature is considered complete                                       |
| **design-architectural-audit** | Simplicity + Outcome maturity audit                                 | Before building — evaluate the design before committing to implementation                   |
| **salesforce-mcp-tools**       | MCP tool usage guide                                                | When looking up SLDS blueprints                                                             |

### Feature development workflow

At key points in the dev process, suggest these skills to the user — do not invoke them automatically.

**Before building** — suggest:
- `/design-architectural-audit` — to review the design for simplicity and outcome maturity before committing to an implementation
- `/d360-eou` — to evaluate a planning document or Figma design against Data 360 Ease of Use principles

**Before considering a feature complete** — suggest:
- `/a11y-audit` — to check WCAG 2.1 AA compliance
- `/d360-eou` — if not already run before building, to evaluate the finished UI

### For UI work

Before writing any HTML, CSS, or component JS, follow the **lwc-ui-checklist** decision tree:
1. Does a Lightning Base Component exist? Use it.
2. Does an SLDS Blueprint exist? Wrap it in a `ui-*` LWC.
3. Does an SLDS Utility Class cover it? Apply in template.
4. Does an SLDS Styling Hook cover it? Use CSS var with fallback.
5. Only then: use a hard-coded CSS value.

After editing files, run `npm run lint:arch` to check for violations.

---

## Theme System Reference

For detailed glass theme rules, see `.claude/commands/theme-audit.md`. Run a theme audit before touching:
- `public/cosmos-theme.css`
- `public/cosmos-brand-*.css`
- `src/modules/shell/cosmosApp/`
- `src/modules/shell/themeSwitcher/`
- `src/modules/ui/auroraBackground/`
- Any component that sets `background`, `backdrop-filter`, or body classes

