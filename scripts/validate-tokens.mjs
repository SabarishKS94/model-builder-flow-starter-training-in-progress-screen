#!/usr/bin/env node

/**
 * Tier 1: Token Integrity Validation
 *
 * Compares a generated CSS file against tokens.json to verify every token
 * is present with the correct value.
 *
 * Usage:
 *   node scripts/validate-tokens.mjs --tokens=<path-to-tokens.json> [--css=<path-to-css>]
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as csstree from 'css-tree';

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

if (!args.tokens) {
    console.error('Usage: node scripts/validate-tokens.mjs --tokens=<path-to-tokens.json> [--css=<path-to-css>]');
    process.exit(1);
}

const tokensPath = resolve(args.tokens);
const cssPath = resolve(args.css || 'public/cosmos-theme.css');

// ── Load files ──

let tokensJson;
try {
    tokensJson = JSON.parse(readFileSync(tokensPath, 'utf-8'));
} catch (e) {
    console.error(`Error reading tokens file: ${tokensPath}\n${e.message}`);
    process.exit(1);
}

let cssSource;
try {
    cssSource = readFileSync(cssPath, 'utf-8');
} catch (e) {
    console.error(`Error reading CSS file: ${cssPath}\n${e.message}`);
    process.exit(1);
}

// ── Selectors that qualify as token blocks ──

const TOKEN_BLOCK_SELECTORS = new Set([
    ':root',
    'body.cosmos-dark',
    'body.cosmos-light',
    '.cosmos-dark',
    '.cosmos-light'
]);

/**
 * Normalize a selector string for matching against our allowed set.
 * Trims whitespace and lowercases for comparison.
 */
function normalizeSelector(sel) {
    return sel.trim();
}

/**
 * Determine which mode category a selector belongs to.
 * Returns 'shared' | 'dark' | 'light' | null
 */
function classifySelector(selectorText) {
    const normalized = normalizeSelector(selectorText);
    if (!TOKEN_BLOCK_SELECTORS.has(normalized)) {
        return null;
    }
    if (normalized === ':root') return 'shared';
    if (normalized.includes('cosmos-dark')) return 'dark';
    if (normalized.includes('cosmos-light')) return 'light';
    return null;
}

// ── Parse CSS and extract custom properties from token blocks ──

const ast = csstree.parse(cssSource);

// Map: mode -> { propertyName -> value }
const cssTokens = {
    shared: {},
    dark: {},
    light: {}
};

csstree.walk(ast, {
    visit: 'Rule',
    enter(node) {
        // Get the selector text
        const selectorText = csstree.generate(node.prelude);

        // Classify — only extract from known token-block selectors
        const mode = classifySelector(selectorText);
        if (!mode) return;

        // Walk declarations in this block
        if (node.block && node.block.children) {
            node.block.children.forEach((decl) => {
                if (decl.type === 'Declaration' && decl.property.startsWith('--')) {
                    const propName = decl.property;
                    const value = csstree.generate(decl.value).trim();
                    cssTokens[mode][propName] = value;
                }
            });
        }
    }
});

// ── Build expected tokens from JSON ──

// tokens.json structure: { shared: {...}, modes: { dark: {...}, light: {...} } }
const expectedTokens = {
    shared: {},
    dark: {},
    light: {}
};

if (tokensJson.shared) {
    for (const [name, value] of Object.entries(tokensJson.shared)) {
        expectedTokens.shared[`--${name}`] = value;
    }
}

if (tokensJson.modes) {
    if (tokensJson.modes.dark) {
        for (const [name, value] of Object.entries(tokensJson.modes.dark)) {
            expectedTokens.dark[`--${name}`] = value;
        }
    }
    if (tokensJson.modes.light) {
        for (const [name, value] of Object.entries(tokensJson.modes.light)) {
            expectedTokens.light[`--${name}`] = value;
        }
    }
}

// ── Compare ──

const failures = [];
const warnings = [];
let totalChecked = 0;
let passed = 0;

function normalizeValue(val) {
    // Normalize whitespace for comparison
    return val.replace(/\s+/g, ' ').trim();
}

// Check every token in JSON exists in CSS with correct value
for (const mode of ['shared', 'dark', 'light']) {
    const modeLabel = mode === 'shared' ? 'shared' : mode;
    for (const [prop, expectedValue] of Object.entries(expectedTokens[mode])) {
        totalChecked++;
        const cssValue = cssTokens[mode][prop];
        if (cssValue === undefined) {
            failures.push({
                type: 'MISSING',
                mode: modeLabel,
                prop,
                expected: expectedValue
            });
        } else if (normalizeValue(cssValue) !== normalizeValue(expectedValue)) {
            failures.push({
                type: 'MISMATCH',
                mode: modeLabel,
                prop,
                expected: expectedValue,
                got: cssValue
            });
        } else {
            passed++;
        }
    }
}

// Check for orphan tokens in CSS that aren't in JSON
for (const mode of ['shared', 'dark', 'light']) {
    const modeLabel = mode === 'shared' ? 'shared' : mode;
    for (const prop of Object.keys(cssTokens[mode])) {
        if (!(prop in expectedTokens[mode])) {
            warnings.push({
                type: 'ORPHAN',
                mode: modeLabel,
                prop
            });
        }
    }
}

// Check mode parity: tokens in dark but not light, or vice versa
const darkTokenNames = new Set(Object.keys(expectedTokens.dark));
const lightTokenNames = new Set(Object.keys(expectedTokens.light));

for (const prop of darkTokenNames) {
    if (!lightTokenNames.has(prop)) {
        warnings.push({
            type: 'PARITY',
            mode: 'dark-only',
            prop,
            message: `exists in dark but not light`
        });
    }
}
for (const prop of lightTokenNames) {
    if (!darkTokenNames.has(prop)) {
        warnings.push({
            type: 'PARITY',
            mode: 'light-only',
            prop,
            message: `exists in light but not dark`
        });
    }
}

// ── Report ──

console.log('');
console.log('─── Tier 1: Token Integrity Check ───');
console.log('');
console.log(`Tokens checked: ${totalChecked}`);
console.log(`Passed: ${passed}/${totalChecked}`);
console.log('');

if (warnings.length > 0) {
    console.log(`WARNINGS (${warnings.length}):`);
    for (const w of warnings) {
        if (w.type === 'ORPHAN') {
            console.log(`  ! ORPHAN [${w.mode}]: ${w.prop} in CSS but not in tokens.json`);
        } else if (w.type === 'PARITY') {
            console.log(`  ! PARITY [${w.mode}]: ${w.prop} ${w.message}`);
        }
    }
    console.log('');
}

if (failures.length === 0) {
    console.log('✓ All tokens present and correct');
    console.log('');
    process.exit(0);
} else {
    console.log(`FAILURES (${failures.length}):`);
    for (const f of failures) {
        if (f.type === 'MISSING') {
            console.log(`  ✗ MISSING [${f.mode}]: ${f.prop} not found in CSS`);
        } else if (f.type === 'MISMATCH') {
            console.log(`  ✗ MISMATCH [${f.mode}]: ${f.prop}`);
            console.log(`    Expected: ${f.expected}`);
            console.log(`    Got:      ${f.got}`);
        }
    }
    console.log('');
    process.exit(1);
}
