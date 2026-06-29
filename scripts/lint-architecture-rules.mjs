#!/usr/bin/env node

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { resolve, dirname, join, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// Parse CLI args
const args = process.argv.slice(2);
const isHookMode = args.includes('--hook');
const fileArgIndex = args.indexOf('--file');
const targetFile = fileArgIndex >= 0 ? args[fileArgIndex + 1] : null;

// Valid namespaces
const VALID_NAMESPACES = ['shell', 'page', 'ui', 'data'];

// CSS property rules
const VISUAL_PROPS = [
  'background',
  'background-color',
  'background-image',
  'backdrop-filter',
  'border-color',
  'border-top-color',
  'border-bottom-color',
  'border-left-color',
  'border-right-color',
  'box-shadow',
  'color',
  'fill',
  'stroke'
];

const LAYOUT_PROPS = [
  'position',
  'z-index',
  'top',
  'left',
  'right',
  'bottom',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'padding',
  'padding-top',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'margin',
  'margin-top',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'display',
  'flex',
  'grid'
];

// Issue tracking
const issues = {
  blocking: [],
  warnings: []
};

function addIssue(type, check, file, line, message) {
  const issue = { check, file, line, message };
  if (type === 'blocking') {
    issues.blocking.push(issue);
  } else {
    issues.warnings.push(issue);
  }
}

// Check 1: Namespace placement
function checkNamespacePlacement(filePath) {
  const relativePath = filePath.replace(ROOT + '/', '');
  if (!relativePath.startsWith('src/modules/')) return;

  const parts = relativePath.replace('src/modules/', '').split('/');
  const namespace = parts[0];

  if (!VALID_NAMESPACES.includes(namespace)) {
    addIssue(
      'blocking',
      'NamespacePlacement',
      relativePath,
      1,
      `Invalid namespace '${namespace}'. Must be one of: ${VALID_NAMESPACES.join(', ')}`
    );
  }
}

// Check 2: CSS responsibility
function checkCssResponsibility(filePath, content) {
  const relativePath = filePath.replace(ROOT + '/', '');
  const isCosmosApp = relativePath === 'src/modules/shell/cosmosApp/cosmosApp.css';
  const isCosmosTheme = relativePath === 'public/cosmos-theme.css';

  if (!isCosmosApp && !isCosmosTheme) return;

  const lines = content.split('\n');
  let currentSelector = '';

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//')) {
      return;
    }

    // Track current selector (lines ending with '{' are selectors)
    if (trimmed.endsWith('{')) {
      currentSelector = trimmed;
    } else if (trimmed === '}') {
      currentSelector = '';
    }

    if (isCosmosApp) {
      for (const prop of VISUAL_PROPS) {
        const regex = new RegExp(`^${prop}\\s*:`);
        if (regex.test(trimmed)) {
          // Allow: transparent, inherit, var(--cos-*) token consumption
          if (
            trimmed.includes('transparent') ||
            trimmed.includes('inherit') ||
            trimmed.includes('var(--cos-')
          ) {
            continue;
          }
          addIssue(
            'warning',
            'CssResponsibility',
            relativePath,
            idx + 1,
            `cosmosApp.css should not contain visual property '${prop}' (belongs in cosmos-theme.css)`
          );
        }
      }
    }

    if (isCosmosTheme) {
      for (const prop of LAYOUT_PROPS) {
        const regex = new RegExp(`^${prop}\\s*:`);
        if (regex.test(trimmed)) {
          // Allow layout props when targeting SLDS/Lightning internals, body pseudo-elements,
          // or global shell elements that require cross-shadow reset
          const selectorTargetsSlds =
            currentSelector.includes('.slds-') ||
            currentSelector.includes('lightning-') ||
            currentSelector.includes('::before') ||
            currentSelector.includes('::after') ||
            currentSelector.includes('> #app') ||
            currentSelector.includes('.global-');
          if (selectorTargetsSlds) {
            continue;
          }
          addIssue(
            'warning',
            'CssResponsibility',
            relativePath,
            idx + 1,
            `cosmos-theme.css should not contain layout property '${prop}' (belongs in cosmosApp.css)`
          );
        }
      }
    }
  });
}

// Check 3: Label enforcement
function checkLabelEnforcement(filePath, content) {
  const relativePath = filePath.replace(ROOT + '/', '');

  // Only check .html files in page/, ui/, shell/
  if (!relativePath.endsWith('.html')) return;
  if (!relativePath.startsWith('src/modules/')) return;

  const namespace = relativePath.replace('src/modules/', '').split('/')[0];
  if (!['page', 'ui', 'shell'].includes(namespace)) return;

  const lines = content.split('\n');
  const userFacingAttrs = [
    'title',
    'label',
    'placeholder',
    'alternative-text',
    'aria-label'
  ];

  lines.forEach((line, idx) => {
    for (const attr of userFacingAttrs) {
      // Match attr="value" where value contains at least one letter
      const regex = new RegExp(`${attr}="([^"]*[a-zA-Z][^"]*)"`, 'g');
      let match;

      while ((match = regex.exec(line)) !== null) {
        const value = match[1];
        // Skip if it looks like a binding expression
        if (value.startsWith('{') || value.includes('labels.')) {
          continue;
        }

        const componentName = relativePath.split('/').slice(-2, -1)[0];
        const labelModule = componentName.charAt(0).toUpperCase() + componentName.slice(1);
        addIssue(
          'blocking',
          'LabelEnforcement',
          relativePath,
          idx + 1,
          `Hardcoded string in ${attr}="${value}". Fix: add to data/labels/${labelModule}.js and use {labels.YourLabel} binding`
        );
      }
    }
  });
}

