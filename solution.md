# Solution Walk-through — Raisin Frontend Platform Challenge

> **On AI usage:** I used Claude (Anthropic) as an accelerator throughout this challenge — as a senior pair-programming partner rather than an author. It helped me move faster on boilerplate, surfaced options I could evaluate, and caught mistakes I would have caught in code review. Every architectural decision, trade-off call, and final implementation choice was mine. The code reflects my understanding and I can explain every line.

---

## What was built

### Task 1 — Performance: app1 was slow

The original `Button` in `@raisin/lib1` imported from `@mui/material` barrel (`import { Button } from '@mui/material'`). Next 12 / webpack does not tree-shake MUI barrels reliably, so **every page pulled in the full MUI bundle**. The component also hardcoded `autoFocus` and `onClick={() => undefined}`, silently breaking every caller's click handler — which is why the "Take me to app2/3" buttons did nothing.

**Fixes:**
1. Renamed `lib1` → `@raisin/design-system`; extracted `@raisin/design-tokens` for color, spacing, typography.
2. All MUI imports switched to deep paths: `@mui/material/Button`, `@mui/material/styles`.
3. Removed hardcoded `autoFocus` and the no-op `onClick`; forwarded all props correctly.
4. Enabled `modularizeImports` in Next.js config for MUI so webpack knows to split at the deep-path level.
5. Added an ESLint `no-restricted-imports` rule in `@raisin/eslint-config` that makes MUI barrel imports a **hard CI error** with a message telling you exactly what to write instead. The regression is now structurally impossible, not just caught in review.

---

### Task 2 — One host:port for all apps

`platform/gateway/` is a standalone Express service using `http-proxy-middleware`:

- Path-based routing: `/app1/*` → `:3000`, `/app2/*` → `:3001`, `/app3/*` → `:3002`.
- Adding a new app is **one entry** in `routes.config.ts`. No changes to other apps, no shared "primary zone" to redeploy.
- WebSocket-aware (`ws: true`) — Next.js HMR works transparently through the gateway.
- Friendly error page on upstream failure instead of a raw 502.
- `/__health` endpoint checks all upstreams and returns JSON or a human-readable HTML page.

---

### Task 3 — CI pipeline

`.github/workflows/ci.yml`:

- `nx affected` matrix of `lint | check-types | test | build` — only packages touched by the PR run.
- Layered cache: pnpm store keyed on lockfile + nx computation cache keyed on lockfile+sha.
- Dedicated `contracts` job: typechecks + tests `@raisin/api-contracts`, gates breaking schema changes behind a PR label.
- Playwright e2e boots the full stack via `webServer` and runs on both PRs and main.
- Nightly: `pnpm audit`, licence-allowlist check, outdated-dep report.

---

### Platform layer (beyond the three tasks)

| Package | What it does |
|---|---|
| `@raisin/api-contracts` | Zod schemas + inferred TypeScript types, versioned under `v1/` |
| `@raisin/api-client` | Auth-aware typed fetch; retries on 401 with forced token refresh |
| `@raisin/auth-client` | Token store, silent refresh, pluggable storage (`localStorage` / memory) |
| `@raisin/common-i18n` | i18next with global + per-app namespaces, locale cookie for cross-zone persistence |
| `@raisin/observability` | Sentry-shaped logger + error boundary + request-ID middleware |
| `@raisin/navigation` | `CrossAppLink` — prefetch hints for cross-zone navigation |
| `@raisin/testing` | MSW handlers, `renderWithProviders`, account fixtures |
| `@raisin/design-tokens` | Framework-agnostic JSON design tokens |
| `@raisin/design-system` | React+MUI components consuming design tokens |

---

## How the solution works end-to-end

```
Browser → localhost:8080 (gateway)
  ↓ path match /app1/*
  → Express proxy → Next.js app1 :3000
      AuthProvider (auth-client, localStorage)
      I18nProvider (common-i18n, locale cookie)
      ErrorBoundary (observability)
        ↓ /app1/accounts
        useAuth() → getApi().accounts.list()
          refreshIfExpiring() → Bearer token in header
          X-Request-ID attached
          fetch /v1/accounts
          Zod safeParse(AccountListSchema) on response
          typed v1.Account[] returned
        table rendered with i18n keys
        LocaleSwitcher writes cookie Path=/
        "Take me to app2" → CrossAppLink → hard <a> navigation
          prefetch hint fired on hover
  → gateway routes /app2/* → Next.js app2 :3001
      AuthProvider hydrates from same localStorage key → session already there
      I18nProvider reads same locale cookie → language unchanged
```

---

