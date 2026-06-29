# Firebase Google Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate the entire Vite + LWC app behind Firebase Google sign-in, restricting access to `@salesforce.com` accounts only, with redirect-after-login support.

**Architecture:** A plain JS `data/firebaseAuth.js` service module initializes Firebase and wraps auth operations. `shell/app` subscribes to auth state changes and renders either a `shell/login` component or the existing route content. Sign-out lives in `shell/globalHeader` and calls the auth service directly — `onAuthStateChanged` drives all state updates.

**Tech Stack:** Firebase JS SDK v10+ (modular), LWC, Vite (`import.meta.env` for credentials)

---

## Prerequisites (manual steps before coding)

Complete these in the Firebase console before starting:

1. Open your Firebase project → **Authentication** → **Sign-in method**
2. Enable **Google** as a provider
3. Under **Authentication** → **Settings** → **Authorized domains**, confirm `localhost` is listed (it is by default)
4. Open **Project settings** (gear icon) → **Your apps** → add a Web app if you haven't already
5. Copy the Firebase config object — you'll need: `apiKey`, `authDomain`, `projectId`, `appId`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `src/data/firebaseConfig.js` | Reads `import.meta.env` vars, exports config object |
| Create | `src/data/firebaseAuth.js` | Firebase init, `onAuthStateChanged`, `signInWithGoogle`, `signOut` |
| Create | `src/modules/shell/login/login.html` | Full-viewport centered login UI |
| Create | `src/modules/shell/login/login.js` | Calls `signInWithGoogle`, handles domain error |
| Create | `src/modules/shell/login/login.css` | Full-viewport centering styles |
| Create | `.env.example` | Placeholder env vars — committed to git |
| Modify | `src/modules/shell/app/app.js` | Add auth state tracking and redirect logic |
| Modify | `src/modules/shell/app/app.html` | Conditionally render login or route content |
| Modify | `src/modules/shell/globalHeader/globalHeader.html` | Add sign-out button |
| Modify | `src/modules/shell/globalHeader/globalHeader.js` | Call `signOut` on click |

`.env` is already in `.gitignore` — no change needed.

---

## Task 1: Install Firebase and create environment config

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Create: `src/data/firebaseConfig.js`

- [ ] **Step 1: Install the Firebase SDK**

```bash
npm install firebase
```

Expected: `firebase` appears in `package.json` dependencies, `node_modules/firebase` exists.

- [ ] **Step 2: Create `.env.example`**

Create `.env.example` at the project root:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

- [ ] **Step 3: Create your local `.env` with real values**

Copy `.env.example` to `.env` and fill in values from the Firebase console:

```
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

- [ ] **Step 4: Create `src/data/firebaseConfig.js`**

```js
export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
```

- [ ] **Step 5: Verify Vite can read the env vars**

Run the dev server and open the browser console:

```bash
npm run dev
```

In the browser console, run:
```js
import('/src/data/firebaseConfig.js').then(m => console.log(m.firebaseConfig))
```

Expected: Object with your real values (not `undefined`). If any value is `undefined`, check that your `.env` file is at the project root and keys are prefixed with `VITE_`.

- [ ] **Step 6: Commit**

```bash
git add src/data/firebaseConfig.js .env.example package.json package-lock.json
git commit -m "feat: install firebase and add env config"
```

---

## Task 2: Create Firebase Auth service module

**Files:**
- Create: `src/data/firebaseAuth.js`

- [ ] **Step 1: Create `src/data/firebaseAuth.js`**

```js
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ hd: 'salesforce.com' });

/**
 * Subscribe to auth state changes.
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function onAuthStateChanged(callback) {
    return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * Open Google sign-in popup. Throws if the signed-in email is not @salesforce.com.
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function signInWithGoogle() {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    if (!user.email.endsWith('@salesforce.com')) {
        await firebaseSignOut(auth);
        throw new Error('Only @salesforce.com accounts are permitted.');
    }
    return user;
}

/**
 * Sign the current user out.
 * @returns {Promise<void>}
 */
