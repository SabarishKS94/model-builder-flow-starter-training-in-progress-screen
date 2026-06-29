# User Menu Popover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain "Sign out" button in the global header with a Salesforce-style user avatar that opens a popover panel showing user info and a functional Log Out link.

**Architecture:** A new `shell/userMenu` LWC component owns the avatar trigger, popover visibility state, and sign-out logic. The Firebase `user` object (`displayName`, `email`, `photoURL`) is threaded from `shell/app` → `shell-global-shell` → `shell-global-header` → `shell-user-menu` via `@api` props.

**Tech Stack:** LWC, SLDS utility classes, Firebase Auth (`signOut`)

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `src/modules/shell/userMenu/userMenu.html` | Avatar trigger button + dropdown panel markup |
| Create | `src/modules/shell/userMenu/userMenu.js` | Toggle open/close, outside-click listener, signOut |
| Create | `src/modules/shell/userMenu/userMenu.css` | Dropdown positioning, trigger layout |
| Modify | `src/modules/shell/globalHeader/globalHeader.html` | Replace sign-out `lightning-button` + static `lightning-avatar` with `<shell-user-menu>` |
| Modify | `src/modules/shell/globalHeader/globalHeader.js` | Add `@api user`, remove `signOut` import and `handleSignOut` |
| Modify | `src/modules/shell/globalShell/globalShell.html` | Pass `user` to `shell-global-header` |
| Modify | `src/modules/shell/globalShell/globalShell.js` | Add `@api user` |
| Modify | `src/modules/shell/app/app.html` | Pass `_authUser` to `shell-global-shell` |

---

## Task 1: Create `shell/userMenu` component

**Files:**
- Create: `src/modules/shell/userMenu/userMenu.css`
- Create: `src/modules/shell/userMenu/userMenu.html`
- Create: `src/modules/shell/userMenu/userMenu.js`

- [ ] **Step 1: Create `src/modules/shell/userMenu/userMenu.css`**

```css
.user-menu-trigger {
    position: relative;
    display: inline-block;
}

.user-menu-dropdown {
    position: absolute;
    right: 0;
    top: 100%;
    z-index: 9000;
    min-width: 20rem;
    background: var(--sds-g-color-neutral-base-100, #fff);
    border: 1px solid var(--sds-g-color-border-base-1, #dddbda);
    border-radius: 0.25rem;
    box-shadow: 0 2px 3px 0 rgba(0,0,0,.16);
}

.user-menu-dropdown.slds-hide {
    display: none;
}

.user-info-section {
    padding: 0.75rem 1rem;
}

.user-name {
    font-weight: 700;
}

.user-email {
    color: var(--sds-g-color-neutral-base-50, #706e6b);
    font-size: 0.75rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 16rem;
}

.user-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.25rem;
    font-size: 0.8125rem;
}

.user-action-link {
    color: var(--sds-g-color-brand-base-40, #0176d3);
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    font-size: inherit;
}

.user-action-link:hover {
    text-decoration: underline;
}

.density-section,
.options-section {
    padding: 0.5rem 1rem 0.75rem;
}

.section-header {
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.0625rem;
    text-transform: uppercase;
    color: var(--sds-g-color-neutral-base-50, #706e6b);
    padding: 0.5rem 0 0.25rem;
}

.density-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.2rem 0;
    font-size: 0.8125rem;
}

.options-link {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.2rem 0;
    font-size: 0.8125rem;
    color: var(--sds-g-color-brand-base-40, #0176d3);
    cursor: default;
}
```

- [ ] **Step 2: Create `src/modules/shell/userMenu/userMenu.html`**

