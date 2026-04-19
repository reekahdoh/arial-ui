/* eslint-disable no-console */
/**
 * Seed Firestore with Domain/ai and Domain/who.
 *
 * Emulator (default when not targeting production):
 *   1. Start emulators: npm run emulators
 *   2. npm run seed:firestore
 *
 * One-shot (Firebase CLI starts a temporary Firestore emulator, seeds, then tears it down — CI / smoke test only):
 *   npm run seed:firestore:exec
 *   For normal app dev, keep `npm run emulators` running and use `npm run seed:firestore` so data stays in that emulator.
 *
 * Override host/port if needed (must match the emulator):
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed:firestore
 *
 * Production (requires Application Default Credentials):
 *   SEED_TARGET=production FIRESTORE_EMULATOR_HOST= npm run seed:firestore
 *
 * Loads `.env.local` then `.env` so `REACT_APP_FIREBASE_PROJECT_ID` matches the app.
 *
 * If `.env.local` has `FIRESTORE_EMULATOR_HOST=` (empty), the Admin SDK would otherwise talk to
 * production Firestore and hang. This script clears blank values and defaults the host.
 */

const fs = require('fs');
const path = require('path');
const net = require('net');

function loadEnvFile(relPath) {
  const full = path.join(process.cwd(), relPath);
  if (!fs.existsSync(full)) return;
  const text = fs.readFileSync(full, 'utf8');
  for (const line of text.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

function readDefaultFirebaseProject() {
  try {
    const rc = path.join(process.cwd(), '.firebaserc');
    const j = JSON.parse(fs.readFileSync(rc, 'utf8'));
    return j.projects?.default || 'arial-ui';
  } catch {
    return 'arial-ui';
  }
}

function readFirestoreEmulatorPort() {
  try {
    const fp = path.join(process.cwd(), 'firebase.json');
    const j = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const p = j?.emulators?.firestore?.port;
    return typeof p === 'number' && Number.isFinite(p) ? p : 8080;
  } catch {
    return 8080;
  }
}

/** True only when a real credential file/JSON is configured (not just project id env vars). */
function hasCloudCredentials() {
  return Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
}

function clearBlankEmulatorEnv(name) {
  const v = process.env[name];
  if (v !== undefined && !String(v).trim()) {
    delete process.env[name];
  }
}

function useEmulator() {
  if (process.env.REACT_APP_USE_FIREBASE_EMULATORS === 'true') return true;
  if (process.env.FIRESTORE_EMULATOR_HOST) return true;
  if (process.env.SEED_TARGET === 'production') return false;
  return !hasCloudCredentials();
}

/** Prefer IPv4 so we do not “connect” to ::1 while the emulator listens on 127.0.0.1 only. */
function tcpOpen(host, port, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, family: 4 });
    const done = (ok) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

function parseHostPort(raw) {
  const idx = String(raw).lastIndexOf(':');
  if (idx <= 0) return null;
  const host = String(raw).slice(0, idx);
  const port = Number(String(raw).slice(idx + 1));
  if (!host || !Number.isFinite(port)) return null;
  return { host, port };
}

async function pickEmulatorHostForPort(port) {
  for (const host of ['127.0.0.1', 'localhost']) {
    if (await tcpOpen(host, port)) {
      return host;
    }
  }
  return '127.0.0.1';
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');
  clearBlankEmulatorEnv('FIRESTORE_EMULATOR_HOST');
  clearBlankEmulatorEnv('FIREBASE_FIRESTORE_EMULATOR_ADDRESS');

  const emulator = useEmulator();

  const projectId =
    process.env.REACT_APP_FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    readDefaultFirebaseProject();

  if (emulator) {
    process.env.GOOGLE_CLOUD_DISABLE_METADATA = 'true';
    process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || projectId;
    process.env.GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || projectId;

    const defaultPort = readFirestoreEmulatorPort();
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      const host = await pickEmulatorHostForPort(defaultPort);
      process.env.FIRESTORE_EMULATOR_HOST = `${host}:${defaultPort}`;
    }
    process.env.FIREBASE_FIRESTORE_EMULATOR_ADDRESS =
      process.env.FIREBASE_FIRESTORE_EMULATOR_ADDRESS || process.env.FIRESTORE_EMULATOR_HOST;

    const parsed = parseHostPort(process.env.FIRESTORE_EMULATOR_HOST);
    if (!parsed) {
      console.error(
        `Invalid FIRESTORE_EMULATOR_HOST="${process.env.FIRESTORE_EMULATOR_HOST}". Expected host:port (e.g. 127.0.0.1:8080).`,
      );
      process.exitCode = 1;
      return;
    }
    const { host, port } = parsed;
    const ok = await tcpOpen(host, port);
    if (!ok) {
      console.error(
        `Cannot open TCP to Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST} (IPv4).\n` +
          'Start the suite first:\n' +
          '  npm run emulators\n' +
          '\nIf the emulator uses another port, set e.g. FIRESTORE_EMULATOR_HOST=127.0.0.1:9150',
      );
      process.exitCode = 1;
      return;
    }
  }

  // FIRESTORE_EMULATOR_HOST must be non-empty before firebase-admin loads @google-cloud/firestore.
  const admin = require('firebase-admin');

  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId });
  }

  const db = admin.firestore();
  const { FieldValue } = admin.firestore;

  const targets = [
    { id: 'ai', name: 'AI' },
    { id: 'who', name: 'WHO' },
  ];

  console.log(
    emulator
      ? `Seeding emulator (${process.env.FIRESTORE_EMULATOR_HOST}), projectId=${projectId}…`
      : `Seeding production Firestore, projectId=${projectId}…`,
  );

  for (const d of targets) {
    const ref = db.collection('Domain').doc(d.id);
    await ref.set(
      {
        name: d.name,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    console.log(`  wrote Domain/${d.id} → name "${d.name}"`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error('Seed failed:', err.message || err);
  if (String(err.message || '').includes('ECONNREFUSED')) {
    console.error('Tip: run `npm run emulators` in another terminal, then try again.');
  }
  process.exitCode = 1;
});
