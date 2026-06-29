# Changelog

## 2026-05-28 — Service Layer & Container/Presentational Enforcement

**What changed:** The starter kit now enforces a client-server boundary pattern that makes prototypes portable to Salesforce core.

### New: `data/services/` — The Service Layer

Every page component must fetch data through a typed async service module rather than importing raw data fixtures directly. This creates the "seam" where a real backend (Connect API, `@wire` adapter) slots in during porting.

- `data/services/contactService.js` added as the reference implementation
- JSDoc `@typedef` blocks declare data contracts (field names, types) — these become the spec for Connect API representations

### Enforced: Import Boundary Rules (lint hook)

The `lint-import-boundaries.mjs` hook now blocks:
- `page/` importing from raw `data/*` (must use `data/services/` or `data/labels/`)
- `ui/` importing from `data/services/` or raw `data/*` (must receive data as `@api` props)

Violations produce actionable error messages guiding the developer to create a service module.

### Enforced: Container / Presentational Pattern

- `page/` components are **containers** — they call services, manage state, handle navigation
- `ui/` components are **presentational** — props in, events out, no data fetching or routing

When a `ui/` component needs to trigger navigation, it dispatches a `CustomEvent('navigate', ...)` — the parent container handles it.

### Updated: `lwc-new-component` Skill

The skill now guides developers through creating the service module alongside the page component:
- Step 2 shows the service-first container pattern
- Step 5 shows the event dispatch pattern for `ui/` navigation
- Checklist includes service module creation
- Common mistakes table covers the new lint errors

### Why

Based on the [QSL v2 Prototype Design Suggestions for Core Reusability](https://docs.google.com/document/d/...) analysis. The #1 recommendation — typed client API layer — is the architectural decision that makes everything else reusable. Without it, every component requires a bespoke rewrite when porting. With it, `ui/` components port as-is and `page/` containers need only a backend swap.

### Deferred

Three recommendations were intentionally not implemented (too heavy for a starter kit at this scale):
- Variant registry (enum-keyed dynamic dispatch) — revisit when building multi-variant renderers
- OpenAPI mock server — service layer provides the same boundary without infrastructure
- AJV runtime schema validation — JSDoc typedefs give contract visibility without the dependency
