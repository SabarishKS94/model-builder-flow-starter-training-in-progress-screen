# Vertical Nav & App Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Data 360's horizontal tab nav with a collapsible vertical sidebar nav, add app switching via the waffle icon, and drive both from a single `apps.config.js` config file.

**Architecture:** A new `src/apps.config.js` defines all apps (id, navType, contextBarItems, navItems). `shell/app` reads the active app from `localStorage` and passes it down to `shell/globalShell` → `shell/globalNavigation` (for waffle app switcher + context bar tabs) and renders `shell/verticalNav` alongside the content area when `navType === 'vertical'`. The `shell/verticalNav` component uses SLDS nav-vertical CSS classes directly (not the `lightning-vertical-navigation` base component) to support collapsible section headers with chevrons.

**Tech Stack:** LWC, SLDS utility classes, `lightning-icon`, `lightning-input`, `localStorage`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/apps.config.js` | Create | Single source of truth for all apps, nav groups, and nav items |
| `src/modules/shell/verticalNav/verticalNav.js` | Create | Collapsible sidebar nav logic: quick find, group expand/collapse, sidebar collapse |
| `src/modules/shell/verticalNav/verticalNav.html` | Create | Sidebar template: search, nav groups with chevrons, collapse button |
| `src/modules/shell/verticalNav/verticalNav.css` | Create | Sidebar sizing, transitions, group header styles |
| `src/modules/shell/globalNavigation/globalNavigation.js` | Modify | Add `@api apps`, change waffle to fire `appswitch` event |
| `src/modules/shell/globalNavigation/globalNavigation.html` | Modify | Waffle dropdown shows app list instead of nav items |
| `src/modules/shell/globalShell/globalShell.js` | Modify | Add `@api apps`, relay `appswitch` event |
| `src/modules/shell/globalShell/globalShell.html` | Modify | Pass `apps` to `globalNavigation`, listen for `appswitch` |
| `src/modules/shell/app/app.js` | Modify | Read active app from config+localStorage, handle `appswitch`, compute vertical nav state |
| `src/modules/shell/app/app.html` | Modify | Conditionally render `shell-vertical-nav` alongside content |

---

## Task 1: Create `src/apps.config.js`

**Files:**
- Create: `src/apps.config.js`

- [ ] **Step 1: Create the file**

```js
// src/apps.config.js
export const ACTIVE_APP_STORAGE_KEY = 'active-app';

export const apps = [
    {
        id: 'data360',
        label: 'Data 360',
        isDefault: true,
        navType: 'vertical',
        contextBarItems: [
            { page: 'home', label: 'Home', path: '/' },
        ],
        navItems: [
            {
                id: 'connect-unify',
                label: 'Connect & Unify',
                icon: 'utility:connected_apps',
                children: [
                    { id: 'cu-item-1', label: 'Item 1', path: '/' },
                    { id: 'cu-item-2', label: 'Item 2', path: '/' },
                    { id: 'cu-item-3', label: 'Item 3', path: '/' },
                ],
            },
            {
                id: 'govern-secure',
                label: 'Govern & Secure',
                icon: 'utility:shield',
                children: [
                    { id: 'gs-item-1', label: 'Item 1', path: '/' },
                    { id: 'gs-item-2', label: 'Item 2', path: '/' },
                    { id: 'gs-item-3', label: 'Item 3', path: '/' },
                ],
            },
            {
                id: 'process-enrich',
                label: 'Process & Enrich',
                icon: 'utility:process',
                children: [
                    { id: 'pe-item-1', label: 'Item 1', path: '/' },
                    { id: 'pe-item-2', label: 'Item 2', path: '/' },
                    { id: 'pe-item-3', label: 'Item 3', path: '/' },
                ],
            },
            {
                id: 'explore-optimize',
                label: 'Explore & Optimize',
                icon: 'utility:search',
                children: [
                    { id: 'eo-item-1', label: 'Item 1', path: '/' },
                    { id: 'eo-item-2', label: 'Item 2', path: '/' },
                    { id: 'eo-item-3', label: 'Item 3', path: '/' },
                ],
            },
            {
                id: 'analyze-predict',
                label: 'Analyze & Predict',
                icon: 'utility:chart',
                children: [
                    { id: 'ap-item-1', label: 'Item 1', path: '/' },
                    { id: 'ap-item-2', label: 'Item 2', path: '/' },
                    { id: 'ap-item-3', label: 'Item 3', path: '/' },
                ],
            },
            {
                id: 'segment-act',
                label: 'Segment & Act',
                icon: 'utility:segments',
                children: [
                    { id: 'sa-item-1', label: 'Item 1', path: '/' },
                    { id: 'sa-item-2', label: 'Item 2', path: '/' },
                    { id: 'sa-item-3', label: 'Item 3', path: '/' },
                ],
            },
        ],
    },
    {
        id: 'template',
        label: 'Template App',
        isDefault: false,
        navType: 'horizontal',
        contextBarItems: [
            { page: 'home', label: 'Home', path: '/' },
            { page: 'icons', label: 'Icons', path: '/icons' },
            { page: 'settings', label: 'Settings', path: '/settings' },
            { page: 'churn-rate-segment', label: 'Churn Rate Segment', path: '/churn-rate-segment' },
            { page: 'user', label: 'User', path: '/users/42' },
            { page: 'contacts', label: 'Contacts', path: '/contacts' },
        ],
        navItems: [],
    },
];

