/**
 * Auth mode selector (Vite bakes VITE_* in at build time; restart dev after changes).
 *
 *   AUTH_MODES.SALESFORCE  — Firebase + Google, @salesforce.com only
 *   AUTH_MODES.NONE        — no gate; local / internal prototype work
 *
 * Default logic: if Firebase keys are present → salesforce; otherwise → none.
 * Back-compat: VITE_REQUIRE_AUTH=false forces NONE (matches older local .env files).
 */

export const AUTH_MODES = Object.freeze({
    SALESFORCE: 'salesforce',
    NONE: 'none',
});

const VALID_MODES = new Set(Object.values(AUTH_MODES));

function hasFirebaseKeys() {
    const key = import.meta.env.VITE_FIREBASE_API_KEY;
    return typeof key === 'string' && key.trim().length > 0;
}

function resolveMode() {
    if (import.meta.env.VITE_REQUIRE_AUTH === 'false') {
        return AUTH_MODES.NONE;
    }

    const raw = (import.meta.env.VITE_AUTH_MODE ?? '').toString().trim().toLowerCase();
    if (VALID_MODES.has(raw)) {
        return raw;
    }

    // Firebase keys present (Heroku) → require auth; absent (local) → no gate
    return hasFirebaseKeys() ? AUTH_MODES.SALESFORCE : AUTH_MODES.NONE;
}

export const AUTH_MODE = resolveMode();

export function isSalesforceAuth() {
    return AUTH_MODE === AUTH_MODES.SALESFORCE;
}

export function isAuthDisabled() {
    return AUTH_MODE === AUTH_MODES.NONE;
}
