#!/usr/bin/env node

/**
 * Tier 2: Selector Coverage Validation
 *
 * Uses Playwright to check that selectors from the target profile actually
 * hit elements in the running app.
 *
 * Usage:
 *   node scripts/validate-selectors.mjs --profile=<path-to-profile.json> [--url=<app-url>]
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { chromium } from 'playwright';

// ── CLI argument parsing ──

function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {};
    for (const arg of args) {
        const match = arg.match(/^--(\w[\w-]*)=(.+)$/);
        if (match) {
            parsed[match[1]] = match[2];
        }
    }
    return parsed;
}

const args = parseArgs();

if (!args.profile) {
    console.error(
        'Usage: node scripts/validate-selectors.mjs --profile=<path-to-profile.json> [--url=<app-url>]'
    );
    process.exit(1);
}

const profilePath = resolve(args.profile);
const appUrl = args.url || 'http://localhost:3000';

// ── Load profile ──

let profile;
try {
    profile = JSON.parse(readFileSync(profilePath, 'utf-8'));
} catch (e) {
    console.error(`Error reading profile: ${profilePath}\n${e.message}`);
    process.exit(1);
}

// ── Collect testable selectors ──

/**
 * Strip pseudo-classes from a selector for querySelectorAll compatibility.
 * Returns null if the selector contains pseudo-elements (::) that can't be queried.
 */
function stripPseudoClasses(selector) {
    // If selector contains pseudo-elements like ::placeholder, ::before, etc. — skip entirely
    if (selector.includes('::')) {
        return null;
    }
    // Strip :hover, :active, :focus, :focus-within, :focus-visible, :visited, :checked, etc.
    return selector.replace(/:(hover|active|focus|focus-within|focus-visible|visited|checked|disabled|enabled|first-child|last-child|nth-child\([^)]*\))/g, '').trim();
}

/**
 * Extract selectors from the profile's component_selectors.
 * Returns array of { selector, optional, component }
 */
function collectSelectors(profile) {
    const selectors = [];
    const darkPrefix = profile.selector_prefix?.dark || 'body.cosmos-dark';
    const componentSelectors = profile.component_selectors || {};

    for (const [componentName, config] of Object.entries(componentSelectors)) {
        const isOptional = config.optional === true;

        if (config.strategy === 'skip') {
            continue;
        }

        if (config.strategy === 'passthrough') {
            // For passthrough, test that the base classes exist in the running app.
            // Sources of class names (in priority order):
            // 1. The matching structure entry's "expected" text
            // 2. The component's "notes" field (contains class references like .global-shell)
            // 3. Fall back to using the component name as a class

            const classesFound = new Set();

            // Check structure section for this component
            const structureInfo = profile.structure?.[componentName];
            if (structureInfo?.expected) {
                const matches = structureInfo.expected.match(/\.([\w-]+)/g);
                if (matches) {
                    matches.forEach((cls) => classesFound.add(cls));
                }
            }

            // Check the notes field for class references
            if (config.notes) {
                const noteMatches = config.notes.match(/\.([\w-]+)/g);
                if (noteMatches) {
                    noteMatches.forEach((cls) => classesFound.add(cls));
                }
            }

            // Fallback: use component name as class
            if (classesFound.size === 0) {
                classesFound.add(`.${componentName}`);
            }

            for (const cls of classesFound) {
                selectors.push({
                    selector: `${darkPrefix} ${cls}`,
                    optional: isOptional,
                    component: componentName
                });
            }
            continue;
        }

        if (config.strategy === 'remap' && config.map) {
            for (const [, targetValue] of Object.entries(config.map)) {
                // Target values can be comma-separated
                const parts = targetValue.split(',').map((s) => s.trim());
                for (const part of parts) {
                    const stripped = stripPseudoClasses(part);
                    if (stripped === null || stripped === '') {
                        continue;
                    }
                    // Prefix with mode prefix
                    const fullSelector = `${darkPrefix} ${stripped}`;
                    selectors.push({
                        selector: fullSelector,
                        optional: isOptional,
                        component: componentName
                    });
                }
            }
        }
    }

    return selectors;
}

