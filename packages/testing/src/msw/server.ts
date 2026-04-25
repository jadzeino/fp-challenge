import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Node-side MSW server for Jest. Wire it up in jest.setup.ts:
 *
 *   import { server } from '@raisin/testing/msw/server';
 *   beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
 *   afterEach(() => server.resetHandlers());
 *   afterAll(() => server.close());
 */
export const server = setupServer(...handlers);
