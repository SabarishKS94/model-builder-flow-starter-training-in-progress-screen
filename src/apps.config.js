/**
 * Single source of truth for "apps" — a layer above routes.
 *
 * Each app declares:
 *   id          - Stable identifier used in storage and events
 *   label       - Display name shown in the App Launcher (waffle)
 *   variant     - Navigation layout: "standard" (tabs), "console" (object switcher),
 *                 or "vertical" (collapsible sidebar with nested groups)
 *   pathPrefix  - URL prefix that scopes the app's routes (e.g. /app, /console)
 *   defaultPath - Where to land when the app is opened from the App Launcher
 *   pages       - Ordered list of navPage ids (from routes.config.js) the app
 *                 surfaces in its primary navigation. Pages can be shared
 *                 across multiple apps.
 *   navItems    - (vertical variant only) Nested navigation groups with children
 *
 * Routes themselves stay in routes.config.js with logical (un-prefixed) paths;
 * the router strips/prepends the active app's prefix on the way in/out.
 */

export const APP_STORAGE_KEY = 'shell-current-app';

export const apps = [
  {
    id: 'data360',
    label: 'Data 360',
    variant: 'vertical',
    pathPrefix: '/app',
    defaultPath: '/app',
    pages: ['home', 'nba-model-detail'],
    aiModelsNavItems: [
      {
        id: 'ai-models-general',
        label: 'AI Models',
        icon: '',
        description: '',
        children: [
          { id: 'aim-home', label: 'Home', path: '/aim-home', component: 'page-nba-model-detail' },
          { id: 'aim-job-monitor', label: 'Job Monitor', path: '/aim-job-monitor', component: 'page-nba-model-detail' },
          { id: 'aim-library', label: 'Library', path: '/aim-library', component: 'page-nba-model-detail' },
        ],
      },
      {
        id: 'ai-functions',
        label: 'AI Functions',
        icon: '',
        description: '',
        children: [
          { id: 'aim-cluster', label: 'Cluster', path: '/aim-cluster', component: 'page-cluster-models' },
          { id: 'aim-forecast', label: 'Forecast', path: '/aim-forecast', component: 'page-nba-model-detail' },
          { id: 'aim-generate', label: 'Generate', path: '/aim-generate', component: 'page-nba-model-detail' },
          { id: 'aim-optimize', label: 'Optimize', path: '/aim-optimize', component: 'page-nba-model-detail' },
          { id: 'aim-predict', label: 'Predict', path: '/aim-predict', component: 'page-predict-models' },
          { id: 'aim-retrieve', label: 'Retrieve', path: '/aim-retrieve', component: 'page-nba-model-detail' },
          { id: 'aim-sentiment', label: 'Sentiment', path: '/aim-sentiment', component: 'page-nba-model-detail' },
          { id: 'aim-topic', label: 'Topic Classification', path: '/aim-topic', component: 'page-nba-model-detail' },
        ],
      },
      {
        id: 'ai-settings',
        label: 'Settings',
        icon: '',
        description: '',
        children: [
          { id: 'aim-feature-manager', label: 'Feature Manager', path: '/aim-feature-manager', component: 'page-feature-manager' },
        ],
      },
    ],
    navItems: [
      {
        id: 'connect-unify',
        label: 'Connect & Unify',
        icon: 'utility:data_mapping',
        description: 'Connect or ingest data. Then, transform, harmonize, and unify it.',
        children: [
          { id: 'cu-item-1', label: 'Item 1', path: '/connect-unify/item-1', component: 'page-connect-unify1' },
          { id: 'cu-item-2', label: 'Item 2', path: '/connect-unify/item-2', component: 'page-connect-unify2' },
          { id: 'cu-item-3', label: 'Item 3', path: '/connect-unify/item-3', component: 'page-connect-unify3' },
        ],
      },
      {
        id: 'govern-secure',
        label: 'Govern & Secure',
        icon: 'utility:shield',
        description: 'Define access, security, and governance for your Data 360 data.',
        children: [
          { id: 'gs-item-1', label: 'Item 1', path: '/govern-secure/item-1', component: 'page-govern-secure1' },
          { id: 'gs-item-2', label: 'Item 2', path: '/govern-secure/item-2', component: 'page-govern-secure2' },
          { id: 'gs-item-3', label: 'Item 3', path: '/govern-secure/item-3', component: 'page-govern-secure3' },
        ],
      },
      {
        id: 'process-enrich',
        label: 'Process & Enrich',
        icon: 'utility:process',
        description: 'Intelligently identify, analyze, and categorize data for use with AI.',
        children: [
          { id: 'pe-item-1', label: 'Item 1', path: '/process-enrich/item-1', component: 'page-process-enrich1' },
          { id: 'pe-item-2', label: 'Item 2', path: '/process-enrich/item-2', component: 'page-process-enrich2' },
          { id: 'pe-item-3', label: 'Item 3', path: '/process-enrich/item-3', component: 'page-process-enrich3' },
        ],
      },
      {
        id: 'explore-optimize',
        label: 'Explore & Optimize',
        icon: 'utility:table',
        description: 'View, query, and optimize data across large datasets.',
        children: [
          { id: 'eo-item-1', label: 'Item 1', path: '/explore-optimize/item-1', component: 'page-explore-optimize1' },
          { id: 'eo-item-2', label: 'Item 2', path: '/explore-optimize/item-2', component: 'page-explore-optimize2' },
          { id: 'eo-item-3', label: 'Item 3', path: '/explore-optimize/item-3', component: 'page-explore-optimize3' },
        ],
      },
      {
        id: 'analyze-predict',
        label: 'Analyze & Predict',
        icon: 'utility:chart',
        description: 'Explore your data and build predictive AI models.',
        children: [
          { id: 'ap-item-1', label: 'Item 1', path: '/analyze-predict/item-1', component: 'page-analyze-predict1' },
          { id: 'ap-item-2', label: 'Item 2', path: '/analyze-predict/item-2', component: 'page-analyze-predict2' },
          { id: 'ap-item-3', label: 'Item 3', path: '/analyze-predict/item-3', component: 'page-analyze-predict3' },
        ],
      },
      {
        id: 'segment-act',
        label: 'Segment & Act',
        icon: 'utility:segments',
        description: 'Segment your data. Take action on data and share it externally.',
        children: [
          { id: 'sa-item-1', label: 'Item 1', path: '/segment-act/item-1', component: 'page-segment-act1' },
          { id: 'sa-item-2', label: 'Item 2', path: '/segment-act/item-2', component: 'page-segment-act2' },
          { id: 'sa-item-3', label: 'Item 3', path: '/segment-act/item-3', component: 'page-segment-act3' },
        ],
      },
    ],
  },
  {
    id: 'template',
    label: 'Template App',
    variant: 'standard',
    pathPrefix: '/template',
    defaultPath: '/template',
    pages: ['home', 'icons', 'settings', 'churn-rate-segment', 'user', 'contacts'],
    navItems: [],
  },
  {
    id: 'console',
    label: 'Console App',
    variant: 'console',
    pathPrefix: '/console',
    defaultPath: '/console',
    pages: ['home', 'contacts'],
    navItems: [],
  },
];