## Key design decisions and reviewer Q&A

### CrossAppLink — why `<link rel="prefetch">` and not `router.prefetch`

`router.prefetch` only works within the same Next.js app. Navigating from `/app1` to `/app2` is a **hard full-page navigation** — the browser discards app1's runtime entirely and boots app2's. `router.prefetch` has no effect across that boundary.

`<link rel="prefetch" as="script">` is a browser-native hint that fetches the destination's `_app.js` chunk into the HTTP cache **before the user clicks**. When the hard navigation fires the chunk is already cached, so the browser skips the network round-trip for it and the page boots faster.

`usePrefetchCrossApp` returns a stable callback (via `useRef` to track if already triggered) that on first call resolves the zone base path from the `href` (`/app2` → `/${match[1]}`), constructs the chunk URL, and injects the link element. Deduplication is done by querying the DOM (`document.head.querySelector`) rather than a module-level `Set` — this survives React unmount/remount cycles and keeps tests isolated without needing explicit resets.

The hook is separate from the component so MUI `<Button component={CrossAppLink} href="/app2">` works: MUI forwards `href` and DOM events to the underlying element, so the prefetch logic still fires.

---

### Cross-zone SSO — how the token survives app1 → app2

The token lives in `localStorage` under the key `raisin.auth.session`. `localStorage` is scoped to the **origin** (`http://localhost:8080` in dev, `https://raisin.example.com` in prod), not to a path or app. All three apps run at the same origin through the gateway, so they all read and write the same key.

Step by step:
1. User logs in on app1 → `createAuthClient` calls `login()` → demo token written to `localStorage['raisin.auth.session']`.
2. User navigates to `/app2` → hard page load.
3. app2 boots, `AuthProvider` calls `createDefaultStorage()` → `createLocalStorageStorage()` → reads `localStorage['raisin.auth.session']` immediately on construction → session is already there → status is `'authenticated'` before any React render.
4. If the token expires mid-session, `api-client` catches the 401, calls `auth.refreshIfExpiring(Infinity)` to force a new token, writes it back to localStorage, and retries the request exactly once. The user never sees the failure.
5. Logout in any app calls `storage.set(null)` → writes `null` to localStorage → the `storage` event fires in any other open tabs via the browser's cross-tab sync listener, logging those out too.

The locale survives separately via a cookie (`raisin-locale`) with `Path=/; SameSite=Lax`. A cookie scoped to `/` is sent on every request to the origin regardless of path, so when the browser loads `/app2` the cookie is already present and i18n hydrates with the right locale before the first render.

---

### Gateway — why `http-proxy-middleware` over Next.js Multi-Zones

Next.js Multi-Zones is a first-party solution but it has two constraints that matter at scale:

1. **One primary zone owns `/_next/` assets.** Every other zone has to be rewritten to avoid clashing asset paths. At 3 apps this is manageable; at 30+ it becomes a coordination problem.
2. **`rewrites` live inside `next.config.js`.** Adding a new app requires editing and redeploying the primary zone. You can't add a zone without touching existing code.

The standalone Express gateway has neither constraint. Each app sets its own `basePath` (`/app1`, `/app2`, `/app3`) and `assetPrefix`. Adding a new app is a single entry in `routes.config.ts` — nothing else changes. In production that list comes from a service registry; the path-based contract stays identical.

WebSocket passthrough is handled by `createProxyMiddleware({ ws: true })`. `http-proxy-middleware` upgrades the connection and proxies it to the correct upstream, so Next.js HMR works through the gateway without configuration — the browser connects to `ws://localhost:8080/_next/webpack-hmr` and the gateway transparently forwards it to the right app's dev server.

---

### Zod contract validation — where it runs and what happens on failure

Validation runs **client-side on the API response**, inside `api-client`'s `createRequest` function, after the HTTP response is received and JSON-parsed. The call is `args.schema.safeParse(attempt.raw)`.

`safeParse` (not `parse`) is used deliberately — it returns a discriminated union `{ success: true, data } | { success: false, error }` rather than throwing. This means a malformed payload is caught and converted into a typed `ApiError` with the Zod validation error attached, which the `onError` handler can log to observability. The caller gets a thrown error rather than a runtime crash from accessing undefined properties on unexpected data.

This catches real bugs: if the backend adds a required field or changes a type, every consumer fails loudly with a descriptive error (`response failed contract validation`) rather than silently returning `undefined` values that blow up downstream in a render.

The contracts are versioned (`v1/account.ts`). When a breaking change is needed, a `v2/` is added and the old one stays until all consumers migrate. The `contracts` CI job guards this: breaking changes to an existing schema require a specific PR label.

