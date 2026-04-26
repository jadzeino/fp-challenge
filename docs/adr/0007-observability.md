# ADR 0007 — Observability: provider model, redaction by default, request-id spine

- Status: accepted
- Date: 2026-04-25

## Context

Day-1 question for a fintech platform: when something breaks, what broke and why? The answer needs a) consistent error capture, b) structured logs that do not leak PII, and c) a way to correlate a single user action across multiple zones (apps + gateway + downstream services).

## Decision

`@raisin/observability` ships:

- **Provider model** — `initObservability({ app, env, release, provider })` accepts any provider implementing `captureException` / `captureMessage` / `setTags`. The default is a console-emitting provider for dev. Production wires Sentry / Datadog / OTel. **Apps never import the vendor SDK directly**, so swapping vendors is a one-package change.
- **PII redaction by default** — `logger.*` runs every context object through `redact()` before emitting. Default sensitive keys cover fintech basics: token, refresh_token, authorization, cookie, password, api_key, iban, bic, card, cvv, ssn, tax_id, email, phone, dob. Apps can extend per call.
- **Cross-zone tracing via X-Request-ID** — gateway generates or honors the header (`requestIdMiddleware`), the access log records it, `@raisin/api-client` propagates it. One id, full journey.
- **React error boundary** — `<ErrorBoundary>` + `withErrorBoundary(C)` report to the configured provider with the component stack.

DSN is per app (`NEXT_PUBLIC_SENTRY_DSN_<APP>`), single Sentry org. Per-app DSNs make team-level alerting tractable; one org keeps the data correlatable.

## Consequences

- A new app inherits observability for free by initializing the package in `_app.tsx`.
- `logger.info('login', { user: session.user })` does not leak email — by construction, not by remembering.
- Adding OpenTelemetry traces is the next step on top of the same provider boundary.

## Alternatives considered

- **Direct Sentry imports in every app** — vendor lock-in; rejected.
- **Pino-only logging without an exception path** — half a solution.
- **Manually structured strings** — guarantees inconsistent shape across teams; rejected.
