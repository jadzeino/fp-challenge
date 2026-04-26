import { test, expect } from '@playwright/test';

/**
 * Cross-zone session test. The platform claim: a user logs in on app1,
 * navigates to app2 via the gateway, and the session carries over with
 * no re-prompt. This is the load-bearing user-visible behavior of the
 * auth-client + storage + gateway combo.
 */
test.describe('cross-zone auth session via the gateway', () => {
  test('login on /app1 carries to /app2 without re-prompt', async ({ page }) => {
    await page.goto('/app1/accounts');
    await expect(page.getByText(/not logged in/i)).toBeVisible();

    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page.getByText('Ada Lovelace')).toBeVisible();

    // Cross-zone navigation through the gateway.
    await page.goto('/app2');
    await expect(page.getByText(/signed in as demo@raisin\.test/i)).toBeVisible();
  });

  test('locale chosen on /app1 persists through to /app3', async ({ page }) => {
    await page.goto('/app1/accounts');
    await page.getByRole('combobox', { name: /language|sprache/i }).selectOption('de');

    await page.goto('/app3');
    // German UI should be present
    await expect(page.getByRole('heading', { name: /hallo aus app3/i })).toBeVisible();
  });
});
