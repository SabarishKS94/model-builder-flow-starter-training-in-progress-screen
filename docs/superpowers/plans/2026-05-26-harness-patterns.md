# Harness Patterns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add QSL-style guardrails (lint hook, skill gates, label pattern) so all contributors produce consistent, production-portable LWC code.

**Architecture:** A PostToolUse lint hook (`scripts/lint-architecture-rules.mjs`) runs after every Write/Edit to catch namespace violations, CSS misplacement, and hardcoded strings. CLAUDE.md gets mandatory skill gates. A `data/labels/` module provides the i18n-ready pattern.

**Tech Stack:** Node.js (ESM, zero deps), Claude Code hooks (settings.json), LWC

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `scripts/lint-architecture-rules.mjs` | Create | Lint hook — namespace, CSS, label checks |
| `src/modules/data/labels/Common.js` | Create | Shared labels (Cancel, Save, Close, etc.) |
| `src/modules/data/labels/Home.js` | Create | Example per-page label file |
| `CLAUDE.md` | Modify | Add skill gates + label pattern sections |
| `.claude/settings.json` | Create | PostToolUse hook config |

---

### Task 1: Create the lint hook script

**Files:**
- Create: `scripts/lint-architecture-rules.mjs`

- [ ] **Step 1: Create lint-architecture-rules.mjs**

```javascript
#!/usr/bin/env node
/**
 * lint-architecture-rules.mjs
 *
 * Enforces architecture rules for data360-starter-kit:
 *
 *   Check 1: Namespace placement — files under src/modules/ must be in
 *            shell/, page/, ui/, or data/.
 *
 *   Check 2: CSS responsibility — cosmosApp.css must not contain visual
 *            properties; cosmos-theme.css must not contain layout properties.
 *
 *   Check 3: i18n-ready labels — HTML templates must not have hardcoded
 *            strings in user-facing attributes.
 *
 * Modes:
 *   Full scan:   node scripts/lint-architecture-rules.mjs
 *   Single file: node scripts/lint-architecture-rules.mjs --file <path>
 *   Hook mode:   node scripts/lint-architecture-rules.mjs --hook  (reads stdin JSON)
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { basename, extname, join, relative, resolve } from 'path';

const ROOT = resolve(new URL('.', import.meta.url).pathname, '..');
const SRC = join(ROOT, 'src', 'modules');
const PUBLIC = join(ROOT, 'public');

const VALID_NAMESPACES = new Set(['shell', 'page', 'ui', 'data']);

const VISUAL_PROPERTIES = [
    'background', 'background-color', 'background-image',
    'backdrop-filter', 'border-color', 'border-top-color',
    'border-bottom-color', 'border-left-color', 'border-right-color',
    'box-shadow', 'color', 'fill', 'stroke',
];

const LAYOUT_PROPERTIES = [
    'position', 'z-index', 'top', 'left', 'right', 'bottom',
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
    'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
    'display', 'flex', 'grid',
];

const I18N_ATTRS = ['title', 'label', 'placeholder', 'alternative-text', 'aria-label'];
const ATTR_REGEX = new RegExp(
    `\\b(${I18N_ATTRS.join('|')})="([^"]*)"`,
    'g'
);

// ── Helpers ──

function walkDir(dir, cb) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
            walkDir(full, cb);
        } else if (stat.isFile()) {
            cb(full);
        }
    }
}

// ── Check 1: Namespace placement ──

function checkNamespace(filePath) {
    const violations = [];
    const relToSrc = relative(SRC, filePath);

    if (relToSrc.startsWith('..')) return violations;

    const namespace = relToSrc.split('/')[0];
    if (!VALID_NAMESPACES.has(namespace)) {
        violations.push({
            check: 'Namespace',
            file: relative(ROOT, filePath),
            detail: `"${namespace}/" is not a valid namespace. Use: shell/, page/, ui/, or data/`,
            blocking: true,
        });
    }
    return violations;
}

// ── Check 2: CSS responsibility ──

function checkCssResponsibility(filePath) {
    const violations = [];
    const rel = relative(ROOT, filePath);

    if (extname(filePath) !== '.css') return violations;

    let content;
    try {
        content = readFileSync(filePath, 'utf8');
    } catch {
        return violations;
    }

    const lines = content.split('\n');
    const isCosmosAppCss = rel.includes('shell/cosmosApp/cosmosApp.css');
    const isCosmosThemeCss = rel === 'public/cosmos-theme.css';

    if (!isCosmosAppCss && !isCosmosThemeCss) return violations;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('/*') || line.startsWith('*') || line.startsWith('//')) continue;

        if (isCosmosAppCss) {
            for (const prop of VISUAL_PROPERTIES) {
                const re = new RegExp(`^${prop}\\s*:`);
                if (re.test(line) && !line.includes('transparent') && !line.includes('inherit')) {
                    violations.push({
                        check: 'CSS Responsibility',
                        file: rel,
                        line: i + 1,
                        detail: `Visual property "${prop}" belongs in public/cosmos-theme.css, not cosmosApp.css`,
                        blocking: false,
                    });
                }
            }
        }

        if (isCosmosThemeCss) {
            for (const prop of LAYOUT_PROPERTIES) {
                const re = new RegExp(`^${prop}\\s*:`);
                if (re.test(line)) {
                    violations.push({
                        check: 'CSS Responsibility',
                        file: rel,
                        line: i + 1,
                        detail: `Layout property "${prop}" belongs in cosmosApp.css, not cosmos-theme.css`,
                        blocking: false,
                    });
                }
            }
        }
    }
    return violations;
}

