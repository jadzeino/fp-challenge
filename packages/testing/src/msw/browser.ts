import { setupWorker } from 'msw';
import { handlers } from './handlers';

/**
 * Browser-side MSW worker for dev mode. Apps opt in via:
 *
 *   if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true' && typeof window !== 'undefined') {
 *     const { worker } = await import('@raisin/testing/msw/browser');
 *     await worker.start();
 *   }
 *
 * Requires public/mockServiceWorker.js (run `pnpm msw init public/`).
 */
export const worker: ReturnType<typeof setupWorker> = setupWorker(...handlers);
