# Cosmos Floating Layout — Design Spec

**Date:** 2026-04-28
**Status:** Approved

## Problem

The Figma mockup shows the Cosmos theme with a "floating cards on gradient canvas" layout: the header and horizontal nav are unified into a single frosted-glass card, and all layout regions (top bar, vertical nav, right panel) have `1rem` spacing between them and from the viewport edges. The current implementation styles the header and nav as separate blocks with no gaps, so the floating effect doesn't materialize.

## Design

### Approach: CSS-only in `cosmos-theme.css`

All changes are scoped to `body.cosmos-light` and `body.cosmos-dark` selectors in the existing `cosmos-theme.css` file. No JS or HTML template changes. Non-Cosmos themes (light, dark) are unaffected — they keep edge-to-edge layout.

### Section 1: Unified header+nav card

The `shell-global-shell` component already wraps both `shell-global-header` and `shell-global-navigation`.

- **Remove** individual frosted-glass styling from `.global-header` selectors
- **Apply** frosted-glass (background, border, border-radius, backdrop-filter) to `shell-global-shell` instead
- This makes the header + horizontal nav read as one unified floating card

### Section 2: Layout gaps between regions

Add `1rem` (`--slds-g-spacing-4` / 16px) padding and gaps:

- **Viewport inset:** Padding on the app shell so all content has `1rem` inset from viewport edges
- **Top bar to content:** `1rem` gap between the unified top bar and the content row below
- **Vertical nav to main content:** `1rem` gap between the vertical nav and main content area
- **Main content to right panel:** `1rem` gap between main content and the docked right panel
- **Main content area:** No card treatment — content sits on the open gradient background; cards and tables inside it have their own surfaces

### Section 3: Frosted-glass card for right panel

- **Add** frosted-glass treatment (background, border, border-radius, backdrop-filter) to the right docked panel, matching the existing vertical nav styling
- The vertical nav already has glass styling — it just benefits from the gaps in Section 2

### Section 4: What stays the same

- No JS changes
- No HTML template changes
- Non-Cosmos themes keep edge-to-edge layout with no gaps
- SLDS loader and theme switcher mechanism unchanged
- Frosted-glass visual properties (blur, opacity, border-radius values) stay the same — we're moving which element gets them and adding the panel

## Prerequisites for Applying to Other Codebases

When applying this Cosmos floating layout to another fork or LWC project, verify each of these:

1. **Wrapper element around header+nav** — A single element (e.g., `shell-global-shell`) must wrap both the global header and horizontal navigation. If they are siblings without a wrapper, add one.
2. **CSS class names / element selectors** — The Cosmos CSS targets `shell-global-shell`, `.global-header`, `.vertical-nav`, and panel elements. If a fork renamed these components or classes, update the CSS selectors.
3. **Synthetic shadow DOM enabled** — Global CSS only penetrates LWC component boundaries because synthetic shadow is on (`disableSyntheticShadowSupport: false` in `vite.config.js`). Native shadow DOM would block these styles.
4. **Body class toggling** — The theme switcher must add `cosmos-light` or `cosmos-dark` to `document.body` for the CSS scoping to work.
5. **`cosmos-theme.css` linked in `index.html`** — The theme file must be included via a `<link>` tag in the HTML entry point.
6. **SLDS 2 active** — The Cosmos themes are designed for SLDS 2 (Cosmos design tokens). SLDS 1 surface tokens differ and the glass effect may not render correctly.

## Backlog: Portable Theme Packaging

**Not in scope for this implementation.** Future work to investigate:

- Packaging `cosmos-theme.css` as a standalone distributable file or npm package
- Creating a skill that wires the theme file into any LWC starter kit codebase (adds the `<link>` tag, verifies prerequisites, registers in theme switcher)
- Testing across existing forks that have diverged significantly from this repo
- Determining whether HTML/JS changes are needed in forks that don't have the expected shell structure