// ── Check 3: Label enforcement ──

function checkLabels(filePath) {
    const violations = [];
    if (extname(filePath) !== '.html') return violations;

    const relToSrc = relative(SRC, filePath);
    if (!relToSrc.startsWith('ui/') && !relToSrc.startsWith('page/') && !relToSrc.startsWith('shell/')) {
        return violations;
    }

    let content;
    try {
        content = readFileSync(filePath, 'utf8');
    } catch {
        return violations;
    }

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let m;
        ATTR_REGEX.lastIndex = 0;
        while ((m = ATTR_REGEX.exec(line)) !== null) {
            const attr = m[1];
            const value = m[2];
            if (value === '') continue;
            if (!/[a-zA-Z]/.test(value)) continue;
            violations.push({
                check: 'Label',
                file: relative(ROOT, filePath),
                line: i + 1,
                detail: `${attr}="${value}" — import from data/labels/ and use ${attr}={labels.Key}`,
                blocking: false,
            });
        }
    }
    return violations;
}

// ── Check 4: Component completeness ──

function checkCompleteness(filePath) {
    const violations = [];
    const relToSrc = relative(SRC, filePath);

    if (!relToSrc.startsWith('page/') && !relToSrc.startsWith('ui/')) return violations;

    const parts = relToSrc.split('/');
    if (parts.length < 3) return violations;

    const componentDir = join(SRC, parts[0], parts[1]);
    const componentName = parts[1];

    const hasHtml = existsSync(join(componentDir, `${componentName}.html`));
    const hasJs = existsSync(join(componentDir, `${componentName}.js`));

    if (!hasHtml && extname(filePath) === '.js') {
        violations.push({
            check: 'Completeness',
            file: relative(ROOT, filePath),
            detail: `Missing ${componentName}.html — every page/ and ui/ component needs an HTML template`,
            blocking: false,
        });
    }
    if (!hasJs && extname(filePath) === '.html') {
        violations.push({
            check: 'Completeness',
            file: relative(ROOT, filePath),
            detail: `Missing ${componentName}.js — every page/ and ui/ component needs a JS module`,
            blocking: false,
        });
    }
    return violations;
}

// ── Orchestration ──

function checkFile(filePath) {
    return [
        ...checkNamespace(filePath),
        ...checkCssResponsibility(filePath),
        ...checkLabels(filePath),
        ...checkCompleteness(filePath),
    ];
}

function report(violations, isHook) {
    if (violations.length === 0) {
        if (!isHook) console.log('lint-architecture-rules: ✓ no violations');
        process.exit(0);
    }

    const blocking = violations.filter((v) => v.blocking);
    const warnings = violations.filter((v) => !v.blocking);

    if (warnings.length > 0) {
        console.log(`\n⚠️  lint-architecture-rules: ${warnings.length} warning(s)\n`);
        for (const v of warnings) {
            const loc = v.line ? `:${v.line}` : '';
            console.log(`  [${v.check}] ${v.file}${loc}`);
            console.log(`    → ${v.detail}\n`);
        }
    }

    if (blocking.length > 0) {
        console.log(`\n❌ lint-architecture-rules: ${blocking.length} violation(s)\n`);
        for (const v of blocking) {
            const loc = v.line ? `:${v.line}` : '';
            console.log(`  [${v.check}] ${v.file}${loc}`);
            console.log(`    → ${v.detail}\n`);
        }
        process.exit(1);
    }

    process.exit(0);
}

// ── CLI / Hook entry ──

