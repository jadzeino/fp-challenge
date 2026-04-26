import { server } from '@raisin/testing/msw/server';

// Wire MSW once per Jest worker. The handlers are the same ones used in
// dev mode and Playwright e2e, so what passes here is what app1 sees in
// other contexts too.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
