/**
 * Mini router for LWC – declarative routes, dynamic params, History API.
 * No page refresh; back/forward supported.
 * Routes are defined in routes.config.js; apps (URL prefixes that scope a set
 * of routes) are defined in apps.config.js.
 *
 * Supports two URL modes:
 *   - pathname (default): uses pushState, requires server-side SPA fallback
 *   - hash: uses #/path URLs, works on static hosts like GitHub Pages
 *
 * Set VITE_ROUTER_MODE=hash in .env.gh-pages for static deployments.
 */

import { routes } from './routes.config.js';
import {
  getAppById,
  getAppForPath,
  stripAppPrefix,
  withAppPrefix,
  getPersistedAppId,
  DEFAULT_APP_ID,
} from './apps.config.js';

const DEFAULT_TITLE = 'Salesforce';

const HASH_MODE = import.meta.env.VITE_ROUTER_MODE === 'hash';

const listeners = new Set();

let _currentAppId = getPersistedAppId();

export function setCurrentAppForLinks(appId) {
  if (appId && getAppById(appId)) {
    _currentAppId = appId;
  }
}

function getActiveAppForBuild() {
  return getAppById(_currentAppId) || getAppById(DEFAULT_APP_ID);
}

function normalizeLogicalPath(path) {
  let normalized =
    !path || path === '/' ? '/' : path.startsWith('/') ? path : `/${path}`;
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

function getLogicalPath() {
  if (!HASH_MODE) {
    return normalizeLogicalPath(window.location.pathname);
  }
  const locationHash = window.location.hash;
  if (!locationHash || locationHash === '#' || locationHash === '#/') {
    return '/';
  }
  if (locationHash.startsWith('#/')) {
    const afterHashSlash = locationHash.slice(2);
    const fragmentBeforeQuery = afterHashSlash.split('?')[0];
    const rawLogical = fragmentBeforeQuery ? `/${fragmentBeforeQuery}` : '/';
    return normalizeLogicalPath(rawLogical);
  }
  return '/';
}

function hashUrlFromLogicalPath(logicalPath) {
  const fragmentBody = logicalPath === '/' ? '' : logicalPath.slice(1);
  return `#/${fragmentBody}`;
}

function writeUrl(logicalPath, replace = false) {
  const url = HASH_MODE ? hashUrlFromLogicalPath(logicalPath) : logicalPath;
  if (replace) {
    history.replaceState({}, '', url);
  } else {
    history.pushState({}, '', url);
  }
}

/**
 * `href` for anchors (nav, copy link). When `logicalPath` already includes a
 * known app prefix it is preserved; otherwise the active app's prefix is
 * prepended so callers can keep using logical paths from routes.config.js.
 */
export function linkHref(logicalPath, appId) {
  const path = normalizeLogicalPath(logicalPath);
  const existingApp = getAppForPath(path);
  const finalPath = existingApp
    ? path
    : withAppPrefix(
        path,
        (appId && getAppById(appId)) || getActiveAppForBuild()
      );
  if (!HASH_MODE) {
    return finalPath;
  }
  return hashUrlFromLogicalPath(finalPath);
}

function matchRoute(path) {
  const app = getAppForPath(path);
  if (!app) return null;
  const subPath = stripAppPrefix(path, app);

  for (const route of routes) {
    if (route.path === '*') {
      return { ...route, params: {}, app: app.id };
    }

    const keys = [];
    const pattern = route.path.replace(/:([^/]+)/g, (_match, paramName) => {
      keys.push(paramName);
      return '([^/]+)';
    });

    const regex = new RegExp(`^${pattern}$`);
    const match = subPath.match(regex);

    if (match) {
      const params = {};
      keys.forEach((paramKey, i) => (params[paramKey] = match[i + 1]));
      return { ...route, params, app: app.id };
    }
  }

  return null;
}

function getTitleForRoute(route) {
  if (!route?.title) return DEFAULT_TITLE;
  return typeof route.title === 'function'
    ? route.title(route.params || {})
    : route.title;
}

function notify() {
  const path = getLogicalPath();
  const app = getAppForPath(path);

  if (!app) {
    const target = getActiveAppForBuild().defaultPath;
    if (!getAppForPath(target)) {
      console.error(
        `[router] defaultPath "${target}" does not match any app prefix. Check apps.config.js.`
      );
      return;
    }
    writeUrl(target, true);
    return notify();
  }

  _currentAppId = app.id;

  const route = matchRoute(path);
  document.title = getTitleForRoute(route);
  listeners.forEach((listener) => listener(route));
}

export function navigate(path) {
  const normalized = normalizeLogicalPath(path);
  const existingApp = getAppForPath(normalized);
  const logical = existingApp
    ? normalized
    : withAppPrefix(normalized, getActiveAppForBuild());
  if (logical === getLogicalPath()) {
    return;
  }
  writeUrl(logical);
  notify();
}

export function getCurrentRoute() {
  return matchRoute(getLogicalPath());
}

export function subscribe(callback) {
  listeners.add(callback);
  const initialPath = getLogicalPath();
  if (!getAppForPath(initialPath)) {
    writeUrl(getActiveAppForBuild().defaultPath, true);
  }
  const route = matchRoute(getLogicalPath());
  document.title = getTitleForRoute(route);
  if (route?.app) _currentAppId = route.app;
  callback(route);

  return () => listeners.delete(callback);
}

window.addEventListener('popstate', notify);
if (HASH_MODE) {
  window.addEventListener('hashchange', notify);
}
