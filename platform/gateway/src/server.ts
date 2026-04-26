import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { initObservability, logger } from '@raisin/observability';
import { requestIdMiddleware, accessLogMiddleware } from '@raisin/observability/node';
import { routes, defaultRoute } from './routes.config';
import { checkAll, renderDownPage } from './health';

const PORT = Number(process.env.GATEWAY_PORT ?? 8080);

initObservability({
  app: 'gateway',
  env: (process.env.NODE_ENV as 'development') ?? 'development',
});

const app = express();

// In dev, skip logging every _next/static chunk, HMR ping, and manifest poll —
// they bury real warnings and make the terminal unusable during demos.
const DEV_SKIP = /\/_next\/(static|webpack-hmr|[^?]*Manifest\.json)|\/mockServiceWorker\.js/;
const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';

app.use(requestIdMiddleware());
app.use(
  accessLogMiddleware({
    skip: isDev ? (req) => DEV_SKIP.test(req.url ?? '') : undefined,
  }),
);

// Health endpoint - JSON for monitors, HTML for humans.
app.get('/__health', async (req, res) => {
  const results = await checkAll(routes);
  if (req.accepts('html')) {
    res.set('content-type', 'text/html').send(`
      <!doctype html><meta charset="utf-8"><title>Gateway health</title>
      <style>body{font-family:system-ui;max-width:560px;margin:60px auto;color:#0E2240}
      .up{color:#1F9D55}.down{color:#C0392B}</style>
      <h1>Gateway health</h1>
      <ul>${results
        .map(
          (r) =>
            `<li><code>${r.prefix}</code> -> <code>${r.upstream}</code> <span class="${r.health}">[${r.health}]</span></li>`,
        )
        .join('')}</ul>`);
    return;
  }
  res.json({ ok: true, routes: results });
});

// Wire each app behind its prefix. Health failures get a friendly page
// instead of a raw 502 so dev DX stays sane when an app is restarting.
//
// We match the prefix manually instead of app.use(prefix, proxy) because
// Express strips the matched prefix from req.url before the middleware sees
// it. Next.js needs the full path (including its basePath) for routing in
// both dev and production, so we forward it unchanged with no pathRewrite.
for (const route of routes) {
  const proxy = createProxyMiddleware({
    target: route.upstream,
    changeOrigin: true,
    ws: true,
    logLevel: 'silent',
    onError: (err, _req, res) => {
      logger.warn('upstream_error', {
        prefix: route.prefix,
        upstream: route.upstream,
        message: (err as Error).message,
      });
      if (!res.headersSent) {
        res.statusCode = 502;
        res.setHeader('content-type', 'text/html');
      }
      res.end(renderDownPage(route));
    },
  });
  app.use((req, res, next) => {
    const url = req.url ?? '/';
    if (url === route.prefix || url.startsWith(`${route.prefix}/`)) {
      // Next.js production needs basePath + '/' — normalize bare "/appN" → "/appN/"
      // so the basePath startsWith check inside Next.js routing succeeds.
      if (url === route.prefix) req.url = `${route.prefix}/`;
      return proxy(req, res, next);
    }
    next();
  });
}

// Bare "/" -> default app.
app.get('/', (_req, res) => res.redirect(defaultRoute));

app.listen(PORT, () => {
  logger.info('gateway_listening', {
    port: PORT,
    routes: routes.map((r) => `${r.prefix} -> ${r.upstream}`),
  });
  // Keep one human-friendly stdout line so devs see the URL they want.
  // eslint-disable-next-line no-console
  console.log(`\n  Raisin gateway -> http://localhost:${PORT}${defaultRoute}\n`);
});
