# User Menu Popover — Design Spec

**Date:** 2026-03-30  
**Status:** Approved

---

## Overview

Replace the plain "Sign out" button in `shell/globalHeader` with a Salesforce-style user menu popover. Clicking the user avatar in the header reveals a dropdown panel with the signed-in user's info and a functional "Log Out" link. All other items in the panel are static.

---

## Architecture

### Data flow

```
shell/app (_authUser)
  → shell-global-shell (user prop)
    → shell-global-header (user prop)
      → shell-user-menu (user prop)
```

`shell/app` already holds `_authUser` (the Firebase User object). It passes this to `shell-global-shell`, which threads it through to `shell-global-header`, which passes it to the new `shell-user-menu` component.

### New component

`shell/userMenu` — self-contained dropdown. Owns its open/close state, renders the avatar trigger and the popover panel, calls `signOut()` directly.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `src/modules/shell/userMenu/userMenu.html` | Avatar trigger button + dropdown panel markup |
| Create | `src/modules/shell/userMenu/userMenu.js` | Toggle open/close, outside-click listener, signOut |
| Create | `src/modules/shell/userMenu/userMenu.css` | Dropdown positioning, section styles |
| Modify | `src/modules/shell/globalHeader/globalHeader.html` | Replace sign-out button with `<shell-user-menu>` |
| Modify | `src/modules/shell/globalHeader/globalHeader.js` | Add `@api user` prop, remove `signOut` import |
| Modify | `src/modules/shell/globalShell/globalShell.html` | Pass `user` to `shell-global-header` |
| Modify | `src/modules/shell/globalShell/globalShell.js` | Add `@api user` prop |
| Modify | `src/modules/shell/app/app.html` | Pass `_authUser` to `shell-global-shell` |

---

## Component: `shell/userMenu`

### Props

| Prop | Type | Description |
|---|---|---|
| `user` | Object | Firebase User — `displayName`, `email`, `photoURL` |

### State

| Field | Type | Default | Description |
|---|---|---|---|
| `_isOpen` | Boolean | `false` | Whether the popover is visible |

### Computed

| Getter | Returns |
|---|---|
| `avatarSrc` | `this.user?.photoURL \|\| ''` |
| `userName` | `this.user?.displayName \|\| 'User'` |
| `userEmail` | `this.user?.email \|\| ''` |
| `dropdownClass` | `'slds-dropdown slds-dropdown_right'` + ` slds-hide` when `!_isOpen` |

### Behavior

- **Toggle:** Clicking the avatar button calls `handleAvatarClick()` which flips `_isOpen`
- **Outside click:** `connectedCallback` attaches a `document` click listener; `disconnectedCallback` removes it. If a click event's target is not within the component's root element, `_isOpen = false`
- **Log Out:** Calls `signOut()` from `firebaseAuth.js`, wrapped in async try/catch with `console.error` on failure

### Popover structure (matching Salesforce mockup)

```
┌─────────────────────────────────┐
│ [avatar]  displayName           │
│           email                 │
│           Settings  Log Out     │
├─────────────────────────────────│
│ DISPLAY DENSITY                 │
│   ✓ Comfy                       │
│     Compact                     │
├─────────────────────────────────│
│ OPTIONS                         │
│   Switch to Salesforce Classic ⓘ│
│   Add Username                  │
└─────────────────────────────────┘
```

"Settings" and all Display Density / Options items are static (no click handlers, no navigation).  
"Log Out" is the only functional item.

---

## Styling

- Dropdown uses SLDS `slds-dropdown` and `slds-dropdown_right` classes for positioning
- Section headers use `slds-text-title_caps` 
- Dividers use `slds-has-divider_top-space`
- Visibility toggled by adding/removing `slds-hide` class via the `dropdownClass` getter
- Avatar trigger: `lightning-avatar` with `fallback-icon-name="standard:user"` for users without a `photoURL`
- Component-scoped CSS handles the dropdown container positioning (absolute, right-aligned) — does not bleed outside the component

---

## Out of Scope

- "Settings" link navigation
- Display Density toggle (Comfy/Compact) — purely cosmetic
- "Switch to Salesforce Classic" and "Add Username" — purely cosmetic
- Keyboard navigation / accessibility enhancements beyond what SLDS provides by default