async function parseHookStdin() {
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }
    try {
        const json = JSON.parse(Buffer.concat(chunks).toString());
        return json?.tool_input?.file_path || json?.tool_input?.path || null;
    } catch {
        return null;
    }
}

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--hook')) {
        const filePath = await parseHookStdin();
        if (!filePath) process.exit(0);

        const abs = resolve(ROOT, filePath);
        if (!abs.startsWith(SRC) && !abs.startsWith(PUBLIC)) process.exit(0);
        if (!/\.(js|html|css)$/.test(abs)) process.exit(0);

        const violations = checkFile(abs);
        report(violations, true);
        return;
    }

    if (args.includes('--file')) {
        const idx = args.indexOf('--file');
        const filePath = args[idx + 1];
        if (!filePath) {
            console.error('Usage: lint-architecture-rules.mjs --file <path>');
            process.exit(1);
        }
        const abs = resolve(ROOT, filePath);
        const violations = checkFile(abs);
        report(violations, false);
        return;
    }

    // Full scan
    const violations = [];
    for (const ns of ['ui', 'page', 'shell']) {
        const nsDir = join(SRC, ns);
        try {
            walkDir(nsDir, (f) => {
                violations.push(...checkFile(f));
            });
        } catch {
            // namespace dir may not exist
        }
    }

    // Also check CSS files
    const cosmosAppCss = join(SRC, 'shell', 'cosmosApp', 'cosmosApp.css');
    const cosmosThemeCss = join(PUBLIC, 'cosmos-theme.css');
    if (existsSync(cosmosAppCss)) violations.push(...checkCssResponsibility(cosmosAppCss));
    if (existsSync(cosmosThemeCss)) violations.push(...checkCssResponsibility(cosmosThemeCss));

    report(violations, false);
}

main();
```

- [ ] **Step 2: Verify the script runs without errors**

Run: `node scripts/lint-architecture-rules.mjs`

Expected: Prints warnings for existing hardcoded labels (these are known — the retrofit is a follow-up task). Should NOT exit 1 (no blocking namespace violations in current code).

- [ ] **Step 3: Test hook mode with a valid file**

Run: `echo '{"tool_input":{"file_path":"src/modules/page/home/home.html"}}' | node scripts/lint-architecture-rules.mjs --hook`

Expected: Prints label warnings for the home page template, exits 0.

- [ ] **Step 4: Test hook mode with an irrelevant file**

Run: `echo '{"tool_input":{"file_path":"package.json"}}' | node scripts/lint-architecture-rules.mjs --hook`

Expected: Exits 0 silently (file outside src/modules/ and public/).

- [ ] **Step 5: Commit**

```bash
git add scripts/lint-architecture-rules.mjs
git commit -m "feat: add architecture lint hook for namespace, CSS, and label checks"
```

---

### Task 2: Create labels scaffolding

**Files:**
- Create: `src/modules/data/labels/Common.js`
- Create: `src/modules/data/labels/Home.js`

- [ ] **Step 1: Create Common.js with shared labels**

```javascript
// Shared labels used across multiple components.
// Mirrors @salesforce/label/ pattern — porting is a path swap.
export const Cancel = 'Cancel';
export const Save = 'Save';
export const Close = 'Close';
export const Back = 'Back';
export const Next = 'Next';
export const Delete = 'Delete';
export const Edit = 'Edit';
export const Loading = 'Loading';
export const Error = 'Error';
export const Success = 'Success';
export const Confirm = 'Confirm';
export const Search = 'Search';
```

- [ ] **Step 2: Create Home.js as a per-page example**

```javascript
// Labels for the Home page.
// One file per page/feature area. Import in component JS:
//   import { InputComponents, ... } from 'data/labels/Home';
export const InputComponents = 'Input Components';
export const SelectionComponents = 'Selection Components';
export const OtherInputTypes = 'Other Input Types';
export const ButtonVariants = 'Button Variants';
export const IconButtons = 'Icon Buttons';
export const Badges = 'Badges';
export const ModalDemo = 'Modal Demo';
export const ToastNotifications = 'Toast Notifications';
export const LoadingSpinner = 'Loading Spinner';
export const ToggleSwitch = 'Toggle Switch';
export const OpenModal = 'Open modal';
export const TextInput = 'Text Input';
export const EmailInput = 'Email Input';
export const PhoneNumber = 'Phone Number';
export const DatePicker = 'Date Picker';
export const SliderControl = 'Slider Control';
export const TextArea = 'Text Area';
export const EnableFeature = 'Enable Feature';
export const FooterText = 'Built with Vite + LWC + Lightning Base Components + SLDS';
```

- [ ] **Step 3: Verify label modules resolve**

Run: `node -e "import('file:///$(pwd)/src/modules/data/labels/Common.js').then(m => console.log(Object.keys(m).length + ' labels'))"`

Expected: `12 labels`

- [ ] **Step 4: Commit**

```bash
git add src/modules/data/labels/Common.js src/modules/data/labels/Home.js
git commit -m "feat: add i18n-ready labels scaffolding with Common and Home modules"
```

---

### Task 3: Update CLAUDE.md with skill gates and label pattern

**Files:**
- Modify: `CLAUDE.md:17-19` (replace "no lint" line)
- Modify: `CLAUDE.md:74-92` (add after Key Conventions)

- [ ] **Step 1: Update the Commands section**

Replace:
```
There are no lint or test commands configured.
```

With:
```
npm run lint:arch    # Check architecture rules (namespace, CSS, labels)
```

- [ ] **Step 2: Add Mandatory Skill Gates section after Synthetic Shadow DOM**

Append to the end of CLAUDE.md:

```markdown
## Mandatory Skill Gates for LWC Work

