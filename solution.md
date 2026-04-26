# Solution Walk-through

> **On AI usage:** Claude (Anthropic) was used as an accelerator throughout — as a senior pair-programming partner, not an author. It helped me move faster on boilerplate, surfaced options I could evaluate, and caught mistakes I'd have caught in code review anyway. Every architectural decision, trade-off, and implementation choice was mine. I can explain every line.

---

## What I found

The repo arrived with three tasks and several structural problems beneath them.

The most visible symptom was that the "Take me to app2/3" buttons did nothing. The root cause was not routing or navigation logic — it was the shared `Button` component in `@raisin/lib1`. It hardcoded `onClick={() => undefined}`, silently overriding every caller's click handler. It also barrel-imported from `@mui/material`, which webpack 5 does not reliably tree-shake, pulling the full MUI bundle into every page. The performance and the broken navigation were the same bug: a shared component that had never been used correctly.

Beyond that: no single host to run all three apps together meant no shared origin, no shared cookies, no shared `localStorage` — cross-zone SSO and locale persistence were structurally impossible without first solving routing. And no CI meant no safety net for any of it.

---

## What was built

### Task 1 — Fix the shared Button and the MUI bundle bloat

**The problem:** `@raisin/lib1`'s `Button` barrel-imported from `@mui/material`, hardcoded `autoFocus`, and replaced every caller's `onClick` with a no-op.

**The fix — in order:**

1. Renamed `lib1` → `@raisin/design-system`; extracted `@raisin/design-tokens` for color, spacing, and typography as framework-agnostic JSON so non-React consumers can share the visual language later.
2. Switched all MUI imports to deep paths: `@mui/material/Button`, `@mui/material/styles`. Removed `autoFocus` and the no-op `onClick`; forwarded all props correctly via spread.
3. Enabled `modularizeImports` in each app's `next.config.js` — webpack now splits at the deep-import level even for third-party code.
4. Added an ESLint `no-restricted-imports` rule in `@raisin/eslint-config` that makes a barrel import a **hard CI error** and tells you exactly what to write instead.

The last point is what makes this a platform fix rather than a patch. The regression is now structurally impossible — it can't slip past lint, and the error message is self-correcting. See [ADR 0006](docs/adr/0006-design-system-and-tokens.md).

---

### Task 2 — One host:port for all apps

`platform/gateway/` is a standalone Express service using `http-proxy-middleware`:

- Routes `/app1/*` → `:3000`, `/app2/*` → `:3001`, `/app3/*` → `:3002` via a declarative `routes.config.ts`.
- WebSocket-aware (`ws: true`) — Next.js HMR works transparently through the gateway without any configuration in the apps.
- Returns a friendly down-page on upstream failure — never a raw 502.
- `/__health` checks all upstreams and returns JSON for monitors or human-readable HTML.

Adding a new app is **one entry** in `routes.config.ts`. No changes to existing apps, no shared "primary zone" to redeploy. See [ADR 0002](docs/adr/0002-app-integration-gateway.md) for why this architecture beats Next.js Multi-Zones at scale.

---

### Task 3 — CI pipeline

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs `nx affected` on a matrix of `lint | check-types | test | build` — only the packages touched by the PR run. Layered cache: pnpm store keyed on lockfile; nx computation cache keyed on lockfile + commit SHA.

A dedicated `contracts` job typechecks and tests `@raisin/api-contracts` separately, and gates breaking schema changes behind a required PR label. Playwright e2e boots the full stack and runs on both PRs and pushes to main.

Full diagram and stage notes: [docs/ci-pipeline.md](docs/ci-pipeline.md). Decisions: [ADR 0005](docs/adr/0005-ci-strategy.md).