export const DEFAULT_APP_ID = 'data360';

export function getAppById(id) {
  return apps.find((a) => a.id === id) ?? null;
}

/**
 * Find which app owns a logical path by longest matching prefix.
 * Returns null if no app prefix matches (e.g. bare "/").
 */
export function getAppForPath(logicalPath) {
  if (!logicalPath) return null;
  const sorted = [...apps].sort(
    (a, b) => b.pathPrefix.length - a.pathPrefix.length
  );
  for (const app of sorted) {
    if (
      logicalPath === app.pathPrefix ||
      logicalPath.startsWith(`${app.pathPrefix}/`)
    ) {
      return app;
    }
  }
  return null;
}

/** Strip an app's prefix off a logical path. Returns "/" for the bare prefix. */
export function stripAppPrefix(logicalPath, app) {
  if (!app) return logicalPath;
  if (logicalPath === app.pathPrefix) return '/';
  if (logicalPath.startsWith(`${app.pathPrefix}/`)) {
    return logicalPath.slice(app.pathPrefix.length);
  }
  return logicalPath;
}

/** Prepend an app's prefix to a logical path. "/" becomes the bare prefix. */
export function withAppPrefix(logicalPath, app) {
  if (!app) return logicalPath;
  if (logicalPath === '/' || !logicalPath) return app.pathPrefix;
  return `${app.pathPrefix}${logicalPath}`;
}

/** Last-used app id from localStorage, or DEFAULT_APP_ID. */
export function getPersistedAppId() {
  try {
    const stored = localStorage.getItem(APP_STORAGE_KEY);
    return stored && getAppById(stored) ? stored : DEFAULT_APP_ID;
  } catch {
    return DEFAULT_APP_ID;
  }
}

export function persistAppId(id) {
  try {
    localStorage.setItem(APP_STORAGE_KEY, id);
  } catch {
    /* storage unavailable; non-fatal */
  }
}
