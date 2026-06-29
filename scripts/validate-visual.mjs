#!/usr/bin/env node

/**
 * Tier 3: Visual Regression Check
 *
 * Compares screenshots of the running app against reference PNGs using pixelmatch.
 *
 * Usage:
 *   node scripts/validate-visual.mjs --references=<path> [--routes=<path>] [--url=<url>] [--threshold=<0-1>]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

// ─── CLI Args ────────────────────────────────────────────────────────────────

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

if (!args.references) {
    console.error('Error: --references=<path> is required');
    console.error(
        'Usage: node scripts/validate-visual.mjs --references=<path> [--routes=<path>] [--url=<url>] [--threshold=<0-1>]'
    );
    process.exit(1);
}

const REFERENCES_DIR = resolve(args.references);
const ROUTES_PATH = resolve(args.routes || './visual-test-routes.json');
const APP_URL = args.url || 'http://localhost:3000';
const THRESHOLD = parseFloat(args.threshold ?? '0.05');
const OUTPUT_DIR = resolve('validation-output');

// ─── Load Routes ─────────────────────────────────────────────────────────────

if (!existsSync(ROUTES_PATH)) {
    console.error(`Error: Routes file not found: ${ROUTES_PATH}`);
    process.exit(1);
}

const routes = JSON.parse(readFileSync(ROUTES_PATH, 'utf-8'));

// ─── Run ─────────────────────────────────────────────────────────────────────

async function run() {
    console.log('');
    console.log('─── Tier 3: Visual Regression Check ───');
    console.log(`App URL: ${APP_URL}`);
    console.log(`Reference: ${args.references}`);
    console.log(`Threshold: ${(THRESHOLD * 100).toFixed(1)}%`);
    console.log('');

    // Ensure output directory exists
    mkdirSync(OUTPUT_DIR, { recursive: true });

    let browser;
    try {
        browser = await chromium.launch({ headless: true });
    } catch (err) {
        console.error(`Error: Could not launch browser: ${err.message}`);
        process.exit(1);
    }

    const results = [];

    try {
        const context = await browser.newContext();
        const page = await context.newPage();

        const entries = Object.entries(routes);

        for (const [name, config] of entries) {
            const refPath = join(REFERENCES_DIR, `${name}.png`);

            // Check if reference exists
            if (!existsSync(refPath)) {
                results.push({ name, status: 'skip' });
                continue;
            }

            // Set viewport
            const [width, height] = config.viewport || [1440, 900];
            await page.setViewportSize({ width, height });

            // Navigate
            const url = new URL(config.url, APP_URL).href;
            try {
                await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
            } catch {
                // If networkidle times out, continue anyway
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            }

            // Set body class if specified
            if (config.bodyClass) {
                await page.evaluate((cls) => {
                    document.body.className = cls;
                }, config.bodyClass);
            }

            // Wait for element if specified
            if (config.waitFor) {
                try {
                    await page.waitForSelector(config.waitFor, { timeout: 10000 });
                } catch {
                    // Element may not appear; continue with screenshot anyway
                }
            }

            // Small delay for rendering to settle
            await page.waitForTimeout(500);

            // Take screenshot
            let screenshotBuffer;
            const selector = config.selector || '#app';
            if (selector === '#app') {
                screenshotBuffer = await page.screenshot({ fullPage: true });
            } else {
                const element = await page.$(selector);
                if (element) {
                    screenshotBuffer = await element.screenshot();
                } else {
                    screenshotBuffer = await page.screenshot({ fullPage: true });
                }
            }

            // Load reference image
            const refPng = PNG.sync.read(readFileSync(refPath));

            // Decode actual screenshot
            const actualPng = PNG.sync.read(screenshotBuffer);

            // Ensure same dimensions for comparison
            const compWidth = Math.min(refPng.width, actualPng.width);
            const compHeight = Math.min(refPng.height, actualPng.height);

            // Resize images to comparison dimensions if needed
            const refData = cropPng(refPng, compWidth, compHeight);
            const actualData = cropPng(actualPng, compWidth, compHeight);

            // Create diff image
            const diff = new PNG({ width: compWidth, height: compHeight });

            const numDiffPixels = pixelmatch(
                refData,
                actualData,
                diff.data,
                compWidth,
                compHeight,
                { threshold: 0.1 }
            );

            const totalPixels = compWidth * compHeight;
            const diffPercent = numDiffPixels / totalPixels;

            if (diffPercent > THRESHOLD) {
                // Save actual and diff
                writeFileSync(join(OUTPUT_DIR, `${name}-actual.png`), screenshotBuffer);
                writeFileSync(join(OUTPUT_DIR, `${name}-diff.png`), PNG.sync.write(diff));
                results.push({ name, status: 'fail', diff: diffPercent });
            } else {
                results.push({ name, status: 'pass', diff: diffPercent });
            }
        }
    } finally {
        await browser.close();
    }

    // ─── Report ──────────────────────────────────────────────────────────────

    console.log('Results:');
    let passCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (const r of results) {
        if (r.status === 'pass') {
            passCount++;
            console.log(`  ✓ ${r.name} (${(r.diff * 100).toFixed(1)}% diff)`);
        } else if (r.status === 'fail') {
            failCount++;
            console.log(`  ✗ ${r.name} — ${(r.diff * 100).toFixed(1)}% diff`);
        } else {
            skipCount++;
            console.log(`  ⊘ ${r.name} — No reference screenshot`);
        }
    }

    console.log('');
    console.log(`Pass: ${passCount}, Fail: ${failCount}, Skip: ${skipCount}`);

    if (failCount > 0) {
        console.log('');
        console.log(`Diff images saved to: ${OUTPUT_DIR}`);
    }

    console.log('');
    process.exit(failCount > 0 ? 1 : 0);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Crop a PNG to the given dimensions, returning raw RGBA buffer.
 */
function cropPng(png, width, height) {
    if (png.width === width && png.height === height) {
        return png.data;
    }
    const cropped = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) {
        const srcOffset = y * png.width * 4;
        const dstOffset = y * width * 4;
        png.data.copy(cropped, dstOffset, srcOffset, srcOffset + width * 4);
    }
    return cropped;
}

run().catch((err) => {
    console.error(`Fatal error: ${err.message}`);
    process.exit(1);
});
