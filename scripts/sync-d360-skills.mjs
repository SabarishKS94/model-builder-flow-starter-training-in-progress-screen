/**
 * Syncs D360 UX Cursor rules from the central skills repo into `.cursor/rules/d360/`.
 *
 * Invoked via `npm run skills:sync` (manual) or automatically during `npm install`.
 *
 * Clones the d360-ux-skills repo (Soma), copies `cursor-rules/*.mdc` into
 * the project's `.cursor/rules/d360/` directory (gitignored).
 *
 * Requires: git on PATH, SSH access to git.soma.salesforce.com.
 * If run during postinstall and SSH fails, prints recovery instructions instead of blocking.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const DEST = path.join(REPO_ROOT, '.cursor', 'rules', 'd360');

const REPO_URL = 'git@git.soma.salesforce.com:lizzie-li/d360-ux-skills.git';
const BRANCH = 'main';
const SOURCE_DIR = 'cursor-rules';

const isPostInstall = process.env.npm_lifecycle_event === 'postinstall';

function isCursorInstalled() {
    // Check if the .cursor/rules directory already exists in the project (user has used Cursor before)
    if (fs.existsSync(path.join(REPO_ROOT, '.cursor', 'rules'))) {
        return true;
    }
    // Check if the Cursor app config directory exists (macOS / Linux / Windows)
    const home = os.homedir();
    const cursorConfigPaths = [
        path.join(home, '.cursor'),                           // macOS / Linux
        path.join(home, 'Library', 'Application Support', 'Cursor'), // macOS app
        path.join(home, 'AppData', 'Roaming', 'Cursor'),     // Windows
    ];
    return cursorConfigPaths.some(p => fs.existsSync(p));
}

function printFailure(reason) {
    console.error('');
    console.error('╭──────────────────────────────────────────────────────────────────╮');
    console.error('│  ⚠  D360 Cursor rules sync failed                               │');
    console.error('╰──────────────────────────────────────────────────────────────────╯');
    console.error('');
    console.error(`  Reason: ${reason}`);
    console.error('');
    console.error('  This means Cursor will not have the D360 UX rules loaded.');
    console.error('  Claude Code users are unaffected (plugins load separately).');
    console.error('');
    console.error('  To retry manually:');
    console.error('    npm run skills:sync');
    console.error('');
    console.error('  Common fixes:');
    console.error('    1. Ensure you have SSH access to git.soma.salesforce.com');
    console.error('       Test with: ssh -T git@git.soma.salesforce.com');
    console.error('    2. If you don\'t have SSH keys set up, see:');
    console.error('       https://git.soma.salesforce.com/settings/keys');
    console.error('    3. If you\'re on VPN and it still fails, reach out to:');
    console.error('       @dvora on Slack (D360 UX Engineering)');
    console.error('');
}

function runGit(args) {
    const result = spawnSync('git', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30000,
    });
    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        const stderr = result.stderr?.toString().trim();
        throw new Error(stderr || `git ${args[0]} exited with code ${result.status}`);
    }
    return result;
}

if (isPostInstall && !isCursorInstalled()) {
    console.log('sync-d360-skills: Cursor not detected, skipping rules sync.');
    console.log('  (Run `npm run skills:sync` manually if you install Cursor later.)');
    process.exit(0);
}

const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'd360-skills-'));
const cloneDir = path.join(tmpBase, 'repo');

try {
    console.log('sync-d360-skills: fetching cursor rules from d360-ux-skills...');
    runGit(['clone', '--depth', '1', '--branch', BRANCH, REPO_URL, cloneDir]);

    const sourceRoot = path.join(cloneDir, SOURCE_DIR);
    if (!fs.existsSync(sourceRoot)) {
        throw new Error(
            'cursor-rules directory not found in the skills repo. '
            + 'It may not have been pushed yet — reach out to @dvora.'
        );
    }

    fs.rmSync(DEST, { recursive: true, force: true });
    fs.mkdirSync(DEST, { recursive: true });

    const files = fs.readdirSync(sourceRoot).filter(f => f.endsWith('.mdc'));
    if (files.length === 0) {
        throw new Error('cursor-rules directory exists but contains no .mdc files.');
    }

    for (const file of files) {
        fs.cpSync(path.join(sourceRoot, file), path.join(DEST, file));
    }

    console.log(`sync-d360-skills: synced ${files.length} rules to .cursor/rules/d360/`);
    console.log('  Rules:', files.map(f => f.replace('.mdc', '')).join(', '));
} catch (err) {
    if (isPostInstall) {
        printFailure(err.message);
        // Don't exit with error during postinstall — npm install should still succeed
    } else {
        printFailure(err.message);
        process.exit(1);
    }
} finally {
    fs.rmSync(tmpBase, { recursive: true, force: true });
}
