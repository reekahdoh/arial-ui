import { expect, type Page } from '@playwright/test';

export function requireE2eCredentials(): { login: string; password: string } {
  const login = process.env.E2E_LOGIN_NAME;
  const password = process.env.E2E_PASSWORD;
  if (!login || !password) {
    throw new Error('Set E2E_LOGIN_NAME and E2E_PASSWORD (see .env.staging.example).');
  }
  return { login, password };
}

/** Email/password sign-in. Do not use Google OAuth in automated tests. */
export async function signInWithPassword(page: Page) {
  const { login, password } = requireE2eCredentials();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /^aira$/i })).toBeVisible();
  await page.getByLabel(/username or email/i).fill(login);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/home/);
}
