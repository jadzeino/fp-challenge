# ADR 0005 — CI strategy: nx affected, layered cache, contract gate

- Status: accepted
- Date: 2026-04-25

## Context

Naive CI re-runs the entire workspace per PR. At 60 apps that means a 30-minute pipeline per push and a runner bill that grows linearly with the team. We need a CI that scales with the *change*, not with the *repo*.

## Decision

The pipeline (see `.github/workflows/ci.yml` and `docs/ci-pipeline.md`):

1. **Setup** — pinned pnpm + Node from `.nvmrc` so local and CI agree.
2. **Affected matrix** — `nx affected --target=<lint|check-types|test|build>` on PRs; `nx run-many` on main. Matrix runs each target on its own runner.
3. **Caching** — pnpm store cache via `actions/setup-node`; Nx local cache via `actions/cache` keyed on lockfile hash + sha with restore-key fallbacks.
4. **Contract gate** — typecheck + tests for `@raisin/api-contracts`; heuristic breaking-change detection requires a label OR a version bump.
5. **Playwright e2e** — runs on PRs and main; reports retained on failure.
6. **Preview** — stub today; per-PR ephemeral env per affected app, fronted by an ephemeral gateway.
7. **Concurrency** — `cancel-in-progress` on PRs to avoid runner waste.
8. **Nightly** — separate workflow: `pnpm audit`, license-allowlist, dependency-drift report.

## Consequences

- New apps are picked up automatically by `nx affected` — zero CI edits.
- Cache hit-rate stays high because keys are content-driven.
- The next plausible upgrade is **Nx Cloud** for distributed remote cache and DTE (distributed task execution) — a one-line addition once a second team is regularly opening PRs.

## Alternatives considered

- **Path-filter actions** — brittle and re-implements the dep graph that Nx already has.
- **One job per app** — hard-codes the list; rejected.
- **Bazel** — solves caching at a deeper level; Nx is enough for this scale.
