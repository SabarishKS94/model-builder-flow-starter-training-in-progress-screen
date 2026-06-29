# Theme Transfer Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic pipeline that exports Cosmos theme tokens and component styles from the standalone playground repo, generates target-specific CSS, and validates correctness — eliminating manual copy-paste and AI hallucination.

**Architecture:** The playground gains a `package.json`, an export script (CSS→JSON via `css-tree`), and a generate script (JSON→target CSS). Target profiles map playground selectors to target selectors. Validation scripts in the target repo verify token integrity and selector coverage. A Claude Code skill orchestrates the flow.

**Tech Stack:** Node.js 18+ (ESM), `css-tree` for CSS parsing, Playwright for selector coverage and visual regression, `pixelmatch` + `pngjs` for screenshot comparison.

---

## File Structure

### In `theme-playground/` (playground repo):

| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies, npm scripts (`export`, `generate`) |
| `scripts/export.mjs` | Parses `theme.css` + `components.css` → `dist/tokens.json` + `dist/components.json` |
| `scripts/generate.mjs` | Reads dist + target profile → generates CSS for target |
| `target-profiles/lwc-slds.json` | Selector map, delivery info, prerequisites for LWC targets |
| `target-profiles/react-generic.json` | Same for React/plain HTML targets |
| `dist/tokens.json` | Exported token manifest (generated, committed) |
| `dist/components.json` | Exported component manifest (generated, committed) |

### In `data360-starter-kit/` (target repo):

| File | Responsibility |
|------|---------------|
| `scripts/validate-tokens.mjs` | Tier 1: compare generated CSS against tokens.json |
| `scripts/validate-selectors.mjs` | Tier 2: check selectors hit actual DOM elements |
| `scripts/validate-visual.mjs` | Tier 3: screenshot comparison against references |
| `visual-test-routes.json` | Maps component names to URLs + selectors for screenshots |
| `.cosmos-theme-version` | Tracks which playground version is applied |

### In `.claude/commands/` (skill):

| File | Responsibility |
|------|---------------|
| `.claude/commands/theme-transfer.md` | Claude Code slash command for `/theme-transfer` |

---

## Task 1: Initialize Playground Package

**Files:**
- Create: `/Users/dvora/Code/data360/theme-playground/package.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "cosmos-theme-playground",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "Cosmos theme playground — source of truth for design tokens and component styles",
  "scripts": {
    "export": "node scripts/export.mjs",
    "generate": "node scripts/generate.mjs"
  },
  "dependencies": {
    "css-tree": "^3.1.0"
  },
  "devDependencies": {
    "playwright": "^1.50.0",
    "pixelmatch": "^6.0.0",
    "pngjs": "^7.0.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `cd /Users/dvora/Code/data360/theme-playground && npm install`
Expected: `node_modules/` created, lock file generated.

- [ ] **Step 3: Create dist directory**

Run: `mkdir -p /Users/dvora/Code/data360/theme-playground/dist`

- [ ] **Step 4: Create scripts directory**

Run: `mkdir -p /Users/dvora/Code/data360/theme-playground/scripts`

- [ ] **Step 5: Create target-profiles directory**

Run: `mkdir -p /Users/dvora/Code/data360/theme-playground/target-profiles`

- [ ] **Step 6: Add .gitignore for node_modules only (dist is committed)**

Create `/Users/dvora/Code/data360/theme-playground/.gitignore`:
```
node_modules/
```

- [ ] **Step 7: Commit**

```bash
cd /Users/dvora/Code/data360/theme-playground
git add package.json .gitignore
git commit -m "$(cat <<'EOF'
feat: initialize package.json for theme export pipeline

Adds css-tree for CSS parsing, playwright for screenshot capture,
and pixelmatch for visual regression. dist/ will be committed as
the transfer artifact.
EOF
)"
```

---

## Task 2: Export Script — Token Extraction

**Files:**
- Create: `/Users/dvora/Code/data360/theme-playground/scripts/export.mjs`

The export script parses `theme.css` and extracts all CSS custom properties organized by block (`:root`, `.cosmos-dark`, `.cosmos-light`). It also extracts the ambient background rules verbatim.

- [ ] **Step 1: Write the export script (token extraction portion)**

```javascript
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as csstree from 'css-tree';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

mkdirSync(DIST, { recursive: true });

function extractTokens() {
  const src = readFileSync(join(ROOT, 'theme.css'), 'utf8');
  const ast = csstree.parse(src);

  const tokens = { version: '1.0.0', exported_at: new Date().toISOString(), shared: {}, modes: { dark: {}, light: {} } };

  csstree.walk(ast, {
    visit: 'Rule',
    enter(node) {
      const selectorText = csstree.generate(node.prelude);
      let target = null;

      if (selectorText === ':root') target = tokens.shared;
      else if (selectorText === '.cosmos-dark') target = tokens.modes.dark;
      else if (selectorText === '.cosmos-light') target = tokens.modes.light;

      if (!target) return;

      node.block.children.forEach(child => {
        if (child.type === 'Declaration' && child.property.startsWith('--')) {
          const name = child.property.slice(2); // strip --
          const value = csstree.generate(child.value).trim();
          target[name] = value;
        }
      });
    }
  });

  return tokens;
}

function extractAmbientCSS() {
  const src = readFileSync(join(ROOT, 'theme.css'), 'utf8');
  const ast = csstree.parse(src);
  const ambientRules = [];

  csstree.walk(ast, {
    visit: 'Atrule',
    enter(node) {
      if (node.name === 'keyframes') {
        ambientRules.push(csstree.generate(node));
      }
    }
  });

  csstree.walk(ast, {
    visit: 'Rule',
    enter(node) {
      const sel = csstree.generate(node.prelude);
      if (sel.includes('body::before') || sel.includes('body::after')) {
        ambientRules.push(csstree.generate(node));
      }
    }
  });

  return ambientRules.join('\n\n');
}

const tokens = extractTokens();
writeFileSync(join(DIST, 'tokens.json'), JSON.stringify(tokens, null, 2));
console.log(`Exported ${Object.keys(tokens.shared).length} shared tokens`);
console.log(`Exported ${Object.keys(tokens.modes.dark).length} dark tokens`);
console.log(`Exported ${Object.keys(tokens.modes.light).length} light tokens`);

const ambient = extractAmbientCSS();
writeFileSync(join(DIST, 'ambient.css'), ambient);
console.log(`Exported ambient CSS (${ambient.split('\n').length} lines)`);
```

- [ ] **Step 2: Run the export to verify token extraction**

Run: `cd /Users/dvora/Code/data360/theme-playground && node scripts/export.mjs`
Expected output (approximately):
```
Exported 9 shared tokens
Exported 44 dark tokens
Exported 44 light tokens
Exported ambient CSS (X lines)
```

- [ ] **Step 3: Verify tokens.json content**

Run: `cat /Users/dvora/Code/data360/theme-playground/dist/tokens.json | head -30`
Expected: JSON with `version`, `exported_at`, `shared` containing `font-family`, `radius`, etc.

- [ ] **Step 4: Commit**

```bash
cd /Users/dvora/Code/data360/theme-playground
git add scripts/export.mjs dist/tokens.json dist/ambient.css
git commit -m "$(cat <<'EOF'
feat: add export script — token extraction from theme.css

