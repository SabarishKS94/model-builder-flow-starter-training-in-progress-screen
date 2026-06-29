# Vertical Nav & App Switcher — Design Spec

**Date:** 2026-03-30
**Status:** Approved

---

## Overview

Replace the Data 360 app's horizontal tab navigation with a vertical sidebar nav, while keeping the horizontal context bar active for dynamic tabs. Introduce an app-switching concept via the waffle icon so the prototype can host multiple apps (Data 360 and a Template app) with different shell layouts, driven by a single config file.

---

## Config Layer

A new `src/apps.config.js` is the single source of truth for all apps.

### App shape

```js
{
  id: 'data360',
  label: 'Data 360',
  isDefault: true,
  navType: 'vertical',       // 'vertical' | 'horizontal'
  contextBarItems: [         // tabs shown in the horizontal context bar
    { page: 'home', label: 'Home', path: '/' }
  ],
  navItems: [                // groups + children for vertical nav
    {
      id: 'connect-unify',
      label: 'Connect & Unify',
      icon: 'utility:connected_apps',
      children: [
        { id: 'cu-item-1', label: 'Item 1', page: 'home', path: '/' },
        { id: 'cu-item-2', label: 'Item 2', page: 'home', path: '/' },
      ]
    },
    {
      id: 'govern-secure',
      label: 'Govern & Secure',
      icon: 'utility:shield',
      children: [
        { id: 'gs-item-1', label: 'Item 1', page: 'home', path: '/' },
        { id: 'gs-item-2', label: 'Item 2', page: 'home', path: '/' },
      ]
    },
    {
      id: 'process-enrich',
      label: 'Process & Enrich',
      icon: 'utility:process',
      children: [
        { id: 'pe-item-1', label: 'Item 1', page: 'home', path: '/' },
        { id: 'pe-item-2', label: 'Item 2', page: 'home', path: '/' },
      ]
    },
    {
      id: 'explore-optimize',
      label: 'Explore & Optimize',
      icon: 'utility:search',
      children: [
        { id: 'eo-item-1', label: 'Item 1', page: 'home', path: '/' },
        { id: 'eo-item-2', label: 'Item 2', page: 'home', path: '/' },
      ]
    },
    {
      id: 'analyze-predict',
      label: 'Analyze & Predict',
      icon: 'utility:chart',
      children: [
        { id: 'ap-item-1', label: 'Item 1', page: 'home', path: '/' },
        { id: 'ap-item-2', label: 'Item 2', page: 'home', path: '/' },
      ]
    },
    {
      id: 'segment-act',
      label: 'Segment & Act',
      icon: 'utility:segments',
      children: [
        { id: 'sa-item-1', label: 'Item 1', page: 'home', path: '/' },
        { id: 'sa-item-2', label: 'Item 2', page: 'home', path: '/' },
      ]
    }
  ]
}
```

The Template app uses `navType: 'horizontal'` and carries the existing flat nav items. Its `navItems` field is the same flat array currently used by `globalNavigation`.

### Active app persistence

Active app id is stored in `localStorage` under the key `active-app`. On init, `shell/app` reads this value and falls back to the app with `isDefault: true`.

---

## App Switching

The waffle icon in `shell/globalNavigation` opens a dropdown listing all app labels from `apps.config.js`. Selecting an app:

1. Writes the new app id to `localStorage` (`active-app`)
2. Fires a `appswitch` custom event (bubbles, composed) with `detail: { appId }`
3. `shell/app` handles this event, updates its `activeApp` tracked state

The waffle dropdown uses the same `slds-dropdown` pattern already in `globalNavigation` — toggled on click, closed on outside click and Escape key. No page reload required.

---

## Shell Layout

`shell/globalShell` receives `active-app` as an `@api` prop. Based on the active app's `navType`:

**`navType: 'horizontal'`** (Template app): current layout unchanged — header stacked above context bar, no sidebar.

**`navType: 'vertical'`** (Data 360): layout becomes:
- Full-width header row
- Full-width context bar row (waffle + app name + tabs)
- Two-column row below: `shell/verticalNav` on the left, main content slot on the right

The context bar always renders for both nav types. The tab row is not suppressed — for Data 360, `contextBarItems` starts with just `[{ page: 'home', label: 'Home' }]`. Pages opened during a demo flow that are not in the vertical nav may be added dynamically to `contextBarItems` at runtime (future capability; the reactive `navItems` array in `shell/app` already supports this).

---

## Vertical Nav Component (`shell/verticalNav`)

### Props
- `@api navItems` — array of groups with children (from `apps.config.js`)
- `@api currentPage` — active page id for highlighting

### Internal state
- `expandedGroups` — set of group ids currently expanded (default: all expanded)
- `quickFindValue` — current filter string
- `isCollapsed` — sidebar collapsed to icon-only width (persisted in `localStorage` key: `vertical-nav-collapsed`)

### Structure
```
shell/verticalNav
├── Quick find input (filters groups/items by label)
├── lightning-vertical-navigation (handles selectedItem + select event)
│   └── for each group (filtered):
│       ├── Custom section header (label + chevron, onclick toggles expand)
│       └── if expanded:
│           └── lightning-vertical-navigation-item-icon (per child item)
└── Collapse toggle button (bottom)
```

### Behavior
- `lightning-vertical-navigation` manages active state via `selectedItem` (bound to `currentPage`) and fires a `select` event
- On `select`, `shell/verticalNav` dispatches a `navigate` custom event (same interface as `globalNavigation`) with `detail: { page }`
- Active page's parent group auto-expands on component load
- Quick find filters both group labels and child item labels; matching groups with no matching children are hidden
- Sidebar collapse persists across page loads via `localStorage`

---

## Migration Path

Active app state lives in `localStorage` today. To migrate to URL-based app switching later (e.g., `?app=data360`), only `shell/app`'s init and the `appswitch` handler need updating — the config structure and all shell components remain unchanged.

---

## Files Changed / Created

| File | Action |
|---|---|
| `src/apps.config.js` | Create — app definitions |
| `src/routes.config.js` | No change |
| `src/modules/shell/app/app.js` | Update — read active app, handle `appswitch` |
| `src/modules/shell/app/app.html` | Update — pass `active-app` to `globalShell` |
| `src/modules/shell/globalShell/globalShell.html` | Update — conditional vertical layout |
| `src/modules/shell/globalShell/globalShell.js` | Update — accept `active-app` prop |
| `src/modules/shell/globalNavigation/globalNavigation.html` | Update — waffle dropdown shows app list |
| `src/modules/shell/globalNavigation/globalNavigation.js` | Update — app switch logic |
| `src/modules/shell/verticalNav/verticalNav.html` | Create |
| `src/modules/shell/verticalNav/verticalNav.js` | Create |
| `src/modules/shell/verticalNav/verticalNav.css` | Create |