The screenshots below were captured from the pipeline running live at [github.com/jadzeino/fp-challenge](https://github.com/jadzeino/fp-challenge/actions).

**Push to main — all jobs green:**

![CI build passing on push to main](docs/images/ci-build.png)

**PR path — `nx affected` matrix fires, only changed packages run:**

![CI on PR — matrix overview](docs/images/ci-on-pr-a.png)
![CI on PR — job detail](docs/images/ci-on-pr-b.png)

---

### Platform layer (beyond the three tasks)

The three tasks were the brief. The platform layer underneath them is what makes everything composable and keeps it from collapsing under scale:

| Package | What it does |
|---|---|
| `@raisin/api-contracts` | Zod schemas + inferred TypeScript types, versioned under `v1/` |
| `@raisin/api-client` | Auth-aware typed fetch; retries on 401 with forced token refresh |
| `@raisin/auth-client` | Token store, silent refresh, cross-tab sync, pluggable storage |
| `@raisin/common-i18n` | i18next with global + per-app namespaces, locale cookie for cross-zone persistence |
| `@raisin/observability` | Sentry-shaped logger, error boundary, request-ID middleware |
| `@raisin/navigation` | `CrossAppLink` — prefetch hints that warm the browser cache before a cross-zone click |
| `@raisin/testing` | MSW handlers, `renderWithProviders`, typed account fixtures |
| `@raisin/design-tokens` | Framework-agnostic JSON design tokens |
| `@raisin/design-system` | React + MUI components built on design tokens |

---

## Key decisions — reviewer Q&A

These are the decisions most likely to prompt questions during a review. The ADRs hold the formal records; this section holds the thinking.

---

### How does cross-zone SSO work?

The token lives in `localStorage` under `raisin.auth.session`. `localStorage` is scoped to the **origin** (`http://localhost:8080`), not to a path or app. All three apps share the same origin through the gateway, so they all read and write the same key.

Step by step:
1. User logs in on app1 → `auth.login()` writes the demo token to `localStorage['raisin.auth.session']`.
2. User clicks "Take me to app2" → hard full-page navigation (app1's runtime is discarded entirely).
3. app2 boots. `AuthProvider` → `createDefaultStorage()` reads `localStorage['raisin.auth.session']` on construction → session is already present → status is `'authenticated'` before the first React render.
4. If the token expires mid-session, `api-client` catches the 401, calls `auth.refreshIfExpiring(Infinity)` to force a new token, writes it back to `localStorage`, and retries the request once. The user never sees the error.
5. Logout in any app writes `null` → the browser's `storage` event fires in other open tabs, logging those out too.

The locale travels separately via a cookie (`raisin-locale`) scoped `Path=/; SameSite=Lax`. A `Path=/` cookie is sent on every request to the origin regardless of path, so the browser sends it when loading `/app2` and i18n hydrates with the correct locale before the first render.

---

### Why `<CrossAppLink>` with `<link rel="prefetch">` and not `router.prefetch`?

`router.prefetch` only works within the same Next.js app. Navigating from `/app1` to `/app2` is a **hard full-page navigation** — the browser discards app1's runtime entirely and boots app2 from scratch. `router.prefetch` has no effect across that boundary.

`<link rel="prefetch" as="script">` is a browser-native hint that fetches the destination's `_app.js` chunk into the HTTP cache **before the user clicks**. When the navigation fires, the chunk is already cached — the browser skips the round-trip and the page boots visibly faster.

`usePrefetchCrossApp` returns a stable callback (via `useRef`) that on first call constructs the chunk URL from the `href`, checks `document.head.querySelector` to avoid duplicate `<link>` elements (DOM deduplication survives React remount/unmount without a module-level `Set`), and injects the hint.

The hook is decoupled from the component so `<Button component={CrossAppLink} href="/app2">` works: MUI forwards `href` and DOM events to the underlying element, so the prefetch fires even when `CrossAppLink` is used as a render prop.

---

### Why a standalone Express gateway over Next.js Multi-Zones?

Next.js Multi-Zones has two constraints that matter at scale:

1. **One primary zone owns `/_next/` assets.** Every other zone needs path rewrites to avoid clashing asset paths. At 3 apps this is manageable; at 30+ it is a coordination problem.
2. **`rewrites` live in the primary zone's `next.config.js`.** Adding a new app requires editing and redeploying the primary zone — a hidden coupling that grows more painful over time.

The standalone gateway has neither constraint. Each app owns its `basePath` and `assetPrefix`. Adding an app is a single entry in `routes.config.ts` — nothing else changes. In production that entry could come from a service registry. See [ADR 0002](docs/adr/0002-app-integration-gateway.md).

---

### Where does Zod validation run, and what happens on failure?

Validation runs **client-side on the API response**, inside `api-client`'s `createRequest`, after the response is JSON-parsed. The call is `args.schema.safeParse(attempt.raw)`.

`safeParse` (not `parse`) is used deliberately — it returns `{ success: true, data } | { success: false, error }` without throwing. A malformed payload is caught and converted into a typed `ApiError` with the Zod error attached. The caller gets a thrown error rather than a runtime crash from accessing `undefined` properties on unexpected data.

This catches real bugs: if the backend adds a required field or changes a type, every consumer fails with a descriptive error (`response failed contract validation`) rather than silently returning `undefined` values that blow up somewhere in a render.

Contracts are versioned (`v1/account.ts`). When a breaking change is needed, `v2/` is added and `v1/` stays until all consumers migrate. The `contracts` CI job guards this: breaking schema changes require a specific PR label.

---

### Why does `captureMessage` have `ctx` before `level`?

ESLint's `@typescript-eslint/default-param-last` rule forbids a parameter with a default value from appearing before a non-defaulted one. The original signature had `level = 'info'` (defaulted) before `ctx` (optional, no default), which the rule flagged.

Swapping to `(msg, ctx?, level?)` keeps both parameters optional and leaves callers that pass neither unaffected. Callers that passed both swapped argument order — a one-line change in `api-client`.

---

### Why `ignoreDeprecations: "5.0"` in tsconfig?

The library and node tsconfig presets use `"moduleResolution": "node"`, deprecated in TypeScript 5.0 in favour of `"bundler"` or `"node16"`.

The correct long-term fix is `"moduleResolution": "node16"` with `"module": "Node16"`. That was attempted, but `msw@1.x` — which `@raisin/testing` depends on — lacks an `exports` field in its `package.json`. Under `node16` resolution, TypeScript requires the `exports` map; without it, `import from 'msw'` is a type error.

`ignoreDeprecations: "5.0"` keeps existing resolution working while `msw` is pinned at v1. The upgrade path: when `msw` moves to v2 (which has a proper `exports` field), remove `ignoreDeprecations` and switch to `"moduleResolution": "node16"`.

---

## Trade-offs

| Decision | Trade-off made | With more time |
|---|---|---|
| Demo auth (`mode: 'demo'`) | No real token exchange | Wire OIDC/PKCE as described in [ADR 0003](docs/adr/0003-auth-strategy.md) |
| MSW v1 | Stuck on `moduleResolution: node` | Upgrade to MSW v2, drop `ignoreDeprecations` |
| Gateway as Express | Operational overhead vs. managed routing | At production scale: Nginx, Envoy, or a service mesh |
| `localStorage` for session | XSS exposure vs. ergonomics | `HttpOnly` cookies with a BFF token exchange in production |
| Single CI worker for e2e | Slow as test count grows | Sharded Playwright workers |
| Preview deploys stubbed | Reviewer can't click a live preview | Wire to Vercel or a k8s namespace per PR |

---

## Technical debt

### Dead files and packages to remove

These exist today but serve no purpose. They should be removed in a cleanup PR:

| Path | Why it's safe to remove |
|---|---|
| `babel.config.js` (root) | Uses `react-hot-loader/babel`; Next.js uses SWC, Jest uses ts-jest — this file is never read. |
| `apps/app{1,2,3}/.babelrc.js` | `presets: ['next/babel']` only; Next.js applies this automatically. |
| `packages/design-system/.babelrc.js` | design-system is compiled by `tsc`, not Babel. |
| `lerna` (root dep) | Used only for `lerna clean`; pnpm + Nx handle all monorepo operations. |
| `@babel/preset-env`, `@babel/preset-react`, `@babel/plugin-proposal-class-properties` | Referenced only in the dead `babel.config.js`. |
| `react-hot-loader` | Superseded by Next.js Fast Refresh. Incompatible with Next 13+. Listed in both `dependencies` and `devDependencies` at root. |
| `watch` (root devDep) | Registered as `g:watch` alias, never called by any package script. |
| `postcss-styled-syntax` | Stylelint plugin for CSS-in-JS; this repo has no CSS-in-JS. |

### Platform upgrades blocked on each other

| Item | Status | Path forward |
|---|---|---|
| Node.js 18 (EOL April 2025) | Must upgrade | Blocked by Next.js 12 — upgrade Next first, then Node |
| Next.js 12 | 3 majors behind | Next 14 supports Pages Router; incremental migration is safe |
| Dependabot | Not configured | Add `.github/dependabot.yml` for weekly dep PRs |

---

## Future platform work

- **Real auth:** OIDC/PKCE flow with refresh-token rotation and a per-market BFF.
- **Design system:** Storybook (or Ladle) for `@raisin/design-system` with Chromatic visual regression.
- **CI scale:** Nx Cloud for distributed remote cache and DTE — a one-line addition once a second team is opening regular PRs.
- **Observability:** OpenTelemetry traces propagated gateway → apps → backend on the existing `X-Request-ID` spine.
- **App scaffolding:** `pnpm nx g @raisin/generators:new-app` — scaffold a new app, register it with the gateway, and have CI pick it up automatically.
- **Feature flags:** `@raisin/feature-flags` wrapping LaunchDarkly or Unleash.
- **Multi-framework proof:** Angular reference app under `apps/` consuming `@raisin/design-tokens` to prove the framework-agnostic claim.
- **Supply chain:** Renovate + sigstore/SLSA checks in nightly.

---

## New developer guide

### Prerequisites

```bash
node --version   # must be 18.20.2 — use nvm
pnpm --version   # must be 8.15.8
```

```bash
nvm install 18.20.2
nvm use                          # reads .nvmrc automatically
npm install -g pnpm@8.15.8       # if pnpm is not installed
```

### First run

```bash
git clone git@github.com:raisin-recruiting/Ahmed_Zeno_fp-challenge.git
cd Ahmed_Zeno_fp-challenge

pnpm install              # install all workspace deps
pnpm build:libs           # compile shared TypeScript packages
pnpm dev                  # start gateway + all apps
```

Open **http://localhost:8080** and navigate to `/app1/accounts`. Log in, then click "Take me to app2" and "Take me to app3" to verify the session and locale carry over.

### Adding a new feature to an existing app

1. Navigate to `apps/app1/src/` (or whichever app).
2. Create your component or page, importing from `@raisin/*` packages as needed.
3. Write a test using `renderWithProviders` from `@raisin/testing`.
4. Run `pnpm --filter @raisin/app1 test` and `pnpm --filter @raisin/app1 lint`.
5. Open a PR — CI runs only the affected packages automatically.

### Adding a new shared package

1. Copy the structure from a small existing package (`packages/design-tokens/` is the simplest).
2. Set `"name": "@raisin/<your-package>"` in the new `package.json`.
3. Add a `moduleNameMapper` entry in `packages/jest-preset/jest-preset.js` pointing to its `src/index.ts`.
4. Depend on it from any app with `"@raisin/<your-package>": "workspace:*"` and run `pnpm install`.
5. Run `pnpm build:libs` to compile it.

### Adding a new app

1. Create `apps/app4/` mirroring the structure of an existing app.
2. Set `basePath: '/app4'` and `assetPrefix: '/app4'` in `next.config.js`.
3. Add one entry to `platform/gateway/src/routes.config.ts`:
   ```ts
   { prefix: '/app4', upstream: 'http://localhost:3003', description: 'Your new app' }
   ```
4. Add `"dev": "next dev -p 3003"` to the new app's `package.json` scripts, then add it to the root `concurrently` dev command.
5. Run `pnpm install` and `pnpm dev`. CI picks up the new app automatically — no edits to the workflow file.

### Useful commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start everything |
| `pnpm build:libs` | Compile all shared packages (re-run after changing a package) |
| `pnpm test` | Run all unit + integration tests |
| `pnpm nx run-many --target=lint --fix` | Auto-fix formatting across all packages |
| `pnpm nx run @raisin/<pkg>:check-types` | Type-check one package |
| `pnpm --filter @raisin/<pkg> test` | Test one package |
| `pnpm nx graph` | Open the visual dependency graph in the browser |
