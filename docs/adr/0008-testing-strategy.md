# ADR 0008 — Testing strategy: layered, MSW as single mock truth

- Status: accepted
- Date: 2026-04-25

## Context

A monorepo at scale needs a testing pyramid that every team writes against the same way. Drift here is silent: app A asserts `/v1/accounts` returns one shape, app B asserts another, and the API design drifts in everyone's head until production reveals the disagreement.

## Decision

| Layer | Tooling | Where |
|---|---|---|
| Unit (logic) | Jest 29 + ts-jest | colocated `*.test.ts` |
| Unit (component) | Jest + React Testing Library | colocated `__tests__/*.test.tsx` |
| Contract | Zod `safeParse` over fixtures | `packages/api-contracts/src/__tests__/` |
| Integration (in-app) | Jest + RTL + MSW | `apps/<app>/src/__tests__/*.integration.test.tsx` |
| E2E | Playwright | `platform/e2e/tests/` |

`@raisin/testing` centralizes:

- The MSW handler set (the **single source of truth** for mock API behavior — used by Jest tests, dev-mode browser worker, and Playwright e2e).
- `renderWithProviders` so tests inherit the platform provider chain (AuthProvider today; common-i18n + observability join as their packages ship).
- Fixtures that conform to contracts and are pinned by contract tests.

Every new package ships with at least one real test demonstrating its layer.

## Consequences

- Contract changes break tests in every consumer at once — exactly the desired blast radius.
- A new team writing tests inherits the providers + mocks instead of reinventing them.
- E2E is reserved for the integration claims that unit tests cannot make (cross-zone session, cross-zone locale).

## Alternatives considered

- **Vitest** — faster than Jest, but the existing tooling already wires Jest via the `g:jest` script, so the migration is a separate decision.
- **Per-app MSW handlers** — the explicit anti-pattern this ADR prevents.
- **Cypress** — fine, but Playwright's network mocking + browser parallelism + tracing is the better fit for a multi-zone stack.
