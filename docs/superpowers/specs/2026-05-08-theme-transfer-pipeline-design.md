# Theme Transfer Pipeline — Design Spec

## Problem

The Cosmos theme is authored in a standalone playground repo (`theme-playground`) using plain HTML/CSS. It needs to be applied accurately to LWC/SLDS repos and non-LWC repos without hallucination, drift, or manual error. Today this is a copy-paste process with no validation, no structured format, and no repeatable workflow.

## Goals

1. Zero hallucination — every CSS value traces back to the playground source
2. Repeatable — same input always produces same output
3. Verifiable — three-tier validation confirms correctness
4. Portable — works for LWC/SLDS targets and React/plain HTML targets
5. Maintainable — new components get flagged, not silently skipped

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  THEME PLAYGROUND (source of truth)                         │
│                                                             │
│  theme.css ─────┐                                           │
│  components.css ─┼──► export script ──► dist/               │
│                  │         │              ├── tokens.json    │
│                  │         │              ├── components.json│
│                  │         │              ├── theme.css      │
│                  │         │              ├── components.css │
│                  │         │              └── screenshots/   │
│                  │         │                                 │
│  target-profiles/          │                                 │
│  ├── lwc-slds.json         │                                 │
│  └── react-generic.json    │                                 │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  TARGET REPO (e.g., data360-starter-kit)                    │
│                                                             │
│  generate script ◄── reads dist/ + target profile           │
│       │                                                     │
│       ▼                                                     │
│  public/cosmos-theme.css (generated output)                 │
│                                                             │
│  validate script ──► Tier 1: token integrity                │
│                  ──► Tier 2: selector coverage               │
│                  ──► Tier 3: visual regression (optional)    │
│                                                             │
│  .cosmos-theme-version (tracks applied version)             │
└─────────────────────────────────────────────────────────────┘
```

## Part 1: Playground Export Contract

### Files produced by `npm run export`

All output goes to `dist/` in the playground repo.

#### `dist/tokens.json`

```json
{
  "version": "1.0.0",
  "exported_at": "2026-05-08T10:00:00Z",
  "shared": {
    "font-family": "system-ui, -apple-system, sans-serif",
    "radius": "12px",
    "radius-sm": "8px",
    "radius-pill": "50rem",
    "blur-heavy": "40px",
    "blur-medium": "20px",
    "blur-light": "10px",
    "transition": "0.15s ease",
    "transition-bounce": "0.12s ease"
  },
  "modes": {
    "dark": {
      "bg-gradient": "linear-gradient(135deg, #180f22 0%, #12101a 50%, #0a101e 100%)",
      "glow-color": "rgba(59, 130, 246, 0.12)",
      "surface-bg": "rgba(255, 255, 255, 0.04)",
      "...": "...all tokens from .cosmos-dark block"
    },
    "light": {
      "bg-gradient": "linear-gradient(150.6deg, #f7e4d8 0%, #f0dfe8 35.7%, #dfe5f7 71.4%)",
      "...": "...all tokens from .cosmos-light block"
    }
  }
}
```

#### `dist/components.json`

```json
{
  "version": "1.0.0",
  "components": {
    "button-brand": {
      "description": "Primary action button",
      "tokens_used": ["btn-brand-bg", "btn-brand-hover", "btn-text-color", "radius-sm", "transition-bounce"],
      "base_properties": {
        "display": "inline-flex",
        "align-items": "center",
        "justify-content": "center",
        "padding": "10px 20px",
        "border-radius": "var(--radius-sm)",
        "font-size": "0.875rem",
        "font-weight": "600",
        "color": "var(--btn-text-color)",
        "border": "1px solid transparent",
        "transition": "transform var(--transition-bounce), box-shadow var(--transition-bounce), background var(--transition-bounce)"
      },
      "mode_properties": {
        "dark": {
          "default": { "background": "var(--btn-brand-bg)", "border-color": "var(--btn-brand-bg)" },
          "hover": { "background": "var(--btn-brand-hover)", "border-color": "var(--btn-brand-hover)" }
        },
        "light": {
          "default": {
            "background": "var(--btn-brand-bg)",
            "border-color": "var(--btn-brand-bg)",
            "border-bottom": "2px solid #262e5c",
            "box-shadow": "0 2px 4px -1px rgba(55, 65, 130, 0.25), 0 4px 8px -2px rgba(0, 0, 0, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)",
            "transform": "translateY(0)"
          },
          "hover": {
            "transform": "translateY(-1px)",
            "box-shadow": "0 4px 8px -1px rgba(55, 65, 130, 0.30), 0 6px 12px -3px rgba(0, 0, 0, 0.18), inset 0 1px 0 0 rgba(255, 255, 255, 0.18)"
          },
          "active": {
            "background": "var(--btn-brand-active, #262e5c)",
            "transform": "translateY(1px)",
            "border-bottom-width": "1px",
            "box-shadow": "0 1px 2px -1px rgba(55, 65, 130, 0.20), inset 0 1px 3px 0 rgba(0, 0, 0, 0.15)"
          }
        }
      },
      "visual_behavior": "dark: flat solid colors. light: raised 3D with bottom-border, lifts on hover, depresses on active"
    },
    "button-neutral": { "...": "..." },
    "button-destructive": { "...": "..." },
    "button-success": { "...": "..." },
    "card": { "...": "..." },
    "badge": { "...": "..." },
    "toast": { "...": "..." },
    "input": { "...": "..." },
    "dropdown": { "...": "..." },
    "datepicker": { "...": "..." },
    "data-table": { "...": "..." },
    "modal": { "...": "..." },
    "global-shell": { "...": "..." },
    "vertical-nav": { "...": "..." },
    "plan-builder": { "...": "..." }
  }
}
```

#### `dist/screenshots/`

Reference screenshots captured by Playwright during export:
- `dark-buttons.png`, `light-buttons.png`
- `dark-cards.png`, `light-cards.png`
- `dark-toasts.png`, `light-toasts.png`
- `dark-full.png`, `light-full.png`
- etc.

These are the visual truth for Tier 3 validation.

### Export Script Implementation

- Parser: `css-tree` npm package (proper CSS AST parsing, not regex)
- Reads `theme.css`, extracts `:root`, `.cosmos-dark`, `.cosmos-light` blocks into `tokens.json`
- Reads `components.css`, maps each component section (delimited by comments) into `components.json`
- Launches Playwright headless, opens `index.html`, captures screenshots per component section
- Script location: `scripts/export.mjs` in the playground
- Entry point: `"export": "node scripts/export.mjs"` in `package.json`

---

## Part 2: Target Profiles

Live in `target-profiles/` in the playground repo. One file per target stack.

### `target-profiles/lwc-slds.json`

```json
{
  "name": "LWC + SLDS (Synthetic Shadow)",
  "delivery": {
    "method": "global-stylesheet",
    "file": "public/cosmos-theme.css",
    "link_in": "index.html",
    "reason": "Global CSS required to cross synthetic shadow DOM boundaries and style child components"
  },
  "prerequisites": [
    "SLDS 2 (Cosmos) active via slds-loader.js",
    "Synthetic shadow enabled in vite.config.js",
    "Body class toggling: cosmos-dark / cosmos-light on <body>"
  ],
  "body_class": {
    "dark": "cosmos-dark slds-color-scheme_dark",
    "light": "cosmos-light"
  },
  "selectors": {
    "button-brand": {
      "dark": ["body.cosmos-dark .slds-button_brand"],
      "light": ["body.cosmos-light .slds-button_brand"],
      "hover": { "dark": ["body.cosmos-dark .slds-button_brand:hover"], "light": ["body.cosmos-light .slds-button_brand:hover"] },
      "active": { "light": ["body.cosmos-light .slds-button_brand:active"] }
    },
    "button-neutral": {
      "dark": ["body.cosmos-dark .slds-button_neutral"],
      "light": ["body.cosmos-light .slds-button_neutral"],
      "hover": { "dark": ["body.cosmos-dark .slds-button_neutral:hover"], "light": ["body.cosmos-light .slds-button_neutral:hover"] }
    },
    "button-destructive": {
      "dark": ["body.cosmos-dark .slds-button_destructive"],
      "light": ["body.cosmos-light .slds-button_destructive"]
    },
    "button-success": {
      "dark": ["body.cosmos-dark .slds-button--success, body.cosmos-dark .slds-button_success"],
      "light": ["body.cosmos-light .slds-button--success, body.cosmos-light .slds-button_success"]
    },
    "card": {
      "dark": ["body.cosmos-dark .slds-card"],
      "light": ["body.cosmos-light .slds-card"]
    },
    "badge": {
      "dark": ["body.cosmos-dark .slds-badge"],
      "light": ["body.cosmos-light .slds-badge"]
    },
    "toast": {
      "dark": ["body.cosmos-dark .slds-notify_toast"],
      "light": ["body.cosmos-light .slds-notify_toast"]
    },
    "input": {
      "dark": ["body.cosmos-dark .slds-input"],
      "light": ["body.cosmos-light .slds-input"]
    },
    "dropdown": {
      "dark": ["body.cosmos-dark .slds-dropdown"],
      "light": ["body.cosmos-light .slds-dropdown"]
    },
    "datepicker": {
      "dark": ["body.cosmos-dark .slds-datepicker"],
      "light": ["body.cosmos-light .slds-datepicker"]
    },
    "data-table": {
      "dark": ["body.cosmos-dark .slds-table"],
      "light": ["body.cosmos-light .slds-table"]
    },
    "modal": {
      "dark": ["body.cosmos-dark .slds-modal"],
      "light": ["body.cosmos-light .slds-modal"]
    },
    "global-shell": {
      "dark": ["body.cosmos-dark .global-shell"],
      "light": ["body.cosmos-light .global-shell"],
      "notes": "Custom class — not an SLDS component. Provided by shell-global-shell LWC."
    },
    "vertical-nav": {
      "dark": ["body.cosmos-dark .vertical-nav"],
      "light": ["body.cosmos-light .vertical-nav"],
      "notes": "Custom class — provided by shell-vertical-nav LWC."
    },
    "plan-builder": {
      "dark": ["body.cosmos-dark .plan-builder-card"],
      "light": ["body.cosmos-light .plan-builder-card"],
      "notes": "Custom component — may not exist in all targets."
    }
  },
  "structure": {
    "global-shell": {
      "expected": "shell-global-shell LWC renders a div.global-shell wrapping header and context bar",
      "required_for": ["header glass treatment", "context bar styling"]
    },
    "vertical-nav": {
      "expected": "shell-vertical-nav LWC renders div.vertical-nav with .nav-item children",
      "required_for": ["nav hover states", "nav group headers"]
    }
  }
}
```

### `target-profiles/react-generic.json`

```json
{
  "name": "React / Plain HTML",
  "delivery": {
    "method": "css-import",
    "file": "src/styles/cosmos-theme.css",
    "reason": "Standard CSS cascade — no shadow DOM to cross"
  },
  "prerequisites": [
    "Body class toggling: cosmos-dark / cosmos-light on <body> or root element"
  ],
  "body_class": {
    "dark": "cosmos-dark",
    "light": "cosmos-light"
  },
  "selectors": {
    "button-brand": {
      "dark": [".cosmos-dark .btn-brand, .cosmos-dark [data-variant='brand']"],
      "light": [".cosmos-light .btn-brand, .cosmos-light [data-variant='brand']"]
    },
    "card": {
      "dark": [".cosmos-dark .card, .cosmos-dark [data-component='card']"],
      "light": [".cosmos-light .card, .cosmos-light [data-component='card']"]
    }
  },
  "notes": "React targets may use the playground's components.css nearly verbatim since class names match. The main addition is scoping under .cosmos-dark/.cosmos-light."
}
```

---

## Part 3: Generate Script

Lives in the playground repo at `scripts/generate.mjs`. Can also be extracted as a shared npm package later.

### Input
- `dist/tokens.json`
- `dist/components.json`
- A target profile (specified by name or path)

### Output
- A single CSS file tailored for the target

### Logic

```
1. Write CSS custom properties:
   - :root { ...shared tokens... }
   - .cosmos-dark { ...dark tokens... }  (or body.cosmos-dark for LWC)
   - .cosmos-light { ...light tokens... }

