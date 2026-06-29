# Data 360 Starter Kit

A **Data 360–aligned** app shell for **Lightning Web Components (LWC)** in the browser: vertical nav, data-app patterns, and SLDS 2, with **Vite** for a fast local loop. It exists so UX and product can explore **Data 360–style** flows without the full platform, while the DOM and design language stay close to what ships on Salesforce (synthetic shadow, Lightning base components, SLDS).

**In short:** use this to prototype the **D360** experience, test navigation and pages, and hand patterns to eng when the design is ready.

## Who it’s for

- **Data 360** UX, PM, and partner teams that need a realistic shell without a scratch org.  
- Engineers who want a **vibe-coded** starting point and will align later with the platform’s deployment model.

## Getting started

Clone the starter directly, then set up your own GitHub repo for team collaboration.

**1. Clone and rename the remote:**
```bash
git clone https://git.soma.salesforce.com/a360/d360-prototype-starter.git my-project
cd my-project
git remote rename origin starter
```

**2. Create a new GitHub repo** for your project, then add it as `origin` and push:
```bash
git remote add origin https://github.com/MY-ORG/MY-PROJECT.git
git push -u origin main
```

You now have two remotes: **`origin`** (your project — push daily work here) and **`starter`** (the template — fetch from here to pull improvements).

**Why not fork?** GitHub forks auto-link PR numbers to the upstream template's issues. Your project's `Merge pull request #5` links to the *starter's* PR #5, not yours — confusing for your team. A direct clone avoids this entirely.

## First-time setup

```bash
sh scripts/setup.sh
```

Checks **Node.js**, creates **`.env`** from **`.env.example`** when missing, runs **`npm install`**. Re-run any time.

**Or ask an agent:** paste the **base prompt** from [**`docs/setup-with-agent.md`**](docs/setup-with-agent.md) into Cursor, Claude Code, or similar — it will run setup for you.

> **QSL** (`d360-qsl-ux-prototype`) has a heftier `setup.sh` (Homebrew, `gh` to git.soma, Claude plugins). This starter keeps setup **portable** for anyone with Node.

## Day-to-day

```bash
npm run dev
```

