/**
 * Local dev: /backend → private Cloud Run, with a Google identity token (ADC).
 * Requires: gcloud auth application-default login
 * and run.invoker on your user or the ADC service account.
 */
const { createProxyMiddleware } = require('http-proxy-middleware');
const { GoogleAuth } = require('google-auth-library');

const target = (process.env.BACKEND_PROXY_TARGET || 'https://aira-api-164267786730.europe-west1.run.app').replace(
  /\/+$/,
  '',
);
const audience = (process.env.BACKEND_ID_TOKEN_AUDIENCE || process.env.IAP_CLIENT_ID || target).trim();

const auth = new GoogleAuth();
let idTokenClientPromise = null;

function getIdTokenClient() {
  if (!idTokenClientPromise) {
    idTokenClientPromise = auth.getIdTokenClient(audience);
  }
  return idTokenClientPromise;
}

module.exports = function setupProxy(app) {
  app.use(
    '/backend',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: true,
      pathRewrite: { '^/backend': '' },
      async onProxyReq(proxyReq) {
        const client = await getIdTokenClient();
        const headers = await client.getRequestHeaders(audience);
        const authorization = headers.Authorization || headers.authorization;
        if (authorization) {
          proxyReq.setHeader('Authorization', authorization);
        }
      },
      onProxyRes(proxyRes) {
        const location = proxyRes.headers.location;
        if (!location) return;
        try {
          const redirected = new URL(location, target);
          if (redirected.hostname === new URL(target).hostname) {
            proxyRes.headers.location = `/backend${redirected.pathname}${redirected.search}`;
          }
        } catch {
          // keep upstream Location
        }
      },
    }),
  );
};