export function getDefaultApp() {
    return apps.find((a) => a.isDefault) ?? apps[0];
}

export function getAppById(id) {
    return apps.find((a) => a.id === id) ?? getDefaultApp();
}
```

- [ ] **Step 2: Verify the file parses**

Run: `node -e "import('./src/apps.config.js').then(m => console.log(m.apps.map(a=>a.id)))"`
Expected output: `[ 'data360', 'template' ]`

- [ ] **Step 3: Commit**

```bash
git add src/apps.config.js
git commit -m "feat: add apps.config.js with data360 and template app definitions"
```

---

## Task 2: Create `shell/verticalNav`

**Files:**
- Create: `src/modules/shell/verticalNav/verticalNav.js`
- Create: `src/modules/shell/verticalNav/verticalNav.html`
- Create: `src/modules/shell/verticalNav/verticalNav.css`

- [ ] **Step 1: Create `verticalNav.js`**

```js
// src/modules/shell/verticalNav/verticalNav.js
import { LightningElement, api, track } from 'lwc';

const STORAGE_KEY = 'vertical-nav-collapsed';

export default class VerticalNav extends LightningElement {
    @api currentPage = '';
    @api navItems = [];

    @track quickFindValue = '';
    @track _expandedGroups = {};
    @track isCollapsed = false;

    connectedCallback() {
        this.isCollapsed = localStorage.getItem(STORAGE_KEY) === 'true';
        this._initExpandedGroups();
    }

    _initExpandedGroups() {
        const expanded = {};
        (this.navItems || []).forEach((group) => {
            expanded[group.id] = true;
        });
        this._expandedGroups = expanded;
    }

    get filteredGroups() {
        const query = (this.quickFindValue || '').toLowerCase().trim();
        return (this.navItems || []).reduce((acc, group) => {
            const filteredChildren = query
                ? group.children.filter((item) =>
                      item.label.toLowerCase().includes(query)
                  )
                : [...group.children];

            const isGroupVisible =
                !query ||
                group.label.toLowerCase().includes(query) ||
                filteredChildren.length > 0;

            if (!isGroupVisible) return acc;

            const isExpanded = !!this._expandedGroups[group.id];
            acc.push({
                ...group,
                isExpanded,
                chevronIcon: isExpanded ? 'utility:chevrondown' : 'utility:chevronright',
                filteredChildren: filteredChildren.map((item) => ({ ...item })),
            });
            return acc;
        }, []);
    }

    get navClass() {
        return this.isCollapsed ? 'vertical-nav vertical-nav_collapsed' : 'vertical-nav';
    }

    get collapseIcon() {
        return this.isCollapsed ? 'utility:right' : 'utility:left';
    }

    get collapseLabel() {
        return this.isCollapsed ? 'Expand' : 'Collapse';
    }