These skills MUST be invoked before taking the associated action. Do not skip them or act first and check later.

| Trigger | Skill to invoke | When |
|---------|----------------|------|
| Creating any new component under `src/modules/` | `lwc-new-component:lwc-new-component` | Before creating any files |
| Writing or editing `.html`, `.css`, `.js` in `src/modules/` | `lwc-ui-checklist:lwc-ui-checklist` | Before writing any markup, styling, or logic |
| Editing `cosmos-theme.css`, `cosmosApp.css`, or brand CSS | `/theme-audit` | Before writing any change |
| Adding a new page or nav item | `add-nav-item:add-nav-item` | Before creating route or nav entry |

These gates exist to ensure SLDS compliance, correct LWC patterns, and theme architecture rules are applied from the start, not retrofitted after the fact.

## i18n-Ready Label Pattern

No hardcoded user-facing strings in component templates. All user-visible text must be imported from `src/modules/data/labels/<FeatureArea>.js`.

**Label module pattern:**
```javascript
// src/modules/data/labels/Contacts.js
export const PageTitle = 'Contacts';
export const SearchPlaceholder = 'Search contacts...';
```

**Component usage:**
```javascript
import { PageTitle, SearchPlaceholder } from 'data/labels/Contacts';
export default class PageContacts extends LightningElement {
    labels = { PageTitle, SearchPlaceholder };
}
```

**Template binding:**
```html
<h1>{labels.PageTitle}</h1>
<lightning-input label={labels.SearchPlaceholder}></lightning-input>
```

**Rules:**
- One file per page or feature area (`Home.js`, `Contacts.js`, `ChurnRateSegment.js`)
- Shared labels ("Cancel", "Save", "Close") go in `Common.js`
- Template binds via `{labels.MyLabel}`, never inline text
- Mirrors core's `@salesforce/label/` pattern — porting is a path swap
- The lint hook (`scripts/lint-architecture-rules.mjs`) warns on hardcoded strings in `title`, `label`, `placeholder`, `alternative-text`, `aria-label` attributes
```

- [ ] **Step 3: Verify CLAUDE.md is well-formed**

Run: `head -5 CLAUDE.md && echo "..." && tail -5 CLAUDE.md`

Expected: File starts with `# CLAUDE.md` header and ends with the label pattern section.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add mandatory skill gates and i18n label pattern to CLAUDE.md"
```

---

### Task 4: Create .claude/settings.json with PostToolUse hook

**Files:**
- Create: `.claude/settings.json`

- [ ] **Step 1: Create settings.json**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node scripts/lint-architecture-rules.mjs --hook"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Add lint:arch script to package.json**

In `package.json` under `"scripts"`, add:
```json
"lint:arch": "node scripts/lint-architecture-rules.mjs"
```

- [ ] **Step 3: Verify hook would fire correctly**

Run: `echo '{"tool_input":{"file_path":"src/modules/ui/example/example.html"}}' | node scripts/lint-architecture-rules.mjs --hook`

Expected: Exits 0 (with any label warnings from that file).

- [ ] **Step 4: Commit**

```bash
git add .claude/settings.json package.json
git commit -m "chore: add PostToolUse lint hook and lint:arch npm script"
```

---

### Task 5: End-to-end verification

- [ ] **Step 1: Run full lint scan**

Run: `npm run lint:arch`

Expected: Prints label warnings (known — existing templates have hardcoded strings). Exits 0 (no blocking violations).

- [ ] **Step 2: Verify hook mode integration**

Run: `echo '{"tool_input":{"file_path":"src/modules/shell/cosmosApp/cosmosApp.css"}}' | node scripts/lint-architecture-rules.mjs --hook`

Expected: Exits 0 silently (cosmosApp.css currently only has layout — no visual property violations).

- [ ] **Step 3: Test a violation scenario**

Create a temp file to test namespace violation detection:

Run: `mkdir -p src/modules/invalid && echo "<template></template>" > src/modules/invalid/test.html && node scripts/lint-architecture-rules.mjs --file src/modules/invalid/test.html; rm -rf src/modules/invalid`

Expected: Exits 1 with `[Namespace]` violation: "invalid/" is not a valid namespace.

- [ ] **Step 4: Final commit with all files verified**

No commit needed here — all individual tasks committed above. Verify clean state:

Run: `git status`

Expected: Clean working tree, all changes committed.
