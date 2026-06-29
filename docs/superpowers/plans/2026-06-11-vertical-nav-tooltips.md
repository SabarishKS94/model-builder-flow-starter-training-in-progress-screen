# Vertical Nav Tooltips Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hover tooltips to vertical nav category groups (always) and to Quick Find, Quick Start Library, and Expand buttons (collapsed state only), and expand the nav on any item click when collapsed.

**Architecture:** Add `description` fields to `apps.config.js` nav groups. Render `slds-popover slds-popover_tooltip slds-nubbin_left` elements inside each button, shown via CSS `:hover` only. Collapsed-only tooltips use `if:true={isCollapsed}`. Click-to-expand is handled in JS by checking `this.isCollapsed` at the top of `handleGroupToggle`, `handleItemClick`, and the footer link click.

**Tech Stack:** LWC, SLDS 2 Popover/Tooltip blueprint, CSS `:hover`, no new dependencies.

---

### Task 1: Add description fields to apps.config.js nav groups

**Files:**
- Modify: `src/apps.config.js`

- [ ] **Step 1: Add `description` to each navItems group**

In `src/apps.config.js`, add a `description` property to each of the six navItems groups in the `data360` app:

```js
{ id: 'connect-unify', label: 'Connect & Unify', icon: 'utility:data_mapping',
  description: 'Connect or ingest data. Then, transform, harmonize, and unify it.',
  children: [...] },
{ id: 'govern-secure', label: 'Govern & Secure', icon: 'utility:shield',
  description: 'Define access, security, and governance for your Data 360 data.',
  children: [...] },
{ id: 'process-enrich', label: 'Process & Enrich', icon: 'utility:process',
  description: 'Intelligently identify, analyze, and categorize data for use with AI.',
  children: [...] },
{ id: 'explore-optimize', label: 'Explore & Optimize', icon: 'utility:table',
  description: 'View, query, and optimize data across large datasets.',
  children: [...] },
{ id: 'analyze-predict', label: 'Analyze & Predict', icon: 'utility:chart',
  description: 'Explore your data and build predictive AI models.',
  children: [...] },
{ id: 'segment-act', label: 'Segment & Act', icon: 'utility:segments',
  description: 'Segment your data. Take action on data and share it externally.',
  children: [...] },
```

- [ ] **Step 2: Verify the description flows through filteredGroups**

In `verticalNav.js`, `filteredGroups` uses spread (`...group`) so `description` will be included automatically. No JS change needed — verify by reading the `filteredGroups` getter and confirming it spreads the group object.

- [ ] **Step 3: Commit**

```bash
git add src/apps.config.js
git commit -m "feat: add description field to vertical nav groups for tooltips"
```

---

### Task 2: Add tooltip markup to nav group headers

**Files:**
- Modify: `src/modules/shell/verticalNav/verticalNav.html`

- [ ] **Step 1: Add tooltip element inside the group header button**

In `verticalNav.html`, inside the `<button class={group.headerClass} ...>` element, add the tooltip after the chevron icon. The full button contents become:

```html
<button
    class={group.headerClass}
    onclick={handleGroupToggle}
    data-group-id={group.id}
    aria-expanded={group.isExpanded}>
    <lightning-icon
        icon-name={group.icon}
        size="x-small">
    </lightning-icon>
    <span class="slds-truncate slds-grow slds-text-align_left vertical-nav__group-label">{group.label}</span>
    <lightning-icon
        icon-name={group.chevronIcon}
        size="xx-small"
        class="vertical-nav__chevron">
    </lightning-icon>
    <template if:true={group.description}>
        <div class="slds-popover slds-popover_tooltip slds-nubbin_left vertical-nav__tooltip" role="tooltip">
            <div class="slds-popover__body">{group.description}</div>
        </div>
    </template>
</button>
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/shell/verticalNav/verticalNav.html
git commit -m "feat: add tooltip markup to nav group header buttons"
```

---

### Task 3: Add tooltip markup for collapsed-only footer buttons

**Files:**
- Modify: `src/modules/shell/verticalNav/verticalNav.html`

- [ ] **Step 1: Add tooltip to Quick Find search icon button**

The search icon button is already only rendered when `isCollapsed` is true. Add a tooltip inside it:

```html
<button
    class="slds-button slds-button_reset slds-grid slds-align-items-center slds-align_absolute-center vertical-nav__search-icon"
    title={labels.QuickFind}
    onclick={handleCollapsedSearchClick}>
    <lightning-icon icon-name="utility:search" size="x-small"></lightning-icon>
    <div class="slds-popover slds-popover_tooltip slds-nubbin_left vertical-nav__tooltip" role="tooltip">
        <div class="slds-popover__body">{labels.QuickFind}</div>
    </div>
</button>
```

- [ ] **Step 2: Add tooltip to Quick Start Library footer link**

The footer link label span is already conditionally hidden when collapsed. Add a collapsed-only tooltip:

```html
<a
    href="/"
    class={quickStartLinkClass}
    onclick={handleItemClick}
    data-path="/">
    <lightning-icon icon-name="utility:light_bulb" size="x-small"></lightning-icon>
    <template if:false={isCollapsed}>
        <span class="slds-truncate">{labels.QuickStartLibrary}</span>
    </template>
    <template if:true={isCollapsed}>
        <div class="slds-popover slds-popover_tooltip slds-nubbin_left vertical-nav__tooltip" role="tooltip">
            <div class="slds-popover__body">{labels.QuickStartLibrary}</div>
        </div>
    </template>
</a>
```

- [ ] **Step 3: Add tooltip to Collapse/Expand button**

