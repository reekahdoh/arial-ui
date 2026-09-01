import { expect, test } from '@playwright/test';

test.describe('unauthenticated', () => {
  test('home route shows the sign-in experience', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /^aira$/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /^sign in$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
  });

  test('protected /home redirects to sign-in', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: /^aira$/i })).toBeVisible();
  });
});
