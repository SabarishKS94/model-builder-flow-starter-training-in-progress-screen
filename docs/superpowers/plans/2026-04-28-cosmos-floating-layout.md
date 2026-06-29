# Cosmos Floating Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Cosmos themes render a "floating cards on gradient canvas" layout by unifying the header+nav into one card and adding 1rem gaps between all layout regions.

**Architecture:** CSS-only changes in `public/cosmos-theme.css`, scoped to `body.cosmos-light` and `body.cosmos-dark`. Synthetic shadow DOM lets global CSS penetrate LWC boundaries, so no template or JS changes needed.

**Tech Stack:** CSS (SLDS 2 design tokens)

**Spec:** `docs/superpowers/specs/2026-04-28-cosmos-floating-layout-design.md`

---

### Task 1: Unify header+nav into single frosted-glass card

**Files:**
- Modify: `public/cosmos-theme.css:82-95` (dark) and `public/cosmos-theme.css:180-192` (light)

Currently the CSS applies frosted-glass to both `.global-header` and `.global-shell` independently. The fix: remove `.global-header` from those rules so only `.global-shell` (the wrapper around both header and nav) gets the card treatment.

- [ ] **Step 1: Remove `.global-header` from Cosmos Dark frosted-glass rule**

In `public/cosmos-theme.css`, change line 84 from:

```css
body.cosmos-dark .global-header,
body.cosmos-dark .global-shell {
```

to:

```css
body.cosmos-dark .global-shell {
```

- [ ] **Step 2: Remove `.global-header` from Cosmos Light frosted-glass rule**

In `public/cosmos-theme.css`, change line 182-183 from:

```css
body.cosmos-light .global-header,
body.cosmos-light .global-shell {
```

to:

```css
body.cosmos-light .global-shell {
```

- [ ] **Step 3: Visual verification**

Run: `npm run dev`

Open http://localhost:3000, switch to Cosmos Light and Cosmos Dark themes. Verify:
- The header and horizontal nav appear as ONE unified frosted-glass card (no visible seam between them)
- The card has rounded corners on all four sides

- [ ] **Step 4: Commit**

```bash
git add public/cosmos-theme.css
git commit -m "fix: unify header+nav into single frosted-glass card in Cosmos themes"
```

---

### Task 2: Add layout gaps — viewport inset and top bar margin

**Files:**
- Modify: `public/cosmos-theme.css` (add new rules at end of file)

Add padding around the entire app and a gap between the top bar and the content row below it.

- [ ] **Step 1: Add Cosmos layout gap rules**

Append the following to `public/cosmos-theme.css`, before the final line:

```css
/* ── Cosmos floating layout: gaps between regions ──────────────────── */

body.cosmos-light shell-app,
body.cosmos-dark shell-app {
    padding: var(--slds-g-spacing-4, 1rem);
    gap: var(--slds-g-spacing-4, 1rem);
}
```

This works because `shell-app`'s `:host` is `display: flex; flex-direction: column`. The `gap` creates space between `shell-global-shell` and `.app-body`, and the `padding` insets everything from the viewport edges.

- [ ] **Step 2: Visual verification**

Refresh http://localhost:3000 in Cosmos Light and Dark. Verify:
- 1rem gap visible between the top bar card and the content row
- 1rem padding around all viewport edges — the gradient peeks through on all sides
- The layout still fills the viewport height (no extra scrollbar on the body)

- [ ] **Step 3: Commit**

```bash
git add public/cosmos-theme.css
git commit -m "feat: add viewport inset and top-bar gap for Cosmos floating layout"
```

---

### Task 3: Add gaps between vertical nav, main content, and right panel

**Files:**
- Modify: `public/cosmos-theme.css` (extend the rules added in Task 2)

The content row uses `lightning-layout` which renders as a flex container. We need gaps between the vertical nav, main content, and right panel.

- [ ] **Step 1: Add gap to the content row layout**

Add the following rule to the Cosmos floating layout section in `public/cosmos-theme.css`:

```css
body.cosmos-light .app-body lightning-layout,
body.cosmos-dark .app-body lightning-layout {
    gap: var(--slds-g-spacing-4, 1rem);
}
```

`lightning-layout` renders as a flex container. Adding `gap` spaces out the vertical nav, main content cell, and docked panel.

- [ ] **Step 2: Visual verification**

Refresh http://localhost:3000 in Cosmos Light and Dark. Verify:
- 1rem gap visible between the vertical nav and main content
- 1rem gap visible between main content and the right panel (open a panel to check)
- Gaps are consistent — top, sides, and between regions all match

