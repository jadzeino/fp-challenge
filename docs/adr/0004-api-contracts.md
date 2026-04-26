# ADR 0004 — API contracts: Zod schemas, versioned, breaking-change gated

- Status: accepted
- Date: 2026-04-25

## Context

Type-only contracts drift silently against backend reality; hand-written runtime validators duplicate the schema. The platform needs a single source of truth that gives both inferred TypeScript types and runtime validation, plus a workflow that prevents a breaking change from rolling out without conscious approval.

## Decision

`@raisin/api-contracts` exposes contracts as **Zod schemas**. Inferred types come from `z.infer<typeof Schema>`. Versioned exports (`./v1`, `./v2`, …) so apps pin a version and migrate at their own pace.

The api-client `safeParse`s every response against the contract — schema drift becomes a typed `ApiError`, not a "cannot read property of undefined" deep in the UI.

Breaking changes are gated in CI: a PR that touches `packages/api-contracts/src/v1/*` must either bump the package version OR carry the `breaking-change-approved` label. The check is intentionally a heuristic today; replacing it with `api-extractor` for richer semver detection is a follow-up.

Fixtures live in `@raisin/testing`. A contract test parses each fixture against the schema, so any drift between fixtures and contract fails fixture tests *first*.

## Consequences

- One definition; runtime + types stay in sync by construction.
- Breaking changes are visible at PR time, not in production.
- The fixture-as-contract pattern means changing a schema breaks the dependent app's tests, which is exactly the early warning we want.

## Alternatives considered

- **OpenAPI + codegen** — strong if a backend team owns the spec; introduces a generation step and a tool boundary that we do not need today. Worth revisiting once a backend service standardizes on OpenAPI.
- **Hand-written types + JSON Schema validators** — duplication, and no inference link; rejected.
