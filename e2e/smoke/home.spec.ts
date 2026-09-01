import { expect, test } from '@playwright/test';

test.describe('home', () => {
  test('shows the home heading and primary CTAs', async ({ page }) => {
    await page.goto('/home');
    await expect(page.getByRole('heading', { name: /making sense of ai risk/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /new risk assessment/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /view risk assessments/i })).toBeVisible();
  });

  test('New Risk Assessment opens the wizard name step', async ({ page }) => {
    await page.goto('/home');
    await page.getByRole('link', { name: /new risk assessment/i }).click();
    await expect(page).toHaveURL(/\/assessments\/new/);
    await expect(page.getByTestId('aira-wizard-name')).toBeVisible();
    await expect(page.getByLabel(/^name$/i)).toBeVisible();
  });

  test('View Risk Assessments opens the list', async ({ page }) => {
    await page.goto('/home');
    await page.getByRole('link', { name: /view risk assessments/i }).click();
    await expect(page).toHaveURL(/\/assessments$/);
    await expect(page.getByRole('heading', { name: /risk assessments/i })).toBeVisible();
  });
});
