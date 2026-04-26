# Platform Architecture

![Platform blueprint](../docs/images/blueprint-2.png)

This document is the top-level map. For specific decisions, follow the links to the [ADRs](./adr/README.md). For CI mechanics, see [ci-pipeline.md](./ci-pipeline.md).

## Layout

```
/apps                          consumer apps - one team owns each
  /app1, /app2, /app3
/packages                      shared libraries - versioned, contract-driven
  /api-contracts               Zod schemas + types (versioned: v1, v2, ...)
  /api-client                  auth-aware typed client built on contracts
  /auth-client                 token mgmt + refresh + React adapter
  /design-tokens               framework-agnostic JSON tokens
  /design-system               React+MUI wrappers consuming tokens
  /common-i18n                 i18n provider + global+app namespaces
  /observability               Sentry-shaped wrapper + logger + boundary
  /testing                     MSW handlers + renderWithProviders + fixtures
  /eslint-config               shared ESLint preset (incl. guardrails)
  /tsconfig                    base + presets (next/library/node)
/platform                      infra owned by the platform team
  /gateway                     standalone path-based HTTP gateway
  /e2e                         Playwright tests against the gateway
/docs
  /adr                         numbered, immutable decisions
  ci-pipeline.md               mermaid diagram of CI
  architecture.md              this file
.github/workflows/             ci.yml + nightly.yml
```

## Principles in force

- **Team independence**: apps depend only on `@raisin/*` shared packages; no app-to-app imports (will be lint-enforced when more than one team owns code in the repo).
- **Contract-first**: api-contracts is the single source of truth; api-client and apps consume it; fixtures conform to it; CI gates breaking changes.
- **Platform layer**: cross-cutting concerns (auth, i18n, design, observability, config) live in shared packages with stable contracts. Apps never import vendor SDKs (Sentry, i18next) directly — they consume the wrapper.
- **Multi-framework readiness**: tokens are framework-agnostic. An Angular `@raisin/design-system-ng` later wraps the same tokens. The api-client and auth-client cores are framework-agnostic too; React is a subpath import.
- **Configuration over code**: gateway routes, CI matrix, env config are data. Adding an app is a config change, not a refactor.
- **Demonstrated, not theoretical**: every shared package has at least one real consumer in `apps/` so the contract is exercised, not just declared.

## End-to-end request flow

```
User -> http://localhost:8080/app1/accounts
     -> gateway adds X-Request-ID, logs the access, forwards to :3000
     -> Next.js (app1) renders <AccountsPage>
        - useAuth() returns the session from auth-client + localStorage
        - getApi().accounts.list() calls /api/v1/accounts
          -> auth-client.refreshIfExpiring() ensures fresh token
          -> Authorization: Bearer <jwt> + X-Request-ID added
          -> Zod validates response against v1.AccountListSchema
          -> typed v1.Account[] returned
        - <table> renders with t('accounts.columns.*') from common-i18n
        - LocaleSwitcher persists locale in cookie scoped Path=/
     -> User clicks "Take me to app2"
     -> hard navigation to /app2 through the gateway
     -> Next.js (app2) hydrates with the same auth session (storage)
        and the same locale (cookie)
```

Errors at any step:
- Network/HTTP failure: `ApiError` typed object, surfaced as a retryable UI alert; reported to observability with `app`, `resource`, `status`, `requestId`.
- Component crash: caught by `<ErrorBoundary>`, friendly fallback UI, full stack reported with PII redacted.
- Upstream down: gateway shows a friendly down-page naming the missing service.

## Why each piece exists

| Package | Without it... |
|---|---|
| `api-contracts` | Server/client shapes drift in everyone's head; production reveals the disagreement. |
| `api-client` | Every app reinvents auth injection, retry-on-401, response validation, request-id propagation. |
| `auth-client` | Every app reinvents token storage, cross-tab sync, refresh-before-expiry, React state. |
| `design-tokens` | Brand changes touch dozens of files; non-React apps cannot consume the look. |
| `design-system` | Every team builds its own Button (and ships its own MUI bundle bloat — see Task 1). |
| `common-i18n` | t() differs per app; locale resets on cross-zone navigation. |
| `observability` | Logs are unstructured strings; PII leaks into log pipelines; no cross-zone correlation. |
| `testing` | App A and app B mock the same endpoint differently. |
| `eslint-config` | TS/lint hygiene drifts silently per package. |
| `tsconfig` | Compiler settings drift; one package opts out of strict mode and a class of bugs returns. |
| `gateway` | Apps coordinate routing through one "primary zone"; that zone redeploys for every new app. |

## Scaling story

- **From 3 to 60 apps**: gateway is a config table; CI is `nx affected`; CI cache is content-driven; new apps inherit observability/auth/i18n/design just by initializing the providers.
- **From React-only to multi-framework**: tokens already framework-agnostic; api-client + auth-client cores already framework-agnostic.
- **From dev fakes to production**: auth-client mode flips from `demo` to `production` (OIDC/PKCE + BFF); observability provider is swapped; gateway is replaced by managed L7 speaking the same path-based contract; MSW disappears.

## What we would add next

- Real OIDC/PKCE flow with refresh-token rotation; per-market BFF.
- Storybook (or Ladle) for `@raisin/design-system` with Chromatic visual regression.
- Nx Cloud for distributed remote cache + DTE.
- OpenTelemetry traces propagated gateway -> apps -> backend on top of the existing `X-Request-ID` spine.
- `pnpm gen app <name>` codegen (scaffold app + register with gateway + CI picks it up automatically).
- `@raisin/feature-flags` wrapping LaunchDarkly/Unleash.
- Renovate + sigstore/SLSA supply-chain checks in nightly.
- Angular reference app under `apps/` consuming `@raisin/design-tokens` to prove the framework-agnostic claim.