export function signOut() {
    return firebaseSignOut(auth);
}
```

- [ ] **Step 2: Verify the module loads without errors**

Start the dev server (`npm run dev`) and open the browser console. Run:

```js
import('/src/data/firebaseAuth.js').then(() => console.log('auth module OK'))
```

Expected: `auth module OK` with no errors. A Firebase connection error about missing app configuration means your `.env` values are wrong — double-check them.

- [ ] **Step 3: Commit**

```bash
git add src/data/firebaseAuth.js
git commit -m "feat: add firebase auth service module"
```

---

## Task 3: Create login component

**Files:**
- Create: `src/modules/shell/login/login.html`
- Create: `src/modules/shell/login/login.js`
- Create: `src/modules/shell/login/login.css`

- [ ] **Step 1: Create `src/modules/shell/login/login.css`**

```css
.login-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
}
```

- [ ] **Step 2: Create `src/modules/shell/login/login.html`**

```html
<template>
    <div class="login-container">
        <h1 class="slds-text-heading_large">Sign in to continue</h1>
        <template lwc:if={errorMessage}>
            <p class="slds-text-color_error">{errorMessage}</p>
        </template>
        <lightning-button
            label="Sign in with Google"
            variant="brand"
            disabled={isLoading}
            onclick={handleSignIn}>
        </lightning-button>
    </div>
</template>
```

- [ ] **Step 3: Create `src/modules/shell/login/login.js`**

```js
import { LightningElement, track } from 'lwc';
import { signInWithGoogle } from '../../../data/firebaseAuth.js';

export default class Login extends LightningElement {
    @track errorMessage = '';
    @track isLoading = false;

    async handleSignIn() {
        this.isLoading = true;
        this.errorMessage = '';
        try {
            await signInWithGoogle();
            // onAuthStateChanged in shell/app drives the transition — nothing more needed here
        } catch (err) {
            this.errorMessage = err.message ?? 'Sign-in failed. Please try again.';
        } finally {
            this.isLoading = false;
        }
    }
}
```

- [ ] **Step 4: Verify the component renders**

The login component is not yet wired into the app. To preview it quickly, temporarily add `<shell-login></shell-login>` to `src/modules/shell/app/app.html` at the top (before the existing content), run `npm run dev`, and confirm:

- A centered "Sign in to continue" heading and "Sign in with Google" button appear
- Clicking the button opens a Google sign-in popup (or shows a Firebase error if domains aren't configured yet — that's fine at this stage)

Remove the temporary `<shell-login>` line after verifying.

- [ ] **Step 5: Commit**

```bash
git add src/modules/shell/login/
git commit -m "feat: add shell/login component"
```

---

## Task 4: Gate the app with auth state in shell/app

**Files:**
- Modify: `src/modules/shell/app/app.js`
- Modify: `src/modules/shell/app/app.html`

- [ ] **Step 1: Update `src/modules/shell/app/app.js`**

Replace the full file with:

```js
import { LightningElement, track } from 'lwc';
import _devAnnotatorToolbar from 'dev/annotatorToolbar';
import { subscribe, navigate } from '../../../router';
import { routes } from '../../../routes.config';
import { toggleSLDS, activeSLDSVersion } from '../../../build/slds-loader';
import { onAuthStateChanged } from '../../../data/firebaseAuth.js';
import Home from 'page/home';
import IconTest from 'page/iconTest';
import Settings from 'page/settings';
import ChurnRateSegment from 'page/churnRateSegment';
import User from 'page/user';
import Contacts from 'page/contacts';
import ContactDetail from 'page/contactDetail';