2. Write ambient background (body::before, body::after) — copied verbatim from theme.css

3. For each component in components.json:
   a. Look up its selectors in the target profile
   b. If no mapping exists → skip, log warning, add to "unmapped" report
   c. For each mode (dark, light):
      - Write base properties under the mode selector
      - Write state properties (hover, active, focus) under state selectors
   d. All values come from components.json — never generated

4. Write output to the path specified in target profile's delivery.file
```

### Anti-hallucination enforcement

The generate script is pure JavaScript with no AI involvement. It performs mechanical string assembly:
- Token values: read from JSON, written verbatim
- Selectors: read from target profile, written verbatim
- Properties: read from components.json, written verbatim
- No interpolation, no inference, no "smart" behavior

If a component in `components.json` has `"selector_mapped": false` in the target profile, the script skips it and adds it to `dist/unmapped-components.txt`.

---

## Part 4: Validation

### Tier 1: Token Integrity

Script: `scripts/validate-tokens.mjs` (lives in target repo or shared)

Checks:
1. Parse generated `cosmos-theme.css`
2. Extract all custom property declarations
3. Compare against `tokens.json`:
   - Every token in JSON must appear in CSS with identical value
   - Every custom property in CSS must trace back to JSON (no orphans)
4. Check mode parity: every dark token has a light counterpart (with exceptions list for mode-specific tokens)
5. Check for hardcoded values: scan component rules for hex/rgba values that should be var() references

Exit code: 0 = pass, 1 = fail with report.

### Tier 2: Selector Coverage

Script: `scripts/validate-selectors.mjs` (lives in target repo)

Requires: dev server running (or script starts it)

Steps:
1. Launch Playwright headless
2. Navigate to app URL
3. For each selector in target profile:
   - Set body class to dark mode
   - `document.querySelectorAll(selector)` → count
   - Set body class to light mode
   - `document.querySelectorAll(selector)` → count
4. Report:
   - HIT: selector matches ≥1 element
   - MISS: selector matches 0 elements
   - Coverage percentage

A MISS on a selector flagged `"notes": "may not exist in all targets"` is a warning, not a failure.

### Tier 3: Visual Regression

Script: `scripts/validate-visual.mjs` (lives in target repo)

Steps:
1. Launch Playwright
2. For each component, navigate to a page that renders it
3. Capture screenshot of the component region
4. Compare against reference from `dist/screenshots/` using `pixelmatch`
5. Threshold: >5% pixel diff = failure
6. Output: diff images saved to `validation-output/` for review

Configuration: a `visual-test-routes.json` in the target repo maps component names to URLs + CSS selectors for screenshot capture:
```json
{
  "button-brand": { "url": "/", "selector": ".slds-button_brand", "viewport": [400, 100] },
  "card": { "url": "/", "selector": ".slds-card", "viewport": [600, 300] },
  "toast": { "url": "/", "selector": ".slds-notify_toast", "viewport": [500, 80] }
}
```

---

## Part 5: Claude Code Skill — `/theme-transfer`

### Purpose
Orchestrates the full pipeline within a Claude Code session. Provides guardrails, handles edge cases, and presents results clearly.

### Invocation
```
/theme-transfer                          # Full pipeline: export → generate → validate
/theme-transfer --validate-only          # Just run validation on existing theme
/theme-transfer --visual                 # Include Tier 3 visual regression
/theme-transfer --profile=react-generic  # Override target profile detection
```

### Behavior

```
Step 1: Locate playground
  - Check sister directory: ../theme-playground
  - If not found, check configured path
  - If not found, ask user

