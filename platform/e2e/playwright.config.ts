import { defineConfig, devices } from '@playwright/test';

const GATEWAY_URL = process.env.GATEWAY_URL ?? 'http://localhost:8080';

/**
 * Boots the full stack via the root `pnpm dev` script and waits for
 * the gateway to respond. Re-uses an already-running stack if one is
 * up (re-use serves CI matrix where the gateway is started in a prior
 * step, and local devs running `pnpm dev` in another terminal).
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: GATEWAY_URL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm --filter ... -r dev',
    cwd: '../..',
    url: `${GATEWAY_URL}/__health`,
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
