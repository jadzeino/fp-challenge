# ADR 0001 — Monorepo tooling: pnpm + Nx + Lerna

- Status: accepted
- Date: 2026-04-25

## Context

The platform sits in a single git repository with multiple applications and shared packages. Tooling has to satisfy: workspace-aware install, deterministic versions, build-graph caching, affected-only execution in CI, and an upgrade path that does not paint future teams into a corner.

## Decision

| Tool | Role | Why this one |
|---|---|---|
| **pnpm** (8.15.x) | Package manager + workspace resolution | Strict node_modules layout catches phantom dependencies; content-addressable store keeps installs fast in CI. |
| **Nx** (17.x) | Build orchestration + caching + affected detection | Mature affected-graph; project-level cache keys; zero coupling to app frameworks. |
| **Lerna** (7.x, useNx) | Versioning + conventional-commit publishing | Preserves the commit-driven release flow without re-implementing it. |

All three are wired together: Lerna delegates task running to Nx; pnpm is the npm client.

## Consequences

- One package manager pinned via `engines` and `packageManager` so local and CI never diverge.
- `nx affected --base=origin/main` is the unit of CI work — adding apps does not enlarge CI without bound.
- The next plausible upgrade is **Nx Cloud** for distributed remote cache (one-line addition; no architecture change).

## Alternatives considered

- **Turborepo** — comparable affected-graph; chosen against because Nx is already in the repo and the migration cost > the win.
- **Rush** — strong for very large monorepos; overkill for our current scale and adds a steep learning curve.
- **Plain pnpm workspaces + scripts** — rejected because affected-graph + caching are load-bearing for the 60-app target.
