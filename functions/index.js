const { onRequest } = require('firebase-functions/v2/https');
const { GoogleAuth } = require('google-auth-library');
const admin = require('firebase-admin');
const https = require('https');
const { URL } = require('url');

if (!admin.apps.length) {
  admin.initializeApp();
}

/** Private Cloud Run service URL (no path). */
const BACKEND_BASE = (process.env.BACKEND_PROXY_TARGET || 'https://aira-api-164267786730.europe-west1.run.app').replace(
  /\/+$/,
  '',
);

/**
 * OIDC token audience for upstream auth.
 * - Plain Cloud Run IAM: service URL (BACKEND_BASE) — the current setup, so leave
 *   BACKEND_ID_TOKEN_AUDIENCE unset.
 * - IAP in front of the API: IAP OAuth client ID (…apps.googleusercontent.com)
 * A mismatch here surfaces as a 401/403 from Google Frontend before the request
 * ever reaches the app.
 */
const ID_TOKEN_AUDIENCE = (process.env.BACKEND_ID_TOKEN_AUDIENCE || process.env.IAP_CLIENT_ID || BACKEND_BASE).trim();

const auth = new GoogleAuth();
let idTokenClientPromise = null;

function getIdTokenClient() {
  if (!idTokenClientPromise) {
    console.log('id token audience', ID_TOKEN_AUDIENCE);
    idTokenClientPromise = auth.getIdTokenClient(ID_TOKEN_AUDIENCE);
  }
  return idTokenClientPromise;
}

function stripBackendPrefix(pathAndQuery) {
  const withoutPrefix = pathAndQuery.replace(/^\/backend\/?/, '/');
  return withoutPrefix.startsWith('/') ? withoutPrefix : `/${withoutPrefix}`;
}

function rewriteLocation(locationHeader, req) {
  if (!locationHeader) return locationHeader;
  try {
    const target = new URL(locationHeader, BACKEND_BASE);
    const upstreamHost = new URL(BACKEND_BASE).hostname;
    if (target.hostname !== upstreamHost) return locationHeader;
    const host = req.get('x-forwarded-host') || req.get('host') || 'arial-ui.web.app';
    const proto = (req.get('x-forwarded-proto') || 'https').split(',')[0].trim();
    return `${proto}://${host}/backend${target.pathname}${target.search}`;
  } catch {
    return locationHeader;
  }
}

function forwardHeaders(req, cloudRunAuthHeader) {
  const headers = {};
  const skip = new Set([
    'host',
    'connection',
    'content-length',
    'transfer-encoding',
    'keep-alive',
    'proxy-connection',
    'authorization', // replace Firebase token with Cloud Run identity token
    'x-firebase-authorization',
    'forwarded',
    'x-forwarded-for',
    'x-forwarded-host',
    'x-forwarded-proto',
    'x-cloud-trace-context',
    'traceparent',
    'via',
  ]);
  for (const [key, value] of Object.entries(req.headers)) {
    if (skip.has(key.toLowerCase())) continue;
    if (value !== undefined) headers[key] = value;
  }
  headers.authorization = cloudRunAuthHeader;
  return headers;
}

async function requireFirebaseUser(req) {
  // Hosting may strip Authorization on function rewrites; also accept X-Firebase-Authorization.
  const header = req.get('authorization') || req.get('x-firebase-authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const err = new Error('Missing Firebase Authorization bearer token');
    err.status = 401;
    throw err;
  }
  try {
    return await admin.auth().verifyIdToken(match[1]);
  } catch (cause) {
    const err = new Error(`Invalid Firebase token: ${cause instanceof Error ? cause.message : String(cause)}`);
    err.status = 401;
    throw err;
  }
}