Step 2: Run export
  - cd to playground, run `npm run export`
  - Verify dist/ contains tokens.json + components.json
  - Report token count and component count

Step 3: Detect target profile
  - If CWD has vite.config.js + src/modules/ → lwc-slds
  - If CWD has package.json with react dependency → react-generic
  - Otherwise ask user to specify

Step 4: Run generate
  - Execute generate script with detected profile
  - Report: "Generated cosmos-theme.css with X tokens, Y components"
  - If unmapped components exist, list them and ask:
    "These components have no selector mapping for this target:
     - plan-builder
     - datepicker
     Options: [create component] [add mapping] [skip]"

Step 5: Run validation
  - Tier 1: run token check, report pass/fail
  - Tier 2: start dev server if needed, run selector coverage
  - Report results
  - On Tier 2 misses: "These selectors hit no elements:
     - body.cosmos-dark .slds-datepicker (0 hits)
     Options: [create component with lwc-new-component] [skip] [investigate]"

Step 6 (if --visual): Run Tier 3
  - Capture screenshots, compare, show diffs for failures
  - "Visual diff detected for button-brand in light mode (8% difference).
     [show diff] [accept] [investigate]"

Step 7: Report summary
  - Tokens: 87/87 ✓
  - Selectors: 22/24 (2 skipped — datepicker, plan-builder)
  - Visual: 11/11 ✓ (or skipped)
  - Version: written .cosmos-theme-version = 1.0.0
