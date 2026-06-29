import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig.js';
import { isSalesforceAuth } from './authMode.js';

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ hd: 'salesforce.com' });

let _app;
let _auth;

function hasValidFirebaseApiKey() {
    const key = import.meta.env.VITE_FIREBASE_API_KEY;
    return typeof key === 'string' && key.trim().length > 0;
}

/**
 * Returns the Auth instance when Firebase should be used; otherwise null.
 * Firebase is only initialized in Salesforce-auth mode so `none` builds
 * do not run Firebase or require env keys.
 * @throws {Error} When Salesforce auth is required but env is not configured.
 */
function getFirebaseAuth() {
    if (!isSalesforceAuth()) {
        return null;
    }
    if (!hasValidFirebaseApiKey()) {
        throw new Error(
            'Salesforce auth is enabled (VITE_AUTH_MODE=salesforce) but VITE_FIREBASE_API_KEY is missing or empty. ' +
                'Copy .env.example to .env and add your Firebase web app keys, or set VITE_AUTH_MODE=none for local work.'
        );
    }
    if (!_auth) {
        _app = initializeApp(firebaseConfig);
        _auth = getAuth(_app);
    }
    return _auth;
}

/**
 * Subscribe to auth state changes. In non-Salesforce modes, fires once with null.
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function onAuthStateChanged(callback) {
    if (!isSalesforceAuth()) {
        queueMicrotask(() => callback(null));
        return () => {};
    }
    const auth = getFirebaseAuth();
    return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * Open Google sign-in popup. Throws if the signed-in email is not @salesforce.com.
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function signInWithGoogle() {
    const auth = getFirebaseAuth();
    if (!auth) {
        throw new Error('Google sign-in is not available in this deployment (auth mode is not salesforce).');
    }
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    if (!user.email.endsWith('@salesforce.com')) {
        await firebaseSignOut(auth);
        throw new Error('Only @salesforce.com accounts are permitted.');
    }
    return user;
}

/**
 * Sign the current Firebase user out.
 * @returns {Promise<void>}
 */
export function signOut() {
    if (!isSalesforceAuth() || !_auth) {
        return Promise.resolve();
    }
    return firebaseSignOut(_auth);
}
