# @raisin/e2e

Playwright end-to-end tests that exercise the platform through the gateway.

## Run

```bash
# In one terminal
pnpm dev   # gateway + apps

# In another
pnpm --filter @raisin/e2e test:e2e
```

Or let Playwright spin up the stack itself (slower first run, no second terminal needed):

```bash
pnpm --filter @raisin/e2e test:e2e
```

The `webServer` config in `playwright.config.ts` is `reuseExistingServer: true`, so it picks up an already-running stack if one is up.

## What's covered

- **Cross-zone session**: log in on `/app1`, navigate to `/app2`, assert the session carried over without a re-prompt. Validates auth-client storage + the gateway path contract together.
- **Cross-zone locale**: switch to German on `/app1`, navigate to `/app3`, assert the German UI is present. Validates the locale cookie + I18nProvider initialization across zones.

These are the two integration claims of the platform layer that unit tests cannot cover.

## CI

The CI workflow runs e2e on PRs that touch `apps/`, `platform/gateway`, or any of the platform packages whose change could affect cross-zone behavior. Traces and videos are retained on failure for forensics.
