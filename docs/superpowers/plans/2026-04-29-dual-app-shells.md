# Dual App Shells Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create two independent app shells — a clean Standard Shell (flexbox layout, QSL-style) and a purpose-built Cosmos Shell (glass effects, fixed positioning) — accessible via separate HTML entry points for A/B testing.

**Architecture:** Two separate HTML entry points: `index.html` (Standard Shell at `localhost:3000`) and `cosmos.html` (Cosmos Shell at `localhost:3000/cosmos.html`). Each has its own JS entry file (`src/index.js` and `src/cosmos-index.js`). Both shells reuse the same child components (`globalShell`, `verticalNav`, `panel`, `themeSwitcher`, `login`). The Standard Shell uses QSL-style flexbox column layout (header flows, content scrolls in a bounded region). The Cosmos Shell uses fixed-position header + vertical nav so content scrolls behind them for the backdrop-filter glass effect. Vite is configured as a multi-page app with both entry points. The Cosmos Shell's CSS is self-contained — it does NOT rely on `globalShell.css` for glass styling; the glass visual is applied entirely from `cosmosApp.css`.

**Tech Stack:** LWC, SLDS 2 (Cosmos design tokens), CSS custom properties, Vite

**Key Design Decision — Glass Styling Ownership:** The current bug (double glass, misaligned nav) stems from glass styles living in TWO places: `globalShell.css :host` AND `cosmos-theme.css .global-shell`. In the new architecture:
- `globalShell.css` has NO glass/positioning styles — it's a plain structural wrapper
- `cosmosApp.css` owns ALL cosmos glass effects via descendant selectors (e.g. `shell-global-shell`, `.vertical-nav`)
- `cosmos-theme.css` continues to own ambient background (gradient, orbs), semantic token overrides, and element-level glass (cards, buttons, modals, inputs, dropdowns) — NOT shell chrome positioning or shell glass effects

---

## File Structure

### New files to create
| File | Responsibility |
|------|---------------|
| `src/modules/shell/cosmosApp/cosmosApp.html` | Cosmos shell template — fixed header, fixed nav, padded content |
| `src/modules/shell/cosmosApp/cosmosApp.js` | Cosmos shell logic — extends same routing/auth/theme as standard shell |
| `src/modules/shell/cosmosApp/cosmosApp.css` | All cosmos positioning + glass chrome (single source of truth) |
| `cosmos.html` | Separate HTML entry point for Cosmos shell (at `localhost:3000/cosmos.html`) |
| `src/cosmos-index.js` | Bootstrap script for Cosmos shell — mounts `shell-cosmos-app` |

### Files to modify
| File | Change |
|------|--------|
| `src/modules/shell/app/app.html` | Restore to QSL-style flexbox layout |
| `src/modules/shell/app/app.css` | Restore to QSL-style flexbox CSS (remove fixed-position hacks) |
| `src/modules/shell/app/app.js` | Simplify — remove `_measureHeader`, restore standard flow |
| `src/modules/shell/globalShell/globalShell.css` | Strip glass/positioning from `:host` — make it a plain structural wrapper |
| `src/modules/shell/verticalNav/verticalNav.css` | Remove `position: fixed` — make it a flow-based flex child again |
| `src/modules/shell/verticalNav/verticalNav.js` | Remove `collapsetoggle` event dispatch (cosmos shell handles collapse differently) |
| `src/index.js` | Clean up — standard shell only, no switching logic |
| `public/cosmos-theme.css` | Remove all `.global-shell` positioning/margin rules and shell-level glass — keep ambient bg, tokens, and element-level glass |
| `index.html` | Remove the inline `<style id="cosmos-light-overrides">` block and the inline `<script>` theme toggle button; this becomes the Standard Shell entry point |
| `vite.config.js` | Add multi-page app configuration with both `index.html` and `cosmos.html` as entry points |

### Files to NOT touch
| File | Reason |
|------|--------|
| `src/modules/shell/globalShell/globalShell.html` | Template structure is fine — both shells use it |
| `src/modules/shell/globalShell/globalShell.js` | Logic is fine — just event relay |
| `src/modules/shell/globalHeader/*` | Works as-is in both shells |
| `src/modules/shell/globalNavigation/*` | Works as-is in both shells |
| `src/modules/shell/panel/*` | Works as-is in both shells |
| `src/modules/shell/login/*` | Works as-is in both shells |
| `src/routes.config.js` | No changes needed |
| `src/router.js` | No changes needed |

---

## Task 1: Clean up globalShell.css — remove glass and positioning

The root cause of the double-glass bug. Strip `globalShell.css` back to a plain structural wrapper so it has no opinion about positioning or visual treatment. Both shells will provide their own chrome styling from the outside.

**Files:**
- Modify: `src/modules/shell/globalShell/globalShell.css`

- [ ] **Step 1: Replace globalShell.css with plain structural styles**

Replace the entire contents of `src/modules/shell/globalShell/globalShell.css` with:

```css
.global-shell::before {
    content: "";
    position: absolute;
    inset: 0;
    box-shadow: var(--slds-g-shadow-2, 0px 2px 3px 0px #00000027);
    z-index: -1;
    opacity: 0.25;
}
```

This matches exactly what the QSL prototype uses — just a subtle shadow on the `.global-shell` layout container. No glass, no positioning, no backdrop-filter on `:host`.

- [ ] **Step 2: Commit**

```bash
git add src/modules/shell/globalShell/globalShell.css
git commit -m "refactor: strip glass and positioning from globalShell — plain structural wrapper"
```

---

## Task 2: Restore shell/app to QSL-style Standard Shell

Rewrite `app.html`, `app.css`, and simplify `app.js` to match the QSL prototype's flexbox layout. This becomes the Standard Shell — no fixed positioning, no glass, content does not scroll behind the header.

**Files:**
- Modify: `src/modules/shell/app/app.html`
- Modify: `src/modules/shell/app/app.css`
- Modify: `src/modules/shell/app/app.js`

- [ ] **Step 1: Rewrite app.html to QSL flexbox layout**

Replace the entire contents of `src/modules/shell/app/app.html` with:

```html
<!-- src/modules/shell/app/app.html — Standard Shell (QSL-style flexbox) -->
<template>
    <template lwc:if={isAuthenticated}>
        <shell-global-shell
            current-page={currentNavPage}
            nav-items={navItems}
            apps={allApps}
            active-app-label={activeAppLabel}
            active-app-id={activeAppId}
            user={_authUser}
            onnavigate={handleNavNavigate}
            onappswitch={handleAppSwitch}
            onpanelselect={handlePanelSelect}>
        </shell-global-shell>

        <main class="app-body">
            <lightning-layout vertical-align="stretch" class="utility-full-height">
                <lightning-layout-item lwc:if={showVerticalNav} class="app-body__sidebar">
                    <shell-vertical-nav
                        nav-items={verticalNavItems}
                        current-page={currentNavPage}
                        onnavigate={handleNavNavigate}>
                    </shell-vertical-nav>
                </lightning-layout-item>

                <lightning-layout-item flexibility="auto" class="app-body__content-cell">
                    <div class="app-body__scroll-wrapper">
                        <div class="app-main">
                            <div class="app-main__inner">
                                <template lwc:if={componentCtor}>
                                    <lwc:component lwc:is={componentCtor} onnavigateback={handleNavigateBack}></lwc:component>
                                </template>
                            </div>
                            <shell-theme-switcher
                                active-theme={_activeTheme}
                                onapplytheme={handleApplyTheme}>
                            </shell-theme-switcher>
                        </div>
                    </div>
                </lightning-layout-item>

                <lightning-layout-item class={panelClasses}>
                    <shell-panel selected-panel={selectedPanel} onpanelclose={handlePanelClose}></shell-panel>
                </lightning-layout-item>
            </lightning-layout>
        </main>
    </template>
    <template lwc:elseif={isAuthChecked}>
        <shell-login></shell-login>
    </template>
</template>
```

Key differences from current: no fixed-position overlay pattern, no separate panel overlay div. Vertical nav is a flex child inside the body layout, and the panel uses the SLDS docked-panel pattern (same as QSL).

- [ ] **Step 2: Rewrite app.css to QSL flexbox layout**

Replace the entire contents of `src/modules/shell/app/app.css` with:

```css
/* src/modules/shell/app/app.css — Standard Shell (QSL-style flexbox) */
:host {
    display: flex;
    flex-direction: column;
    height: 100vh;
    min-height: 100vh;
    overflow: hidden;
    background-color: var(--slds-g-color-surface-2, #f3f3f3);
}

:host > shell-global-shell {
    flex-shrink: 0;
    position: relative;
    z-index: 2;
}

.app-body {
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
    position: relative;
    z-index: 1;
}

.utility-full-height {
    height: 100%;
}

.app-body__sidebar {
    min-width: 0;
    flex-shrink: 0;
}

.app-body__content-cell {
    min-height: 0;
    min-width: 0;
}

.app-body__scroll-wrapper {
    height: 100%;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.app-main {
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
    overflow: auto;
    position: relative;
    display: flex;
    flex-direction: column;
}

.app-main__inner {
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

shell-theme-switcher {
    flex-shrink: 0;
}

lightning-badge {
    display: inline-block;
}
```

- [ ] **Step 3: Simplify app.js — remove fixed-positioning helpers**

In `src/modules/shell/app/app.js`, make these changes:

**a)** Remove the `renderedCallback` and `_measureHeader` methods entirely (lines 151-165). These were only needed for the fixed-position overlay layout.

**b)** Remove the `_isNavCollapsed` tracked property and `handleNavCollapseToggle` method. The standard shell doesn't need to track nav collapse at the app level — the vertical nav manages its own width internally.

**c)** Replace the `contentClasses` getter with removal (no longer used — the template no longer has an `app-content` div with nav-dependent padding).

**d)** Replace `panelOverlayClasses` getter with a QSL-style `panelClasses` getter:

```javascript
get panelClasses() {
    return `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-right ${
        this.isPanelOpen ? 'slds-is-open' : ''
    }`;
}
```

**e)** Remove the `--shell-overlay-top` CSS variable manipulation from `_measureHeader` (which is already deleted).

The remaining `app.js` should have: auth, routing, theme switching, nav/panel/app-switch event handlers — no layout measurement code.

- [ ] **Step 4: Verify the standard shell renders**

```bash
npm run dev
```

Open `http://localhost:3000` in the browser. Verify:
- Header renders at the top, not floating/fixed
- If vertical nav is active, it appears as a sidebar to the left of content
- Content scrolls within its region, header stays pinned via flex (not fixed)
- No double-glass artifacts
- Panel slides open/closed from the right

- [ ] **Step 5: Commit**

```bash
git add src/modules/shell/app/app.html src/modules/shell/app/app.css src/modules/shell/app/app.js
git commit -m "refactor: restore standard app shell to QSL-style flexbox layout"
```

---

## Task 3: Restore verticalNav to flow-based layout

Remove fixed positioning from verticalNav so it works as a flex child in the standard shell. The cosmos shell will apply its own fixed positioning from the outside.

**Files:**
- Modify: `src/modules/shell/verticalNav/verticalNav.css`
- Modify: `src/modules/shell/verticalNav/verticalNav.js`

- [ ] **Step 1: Rewrite verticalNav.css for flow-based layout**

Replace the entire contents of `src/modules/shell/verticalNav/verticalNav.css` with:

```css
/* src/modules/shell/verticalNav/verticalNav.css */
:host {
    display: block;
    overflow: hidden;
    flex-shrink: 0;
    height: 100%;
    border-right: 1px solid var(--slds-g-color-border-1, #c9c9c9);
}

.vertical-nav {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: var(--slds-g-sizing-14, 15rem);
    transition: width 0.2s ease;
    background-color: var(--slds-g-color-surface-1, #ffffff);
    overflow: hidden;
}

.vertical-nav_collapsed {
    width: var(--slds-g-sizing-10, 3rem);
    cursor: pointer;
}

.vertical-nav__search {
    padding: var(--slds-g-spacing-2, 0.5rem);
    border-bottom: 1px solid var(--slds-g-color-border-1, #c9c9c9);
    flex-shrink: 0;
}

.vertical-nav_collapsed .vertical-nav__search {
    display: none;
}

.vertical-nav__body {
    flex: 1 1 0;
    overflow-y: auto;
    overflow-x: hidden;
}

.vertical-nav__group-header {
    display: flex;
    align-items: center;
    width: 100%;
    padding: var(--slds-g-spacing-2, 0.5rem) var(--slds-g-spacing-3, 0.75rem);
    cursor: pointer;
    font-size: var(--slds-g-font-scale-neg-1, 0.75rem);
    font-weight: var(--slds-g-font-weight-6, 600);
    text-transform: uppercase;
    letter-spacing: 0.0625rem;
    color: var(--slds-g-color-on-surface-2, #444);
    transition: background-color 0.1s ease;
}

.vertical-nav__group-header:hover {
    background-color: var(--slds-g-color-surface-2, #f3f3f3);
}

.vertical-nav__group-label {
    flex: 1 1 auto;
    text-align: left;
}

.vertical-nav_collapsed .vertical-nav__group-label,
.vertical-nav_collapsed .vertical-nav__chevron {
    display: none;
}

.vertical-nav__footer {
    flex-shrink: 0;
    padding: var(--slds-g-spacing-2, 0.5rem);
    border-top: 1px solid var(--slds-g-color-border-1, #c9c9c9);
}

.vertical-nav__footer-link {
    display: flex;
    align-items: center;
    padding: var(--slds-g-spacing-2, 0.5rem);
    color: var(--slds-g-color-on-surface-2, #444);
    text-decoration: none;
    font-size: var(--slds-g-font-scale-neg-1, 0.75rem);
    border-bottom: 1px solid var(--slds-g-color-border-1, #c9c9c9);
    margin-bottom: var(--slds-g-spacing-1, 0.25rem);
}

.vertical-nav__footer-link:hover {
    background-color: var(--slds-g-color-surface-2, #f3f3f3);
    text-decoration: none;
}

.vertical-nav__collapse-btn {
    display: flex;
    align-items: center;
    padding: var(--slds-g-spacing-2, 0.5rem);
    cursor: pointer;
    color: var(--slds-g-color-on-surface-2, #444);
    width: 100%;
}

.vertical-nav__collapse-btn:hover {
    background-color: var(--slds-g-color-surface-2, #f3f3f3);
}
```

Key changes from current: removed `position: fixed`, `top/left/bottom`, `z-index: 8`, `border-radius`, `box-shadow`, and all `backdrop-filter` / glass effects from `:host`. Now it's a plain flow child that fills its parent height. Matches the QSL prototype's `verticalNav.css`.

- [ ] **Step 2: Remove collapsetoggle event from verticalNav.js**

In `src/modules/shell/verticalNav/verticalNav.js`, update the `handleCollapseToggle` method. Remove the `dispatchEvent` call — the standard shell doesn't need to adjust padding in response to collapse since the nav is a flex child that sizes itself:

```javascript
handleCollapseToggle() {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem(STORAGE_KEY, String(this.isCollapsed));
}
```

Note: The cosmos shell will need to know about collapse state. It will handle this by querying the nav's width or listening for a different mechanism — addressed in Task 5.

- [ ] **Step 3: Verify vertical nav renders correctly in standard shell**

```bash
npm run dev
```

Open `http://localhost:3000`. Switch to an app that uses vertical nav. Verify:
- Nav appears as a sidebar flush against the left
- Nav collapses/expands and content reflows naturally
- No fixed positioning artifacts
- Scrolling content doesn't go behind the nav

- [ ] **Step 4: Commit**

```bash
git add src/modules/shell/verticalNav/verticalNav.css src/modules/shell/verticalNav/verticalNav.js
git commit -m "refactor: restore verticalNav to flow-based layout for standard shell"
```

---

## Task 4: Clean up cosmos-theme.css — remove shell chrome positioning

Remove the shell-level positioning and glass rules from `cosmos-theme.css` that will now live in `cosmosApp.css`. Keep everything else: ambient background, semantic token overrides, element-level glass (cards, buttons, modals, inputs, dropdowns, datatables).

**Files:**
- Modify: `public/cosmos-theme.css`

- [ ] **Step 1: Identify rules to remove**

Remove these rule blocks from `public/cosmos-theme.css`:

**For BOTH cosmos-dark and cosmos-light, remove:**
- `.global-header { background: transparent; ... }` (both occurrences per theme)
- `.slds-global-header { background: transparent; ... }` (both occurrences per theme)
- `.global-shell { background: ...; margin: 20px; ... }` (both occurrences per theme — this is the main offender)
- `.global-shell::before { content: ''; ... }` (gradient border pseudo-element — both themes)
- `.app-body { padding-left: 20px; ... position: absolute; top: 140px; ... }` (both themes)
- `.vertical-nav { background: ...; border: ...; border-radius: ...; backdrop-filter: ... }` (both themes)
- `.global-header { position: relative; }` (both themes — the second occurrence)
- `.global-header .customize-slds-button lightning-layout { gap: 4px; }` (both themes)
- `.slds-global-header__item_search { position: absolute; left: 50%; ... }` (both themes)
- Search input styles (`.slds-container_small.slds-container_center ...`) (both themes)
- Avatar border-radius overrides (`.global-header lightning-avatar ...`) (both themes)
- Header icon size/color overrides (`.global-header lightning-button-icon ...`) (both themes)