Open **[http://localhost:4360](http://localhost:4360)**.

```bash
npm run build
npm run preview
```

**Auth for local work** — `.env` (create via setup or from `.env.example`):
- **`VITE_AUTH_MODE=none`** — default: no Google login; a placeholder user in the header.  
- **`VITE_AUTH_MODE=salesforce`** + **`VITE_FIREBASE_*`** — real Firebase / Google for `@salesforce.com`.  
- **`VITE_REQUIRE_AUTH=false`** — same as `none` (legacy).

Change **`.env`**, then restart the dev server.

## Syncing starter improvements into your project

When the template ships new shell components, lint rules, or improvements, pull them into your project:
```bash
git fetch starter
git merge starter/main
```

Resolve any conflicts (usually just `routes.config.js` or `apps.config.js` where you've added your own entries), then push to `origin`. You control when you sync — there is no automatic upstream pressure.

## Contributing components back to the starter

If you build a reusable component in your project that belongs in the template (e.g. an agentic chat UI, a data table pattern), contribute it as a clean snapshot — not a history extraction.

```bash
# 1. Create a fresh branch off the starter tip
git checkout -b contribute/my-component starter/main

# 2. Copy just the component files from your project branch
git checkout my-project/main -- src/modules/ui/myComponent/
git checkout my-project/main -- src/modules/data/labels/MyComponent.js

# 3. Genericize: remove project-specific labels, hardcoded data,
#    and any imports from your project's own namespaces

# 4. Lint and verify
npm run lint:arch

# 5. Commit, push to starter, open a PR
git commit -m "feat: add my-component"
git push starter contribute/my-component
```

Your component's full history lives in your project repo — the starter only needs the clean, portable result. You'll need write access to the starter repo (or a collaborator who does) to push the branch.

## Where the important files are

| Area                                 | Path                                                               |
| ------------------------------------ | ------------------------------------------------------------------ |
| Route table                          | `src/routes.config.js` — paths, `navPage` / `navHighlight`, titles |
| Router (navigate, current route)     | `src/router.js`                                                    |
| App shell, route outlet              | `src/modules/shell/app/`                                           |
| Feature pages (add here)             | `src/modules/page/`                                                |
| Reusable LWC                         | `src/modules/ui/`                                                  |
| Data / auth / config modules         | `src/data/` (e.g. `authMode.js`, `firebaseAuth.js`)                |
| Apps / top-level nav (Data 360 apps) | `src/apps.config.js`                                               |
| Vite + LWC                           | `vite.config.js`                                                   |

**Adding a page (high level):** new `src/modules/page/<name>/` → new row in `routes.config.js` → import in `app.js` `ROUTE_COMPONENTS`. Details: [**`docs/technical-reference.md`**](docs/technical-reference.md).

## Quality guardrails

This repo enforces patterns automatically so prototypes stay production-portable.

### Lint hooks (run automatically)

| Hook                      | What it checks                                                                         | Blocking?                               |
| ------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------- |
| `lint-architecture-rules` | Namespace placement, CSS file responsibility, hardcoded labels, component completeness | Namespace = blocking; others = warnings |
| `lint-import-boundaries`  | Namespace dependency rules (e.g., `ui/` can't import from `shell/`)                    | Blocking                                |

Both run as **PostToolUse hooks** in Claude Code (after every Write/Edit) and as a **pre-push git hook** (blocks pushes with violations). Install hooks manually if needed: `npm run install-hooks`.

### i18n-ready labels

User-facing strings live in `src/modules/data/labels/<FeatureArea>.js`, not hardcoded in templates. This mirrors core's `@salesforce/label/` — porting is a path swap.

```javascript
import { PageTitle } from 'data/labels/Contacts';
export default class PageContacts extends LightningElement {
    labels = { PageTitle };
}
```

### Claude Code skill gates

When using Claude Code, these skills fire automatically before specific actions:

| Action                | Skill               |
| --------------------- | ------------------- |
| New component         | `lwc-new-component` |
| Edit UI markup/CSS/JS | `lwc-ui-checklist`  |
| Edit theme CSS        | `/theme-audit`      |
| Add page or nav item  | `add-nav-item`      |

### Available lint commands

```bash
npm run lint:arch        # Architecture rules (namespace, CSS, labels)
npm run lint:boundaries  # Import dependency rules
```

## More documentation

| Doc                                                              | What                                                                                           |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [**`docs/technical-reference.md`**](docs/technical-reference.md) | Full LWC/Vite/SLDS project structure, routing, shadow DOM, icons, conventions, upstream links. |
| [**`docs/setup-with-agent.md`**](docs/setup-with-agent.md)       | Agent copy-paste prompt, remote setup, syncing workflow.                                       |
| [`.cursor/rules/`](.cursor/rules/) (if present)                  | SLDS / LWC / icons guidance for this workspace.                                                |

### Theme playground

A **zero-dependency** HTML/CSS sandbox for iterating on the Cosmos theme without the full LWC/Vite stack lives in its own repo: **[salesforce-ux-emu/theme-playground](https://github.com/salesforce-ux-emu/theme-playground)**

Open `index.html` in a browser, tweak tokens live, and export the resulting CSS back into this codebase's `public/` override files.

### Where this starter comes from

This starter is built on top of the **[Design System 2 Starter Kit](https://git.soma.salesforce.com/a-guevara/design-system-2-starter-kit.git)** — a generic LWC + Vite + SLDS foundation used across Salesforce UI tooling. This repo extends that pattern for Data 360. A larger app on the same pattern is **d360-qsl-ux-prototype** (internal).

## Disclaimer

This template is for **prototyping and handoff**. How you deploy or embed real Data 360 and Salesforce follows your org’s process; that’s not prescribed here.