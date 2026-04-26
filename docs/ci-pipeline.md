# CI Pipeline

GitHub Actions workflow at [.github/workflows/ci.yml](../.github/workflows/ci.yml). Nightly companion at [.github/workflows/nightly.yml](../.github/workflows/nightly.yml). Decisions live in [ADR 0005](./adr/0005-ci-strategy.md).

## Stages

```mermaid
flowchart LR
  A[Push or PR] --> B[Setup<br/>node@.nvmrc + pnpm cache]
  B --> C[Install<br/>frozen-lockfile]
  C --> D{nx affected matrix}
  D --> E1[Lint]
  D --> E2[Typecheck]
  D --> E3[Test]
  D --> E4[Build]
  C --> F[Contracts<br/>typecheck + tests + breaking-change gate]
  E1 & E2 & E3 & E4 & F --> G[Playwright e2e<br/>traces on failure]
  G --> H{event?}
  H -->|PR| I[Preview deploy<br/>per-app ephemeral env]
  H -->|main| J[Production deploy<br/>per-app, gated]

  subgraph Cache
    direction TB
    K[pnpm store<br/>actions/setup-node]
    L[nx cache<br/>actions/cache by lockfile + sha]
  end
  C -. uses .-> K
  D -. uses .-> L
```

## Live run screenshots

Captured from [github.com/jadzeino/fp-challenge](https://github.com/jadzeino/fp-challenge/actions) — the public mirror used to validate the pipeline end-to-end.

**Push to main — all jobs green:**

![CI build passing](../docs/images/ci-build.png)

**PR path — only affected packages run in the matrix:**

![CI on PR overview](../docs/images/ci-on-pr-a.png)
![CI on PR job detail](../docs/images/ci-on-pr-b.png)

## Why this scales

| Concern | Mitigation |
|---|---|
| New apps inflate CI time | `nx affected` runs only what changed |
| Cache misses on every PR | Layered cache (pnpm store + nx cache) keyed on lockfile hash with restore-key fallbacks |
| Slow contract feedback | Dedicated job typechecks + tests `@raisin/api-contracts` and gates breaking changes via PR label |
| Runner waste on rapid push | `concurrency.cancel-in-progress` on PRs |
| Local/CI Node drift | `node-version-file: .nvmrc` everywhere, including the gateway and apps |
| E2E flake hides real bugs | `retries: 2` on CI; trace + video retained on failure |

## Per-PR vs per-main

- **Pull request**: lint/typecheck/test/build are `nx affected --base=origin/main`. Preview deploys per affected app.
- **Push to main**: lint/typecheck/test/build run for every project (`nx run-many`). Production deploys per app (gated, today stubbed).

## Adding a new app

1. Drop the app under `apps/<name>/`.
2. Wire it into the platform providers (`_app.tsx`).
3. Add it to the gateway registry (`platform/gateway/src/routes.config.ts`).

CI requires **zero edits** — `nx affected` and the matrix pick the new app up automatically. This is the load-bearing property of the design.

## Nightly

Runs at 03:17 UTC and on demand:

- `pnpm audit --audit-level=high`
- `license-checker` against the explicit allowlist
- `pnpm -r outdated` posted to the workflow summary

These are **awareness tools**, not PR blockers. When something here goes red, it becomes a Renovate PR or a dedicated cleanup ticket.

## Production path

Today's preview-deploy job is a stub. The real per-PR ephemeral env will deploy each affected app to a Vercel preview / Netlify / k8s namespace, fronted by an ephemeral gateway pinned to those previews. The path-based contract from ADR 0002 makes any of those backends interchangeable.

The next platform-level upgrade is **Nx Cloud** for distributed remote cache and DTE — a one-line addition once a second team is regularly opening PRs.