- [ ] **Step 3: Commit**

```bash
git add public/cosmos-theme.css
git commit -m "feat: add gaps between vertical nav, content, and panel in Cosmos layout"
```

---

### Task 4: Add frosted-glass treatment to the right docked panel

**Files:**
- Modify: `public/cosmos-theme.css`

The panel already has some styling (`body.cosmos-dark .slds-panel` at lines 143-148 and `body.cosmos-light .slds-panel` at lines 243-248) with background and backdrop-filter, but it's missing `border-radius` to match the other floating cards.

- [ ] **Step 1: Add border-radius to Cosmos Dark panel**

In `public/cosmos-theme.css`, update the existing `body.cosmos-dark .slds-panel` rule (around line 143) to add border-radius:

```css
body.cosmos-dark .slds-panel {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
}
```

- [ ] **Step 2: Add border-radius to Cosmos Light panel**

In `public/cosmos-theme.css`, update the existing `body.cosmos-light .slds-panel` rule (around line 243) to add border-radius:

```css
body.cosmos-light .slds-panel {
    background: rgba(255, 255, 255, 0.5);
    border-color: rgba(255, 255, 255, 0.6);
    border-radius: 12px;
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
}
```

- [ ] **Step 3: Visual verification**

Refresh http://localhost:3000, open a panel (click a panel icon in the header), switch to Cosmos Light and Dark. Verify:
- The right panel has rounded corners matching the vertical nav and top bar cards
- The frosted-glass effect is visible on the panel

- [ ] **Step 4: Commit**

```bash
git add public/cosmos-theme.css
git commit -m "feat: add border-radius to docked panel in Cosmos themes"
```

---

### Task 5: Fix height calculation for the padded layout

**Files:**
- Modify: `public/cosmos-theme.css` (extend Cosmos layout section)

The app shell uses `height: 100vh`. With `1rem` padding on top and bottom, the total height becomes `100vh + 2rem`, causing a body scrollbar. We need to adjust.

- [ ] **Step 1: Adjust height to account for padding**

Add to the Cosmos floating layout section in `public/cosmos-theme.css`:

```css
body.cosmos-light shell-app,
body.cosmos-dark shell-app {
    padding: var(--slds-g-spacing-4, 1rem);
    gap: var(--slds-g-spacing-4, 1rem);
    height: calc(100vh - 2 * var(--slds-g-spacing-4, 1rem));
}
```

Wait — actually `padding` is inside the box in the default `box-sizing: content-box` model. Let's use `box-sizing: border-box` instead so padding is included in the 100vh:

```css
body.cosmos-light shell-app,
body.cosmos-dark shell-app {
    padding: var(--slds-g-spacing-4, 1rem);
    gap: var(--slds-g-spacing-4, 1rem);
    box-sizing: border-box;
}
```

- [ ] **Step 2: Visual verification**

Refresh http://localhost:3000. Verify:
- No body-level scrollbar appears
- The layout fills exactly the viewport height
- All content areas still scroll internally as expected
- Check both Cosmos themes

- [ ] **Step 3: Commit**

```bash
git add public/cosmos-theme.css
git commit -m "fix: add border-box sizing to prevent body scrollbar in Cosmos layout"
```

---

### Task 6: Final cross-theme verification

No file changes — this is a verification pass.

- [ ] **Step 1: Test all four themes**

Run: `npm run dev`

Switch through each theme in the theme switcher and verify:

| Theme | Expected Layout |
|-------|----------------|
| Light | Edge-to-edge, no gaps, no rounded cards — unchanged |
| Dark | Edge-to-edge, no gaps, no rounded cards — unchanged |
| Cosmos Light | Floating cards with 1rem gaps, unified header+nav, rounded panel |
| Cosmos Dark | Floating cards with 1rem gaps, unified header+nav, rounded panel |

- [ ] **Step 2: Test with vertical nav collapsed**

In a Cosmos theme, collapse the vertical nav. Verify:
- The collapsed nav still has its frosted-glass card appearance
- Gaps remain consistent around the collapsed nav

- [ ] **Step 3: Test with panel open and closed**

In a Cosmos theme, open and close the right panel. Verify:
- Panel opens with rounded corners and frosted-glass
- Gap between content and panel is visible
- Closing the panel doesn't leave residual spacing

- [ ] **Step 4: Test at different viewport sizes**

Resize the browser window to verify the layout adapts without breaking:
- Narrow viewport (~1024px): gaps still present, content area shrinks
- Wide viewport (~1920px): gaps remain 1rem, content area expands