    handleQuickFindChange(event) {
        this.quickFindValue = event.target.value;
    }

    handleGroupToggle(event) {
        const groupId = event.currentTarget.dataset.groupId;
        this._expandedGroups = {
            ...this._expandedGroups,
            [groupId]: !this._expandedGroups[groupId],
        };
    }

    handleItemClick(event) {
        event.preventDefault();
        const path = event.currentTarget.dataset.path;
        this.dispatchEvent(
            new CustomEvent('navigate', {
                detail: { path },
                bubbles: true,
                composed: true,
            })
        );
    }

    handleCollapseToggle() {
        this.isCollapsed = !this.isCollapsed;
        localStorage.setItem(STORAGE_KEY, String(this.isCollapsed));
    }
}
```

- [ ] **Step 2: Create `verticalNav.html`**

```html
<!-- src/modules/shell/verticalNav/verticalNav.html -->
<template>
    <nav class={navClass} aria-label="App navigation">
        <div class="vertical-nav__search">
            <lightning-input
                type="search"
                label="Quick find"
                variant="label-hidden"
                placeholder="Quick find"
                value={quickFindValue}
                onchange={handleQuickFindChange}>
            </lightning-input>
        </div>

        <div class="vertical-nav__body">
            <template for:each={filteredGroups} for:item="group">
                <div key={group.id} class="slds-nav-vertical__section">
                    <button
                        class="slds-button slds-button_reset vertical-nav__group-header"
                        onclick={handleGroupToggle}
                        data-group-id={group.id}
                        aria-expanded={group.isExpanded}>
                        <lightning-icon
                            icon-name={group.icon}
                            size="x-small"
                            class="slds-m-right_x-small">
                        </lightning-icon>
                        <span class="slds-truncate vertical-nav__group-label">{group.label}</span>
                        <lightning-icon
                            icon-name={group.chevronIcon}
                            size="xx-small"
                            class="vertical-nav__chevron">
                        </lightning-icon>
                    </button>

                    <template if:true={group.isExpanded}>
                        <ul class="slds-nav-vertical__items">
                            <template for:each={group.filteredChildren} for:item="item">
                                <li key={item.id} class="slds-nav-vertical__item">
                                    <a
                                        href={item.path}
                                        class="slds-nav-vertical__action"
                                        data-path={item.path}
                                        onclick={handleItemClick}>
                                        <span class="slds-truncate">{item.label}</span>
                                    </a>
                                </li>
                            </template>
                        </ul>
                    </template>
                </div>
            </template>
        </div>

        <div class="vertical-nav__footer">
            <button
                class="slds-button slds-button_reset vertical-nav__collapse-btn"
                onclick={handleCollapseToggle}
                title={collapseLabel}>
                <lightning-icon icon-name={collapseIcon} size="x-small"></lightning-icon>
                <template if:false={isCollapsed}>
                    <span class="slds-m-left_x-small">Collapse</span>
                </template>
            </button>
        </div>
    </nav>
