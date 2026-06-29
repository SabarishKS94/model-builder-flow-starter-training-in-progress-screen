# Set up with an AI agent (Cursor, Claude Code, etc.)

The agent’s job is **local setup only** inside a folder that is **already a clone of *your* repository** — the same as running `sh scripts/setup.sh` yourself. It is **not** the right place for maintainer steps; you also **cannot push to the starter** without maintainer access.

**What the agent will do:** confirm `package.json` and `scripts/setup.sh` exist, run the setup script (Node check, `.env` from `.env.example`, `npm install`), optionally `npm run build`, and tell you how to start `npm run dev`. It should not echo secrets from `.env`.

---

## First: get *your* copy of the project (you do this once)

Clone the starter directly and set up your own GitHub repo for team collaboration. Do **not** use GitHub’s Fork button — forked repos auto-link PR numbers to the upstream template’s issues, which confuses your team’s PR history.

1. Clone the starter and rename the remote:
   ```bash
   git clone https://git.soma.salesforce.com/a360/d360-prototype-starter.git my-project
   cd my-project
   git remote rename origin starter
   ```
2. Create a **new, empty repo** in GitHub for your project (no README, no `.gitignore`).
3. Add it as `origin` and push:
   ```bash
   git remote add origin https://github.com/MY-ORG/MY-PROJECT.git
   git push -u origin main
   ```

You now have two remotes: **`origin`** (your project — push daily work here) and **`starter`** (the template — fetch from here occasionally to pull improvements).

Open that folder in your editor and **then** use the base prompt below (or run `sh scripts/setup.sh` yourself).

---

## Base prompt (after you are inside your clone)

Copy the block, optionally filling in your path.

```
You are helping me set up a local working copy of my Data 360 LWC/Vite app.

Context:
- I cloned the starter and set up my own GitHub repo as `origin`. The starter remote is named `starter`.
- This is a Vite + LWC project with `scripts/setup.sh` in the repo root.
- I need Node.js (LTS). The script creates `.env` from `.env.example` if missing, then runs `npm install`. Default auth is VITE_AUTH_MODE=none.
- Do not read aloud or log secrets from `.env`.

Please:
1. Confirm we are in the project root (`package.json` and `scripts/setup.sh` should exist). If I’m in the wrong directory, say what path I should `cd` to.
2. Run `sh scripts/setup.sh` from the repo root. If it fails, give the exact fix (e.g. install Node, wrong folder).
3. If setup succeeded, run `npm run build` once. Report pass/fail.
4. Tell me to run `npm run dev` and open http://localhost:4360.

If you cannot run shell commands, give a short manual checklist: `cd` into the project → `sh scripts/setup.sh` → `npm run dev`.
```

---

## Shorter follow-up (if setup already ran)

```
Confirm `npm run dev` works at http://localhost:4360. If the dev server fails, show the error and the minimal fix.
```

---

## Syncing starter improvements (optional, later)

When the template ships new components or improvements, pull them into your project:

```bash
git fetch starter
git merge starter/main
```

Resolve any conflicts (usually `routes.config.js` or `apps.config.js`), then push to `origin`. See the root [README](../README.md) for the full contribution workflow.