Parses theme.css using css-tree, extracts CSS custom properties
from :root, .cosmos-dark, .cosmos-light into tokens.json.
Also extracts ambient background rules (keyframes + body pseudo-elements).
EOF
)"
```

---

## Task 3: Export Script — Component Extraction

**Files:**
- Modify: `/Users/dvora/Code/data360/theme-playground/scripts/export.mjs`

Add component extraction logic that parses `components.css` using the comment delimiters (`/* ── ComponentName ──...`) to split into named sections, then extracts rules per section.

- [ ] **Step 1: Add component extraction to export.mjs**

Append the following to the end of `scripts/export.mjs` (before any final console.log summary):

```javascript
function extractComponents() {
  const src = readFileSync(join(ROOT, 'components.css'), 'utf8');

  // Split by section comment pattern: /* ── SectionName ──...── */
  const sectionPattern = /\/\*\s*──\s*(.+?)\s*─+\s*\*\//g;
  const sections = [];
  let match;
  const matches = [];

  while ((match = sectionPattern.exec(src)) !== null) {
    matches.push({ name: match[1].trim(), index: match.index });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : src.length;
    const css = src.slice(start, end).trim();
    sections.push({ name: matches[i].name, css });
  }

  // Normalize section names to component keys
  const nameMap = {
    'Layout': 'layout',
    'Buttons (Dark: flat solid / Light: raised with bottom-border)': 'buttons',
    'SVG Icons': 'icons',
    'Cards': 'card',
    'Inputs': 'input',
    'Select': 'select',
    'Table': 'data-table',
    'Vertical nav': 'vertical-nav',
    'Badges': 'badge',
    'Toasts': 'toast',
    'Modal': 'modal',
    'Dropdown': 'dropdown',
    'Datepicker (simplified)': 'datepicker',
    'Token editor panel': 'token-editor',
    'Heading': 'heading',
    'Plan Builder': 'plan-builder',
  };

  const components = { version: '1.0.0', components: {} };

  for (const section of sections) {
    const key = nameMap[section.name] || section.name.toLowerCase().replace(/\s+/g, '-');

    // Skip non-transferable sections
    if (key === 'token-editor') continue;

    // Parse the CSS for this section to extract selectors and properties
    let ast;
    try {
      ast = csstree.parse(section.css);
    } catch (e) {
      console.warn(`Warning: could not parse section "${section.name}": ${e.message}`);
      continue;
    }

    const rules = [];
    csstree.walk(ast, {
      visit: 'Rule',
      enter(node) {
        const selector = csstree.generate(node.prelude);
        const declarations = {};
        node.block.children.forEach(child => {
          if (child.type === 'Declaration') {
            declarations[child.property] = csstree.generate(child.value).trim();
          }
        });
        if (Object.keys(declarations).length > 0) {
          rules.push({ selector, declarations });
        }
      }
    });

    components.components[key] = {
      section_name: section.name,
      rules,
      raw_css: section.css,
    };
  }

  return components;
}

const components = extractComponents();
writeFileSync(join(DIST, 'components.json'), JSON.stringify(components, null, 2));
console.log(`Exported ${Object.keys(components.components).length} component sections`);

// Also copy raw source files to dist
writeFileSync(join(DIST, 'theme.css'), readFileSync(join(ROOT, 'theme.css'), 'utf8'));
writeFileSync(join(DIST, 'components.css'), readFileSync(join(ROOT, 'components.css'), 'utf8'));
console.log('Copied raw source files to dist/');
```

- [ ] **Step 2: Run the full export**

Run: `cd /Users/dvora/Code/data360/theme-playground && node scripts/export.mjs`
Expected:
```
Exported 9 shared tokens
Exported 44 dark tokens
Exported 44 light tokens
Exported ambient CSS (X lines)
Exported 14 component sections
Copied raw source files to dist/
```

- [ ] **Step 3: Verify components.json structure**

Run: `cd /Users/dvora/Code/data360/theme-playground && node -e "const c = JSON.parse(require('fs').readFileSync('dist/components.json','utf8')); console.log(Object.keys(c.components).join('\n'))"`
Expected: list of component keys like `layout`, `buttons`, `card`, `input`, etc.

- [ ] **Step 4: Commit**

```bash
cd /Users/dvora/Code/data360/theme-playground
git add scripts/export.mjs dist/
git commit -m "$(cat <<'EOF'
feat: export script now extracts component sections from components.css