</template>
```

- [ ] **Step 3: Create `verticalNav.css`**

```css
/* src/modules/shell/verticalNav/verticalNav.css */
:host {
    display: block;
    overflow: hidden;
    flex-shrink: 0;
    border-right: 1px solid var(--slds-g-color-border-1, #c9c9c9);
}

.vertical-nav {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 15rem;
    transition: width 0.2s ease;
    background-color: var(--slds-g-color-surface-1, #ffffff);
    overflow: hidden;
}

.vertical-nav_collapsed {
    width: 3rem;
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
    font-size: var(--slds-g-font-size-3, 0.75rem);
    font-weight: var(--slds-g-font-weight-6, 600);
    text-transform: uppercase;
    letter-spacing: 0.0625rem;
    color: var(--slds-g-color-on-surface-2, #444);
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

- [ ] **Step 4: Verify dev server starts without errors**

Run: `npm run dev`
Expected: Server starts, no compile errors in terminal.

- [ ] **Step 5: Commit**

```bash
git add src/modules/shell/verticalNav/
git commit -m "feat: add shell/verticalNav component with collapsible groups and quick find"
```

---

## Task 3: Update `shell/globalNavigation` for app switching

**Files:**
- Modify: `src/modules/shell/globalNavigation/globalNavigation.js`
- Modify: `src/modules/shell/globalNavigation/globalNavigation.html`

- [ ] **Step 1: Replace `globalNavigation.js`**

```js
// src/modules/shell/globalNavigation/globalNavigation.js
import { LightningElement, api, track } from 'lwc';

export default class GlobalNavigation extends LightningElement {
    @api currentPage = 'home';
    @api navItems = [];
    @api apps = [];
    @track isWaffleMenuOpen = false;

    get waffleDropdownTriggerClass() {
        const base =
            'slds-context-bar__item slds-context-bar__dropdown-trigger slds-dropdown-trigger slds-dropdown-trigger_click slds-no-hover';
        return this.isWaffleMenuOpen ? `${base} slds-is-open` : base;
    }

    get navItemsWithActive() {
        return (this.navItems || []).map((item) => {
            const isActive = item.page === this.currentPage;
            const base = 'slds-context-bar__item';
            return {
                ...item,
                isActive,
                tabClass: isActive ? `${base} slds-is-active` : base,
            };
        });
    }

    handleNavItemClick(event) {
        event.preventDefault();
        const page = event.currentTarget.dataset.page;
        this.dispatchEvent(
            new CustomEvent('navigate', {
                detail: { page },
                bubbles: true,
                composed: true,
            })
        );
    }

    handleWaffleOpen() {
        const wasOpen = this.isWaffleMenuOpen;
        this.isWaffleMenuOpen = !this.isWaffleMenuOpen;
        if (!wasOpen && this.isWaffleMenuOpen) {
            this._focusMenuOnNextRender = true;
        }
    }

    handleWaffleMenuItemClick(event) {
        event.preventDefault();
        this.isWaffleMenuOpen = false;
        const appId = event.currentTarget.dataset.value;
        this.dispatchEvent(
            new CustomEvent('appswitch', {
                detail: { appId },
                bubbles: true,
                composed: true,
            })
        );
    }

    handleWaffleMenuKeydown(event) {
        const menu = this.template.querySelector('.slds-dropdown');
        if (!menu || !menu.contains(event.target)) return;

        const key = event.key;
        if (key === 'Escape') {
            event.preventDefault();
            this.isWaffleMenuOpen = false;
            setTimeout(() => this._focusWaffle(), 0);
            return;
        }
        if (key === 'Tab') {
            this.isWaffleMenuOpen = false;
            return;
        }
        if (key === 'ArrowDown' || key === 'ArrowUp') {
            event.preventDefault();
            const items = Array.from(
                this.template.querySelectorAll('[role="menuitem"]')
            );
            const currentIndex = items.indexOf(event.target);
            if (currentIndex === -1) return;
            let nextIndex;
            if (key === 'ArrowDown') {
                nextIndex =
                    currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            } else {
                nextIndex =
                    currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            }
            items[nextIndex].focus();
        }
    }

    _focusWaffle() {
        const waffleIcon = this.template.querySelector(
            '.slds-context-bar__icon-action lightning-dynamic-icon'
        );
        if (waffleIcon && typeof waffleIcon.focus === 'function') {
            waffleIcon.focus();
        }
    }

    connectedCallback() {
        this._boundHandleDocumentClick =
            this._handleDocumentClick.bind(this);
    }

    disconnectedCallback() {
        document.removeEventListener('click', this._boundHandleDocumentClick);
    }

    renderedCallback() {
        if (this.isWaffleMenuOpen) {
            document.addEventListener('click', this._boundHandleDocumentClick);
            if (this._focusMenuOnNextRender) {
                this._focusMenuOnNextRender = false;
                this._focusFirstMenuItem();
            }
        } else {
            document.removeEventListener(
                'click',
                this._boundHandleDocumentClick
            );
        }
    }

    _focusFirstMenuItem() {
        const first = this.template.querySelector('[role="menuitem"]');
        if (first) {
            setTimeout(() => first.focus(), 0);
        }
    }

    _handleDocumentClick(event) {
        const trigger = this.template.querySelector(
            '[class*="slds-dropdown-trigger"]'
        );
        const path = event.composedPath ? event.composedPath() : [];
        const clickInsideTrigger = trigger && path.includes(trigger);
        if (trigger && !clickInsideTrigger) {
            this.isWaffleMenuOpen = false;
        }
    }
}
```

- [ ] **Step 2: Replace `globalNavigation.html`**

```html
<!-- src/modules/shell/globalNavigation/globalNavigation.html -->
<template>
    <div class="slds-context-bar">
        <div class="slds-context-bar__primary">
            <div
                class={waffleDropdownTriggerClass}
                role="presentation">
                <div class="slds-context-bar__icon-action">
                    <lightning-dynamic-icon
                        type="waffle"
                        alternative-text="App Launcher"
                        onclick={handleWaffleOpen}>
                    </lightning-dynamic-icon>
                </div>
                <div
                    class="slds-dropdown slds-dropdown_left"
                    role="menu"
                    aria-label="App Launcher"
                    if:true={isWaffleMenuOpen}
                    onkeydown={handleWaffleMenuKeydown}>
                    <ul class="slds-dropdown__list" role="group">
                        <template for:each={apps} for:item="app">
                            <li key={app.id} class="slds-dropdown__item" role="presentation">
                                <a
                                    href="javascript:void(0)"
                                    role="menuitem"
                                    tabindex="-1"
                                    data-value={app.id}
                                    onclick={handleWaffleMenuItemClick}>
                                    {app.label}
                                </a>
                            </li>
                        </template>
                    </ul>
                </div>
                <span class="slds-context-bar__label-action slds-context-bar__app-name">
                    <span class="slds-truncate" title="Data 360">Data 360</span>
                </span>
            </div>
        </div>
        <nav class="slds-context-bar__secondary" role="navigation" aria-label="App navigation">
            <ul class="slds-grid slds-container_fluid">
                <template for:each={navItemsWithActive} for:item="item">
                    <li key={item.page} class={item.tabClass}>
                        <a
                            href={item.path}
                            class="slds-context-bar__label-action"
                            title={item.label}
                            data-page={item.page}
                            onclick={handleNavItemClick}>
                            <span class="slds-assistive-text" if:true={item.isActive}>Current Page:</span>
                            <span class="slds-truncate" title={item.label}>{item.label}</span>
                        </a>
                    </li>
                </template>
            </ul>
        </nav>
    </div>
</template>
```

- [ ] **Step 3: Verify dev server starts without errors**

Run: `npm run dev`
Expected: No compile errors. App loads. Waffle icon still clickable (dropdown will be empty until Task 5 wires up apps).

- [ ] **Step 4: Commit**

```bash
git add src/modules/shell/globalNavigation/
git commit -m "feat: update globalNavigation waffle to show app list and fire appswitch event"
```

---

## Task 4: Update `shell/globalShell` to pass `apps` and relay `appswitch`

**Files:**
- Modify: `src/modules/shell/globalShell/globalShell.js`
- Modify: `src/modules/shell/globalShell/globalShell.html`

- [ ] **Step 1: Replace `globalShell.js`**

```js
// src/modules/shell/globalShell/globalShell.js
import { LightningElement, api } from 'lwc';

export default class GlobalShell extends LightningElement {
    @api currentPage = 'home';
    @api navItems = [];
    @api apps = [];

    handleNavigate(event) {
        event.stopPropagation();
        this.dispatchEvent(
            new CustomEvent('navigate', {
                detail: event.detail,
                bubbles: true,
                composed: true,
            })
        );
    }

    handleAppSwitch(event) {
        event.stopPropagation();
        this.dispatchEvent(
            new CustomEvent('appswitch', {
                detail: event.detail,
                bubbles: true,
                composed: true,
            })
        );
    }

    handlePanelSelect(event) {
        this.dispatchEvent(
            new CustomEvent('panelselect', {
                detail: event.detail,
                bubbles: true,
                composed: true,
            })
        );
    }
}
```

- [ ] **Step 2: Replace `globalShell.html`**

```html
<!-- src/modules/shell/globalShell/globalShell.html -->
<template>
    <lightning-layout class="global-shell" multiple-rows>
        <lightning-layout-item size="12" padding="none">
            <shell-global-header onpanelselect={handlePanelSelect}></shell-global-header>
        </lightning-layout-item>
        <lightning-layout-item size="12" padding="none">
            <shell-global-navigation
                current-page={currentPage}
                nav-items={navItems}
                apps={apps}
                onnavigate={handleNavigate}
                onappswitch={handleAppSwitch}>
            </shell-global-navigation>
        </lightning-layout-item>
    </lightning-layout>
</template>
```

- [ ] **Step 3: Verify dev server starts without errors**

Run: `npm run dev`
Expected: No compile errors.

- [ ] **Step 4: Commit**

```bash
git add src/modules/shell/globalShell/
git commit -m "feat: update globalShell to pass apps prop and relay appswitch event"
```

---

## Task 5: Update `shell/app` to wire everything together

**Files:**
- Modify: `src/modules/shell/app/app.js`
- Modify: `src/modules/shell/app/app.html`

- [ ] **Step 1: Replace `app.js`**

```js
// src/modules/shell/app/app.js
import { LightningElement, track } from 'lwc';
import _devAnnotatorToolbar from 'dev/annotatorToolbar';
import { subscribe, navigate } from '../../../router';
import { routes } from '../../../routes.config';
import { apps, getDefaultApp, getAppById, ACTIVE_APP_STORAGE_KEY } from '../../../apps.config';
import { toggleSLDS, activeSLDSVersion } from '../../../build/slds-loader';
import Home from 'page/home';
import IconTest from 'page/iconTest';
import Settings from 'page/settings';
import ChurnRateSegment from 'page/churnRateSegment';
import User from 'page/user';
import Contacts from 'page/contacts';
import ContactDetail from 'page/contactDetail';

const ROUTE_COMPONENTS = {
    'page-home': Home,
    'page-icon-test': IconTest,
    'page-settings': Settings,
    'page-churn-rate-segment': ChurnRateSegment,
    'page-user': User,
    'page-contacts': Contacts,
    'page-contact-detail': ContactDetail,
};

const ROUTE_TO_NAV_PAGE = Object.fromEntries(
    routes
        .filter((r) => r.navPage || r.navHighlight)
        .map((r) => [r.component, r.navPage ?? r.navHighlight])
);

const NAV_PAGE_TO_PATH = Object.fromEntries(
    routes.filter((r) => r.navPage).map((r) => [r.navPage, r.navPath ?? r.path])
);

const STORAGE_KEY_SLDS_VERSION = 'slds-ui-slds-version';
const STORAGE_KEY_DARK_MODE = 'slds-ui-dark-mode';

export default class App extends LightningElement {
    @track route;
    @track _sldsVersion = 2;
    @track _darkMode = false;
    @track selectedPanel = 'agentforce_panel';
    @track isPanelOpen = false;
    @track _activeAppId = getDefaultApp().id;

    get activeApp() {
        return getAppById(this._activeAppId);
    }

    get isVerticalNav() {
        return this.activeApp.navType === 'vertical';
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

    connectedCallback() {
        this._restorePreferences();
        this._sldsVersion = activeSLDSVersion();
        const savedAppId = localStorage.getItem(ACTIVE_APP_STORAGE_KEY);
        if (savedAppId) {
            this._activeAppId = getAppById(savedAppId).id;
        }
        this.unsubscribe = subscribe((route) => {
            this.route = route;
        });
    }

    _restorePreferences() {
        const savedVersion = localStorage.getItem(STORAGE_KEY_SLDS_VERSION);
        const savedDarkMode = localStorage.getItem(STORAGE_KEY_DARK_MODE);
        const version = savedVersion === '1' ? 1 : 2;
        if (savedDarkMode === 'true' && version === 2) {
            this._darkMode = true;
            document.body.classList.add('slds-color-scheme_dark');
        } else if (savedDarkMode === 'false') {
            this._darkMode = false;
            document.body.classList.remove('slds-color-scheme_dark');
        }
    }

    disconnectedCallback() {
        this.unsubscribe?.();
    }

    async handleToggleSLDS() {
        await toggleSLDS();
        this._sldsVersion = activeSLDSVersion();
        localStorage.setItem(STORAGE_KEY_SLDS_VERSION, String(this._sldsVersion));
        if (this._sldsVersion !== 2 && this._darkMode) {
            this._darkMode = false;
            document.body.classList.remove('slds-color-scheme_dark');
            localStorage.setItem(STORAGE_KEY_DARK_MODE, 'false');
        }
    }

    handleToggleDarkMode() {
        this._darkMode = !this._darkMode;
        document.body.classList.toggle('slds-color-scheme_dark', this._darkMode);
        localStorage.setItem(STORAGE_KEY_DARK_MODE, String(this._darkMode));
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

    get panelClasses() {
        return `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-right ${
            this.isPanelOpen ? 'slds-is-open' : ''
        }`;
    }

    handleNavigateBack() {
        history.back();
    }
}
```

- [ ] **Step 2: Replace `app.html`**

```html
<!-- src/modules/shell/app/app.html -->
<template>
    <!-- Global shell: top, edge to edge, height by content -->
    <shell-global-shell
        current-page={currentNavPage}
        nav-items={navItems}
        apps={allApps}
        onnavigate={handleNavNavigate}
        onappswitch={handleAppSwitch}
        onpanelselect={handlePanelSelect}>
    </shell-global-shell>

    <!-- Main content and docked panel -->
    <main class="app-body">
        <lightning-layout vertical-align="stretch" class="utility-full-height">
            <!-- Vertical nav sidebar (Data 360 app only) -->
            <lightning-layout-item if:true={isVerticalNav} class="app-body__sidebar">
                <shell-vertical-nav
                    nav-items={verticalNavItems}
                    current-page={currentNavPage}
                    onnavigate={handleNavNavigate}>
                </shell-vertical-nav>
            </lightning-layout-item>

            <!-- Main content -->
            <lightning-layout-item flexibility="auto" class="app-body__content-cell">
                <div class="app-body__scroll-wrapper">
                    <div class="app-main">
                        <div class="app-main__inner">
                            <!-- Router outlet -->
                            <template lwc:if={componentCtor}>
                                <lwc:component lwc:is={componentCtor} onnavigateback={handleNavigateBack}></lwc:component>
                            </template>
                        </div>
                        <shell-theme-switcher
                            slds-version={_sldsVersion}
                            dark-mode={_darkMode}
                            ontoggleslds={handleToggleSLDS}
                            ontoggledarkmode={handleToggleDarkMode}>
                        </shell-theme-switcher>
                    </div>
                </div>
            </lightning-layout-item>

            <!-- Docked panel -->
            <lightning-layout-item class={panelClasses}>
                <shell-panel selected-panel={selectedPanel} onpanelclose={handlePanelClose}></shell-panel>
            </lightning-layout-item>
        </lightning-layout>
    </main>
    <dev-annotator-toolbar></dev-annotator-toolbar>
</template>
```

- [ ] **Step 3: Add sidebar cell style to `app.css`**

Open `src/modules/shell/app/app.css` and add at the end:

```css
/* Sidebar cell for vertical nav — sizes to content (nav controls its own width) */
.app-body__sidebar {
    min-width: 0;
    flex-shrink: 0;
}
```

- [ ] **Step 4: Verify in browser**

Run: `npm run dev` and open `http://localhost:3000`

Check:
1. Vertical sidebar appears on the left with 6 nav groups (Connect & Unify, Govern & Secure, etc.)
2. Each group expands/collapses on click
3. Quick find input filters groups and items
4. Collapse button shrinks the sidebar to icon-only width
5. Waffle icon opens dropdown with "Data 360" and "Template App"
6. Clicking "Template App" switches to horizontal tab nav (all original tabs appear)
7. Clicking "Data 360" switches back to vertical sidebar
8. Refreshing the page preserves the last selected app and sidebar collapse state

- [ ] **Step 5: Commit**

```bash
git add src/modules/shell/app/app.js src/modules/shell/app/app.html src/modules/shell/app/app.css
git commit -m "feat: wire up active app state, vertical nav, and app switcher in shell/app"
```
