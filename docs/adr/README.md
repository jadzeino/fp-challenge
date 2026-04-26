# Architecture Decision Records

Numbered, immutable records of architectural decisions. New decisions create new records; superseded records are marked as such, never deleted. Format borrows from [Michael Nygard's template](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

| # | Title | Status |
|---|---|---|
| [0001](./0001-monorepo-tooling.md) | Monorepo tooling: pnpm + Nx + Lerna | accepted |
| [0002](./0002-app-integration-gateway.md) | App integration via a standalone path-based gateway | accepted |
| [0003](./0003-auth-strategy.md) | Auth: shared client today, OIDC/PKCE + BFF tomorrow | accepted (demo); production path documented |
| [0004](./0004-api-contracts.md) | API contracts: Zod, versioned, breaking-change gated | accepted |
| [0005](./0005-ci-strategy.md) | CI: nx affected, layered cache, contract gate | accepted |
| [0006](./0006-design-system-and-tokens.md) | Design system: tokens-first, framework-agnostic | accepted |
| [0007](./0007-observability.md) | Observability: provider model, redaction by default | accepted |
| [0008](./0008-testing-strategy.md) | Testing: layered, MSW as single mock truth | accepted |
| [0009](./0009-i18n.md) | i18n: namespace tiers, cookie-persisted locale | accepted |