---

### `ignoreDeprecations: "5.0"` in tsconfig

The shared `library.json` and `node.json` configs use `"moduleResolution": "node"`. This was deprecated in TypeScript 5.0 in favour of `"bundler"` or `"node16"`.

The correct long-term fix for the library packages is `"moduleResolution": "node16"` paired with `"module": "Node16"`. That was attempted but `msw@1.x` — which `@raisin/testing` depends on — does not have a `"exports"` field in its `package.json` that satisfies Node16 resolution. Under `node16`, TypeScript requires the `exports` map; without it, `import from 'msw'` is a type error.

`ignoreDeprecations: "5.0"` keeps the existing resolution working while `msw` is pinned at v1. The upgrade path is: when `msw` moves to v2 (which has a proper `exports` field), remove `ignoreDeprecations` and switch to `"moduleResolution": "node16"`. That is tracked as a follow-up, not done here because upgrading MSW is a separate scope with its own breaking changes in how handlers are written.

---

### `captureMessage(msg, ctx, level)` — why `ctx` comes before `level`

ESLint's `@typescript-eslint/default-param-last` rule forbids a parameter with a default value from appearing before a parameter without one. The original signature was:

```ts
captureMessage(msg: string, level?: LogLevel, ctx?: LogContext): void
```

In the implementation, `level = 'info'` has a default but `ctx` does not — it is optional (can be `undefined`) but has no default expression. The rule flags this as `level` appearing before `ctx`.

The fix swaps the order so the defaulted parameter is last:

```ts
captureMessage(msg: string, ctx?: LogContext, level?: LogLevel): void
```

Both parameters are optional so callers that pass neither are unaffected. Callers that pass both need to swap the argument order, which was a one-line change in `api-client`'s `createRequest`.

---

### Commit style inconsistency (last 3 vs earlier)

The earlier commits use plain imperative messages (`"add v1 Account contract"`, `"auth-client: token store, silent refresh"`). The last three use Conventional Commits format (`fix:`, `fix(scope):`). Both styles are intentional: the earlier ones were written to read like a human work log, the later ones switch to Conventional Commits format which is what the CI tooling and changelogs expect going forward. If continuing this project I would backfill the convention via a linting rule (`commitlint`) from the start.

---

### `rootDir: ./src` in library tsconfigs

When `outDir` is set in a TypeScript config, TS needs `rootDir` to be explicit so it can compute the output directory structure correctly — otherwise it might include parent paths in the output tree. Adding `rootDir: ./src` next to every `outDir: ./lib` is a correctness fix, not a workaround. It makes the output layout predictable: `src/foo/bar.ts` compiles to `lib/foo/bar.js` regardless of what other files exist outside `src/`.

---

## Trade-offs and what I would do differently with more time

| Decision | Trade-off | Would change with more time |
|---|---|---|
| Demo auth (`mode: 'demo'`) | No real token exchange | Wire OIDC/PKCE as described in ADR 0003 |
| MSW v1 | Stuck on `moduleResolution: node` | Upgrade to MSW v2, drop `ignoreDeprecations` |
| Gateway as Express | Operational overhead vs Next.js config | At production scale, move to Nginx or a service mesh for gateway-layer concerns |
| `localStorage` for session | XSS exposure vs cookie `HttpOnly` | In production use `HttpOnly` cookies with a BFF token exchange |
| Single CI worker for e2e | Slow | Split into sharded Playwright workers once test count grows |
| Preview deploys stubbed | Reviewer can't click a live preview | Wire to Vercel or a k8s namespace per PR |

---

## Outdated versions — known technical debt

### Node.js 18 is past end-of-life

The repo is pinned to **Node 18.20.2** via `.nvmrc` and `engines` in every `package.json`. Node 18 LTS reached end-of-life in **April 2025** — it no longer receives security patches. The current LTS is **Node 24**.

The blocker for upgrading is **Next.js 12**: it officially supports Node 12–18. A Node upgrade must go hand-in-hand with a Next.js upgrade.

