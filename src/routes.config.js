/**
 * Single source of truth for app routes.
 * Consumed by router.js (matching, titles) and app (nav maps, nav items).
 *
 * Fields:
 *   path       - URL pattern (use :param for dynamic segments)
 *   component  - LWC component name (must be registered in app.js ROUTE_COMPONENTS)
 *   title      - Document title (string or (params) => string)
 *   navPage    - Id for nav active state and navigate({ page }) (omit to hide from nav)
 *   navLabel   - Label shown in nav bar and waffle
 *   navPath    - Optional; for dynamic routes, path used in nav links (e.g. /users/42)
 *   navHighlight - Optional; nav page id to highlight when this route is active (for child routes that don't create a tab)
 */

export const routes = [
  {
    path: '/',
    component: 'page-home',
    title: 'Home',
    navPage: 'home',
    navLabel: 'Home',
  },
  {
    path: '/icons',
    component: 'page-icon-test',
    title: 'Icons',
    navPage: 'icons',
    navLabel: 'Icons',
  },
  {
    path: '/settings',
    component: 'page-settings',
    title: 'Settings',
    navPage: 'settings',
    navLabel: 'Settings',
  },
  {
    path: '/churn-rate-segment',
    component: 'page-churn-rate-segment',
    title: 'Churn Rate Segment',
    navPage: 'churn-rate-segment',
    navLabel: 'Churn Rate Segment',
  },
  {
    path: '/users/:id',
    component: 'page-user',
    title: (params) => `User ${params.id}`,
    navPage: 'user',
    navLabel: 'User',
    navPath: '/users/42',
  },
  {
    path: '/contacts',
    component: 'page-contacts',
    title: 'Contacts',
    navPage: 'contacts',
    navLabel: 'Contacts',
  },
  {
    path: '/contacts/:id',
    component: 'page-contact-detail',
    title: (params) => `Contact ${params.id}`,
    navHighlight: 'contacts',
  },
  {
    path: '/connect-unify/item-1',
    component: 'page-connect-unify1',
    title: 'Connect & Unify — Item 1',
  },
  {
    path: '/connect-unify/item-2',
    component: 'page-connect-unify2',
    title: 'Connect & Unify — Item 2',
  },
  {
    path: '/connect-unify/item-3',
    component: 'page-connect-unify3',
    title: 'Connect & Unify — Item 3',
  },
  {
    path: '/govern-secure/item-1',
    component: 'page-govern-secure1',
    title: 'Govern & Secure — Item 1',
  },
  {
    path: '/govern-secure/item-2',
    component: 'page-govern-secure2',
    title: 'Govern & Secure — Item 2',
  },
  {
    path: '/govern-secure/item-3',
    component: 'page-govern-secure3',
    title: 'Govern & Secure — Item 3',
  },
  {
    path: '/process-enrich/item-1',
    component: 'page-process-enrich1',
    title: 'Process & Enrich — Item 1',
  },
  {
    path: '/process-enrich/item-2',
    component: 'page-process-enrich2',
    title: 'Process & Enrich — Item 2',
  },
  {
    path: '/process-enrich/item-3',
    component: 'page-process-enrich3',
    title: 'Process & Enrich — Item 3',
  },
  {
    path: '/explore-optimize/item-1',
    component: 'page-explore-optimize1',
    title: 'Explore & Optimize — Item 1',
  },
  {
    path: '/explore-optimize/item-2',
    component: 'page-explore-optimize2',
    title: 'Explore & Optimize — Item 2',
  },
  {
    path: '/explore-optimize/item-3',
    component: 'page-explore-optimize3',
    title: 'Explore & Optimize — Item 3',
  },
  {
    path: '/nba-model-detail',
    component: 'page-nba-model-detail',
    title: 'AI Models — Predict',
    navPage: 'nba-model-detail',
    navLabel: 'AI Models',
  },
  {
    path: '/analyze-predict/item-1',
    component: 'page-analyze-predict1',
    title: 'Analyze & Predict — Item 1',
  },
  {
    path: '/analyze-predict/item-2',
    component: 'page-analyze-predict2',
    title: 'Analyze & Predict — Item 2',
  },
  {
    path: '/analyze-predict/item-3',
    component: 'page-analyze-predict3',
    title: 'Analyze & Predict — Item 3',
  },
  {
    path: '/segment-act/item-1',
    component: 'page-segment-act1',
    title: 'Segment & Act — Item 1',
  },
  {
    path: '/segment-act/item-2',
    component: 'page-segment-act2',
    title: 'Segment & Act — Item 2',
  },
  {
    path: '/segment-act/item-3',
    component: 'page-segment-act3',
    title: 'Segment & Act — Item 3',
  },
  {
    path: '/compare-versions',
    component: 'page-compare-versions',
    title: 'AI Models — Compare Versions',
    navHighlight: 'nba-model-detail',
  },
  { path: '/aim-home', component: 'page-nba-model-detail', title: 'AI Models — Home' },
  { path: '/aim-job-monitor', component: 'page-nba-model-detail', title: 'AI Models — Job Monitor' },
  { path: '/aim-library', component: 'page-nba-model-detail', title: 'AI Models — Library' },
  { path: '/aim-cluster', component: 'page-cluster-models', title: 'AI Models — Cluster' },
  { path: '/aim-cluster/builder', component: 'page-cluster-builder', title: 'Clustering Model Builder', fullscreen: true },
  { path: '/aim-forecast', component: 'page-nba-model-detail', title: 'AI Models — Forecast' },
  { path: '/aim-generate', component: 'page-nba-model-detail', title: 'AI Models — Generate' },
  { path: '/aim-optimize', component: 'page-nba-model-detail', title: 'AI Models — Optimize' },
  { path: '/aim-retrieve', component: 'page-nba-model-detail', title: 'AI Models — Retrieve' },
  { path: '/aim-sentiment', component: 'page-nba-model-detail', title: 'AI Models — Sentiment' },
  { path: '/aim-topic', component: 'page-nba-model-detail', title: 'AI Models — Topic Classification' },
  { path: '/aim-predict', component: 'page-predict-models', title: 'AI Models — Predict', navHighlight: 'nba-model-detail' },
  { path: '/aim-feature-manager', component: 'page-feature-manager', title: 'AI Models — Feature Manager' },
  {
    path: '*',
    component: 'page-not-found',
    title: 'Page Not Found',
  },
];
