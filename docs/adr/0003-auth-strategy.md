# ADR 0003 — Auth strategy: shared client today, OIDC/PKCE + BFF tomorrow

- Status: accepted (demo mode); production path documented
- Date: 2026-04-25

## Context

Every Raisin app needs the same auth primitives: token retrieval, refresh, request injection, status, cross-tab sync. Reinventing these per app guarantees drift in security-sensitive code.

## Decision

`@raisin/auth-client` ships two layers:

- **Core** (framework-agnostic): `createAuthClient`, storage adapters (memory + localStorage with cross-tab sync via the storage event), `refreshIfExpiring(thresholdMs)`.
- **React adapter** (subpath import): `<AuthProvider>` + `useAuth()`.

Two modes:

- `demo` (default while the take-home runs): issues a deterministic JWT-shaped opaque token with a 5-minute TTL so the auth → API → UI flow can be exercised end-to-end without a real IdP.
- `production`: intentionally throws today. Replaced by OIDC/PKCE with refresh-token rotation, fronted by a per-market **Backend-for-Frontend** so apps never touch tokens directly (PII risk, browser exfiltration, and rotation simplicity all favour the BFF).

## Consequences

- The security-sensitive surface is owned by one team; apps consume a stable interface.
- Migrating to OIDC/PKCE + BFF does not touch app code — only the provider passed to `createAuthClient` and the response of `getToken()` change behind the boundary.
- Demo mode is loud (`throw` on production calls) instead of silently fake. Better to fail noisily than to ship a wrong assumption.

## Alternatives considered

- **Each app rolls its own** — guarantees drift; rejected.
- **Sentry-style global** — coupling; rejected.
- **OIDC implicit flow without BFF** — known token-leak surface in the browser; rejected for fintech.