```

### Hard Rules (embedded in skill)

1. Every CSS value written MUST trace to tokens.json or components.json
2. Every selector MUST come from the target profile — never invented
3. Never modify playground source files
4. On any ambiguity: STOP and ask, do not guess
5. On validation failure: REPORT, do not silently fix

---

## Part 6: Profile Maintenance

### Adding a new component to the playground

1. Add HTML to `index.html`, styles to `components.css`
2. Run `npm run export` — script detects new component, adds it to `components.json` with `"selector_mapped": false`
3. Next time `/theme-transfer` runs on a target, it reports the unmapped component
4. User provides the selector → skill adds it to the target profile
5. Profile is committed to playground repo

### Target repo structure changes

- Caught by Tier 2 validation (selector that previously hit now misses)
- `/theme-transfer --validate-only` as a regular check (can be added to CI)
- Report identifies exactly which selector broke

### Version bumping

- Additive changes (new tokens, new components): patch version bump (1.0.0 → 1.0.1)
- Token value changes: minor version bump (1.0.0 → 1.1.0)
- Breaking changes (removed tokens, renamed components): major version bump (1.0.0 → 2.0.0)
- Transfer skill warns on major version difference between playground and target's `.cosmos-theme-version`

---

## Part 7: File Layout Summary

### In theme-playground repo:

```
theme-playground/
├── theme.css                    # Source: design tokens (hand-edited)
├── components.css               # Source: component styles (hand-edited)
├── index.html                   # Showcase page
├── app.js                       # Interactions + token editor
├── package.json                 # scripts: { export, generate }
├── scripts/
│   ├── export.mjs               # Parses CSS → dist/
│   └── generate.mjs             # Reads dist/ + profile → target CSS
├── target-profiles/
│   ├── lwc-slds.json
│   └── react-generic.json
└── dist/                        # Generated and committed — serves as the transfer artifact
    ├── tokens.json
    ├── components.json
    ├── theme.css
    ├── components.css
    ├── unmapped-components.txt
    └── screenshots/
        ├── dark-buttons.png
        ├── light-buttons.png
        └── ...
