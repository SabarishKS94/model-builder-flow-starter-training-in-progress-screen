# Upstream Sync Audit

**Date:** 2026-06-11
**Upstream remote:** `git@git.soma.salesforce.com:a-guevara/design-system-2-starter-kit.git`
**Commits audited:** 56 (54 previously synced + 2 new pending from 2026-06-11 sync)

---

## Summary Table

| Hash | Commit Title | Status | Notes |
|------|-------------|--------|-------|
| `85fa9cc` | Add standalone Builder app (#21) | Missing | Not yet reviewed or applied — pending from 2026-06-11 sync |
| `f870fe3` | chore: ignore .claude/settings.local.json (#19) | Missing | Not yet reviewed or applied — pending from 2026-06-11 sync |
| `d6ce071` | fix: remove redundant horizontal padding inside contact detail cards | Missing | Fork's contactDetail has different structure; no horizontal padding on Details grid or timeline wrappers |
| `833bc87` | Fix card padding for SLDS2 v2, refactor icon page, remove user page (#18) | Missing | `--slds-c-card-body-spacing-inline` not set on home.css or themeSwitcher.css; iconTest still uses raw `slds-card` HTML; user page and route still present |
| `a34b08d` | feat(update-slds2): bump slds2 package dep & import path (#9) | Applied | `^2.0.0` in package.json; `bundled/slds2.cosmos.css` path in slds-loader.js both correct |
| `2999e25` | docs: replace custom Terms of Use with Apache License 2.0 (#8) | Applied | LICENSE.txt is Apache 2.0 with correct copyright |
| `8622503` | docs: update CONTRIBUTING.md to reflect source-available model (#7) | Skipped (intentional) | CONTRIBUTING.md does not exist in this fork; fork is a private derivative |
| `a781b568` | fix: preserve loading.css in production builds (#6) | Applied | `/loading\.css/` exclusion present in vite.config.js |
| `54b063c` | feat: multi-app shell, reusable page-header, and FOUC fixes (#5) | Partial | Multi-app shell and apps.config present; FOUC fix applied; `pageHeader` component exists; globalHeader/globalNavigation NOT moved to `ui/`; preloadSlds1 NOT applied to themeSwitcher; contacts.js search still uses `event.target.value` not `event.detail.value` |
| `e2e726` | Add repo-setup and first-time-deploy agent skills (#4) | Applied | Both SKILL.md files present under `.agent/skills/` |
| `57e1422` | Update CONTRIBUTING.md to remove official support (#3) | Skipped (intentional) | CONTRIBUTING.md does not exist in fork |
| `b0c0ce6` | Skills refactor: agent guidance, SLDS skills sync, remove .cursor/rules (#2) | Applied | `.cursor/rules` removed; `sync-afv-skills.mjs` present; `.gitignore` targets `afv-library/` |
| `ad45abd` | Add community files and gitignore Cursor commands | Skipped (intentional) | No CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, or CODEOWNERS — intentional for private fork |
| `8af69a9` | Project cleanup: dead code, metadata, a11y, docs, and demo polish (#14) | Missing | `alert()` calls NOT replaced with `Toast.show()` in home.js; `@track` on primitives NOT removed; `STORAGE_KEY_SLDS_VERSION` NOT exported; settings page NOT removed; `.nvmrc` not added; avatar1.jpg not added; toast/alert optimizeDeps exclusions not in vite.config |
| `a619fc2` | Component and page cleanup (#13) | Missing | themeSwitcher animation/z-index updates NOT applied (z-indexes still 1/2/3, no `prefers-reduced-motion`, no close animation); page horizontal padding (`slds-p-horizontal_large`) NOT added to home.html or contacts.html |
| `9477aaa` | GitHub Pages hash routing (Vite gh-pages mode) (#12) | Partial | `.env.gh-pages` present; router hash mode present; `linkHref` exported from router.js; BUT app.js does NOT compute `.href` on NAV_ITEMS and globalNavigation.html still uses `{item.path}` not `{item.href}` |
| `cd4b536` | Update global header styles (#9) | Applied | `src/styles/global.css` exists; injected via `index.js` (equivalent to upstream's bootstrap.js) |
| `38aaf7d` | chore(vite): silence LWC diagnostics from lightning-base-components (#11) | Applied | `suppressLbcLwcLoggerNoisePlugin` and rollup `onwarn` handler both present in vite.config.js |
| `057892d` | Add --nojekyll to deploy script in package.json | Applied | `gh-pages -d dist --nojekyll` in package.json deploy script |
| `6bc64d1` | Add gh-pages CLI deploy for repos without Actions (#10) | Applied | `gh-pages` package in devDependencies; deploy script present; GitHub Actions workflows were already removed from this fork |
| `49479577` | Update README.md with new repo name | Skipped (intentional) | Docs-only change for upstream repo name |
| `fba750827` | Add GitHub Pages deployment workflows and preview support (#8) | Skipped (intentional) | Fork uses gh-pages CLI (from 6bc64d1), not GitHub Actions workflows; workflows were never added |
| `d8adae56` | Fix double nav history entries (#7) | Applied | `logical === getLogicalPath()` guard in router.js; `event.stopPropagation()` in globalShell.js |
| `b4ea189` | Update README.md | Skipped (intentional) | Docs-only; upstream-specific repo name change |
| `d20ee07` | Fix theme switcher width and clean up CSS (#6) | Applied | CSS class names use `theme-switcher-card-wrapper` (no BEM underscore); `min-width: calc(...)` using SLDS vars |
| `d2cf391` | Feature: Refactor shell/page layouts and add guided home intro component (#5) | Applied | `ui/homeIntro` exists; page padding to page components pattern followed; `.cursor/rules` updates not applicable (removed in later commit) |
| `c4ade21` | Project layout: src/build, shell namespace, READMEs (#4) | Applied | `src/build/` exists with slds-loader, prebuild assets; `shell/` namespace used throughout |
| `5cc803b` | feat(slds): load global SLDS from npm via Vite, remove postinstall sync (#3) | Applied | `sync-slds-css.mjs` removed; SLDS loaded via `new URL()` in slds-loader.js; no static `<link>` for SLDS in index.html |
| `67d1335` | feat: Migrate to consume SLDS 2 package + clean up package-imported assets (#2) | Applied | `@salesforce-ux/design-system-2` package present; vendored icons removed; build generates icon templates |
| `50337d8` | Update .builderrules to guide agent toward MCP blueprint tools (#12) | Applied | `.builderrules` file present (with fork-specific additions) |
| `154d141` | Simplify Vite dependency problem (#11) | Applied | `optimizeDeps.exclude` with `lightning/modal` etc. present in vite.config.js |
| `c3420e7` | Revert vite dev stubs (#10) | Applied | Stubs reverted; the revert partner commit `26d7d42` (next in list) + this revert = net-zero |
| `26d7d42` | Fix Vite dev: Salesforce/LWC stubs and dependency optimization (#9) | Applied | This was subsequently reverted by `c3420e7`; both are present and cancel out |
| `bd15c43` | Update from the Builder.io agent (#8) | Applied | `page/contacts` and `page/contactDetail` both exist with routing |
| `10c7845` | Centralize routing config, add demo modal, and fix icon template build (#7) | Applied | `routes.config.js` present; `ui/demoModal` exists; vite-plugins/icon-templates.js present |
| `fbf4f76` | Shell and starter improvements: waffle app launcher, docked panel, scroll containment (#6) | Applied | `shell/panel` and `shell/waffle` both exist |
| `9d8b2c0` | docs: README as starter template and .builderrules template-structure guidance (#5) | Applied | `.builderrules` present; fork has its own README |
| `87ade8c` | Revamp home page and app shell with global header, context-bar nav, and theme switcher (#4) | Applied | `shell/globalHeader`, `shell/themeSwitcher` both exist |
| `154e1b0` | Update default document title | Applied | `document.title` set via `getTitleForRoute` in router.js |
| `de2edcd` | Add .cursor rules and .builderrules | Skipped (intentional) | `.cursor/rules` was removed later (b0c0ce6); `.builderrules` present with fork's own content |
| `ea32f10` | Routes update document.title | Applied | Router calls `document.title = getTitleForRoute(route)` |
| `d91c402` | Add clear component namespaces | Applied | Components use `shell/`, `ui/`, `page/` namespaces throughout |
| `7e7c407` | Remove app fade in on ready for smoother refresh | Applied | `classList.add('is-ready')` with no fade-in delay in index.js |
| `e5dc6f1` | feat: add mini client-side router with History API and dynamic route params | Applied | `src/router.js` exists with History API and dynamic params |
| `633317a` | Simplify .gitignore | Applied | `.gitignore` is present and maintained |
| `0745b12` | Update project name to salesforce-ui | Applied | `"name": "salesforce-ui"` in package.json |
| `91bcf5b` | Add src/generated to .gitignore | Applied | `src/build/generated/` in .gitignore |
| `3d5683c` | Update from the Builder.io agent (#2) | Applied | Icon loading pattern (prebuild + aliases) present |
| `98ee587` | Non-blocking icon loading and rename app namespace to main (#3) | Applied | Icon templates loaded in build; `shell/` namespace used (fork's equivalent of `main/` rename) |
| `0a5e1f9` | cleanup: remove spinner and simplify app loading | Applied | No spinner in index.js; `is-ready` class added directly after mount |
| `1e3602a` | feat: improve icon loading performance, add dark mode, and remove test pages (#1) | Applied | Icon preload via build artifacts; dark mode handled by themeSwitcher |
| `5caa31c` | fix: load SLDS 2 exclusively, fall back to SLDS 1 only when unavailable | Applied | slds-loader.js bootstraps SLDS2, only loads SLDS1 on explicit request |
| `8071a8a` | fix: Add gateComboboxElementInternals shim to address attachedInternals issue | Applied | `src/build/shim/gateComboboxElementInternalsClosed.js` present; alias in vite.config.js |
| `e596e9a` | Add navigation via browser APIs | Applied | History API navigation in router.js |
| `88dead4` | Add SLDS Plus styles and icon test page | Applied | `src/modules/page/iconTest` exists; SLDS loading via slds-loader.js |
| `054ef34` | Initial commit: LWC + Vite POC with synthetic shadow DOM | Applied | Foundation of the repo |

---

## Counts

| Status | Count |
|--------|-------|
| Applied | 38 |
| Partial | 2 |
| Missing | 6 |
| Skipped (intentional) | 10 |
| **Total** | **56** |

---

## Needs Action

### 0a. `f870fe3` — chore: ignore .claude/settings.local.json (#19)

**What the upstream change was:** Added `.claude/settings.local.json` to `.gitignore` so personal Claude Code settings aren't accidentally committed.

**What to check:** `.gitignore` in project root.

**What is missing:** The `.gitignore` entry for `.claude/settings.local.json`. Low-risk, direct apply.

---

### 0b. `85fa9cc` — Add standalone Builder app (#21)

**What the upstream change was:** Added a new `page/builder` page with a header, resizable panels, and a canvas. Also updated `shell/app` to support registering it, and modified `shell/panel` component.

**Files changed upstream:** `src/apps.config.js`, `src/modules/page/builder/` (new), `src/modules/shell/app/app.{css,html,js}`, `src/modules/shell/panel/panel.html`, `src/modules/ui/builderHeader/` (new).

**What is missing:** This commit has not been reviewed yet — needs a decision on whether to adopt the Builder app as-is, adapt it, or skip it. Inspect with `git show 85fa9cc`.

---

### 1. `d6ce071` — fix: remove redundant horizontal padding inside contact detail cards

**What the upstream change was:** Removed `slds-p-horizontal_medium` from the `c-contact-details-grid` wrapper div and `slds-p-horizontal_small` from the timeline section wrapper inside `contactDetail.html`, so that `lightning-card`'s own internal padding handles spacing.

**What to check:** `src/modules/page/contactDetail/contactDetail.html`

**What is missing:** The fork's contactDetail has a significantly different layout (no `c-contact-details-grid` class, different structure). However, neither the Activity card's content div nor the Details card content div have horizontal padding removed. The `contactDetail.css` already sets `--slds-c-card-body-spacing-inline`, so the cards do get body padding. The functional intent (no double-padding) may be met differently, but it has not been explicitly verified. **Recommend** reviewing whether `lightning-card` body sections in the current contactDetail.html have any redundant `slds-p-horizontal_*` classes that should be removed.

---

### 2. `833bc87` — Fix card padding for SLDS2 v2, refactor icon page, remove user page (#18)

**What the upstream change was:**
1. **Card padding fix:** Added `lightning-card { --slds-c-card-body-spacing-inline: var(--slds-g-spacing-var-inline-4); }` to `home.css` and `themeSwitcher.css` so cards have body padding under SLDS2 v2 (which no longer provides this token by default).
2. **Icon page refactor:** Replaced raw `slds-card` HTML markup with `lightning-card` components in `iconTest.html`. Trimmed icon lists to a representative subset; added a "Browse Full Icon Library" button. Removed `min-height: 100vh` from iconTest.css.
3. **User page removal:** Deleted `page/user/` component files and removed the `/users/:id` route from `routes.config.js` and apps.config.js.

**Files to check:**
- `src/modules/page/home/home.css` — missing `lightning-card { --slds-c-card-body-spacing-inline: ... }`
- `src/modules/shell/themeSwitcher/themeSwitcher.css` — missing `lightning-card { --slds-c-card-body-spacing-inline: ... }`
- `src/modules/page/iconTest/iconTest.html` — still uses raw `<article class="slds-card ...">` markup; not migrated to `lightning-card`
- `src/modules/page/iconTest/iconTest.css` — still has `min-height: 100vh` at line 4
- `src/modules/page/user/` — directory still exists (user.html, user.js, user.css)
- `src/routes.config.js` — `/users/:id` route still present
- `src/apps.config.js` — `'user'` still in pages arrays

**What is missing:**
- home.css and themeSwitcher.css need the `--slds-c-card-body-spacing-inline` styling hook (cards will have no body inline padding in SLDS2 v2 without it).
- iconTest is still using raw `slds-card` SLDS blueprint markup instead of `lightning-card`. The icon page refactor (reduced icon set, "Browse" button, CSS cleanup) has not been applied.
- The user page was not removed from the fork's routes, apps config, or filesystem.

---

### 3. `8af69a9` — Project cleanup: dead code, metadata, a11y, docs, and demo polish (#14)

**What the upstream change was:** Multiple cleanup items in one commit:
- Replace all `window.alert()` calls in `home.js` with `Toast.show()` from `lightning/toast`; also add a `handleDestructiveButton` handler (previously missing)
- Remove `@track` decorators from all primitive properties in `home.js`, `globalNavigation.js`, and other components
- Export `STORAGE_KEY_SLDS_VERSION` from `slds-loader.js` (for external consumers)
- Remove `settings` page component and route
- Add `.nvmrc` (Node 20)
- Add `package.json` engines field (`node >= 20`)
- Add `public/images/avatar1.jpg` (local avatar, replaces external URL)
- Add `src/modules/page/notFound/` component
- Add `lightning/alert` and toast modules to vite.config.js `optimizeDeps.exclude`
- Remove `@track` from `globalNavigation.js`

**Files to check:**
- `src/modules/page/home/home.js` — still has `alert()` calls at lines 97, 111, 115, 119; still uses `@track` on all form state properties; missing `handleDestructiveButton`
- `src/build/slds-loader.js` — `STORAGE_KEY_SLDS_VERSION` is `const` (unexported) at line 20, should be `export const`
- `src/modules/page/settings/` — still present; route still in routes.config.js
- `.nvmrc` — missing
- `package.json` — missing `engines` field; `author` and `description` fields are blank
- `vite.config.js` — `lightning/alert` and `lightning/toast` not in `optimizeDeps.exclude`
- `src/modules/shell/globalNavigation/globalNavigation.js` — still has `@track isWaffleMenuOpen`

**What is missing:** The `alert()` to `Toast.show()` migration is the most visible functional gap (users see browser dialogs instead of Lightning toasts). The `STORAGE_KEY_SLDS_VERSION` export and settings page removal are also real gaps; the rest (`@track`, `.nvmrc`, `engines`) are code quality items.

---

### 4. `54b063c` (partial) — feat: multi-app shell, reusable page-header, and FOUC fixes (#5)

**What is missing (the partial parts):**

**4a. `preloadSlds1` in themeSwitcher**
- Upstream added `import { preloadSlds1 } from '../../../build/slds-loader'` to `themeSwitcher.js` and calls `preloadSlds1()` when the theme menu opens, so SLDS1 is cached before the user clicks "Switch to SLDS 1".
- **Files to check:** `src/build/slds-loader.js` (needs `export function preloadSlds1()`), `src/modules/shell/themeSwitcher/themeSwitcher.js` (needs the import and call)

**4b. contacts.js search event source**
- Upstream changed `this.searchTerm = event.target.value` → `this.searchTerm = event.detail.value` in contacts.js, because the search event now dispatches from `pageHeader` (a custom `search` event with `detail.value`), not from a direct `<lightning-input>`.
- **File to check:** `src/modules/page/contacts/contacts.js` line 71 — if the search input is wired through `ui-page-header`, the event source needs to be `event.detail.value`; if the fork doesn't use pageHeader's search dispatch, this may be moot but should be verified.

**4c. `linkHref` not computed in NAV_ITEMS (from `9477aaa` — Partial)**
- `9477aaa` added `linkHref()` computation to `app.js` NAV_ITEMS so each item gets an `.href` attribute, and updated `globalNavigation.html` to use `{item.href}` instead of `{item.path}`.
- The fork's `app.js` does not compute `.href`; `globalNavigation.html` still uses `{item.path}`.
- **Effect:** Right-click "Open in new tab" and "Copy link" on nav items won't produce a valid URL in hash-mode deployments. Functional navigation (click) still works since it uses the click handler.
- **Files to check:** `src/modules/shell/app/app.js` (NAV_ITEMS mapping at line 124), `src/modules/shell/globalNavigation/globalNavigation.html` (line 48)

---

### 5. `a619fc2` — Component and page cleanup (#13)

**What the upstream change was:**
1. Raised themeSwitcher z-indexes to 9051/9052 (above lightning-spinner's 9050 z-index)
2. Removed `theme-switcher-backdrop` (replaced with click-outside listener on window)
3. Added open/close CSS animations to the theme switcher card wrapper, gated by `@media (prefers-reduced-motion: no-preference)`
4. Added `isCardClosing` state and `_beginCloseCard()` to `themeSwitcher.js` for the exit animation
5. Added `slds-p-horizontal_large` to `home.html` and `contacts.html` container divs

**Files to check:**
- `src/modules/shell/themeSwitcher/themeSwitcher.css` — z-indexes are still 1/2/3 (not 9051/9052); no `@media (prefers-reduced-motion: no-preference)` animation block present
- `src/modules/shell/themeSwitcher/themeSwitcher.js` — missing `isCardClosing` flag and `_beginCloseCard()` logic; toggle just does `this.isCardOpen = !this.isCardOpen`
- `src/modules/page/home/home.html` — container div at line 4 lacks `slds-p-horizontal_large`
- `src/modules/page/contacts/contacts.html` — container div at line 2 lacks any horizontal padding

**What is missing:** The z-index values for themeSwitcher are too low (lightning-spinner at z-index 9050 would cover the switcher). The close animation was not applied. The page horizontal padding was not added. Note: the backdrop removal was carried over (no backdrop element in current HTML), but the z-index fix was not.
