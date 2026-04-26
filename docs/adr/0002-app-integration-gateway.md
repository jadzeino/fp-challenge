# ADR 0002 — App integration via a standalone path-based gateway

- Status: accepted
- Date: 2026-04-25

## Context

The platform must serve N independent Next.js apps under a single hostname (Task 2 of the take-home; the production reality is 50–60 apps owned by separate teams). Any solution that requires apps to know about other apps will collapse under team boundaries.

## Decision

A small standalone HTTP gateway under `platform/gateway/`:

- Express + `http-proxy-middleware`.
- Declarative `routes.config.ts`: `{ prefix: '/appN', upstream: 'http://localhost:300X' }`.
- WebSocket-aware (Next.js HMR works through it).
- Friendly down-page when an upstream is offline.
- Health endpoint at `/__health`.

Each app sets `basePath` and `assetPrefix` in `next.config.js` so static assets and routing stay inside its prefix.

## Consequences

- Adding an app = one entry in the gateway config + one app's `basePath` setting. No edits to other apps. No primary-zone redeploys.
- The path-based contract holds in both dev and prod. In production the dev gateway is replaced by a managed L7 (AWS ALB / Cloudflare / GKE Ingress) that speaks the same path-prefix routing.
- Cross-zone navigation is hard navigation (regular `<a>`); within-zone is `<Link>`. A future `<CrossAppLink>` helper in `@raisin/navigation` can hide the distinction if it becomes a papercut.

## Alternatives considered

- **Next.js Multi-Zones** (rewrites in a primary zone) — works for 3 apps; collapses at 60 because the primary zone owns everyone else's routing config and ships on every new app PR.
- **Module federation** — richer than path routing but heavier and not the default Raisin teams know. Reasonable later for cases where two apps want to share runtime, not now.
- **Iframes** — instant zero-coupling but breaks cross-zone navigation history, focus, and a11y.
