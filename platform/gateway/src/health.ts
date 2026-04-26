import { request as httpRequest } from 'node:http';
import type { AppRoute } from './routes.config';

export type Health = 'up' | 'down' | 'unknown';

const probe = (upstream: string, timeoutMs = 1500): Promise<Health> =>
  new Promise<Health>((resolve) => {
    try {
      const url = new URL(upstream);
      const req = httpRequest(
        {
          host: url.hostname,
          port: url.port || 80,
          path: '/',
          method: 'HEAD',
          timeout: timeoutMs,
        },
        (res) => {
          // Treat any HTTP status as "the process is alive"; we are checking
          // for connectivity, not endpoint correctness.
          resolve(res.statusCode && res.statusCode > 0 ? 'up' : 'unknown');
          res.resume();
        },
      );
      req.on('error', () => resolve('down'));
      req.on('timeout', () => {
        req.destroy();
        resolve('down');
      });
      req.end();
    } catch {
      resolve('down');
    }
  });

export const checkAll = async (routes: AppRoute[]): Promise<Array<AppRoute & { health: Health }>> =>
  Promise.all(routes.map(async (r) => ({ ...r, health: await probe(r.upstream) })));

export const renderDownPage = (route: AppRoute): string => `
<!doctype html>
<meta charset="utf-8">
<title>${route.prefix} is offline</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 560px; margin: 80px auto; color: #0E2240; }
  code { background: #F7F8FB; padding: 2px 6px; border-radius: 4px; }
  .muted { color: #5A6580; }
</style>
<h1>${route.prefix} is not responding</h1>
<p>The gateway tried to forward your request to <code>${
  route.upstream
}</code> but no one answered.</p>
<p class="muted">If you are running locally, make sure the dev server for this app is up:</p>
<pre><code>pnpm --filter @raisin/${route.prefix.slice(1)} dev</code></pre>
<p><a href="/">Back to gateway home</a></p>
`;
