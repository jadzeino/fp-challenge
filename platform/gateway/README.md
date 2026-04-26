# @raisin/gateway

Standalone HTTP gateway that fronts every Raisin frontend app on a single host:port. The dev experience matches what users get in production: one URL, multiple apps, no port juggling.

## Run

```bash
pnpm --filter @raisin/gateway dev   # ts-node-dev with hot reload
pnpm --filter @raisin/gateway build && pnpm --filter @raisin/gateway start
```

Default port: `8080` (override via `GATEWAY_PORT`).

Open `http://localhost:8080/` -> redirects to `/app1`. Health: `http://localhost:8080/__health`.

## Add a new app

One entry in `src/routes.config.ts`:

```ts
{ prefix: '/app4', upstream: 'http://localhost:3003', description: 'Payments (app4)' }
```

…and the new app sets `basePath: '/app4'` and `assetPrefix: '/app4'` in its `next.config.js`. That's the entire integration. No edits to other apps. No primary zone redeploys.

## Why standalone, not Next.js Multi-Zones

Multi-Zones works by having one app declare `rewrites()` for every other app. With 60 apps that becomes a coordination bottleneck and a redeploy risk: any new app needs a PR and a redeploy of the primary zone. A standalone gateway keeps each app's lifecycle independent. ADR 0002 has the full reasoning.

## What the gateway provides for free

- **X-Request-ID propagation** (`@raisin/observability/node`) so a single user action is correlatable across zones in logs.
- **Access log** with method, path, status, latency, request id.
- **Health endpoint** for liveness probes.
- **Friendly down-pages** when an upstream is offline - no raw 502, dev knows exactly which `pnpm --filter` to run.
- **WebSocket support** (Next.js HMR works through the gateway).

## Production path

Replace this dev gateway with a managed L7 (AWS ALB / Cloudflare / GKE Ingress) speaking the same path-based contract. The dev/prod symmetry is the point: every team writes apps that work behind a path prefix, and that contract holds across environments.