```html
<template>
    <div class="user-menu-trigger">
        <button class="slds-button" onclick={handleAvatarClick} aria-haspopup="true" aria-expanded={_isOpen}>
            <lightning-avatar
                src={avatarSrc}
                fallback-icon-name="standard:user"
                alternative-text={userName}
                size="small">
            </lightning-avatar>
        </button>

        <div class={dropdownClass}>
            <!-- User info -->
            <div class="user-info-section">
                <div class="user-name slds-truncate">{userName}</div>
                <div class="user-email">{userEmail}</div>
                <div class="user-actions">
                    <span class="user-action-link">Settings</span>
                    <button class="user-action-link" onclick={handleSignOut}>Log Out</button>
                </div>
            </div>

            <!-- Display Density -->
            <div class="density-section slds-has-divider_top-space">
                <div class="section-header">Display Density</div>
                <div class="density-option">
                    <lightning-icon icon-name="utility:check" size="xx-small" alternative-text="Selected"></lightning-icon>
                    <span>Comfy</span>
                </div>
                <div class="density-option slds-p-left_medium">
                    <span>Compact</span>
                </div>
            </div>

            <!-- Options -->
            <div class="options-section slds-has-divider_top-space">
                <div class="section-header">Options</div>
                <div class="options-link">
                    <span>Switch to Salesforce Classic</span>
                    <lightning-icon icon-name="utility:info" size="xx-small" alternative-text="Info"></lightning-icon>
                </div>
                <div class="options-link">
                    <span>Add Username</span>
                </div>
            </div>
        </div>
    </div>
</template>
```

- [ ] **Step 3: Create `src/modules/shell/userMenu/userMenu.js`**

```js
import { LightningElement, api, track } from 'lwc';
import { signOut } from '../../../data/firebaseAuth.js';

export default class UserMenu extends LightningElement {
    @api user;
    @track _isOpen = false;

    _handleOutsideClick = (event) => {
        const trigger = this.template.querySelector('.user-menu-trigger');
        if (trigger && !trigger.contains(event.target)) {
            this._isOpen = false;
        }
    };

    connectedCallback() {
        document.addEventListener('click', this._handleOutsideClick);
    }

    disconnectedCallback() {
        document.removeEventListener('click', this._handleOutsideClick);
    }

    get avatarSrc() {
        return this.user?.photoURL || '';
    }

    get userName() {
        return this.user?.displayName || 'User';
    }

    get userEmail() {
        return this.user?.email || '';
    }

    get dropdownClass() {
        return `user-menu-dropdown${this._isOpen ? '' : ' slds-hide'}`;
    }

    handleAvatarClick(event) {
        event.stopPropagation();
        this._isOpen = !this._isOpen;
    }

    async handleSignOut() {
        this._isOpen = false;
        try {
            await signOut();
        } catch (err) {
            console.error('Sign-out failed:', err);
        }
    }
}
```

- [ ] **Step 4: Verify the files exist**

```bash
ls /Users/dvora/Code/data360-vibe-foundation/.worktrees/feature/firebase-google-auth/src/modules/shell/userMenu/
```

Expected: `userMenu.html  userMenu.js  userMenu.css`

- [ ] **Step 5: Commit**

```bash
cd /Users/dvora/Code/data360-vibe-foundation/.worktrees/feature/firebase-google-auth
git add src/modules/shell/userMenu/
git commit -m "feat: add shell/userMenu popover component"
```

---

## Task 2: Thread `user` prop through `shell-global-shell` and `shell-global-header`

**Files:**
- Modify: `src/modules/shell/globalShell/globalShell.js`
- Modify: `src/modules/shell/globalShell/globalShell.html`
- Modify: `src/modules/shell/globalHeader/globalHeader.js`
- Modify: `src/modules/shell/globalHeader/globalHeader.html`

- [ ] **Step 1: Update `src/modules/shell/globalShell/globalShell.js`**

Replace the full file with:

```js
import { LightningElement, api } from 'lwc';

export default class GlobalShell extends LightningElement {
    @api currentPage = 'home';
    @api navItems = [];
    @api user;

    handleNavigate(event) {
        event.stopPropagation();
        this.dispatchEvent(
            new CustomEvent('navigate', {
                detail: event.detail,
                bubbles: true,
                composed: true
            })
        );
    }

    handlePanelSelect(event) {
        this.dispatchEvent(
            new CustomEvent('panelselect', {
                detail: event.detail,
                bubbles: true,
                composed: true
            })
        );
    }
}
```