```

### In target repos (e.g., data360-starter-kit):

```
data360-starter-kit/
├── public/
│   └── cosmos-theme.css         # Generated by pipeline (do not hand-edit)
├── scripts/
│   ├── validate-tokens.mjs
│   ├── validate-selectors.mjs
│   └── validate-visual.mjs
├── visual-test-routes.json      # Maps components to URLs for screenshot capture
└── .cosmos-theme-version        # Tracks applied version
```

---

## Implementation Order

1. **Export script** in playground — parse CSS, produce tokens.json + components.json
2. **Target profile** for lwc-slds — map every playground component to SLDS selectors
3. **Generate script** — assemble target CSS from manifest + profile
4. **Tier 1 validation** — token integrity check
5. **Tier 2 validation** — selector coverage with Playwright
6. **`/theme-transfer` skill** — orchestrate the pipeline
7. **Tier 3 validation** — visual regression (can come later)
8. **React/generic target profile** — extend to non-LWC targets

---

## Dependencies

- `css-tree` — CSS parsing for export script
- `playwright` — Tier 2 + Tier 3 validation, screenshot capture
- `pixelmatch` + `pngjs` — Tier 3 visual comparison
- Node.js 18+ — scripts use ESM

---

## What This Does NOT Cover

- Brand overrides (`cosmos-brand-*.css`) — separate concern, can be added as a follow-on
- Theme switcher UI — already exists in starter kit, not part of transfer
- Animation/interaction JS — the playground's `app.js` is for the editor UI only, not transferable behavior
- SLDS 1 fallback — the Cosmos theme is SLDS 2 only