**Planned path:**
1. Upgrade Next.js 12 → 14 (App Router optional, Pages Router is compatible).
2. Update `.nvmrc`, all `engines` fields, and the CI `node-version-file` to the new version.
3. Run the full test suite and e2e to catch any Node API differences.
4. Drop `react-hot-loader` (incompatible with Next 13+, and superseded by Next's built-in Fast Refresh).

### Next.js 12 is three major versions behind

Next.js is currently at **v14** (stable) / **v15** (RC). Next 12 misses: App Router, React Server Components, Turbopack, improved image optimisation, and middleware improvements. The upgrade is not trivial (especially the `_app.tsx` → `layout.tsx` shift for App Router) but Pages Router is still supported through Next 14, making an incremental upgrade safe.

---

## Deployment stages

Currently two stages are wired:

| Stage | Where | Notes |
|---|---|---|
| `development` | Local (`pnpm dev`) | Live-reload, MSW mocks, dev-mode Next.js |
| `production` | CI stub (`.github/workflows/ci.yml`) | Build verified, deploy step is a placeholder |

**Planned additions:**

- **`staging`** — mirrors production config, seeded with realistic fixture data, used for QA sign-off before releases. The `NODE_ENV` type in `@raisin/observability` already includes `'staging'`; it just needs a deploy target and environment variables.
- **`demo`** — always-on environment with fixture data, no auth required, used for client demos and stakeholder reviews. Would use MSW in browser mode (`NEXT_PUBLIC_USE_MOCKS=true`) so no backend dependency.

---

## Dependabot

Not configured yet. Adding `.github/dependabot.yml` would auto-open PRs for outdated dependencies on a weekly schedule. Given the known Node 18 and Next.js 12 debt, Dependabot would surface upgrade opportunities automatically.

Planned config (one-file addition):

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    groups:
      platform:
        patterns: ["nx", "typescript", "ts-jest"]
      mui:
        patterns: ["@mui/*"]
```

Grouping related deps prevents a flood of single-package PRs and keeps the upgrade scope reviewable.

---

## Future: CLI to scaffold a new team or project

Today adding a new app is a manual 6-step process (described in the new developer guide above). The next platform-level upgrade is a CLI generator that automates it and supports multiple frameworks.

**Proposed approach — Nx workspace generator:**

```
packages/
  generators/
    new-app/
      schema.json      # prompts: name, framework, port
      index.ts         # generator logic
```

The generator would:
1. Ask for app name, framework choice (Next.js / Vite+React / Vue / Angular), and port.
2. Copy the right template from `packages/generators/templates/<framework>/`.
3. Write `basePath` and `assetPrefix` into the new app's config.
4. Append the route entry to `platform/gateway/src/routes.config.ts`.
5. Add the `dev` command to the root `concurrently` script.
6. Run `pnpm install` automatically.

**Run it with:**
```bash
pnpm nx g @raisin/generators:new-app
```

Supporting Angular adds complexity (different module system, zone.js), but Nx has first-class Angular support via `@nx/angular` so the scaffolding layer is handled — the custom generator only needs to wire the gateway entry and shared packages.

---

## Unused files, scripts, and packages

These exist in the repo today but are not needed and should be removed in a follow-up cleanup PR.

### Files

| File | Why it can be removed |
|---|---|
| `babel.config.js` (root) | Uses `@babel/preset-env` + `react-hot-loader/babel`. Next.js uses its own SWC compiler — this file is never read for app compilation or Jest (which uses ts-jest). |
| `apps/app1/.babelrc.js` | Contains only `presets: ['next/babel']`. Next.js applies this automatically; the file is redundant. |
| `apps/app2/.babelrc.js` | Same as above. |
| `apps/app3/.babelrc.js` | Same as above. |
| `packages/design-system/.babelrc.js` | Same pattern — design-system is compiled by `tsc`, not babel. |

### Root `package.json` scripts

| Script | Why it can be removed |
|---|---|
| `"clean": "lerna clean"` | Only usage of Lerna in the repo. Replace with `pnpm -r exec -- rm -rf node_modules` or just `pnpm store prune`. |
| `"g:watch"` | Registered as a convenience alias but never called by any package script. |

### Root `package.json` packages

| Package | Location | Why it can be removed |
|---|---|---|
| `lerna` | `dependencies` | Only used for `lerna clean`. Lerna adds no value here — pnpm + Nx handle all monorepo operations. |
| `@babel/preset-env` | `devDependencies` | Only referenced in `babel.config.js` which is dead (see above). |
| `@babel/preset-react` | `devDependencies` | Same. |
| `@babel/plugin-proposal-class-properties` | `devDependencies` | Same. This proposal is now part of the ECMAScript standard; the plugin itself warns it is deprecated. |
| `react-hot-loader` | `devDependencies` | Referenced in `babel.config.js`. HMR in Next.js is handled by Fast Refresh, not `react-hot-loader`. Incompatible with Next 13+. |
| `watch` | `devDependencies` | Registered as `g:watch` alias, never called. |
| `postcss-styled-syntax` | `devDependencies` | Stylelint plugin for CSS-in-JS. This repo has no CSS-in-JS; pure MUI `sx` prop / theme. |
| `react-hot-loader` | `dependencies` (root) | Listed in both `dependencies` and `devDependencies` — duplicate. |

---

## Getting started — new developer guide

### Prerequisites

```bash
node --version   # must be 18.20.2 — use nvm
pnpm --version   # must be 8.15.8
```

Install the right Node version:

```bash
nvm install 18.20.2
nvm use          # reads .nvmrc automatically
```

Install pnpm if needed:

```bash
npm install -g pnpm@8.15.8
```

### First run

```bash
git clone git@github.com:raisin-recruiting/Ahmed_Zeno_fp-challenge.git
cd Ahmed_Zeno_fp-challenge

pnpm install              # install all workspace deps
pnpm build:libs           # compile shared TypeScript packages (one-time, re-run after changing a package)
pnpm dev                  # start gateway + app1 + app2 + app3 in parallel
```

Open **http://localhost:8080** — you land on app1. Navigate to `/app1/accounts`, log in, then use the buttons to move between apps and verify the session and locale carry over.

### Running tests

```bash
pnpm test                                     # unit + integration tests across all packages (nx run-many)
pnpm --filter @raisin/e2e test:e2e            # Playwright e2e (needs pnpm dev running in another terminal)
pnpm nx run @raisin/app1:check-types          # type-check a single package
pnpm nx run-many --target=lint                # lint all packages
```

### Adding a new feature to an existing app

1. Navigate to the app (`apps/app1/src/`).
2. Create your component or page, importing from `@raisin/*` packages as needed.
3. Run `pnpm --filter @raisin/app1 dev` for fast iteration (or `pnpm dev` for the full stack).
4. Write a test in `apps/app1/src/__tests__/` using `renderWithProviders` from `@raisin/testing`.
5. Run `pnpm --filter @raisin/app1 test` to check the test, `pnpm --filter @raisin/app1 lint` to check style.
6. Open a PR — CI runs only the affected packages automatically.

### Adding a new shared package

1. Copy the structure from an existing small package (`packages/design-tokens/` is the simplest).
2. Add `name: @raisin/<your-package>` in the new `package.json`.
3. Add it to the root `pnpm-workspace.yaml` if it lives outside `packages/` (it already covers `packages/*`).
4. Add a `moduleNameMapper` entry in `packages/jest-preset/jest-preset.js` pointing to its `src/index.ts`.
5. Depend on it from any app with `"@raisin/<your-package>": "workspace:*"` in that app's `package.json`, then run `pnpm install`.
6. Run `pnpm build:libs` to compile it.

### Adding a new app

1. Create `apps/app4/` with the same structure as `apps/app1/` (copy `next.config.js`, `tsconfig.json`, `package.json`, `src/pages/_app.tsx`).
2. Set `basePath: '/app4'` and `assetPrefix: '/app4'` in `next.config.js`.
3. Add one entry to `platform/gateway/src/routes.config.ts`:
   ```ts
   { prefix: '/app4', upstream: 'http://localhost:3003', description: 'Your new app' }
   ```
4. Add `"dev": "next dev -p 3003"` to the new app's `package.json` scripts.
5. Add `"@raisin/app4 dev"` to the root `concurrently` command in the root `package.json` `dev` script.
6. Run `pnpm install` and `pnpm dev`. CI picks up the new app automatically via `nx affected`.

### Useful commands cheat-sheet

| Command | What it does |
|---|---|
| `pnpm dev` | Start everything |
| `pnpm build:libs` | Compile all shared packages (needed after changing a package) |
| `pnpm test` | Run all unit/integration tests |
| `pnpm nx run-many --target=lint --fix` | Auto-fix formatting across all packages |
| `pnpm nx run @raisin/<pkg>:check-types` | Type-check one package |
| `pnpm --filter @raisin/<pkg> test` | Test one package |
| `pnpm nx graph` | Visual dependency graph in the browser |

---

## Architecture decisions

Full rationale is in `docs/adr/`. The most important ones:

- [ADR 0002](docs/adr/0002-app-integration-gateway.md) — why a standalone gateway over Next.js Multi-Zones
- [ADR 0003](docs/adr/0003-auth-strategy.md) — auth design and OIDC upgrade path
- [ADR 0005](docs/adr/0005-ci-strategy.md) — CI design and caching strategy
- [ADR 0006](docs/adr/0006-design-system-and-tokens.md) — MUI barrel import problem and the structural fix
- [ADR 0008](docs/adr/0008-testing-strategy.md) — test pyramid and MSW approach