The label span is already conditionally hidden when collapsed. Add a collapsed-only tooltip:

```html
<button
    class="slds-button slds-button_reset slds-grid slds-align-items-center slds-p-vertical_x-small slds-p-horizontal_small vertical-nav__collapse-btn"
    onclick={handleCollapseToggle}
    title={collapseLabel}>
    <lightning-icon icon-name={collapseIcon} size="x-small"></lightning-icon>
    <template if:false={isCollapsed}>
        <span>{labels.Collapse}</span>
    </template>
    <template if:true={isCollapsed}>
        <div class="slds-popover slds-popover_tooltip slds-nubbin_left vertical-nav__tooltip" role="tooltip">
            <div class="slds-popover__body">{labels.Expand}</div>
        </div>
    </template>
</button>
```

- [ ] **Step 4: Commit**

```bash
git add src/modules/shell/verticalNav/verticalNav.html
git commit -m "feat: add collapsed-only tooltips to Quick Find, Quick Start Library, and Expand buttons"
```

---

### Task 4: Style the tooltips

**Files:**
- Modify: `src/modules/shell/verticalNav/verticalNav.css`

- [ ] **Step 1: Add tooltip positioning and show/hide rules**

Add to the bottom of `verticalNav.css`:

```css
/* ── Tooltips ── */

.vertical-nav__tooltip {
    display: none;
    position: absolute;
    left: calc(100% + var(--slds-g-spacing-2, 0.5rem));
    top: 50%;
    transform: translateY(-50%);
    width: max-content;
    max-width: 16rem;
    z-index: 9100;
    pointer-events: none;
    white-space: normal;
}

.vertical-nav__group-header:hover .vertical-nav__tooltip,
.vertical-nav__search-icon:hover .vertical-nav__tooltip,
.vertical-nav__footer-link:hover .vertical-nav__tooltip,
.vertical-nav__collapse-btn:hover .vertical-nav__tooltip {
    display: block;
}
```

The group header button already has `position: relative` via the SLDS button reset (which sets `position: relative` on `.slds-button`). The footer link and collapse button also get `position: relative` from SLDS. Verify this is the case — if not, add `position: relative` to the shared nav row rule block in the CSS.

- [ ] **Step 2: Ensure parent buttons have position: relative**

Check that `.slds-button_reset` in SLDS 2 sets `position: relative`. If it doesn't, add to the shared nav row block:

```css
.vertical-nav__group-header,
.vertical-nav__footer-link,
.vertical-nav__collapse-btn {
    position: relative;  /* add this line */
    gap: var(--slds-g-spacing-2, 0.5rem);
    ...
}
```

Also add to `.vertical-nav__search-icon`:

```css
.vertical-nav__search-icon {
    position: relative;  /* add this line */
    padding: var(--slds-g-spacing-2, 0.5rem);
    ...
}
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/shell/verticalNav/verticalNav.css
git commit -m "feat: style nav tooltips with SLDS popover tooltip blueprint"
```

---

### Task 5: Click-to-expand when nav is collapsed

**Files:**
- Modify: `src/modules/shell/verticalNav/verticalNav.js`

- [ ] **Step 1: Expand on group header click when collapsed**

In `handleGroupToggle`, add an early return that expands the nav instead of toggling the group:

```js
handleGroupToggle(event) {
    if (this.isCollapsed) {
        this.isCollapsed = false;
        localStorage.setItem(STORAGE_KEY, 'false');
        return;
    }
    const groupId = event.currentTarget.dataset.groupId;
    this._expandedGroups = {
        ...this._expandedGroups,
        [groupId]: !this._expandedGroups[groupId],
    };
}
```

- [ ] **Step 2: Expand on nav item click when collapsed**

In `handleItemClick`, add an early return that expands the nav without navigating:

```js
handleItemClick(event) {
    event.preventDefault();
    if (this.isCollapsed) {
        this.isCollapsed = false;
        localStorage.setItem(STORAGE_KEY, 'false');
        return;
    }
    const path = event.currentTarget.dataset.path;
    this.dispatchEvent(
        new CustomEvent('navigate', {
            detail: { path },
            bubbles: true,
            composed: true,
        })
    );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/shell/verticalNav/verticalNav.js
git commit -m "feat: expand nav on any item click when collapsed"
```

---

### Task 6: Verify in browser

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open http://localhost:4360 (or whichever port is free).

- [ ] **Step 2: Verify group header tooltips (expanded state)**

- Hover over each of the 6 nav categories — a dark tooltip should appear to the right with the description text
- Tooltip should be vertically centered relative to the row
- Tooltip should not appear on click, only hover
- Verify all 6 description texts match the spec

- [ ] **Step 3: Verify collapsed state tooltips**

- Click the Collapse button to collapse the nav
- Hover over Quick Find (search icon) — tooltip shows "Quick Find"
- Hover over Quick Start Library (light bulb) — tooltip shows "Quick Start Library"
- Hover over Expand (arrow icon) — tooltip shows "Expand"
- Hover over each of the 6 category icons — description tooltips still appear

- [ ] **Step 4: Verify click-to-expand**

- With nav collapsed, click a category group header — nav should expand, group should NOT toggle
- With nav collapsed, click the Quick Start Library link — nav should expand, no navigation
- Click the Expand button — nav should expand (existing behaviour unchanged)

- [ ] **Step 5: Verify cosmos themes**

- Switch to cosmos-light and cosmos-dark — tooltips should be visible and readable in both themes (SLDS popover_tooltip uses its own dark background so it should contrast in both)