- [ ] **Step 2: Update `src/modules/shell/globalShell/globalShell.html`**

Replace the full file with:

```html
<template>
    <lightning-layout class="global-shell" multiple-rows>
        <lightning-layout-item size="12" padding="none">
            <shell-global-header user={user} onpanelselect={handlePanelSelect}></shell-global-header>
        </lightning-layout-item>
        <lightning-layout-item size="12" padding="none">
            <shell-global-navigation current-page={currentPage} nav-items={navItems} onnavigate={handleNavigate}></shell-global-navigation>
        </lightning-layout-item>
    </lightning-layout>
</template>
```

- [ ] **Step 3: Update `src/modules/shell/globalHeader/globalHeader.js`**

Replace the full file with:

```js
import { LightningElement, api } from 'lwc';

export default class GlobalHeader extends LightningElement {
    @api user;

    handleAgentforceClick() {
        this.dispatchEvent(new CustomEvent('panelselect', {
            detail: { name: 'agentforce_panel' },
            bubbles: true,
            composed: true
        }));
    }

    handleTrailheadClick() {
        this.dispatchEvent(new CustomEvent('panelselect', {
            detail: { name: 'trailhead_panel' },
            bubbles: true,
            composed: true
        }));
    }

    handleSettingsClick() {
        this.dispatchEvent(new CustomEvent('panelselect', {
            detail: { name: 'settings_panel' },
            bubbles: true,
            composed: true
        }));
    }

    handleNotificationClick() {
        this.dispatchEvent(new CustomEvent('panelselect', {
            detail: { name: 'notification_panel' },
            bubbles: true,
            composed: true
        }));
    }
}
```

- [ ] **Step 4: Update `src/modules/shell/globalHeader/globalHeader.html`**

Replace the full file. The key changes: remove the static `lightning-avatar` and the `lightning-button` sign-out item; replace both with a single `shell-user-menu` item that receives `user={user}`:

```html
<template>
    <lightning-layout class="slds-global-header global-header" horizontal-align="spread" vertical-align="center">
        <lightning-layout-item class="slds-global-header__item">
            <lightning-icon icon-name="utility:salesforce1" alternative-text="Salesforce" size="large"></lightning-icon>
            <span class="slds-assistive-text">Salesforce</span>
        </lightning-layout-item>
        <lightning-layout-item class="slds-global-header__item slds-global-header__item_search" flexibility="auto">
            <lightning-input type="search" label="Search" placeholder="Search..." variant="label-hidden"
                class="slds-container_small slds-container_center"></lightning-input>
        </lightning-layout-item>
        <lightning-layout-item class="slds-global-header__item customize-slds-button">
            <lightning-layout vertical-align="center">
                <lightning-layout-item>
                    <lightning-button-group>
                        <lightning-button-icon-stateful icon-name="utility:favorite" alternative-text="Toggle Favorites"
                            size="small">
                        </lightning-button-icon-stateful>
                        <lightning-button-menu alternative-text="View Favorites" icon-size="small">
                            <lightning-menu-item label="Menu Item One" value="item1"></lightning-menu-item>
                        </lightning-button-menu>
                    </lightning-button-group>
                </lightning-layout-item>
                <lightning-layout-item>
                    <lightning-button-icon icon-name="utility:agent_astro" aria-haspopup="true" title="Agentforce"
                        variant="container" onclick={handleAgentforceClick}>
                    </lightning-button-icon>
                </lightning-layout-item>
                <lightning-layout-item>
                    <lightning-button-menu icon-name="utility:new" title="Global Actions" variant="container"
                        nubbin="true" menu-alignment="right">
                        <lightning-menu-item label="Menu Item One" value="item1"></lightning-menu-item>
                    </lightning-button-menu>
                </lightning-layout-item>
                <lightning-layout-item>
                    <lightning-button-icon icon-name="utility:trailhead_alt" aria-haspopup="true"
                        title="Guidance Center" variant="container" onclick={handleTrailheadClick}>
                    </lightning-button-icon>
                </lightning-layout-item>
                <lightning-layout-item>
                    <lightning-button-menu icon-name="utility:help" title="Salesforce Help" variant="container"
                        nubbin="true" menu-alignment="right">
                        <lightning-menu-item label="Menu Item One" value="item1"></lightning-menu-item>
                    </lightning-button-menu>
                </lightning-layout-item>
                <lightning-layout-item>
                    <lightning-button-icon icon-name="utility:settings" aria-haspopup="true" title="Setup"
                        variant="container" onclick={handleSettingsClick}>
                    </lightning-button-icon>
                </lightning-layout-item>
                <lightning-layout-item>
                    <lightning-button-icon icon-name="utility:notification" aria-haspopup="true" title="Notifications"
                        variant="container" onclick={handleNotificationClick}>
                    </lightning-button-icon>
                </lightning-layout-item>
                <lightning-layout-item class="slds-p-left_small">
                    <shell-user-menu user={user}></shell-user-menu>
                </lightning-layout-item>
            </lightning-layout>
        </lightning-layout-item>
    </lightning-layout>
</template>
```

