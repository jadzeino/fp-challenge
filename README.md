# Raisin Frontend Platform

A production-shaped monorepo with three Next.js apps sharing a common platform layer — auth, API contracts, design system, i18n, and observability — all served from a single URL through a standalone gateway.

> **On AI usage:** Claude (Anthropic) was used as an accelerator throughout this challenge — as a senior pair-programming partner, not an author. Every architectural decision, trade-off, and implementation choice was mine. See [solution.md](solution.md) for the full walk-through.

---

## Architecture overview

![Platform blueprint](docs/images/blueprint-2.png)

---

## Quick start

**Requirements:** Node `18.20.2` (see `.nvmrc`) and pnpm `8.15.8`.

```bash
nvm use                # pins Node to 18.20.2 via .nvmrc
pnpm install           # install all workspace dependencies
pnpm build:libs        # compile shared TypeScript packages (one-time setup)
pnpm dev               # start the gateway + all three apps in parallel
```

Open **http://localhost:8080** — the gateway redirects you to app1.

> **Dev vs. production:** `next dev` compiles chunks on demand and disables browser caching, so cross-zone navigation feels heavier than it really is. Run `pnpm build && pnpm start` for a realistic performance check.

### What to try once it's running

| URL | What it shows |
|---|---|
| `http://localhost:8080/app1/accounts` | Log in, browse the accounts table |
| `http://localhost:8080/app2` | Session carries over automatically (cross-zone SSO) |
| `http://localhost:8080/app3` | Locale carries over automatically (cross-zone i18n) |
| `http://localhost:8080/__health` | Gateway health — JSON or human-readable HTML |

---

## Repo structure

```
apps/
  app1 (:3000)             first consumer app
  app2 (:3001)             second consumer app
  app3 (:3002)             third consumer app

packages/                  shared platform libraries
  api-contracts            Zod schemas + TypeScript types, versioned (v1, v2…)
  api-client               auth-aware typed fetch client
  auth-client              token store, silent refresh, cross-tab sync
  design-tokens            framework-agnostic JSON design tokens
  design-system            React + MUI components consuming tokens
  common-i18n              i18next provider, global + per-app namespaces
  observability            Sentry-shaped logger, error boundary, request-ID middleware
  navigation               CrossAppLink with prefetch hints for cross-zone nav
  testing                  MSW handlers, renderWithProviders, typed fixtures
  eslint-config            shared ESLint rules (MUI barrel-import guardrail)
  tsconfig                 base config presets (next / library / node)

platform/
  gateway                  Express + http-proxy-middleware path-based proxy
  e2e                      Playwright tests against the live gateway

docs/
  adr/                     numbered Architecture Decision Records (0001–0010)
  architecture.md          system design, principles, request flow, scaling story
  ci-pipeline.md           CI diagram, stage reference, nightly
```

---

## Running tests

```bash
pnpm test                              # all unit + integration tests via nx run-many
pnpm --filter @raisin/e2e test         # Playwright e2e (needs pnpm dev running)
pnpm nx run @raisin/app1:check-types   # type-check one package
pnpm nx run-many --target=lint         # lint all packages
```

---

## Conventions

- **Commits:** Conventional Commits format (`feat`, `fix`, `chore`, `perf`, `docs`, `test`, `ci`) scoped per package.
- **MUI imports:** deep paths only (`@mui/material/Button`, not `@mui/material`). Lint-enforced as a CI error.
- **Toolchain:** Node 18.20.2 + pnpm 8.15.8 pinned via `.nvmrc`, `engines`, and `packageManager` across all packages.
- **One package per commit** — keeps the change scope reviewable and the git log navigable.

---

## Known technical debt

| Item | Blocker | Path forward |
|---|---|---|
| Node.js 18 (EOL April 2025) | Blocked by Next.js 12 | Upgrade Next 12 → 14, then Node 18 → 24 |
| Next.js 12 (3 majors behind) | Pages Router migration needed | Next 14 still supports Pages Router; incremental upgrade is safe |
| Dependabot not configured | — | Add `.github/dependabot.yml` for weekly dependency PRs |
| Preview / staging deploys are stubs | — | Wire to Vercel or a k8s namespace per PR |
| Dead files: `babel.config.js`, `lerna`, `react-hot-loader` | — | Remove in a dedicated cleanup PR — full list in [solution.md](solution.md) |

---

## Where to read next

| Document | What you'll find |
|---|---|
| [solution.md](solution.md) | What was broken, how it was fixed, deep Q&A on every key decision |
| [docs/architecture.md](docs/architecture.md) | System design, principles, full request flow, scaling story |
| [docs/ci-pipeline.md](docs/ci-pipeline.md) | CI diagram, stage walkthrough, caching strategy, nightly |
| [docs/adr/](docs/adr/) | Numbered, immutable decision records — start with [ADR 0002](docs/adr/0002-app-integration-gateway.md) and [ADR 0005](docs/adr/0005-ci-strategy.md) |
| [CONTRIBUTORS.md](CONTRIBUTORS.md) | How to add a new feature, package, or app; PR guidelines |
