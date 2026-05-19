const BACKEND_PROXY_URL_ENV = 'REACT_APP_BACKEND_PROXY_URL';

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
