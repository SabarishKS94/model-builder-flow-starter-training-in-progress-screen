#!/usr/bin/env node

/**
 * Install git hooks
 *
 * Copies hooks from scripts/hooks/ to .git/hooks/ and makes them executable.
 * Safe to run multiple times (idempotent).
 */

import { copyFileSync, chmodSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const HOOKS = ['pre-push'];

function installHooks() {
  const gitHooksDir = join(ROOT, '.git', 'hooks');
  const sourceHooksDir = join(ROOT, 'scripts', 'hooks');

  // Check if .git directory exists
  if (!existsSync(join(ROOT, '.git'))) {
    console.log('⚠️  Not a git repository — skipping hook installation');
    return;
  }

  // Ensure .git/hooks directory exists
  if (!existsSync(gitHooksDir)) {
    mkdirSync(gitHooksDir, { recursive: true });
  }

  let installed = 0;

  for (const hook of HOOKS) {
    const sourcePath = join(sourceHooksDir, hook);
    const targetPath = join(gitHooksDir, hook);

    if (!existsSync(sourcePath)) {
      console.error(`❌ Source hook not found: ${sourcePath}`);
      continue;
    }

    try {
      copyFileSync(sourcePath, targetPath);
      chmodSync(targetPath, 0o755);
      installed++;
    } catch (err) {
      console.error(`❌ Failed to install ${hook}: ${err.message}`);
    }
  }

  if (installed > 0) {
    console.log(`✓ Installed ${installed} git hook(s)`);
  }
}

installHooks();
