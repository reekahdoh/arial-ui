#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Idempotent one-time setup for the Firebase staging project.
 *
 * Prerequisites (once per machine):
 *   gcloud auth login
 *   gcloud auth application-default login
 *   npx firebase login
 *
 * Usage:
 *   npm run setup:staging
 *   node scripts/setup-firebase-staging.js --project=arial-ui-staging
 *
 * Optional env / flags:
 *   --project=arial-ui-staging
 *   --billing-account=XXXXXX-XXXXXX-XXXXXX
 *   --e2e-email=e2e@example.com
 *   --e2e-login=e2e
 *   --e2e-password=...   (otherwise generated and written to .env.staging)
 *
 * Does not deploy Hosting/Functions. After this succeeds: npm run deploy:staging
 */

const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FIREBASE_BIN = path.join(ROOT, 'node_modules', '.bin', 'firebase');
const APIS = [
  'serviceusage.googleapis.com',
  'cloudresourcemanager.googleapis.com',
  'iam.googleapis.com',
  'cloudbilling.googleapis.com',
  'firebase.googleapis.com',
  'firebasehosting.googleapis.com',
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'cloudfunctions.googleapis.com',
  'cloudbuild.googleapis.com',
  'artifactregistry.googleapis.com',
  'run.googleapis.com',
  'eventarc.googleapis.com',
  'pubsub.googleapis.com',
  'storage.googleapis.com',
];

function loadEnvFile(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return {};
  const out = {};
  for (const line of fs.readFileSync(full, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[trimmed.slice(0, eq).trim()] = val;
  }
  return out;
}

function argValue(prefix, fallback) {
  const hit = process.argv.find((a) => a.startsWith(prefix));
  if (!hit) return fallback;
  return hit.slice(prefix.length) || fallback;
}

function printHelp() {
  console.log(`Idempotent setup for the Firebase staging project.

Prerequisites:
  gcloud auth login
  gcloud auth application-default login
  npx firebase login

Usage:
  npm run setup:staging
  node scripts/setup-firebase-staging.js --project=arial-ui-staging

Flags:
  --project=arial-ui-staging
  --billing-account=XXXXXX-XXXXXX-XXXXXX
  --e2e-email=e2e@example.com
  --e2e-login=e2e
  --e2e-password=...   (otherwise generated into .env.staging)

Does not deploy. After success: npm run deploy:staging`);
}

function parseArgs() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp();
    process.exit(0);
  }
  const prod = loadEnvFile('.env');
  const staging = loadEnvFile('.env.staging');
  const projectId =
    argValue('--project=', process.env.STAGING_PROJECT_ID) ||
    staging.REACT_APP_FIREBASE_PROJECT_ID ||
    'arial-ui-staging';
  const password =
    argValue('--e2e-password=', process.env.E2E_PASSWORD) || staging.E2E_PASSWORD || '';
  return {
    projectId,
    billingAccount:
      argValue('--billing-account=', process.env.BILLING_ACCOUNT || process.env.STAGING_BILLING_ACCOUNT) ||
      '',
    e2eEmail: argValue('--e2e-email=', process.env.E2E_EMAIL) || staging.E2E_EMAIL || 'e2e@example.com',
    e2eLogin: argValue('--e2e-login=', process.env.E2E_LOGIN_NAME) || staging.E2E_LOGIN_NAME || 'e2e',
    e2ePassword: password || crypto.randomBytes(18).toString('base64url'),
    passwordWasGenerated: !password,
    backendTarget: prod.BACKEND_PROXY_TARGET || staging.BACKEND_PROXY_TARGET || '',
    backendAudience: prod.BACKEND_ID_TOKEN_AUDIENCE || staging.BACKEND_ID_TOKEN_AUDIENCE || '',
  };
}