/** Option A: explicit registration – add one import + one entry here when adding a route */
const ROUTE_COMPONENTS = {
    'page-home': Home,
    'page-icon-test': IconTest,
    'page-settings': Settings,
    'page-churn-rate-segment': ChurnRateSegment,
    'page-user': User,
    'page-contacts': Contacts,
    'page-contact-detail': ContactDetail,
};

/** Derived from routes.config: component name → nav page id (includes navHighlight for child routes) */
const ROUTE_TO_NAV_PAGE = Object.fromEntries(
    routes.filter((r) => r.navPage || r.navHighlight).map((r) => [r.component, r.navPage ?? r.navHighlight])
);

/** Derived from routes.config: nav page id → path for navigate() */
const NAV_PAGE_TO_PATH = Object.fromEntries(
    routes.filter((r) => r.navPage).map((r) => [r.navPage, r.navPath ?? r.path])
);

/** Nav items for global navigation (tabs + waffle). From routes with navPage. */
const NAV_ITEMS = routes
    .filter((r) => r.navPage)
    .map((r) => ({ page: r.navPage, label: r.navLabel, path: r.navPath ?? r.path }));

const STORAGE_KEY_SLDS_VERSION = 'slds-ui-slds-version';
const STORAGE_KEY_DARK_MODE = 'slds-ui-dark-mode';

export default class App extends LightningElement {
    @track route;
    @track _sldsVersion = 2;
    @track _darkMode = false;
    @track selectedPanel = 'agentforce_panel';
    @track isPanelOpen = false;
    @track _authUser = null;
    @track _authChecked = false;

    _redirectPath = '/';
    _unsubscribeAuth;

    get componentCtor() {
        const name = this.route?.component;
        return name ? ROUTE_COMPONENTS[name] ?? null : null;
    }

    get currentNavPage() {
        const name = this.route?.component;
        return name ? (ROUTE_TO_NAV_PAGE[name] ?? 'home') : 'home';
    }

    get navItems() {
        return NAV_ITEMS;
    }

    get isAuthenticated() {
        return this._authChecked && this._authUser != null;
    }

    get isAuthChecked() {
        return this._authChecked;
    }

    connectedCallback() {
        this._restorePreferences();
        this._sldsVersion = activeSLDSVersion();

        // Capture the URL the user wants to visit before auth check
        this._redirectPath = window.location.pathname || '/';

        this._unsubscribeAuth = onAuthStateChanged((user) => {
            // wasUnauthenticated is true only after we already confirmed no user was logged in
            const wasUnauthenticated = this._authChecked && !this._authUser;
            this._authChecked = true;
            this._authUser = user;
            if (user && wasUnauthenticated) {
                // User just signed in from the login screen — go to their intended destination
                navigate(this._redirectPath);
                this._redirectPath = '/';
            } else if (!user) {
                // Capture current path so we can return here after sign-in
                this._redirectPath = window.location.pathname || '/';
            }
        });

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
        this._unsubscribeAuth?.();
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
        const page = event.detail?.page;
        const path = page ? NAV_PAGE_TO_PATH[page] : '/';
        navigate(path);
    }

    handlePanelSelect(event) {
        this.selectedPanel = event.detail?.name ?? this.selectedPanel;
        this.isPanelOpen = true;
    }

    handlePanelClose() {
        this.isPanelOpen = false;
    }

    get panelClasses() {
        return `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-right ${this.isPanelOpen ? 'slds-is-open' : ''}`;
    }

    handleNavigateBack() {
        history.back();
    }
}
```

- [ ] **Step 2: Update `src/modules/shell/app/app.html`**

Replace the full file with:

```html
<template>
    <!-- Auth check in progress: render nothing to avoid flash -->
    <template lwc:if={isAuthenticated}>
        <!-- Global shell: top, edge to edge, height by content -->
        <shell-global-shell current-page={currentNavPage} nav-items={navItems} onnavigate={handleNavNavigate} onpanelselect={handlePanelSelect}>
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

- [ ] **Step 3: Register the Login component in app.js**

