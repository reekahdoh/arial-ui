import { getFirebase, isFirebaseConfigured } from './firebase';

const BACKEND_PROXY_URL_ENV = 'REACT_APP_BACKEND_PROXY_URL';

/**
 * Browser-facing API base. Prefer same-origin `/backend` so the SPA never talks
 * to private Cloud Run directly (IAM). Production: Hosting → Cloud Function proxy.
 */
export function getBackendProxyUrl(): string {
  const proxyUrl = process.env[BACKEND_PROXY_URL_ENV]?.trim();

  if (!proxyUrl) {
    throw new Error(`Missing ${BACKEND_PROXY_URL_ENV}. Add it to .env and restart the dev server.`);
  }

  return proxyUrl.replace(/\/+$/, '');
}

export function buildBackendProxyUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getBackendProxyUrl()}${normalizedPath}`;
}

async function getFirebaseIdToken(): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;
  const { auth } = getFirebase();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

/** fetch() to the backend proxy, attaching the signed-in Firebase ID token when available. */
export async function backendFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const token = await getFirebaseIdToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    // Firebase Hosting may strip Authorization on /backend → function rewrites.
    headers.set('X-Firebase-Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