Parses section comment delimiters, extracts rules per component,
stores both structured JSON and raw CSS in dist/.
EOF
)"
```

---

## Task 4: LWC/SLDS Target Profile

**Files:**
- Create: `/Users/dvora/Code/data360/theme-playground/target-profiles/lwc-slds.json`

This maps every playground component to its SLDS equivalent selectors, scoped under `body.cosmos-dark` / `body.cosmos-light`.

- [ ] **Step 1: Create the target profile**

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
  "selector_prefix": {
    "dark": "body.cosmos-dark",
    "light": "body.cosmos-light"
  },
  "component_selectors": {
    "layout": {
      "strategy": "passthrough",
      "notes": "Layout selectors (.global-shell, .global-header, etc.) are custom classes used identically in both playground and LWC target. Prefix with body.cosmos-dark/light."
    },
    "buttons": {
      "strategy": "remap",
      "map": {
        ".btn-brand": ".slds-button_brand",
        ".btn-brand:hover": ".slds-button_brand:hover",
        ".btn-brand:active": ".slds-button_brand:active",
        ".btn-success": ".slds-button--success, .slds-button_success",
        ".btn-success:hover": ".slds-button--success:hover, .slds-button_success:hover",
        ".btn-destructive": ".slds-button_destructive",
        ".btn-destructive:hover": ".slds-button_destructive:hover",
        ".btn-neutral": ".slds-button_neutral",
        ".btn-neutral:hover": ".slds-button_neutral:hover",
        ".btn": ".slds-button",
        ".btn-icon": ".slds-button_icon, .slds-button--icon",
        ".btn-icon:hover": ".slds-button_icon:hover, .slds-button--icon:hover",
        ".cosmos-light .btn-brand": ".slds-button_brand",
        ".cosmos-light .btn-brand:hover": ".slds-button_brand:hover",
        ".cosmos-light .btn-brand:active": ".slds-button_brand:active",
        ".cosmos-light .btn-neutral": ".slds-button_neutral",
        ".cosmos-light .btn-neutral:hover": ".slds-button_neutral:hover",
        ".cosmos-light .btn-destructive": ".slds-button_destructive",
        ".cosmos-light .btn-destructive:hover": ".slds-button_destructive:hover",
        ".cosmos-light .btn-success": ".slds-button--success, .slds-button_success",
        ".cosmos-light .btn-success:hover": ".slds-button--success:hover, .slds-button_success:hover"
      }
    },
    "icons": {
      "strategy": "skip",
      "notes": "LWC uses lightning-icon component with its own sizing — playground icon sizing not applicable"
    },
    "card": {
      "strategy": "remap",
      "map": {
        ".card": ".slds-card",
        ".card__header": ".slds-card__header",
        ".card__header-title": ".slds-card__header-title, .slds-text-heading_small",
        ".card__body": ".slds-card__body, .slds-card__body_inner"
      }
    },
    "input": {
      "strategy": "remap",
      "map": {
        ".input": ".slds-input",
        ".input:hover": ".slds-input:hover",
        ".input:focus": ".slds-input:focus",
        ".input::placeholder": ".slds-input::placeholder",
        ".input-pill": ".slds-input[type='search'], .slds-combobox__input",
        ".cosmos-light .input": ".slds-input"
      }
    },
    "select": {
      "strategy": "remap",
      "map": {
        ".select": ".slds-select",
        ".select:hover": ".slds-select:hover",
        ".select:focus": ".slds-select:focus"
      }
    },
    "data-table": {
      "strategy": "remap",
      "map": {
        ".table": ".slds-table, .slds-table_bordered",
        ".table th": ".slds-table th, .slds-table_bordered th",
        ".table td": ".slds-table td, .slds-table_bordered td",
        ".table tr:last-child td": ".slds-table tr:last-child td"
      }
    },
    "vertical-nav": {
      "strategy": "passthrough",
      "notes": "Uses custom classes (.vertical-nav, .nav-item, .nav-group-header) same as playground. Provided by shell-vertical-nav LWC."
    },
    "badge": {
      "strategy": "remap",
      "map": {
        ".badge": ".slds-badge",
        ".badge-error": ".slds-badge[data-variant='error'], .slds-theme_error .slds-badge",
        ".badge-warning": ".slds-badge[data-variant='warning'], .slds-theme_warning .slds-badge",
        ".badge-success": ".slds-badge[data-variant='success'], .slds-theme_success .slds-badge",
        ".badge-default": ".slds-badge[data-variant='default'], .slds-badge"
      }
    },
    "toast": {
      "strategy": "remap",
      "map": {
        ".toast": ".slds-notify_toast, .slds-notify--toast",
        ".toast-icon": ".slds-notify__icon, .slds-icon_container",
        ".toast-close": ".slds-notify__close-button, .slds-button_icon-inverse",
        ".toast-success": ".slds-notify_toast.slds-theme_success, .slds-notify--toast.slds-theme--success",
        ".toast-default": ".slds-notify_toast.slds-theme_info, .slds-notify--toast.slds-theme--info",
        ".toast-warning": ".slds-notify_toast.slds-theme_warning, .slds-notify--toast.slds-theme--warning",
        ".toast-error": ".slds-notify_toast.slds-theme_error, .slds-notify--toast.slds-theme--error",
        ".cosmos-light .toast-success, .cosmos-light .toast-default, .cosmos-light .toast-warning, .cosmos-light .toast-error": ".slds-notify_toast, .slds-notify--toast"
      }
    },
    "modal": {
      "strategy": "remap",
      "map": {
        ".modal-backdrop": ".slds-backdrop, .slds-modal-backdrop",
        ".modal": ".slds-modal__container, .slds-modal",
        ".modal__header": ".slds-modal__header",
        ".modal__header h3": ".slds-modal__title",
        ".modal__content": ".slds-modal__content",
        ".modal__footer": ".slds-modal__footer"
      }
    },
    "dropdown": {
      "strategy": "remap",
      "map": {
        ".dropdown": ".slds-dropdown",
        ".dropdown-item": ".slds-dropdown__item a, .slds-dropdown__item button",
        ".dropdown-item:hover": ".slds-dropdown__item a:hover, .slds-dropdown__item button:hover"
      }
    },
    "datepicker": {
      "strategy": "remap",
      "map": {
        ".datepicker": ".slds-datepicker",
        ".datepicker-header": ".slds-datepicker__header",
        ".datepicker-grid": ".slds-datepicker__month",
        ".datepicker-day": ".slds-day",
        ".datepicker-day:hover": ".slds-day:hover",
        ".datepicker-day.today": ".slds-is-today .slds-day",
        ".datepicker-day.selected": ".slds-is-selected .slds-day",
        ".datepicker-day.header": ".slds-datepicker th"
      }
    },
    "heading": {
      "strategy": "remap",
      "map": {
        ".heading-large": ".slds-text-heading_large",
        ".intro-copy": ".slds-text-body_regular"
      }
    },
    "plan-builder": {
      "strategy": "passthrough",
      "optional": true,
      "notes": "Custom component — uses playground classes directly. May not exist in all targets."
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

- [ ] **Step 2: Validate JSON is well-formed**

Run: `cd /Users/dvora/Code/data360/theme-playground && node -e "JSON.parse(require('fs').readFileSync('target-profiles/lwc-slds.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

- [ ] **Step 3: Commit**

```bash
cd /Users/dvora/Code/data360/theme-playground
git add target-profiles/lwc-slds.json
git commit -m "$(cat <<'EOF'
feat: add LWC/SLDS target profile with full selector mapping

Maps every playground component selector to its SLDS equivalent.
Includes delivery method, prerequisites, and structural expectations.
EOF
)"
```

---

## Task 5: Generate Script

**Files:**
- Create: `/Users/dvora/Code/data360/theme-playground/scripts/generate.mjs`

The generate script reads `dist/tokens.json`, `dist/components.json`, `dist/ambient.css`, and a target profile, then mechanically assembles the target CSS. Zero interpretation — pure string assembly.

- [ ] **Step 1: Write the generate script**

