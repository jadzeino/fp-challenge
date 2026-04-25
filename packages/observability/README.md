# @raisin/observability

Error tracking, structured logging, PII redaction, request-id propagation, and a React error boundary. Day-1 question for a fintech platform: when something breaks, what broke and why? This package answers it.

## Three subpaths

```ts
// Browser apps + tests + neutral code
import { initObservability, logger, redact } from '@raisin/observability';

// React-specific (apps' _app.tsx)
import { ErrorBoundary, withErrorBoundary } from '@raisin/observability/react';

// Node-specific (gateway, scripts)
import { requestIdMiddleware, accessLogMiddleware } from '@raisin/observability/node';
```

## Provider model

The package ships a console-emitting default provider so dev works out of the box. Production wires Sentry / Datadog / OTel by passing a real provider:

```ts
import { initObservability } from '@raisin/observability';
import * as Sentry from '@sentry/browser';

Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN });

initObservability({
  app: 'app1',
  env: process.env.NODE_ENV as any,
  release: process.env.NEXT_PUBLIC_RELEASE,
  provider: {
    captureException: (err, ctx) => Sentry.captureException(err, { extra: ctx }),
    captureMessage: (msg, level, ctx) => Sentry.captureMessage(msg, { level, extra: ctx }),
    setTags: (t) => Sentry.setTags(t),
  },
});
```

The provider boundary keeps Sentry/Datadog out of consumer code, which means swapping vendors is a one-package change.

## PII redaction (fintech: not optional)

`logger.*` runs every context object through `redact()` before emitting. Default sensitive keys: token, refresh_token, authorization, cookie, password, api_key, iban, bic, card, cvv, ssn, tax_id, email, phone, dob. Apps can extend the list per call.

This means a casual `logger.info('login', { user: session.user })` does not leak email or any other identifier to the log pipeline.

## Cross-zone tracing

`requestIdMiddleware()` reads or generates `X-Request-ID` and pins it on the request object. The gateway uses it; `@raisin/api-client` propagates it; downstream services log it. Search by request id and you see the entire journey of a single user action across zones.

ADR 0007 covers DSN-per-app, redaction policy, and the OpenTelemetry follow-up.