// Check 4: Component completeness
function checkComponentCompleteness(namespace) {
  const namespacePath = join(ROOT, 'src', 'modules', namespace);

  if (!existsSync(namespacePath)) return;

  const entries = readdirSync(namespacePath);

  for (const entry of entries) {
    const entryPath = join(namespacePath, entry);
    const stat = statSync(entryPath);

    if (!stat.isDirectory()) continue;

    const htmlPath = join(entryPath, `${entry}.html`);
    const jsPath = join(entryPath, `${entry}.js`);

    const hasHtml = existsSync(htmlPath);
    const hasJs = existsSync(jsPath);

    if (!hasHtml || !hasJs) {
      const missing = [];
      if (!hasHtml) missing.push('.html');
      if (!hasJs) missing.push('.js');

      addIssue(
        'warning',
        'ComponentCompleteness',
        `src/modules/${namespace}/${entry}/`,
        1,
        `Missing ${missing.join(' and ')} file(s)`
      );
    }
  }
}

// Main check function
function checkFile(filePath) {
  const absolutePath = resolve(ROOT, filePath);

  // Skip if file doesn't exist
  if (!existsSync(absolutePath)) return;

  const ext = extname(absolutePath);

  // Read file content for relevant checks
  let content = '';
  if (['.html', '.css', '.js'].includes(ext)) {
    content = readFileSync(absolutePath, 'utf-8');
  }

  // Run applicable checks
  checkNamespacePlacement(absolutePath);

  if (ext === '.css') {
    checkCssResponsibility(absolutePath, content);
  }

  if (ext === '.html') {
    checkLabelEnforcement(absolutePath, content);
  }
}

// Full scan mode
function fullScan() {
  // Check namespace placement and component completeness
  const modulesPath = join(ROOT, 'src', 'modules');

  if (existsSync(modulesPath)) {
    const namespaces = readdirSync(modulesPath);

    for (const namespace of namespaces) {
      const namespacePath = join(modulesPath, namespace);
      const stat = statSync(namespacePath);

      if (!stat.isDirectory()) continue;

      // Check component completeness for page and ui
      if (['page', 'ui'].includes(namespace)) {
        checkComponentCompleteness(namespace);
      }

      // Walk all files in namespace
      walkDirectory(namespacePath);
    }
  }

  // Check the two special CSS files
  const cosmosAppCss = join(ROOT, 'src', 'modules', 'shell', 'cosmosApp', 'cosmosApp.css');
  const cosmosThemeCss = join(ROOT, 'public', 'cosmos-theme.css');

  if (existsSync(cosmosAppCss)) {
    checkFile(cosmosAppCss);
  }

  if (existsSync(cosmosThemeCss)) {
    checkFile(cosmosThemeCss);
  }
}

function walkDirectory(dir) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const entryPath = join(dir, entry);
    const stat = statSync(entryPath);

    if (stat.isDirectory()) {
      walkDirectory(entryPath);
    } else {
      checkFile(entryPath);
    }
  }
}

// Hook mode: read stdin
function hookMode() {
  let stdinData = '';

  process.stdin.on('data', (chunk) => {
    stdinData += chunk;
  });

  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(stdinData);
      const filePath = data.tool_input?.file_path || data.tool_input?.path;

      if (!filePath) {
        process.exit(0);
      }

      const relativePath = filePath.replace(ROOT + '/', '');

      // Only check files in src/modules/ or public/
      if (!relativePath.startsWith('src/modules/') && !relativePath.startsWith('public/')) {
        process.exit(0);
      }

      // Only check relevant file types
      const ext = extname(filePath);
      if (!['.html', '.css', '.js'].includes(ext)) {
        process.exit(0);
      }

      // Check the file
      checkFile(filePath);

      // Output results
      outputResults(true);
    } catch (err) {
      // Invalid JSON or other error, exit silently
      process.exit(0);
    }
  });
}

// Output results
function outputResults(isHook) {
  const hasBlocking = issues.blocking.length > 0;
  const hasWarnings = issues.warnings.length > 0;

  if (hasBlocking) {
    console.error(`❌ lint-architecture-rules: ${issues.blocking.length} violation(s)`);
    for (const issue of issues.blocking) {
      console.error(`  [${issue.check}] ${issue.file}:${issue.line}`);
      console.error(`  → ${issue.message}`);
    }
    console.error('');
    console.error('Ask the user if they would like you to fix these violations.');
    process.exit(1);
  }

  if (hasWarnings) {
    console.log(`⚠️  lint-architecture-rules: ${issues.warnings.length} warning(s)`);
    for (const issue of issues.warnings) {
      console.log(`[${issue.check}] ${issue.file}:${issue.line}`);
      console.log(`→ ${issue.message}`);
    }
    process.exit(0);
  }

  // Only show success message in non-hook full scan mode
  if (!isHook && !targetFile) {
    console.log('lint-architecture-rules: ✓ no violations');
  }

  process.exit(0);
}

// Main execution
if (isHookMode) {
  hookMode();
} else if (targetFile) {
  checkFile(targetFile);
  outputResults(false);
} else {
  fullScan();
  outputResults(false);
}