```javascript
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

// Parse CLI args
const args = process.argv.slice(2);
const profileArg = args.find(a => a.startsWith('--profile='));
const outputArg = args.find(a => a.startsWith('--output='));

if (!profileArg) {
  console.error('Usage: node scripts/generate.mjs --profile=<name-or-path> [--output=<path>]');
  console.error('  --profile=lwc-slds          Use target-profiles/lwc-slds.json');
  console.error('  --profile=./custom.json     Use a custom profile path');
  process.exit(1);
}

const profileValue = profileArg.split('=')[1];
const profilePath = profileValue.includes('/')
  ? resolve(profileValue)
  : join(ROOT, 'target-profiles', `${profileValue}.json`);

const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
const tokens = JSON.parse(readFileSync(join(DIST, 'tokens.json'), 'utf8'));
const components = JSON.parse(readFileSync(join(DIST, 'components.json'), 'utf8'));
const ambientCSS = readFileSync(join(DIST, 'ambient.css'), 'utf8');

const darkPrefix = profile.selector_prefix.dark;
const lightPrefix = profile.selector_prefix.light;

const lines = [];
const unmapped = [];

lines.push('/* Generated by cosmos-theme-playground generate script */');
lines.push(`/* Profile: ${profile.name} */`);
lines.push(`/* Generated: ${new Date().toISOString()} */`);
lines.push(`/* Source version: ${tokens.version} */`);
lines.push('');

// Section 1: Tokens as custom properties
lines.push('/* ── Design Tokens ──────────────────────────────────────────────── */');
lines.push('');
lines.push(':root {');
for (const [name, value] of Object.entries(tokens.shared)) {
  lines.push(`    --${name}: ${value};`);
}
lines.push('}');
lines.push('');

lines.push(`${darkPrefix} {`);
for (const [name, value] of Object.entries(tokens.modes.dark)) {
  lines.push(`    --${name}: ${value};`);
}
lines.push('}');
lines.push('');

lines.push(`${lightPrefix} {`);
for (const [name, value] of Object.entries(tokens.modes.light)) {
  lines.push(`    --${name}: ${value};`);
}
lines.push('}');
lines.push('');

// Section 2: Ambient background
lines.push('/* ── Ambient Background ────────────────────────────────────────── */');
lines.push('');
// Rewrite body::before/after to be scoped under dark/light
const ambientRewritten = ambientCSS
  .replace(/body::before/g, `${darkPrefix}::before,\n${lightPrefix}::before`)
  .replace(/body::after/g, `${darkPrefix}::after,\n${lightPrefix}::after`);
lines.push(ambientRewritten);
lines.push('');

// Section 3: Component styles
lines.push('/* ── Component Styles ──────────────────────────────────────────── */');
lines.push('');

for (const [componentKey, componentData] of Object.entries(components.components)) {
  const profileEntry = profile.component_selectors[componentKey];

  if (!profileEntry) {
    unmapped.push(componentKey);
    continue;
  }

  if (profileEntry.strategy === 'skip') continue;

  lines.push(`/* ── ${componentData.section_name} ── */`);
  lines.push('');

  if (profileEntry.strategy === 'passthrough') {
    // Use playground selectors directly, just prefix with body.cosmos-dark/light
    for (const rule of componentData.rules) {
      const sel = rule.selector;

      // Determine if selector already has a mode prefix
      const hasCosmosDark = sel.includes('.cosmos-dark');
      const hasCosmosLight = sel.includes('.cosmos-light');

      let darkSelector, lightSelector;

      if (hasCosmosDark) {
        // Already mode-specific to dark — rewrite prefix
        darkSelector = sel.replace(/\.cosmos-dark/g, darkPrefix);
        lightSelector = null;
      } else if (hasCosmosLight) {
        // Already mode-specific to light — rewrite prefix
        lightSelector = sel.replace(/\.cosmos-light/g, lightPrefix);
        darkSelector = null;
      } else {
        // Generic — apply to both modes
        darkSelector = `${darkPrefix} ${sel}`;
        lightSelector = `${lightPrefix} ${sel}`;
      }

      const declBlock = Object.entries(rule.declarations)
        .map(([prop, val]) => `    ${prop}: ${val};`)
        .join('\n');

      if (darkSelector) {
        lines.push(`${darkSelector} {`);
        lines.push(declBlock);
        lines.push('}');
        lines.push('');
      }
      if (lightSelector) {
        lines.push(`${lightSelector} {`);
        lines.push(declBlock);
        lines.push('}');
        lines.push('');
      }
    }
  } else if (profileEntry.strategy === 'remap') {
    const selectorMap = profileEntry.map;

    for (const rule of componentData.rules) {
      const playgroundSel = rule.selector;

      // Look up remapped selector
      const targetSel = selectorMap[playgroundSel];

      if (!targetSel) {
        // No mapping for this specific selector — pass through with prefix
        const hasCosmosDark = playgroundSel.includes('.cosmos-dark');
        const hasCosmosLight = playgroundSel.includes('.cosmos-light');

        let darkSel, lightSel;
        if (hasCosmosDark) {
          darkSel = playgroundSel.replace(/\.cosmos-dark/g, darkPrefix);
          lightSel = null;
        } else if (hasCosmosLight) {
          lightSel = playgroundSel.replace(/\.cosmos-light/g, lightPrefix);
          darkSel = null;
        } else {
          darkSel = `${darkPrefix} ${playgroundSel}`;
          lightSel = `${lightPrefix} ${playgroundSel}`;
        }

        const declBlock = Object.entries(rule.declarations)
          .map(([prop, val]) => `    ${prop}: ${val};`)
          .join('\n');

        if (darkSel) {
          lines.push(`${darkSel} {`);
          lines.push(declBlock);
          lines.push('}');
          lines.push('');
        }
        if (lightSel) {
          lines.push(`${lightSel} {`);
          lines.push(declBlock);
          lines.push('}');
          lines.push('');
        }
        continue;
      }

      // Has a remap — determine mode context from original selector
      const hasCosmosDark = playgroundSel.includes('.cosmos-dark');
      const hasCosmosLight = playgroundSel.includes('.cosmos-light');

      const declBlock = Object.entries(rule.declarations)
        .map(([prop, val]) => `    ${prop}: ${val};`)
        .join('\n');

      if (hasCosmosLight) {
        // Light-mode-only rule
        lines.push(`${lightPrefix} ${targetSel} {`);
        lines.push(declBlock);
        lines.push('}');
        lines.push('');
      } else if (hasCosmosDark) {
        // Dark-mode-only rule
        lines.push(`${darkPrefix} ${targetSel} {`);
        lines.push(declBlock);
        lines.push('}');
        lines.push('');
      } else {
        // Applies to both modes
        lines.push(`${darkPrefix} ${targetSel} {`);
        lines.push(declBlock);
        lines.push('}');
        lines.push('');
        lines.push(`${lightPrefix} ${targetSel} {`);
        lines.push(declBlock);
        lines.push('}');
        lines.push('');
      }
    }
  }
}

// Write output
const output = lines.join('\n');
const outputPath = outputArg
  ? resolve(outputArg.split('=')[1])
  : join(DIST, `generated-${profileValue}.css`);

writeFileSync(outputPath, output);
console.log(`Generated: ${outputPath}`);
console.log(`  Tokens: ${Object.keys(tokens.shared).length} shared + ${Object.keys(tokens.modes.dark).length} dark + ${Object.keys(tokens.modes.light).length} light`);
console.log(`  Components: ${Object.keys(components.components).length - unmapped.length} mapped, ${unmapped.length} unmapped`);

if (unmapped.length > 0) {
  console.log(`\n  Unmapped components (skipped):`);
  unmapped.forEach(c => console.log(`    - ${c}`));
  writeFileSync(join(DIST, 'unmapped-components.txt'), unmapped.join('\n'));
}
```

- [ ] **Step 2: Run the generate script with lwc-slds profile**

Run: `cd /Users/dvora/Code/data360/theme-playground && node scripts/generate.mjs --profile=lwc-slds`
Expected:
```
Generated: /Users/dvora/Code/data360/theme-playground/dist/generated-lwc-slds.css
  Tokens: 9 shared + 44 dark + 44 light
  Components: X mapped, Y unmapped
```

- [ ] **Step 3: Inspect the generated output**

Run: `head -60 /Users/dvora/Code/data360/theme-playground/dist/generated-lwc-slds.css`
Expected: header comment, `:root` block with shared tokens, `body.cosmos-dark` block with dark tokens.

- [ ] **Step 4: Test generating to a specific output path (the starter kit)**

Run: `cd /Users/dvora/Code/data360/theme-playground && node scripts/generate.mjs --profile=lwc-slds --output=/Users/dvora/Code/data360/data360-starter-kit/public/cosmos-theme-generated.css`
Expected: file written at the specified path.

- [ ] **Step 5: Commit**

```bash
cd /Users/dvora/Code/data360/theme-playground
git add scripts/generate.mjs
git commit -m "$(cat <<'EOF'
feat: add generate script — assembles target CSS from manifest + profile

Reads tokens.json, components.json, ambient.css, and a target profile.
Mechanically assembles CSS with correct selectors for the target.
Supports passthrough (keep selectors), remap (translate selectors), skip.
EOF
)"
```

---

## Task 6: Tier 1 Validation — Token Integrity

**Files:**
- Create: `/Users/dvora/Code/data360/data360-starter-kit/scripts/validate-tokens.mjs`

This script compares a generated CSS file against `tokens.json` to verify every token is present with the correct value.

- [ ] **Step 1: Write the token validation script**

```javascript
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as csstree from 'css-tree';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const args = process.argv.slice(2);
const tokensPath = args.find(a => a.startsWith('--tokens='))?.split('=')[1];
const cssPath = args.find(a => a.startsWith('--css='))?.split('=')[1] || join(ROOT, 'public/cosmos-theme.css');

if (!tokensPath) {
  console.error('Usage: node scripts/validate-tokens.mjs --tokens=<path-to-tokens.json> [--css=<path-to-css>]');
  process.exit(1);
}

const tokens = JSON.parse(readFileSync(resolve(tokensPath), 'utf8'));
const cssSource = readFileSync(resolve(cssPath), 'utf8');
const ast = csstree.parse(cssSource);

const errors = [];
const warnings = [];

// Extract all custom property declarations from the CSS
const cssTokens = { shared: {}, dark: {}, light: {} };

csstree.walk(ast, {
  visit: 'Rule',
  enter(node) {
    const sel = csstree.generate(node.prelude);
    let target = null;

    if (sel === ':root') target = cssTokens.shared;
    else if (sel.includes('cosmos-dark') && !sel.includes('cosmos-light')) target = cssTokens.dark;
    else if (sel.includes('cosmos-light') && !sel.includes('cosmos-dark')) target = cssTokens.light;

    if (!target) return;

    node.block.children.forEach(child => {
      if (child.type === 'Declaration' && child.property.startsWith('--')) {
        const name = child.property.slice(2);
        const value = csstree.generate(child.value).trim();
        // Only record if this is a token block (selector is just the mode class, not a component rule)
        if (sel === ':root' || sel === 'body.cosmos-dark' || sel === 'body.cosmos-light' ||
            sel === '.cosmos-dark' || sel === '.cosmos-light') {
          target[name] = value;
        }
      }
    });
  }
});

// Check 1: Every token in JSON exists in CSS with correct value
console.log('─── Tier 1: Token Integrity Check ───');
console.log('');

let totalChecked = 0;
let totalPassed = 0;

function checkGroup(groupName, expected, actual) {
  for (const [name, expectedValue] of Object.entries(expected)) {
    totalChecked++;
    if (!(name in actual)) {
      errors.push(`MISSING [${groupName}]: --${name} not found in CSS`);
    } else if (actual[name] !== expectedValue) {
      errors.push(`MISMATCH [${groupName}]: --${name}\n  Expected: ${expectedValue}\n  Got:      ${actual[name]}`);
    } else {
      totalPassed++;
    }
  }
}

checkGroup('shared', tokens.shared, cssTokens.shared);
checkGroup('dark', tokens.modes.dark, cssTokens.dark);
checkGroup('light', tokens.modes.light, cssTokens.light);

// Check 2: Mode parity — every dark token should have a light counterpart
const darkNames = new Set(Object.keys(tokens.modes.dark));
const lightNames = new Set(Object.keys(tokens.modes.light));
const darkOnly = [...darkNames].filter(n => !lightNames.has(n));
const lightOnly = [...lightNames].filter(n => !darkNames.has(n));

if (darkOnly.length > 0) {
  warnings.push(`Mode parity: ${darkOnly.length} tokens exist in dark but not light: ${darkOnly.join(', ')}`);
}
if (lightOnly.length > 0) {
  warnings.push(`Mode parity: ${lightOnly.length} tokens exist in light but not dark: ${lightOnly.join(', ')}`);
}

// Report
console.log(`Tokens checked: ${totalChecked}`);
console.log(`Passed: ${totalPassed}/${totalChecked}`);
console.log('');

if (warnings.length > 0) {
  console.log(`Warnings (${warnings.length}):`);
  warnings.forEach(w => console.log(`  ⚠ ${w}`));
  console.log('');
}

if (errors.length > 0) {
  console.log(`FAILURES (${errors.length}):`);
  errors.forEach(e => console.log(`  ✗ ${e}`));
  console.log('');
  process.exit(1);
} else {
  console.log('✓ All tokens present and correct');
  process.exit(0);
}
```

- [ ] **Step 2: Install css-tree in the starter kit**

Run: `cd /Users/dvora/Code/data360/data360-starter-kit && npm install css-tree --save-dev`

- [ ] **Step 3: Test validation against the generated CSS**

Run: `cd /Users/dvora/Code/data360/data360-starter-kit && node scripts/validate-tokens.mjs --tokens=../theme-playground/dist/tokens.json --css=public/cosmos-theme-generated.css`
Expected: `✓ All tokens present and correct` (exit code 0)

- [ ] **Step 4: Test validation against current cosmos-theme.css (expect differences)**

Run: `cd /Users/dvora/Code/data360/data360-starter-kit && node scripts/validate-tokens.mjs --tokens=../theme-playground/dist/tokens.json --css=public/cosmos-theme.css`
Expected: may show mismatches since current file was hand-authored.

- [ ] **Step 5: Add npm script to starter kit package.json**

Add to scripts in `/Users/dvora/Code/data360/data360-starter-kit/package.json`:
```json
"theme:validate-tokens": "node scripts/validate-tokens.mjs --tokens=../theme-playground/dist/tokens.json"
```

- [ ] **Step 6: Commit in starter kit**

```bash
cd /Users/dvora/Code/data360/data360-starter-kit
git add scripts/validate-tokens.mjs package.json package-lock.json
git commit -m "$(cat <<'EOF'
feat: add Tier 1 token validation script

Compares generated cosmos-theme.css against tokens.json to verify
every design token is present with the correct value. Checks mode
parity (dark/light completeness).
EOF
)"
```

---

## Task 7: Tier 2 Validation — Selector Coverage

**Files:**
- Create: `/Users/dvora/Code/data360/data360-starter-kit/scripts/validate-selectors.mjs`

Uses Playwright to check that every selector in the target profile actually hits elements in the running app.

- [ ] **Step 1: Install Playwright in starter kit**

Run: `cd /Users/dvora/Code/data360/data360-starter-kit && npm install playwright --save-dev && npx playwright install chromium`

- [ ] **Step 2: Write the selector validation script**

```javascript
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const args = process.argv.slice(2);
const profilePath = args.find(a => a.startsWith('--profile='))?.split('=')[1];
const appUrl = args.find(a => a.startsWith('--url='))?.split('=')[1] || 'http://localhost:3000';

if (!profilePath) {
  console.error('Usage: node scripts/validate-selectors.mjs --profile=<path-to-profile.json> [--url=<app-url>]');
  process.exit(1);
}

const profile = JSON.parse(readFileSync(resolve(profilePath), 'utf8'));
const darkPrefix = profile.selector_prefix.dark;
const lightPrefix = profile.selector_prefix.light;

// Collect all unique selectors from the profile
function collectSelectors(profileEntry, prefix) {
  const selectors = [];

  if (profileEntry.strategy === 'skip') return selectors;
  if (profileEntry.strategy === 'passthrough' || profileEntry.strategy === 'remap') {
    if (profileEntry.map) {
      for (const targetSel of Object.values(profileEntry.map)) {
        // Split comma-separated selectors
        for (const sel of targetSel.split(',').map(s => s.trim())) {
          selectors.push(`${prefix} ${sel}`);
        }
      }
    }
  }
  return selectors;
}

const allSelectors = [];
for (const [componentKey, entry] of Object.entries(profile.component_selectors)) {
  if (entry.strategy === 'skip') continue;
  if (entry.strategy === 'remap' && entry.map) {
    for (const [playSel, targetSel] of Object.entries(entry.map)) {
      const isLight = playSel.includes('.cosmos-light');
      const prefix = isLight ? lightPrefix : darkPrefix;
      for (const sel of targetSel.split(',').map(s => s.trim())) {
        // Strip pseudo-classes for querySelectorAll (can't query :hover)
        const baseSel = sel.replace(/:hover|:active|:focus/g, '').trim();
        if (baseSel) {
          allSelectors.push({
            component: componentKey,
            selector: `${prefix} ${baseSel}`,
            mode: isLight ? 'light' : 'dark',
            optional: entry.optional || false
          });
        }
      }
    }
  } else if (entry.strategy === 'passthrough') {
    // For passthrough we test the base class exists
    allSelectors.push({
      component: componentKey,
      selector: `${darkPrefix} .${componentKey.replace(/-/g, '-')}`,
      mode: 'dark',
      optional: entry.optional || false
    });
  }
}

// Deduplicate
const unique = [...new Map(allSelectors.map(s => [s.selector, s])).values()];

console.log('─── Tier 2: Selector Coverage Check ───');
console.log(`App URL: ${appUrl}`);
console.log(`Selectors to check: ${unique.length}`);
console.log('');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(appUrl, { waitUntil: 'networkidle', timeout: 30000 });
} catch (e) {
  console.error(`Failed to load ${appUrl}. Is the dev server running?`);
  console.error(`Start it with: npm run dev`);
  await browser.close();
  process.exit(1);
}

const results = { hit: [], miss: [], error: [] };

for (const entry of unique) {
  try {
    // Set body class for the appropriate mode
    const bodyClass = entry.mode === 'dark'
      ? profile.body_class.dark
      : profile.body_class.light;

    await page.evaluate((cls) => {
      document.body.className = cls;
    }, bodyClass);

    // Small delay for styles to apply
    await page.waitForTimeout(100);

    const count = await page.evaluate((sel) => {
      try {
        return document.querySelectorAll(sel).length;
      } catch (e) {
        return -1;
      }
    }, entry.selector);

    if (count === -1) {
      results.error.push({ ...entry, reason: 'Invalid selector syntax' });
    } else if (count === 0) {
      results.miss.push(entry);
    } else {
      results.hit.push({ ...entry, count });
    }
  } catch (e) {
    results.error.push({ ...entry, reason: e.message });
  }
}

await browser.close();

// Report
console.log(`Results:`);
console.log(`  ✓ Hit:   ${results.hit.length}`);
console.log(`  ✗ Miss:  ${results.miss.length}`);
if (results.error.length > 0) console.log(`  ! Error: ${results.error.length}`);
console.log('');

if (results.hit.length > 0) {
  console.log('Hits:');
  for (const r of results.hit) {
    console.log(`  ✓ ${r.selector} — ${r.count} element(s)`);
  }
  console.log('');
}

if (results.miss.length > 0) {
  console.log('Misses:');
  for (const r of results.miss) {
    const flag = r.optional ? ' (optional)' : ' ← ACTION NEEDED';
    console.log(`  ✗ ${r.selector} [${r.component}]${flag}`);
  }
  console.log('');
}

if (results.error.length > 0) {
  console.log('Errors:');
  for (const r of results.error) {
    console.log(`  ! ${r.selector}: ${r.reason}`);
  }
  console.log('');
}

const requiredMisses = results.miss.filter(m => !m.optional);
const coverage = ((results.hit.length) / (results.hit.length + requiredMisses.length) * 100).toFixed(1);
console.log(`Coverage: ${coverage}% (${results.hit.length}/${results.hit.length + requiredMisses.length} required selectors)`);

if (requiredMisses.length > 0) {
  process.exit(1);
} else {
  console.log('✓ All required selectors have matching elements');
  process.exit(0);
}
```

- [ ] **Step 3: Add npm script**

Add to `package.json` scripts:
```json
"theme:validate-selectors": "node scripts/validate-selectors.mjs --profile=../theme-playground/target-profiles/lwc-slds.json"
```

- [ ] **Step 4: Test with dev server running**

Run (terminal 1): `cd /Users/dvora/Code/data360/data360-starter-kit && npm run dev`
Run (terminal 2): `cd /Users/dvora/Code/data360/data360-starter-kit && node scripts/validate-selectors.mjs --profile=../theme-playground/target-profiles/lwc-slds.json`
Expected: coverage report showing hits and misses.

- [ ] **Step 5: Commit**

```bash
cd /Users/dvora/Code/data360/data360-starter-kit
git add scripts/validate-selectors.mjs package.json package-lock.json
git commit -m "$(cat <<'EOF'
feat: add Tier 2 selector coverage validation

Uses Playwright to verify that every selector in the target profile
actually matches elements in the running app. Reports coverage
percentage and identifies missing components.
EOF
)"
```

---

## Task 8: The `/theme-transfer` Skill

**Files:**
- Create: `/Users/dvora/Code/data360/data360-starter-kit/.claude/commands/theme-transfer.md`

This is the Claude Code slash command that orchestrates the full pipeline.

- [ ] **Step 1: Write the skill file**

```markdown
---
name: theme-transfer
description: Transfer Cosmos theme from playground to target repo — export, generate, validate
---

# Theme Transfer Pipeline

Orchestrate the full theme transfer: export from playground → generate for target → validate.

## Arguments

- No args: full pipeline (export → generate → validate Tier 1 + 2)
- `--validate-only`: skip export/generate, just validate current state
- `--visual`: include Tier 3 visual regression
- `--profile=<name>`: override auto-detected target profile

## Hard Rules

1. Every CSS value written MUST trace to tokens.json or components.json — NEVER invent a value
2. Every selector MUST come from the target profile — NEVER invent a selector
3. NEVER modify files in the playground repo (theme.css, components.css, index.html, app.js)
4. On ANY ambiguity: STOP and ask the user, do not guess
5. On validation failure: REPORT the failure clearly, do not silently fix

## Pipeline Steps

### Step 1: Locate Playground

Check for the playground in this order:
1. `../theme-playground` (sister directory)
2. If not found, ask the user for the path

Verify it contains: `theme.css`, `components.css`, `scripts/export.mjs`, `package.json`

### Step 2: Run Export

```bash
cd <playground-path> && npm run export
```

Verify `dist/` contains:
- `tokens.json` — report token counts (shared, dark, light)
- `components.json` — report component count
- `ambient.css`

If export fails, STOP and report the error.

### Step 3: Detect Target Profile

Auto-detect based on current working directory:
- Has `vite.config.js` + `src/modules/` → use `lwc-slds`
- Has `package.json` with `react` dependency → use `react-generic`
- Otherwise → ask user which profile to use

### Step 4: Run Generate

```bash
cd <playground-path> && node scripts/generate.mjs --profile=<detected> --output=<target-delivery-path>
```

The output path comes from `profile.delivery.file` resolved against the target repo root.

Report:
- Generated file path and size
- Number of tokens and components included
- Any unmapped components (list them and ask user what to do):
  - "Create component" → invoke `lwc-new-component` skill
  - "Add mapping" → ask for the SLDS selector, update target profile
  - "Skip" → continue without this component

### Step 5: Run Validation

**Tier 1 (always):**
```bash
cd <target-repo> && node scripts/validate-tokens.mjs --tokens=<playground>/dist/tokens.json --css=<generated-file>
```

Report pass/fail. On failure, show exactly which tokens are missing or mismatched.

**Tier 2 (always, requires dev server):**
Check if dev server is running at the expected URL. If not, start it:
```bash
cd <target-repo> && npm run dev &
```

Then run:
```bash
node scripts/validate-selectors.mjs --profile=<playground>/target-profiles/<profile>.json
```

Report coverage percentage and any misses. On misses:
- If optional: note as warning
- If required: ask user what to do:
  - "Create component with lwc-new-component" → invoke skill
  - "Skip for now"
  - "Investigate" → check what classes the target element actually has

**Tier 3 (only with --visual flag):**
```bash
node scripts/validate-visual.mjs --references=<playground>/dist/screenshots/ --routes=visual-test-routes.json
```

Show diffs for any failures. Ask user to accept or investigate.

### Step 6: Write Version File

After successful validation, write `.cosmos-theme-version` in the target repo:
```
<version from tokens.json>
```

### Step 7: Summary Report

```
Theme Transfer Complete
═══════════════════════
Source: <playground-path> (version X.Y.Z)
Target: <target-repo> (<profile-name>)
Output: <delivery-file>

Tokens:     XX/XX ✓
Selectors:  XX/XX (Y skipped)
Visual:     XX/XX ✓ (or "skipped")

Version written: .cosmos-theme-version = X.Y.Z
```
```

- [ ] **Step 2: Verify the skill file is accessible**

Run: `ls /Users/dvora/Code/data360/data360-starter-kit/.claude/commands/theme-transfer.md`
Expected: file exists

- [ ] **Step 3: Commit**

```bash
cd /Users/dvora/Code/data360/data360-starter-kit
git add .claude/commands/theme-transfer.md
git commit -m "$(cat <<'EOF'
feat: add /theme-transfer Claude Code skill

Orchestrates the full theme transfer pipeline: locate playground,
export, generate, validate (Tier 1 + 2), and report.
EOF
)"
```

---

## Task 9: Tier 3 Validation — Visual Regression

**Files:**
- Create: `/Users/dvora/Code/data360/data360-starter-kit/scripts/validate-visual.mjs`
- Create: `/Users/dvora/Code/data360/data360-starter-kit/visual-test-routes.json`

Screenshot comparison using Playwright + pixelmatch.

- [ ] **Step 1: Install pixelmatch and pngjs in starter kit**

Run: `cd /Users/dvora/Code/data360/data360-starter-kit && npm install pixelmatch pngjs --save-dev`

- [ ] **Step 2: Create visual-test-routes.json**

```json
{
  "full-dark": {
    "url": "/",
    "bodyClass": "cosmos-dark slds-color-scheme_dark",
    "selector": "#app",
    "viewport": [1440, 900],
    "waitFor": "shell-app"
  },
  "full-light": {
    "url": "/",
    "bodyClass": "cosmos-light",
    "selector": "#app",
    "viewport": [1440, 900],
    "waitFor": "shell-app"
  }
}
```

- [ ] **Step 3: Write the visual validation script**

```javascript
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const args = process.argv.slice(2);
const referencesPath = args.find(a => a.startsWith('--references='))?.split('=')[1];
const routesPath = args.find(a => a.startsWith('--routes='))?.split('=')[1] || join(ROOT, 'visual-test-routes.json');
const appUrl = args.find(a => a.startsWith('--url='))?.split('=')[1] || 'http://localhost:3000';
const threshold = parseFloat(args.find(a => a.startsWith('--threshold='))?.split('=')[1] || '0.05');

if (!referencesPath) {
  console.error('Usage: node scripts/validate-visual.mjs --references=<path> [--routes=<path>] [--url=<url>] [--threshold=<0-1>]');
  process.exit(1);
}

const routes = JSON.parse(readFileSync(resolve(routesPath), 'utf8'));
const outputDir = join(ROOT, 'validation-output');
mkdirSync(outputDir, { recursive: true });

console.log('─── Tier 3: Visual Regression Check ───');
console.log(`App URL: ${appUrl}`);
console.log(`Reference: ${referencesPath}`);
console.log(`Threshold: ${(threshold * 100).toFixed(1)}%`);
console.log('');

const browser = await chromium.launch({ headless: true });
const results = { pass: [], fail: [], skip: [] };

for (const [name, config] of Object.entries(routes)) {
  const refFile = join(resolve(referencesPath), `${name}.png`);

  if (!existsSync(refFile)) {
    results.skip.push({ name, reason: 'No reference screenshot' });
    continue;
  }

  const page = await browser.newPage();
  await page.setViewportSize({ width: config.viewport[0], height: config.viewport[1] });

  try {
    await page.goto(appUrl + (config.url || '/'), { waitUntil: 'networkidle', timeout: 30000 });

    if (config.bodyClass) {
      await page.evaluate((cls) => { document.body.className = cls; }, config.bodyClass);
      await page.waitForTimeout(500);
    }

    if (config.waitFor) {
      await page.waitForSelector(config.waitFor, { timeout: 10000 });
    }

    let element = page;
    if (config.selector && config.selector !== '#app') {
      const el = await page.$(config.selector);
      if (el) element = el;
    }

    const screenshot = await element.screenshot();
    const actualPNG = PNG.sync.read(screenshot);

    const refBuffer = readFileSync(refFile);
    const refPNG = PNG.sync.read(refBuffer);

    // Resize check
    if (actualPNG.width !== refPNG.width || actualPNG.height !== refPNG.height) {
      results.fail.push({ name, reason: `Size mismatch: actual ${actualPNG.width}x${actualPNG.height} vs ref ${refPNG.width}x${refPNG.height}` });
      writeFileSync(join(outputDir, `${name}-actual.png`), screenshot);
      await page.close();
      continue;
    }

    const diff = new PNG({ width: actualPNG.width, height: actualPNG.height });
    const numDiffPixels = pixelmatch(
      actualPNG.data, refPNG.data, diff.data,
      actualPNG.width, actualPNG.height,
      { threshold: 0.1 }
    );

    const totalPixels = actualPNG.width * actualPNG.height;
    const diffPercent = numDiffPixels / totalPixels;

    if (diffPercent > threshold) {
      results.fail.push({ name, diffPercent: (diffPercent * 100).toFixed(2) });
      writeFileSync(join(outputDir, `${name}-actual.png`), screenshot);
      writeFileSync(join(outputDir, `${name}-diff.png`), PNG.sync.write(diff));
    } else {
      results.pass.push({ name, diffPercent: (diffPercent * 100).toFixed(2) });
    }
  } catch (e) {
    results.fail.push({ name, reason: e.message });
  }

  await page.close();
}

await browser.close();

// Report
console.log('Results:');
if (results.pass.length > 0) {
  for (const r of results.pass) {
    console.log(`  ✓ ${r.name} (${r.diffPercent}% diff)`);
  }
}
if (results.fail.length > 0) {
  for (const r of results.fail) {
    const detail = r.diffPercent ? `${r.diffPercent}% diff` : r.reason;
    console.log(`  ✗ ${r.name} — ${detail}`);
  }
}
if (results.skip.length > 0) {
  for (const r of results.skip) {
    console.log(`  ⊘ ${r.name} — ${r.reason}`);
  }
}

console.log('');
console.log(`Pass: ${results.pass.length}, Fail: ${results.fail.length}, Skip: ${results.skip.length}`);

if (results.fail.length > 0) {
  console.log(`\nDiff images saved to: ${outputDir}/`);
  process.exit(1);
} else {
  console.log('\n✓ All visual checks passed');
  process.exit(0);
}
```

- [ ] **Step 4: Add npm script and gitignore for output**

Add to `package.json` scripts:
```json
"theme:validate-visual": "node scripts/validate-visual.mjs --references=../theme-playground/dist/screenshots"
```

Add to `.gitignore`:
```
validation-output/
```

- [ ] **Step 5: Commit**

```bash
cd /Users/dvora/Code/data360/data360-starter-kit
git add scripts/validate-visual.mjs visual-test-routes.json package.json package-lock.json .gitignore
git commit -m "$(cat <<'EOF'
feat: add Tier 3 visual regression validation

Compares screenshots of running app against playground reference images
using pixelmatch. Saves diff images to validation-output/ for review.
EOF
)"
```

---

## Task 10: Playground Screenshot Export

**Files:**
- Modify: `/Users/dvora/Code/data360/theme-playground/scripts/export.mjs`

Add Playwright screenshot capture to the export script so reference images are generated alongside tokens and components.

- [ ] **Step 1: Add screenshot capture to export.mjs**

Append to the end of `scripts/export.mjs`:

```javascript
import { chromium } from 'playwright';

async function captureScreenshots() {
  const screenshotsDir = join(DIST, 'screenshots');
  mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // Serve the playground locally
  const { createServer } = await import('node:http');
  const { readFile } = await import('node:fs/promises');
  const { extname } = await import('node:path');

  const mimeTypes = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
    '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml'
  };

  const server = createServer(async (req, res) => {
    const filePath = join(ROOT, req.url === '/' ? 'index.html' : req.url);
    try {
      const content = await readFile(filePath);
      const ext = extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  // Capture dark mode full page
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(screenshotsDir, 'full-dark.png'), fullPage: true });

  // Switch to light mode
  await page.evaluate(() => {
    document.body.classList.remove('cosmos-dark');
    document.body.classList.add('cosmos-light');
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(screenshotsDir, 'full-light.png'), fullPage: true });

  await browser.close();
  server.close();
  console.log('Captured reference screenshots to dist/screenshots/');
}

await captureScreenshots();
```

Note: This requires changing the export script to use top-level await. Add to the top of the file after imports:

```javascript
// (existing imports stay)
import { chromium } from 'playwright';
```

And wrap the existing synchronous code as-is (it already runs at top level in ESM).

- [ ] **Step 2: Run full export with screenshots**

Run: `cd /Users/dvora/Code/data360/theme-playground && node scripts/export.mjs`
Expected: all previous output plus `Captured reference screenshots to dist/screenshots/`

- [ ] **Step 3: Verify screenshots exist**

Run: `ls /Users/dvora/Code/data360/theme-playground/dist/screenshots/`
Expected: `full-dark.png`, `full-light.png`

- [ ] **Step 4: Commit**

```bash
cd /Users/dvora/Code/data360/theme-playground
git add scripts/export.mjs dist/screenshots/
git commit -m "$(cat <<'EOF'
feat: export script captures reference screenshots

Serves playground locally, captures full-page screenshots in both
dark and light modes as visual regression references.
EOF
)"
```

---

## Task 11: React/Generic Target Profile

**Files:**
- Create: `/Users/dvora/Code/data360/theme-playground/target-profiles/react-generic.json`

- [ ] **Step 1: Create the React target profile**

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
  "selector_prefix": {
    "dark": ".cosmos-dark",
    "light": ".cosmos-light"
  },
  "component_selectors": {
    "layout": {
      "strategy": "passthrough",
      "notes": "Playground classes used directly — prefix with .cosmos-dark/.cosmos-light"
    },
    "buttons": {
      "strategy": "passthrough",
      "notes": "Playground button classes (.btn, .btn-brand, etc.) used directly in React targets"
    },
    "icons": {
      "strategy": "passthrough"
    },
    "card": {
      "strategy": "passthrough"
    },
    "input": {
      "strategy": "passthrough"
    },
    "select": {
      "strategy": "passthrough"
    },
    "data-table": {
      "strategy": "passthrough"
    },
    "vertical-nav": {
      "strategy": "passthrough"
    },
    "badge": {
      "strategy": "passthrough"
    },
    "toast": {
      "strategy": "passthrough"
    },
    "modal": {
      "strategy": "passthrough"
    },
    "dropdown": {
      "strategy": "passthrough"
    },
    "datepicker": {
      "strategy": "passthrough"
    },
    "heading": {
      "strategy": "passthrough"
    },
    "plan-builder": {
      "strategy": "passthrough",
      "optional": true
    }
  },
  "notes": "React/plain HTML targets use playground class names directly. The generated CSS simply prefixes all rules with .cosmos-dark/.cosmos-light for mode scoping."
}
```

- [ ] **Step 2: Test generation with React profile**

Run: `cd /Users/dvora/Code/data360/theme-playground && node scripts/generate.mjs --profile=react-generic`
Expected: generates `dist/generated-react-generic.css`

- [ ] **Step 3: Verify output uses .cosmos-dark/.cosmos-light prefixes (not body.)**

Run: `head -30 /Users/dvora/Code/data360/theme-playground/dist/generated-react-generic.css`
Expected: `.cosmos-dark {` and `.cosmos-light {` (without `body.` prefix)

- [ ] **Step 4: Commit**

```bash
cd /Users/dvora/Code/data360/theme-playground
git add target-profiles/react-generic.json
git commit -m "$(cat <<'EOF'
feat: add React/plain HTML target profile

Uses passthrough strategy for all components since playground class
names are used directly in non-LWC targets. Only adds mode scoping.
EOF
)"
```

---

## Task 12: End-to-End Pipeline Test

**Files:** None new — this task validates the full pipeline works together.

- [ ] **Step 1: Run full export**

Run: `cd /Users/dvora/Code/data360/theme-playground && npm run export`
Expected: tokens, components, ambient, screenshots all generated.

- [ ] **Step 2: Run generate targeting starter kit**

Run: `cd /Users/dvora/Code/data360/theme-playground && node scripts/generate.mjs --profile=lwc-slds --output=/Users/dvora/Code/data360/data360-starter-kit/public/cosmos-theme-generated.css`
Expected: file generated at target path.

- [ ] **Step 3: Run Tier 1 validation**

Run: `cd /Users/dvora/Code/data360/data360-starter-kit && node scripts/validate-tokens.mjs --tokens=../theme-playground/dist/tokens.json --css=public/cosmos-theme-generated.css`
Expected: `✓ All tokens present and correct`

- [ ] **Step 4: Start dev server and run Tier 2**

Run (if not already running): `cd /Users/dvora/Code/data360/data360-starter-kit && npm run dev &`
Run: `cd /Users/dvora/Code/data360/data360-starter-kit && node scripts/validate-selectors.mjs --profile=../theme-playground/target-profiles/lwc-slds.json`
Expected: coverage report. Some misses are expected (components that don't exist yet).

- [ ] **Step 5: Write .cosmos-theme-version**

Run: `echo "1.0.0" > /Users/dvora/Code/data360/data360-starter-kit/.cosmos-theme-version`

- [ ] **Step 6: Commit the generated test file (not replacing original yet)**

```bash
cd /Users/dvora/Code/data360/data360-starter-kit
git add .cosmos-theme-version
git commit -m "$(cat <<'EOF'
chore: add .cosmos-theme-version tracking file

Records which playground version was last applied to this target.
EOF
)"
```

- [ ] **Step 7: Clean up — remove the test generated file**

Run: `rm /Users/dvora/Code/data360/data360-starter-kit/public/cosmos-theme-generated.css`

The generated file was for testing. The actual replacement of `cosmos-theme.css` should be done via `/theme-transfer` in a real run.

---

## Notes

- The existing `public/cosmos-theme.css` in the starter kit (1529 lines, hand-authored) is NOT replaced by this plan. It remains as-is until the user explicitly runs `/theme-transfer` to replace it with generated output. The generated file may differ from the hand-authored one — that's expected and intentional. The pipeline is the new source of truth going forward.
- The `lwc-slds.json` target profile selector mappings will likely need refinement after the first Tier 2 run reveals which selectors actually hit in the running app. This is expected — the profile evolves based on real validation data.
- Brand overrides (`cosmos-brand-*.css`) are out of scope for this plan. They can be added as a follow-on by extending the export script to handle brand CSS files.
