import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore';

export type FirebaseClients = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

/** Valid-shaped placeholder when using the Emulator Suite without real console keys (traffic still goes to emulators). */
const EMULATOR_DEMO_WEB_CONFIG = {
  apiKey: 'demo-key',
  // Use current host so Auth redirect/persistence keys match the app origin.
  authDomain: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
  // Align with `.firebaserc` default so emulator data matches `npm run seed:firestore`.
  projectId: 'arial-ui',
  appId: '1:000000000000:web:0000000000000000000000',
} as const;

function shouldUseEmulators(): boolean {
  return process.env.REACT_APP_USE_FIREBASE_EMULATORS === 'true';
}

/** True when the app targets the Firebase Emulator Suite (Auth/Firestore). */
export function isUsingFirebaseEmulators(): boolean {
  return shouldUseEmulators();
}

function firebaseConfig() {
  const fromEnv = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY ?? '',
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ?? '',
    appId: process.env.REACT_APP_FIREBASE_APP_ID ?? '',
    ...(process.env.REACT_APP_FIREBASE_STORAGE_BUCKET
      ? { storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET }
      : {}),
    ...(process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID
      ? { messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID }
      : {}),
  };

  if (shouldUseEmulators()) {
    return {
      apiKey: fromEnv.apiKey || EMULATOR_DEMO_WEB_CONFIG.apiKey,
      authDomain: fromEnv.authDomain || EMULATOR_DEMO_WEB_CONFIG.authDomain,
      projectId: fromEnv.projectId || EMULATOR_DEMO_WEB_CONFIG.projectId,
      appId: fromEnv.appId || EMULATOR_DEMO_WEB_CONFIG.appId,
      ...(fromEnv.storageBucket ? { storageBucket: fromEnv.storageBucket } : {}),
      ...(fromEnv.messagingSenderId ? { messagingSenderId: fromEnv.messagingSenderId } : {}),
    };
  }

  return fromEnv;
}

export function isFirebaseConfigured(): boolean {
  const c = firebaseConfig();
  return Boolean(c.apiKey && c.authDomain && c.projectId && c.appId);
}

let cached: FirebaseClients | null = null;
let emulatorsConnected = false;

/** Firestore listens on all interfaces; prefer IPv4 so the browser is not stuck “offline” when `localhost` resolves to ::1 only. */
const FIRESTORE_EMULATOR_HOST = '127.0.0.1';
const FIRESTORE_EMULATOR_PORT = 8080;

function initFirestore(app: FirebaseApp): Firestore {
  try {
    return initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });
  } catch {
    // Hot reload / second init: reuse the existing Firestore instance for this app.
    return getFirestore(app);
  }
}

/**
 * Lazily initializes Firebase. Call only when `isFirebaseConfigured()` is true.
 */
export function getFirebase(): FirebaseClients {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  if (!cached) {
    const config = firebaseConfig();
    const app = getApps().length === 0 ? initializeApp(config) : getApps()[0]!;
    const auth = getAuth(app);
    const db = initFirestore(app);
    if (shouldUseEmulators() && !emulatorsConnected) {
      // Use localhost to match CRA dev origin and avoid 127.0.0.1 vs localhost redirect/persistence issues.
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, FIRESTORE_EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);
      emulatorsConnected = true;
    }
    cached = { app, auth, db };
  }
  return cached;
}
