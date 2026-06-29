#!/usr/bin/env node

/**
 * Import Boundary Linter
 *
 * Enforces namespace dependency rules for LWC modules:
 *
 * | Namespace | Can import from                | Cannot import from              |
 * |-----------|--------------------------------|---------------------------------|
 * | shell/    | data/, ui/, src/router.js      | page/                           |
 * | page/     | data/, ui/                     | shell/, other page/ components  |
 * | ui/       | data/labels/, other ui/        | page/, shell/, data/* (except labels) |
 * | data/     | other data/                    | shell/, page/, ui/              |
 *
 * Usage:
 *   node scripts/lint-import-boundaries.mjs              # Full scan
 *   node scripts/lint-import-boundaries.mjs --file <path> # Single file
 *   node scripts/lint-import-boundaries.mjs --hook       # Hook mode (stdin)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

// ── Namespace dependency rules ──

const RULES = {
    shell: {
        canImport: ['data', 'ui'],
        allowedSpecialPaths: ['src/router.js', 'src/routes.config.js', 'src/apps.config.js'],
        cannotImport: ['page'],
        // Exception: shell/app and shell/cosmosApp are routers and need to import page components
        allowPageImports: ['shell/app', 'shell/cosmosApp']
    },
    page: {
        canImport: ['data', 'ui'],
        allowedDataPaths: ['data/services/', 'data/labels/'],
        allowedSpecialPaths: ['src/router.js', 'src/routes.config.js'],
        cannotImport: ['shell', 'page']
    },
    ui: {
        canImport: ['ui'], // ui can import other ui components
        allowedDataPaths: ['data/labels/'], // ui can only import data/labels/
        cannotImport: ['page', 'shell']
    },
    data: {
        canImport: ['data'],
        cannotImport: ['shell', 'page', 'ui']
    }
};

// ── CLI argument parsing ──

function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = { mode: 'full' };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--hook') {
            parsed.mode = 'hook';
        } else if (args[i] === '--file' && args[i + 1]) {
            parsed.mode = 'file';
            parsed.filePath = args[i + 1];
            i++;
        }
    }

    return parsed;
}

// ── Hook mode stdin parsing ──

function readHookInput() {
    return new Promise((resolve) => {
        let data = '';
        process.stdin.on('data', (chunk) => {
            data += chunk;
        });
        process.stdin.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                resolve(parsed?.tool_input?.file_path || null);
            } catch {
                resolve(null);
            }
        });
    });
}

// ── File walker ──

function walkDir(dir, fileList = []) {
    const files = readdirSync(dir);
    for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath, fileList);
        } else if (file.endsWith('.js')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

// ── Import extraction ──

/**
 * Extract all import statements from a file.
 * Returns array of { source, line } where source is the import path.
 */
function extractImports(filePath) {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const imports = [];

    // Match static imports: import ... from '...'
    const staticImportRegex = /import\s+(?:[\w{},*\s]+\s+from\s+)?['"]([^'"]+)['"]/g;

    // Match dynamic imports: import('...')
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    lines.forEach((line, idx) => {
        let match;

        // Extract static imports
        while ((match = staticImportRegex.exec(line)) !== null) {
            imports.push({
                source: match[1],
                line: idx + 1
            });
        }

        // Extract dynamic imports
        while ((match = dynamicImportRegex.exec(line)) !== null) {
            imports.push({
                source: match[1],
                line: idx + 1
            });
        }
    });

    return imports;
}

// ── Namespace resolution ──

/**
 * Determine the namespace of a file based on its path.
 * Returns 'shell', 'page', 'ui', 'data', or null.
 */