The `shell/login` component is used in the template but does not need to be in `ROUTE_COMPONENTS` — LWC resolves it by tag name automatically since it lives in `src/modules/shell/login/`. No extra import is needed in app.js.

- [ ] **Step 4: Verify the auth gate**

Run `npm run dev`. Expected behavior:

1. Open `http://localhost:3000` in an incognito window (ensures no cached Firebase session)
2. You should see a blank screen for ~1 second (Firebase resolving auth), then the login screen
3. Click "Sign in with Google", complete sign-in with a `@salesforce.com` account
4. You should land on the home page (`/`)
5. Reload the page — you should go directly to home (Firebase restores session from storage)
6. Try navigating to `http://localhost:3000/contacts` without being signed in: should show login screen

- [ ] **Step 5: Commit**

```bash
git add src/modules/shell/app/app.js src/modules/shell/app/app.html
git commit -m "feat: gate app behind firebase auth with redirect-after-login"
```

---

## Task 5: Add sign-out to global header

**Files:**
- Modify: `src/modules/shell/globalHeader/globalHeader.html`
- Modify: `src/modules/shell/globalHeader/globalHeader.js`

- [ ] **Step 1: Update `src/modules/shell/globalHeader/globalHeader.html`**

Add a sign-out button as the last item in the right-side layout group, replacing the avatar `lightning-layout-item`:

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
                    <lightning-avatar
                        src="https://v1.lightningdesignsystem.com/assets/images/avatar2.jpg"></lightning-avatar>
                </lightning-layout-item>
                <lightning-layout-item class="slds-p-left_small">
                    <lightning-button
                        label="Sign out"
                        variant="base"
                        onclick={handleSignOut}>
                    </lightning-button>
                </lightning-layout-item>
            </lightning-layout>
        </lightning-layout-item>
    </lightning-layout>
</template>
```

- [ ] **Step 2: Update `src/modules/shell/globalHeader/globalHeader.js`**

```js
import { LightningElement } from 'lwc';
import { signOut } from '../../../data/firebaseAuth.js';

export default class GlobalHeader extends LightningElement {
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

    handleSignOut() {
        signOut();
        // onAuthStateChanged in shell/app fires with null and shows the login screen automatically
    }
}
```

- [ ] **Step 3: Verify sign-out works**

With `npm run dev` running and signed in:

1. Click "Sign out" in the header
2. Expected: login screen appears immediately
3. Reload the page — login screen should still appear (session is cleared)
4. Sign back in — should land on home page

- [ ] **Step 4: Commit**

```bash
git add src/modules/shell/globalHeader/globalHeader.html src/modules/shell/globalHeader/globalHeader.js
git commit -m "feat: add sign-out button to global header"
```

---

## Task 6: End-to-end verification

No new files. Manual verification of all scenarios.

- [ ] **Scenario 1: Unauthenticated direct URL access**
  1. Sign out (or open incognito)
  2. Navigate directly to `http://localhost:3000/contacts`
  3. Expected: login screen shown, URL stays at `/contacts`
  4. Sign in with a `@salesforce.com` account
  5. Expected: redirected to `/contacts`

- [ ] **Scenario 2: Non-Salesforce account rejected**
  1. Sign out
  2. Click "Sign in with Google"
  3. Sign in with a non-`@salesforce.com` Google account (e.g. personal Gmail)
  4. Expected: error message "Only @salesforce.com accounts are permitted." on the login screen, user remains signed out

- [ ] **Scenario 3: Session persistence**
  1. Sign in with a `@salesforce.com` account
  2. Close the browser tab completely
  3. Reopen `http://localhost:3000`
  4. Expected: home page loads directly (no login screen)

- [ ] **Scenario 4: Home fallback**
  1. Sign out
  2. Navigate directly to `http://localhost:3000` (home)
  3. Sign in
  4. Expected: home page (not a redirect loop)

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat: complete firebase google auth integration"
```