exports.backend = onRequest(
  {
    region: 'europe-west2',
    timeoutSeconds: 120,
    memory: '512MiB',
    cors: false,
  },
  async (req, res) => {
    try {
      await requireFirebaseUser(req);
    } catch (err) {
      res.status(err.status || 401).json({ error: 'Unauthorized', message: err.message });
      return;
    }

    const pathAndQuery = stripBackendPrefix(req.originalUrl || req.url || '/');
    let finalUrl;
    try {
      finalUrl = new URL(pathAndQuery, `${BACKEND_BASE}/`).toString();
    } catch (err) {
      res.status(500).json({
        error: 'Bad proxy URL',
        message: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    let cloudRunAuthHeader;
    try {
      const idClient = await getIdTokenClient();
      // Use the configured audience (IAP client ID or Cloud Run URL), not the request path URL.
      const requestHeaders = await idClient.getRequestHeaders(ID_TOKEN_AUDIENCE);
      cloudRunAuthHeader = requestHeaders.Authorization || requestHeaders.authorization;
      if (!cloudRunAuthHeader) {
        throw new Error('google-auth-library did not return an Authorization header');
      }
    } catch (err) {
      console.error('identity token error', err);
      res.status(500).json({
        error: 'Failed to obtain Cloud Run identity token',
        message: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    console.log('proxy', req.method, finalUrl);

    const upstreamReq = https.request(
      finalUrl,
      {
        method: req.method,
        headers: forwardHeaders(req, cloudRunAuthHeader),
        timeout: 30_000,
      },
      (upstreamRes) => {
        const status = upstreamRes.statusCode || 502;
        console.log('proxy upstream status', status, finalUrl);

        const chunks = [];
        upstreamRes.on('data', (chunk) => chunks.push(chunk));
        upstreamRes.on('end', () => {
          const body = Buffer.concat(chunks);
          if (status === 401 || status === 403) {
            const upstreamBody = body.toString('utf8').slice(0, 500);
            console.error('proxy upstream auth failure', status, upstreamBody);
            if (!res.headersSent) {
              res.status(status).json({
                error: 'Cloud Run rejected the proxy identity token',
                status,
                upstream: finalUrl,
                hint: `Upstream rejected the identity token. Check that the audience matches the upstream auth layer (plain Cloud Run IAM expects the service URL, IAP expects its OAuth client ID) and that this function's service account has roles/run.invoker on the service (plus roles/iap.httpsResourceAccessor if IAP is enabled).`,
                audience: ID_TOKEN_AUDIENCE,
                upstreamBody,
              });
            }
            return;
          }

          if (status >= 500) {
            console.error('proxy upstream 5xx', status, finalUrl, body.toString('utf8').slice(0, 1000));
          }

          const outHeaders = { ...upstreamRes.headers };
          if (outHeaders.location) {
            const loc = Array.isArray(outHeaders.location) ? outHeaders.location[0] : outHeaders.location;
            outHeaders.location = rewriteLocation(loc, req);
          }
          delete outHeaders['access-control-allow-origin'];
          delete outHeaders['access-control-allow-credentials'];
          delete outHeaders['access-control-allow-headers'];
          delete outHeaders['access-control-allow-methods'];
          delete outHeaders['content-length'];

          res.writeHead(status, outHeaders);
          res.end(body);
        });
      },
    );

    upstreamReq.on('timeout', () => {
      upstreamReq.destroy(new Error(`Upstream timed out: ${finalUrl}`));
    });

    upstreamReq.on('error', (err) => {
      console.error('proxy upstream error', finalUrl, err.message);
      if (!res.headersSent) {
        res.status(502).json({
          error: 'Backend proxy error',
          message: err.message,
          upstream: finalUrl,
        });
      }
    });

    const method = (req.method || 'GET').toUpperCase();
    if (method === 'GET' || method === 'HEAD') {
      upstreamReq.end();
      return;
    }
    if (Buffer.isBuffer(req.rawBody)) {
      upstreamReq.end(req.rawBody);
      return;
    }
    req.pipe(upstreamReq);
  },
);