- [ ] **Step 5: Commit**

```bash
cd /Users/dvora/Code/data360-vibe-foundation/.worktrees/feature/firebase-google-auth
git add src/modules/shell/globalShell/globalShell.js \
        src/modules/shell/globalShell/globalShell.html \
        src/modules/shell/globalHeader/globalHeader.js \
        src/modules/shell/globalHeader/globalHeader.html
git commit -m "feat: thread user prop through globalShell and globalHeader to userMenu"
```

---

## Task 3: Pass `_authUser` from `shell/app` to `shell-global-shell`

**Files:**
- Modify: `src/modules/shell/app/app.html`

- [ ] **Step 1: Update `src/modules/shell/app/app.html`**

Add `user={_authUser}` to the `shell-global-shell` tag. Replace the full file with:

```html
<template>
    <!-- Auth check in progress: render nothing to avoid flash -->
    <template lwc:if={isAuthenticated}>
        <!-- Global shell: top, edge to edge, height by content -->
        <shell-global-shell current-page={currentNavPage} nav-items={navItems} user={_authUser} onnavigate={handleNavNavigate} onpanelselect={handlePanelSelect}>
        </shell-global-shell>

        <!-- Main content and docked panel -->
        <main class="app-body">
            <lightning-layout vertical-align="stretch" class="utility-full-height">
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
                <lightning-layout-item class={panelClasses}>
                    <shell-panel selected-panel={selectedPanel} onpanelclose={handlePanelClose}></shell-panel>
                </lightning-layout-item>
            </lightning-layout>
        </main>
        <dev-annotator-toolbar></dev-annotator-toolbar>
    </template>
    <template lwc:elseif={isAuthChecked}>
        <!-- Auth check complete, no user — show login screen -->
        <shell-login></shell-login>
    </template>
    <!-- isAuthChecked=false: blank while Firebase resolves auth state from storage -->
</template>
```

- [ ] **Step 2: Verify the dev server compiles without errors**

```bash
cd /Users/dvora/Code/data360-vibe-foundation/.worktrees/feature/firebase-google-auth && npm run dev
```

Expected: Dev server starts at `http://localhost:3000` with no build errors in the terminal. Open the app and confirm:
1. The avatar appears in the top-right header area
2. Clicking it opens the popover panel
3. The popover shows the signed-in user's name and email
4. Clicking "Log Out" signs out and shows the login screen
5. Clicking outside the popover closes it

- [ ] **Step 3: Commit**

```bash
cd /Users/dvora/Code/data360-vibe-foundation/.worktrees/feature/firebase-google-auth
git add src/modules/shell/app/app.html
git commit -m "feat: pass auth user to global shell for user menu"
```
