/**
 * Checks the upstream remote (design-system-2-starter-kit) for new commits
 * that haven't been incorporated into our main branch.
 *
 * Uses .upstream-synced.json to track which upstream commits have already been
 * reviewed/incorporated (since we adapt rather than cherry-pick, git can't
 * detect this automatically).
 *
 * Usage:
 *   node scripts/check-upstream.mjs              # prints report to stdout
 *   node scripts/check-upstream.mjs --json       # outputs JSON for automation
 *   node scripts/check-upstream.mjs --mark-all   # mark all current upstream commits as synced
 *   node scripts/check-upstream.mjs --mark <hash> # mark a specific commit as synced
 *
 * Requires: git on PATH, the "upstream" remote configured.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const SYNCED_FILE = path.join(REPO_ROOT, '.upstream-synced.json');

const UPSTREAM_REMOTE = 'upstream';
const UPSTREAM_BRANCH = 'main';

const jsonMode = process.argv.includes('--json');
const markAll = process.argv.includes('--mark-all');
const markIdx = process.argv.indexOf('--mark');
const markHash = markIdx !== -1 ? process.argv[markIdx + 1] : null;

function git(args) {
    const result = spawnSync('git', args, {
        cwd: REPO_ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30000,
    });
    if (result.error) throw result.error;
    return {
        status: result.status,
        stdout: result.stdout?.toString().trim() ?? '',
        stderr: result.stderr?.toString().trim() ?? '',
    };
}

function fail(msg) {
    if (jsonMode) {
        console.log(JSON.stringify({ error: msg }));
    } else {
        console.error(`Error: ${msg}`);
    }
    process.exit(1);
}

function loadSynced() {
    try {
        return JSON.parse(fs.readFileSync(SYNCED_FILE, 'utf-8'));
    } catch {
        return { synced: [], lastCheck: null };
    }
}

function saveSynced(data) {
    fs.writeFileSync(SYNCED_FILE, JSON.stringify(data, null, 2) + '\n');
}

// Verify upstream remote exists
const remoteCheck = git(['remote', 'get-url', UPSTREAM_REMOTE]);
if (remoteCheck.status !== 0) {
    fail(
        `Remote "${UPSTREAM_REMOTE}" not found. Add it with:\n` +
        `  git remote add upstream https://git.soma.salesforce.com/a-guevara/design-system-2-starter-kit.git`
    );
}

// Fetch upstream
const fetch = git(['fetch', UPSTREAM_REMOTE, UPSTREAM_BRANCH, '--quiet']);
if (fetch.status !== 0) {
    fail(`Failed to fetch ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}: ${fetch.stderr}`);
}

// Get ALL commits on upstream (from its root)
const log = git([
    'log',
    '--no-merges',
    `${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}`,
    '--format=%H|%h|%s|%an|%ai',
]);

if (log.status !== 0) {
    fail(`git log failed: ${log.stderr}`);
}

if (!log.stdout) {
    if (jsonMode) {
        console.log(JSON.stringify({ commits: [], summary: 'Upstream has no commits.' }));
    } else {
        console.log('Upstream has no commits.');
    }
    process.exit(0);
}

const allCommits = log.stdout.split('\n').map((line) => {
    const [hash, short, subject, author, date] = line.split('|');
    return { hash, short, subject, author, date };
});

const syncedData = loadSynced();
const syncedHashes = new Set(syncedData.synced);

// Handle --mark-all
if (markAll) {
    syncedData.synced = allCommits.map((c) => c.hash);
    syncedData.lastCheck = new Date().toISOString();
    saveSynced(syncedData);
    console.log(`Marked all ${allCommits.length} upstream commits as synced.`);
    process.exit(0);
}

// Handle --mark <hash>
if (markHash) {
    if (!syncedData.synced.includes(markHash)) {
        syncedData.synced.push(markHash);
    }
    syncedData.lastCheck = new Date().toISOString();
    saveSynced(syncedData);
    console.log(`Marked ${markHash} as synced.`);
    process.exit(0);
}

// Filter to pending commits
const pending = allCommits.filter((c) => !syncedHashes.has(c.hash));
const applied = allCommits.filter((c) => syncedHashes.has(c.hash));

// Update last check timestamp
syncedData.lastCheck = new Date().toISOString();
saveSynced(syncedData);

if (jsonMode) {
    console.log(JSON.stringify({ commits: pending, alreadySynced: applied.length, total: allCommits.length }, null, 2));
} else {
    console.log(`\n━━━ Upstream Sync Report ━━━`);
    console.log(`Upstream: ${remoteCheck.stdout}`);
    console.log(`Total upstream commits: ${allCommits.length}`);
    console.log(`Already synced: ${applied.length}`);
    console.log(`Pending review: ${pending.length}`);
    if (syncedData.lastCheck) {
        console.log(`Last check: ${syncedData.lastCheck}`);
    }
    console.log('');

    if (pending.length === 0) {
        console.log('✓ All upstream commits have been incorporated.');
    } else {
        console.log('Commits to review:');
        console.log('─'.repeat(72));
        for (const c of pending) {
            console.log(`  ${c.short}  ${c.subject}`);
            console.log(`           by ${c.author} on ${c.date.split(' ')[0]}`);
        }
        console.log('─'.repeat(72));
        console.log(`\nTo inspect a commit:  git show <hash>`);
        console.log(`To mark as synced:    node scripts/check-upstream.mjs --mark <hash>`);
        console.log(`To mark all synced:   node scripts/check-upstream.mjs --mark-all`);
    }
}
