import { rest, RestHandler } from 'msw';
import { accountFixtures } from '../fixtures/accounts';

/**
 * Single source of truth for mock API behavior. Used by:
 *   - Jest unit/integration tests (via setupServer)
 *   - Browser dev-mode (via setupWorker)
 *   - Playwright e2e (when running with --use-mocks)
 *
 * Override per-test with server.use(rest.get(...)) for failure or
 * edge-case scenarios.
 */
export const handlers: RestHandler[] = [
  rest.get('*/v1/accounts', (_req, res, ctx) => res(ctx.status(200), ctx.json(accountFixtures))),
];