function which(cmd) {
  try {
    execFileSync('which', [cmd], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function run(file, args, opts = {}) {
  const printable = [file, ...args].join(' ');
  console.log(`  $ ${printable}`);
  return execFileSync(file, args, {
    encoding: 'utf8',
    cwd: ROOT,
    stdio: opts.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    env: { ...process.env, ...opts.env },
  });
}

function runCapture(file, args, opts = {}) {
  try {
    return String(run(file, args, { ...opts, capture: true }) || '').trim();
  } catch (err) {
    const extra = err.stderr ? String(err.stderr) : err.message;
    throw new Error(`${file} ${args.join(' ')} failed: ${extra}`);
  }
}

function runMayFail(file, args) {
  try {
    run(file, args, { capture: true });
    return true;
  } catch {
    return false;
  }
}

function firebase(args, opts = {}) {
  return (opts.capture ? runCapture : run)(FIREBASE_BIN, ['--non-interactive', ...args], opts);
}

function gcloud(args, opts = {}) {
  return (opts.capture ? runCapture : run)('gcloud', args, opts);
}

function accessToken() {
  return runCapture('gcloud', ['auth', 'print-access-token']);
}

async function googleApi(method, url, { body, quotaProject } = {}) {
  const headers = {
    Authorization: `Bearer ${accessToken()}`,
    'Content-Type': 'application/json',
  };
  if (quotaProject) headers['x-goog-user-project'] = quotaProject;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${url} → ${res.status} ${text.slice(0, 500)}`);
  }
  return json;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function upsertEnvFile(relPath, updates) {
  const full = path.join(ROOT, relPath);
  const example = full.endsWith('.env.staging')
    ? path.join(ROOT, '.env.staging.example')
    : `${full}.example`;
  let text = fs.existsSync(full)
    ? fs.readFileSync(full, 'utf8')
    : fs.existsSync(example)
      ? fs.readFileSync(example, 'utf8')
      : '';
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null) continue;
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(text)) text = text.replace(re, line);
    else text += `${text && !text.endsWith('\n') ? '\n' : ''}${line}\n`;
  }
  fs.writeFileSync(full, text.endsWith('\n') ? text : `${text}\n`);
}

function checkPrereqs() {
  if (!which('gcloud')) throw new Error('gcloud CLI not found. Install Google Cloud SDK.');
  if (!fs.existsSync(FIREBASE_BIN)) throw new Error('firebase-tools missing. Run npm install.');
  try {
    gcloud(['auth', 'print-access-token'], { capture: true });
  } catch {
    throw new Error('Not logged in to gcloud. Run: gcloud auth login');
  }
  try {
    gcloud(['auth', 'application-default', 'print-access-token'], { capture: true });
  } catch {
    throw new Error('Application Default Credentials missing. Run: gcloud auth application-default login');
  }
  try {
    firebase(['login:list'], { capture: true });
  } catch {
    throw new Error('Not logged in to Firebase CLI. Run: npx firebase login');
  }
}

function ensureGcpProject(projectId) {
  console.log(`\n==> GCP project ${projectId}`);
  if (runMayFail('gcloud', ['projects', 'describe', projectId])) {
    console.log('    already exists');
    return;
  }
  gcloud(['projects', 'create', projectId, `--name=AIRA UI Staging`]);
}

function pickBillingAccount(explicit) {
  if (explicit) return explicit.replace(/^billingAccounts\//, '');
  const raw = gcloud(
    ['billing', 'accounts', 'list', '--filter=open=true', '--format=json'],
    { capture: true },
  );
  const accounts = JSON.parse(raw || '[]');
  if (accounts.length === 1) {
    return String(accounts[0].name || '').replace(/^billingAccounts\//, '');
  }
  const listed = accounts
    .map((a) => `  ${String(a.name || '').replace(/^billingAccounts\//, '')}  ${a.displayName || ''}`)
    .join('\n');
  throw new Error(
    `Link a billing account (required for Functions/Hosting).\n` +
      `Pass --billing-account=ID or set BILLING_ACCOUNT.\nOpen accounts:\n${listed || '  (none)'}`,
  );
}

function ensureBilling(projectId, billingAccount) {
  console.log('\n==> Billing (Blaze)');
  gcloud(['services', 'enable', 'cloudbilling.googleapis.com', `--project=${projectId}`]);
  try {
    const info = JSON.parse(
      gcloud(['billing', 'projects', 'describe', projectId, '--format=json'], { capture: true }) || '{}',
    );
    if (info.billingEnabled && info.billingAccountName) {
      console.log(`    already linked to ${info.billingAccountName}`);
      return;
    }
  } catch {
    // Describe can fail if billing is not linked yet.
  }
  const account = pickBillingAccount(billingAccount);
  try {
    gcloud(['billing', 'projects', 'link', projectId, `--billing-account=${account}`]);
  } catch (err) {
    const msg = `${err.message || err}\n${err.stderr || ''}`;
    if (/already linked|already associated|Billing account .* is already/i.test(msg)) {
      console.log('    billing already linked');
      return;
    }
    throw err;
  }
}

function enableApis(projectId) {
  console.log('\n==> Enable Google APIs');
  gcloud(['services', 'enable', ...APIS, `--project=${projectId}`]);
}

function ensureQuotaProject(projectId) {
  console.log('\n==> Quota project for user credentials');
  try {
    gcloud(['auth', 'application-default', 'set-quota-project', projectId]);
  } catch (err) {
    console.warn(`    ADC quota project: ${err.message}`);
  }
  try {
    gcloud(['config', 'set', 'billing/quota_project', projectId]);
  } catch (err) {
    console.warn(`    billing/quota_project: ${err.message}`);
  }
}

function parseFirebaseJson(raw) {
  const start = String(raw).indexOf('{');
  const parsed = JSON.parse(start >= 0 ? String(raw).slice(start) : raw);
  return parsed.result !== undefined ? parsed.result : parsed;
}

async function ensureFirebaseOnProject(projectId) {
  console.log('\n==> Add Firebase to the GCP project');
  try {
    await googleApi('GET', `https://firebase.googleapis.com/v1beta1/projects/${projectId}`, {
      quotaProject: projectId,
    });
    console.log('    Firebase already enabled');
  } catch {
    firebase(['projects:addfirebase', projectId]);
  }
  const rcPath = path.join(ROOT, '.firebaserc');
  const rc = JSON.parse(fs.readFileSync(rcPath, 'utf8'));
  rc.projects = rc.projects || {};
  rc.projects.staging = projectId;
  fs.writeFileSync(rcPath, `${JSON.stringify(rc, null, 2)}\n`);
}

async function ensureFirestore(projectId) {
  console.log('\n==> Firestore (europe-west2)');
  if (
    runMayFail('gcloud', [
      'firestore',
      'databases',
      'describe',
      '--database=(default)',
      `--project=${projectId}`,
    ])
  ) {
    console.log('    database already exists');
    return;
  }
  try {
    gcloud([
      'firestore',
      'databases',
      'create',
      '--database=(default)',
      '--location=europe-west2',
      '--type=firestore-native',
      `--project=${projectId}`,
      '--quiet',
    ]);
  } catch (err) {
    const msg = `${err.message || err}\n${err.stderr || ''}`;
    if (!/already exists|ALREADY_EXISTS|conflict/i.test(msg)) throw err;
    console.log('    database already exists');
  }
}

async function ensureEmailPasswordAuth(projectId) {
  console.log('\n==> Email/password Authentication');
  const configUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;
  const initUrl = `https://identitytoolkit.googleapis.com/v2/projects/${projectId}/identityPlatform:initializeAuth`;

  let current = null;
  try {
    current = await googleApi('GET', configUrl, { quotaProject: projectId });
  } catch (err) {
    if (!/CONFIGURATION_NOT_FOUND|NOT_FOUND/i.test(String(err.message))) throw err;
    console.log('    initializing Identity Platform…');
    try {
      await googleApi('POST', initUrl, { quotaProject: projectId });
    } catch (initErr) {
      const msg = String(initErr.message || initErr);
      if (!/already|ALREADY_EXISTS/i.test(msg)) {
        console.warn(`    initializeAuth: ${msg.slice(0, 240)}`);
      }
    }
  }

  let lastErr;
  for (let i = 0; i < 8; i += 1) {
    try {
      current = current || (await googleApi('GET', configUrl, { quotaProject: projectId }));
      const domains = new Set(current.authorizedDomains || []);
      domains.add('localhost');
      domains.add(`${projectId}.firebaseapp.com`);
      domains.add(`${projectId}.web.app`);
      await googleApi('PATCH', `${configUrl}?updateMask=signIn.email,authorizedDomains`, {
        quotaProject: projectId,
        body: {
          signIn: { email: { enabled: true, passwordRequired: true } },
          authorizedDomains: [...domains],
        },
      });
      return;
    } catch (err) {
      lastErr = err;
      current = null;
      console.log(`    waiting for Identity Toolkit (${i + 1}/8)…`);
      await sleep(5000);
    }
  }
  throw lastErr;
}

function ensureWebAppAndEnv(cfg) {
  console.log('\n==> Web app + .env.staging');
  const listed = parseFirebaseJson(firebase(['apps:list', 'WEB', '--project', cfg.projectId, '--json'], { capture: true }));
  const apps = Array.isArray(listed) ? listed : listed?.apps || [];
  let appId = apps[0]?.appId || apps[0]?.app_id;
  if (!appId) {
    firebase(['apps:create', 'WEB', 'AIRA UI Staging', '--project', cfg.projectId]);
    const again = parseFirebaseJson(firebase(['apps:list', 'WEB', '--project', cfg.projectId, '--json'], { capture: true }));
    const created = Array.isArray(again) ? again : again?.apps || [];
    appId = created[0]?.appId || created[0]?.app_id;
  }
  if (!appId) throw new Error('Could not determine Firebase web app id.');
  const sdkRaw = firebase(['apps:sdkconfig', 'WEB', appId, '--project', cfg.projectId, '--json'], { capture: true });
  const sdkWrap = parseFirebaseJson(sdkRaw);
  const sdk = sdkWrap.sdkConfig || sdkWrap;
  upsertEnvFile('.env.staging', {
    REACT_APP_FIREBASE_API_KEY: sdk.apiKey || '',
    REACT_APP_FIREBASE_AUTH_DOMAIN: sdk.authDomain || `${cfg.projectId}.firebaseapp.com`,
    REACT_APP_FIREBASE_PROJECT_ID: sdk.projectId || cfg.projectId,
    REACT_APP_FIREBASE_APP_ID: sdk.appId || appId,
    REACT_APP_FIREBASE_STORAGE_BUCKET: sdk.storageBucket || '',
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID: sdk.messagingSenderId || '',
    REACT_APP_BACKEND_PROXY_URL: '/backend',
    PLAYWRIGHT_BASE_URL: `https://${cfg.projectId}.web.app`,
    E2E_LOGIN_NAME: cfg.e2eLogin,
    E2E_PASSWORD: cfg.e2ePassword,
    E2E_EMAIL: cfg.e2eEmail,
  });
  console.log(`    wrote .env.staging (app ${appId})`);
}

function writeFunctionsEnv(cfg) {
  console.log('\n==> functions/.env.' + cfg.projectId);
  if (!cfg.backendTarget || cfg.backendTarget.includes('PROJECT.REGION')) {
    console.warn('    BACKEND_PROXY_TARGET missing in .env — copy it before deploy:staging');
  }
  upsertEnvFile(`functions/.env.${cfg.projectId}`, {
    BACKEND_PROXY_TARGET: cfg.backendTarget || '',
    BACKEND_ID_TOKEN_AUDIENCE: cfg.backendAudience || '',
  });
}

function parseCloudRun(url) {
  try {
    const host = new URL(url).hostname;
    const m = host.match(/^([a-z0-9-]+)-(\d+)\.([a-z0-9-]+)\.run\.app$/i);
    if (!m) return null;
    return { service: m[1], projectNumber: m[2], region: m[3] };
  } catch {
    return null;
  }
}

function grantInvoker(cfg) {
  console.log('\n==> Cloud Run invoker for staging Functions SA');
  const parsed = parseCloudRun(cfg.backendTarget);
  if (!parsed) {
    console.warn('    skip: could not parse Cloud Run service from BACKEND_PROXY_TARGET');
    return;
  }
  const stagingNumber = gcloud(
    ['projects', 'describe', cfg.projectId, '--format=value(projectNumber)'],
    { capture: true },
  );
  const member = `serviceAccount:${stagingNumber}-compute@developer.gserviceaccount.com`;
  const apiProject = gcloud(
    ['projects', 'list', `--filter=projectNumber=${parsed.projectNumber}`, '--format=value(projectId)'],
    { capture: true },
  );
  if (!apiProject) {
    console.warn(`    skip: no GCP project for number ${parsed.projectNumber}`);
    return;
  }
  try {
    gcloud([
      'run',
      'services',
      'add-iam-policy-binding',
      parsed.service,
      `--region=${parsed.region}`,
      `--member=${member}`,
      '--role=roles/run.invoker',
      `--project=${apiProject}`,
    ]);
  } catch (err) {
    console.warn(`    run.invoker failed (grant manually): ${err.message}`);
  }
  if (cfg.backendAudience && cfg.backendAudience.includes('apps.googleusercontent.com')) {
    try {
      gcloud([
        'projects',
        'add-iam-policy-binding',
        apiProject,
        `--member=${member}`,
        '--role=roles/iap.httpsResourceAccessor',
      ]);
    } catch (err) {
      console.warn(`    iap.httpsResourceAccessor failed (grant manually): ${err.message}`);
    }
  }
}

async function ensureE2eUser(cfg) {
  console.log('\n==> E2E Auth user + loginNames / userProfiles');
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: cfg.projectId });
  }
  const email = cfg.e2eEmail.trim().toLowerCase();
  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
    console.log(`    auth user exists (${user.uid})`);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    user = await admin.auth().createUser({
      email,
      password: cfg.e2ePassword,
      emailVerified: true,
      displayName: 'E2E staging',
    });
    console.log(`    created auth user ${user.uid}`);
  }
  const db = admin.firestore();
  await db.collection('loginNames').doc(cfg.e2eLogin).set({ uid: user.uid, email }, { merge: true });
  await db.collection('userProfiles').doc(user.uid).set(
    {
      email,
      loginName: cfg.e2eLogin,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  for (const d of [
    { id: 'ai', name: 'AI' },
    { id: 'medical-device', name: 'Medical Device' },
  ]) {
    await db.collection('Domain').doc(d.id).set(
      {
        name: d.name,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
  const staleWho = db.collection('Domain').doc('who');
  if ((await staleWho.get()).exists) {
    await staleWho.delete();
  }
  console.log(`    loginNames/${cfg.e2eLogin} and Domain/ai, Domain/medical-device`);
}

function printNextSteps(cfg) {
  console.log(`
Staging project ${cfg.projectId} is ready.

  Hosting URL (after deploy): https://${cfg.projectId}.web.app
  E2E login:                  ${cfg.e2eLogin}
  Credentials file:           .env.staging${cfg.passwordWasGenerated ? ' (password generated)' : ''}

Next:
  npm run deploy:staging
  npm run test:e2e
`);
}

async function main() {
  const cfg = parseArgs();
  checkPrereqs();
  ensureGcpProject(cfg.projectId);
  ensureBilling(cfg.projectId, cfg.billingAccount);
  enableApis(cfg.projectId);
  ensureQuotaProject(cfg.projectId);
  await ensureFirebaseOnProject(cfg.projectId);
  await ensureFirestore(cfg.projectId);
  await ensureEmailPasswordAuth(cfg.projectId);
  ensureWebAppAndEnv(cfg);
  writeFunctionsEnv(cfg);
  grantInvoker(cfg);
  await ensureE2eUser(cfg);
  printNextSteps(cfg);
}

main().catch((err) => {
  console.error('\nSetup failed:', err.message || err);
  process.exitCode = 1;
});