**Keep these rules in cosmos-theme.css** (they're element-level, not shell-level):
- `@keyframes floatPastel` and `body::before` / `body::after` (ambient background)
- `body.cosmos-* > #app` z-index
- Token overrides (`--slds-g-color-surface-*: transparent`, etc.)
- `.slds-card`, `.slds-card::before` (card glass)
- `lightning-card` custom properties
- `.slds-section` styles
- `.slds-panel`, `.slds-panel::before`, `.slds-panel_docked-right` (panel glass)
- `.slds-button.*` styles (button glass)
- `lightning-badge` styles
- `.slds-modal__*` styles (modal glass)
- `.slds-context-bar` styles
- `lightning-input .slds-input`, `lightning-textarea`, `lightning-combobox` (input glass)
- `.slds-dropdown`, `.slds-combobox .slds-listbox` (dropdown glass)
- `.slds-spinner` styles
- `.slds-listbox__option` hover styles
- `lightning-datatable .slds-table` styles
- `.intro-copy` color
- `.slds-card__header-title` font weight
- `.slds-context-bar__app-name .slds-truncate` font weight
- Icon size/color overrides (`.slds-icon.slds-icon_large`, `.slds-icon.slds-icon-text-default`)
- Inter font `@font-face`
- `.slds-text-heading_large` font override
- Waffle icon color overrides
- `.slds-backdrop` color

- [ ] **Step 2: Remove the identified shell-chrome rules**

Carefully remove each block listed above. The resulting `cosmos-theme.css` should contain only:
1. Ambient background keyframes and pseudo-elements
2. Semantic token overrides
3. Element-level glass (cards, buttons, modals, inputs, datatables, panels, dropdowns)
4. Typography (Inter font, heading overrides)
5. Waffle icon colors
6. Card/context-bar font weight

- [ ] **Step 3: Verify standard shell still works with cosmos theme tokens**

```bash
npm run dev
```

Open `http://localhost:3000`. Activate cosmos-dark or cosmos-light theme. Verify:
- Ambient gradient background still renders
- Cards, buttons, inputs still have glass treatment
- The standard shell header is NOT glass (just transparent, showing the ambient bg behind it) — this is correct, the glass is a cosmos shell feature
- No console errors

- [ ] **Step 4: Commit**

```bash
git add public/cosmos-theme.css
git commit -m "refactor: remove shell-chrome positioning from cosmos-theme.css — moved to cosmosApp"
```

---

## Task 5: Create the Cosmos App Shell

The main event. Create `shell/cosmosApp` — a purpose-built shell with fixed-position header and nav, glass effects owned entirely by its CSS, and content that scrolls behind the glass header.

**Files:**
- Create: `src/modules/shell/cosmosApp/cosmosApp.html`
- Create: `src/modules/shell/cosmosApp/cosmosApp.js`
- Create: `src/modules/shell/cosmosApp/cosmosApp.css`

- [ ] **Step 1: Create cosmosApp.html**

Create `src/modules/shell/cosmosApp/cosmosApp.html`:

```html
<!-- src/modules/shell/cosmosApp/cosmosApp.html — Cosmos Shell (glass effect) -->
<template>
    <template lwc:if={isAuthenticated}>
        <!-- Fixed overlay: global header + context bar -->
        <shell-global-shell
            class="cosmos-shell-header"
            current-page={currentNavPage}
            nav-items={navItems}
            apps={allApps}
            active-app-label={activeAppLabel}
            active-app-id={activeAppId}
            user={_authUser}
            onnavigate={handleNavNavigate}
            onappswitch={handleAppSwitch}
            onpanelselect={handlePanelSelect}>
        </shell-global-shell>

        <!-- Fixed overlay: left nav -->
        <template lwc:if={showVerticalNav}>
            <shell-vertical-nav
                class="cosmos-shell-nav"
                nav-items={verticalNavItems}
                current-page={currentNavPage}
                onnavigate={handleNavNavigate}
                oncollapsetoggle={handleNavCollapseToggle}>
            </shell-vertical-nav>
        </template>

        <!-- Content: full-viewport base layer, scrolls behind fixed overlays -->
        <main class={contentClasses}>
            <div class="cosmos-content__inner">
                <template lwc:if={componentCtor}>
                    <lwc:component lwc:is={componentCtor} onnavigateback={handleNavigateBack}></lwc:component>
                </template>
            </div>
            <shell-theme-switcher
                active-theme={_activeTheme}
                onapplytheme={handleApplyTheme}>
            </shell-theme-switcher>
        </main>

        <!-- Fixed overlay: right panel (slides in/out) -->
        <div class={panelOverlayClasses}>
            <shell-panel selected-panel={selectedPanel} onpanelclose={handlePanelClose}></shell-panel>
        </div>
    </template>
    <template lwc:elseif={isAuthChecked}>
        <shell-login></shell-login>
    </template>
</template>
```

- [ ] **Step 2: Create cosmosApp.js**

Create `src/modules/shell/cosmosApp/cosmosApp.js`:

```javascript
// src/modules/shell/cosmosApp/cosmosApp.js — Cosmos Shell
import { LightningElement, track } from 'lwc';
import { subscribe, navigate } from '../../../router';
import { routes } from '../../../routes.config';
import { apps, getDefaultApp, getAppById, ACTIVE_APP_STORAGE_KEY } from '../../../apps.config';
import { isAuthDisabled } from '../../../data/authMode.js';
import { onAuthStateChanged } from '../../../data/firebaseAuth.js';
import Home from 'page/home';
import IconTest from 'page/iconTest';
import Settings from 'page/settings';
import ChurnRateSegment from 'page/churnRateSegment';
import User from 'page/user';
import Contacts from 'page/contacts';
import ContactDetail from 'page/contactDetail';
import ConnectUnify1 from 'page/connectUnify1';
import ConnectUnify2 from 'page/connectUnify2';
import ConnectUnify3 from 'page/connectUnify3';
import GovernSecure1 from 'page/governSecure1';
import GovernSecure2 from 'page/governSecure2';
import GovernSecure3 from 'page/governSecure3';
import ProcessEnrich1 from 'page/processEnrich1';
import ProcessEnrich2 from 'page/processEnrich2';
import ProcessEnrich3 from 'page/processEnrich3';
import ExploreOptimize1 from 'page/exploreOptimize1';
import ExploreOptimize2 from 'page/exploreOptimize2';
import ExploreOptimize3 from 'page/exploreOptimize3';
import AnalyzePredict1 from 'page/analyzePredict1';
import AnalyzePredict2 from 'page/analyzePredict2';
import AnalyzePredict3 from 'page/analyzePredict3';
import SegmentAct1 from 'page/segmentAct1';
import SegmentAct2 from 'page/segmentAct2';
import SegmentAct3 from 'page/segmentAct3';

const ROUTE_COMPONENTS = {
    'page-home': Home,
    'page-icon-test': IconTest,
    'page-settings': Settings,
    'page-churn-rate-segment': ChurnRateSegment,
    'page-user': User,
    'page-contacts': Contacts,
    'page-contact-detail': ContactDetail,
    'page-connect-unify1': ConnectUnify1,
    'page-connect-unify2': ConnectUnify2,
    'page-connect-unify3': ConnectUnify3,
    'page-govern-secure1': GovernSecure1,
    'page-govern-secure2': GovernSecure2,
    'page-govern-secure3': GovernSecure3,
    'page-process-enrich1': ProcessEnrich1,
    'page-process-enrich2': ProcessEnrich2,
    'page-process-enrich3': ProcessEnrich3,
    'page-explore-optimize1': ExploreOptimize1,
    'page-explore-optimize2': ExploreOptimize2,
    'page-explore-optimize3': ExploreOptimize3,
    'page-analyze-predict1': AnalyzePredict1,
    'page-analyze-predict2': AnalyzePredict2,
    'page-analyze-predict3': AnalyzePredict3,
    'page-segment-act1': SegmentAct1,
    'page-segment-act2': SegmentAct2,
    'page-segment-act3': SegmentAct3,
};

const ROUTE_TO_NAV_PAGE = Object.fromEntries(
    routes
        .filter((r) => r.navPage || r.navHighlight)
        .map((r) => [r.component, r.navPage ?? r.navHighlight])
);

const NAV_PAGE_TO_PATH = Object.fromEntries(
    routes.filter((r) => r.navPage).map((r) => [r.navPage, r.navPath ?? r.path])
);

const STORAGE_KEY_THEME = 'slds-ui-theme';
const COSMOS_INSET = 20; // px — consistent inset for all overlay elements

export default class CosmosApp extends LightningElement {
    @track route;
    @track _activeTheme = 'cosmos-dark';
    @track selectedPanel = 'agentforce_panel';
    @track isPanelOpen = false;
    @track _activeAppId = getDefaultApp().id;
    @track _authUser = null;
    @track _authChecked = false;
    @track _isNavCollapsed = localStorage.getItem('vertical-nav-collapsed') === 'true';

    _redirectPath = '/';
    _unsubscribeAuth;

    get activeApp() {
        return getAppById(this._activeAppId);
    }

    get isVerticalNav() {
        return this.activeApp.navType === 'vertical';
    }

    get showVerticalNav() {
        return this.isVerticalNav;
    }

    get contentClasses() {
        let cls = 'cosmos-content';
        if (this.isVerticalNav) {
            cls += this._isNavCollapsed
                ? ' cosmos-content_nav-collapsed'
                : ' cosmos-content_nav-expanded';
        }
        return cls;
    }

    get panelOverlayClasses() {
        return `cosmos-panel-overlay${this.isPanelOpen ? ' cosmos-panel-overlay_open' : ''}`;
    }

    get componentCtor() {
        const name = this.route?.component;
        return name ? ROUTE_COMPONENTS[name] ?? null : null;
    }

    get currentNavPage() {
        const name = this.route?.component;
        return name ? (ROUTE_TO_NAV_PAGE[name] ?? 'home') : 'home';
    }

    get navItems() {
        return this.activeApp.contextBarItems;
    }

    get verticalNavItems() {
        return this.activeApp.navItems;
    }

    get allApps() {
        return apps;
    }

    get activeAppLabel() {
        return this.activeApp.label;
    }

    get activeAppId() {
        return this.activeApp.id;
    }

    get isAuthenticated() {
        return this._authChecked && this._authUser != null;
    }

    get isAuthChecked() {
        return this._authChecked;
    }

    renderedCallback() {
        this._measureHeader();
    }

    _measureHeader() {
        const shell = this.template.querySelector('shell-global-shell');
        if (!shell) return;
        const rect = shell.getBoundingClientRect();
        const top = `${rect.bottom + COSMOS_INSET}px`;
        if (this._lastHeaderTop !== top) {
            this._lastHeaderTop = top;
            this.template.host.style.setProperty('--cosmos-overlay-top', top);
        }
    }

    connectedCallback() {
        this._restorePreferences();
        const savedAppId = localStorage.getItem(ACTIVE_APP_STORAGE_KEY);
        if (savedAppId) {
            this._activeAppId = getAppById(savedAppId).id;
        }

        this._redirectPath = window.location.pathname || '/';

        if (isAuthDisabled()) {
            this._authChecked = true;
            this._authUser = { displayName: 'Local Prototype User' };
        } else {
            this._unsubscribeAuth = onAuthStateChanged((user) => {
                const wasUnauthenticated = this._authChecked && !this._authUser;
                this._authChecked = true;
                this._authUser = user;
                if (user && wasUnauthenticated) {
                    navigate(this._redirectPath);
                    this._redirectPath = '/';
                } else if (!user) {
                    this._redirectPath = window.location.pathname || '/';
                }
            });
        }

        this._unsubscribe = subscribe((route) => {
            this.route = route;
        });
    }

    _restorePreferences() {
        let saved = localStorage.getItem(STORAGE_KEY_THEME);

        if (!saved) {
            const legacyDark = localStorage.getItem('slds-ui-dark-mode');
            const legacyCosmos = localStorage.getItem('slds-ui-cosmos-theme');
            if (legacyCosmos === 'cosmos-light' || legacyCosmos === 'cosmos-dark') {
                saved = legacyCosmos;
            } else if (legacyDark === 'true') {
                saved = 'dark';
            }
            localStorage.removeItem('slds-ui-dark-mode');
            localStorage.removeItem('slds-ui-cosmos-theme');
            if (saved) localStorage.setItem(STORAGE_KEY_THEME, saved);
        }

        if (saved) {
            this._activeTheme = saved;
        }
        this._applyThemeClasses(this._activeTheme);
    }

    disconnectedCallback() {
        this._unsubscribe?.();
        this._unsubscribeAuth?.();
    }

    handleApplyTheme(event) {
        const theme = event.detail?.theme;
        if (!theme) return;
        this._activeTheme = theme;
        this._applyThemeClasses(theme);
        localStorage.setItem(STORAGE_KEY_THEME, theme);
    }

    _applyThemeClasses(theme) {
        const { classList } = document.body;
        classList.remove('slds-color-scheme_dark', 'cosmos-light', 'cosmos-dark');

        if (theme === 'dark') {
            classList.add('slds-color-scheme_dark');
        } else if (theme === 'cosmos-light') {
            classList.add('cosmos-light');
        } else if (theme === 'cosmos-dark') {
            classList.add('slds-color-scheme_dark', 'cosmos-dark');
        }
    }

    handleNavNavigate(event) {
        const { page, path } = event.detail ?? {};
        if (path) {
            navigate(path);
        } else if (page) {
            navigate(NAV_PAGE_TO_PATH[page] ?? '/');
        }
    }

    handleAppSwitch(event) {
        const appId = event.detail?.appId;
        if (appId) {
            this._activeAppId = getAppById(appId).id;
            localStorage.setItem(ACTIVE_APP_STORAGE_KEY, this._activeAppId);
        }
    }

    handlePanelSelect(event) {
        this.selectedPanel = event.detail?.name ?? this.selectedPanel;
        this.isPanelOpen = true;
    }

    handlePanelClose() {
        this.isPanelOpen = false;
    }

    handleNavCollapseToggle() {
        this._isNavCollapsed = !this._isNavCollapsed;
    }

    handleNavigateBack() {
        history.back();
    }
}
```

- [ ] **Step 3: Create cosmosApp.css**

Create `src/modules/shell/cosmosApp/cosmosApp.css`:

```css
/* src/modules/shell/cosmosApp/cosmosApp.css — Cosmos Shell (glass effect)
   Single source of truth for all cosmos shell chrome:
   - Fixed header positioning + glass
   - Fixed nav positioning + glass
   - Content padding to clear fixed overlays
   - Fixed panel overlay + glass
*/

:host {
    --cosmos-inset: 20px;
    --cosmos-overlay-top: 120px; /* measured dynamically in JS */
    --cosmos-nav-width-expanded: 15rem;
    --cosmos-nav-width-collapsed: 3rem;

    display: block;
    position: relative;
    height: 100vh;
    min-height: 100vh;
    overflow: hidden;
    background-color: transparent;
}

/* ── Fixed header ── */
.cosmos-shell-header {
    display: block;
    position: fixed;
    top: var(--cosmos-inset);
    left: var(--cosmos-inset);
    right: var(--cosmos-inset);
    z-index: 10;
    border-radius: 12px;
    backdrop-filter: blur(20px) saturate(1.8);
    -webkit-backdrop-filter: blur(20px) saturate(1.8);
}

/* ── Fixed vertical nav ── */
.cosmos-shell-nav {
    display: block;
    position: fixed;
    top: var(--cosmos-overlay-top);
    left: var(--cosmos-inset);
    bottom: var(--cosmos-inset);
    z-index: 8;
    border-radius: 12px;
    overflow: hidden;
    backdrop-filter: blur(20px) saturate(1.8);
    -webkit-backdrop-filter: blur(20px) saturate(1.8);
}

/* ── Content area: scrolls behind fixed overlays ── */
.cosmos-content {
    height: 100%;
    overflow: auto;
    padding-top: var(--cosmos-overlay-top);
    transition: padding-left 0.2s ease;
}

.cosmos-content_nav-expanded {
    padding-left: calc(var(--cosmos-nav-width-expanded) + var(--cosmos-inset) + var(--cosmos-inset));
}

.cosmos-content_nav-collapsed {
    padding-left: calc(var(--cosmos-nav-width-collapsed) + var(--cosmos-inset) + var(--cosmos-inset));
}

.cosmos-content__inner {
    padding: var(--slds-g-spacing-4, 1rem);
}

/* ── Fixed right panel ── */
.cosmos-panel-overlay {
    position: fixed;
    top: var(--cosmos-overlay-top);
    right: var(--cosmos-inset);
    bottom: var(--cosmos-inset);
    width: 25rem;
    z-index: 9;
    transform: translateX(calc(100% + var(--cosmos-inset)));
    transition: transform 0.25s ease;
    border-radius: 12px;
    overflow: hidden;
    backdrop-filter: blur(20px) saturate(1.8);
    -webkit-backdrop-filter: blur(20px) saturate(1.8);
}

.cosmos-panel-overlay_open {
    transform: translateX(0);
}

/* ── Dark theme: glass surfaces ── */

:host(.cosmos-dark) .cosmos-shell-header,
:host-context(body.cosmos-dark) .cosmos-shell-header {
    background: rgba(255, 255, 255, 0.04);
    border: none;
    position: relative;
}

:host(.cosmos-dark) .cosmos-shell-header::before,
:host-context(body.cosmos-dark) .cosmos-shell-header::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    padding: 2px;
    background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.20) 0%,
        rgba(255, 255, 255, 0.04) 30%,
        rgba(255, 255, 255, 0.04) 70%,
        rgba(255, 255, 255, 0.20) 100%
    );
    -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
}

:host(.cosmos-dark) .cosmos-shell-nav,
:host-context(body.cosmos-dark) .cosmos-shell-nav {
    background: rgba(255, 255, 255, 0.04);
    border: 2px solid rgba(255, 255, 255, 0.06);
}

:host(.cosmos-dark) .cosmos-panel-overlay,
:host-context(body.cosmos-dark) .cosmos-panel-overlay {
    background: rgba(255, 255, 255, 0.04);
    border: none;
    position: relative;
}

:host(.cosmos-dark) .cosmos-panel-overlay::before,
:host-context(body.cosmos-dark) .cosmos-panel-overlay::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    padding: 2px;
    background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.20) 0%,
        rgba(255, 255, 255, 0.04) 30%,
        rgba(255, 255, 255, 0.04) 70%,
        rgba(255, 255, 255, 0.20) 100%
    );
    -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
}

/* ── Light theme: glass surfaces ── */

:host(.cosmos-light) .cosmos-shell-header,
:host-context(body.cosmos-light) .cosmos-shell-header {
    background: rgba(255, 255, 255, 0.12);
    border: none;
    position: relative;
}

:host(.cosmos-light) .cosmos-shell-header::before,
:host-context(body.cosmos-light) .cosmos-shell-header::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    padding: 2px;
    background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.90) 0%,
        rgba(255, 255, 255, 0.10) 30%,
        rgba(255, 255, 255, 0.10) 70%,
        rgba(255, 255, 255, 0.90) 100%
    );
    -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
}

:host(.cosmos-light) .cosmos-shell-nav,
:host-context(body.cosmos-light) .cosmos-shell-nav {
    background: rgba(255, 255, 255, 0.12);
    border: 2px solid rgba(255, 255, 255, 0.14);
}

:host(.cosmos-light) .cosmos-panel-overlay,
:host-context(body.cosmos-light) .cosmos-panel-overlay {
    background: rgba(255, 255, 255, 0.22);
    border: none;
    position: relative;
}

:host(.cosmos-light) .cosmos-panel-overlay::before,
:host-context(body.cosmos-light) .cosmos-panel-overlay::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    padding: 2px;
    background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.90) 0%,
        rgba(255, 255, 255, 0.10) 30%,
        rgba(255, 255, 255, 0.10) 70%,
        rgba(255, 255, 255, 0.90) 100%
    );
    -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
}

/* ── Header icon/search overrides for Cosmos ── */

.cosmos-shell-header lightning-button-icon lightning-primitive-icon svg,
.cosmos-shell-header lightning-button-menu lightning-primitive-icon svg,
.cosmos-shell-header lightning-button-icon-stateful lightning-primitive-icon svg,
.cosmos-shell-header .slds-button__icon {
    width: 20px;
    height: 20px;
}

.cosmos-shell-header .slds-button__icon.slds-button__icon_x-small {
    width: 14px;
    height: 14px;
}

.cosmos-shell-header .customize-slds-button lightning-layout {
    gap: 4px;
}

.cosmos-shell-header .slds-global-header__item_search {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 30rem;
    max-width: 40%;
}

.cosmos-shell-header .slds-container_small.slds-container_center .slds-form-element,
.cosmos-shell-header .slds-container_small.slds-container_center .slds-input {
    border-radius: 50rem;
}

.cosmos-shell-header .slds-container_small.slds-container_center .slds-input__icon_left {
    left: 0.75rem;
}

.cosmos-shell-header .slds-container_small.slds-container_center .slds-input_search,
.cosmos-shell-header .slds-container_small.slds-container_center .slds-has-input-focus .slds-input {
    padding-left: 2.25rem;
}

.cosmos-shell-header lightning-avatar img,
.cosmos-shell-header .slds-avatar_circle,
.cosmos-shell-header .slds-avatar {
    border-radius: 8px;
    --slds-c-avatar-radius-border: 8px;
}

/* Make internal global-header and global-shell transparent — cosmos shell owns the glass */
.cosmos-shell-header .global-header,
.cosmos-shell-header .slds-global-header {
    background: transparent;
    border: none;
    border-bottom: none;
    box-shadow: none;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
}

.cosmos-shell-header .global-shell {
    background: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
    margin: 0;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
}

.cosmos-shell-header .global-shell::before {
    display: none;
}

/* Make internal vertical-nav transparent — cosmos shell owns the glass */
.cosmos-shell-nav .vertical-nav {
    background: transparent;
    border-right: none;
}
```

**Important note about `:host-context`:** Synthetic shadow DOM (which this project uses) supports `:host-context()`. If that causes issues, the fallback is to use the body class from JS to toggle a host attribute (e.g., `data-cosmos-theme="dark"`) and target `[data-cosmos-theme="dark"] .cosmos-shell-header` instead. Test this during Step 5 and adjust if needed.

- [ ] **Step 4: Verify the directory exists and files are saved**

```bash
ls -la src/modules/shell/cosmosApp/
```

Expected: `cosmosApp.html`, `cosmosApp.js`, `cosmosApp.css`

- [ ] **Step 5: Commit**

```bash
git add src/modules/shell/cosmosApp/
git commit -m "feat: create Cosmos app shell with glass effect layout"
```

---

## Task 6: Create separate HTML entry points and Vite multi-page config

Two independent HTML files: `index.html` (Standard Shell at `/`) and `cosmos.html` (Cosmos Shell at `/cosmos.html`). Each has its own JS bootstrap. Vite is configured as a multi-page app.

**Files:**
- Modify: `index.html` — clean up to Standard Shell entry (remove inline cosmos hacks)
- Create: `cosmos.html` — Cosmos Shell entry point
- Create: `src/cosmos-index.js` — Bootstrap script for Cosmos Shell
- Modify: `src/index.js` — Clean up, standard shell only
- Modify: `vite.config.js` — Add multi-page app configuration

- [ ] **Step 1: Clean up index.html as Standard Shell entry**

Replace the entire contents of `index.html` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
    <title>Salesforce</title>
    <link rel="icon" href="./images/salesforce.svg" type="image/svg+xml">
    <link rel="icon" href="./favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="./cosmos-theme.css">
</head>
<body>
    <div id="app"></div>
    <script type="module" src="./src/index.js"></script>
</body>
</html>
```

This removes: the `<style id="cosmos-light-overrides">` block and the inline `<script>` that created the floating dark/light toggle button. The `cosmos-theme.css` link stays because it provides ambient background and element-level glass that works with both shells.

- [ ] **Step 2: Clean up src/index.js — standard shell only**

The current `src/index.js` is already correct for standard shell — it mounts `shell-app`. Just verify it has no cosmos-specific logic. It should be:

```javascript
// MUST import synthetic shadow BEFORE any LWC imports
import '@lwc/synthetic-shadow';

import { createElement } from 'lwc';
import App from 'shell/app';
import { initSldsFromStorage } from './build/slds-loader.js';

await initSldsFromStorage();

try {
    const app = createElement('shell-app', {
        is: App
    });
    document.querySelector('#app').appendChild(app);
} catch (err) {
    console.error('[LWC bootstrap] Failed to mount app:', err);
} finally {
    document.getElementById('app')?.classList.add('is-ready');
}
```

- [ ] **Step 3: Create cosmos.html**

Create `cosmos.html` in the project root:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
    <title>Salesforce — Cosmos</title>
    <link rel="icon" href="./images/salesforce.svg" type="image/svg+xml">
    <link rel="icon" href="./favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="./cosmos-theme.css">
</head>
<body>
    <div id="app"></div>
    <script type="module" src="./src/cosmos-index.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create src/cosmos-index.js**

Create `src/cosmos-index.js`:

```javascript
// MUST import synthetic shadow BEFORE any LWC imports
import '@lwc/synthetic-shadow';

import { createElement } from 'lwc';
import CosmosApp from 'shell/cosmosApp';
import { initSldsFromStorage } from './build/slds-loader.js';

await initSldsFromStorage();

try {
    const app = createElement('shell-cosmos-app', {
        is: CosmosApp
    });
    document.querySelector('#app').appendChild(app);
} catch (err) {
    console.error('[LWC bootstrap] Failed to mount cosmos app:', err);
} finally {
    document.getElementById('app')?.classList.add('is-ready');
}
```

- [ ] **Step 5: Update vite.config.js for multi-page app**

In `vite.config.js`, add the `build.rollupOptions.input` field and update `appType`. Change:

```javascript
build: {
    outDir: 'dist',
},
```

to:

```javascript
build: {
    outDir: 'dist',
    rollupOptions: {
        input: {
            main: path.resolve(__dirname, 'index.html'),
            cosmos: path.resolve(__dirname, 'cosmos.html'),
        },
    },
},
```

And change `appType: 'spa'` to `appType: 'mpa'`.

Also add `cosmos.html` to the LWC plugin's exclude list so it's not processed by the LWC compiler:

```javascript
exclude: [
    path.resolve('./index.html'),
    path.resolve('./cosmos.html'),
    path.resolve('./src/build/generated'),
    // ...rest unchanged
],
```

**Important for SPA routing:** With `appType: 'mpa'`, Vite's dev server won't automatically serve `index.html` for unknown paths (SPA fallback). Add a custom middleware in the Vite config server section to handle this:

```javascript
server: {
    port: 3000,
    open: false,
},
```

Add after the `server` block, as a Vite plugin (append to the `plugins` array):

```javascript
{
    name: 'spa-fallback',
    configureServer(server) {
        server.middlewares.use((req, res, next) => {
            // If the request is for cosmos.html or its assets, let Vite handle it
            if (req.url.startsWith('/cosmos')) {
                if (req.url === '/cosmos' || req.url === '/cosmos/') {
                    req.url = '/cosmos.html';
                } else if (!req.url.includes('.') && req.url.startsWith('/cosmos/')) {
                    // SPA fallback for cosmos routes like /cosmos/settings
                    req.url = '/cosmos.html';
                }
            } else if (!req.url.includes('.') && req.url !== '/') {
                // SPA fallback for standard shell routes like /settings, /contacts
                req.url = '/index.html';
            }
            next();
        });
    },
},
```

- [ ] **Step 6: Verify both entry points work**

```bash
npm run dev
```

- Open `http://localhost:3000` — should load the Standard Shell
- Open `http://localhost:3000/cosmos.html` — should load the Cosmos Shell
- Navigate within each shell (click nav items) — routing should work
- Open both in separate tabs side-by-side for A/B comparison

- [ ] **Step 7: Commit**

```bash
git add index.html cosmos.html src/index.js src/cosmos-index.js vite.config.js
git commit -m "feat: add separate HTML entry points for standard and cosmos shells"
```

---

## Task 7: Integration testing and visual verification

Final verification pass across both shells and all theme combinations.

**Files:** None (testing only)

- [ ] **Step 1: Test Standard Shell at localhost:3000**

Test each theme via the theme switcher:

| Theme | Expected |
|-------|----------|
| Light | Default SLDS 2 light. Header at top, content below. No glass. |
| Dark | SLDS 2 dark tokens. Header at top, content below. No glass. |
| Cosmos Light | Ambient gradient background visible. Header transparent (not glass). Cards/buttons have glass. |
| Cosmos Dark | Dark ambient gradient. Header transparent. Cards/buttons have dark glass. |

For each theme, verify:
- Vertical nav renders as sidebar (not floating)
- Content scrolls within its region
- Panel opens/closes from right
- No double backgrounds or misalignment

- [ ] **Step 2: Test Cosmos Shell at localhost:3000/cosmos.html**

Test Cosmos Dark and Cosmos Light themes:

| Theme | Expected |
|-------|----------|
| Cosmos Dark | Header floats with 20px inset, glass effect, gradient border. Nav floats below header with 20px inset, aligned with header left edge. Content scrolls behind header with blur visible. Panel slides in from right with glass. |
| Cosmos Light | Same layout as dark but with light glass values. |

Verify:
- NO double glass (only one glass layer on header, coming from cosmosApp.css)
- Nav top aligns precisely with bottom of header + 20px gap
- Nav left edge aligns with header left edge (both at 20px)
- Content padding matches nav width + insets
- Scrolling content is visible through the glass header via backdrop-filter

- [ ] **Step 3: Test routing in both shells**

1. Navigate to `/` in standard shell — verify home page
2. Navigate to `/contacts` — verify contacts page
3. Navigate to `/cosmos.html` — verify cosmos home page
4. Navigate between pages in cosmos shell — verify routing works
5. Use browser back/forward — verify history works in both

- [ ] **Step 4: Test production build**

```bash
npm run build
npm run preview
```

Verify both entry points work in the production bundle.

- [ ] **Step 5: Commit any fixes discovered during testing**

If any visual issues are found, fix them and commit with descriptive messages.

---

## Summary of architecture after all tasks

```
index.html (Standard Shell — localhost:3000)
  └── src/index.js → mounts shell-app
        ├── shell-global-shell (plain wrapper, no glass)
        ├── shell-vertical-nav (flex child, no fixed positioning)
        ├── main.app-body (flex child, bounded scroll)
        └── shell-panel (SLDS docked panel)

cosmos.html (Cosmos Shell — localhost:3000/cosmos.html)
  └── src/cosmos-index.js → mounts shell-cosmos-app
        ├── shell-global-shell.cosmos-shell-header (fixed, glass)
        ├── shell-vertical-nav.cosmos-shell-nav (fixed, glass)
        ├── main.cosmos-content (full viewport, scrolls behind overlays)
        └── div.cosmos-panel-overlay (fixed, glass)

cosmos-theme.css → ambient background + element-level glass (cards, buttons, modals, inputs)
cosmosApp.css → shell chrome glass + positioning (header, nav, panel)
vite.config.js → multi-page app with both entry points
```

Both shells share: `globalShell`, `globalHeader`, `globalNavigation`, `verticalNav`, `panel`, `themeSwitcher`, `login`, all `page-*` components, `router.js`, `routes.config.js`, `apps.config.js`.
