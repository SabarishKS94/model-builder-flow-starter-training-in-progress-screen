# Firebase Google Authentication — Design Spec

**Date:** 2026-03-30  
**Status:** Approved

---

## Overview

Add Firebase Authentication with Google sign-in to the Vite + LWC app. The entire app is gated behind authentication — no route is public. Only `@salesforce.com` email addresses are permitted. After sign-in, users land on the URL they originally tried to visit, or `/` if they navigated directly to the login screen.

---

## Architecture

### New files

| File | Purpose |
|---|---|
| `src/data/firebaseConfig.js` | Firebase project credentials loaded from `import.meta.env` |
| `src/data/firebaseAuth.js` | Firebase init, `onAuthStateChanged` subscription, `signInWithGoogle()`, `signOut()` |
| `src/modules/shell/login/login.html` | Login page template — full-viewport centered layout, Google sign-in button, error message |
| `src/modules/shell/login/login.js` | Login component — calls `signInWithGoogle()`, fires `loginsuccess` event |
| `.env.example` | Placeholder env vars — committed to git |
| `.env` | Real Firebase credentials — gitignored |

### Modified files

| File | Change |
|---|---|
| `src/modules/shell/app/app.js` | Add `_authUser`, `_redirectPath`, auth subscription in `connectedCallback` |
| `src/modules/shell/app/app.html` | Conditionally render `shell-login` or route content |
| `src/modules/shell/globalHeader/globalHeader.html` | Add sign-out button |
| `src/modules/shell/globalHeader/globalHeader.js` | Handle sign-out, fire event to app |
| `.gitignore` | Add `.env` |

---

## Data Flow

### Sign-in
1. App mounts → `firebaseAuth.onAuthStateChanged` fires
2. No user → capture `window.location.pathname` as `_redirectPath`, set `_authUser = null` → `shell-login` renders
3. User clicks "Sign in with Google" → Firebase popup opens
4. Google returns credential → Firebase resolves with `user` object
5. App checks `user.email.endsWith('@salesforce.com')`
   - **Invalid domain:** call `signOut()`, set error message on login component, stay on login screen
   - **Valid domain:** set `_authUser = user`, navigate to `_redirectPath` (or `/`), render matched route

### Sign-out
1. User clicks sign-out in global header
2. `firebaseAuth.signOut()` called
3. `onAuthStateChanged` fires with `null`
4. `shell/app` sets `_authUser = null`, captures current path as `_redirectPath`, renders `shell-login`

### Route guard
- `shell/app` renders route content only when `_authUser` is non-null
- The router parses every URL normally — the guard prevents any route component from mounting, not the router itself
- Direct URL entry is blocked: the URL is parsed and stored as `_redirectPath`, but the route component never renders until auth is confirmed

---

## Components

### `data/firebaseAuth.js`
Plain JS module (not an LWC component). Responsibilities:
- Initialize Firebase app from config
- Export `onAuthStateChanged(callback)` — returns unsubscribe function
- Export `signInWithGoogle()` — uses `signInWithPopup` with `GoogleAuthProvider`
- Export `signOut()`

### `shell/login`
LWC component. Responsibilities:
- Full-viewport centered layout using SLDS utility classes
- Single "Sign in with Google" `lightning-button`
- Optional error paragraph for domain rejection message
- On button click: calls `signInWithGoogle()` from `firebaseAuth.js`; on success fires `loginsuccess`; on domain rejection displays error inline

### `shell/app` changes
- New `@track _authUser = null`
- New `_redirectPath = '/'`
- `connectedCallback` subscribes to `onAuthStateChanged`; stores unsubscribe handle alongside existing router unsubscribe
- Template: `<template if:false={_authUser}><shell-login>` else existing route output
- Handles `loginsuccess` event from login component (not strictly needed since `onAuthStateChanged` drives state, but provides an explicit hook)

### `shell/globalHeader` changes
- Sign-out button added to the right side of the header
- On click: calls `firebaseAuth.signOut()`; no event needed since `onAuthStateChanged` drives app state

---

## Configuration

### Environment variables
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

`src/data/firebaseConfig.js` reads these via `import.meta.env` and exports a config object. The `.env` file is gitignored; `.env.example` with empty values is committed so future developers know what's needed.

### Firebase console setup (manual, pre-implementation)
1. Enable Google as a sign-in provider in Firebase Authentication
2. Add authorized domains: `localhost` (for dev) and the GitHub Pages domain (for production)

---

## Domain Restriction

After `signInWithPopup` resolves:
```js
if (!user.email.endsWith('@salesforce.com')) {
  await signOut();
  throw new Error('Only @salesforce.com accounts are permitted.');
}
```

This check happens inside `signInWithGoogle()` in `data/firebaseAuth.js` so the restriction is enforced in one place regardless of how sign-in is triggered.

---

## Dependencies

Add to `package.json` dependencies:
```
firebase  (v10+, modular SDK)
```

Import only the auth subpackage to keep bundle size small:
```js
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
```

---

## Out of Scope

- Token refresh handling (Firebase Auth manages this automatically)
- Server-side session validation (this is a client-only app)
- Role-based access control within the app
- Multi-provider auth (Google only)
