/**
 * Copies selected Agentforce Verifier (afv-library) skills into `.agent/skills/afv-library/`.
 *
 * Invoked via `npm run skills:sync` and from `postinstall`.
 *
 * These skills provide SLDS best-practice guidance for AI agents (applying-slds,
 * uplifting-components-to-slds2, validating-slds). They complement the project-specific
 * D360 UX skills synced by sync-d360-skills.mjs.
 *
 * Requires: git on PATH, network access to GitHub (public repo).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const DEST_BASE = path.join(REPO_ROOT, '.agent', 'skills', 'afv-library');

const REPO_URL = 'https://github.com/forcedotcom/afv-library.git';
const BRANCH = 'develop';
const SKILL_NAMES = [
    'applying-slds',
    'uplifting-components-to-slds2',
    'validating-slds',
];

const isPostInstall = process.env.npm_lifecycle_event === 'postinstall';

function runGit(args) {
    const result = spawnSync('git', args, { stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000 });
    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        const stderr = result.stderr?.toString().trim();
        throw new Error(stderr || `git ${args[0]} exited with code ${result.status}`);
    }
    return result;
}

const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'afv-skills-'));
const cloneDir = path.join(tmpBase, 'repo');

try {
    console.log('sync-afv-skills: fetching SLDS agent skills from afv-library...');
    runGit(['clone', '--depth', '1', '--branch', BRANCH, REPO_URL, cloneDir]);

    fs.rmSync(DEST_BASE, { recursive: true, force: true });
    fs.mkdirSync(DEST_BASE, { recursive: true });

    let synced = 0;
    for (const name of SKILL_NAMES) {
        const srcDir = path.join(cloneDir, 'skills', name);
        if (!fs.existsSync(srcDir)) {
            console.warn(`  ⚠ skill "${name}" not found in repo — skipping`);
            continue;
        }
        const destDir = path.join(DEST_BASE, name);
        fs.cpSync(srcDir, destDir, { recursive: true });
        synced++;
    }

    console.log(`sync-afv-skills: synced ${synced} skills to .agent/skills/afv-library/`);
    console.log('  Skills:', SKILL_NAMES.filter(n => fs.existsSync(path.join(DEST_BASE, n))).join(', '));
} catch (err) {
    if (isPostInstall) {
        console.error('sync-afv-skills: failed to sync (non-blocking):', err.message);
    } else {
        console.error('sync-afv-skills: failed:', err.message);
        process.exit(1);
    }
} finally {
    fs.rmSync(tmpBase, { recursive: true, force: true });
}
