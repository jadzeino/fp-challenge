# @raisin/testing

Shared test utilities for the Raisin frontend platform. The point: every team writes tests against the same mocks, the same providers, and the same fixtures, instead of each team re-rolling their own.

## What's inside

- **MSW handlers** (`@raisin/testing/msw`): one source of truth for mock API behavior. Exercised by Jest tests, opt-in dev mode in apps, and Playwright e2e.
- **`renderWithProviders`**: RTL render wrapped in the platform's standard provider chain (`<AuthProvider>` today, with i18n and observability joining as they ship). Apps can compose extra providers via `extraWrapper`.
- **Fixtures**: realistic, contract-conforming data per resource (e.g. `accountFixtures` validates against `v1.AccountListSchema`).

## Usage

```tsx
// In a test
import { renderWithProviders, handlers } from '@raisin/testing';
import { server } from '@raisin/testing/msw/server';
import { rest } from 'msw';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('renders accounts', async () => {
  renderWithProviders(<AccountsPage />);
  // assertions...
});

test('handles 500', async () => {
  server.use(rest.get('*/v1/accounts', (_req, res, ctx) => res(ctx.status(500))));
  renderWithProviders(<AccountsPage />);
  // assert error UI
});
```

## Why one source of truth

If app A mocks `/v1/accounts` returning a different shape than app B, the design of the API drifts in everyone's head. Centralizing the handlers means contract changes break tests in every consumer at once — which is exactly what you want.