/**
 * Deduplicate selectors by their selector string.
 * If any instance is required (not optional), the deduped entry is required.
 */
function deduplicateSelectors(selectors) {
    const map = new Map();
    for (const entry of selectors) {
        const existing = map.get(entry.selector);
        if (!existing) {
            map.set(entry.selector, { ...entry });
        } else {
            // If any instance is required, mark as required
            if (!entry.optional) {
                existing.optional = false;
            }
        }
    }
    return Array.from(map.values());
}

const rawSelectors = collectSelectors(profile);
const selectors = deduplicateSelectors(rawSelectors);

if (selectors.length === 0) {
    console.error('No testable selectors found in profile.');
    process.exit(1);
}

// ── Launch Playwright and test selectors ──

async function run() {
    console.log('');
    console.log('─── Tier 2: Selector Coverage Check ───');
    console.log(`App URL: ${appUrl}`);
    console.log(`Selectors to check: ${selectors.length}`);
    console.log('');

    let browser;
    try {
        browser = await chromium.launch({ headless: true });
    } catch (e) {
        console.error(`Failed to launch browser: ${e.message}`);
        console.error('Have you installed the browser? Run: npx playwright install chromium');
        process.exit(1);
    }

    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to app
    try {
        await page.goto(appUrl, { timeout: 10000, waitUntil: 'domcontentloaded' });
    } catch (e) {
        console.error(`Failed to connect to ${appUrl}`);
        console.error('Is the dev server running? Start it with: npm run dev');
        await browser.close();
        process.exit(1);
    }

    // Wait a bit for LWC components to render
    await page.waitForTimeout(2000);

    // Set body class for dark mode (default test mode)
    const darkBodyClass = profile.body_class?.dark || 'cosmos-dark slds-color-scheme_dark';
    await page.evaluate((cls) => {
        document.body.className = cls;
    }, darkBodyClass);

    // Wait for class application
    await page.waitForTimeout(500);

    // Test each selector
    const hits = [];
    const misses = [];

    for (const entry of selectors) {
        try {
            const count = await page.evaluate((sel) => {
                return document.querySelectorAll(sel).length;
            }, entry.selector);

            if (count > 0) {
                hits.push({ ...entry, count });
            } else {
                misses.push(entry);
            }
        } catch (e) {
            // Invalid selector syntax
            misses.push({ ...entry, error: e.message });
        }
    }

    await browser.close();

    // ── Report results ──
    console.log('Results:');
    console.log(`  ✓ Hit:   ${hits.length}`);
    console.log(`  ✗ Miss:  ${misses.length}`);
    console.log('');

    if (hits.length > 0) {
        console.log('Hits:');
        for (const h of hits) {
            console.log(`  ✓ ${h.selector} — ${h.count} element(s)`);
        }
        console.log('');
    }

    if (misses.length > 0) {
        console.log('Misses:');
        for (const m of misses) {
            const suffix = m.optional ? ' (optional)' : ' ← ACTION NEEDED';
            const errorSuffix = m.error ? ` [invalid selector: ${m.error}]` : '';
            console.log(`  ✗ ${m.selector}${suffix}${errorSuffix}`);
        }
        console.log('');
    }

    // Calculate coverage (only required selectors count toward pass/fail)
    const requiredSelectors = selectors.filter((s) => !s.optional);
    const requiredHits = hits.filter((h) => !h.optional);
    const requiredTotal = requiredSelectors.length;
    const coveragePct =
        requiredTotal > 0 ? ((requiredHits.length / requiredTotal) * 100).toFixed(1) : '100.0';

    console.log(`Coverage: ${coveragePct}% (${requiredHits.length}/${requiredTotal} required selectors)`);
    console.log('');

    // Exit code: 0 if all required selectors hit, 1 if any required miss
    const requiredMisses = misses.filter((m) => !m.optional);
    if (requiredMisses.length > 0) {
        process.exit(1);
    }
    process.exit(0);
}

run().catch((e) => {
    console.error(`Unexpected error: ${e.message}`);
    process.exit(1);
});
