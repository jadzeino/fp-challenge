# Raisin Frontend Platform

Production-shaped monorepo backing the Raisin Frontend Platform challenge. Three Next.js apps plus a shared platform layer (auth, API contracts + client, design tokens + system, i18n, observability, testing utilities) fronted by a standalone gateway so the whole stack runs at one URL.

## Quick start

Requires Node `18.20.2` (see `.nvmrc`) and pnpm `8.15.8`.

```bash
nvm use            # match .nvmrc
pnpm install
pnpm build:libs    # one-time build of shared TypeScript libs
pnpm dev           # gateway + app1 + app2 + app3 in parallel
```

Open <http://localhost:8080> -> redirects to `/app1`. Cross-zone:

- `/app1/accounts` - log in, see the demo accounts table
- `/app2` - same session carries over (cross-zone SSO via shared storage + cookie)
- `/app3` - same locale carries over (cookie scoped Path=/)

Health: <http://localhost:8080/__health>

## What's where

```
apps/                    consumer apps (app1, app2, app3)
packages/                shared platform libs
  api-contracts          Zod schemas + types (versioned: v1, v2, ...)
  api-client             auth-aware typed client built on contracts
  auth-client            token mgmt + refresh + React adapter
  design-tokens          framework-agnostic JSON tokens
  design-system          React+MUI components consuming tokens
  common-i18n            i18n provider + global+app namespaces (en/de)
  observability          Sentry-shaped wrapper + logger + boundary
  testing                MSW handlers + renderWithProviders + fixtures
  eslint-config          shared ESLint preset (incl. MUI-barrel guardrail)
  tsconfig               base + presets (next/library/node)
platform/
  gateway                standalone path-based HTTP gateway
  e2e                    Playwright tests against the gateway
docs/
  adr/                   numbered, immutable decisions (0001-0009)
  architecture.md        platform overview + scaling story
  ci-pipeline.md         CI mermaid diagram + stage notes
.github/workflows/       ci.yml + nightly.yml
```

## The take-home tasks (and where they're solved)

### Task 1 - Performance: app1 was slow

The `Button` in the shared library (`@raisin/lib1`) used barrel imports from `@mui/material` which Next 12 / webpack does not reliably tree-shake. It also forced the `@mui/icons-material` AutoAwesome icon into every consumer and hardcoded `autoFocus` + a no-op `onClick` (which silently broke every caller's handler — that is why the "Take me to app2/3" buttons did nothing).

Fix:

1. Renamed `lib1` -> `@raisin/design-system` and made it consume `@raisin/design-tokens`.
2. Switched to deep imports: `@mui/material/Button`, `@mui/material/styles`. ([Button source](packages/design-system/src/components/Button/index.tsx))
3. Removed the hardcoded `autoFocus` / `onClick={() => undefined}` and forwarded all props.
4. Enabled Next.js `modularizeImports` for `@mui/material`, `@mui/icons-material`, `@mui/lab` ([app1/next.config.js](apps/app1/next.config.js)).
5. **Guardrail**: ESLint `no-restricted-imports` in [`@raisin/eslint-config`](packages/eslint-config/index.js) blocks future barrel imports across the platform with an error message that tells you exactly what to write instead.

The platform lesson — recorded in [ADR 0006](docs/adr/0006-design-system-and-tokens.md) — is that this class of regression is now structurally impossible, not just code-review-caught.

### Task 2 - Run all apps under one host:port

`platform/gateway/` is a small Express + `http-proxy-middleware` service:

- Routes `/app1/*`, `/app2/*`, `/app3/*` to their dev servers via a declarative `routes.config.ts`.
- WebSocket-aware (Next.js HMR works through the gateway).
- Returns a friendly down-page when an upstream is offline (no raw 502).
- Exposes `/__health` for monitors.

Each app sets `basePath` and `assetPrefix` so its routes and assets resolve through the gateway path.

Adding a new app = one entry in `routes.config.ts` + one app's `basePath`. No edits to other apps. No primary-zone redeploys. [ADR 0002](docs/adr/0002-app-integration-gateway.md) records why this beats Next.js Multi-Zones at scale.

### Task 3 - CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs `nx affected` on a matrix of `lint | check-types | test | build` with layered caching (pnpm store + nx cache by lockfile + sha). A separate `contracts` job typechecks `@raisin/api-contracts`, runs its tests, and gates breaking schema changes behind a label. Playwright e2e runs on PRs and main; per-PR previews are stubbed for the production deploy step.

[`docs/ci-pipeline.md`](docs/ci-pipeline.md) has the Mermaid diagram and stage notes. [ADR 0005](docs/adr/0005-ci-strategy.md) records the trade-offs. Nightly: `pnpm audit`, license-allowlist, dependency-drift report.

## How the platform pieces compose

A single user action exercises every shared package:

```
User -> /app1/accounts (via gateway)
  -> AuthProvider hydrates from localStorage  [auth-client]
  -> useAuth() exposes session                 [auth-client/react]
  -> getApi().accounts.list()                  [api-client]
       -> refreshIfExpiring() ensures token    [auth-client]
       -> Authorization: Bearer + X-Request-ID [api-client + observability/node]
       -> Zod validates response               [api-contracts]
       -> typed v1.Account[]
  -> table rendered with t('...')              [common-i18n]
  -> LocaleSwitcher persists locale in cookie  [design-system + common-i18n]
  -> Errors -> ErrorBoundary -> provider      [observability/react]
  -> User clicks "Take me to app2"
  -> hard navigation through gateway          [gateway]
  -> app2 hydrates with same session + locale [auth-client storage + i18n cookie]
```

The Playwright e2e ([`platform/e2e/tests/auth-flow.spec.ts`](platform/e2e/tests/auth-flow.spec.ts)) pins both cross-zone behaviors.

## Tests

```bash
pnpm test                              # nx run-many --target=test
pnpm --filter @raisin/api-contracts test
pnpm --filter @raisin/e2e test         # boots the stack via webServer if needed
```

Test types are documented in [ADR 0008](docs/adr/0008-testing-strategy.md). Every shared package ships with at least one real test.

## Conventions

- Conventional Commits (`feat`, `fix`, `chore`, `perf`, `docs`, `test`, `ci`), scoped per package.
- One package = one focused commit. Atomic rules out "while-I-was-here" cleanup.
- Node 18.20.2 + pnpm 8.15.8 enforced via `engines` and `packageManager`.
- All MUI imports must be deep (lint-enforced).

## Where to read next

- [`docs/architecture.md`](docs/architecture.md) — top-level map, principles, end-to-end request flow, scaling story
- [`docs/adr/`](docs/adr/) — numbered decisions (read 0002 + 0005 first)
- [`docs/ci-pipeline.md`](docs/ci-pipeline.md) — CI diagram + stage notes
- Each package has its own `README.md` covering authoring rules and gotchas.
