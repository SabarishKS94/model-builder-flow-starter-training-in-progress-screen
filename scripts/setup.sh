#!/bin/sh
# setup.sh — First-time environment check and npm install for this starter kit
#
# Run from the repo root. Safe to re-run.
# Usage: sh scripts/setup.sh
#
# For Salesforce-internal tooling (gh + git.soma, Claude Code plugins, etc.),
# see the d360-qsl-ux-prototype repo — its setup.sh covers that workflow.

set -e

BOLD=$(tput bold 2>/dev/null || true)
GREEN=$(tput setaf 2 2>/dev/null || true)
YELLOW=$(tput setaf 3 2>/dev/null || true)
RED=$(tput setaf 1 2>/dev/null || true)
RESET=$(tput sgr0 2>/dev/null || true)

ok()   { echo "${GREEN}✓${RESET} $1"; }
warn() { echo "${YELLOW}!${RESET} $1"; }

cd "$(dirname "$0")/.." || exit 1

if [ ! -f "package.json" ]; then
  echo "${RED}Error:${RESET} Run this script from the repository root (package.json not found)."
  exit 1
fi

echo ""
echo "${BOLD}Salesforce UI starter — setup${RESET}"
echo "────────────────────────────────"
echo ""

# Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "${RED}Node.js is not installed or not on PATH.${RESET}"
  echo ""
  echo "  Install an LTS release (e.g. 20.x) from https://nodejs.org, or use nvm:"
  echo "    nvm install --lts"
  echo ""
  if [ "$(uname -s)" = "Darwin" ] && command -v brew >/dev/null 2>&1; then
    echo "  On macOS with Homebrew you can run:  brew install node"
  fi
  echo ""
  exit 1
fi

ok "Node.js $(node --version)"
ok "npm $(npm --version)"

# Optional: local env for Vite (auth mode, optional Firebase — see README)
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  if cp .env.example .env 2>/dev/null; then
    ok "Created .env from .env.example (edit if you need Firebase or auth changes)"
  else
    warn "Could not copy .env.example to .env — create .env yourself when you need it."
  fi
elif [ -f ".env" ]; then
  ok ".env already present — leaving it unchanged"
fi

echo ""
echo "Running ${BOLD}npm install${RESET}..."
echo ""

npm install

echo ""
ok "Dependencies installed."
echo ""
echo "${BOLD}Next steps:${RESET}"
echo "  ${GREEN}npm run dev${RESET}  →  http://localhost:4360"
echo ""
echo "  Default auth in .env is ${BOLD}VITE_AUTH_MODE=none${RESET} (no login for local work)."
echo "  See README for Firebase / Google sign-in and build preview."
echo ""
echo "────────────────────────────────"
echo "${GREEN}Setup complete.${RESET}"
echo ""
