/**
 * Declarative app registry. Adding a new app to the platform is one
 * entry here - no edits to other apps, no shared "primary zone" to
 * redeploy. This is what makes the design scale to 60+ apps.
 *
 * Each route is a (prefix -> upstream URL) mapping. The gateway will:
 *   - forward /<prefix>/* requests (and the bare /<prefix>) to the upstream
 *   - preserve the path so each app's basePath = "/<prefix>" works
 *
 * In production this list comes from a service registry (Consul, etcd,
 * SSM); the path-based contract stays the same.
 */
export interface AppRoute {
  /** Path prefix the gateway listens for, including the leading slash. */
  prefix: string;
  /** Upstream origin (no path). */
  upstream: string;
  /** Free-text description shown on the landing + health pages. */
  description?: string;
}

export const routes: AppRoute[] = [
  { prefix: '/app1', upstream: 'http://localhost:3000', description: 'Customer dashboard (app1)' },
  {
    prefix: '/app2',
    upstream: 'http://localhost:3001',
    description: 'Cross-zone session demo (app2)',
  },
  { prefix: '/app3', upstream: 'http://localhost:3002', description: 'i18n demo (app3)' },
];

/**
 * The default landing path. Hitting `/` redirects here.
 */
export const defaultRoute = '/app1';