function getFileNamespace(filePath) {
    const rel = relative(PROJECT_ROOT, filePath);
    const match = rel.match(/^src\/modules\/(shell|page|ui|data)\//);
    return match ? match[1] : null;
}

/**
 * Determine the namespace being imported.
 * Returns { namespace, path } or null if not a namespace import.
 */
function getImportNamespace(importSource, currentFilePath) {
    // Ignore external imports
    if (
        importSource.startsWith('lightning/') ||
        importSource.startsWith('lwc') ||
        importSource.startsWith('@salesforce/') ||
        importSource.startsWith('@lwc/')
    ) {
        return null;
    }

    // Relative imports within same directory are always allowed
    if (importSource.startsWith('./') || importSource.startsWith('../')) {
        // Resolve to absolute path to check if it crosses namespace boundaries
        const currentDir = dirname(currentFilePath);
        const resolvedPath = resolve(currentDir, importSource);
        const targetNamespace = getFileNamespace(resolvedPath);
        const currentNamespace = getFileNamespace(currentFilePath);

        // If it stays in the same component directory or same namespace, it's fine
        if (!targetNamespace || targetNamespace === currentNamespace) {
            return null;
        }

        // Check if it's a special allowed path
        const rel = relative(PROJECT_ROOT, resolvedPath);
        if (rel.startsWith('src/router.js') || rel.startsWith('src/routes.config.js') || rel.startsWith('src/apps.config.js')) {
            return { namespace: 'special', path: rel };
        }

        return { namespace: targetNamespace, path: rel };
    }

    // Namespace imports: data/contacts, ui/planBuilder, etc.
    const match = importSource.match(/^(shell|page|ui|data)\//);
    if (match) {
        return { namespace: match[1], path: importSource };
    }

    // Check for special paths
    if (importSource.startsWith('src/')) {
        return { namespace: 'special', path: importSource };
    }

    return null;
}

// ── Rule checking ──

/**
 * Check if an import violates namespace rules.
 * Returns error message if violation, null if OK.
 */
function checkImport(importInfo, currentNamespace, currentFilePath) {
    if (!importInfo) return null;

    const { namespace: targetNamespace, path: importPath } = importInfo;
    const rules = RULES[currentNamespace];

    if (!rules) return null;

    // Special path handling (src/router.js, src/routes.config.js, etc.)
    if (targetNamespace === 'special') {
        if (rules.allowedSpecialPaths?.some(p => importPath.includes(p))) {
            return null;
        }
        // If not in allowedSpecialPaths, it's a violation
        return `${currentNamespace}/ cannot import ${importPath}`;
    }

    // Check if target namespace is explicitly forbidden
    if (rules.cannotImport.includes(targetNamespace)) {
        // Check for component-level exceptions
        if (rules.allowPageImports && targetNamespace === 'page') {
            const rel = relative(PROJECT_ROOT, currentFilePath);
            const componentPath = rel.match(/src\/modules\/([\w/]+)\/[\w.]+$/)?.[1];
            if (componentPath && rules.allowPageImports.includes(componentPath)) {
                return null; // Exception allowed
            }
        }

        // Special case: page/ cannot import other page/ components
        if (currentNamespace === 'page' && targetNamespace === 'page') {
            return `${currentNamespace}/ cannot import other page/ components (${importPath})`;
        }
        return `${currentNamespace}/ cannot import from ${targetNamespace}/ (${importPath})`;
    }

    // Check if target namespace is allowed
    if (rules.canImport.includes(targetNamespace)) {
        // Namespaces with allowedDataPaths can only import from those paths, not arbitrary data/
        if (targetNamespace === 'data' && rules.allowedDataPaths) {
            if (!rules.allowedDataPaths.some(p => importPath.startsWith(p))) {
                const allowed = rules.allowedDataPaths.join(' or ');
                return `${currentNamespace}/ can only import from ${allowed}, not ${importPath}. Move data access into a service module (data/services/).`;
            }
        }
        return null;
    }

    // If we get here, it's not explicitly allowed or forbidden — depends on the rule
    // For ui/, only ui/ and data/labels/ are allowed
    if (currentNamespace === 'ui' && targetNamespace !== 'ui') {
        if (targetNamespace === 'data' && rules.allowedDataPaths?.some(p => importPath.startsWith(p))) {
            return null;
        }
        return `${currentNamespace}/ cannot import from ${targetNamespace}/ (${importPath})`;
    }

    return null;
}

// ── File checking ──

function checkFile(filePath) {
    const namespace = getFileNamespace(filePath);
    if (!namespace) {
        return []; // Not in a namespace directory
    }

    const imports = extractImports(filePath);
    const violations = [];

    for (const imp of imports) {
        const importInfo = getImportNamespace(imp.source, filePath);
        const error = checkImport(importInfo, namespace, filePath);

        if (error) {
            violations.push({
                file: relative(PROJECT_ROOT, filePath),
                line: imp.line,
                import: imp.source,
                error
            });
        }
    }

    return violations;
}

// ── Main ──

async function main() {
    const args = parseArgs();
    let filesToCheck = [];

    if (args.mode === 'hook') {
        const filePath = await readHookInput();
        if (!filePath) {
            process.exit(0); // No file path in input
        }

        // Check if file is in src/modules/ and is a .js file
        const rel = relative(PROJECT_ROOT, filePath);
        if (!rel.startsWith('src/modules/') || !filePath.endsWith('.js')) {
            process.exit(0); // Not a file we care about
        }

        filesToCheck = [filePath];
    } else if (args.mode === 'file') {
        filesToCheck = [args.filePath];
    } else {
        // Full scan
        const modulesDir = join(PROJECT_ROOT, 'src/modules');
        filesToCheck = walkDir(modulesDir);
    }

    const allViolations = [];

    for (const file of filesToCheck) {
        const violations = checkFile(file);
        allViolations.push(...violations);
    }

    // Report
    if (allViolations.length === 0) {
        if (args.mode === 'full') {
            console.log('lint-import-boundaries: ✓ no violations');
        }
        process.exit(0);
    }

    console.error(`❌ lint-import-boundaries: ${allViolations.length} violation(s)\n`);

    for (const v of allViolations) {
        console.error(`  ${v.file}:${v.line}`);
        console.error(`    import: ${v.import}`);
        console.error(`    error: ${v.error}\n`);
    }

    process.exit(1);
}

main().catch((err) => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
});
