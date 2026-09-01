import { expect, test } from '@playwright/test';

test.describe('assessments', () => {
  test('list page loads', async ({ page }) => {
    await page.goto('/assessments');
    await expect(page.getByRole('heading', { name: /^risk assessments$/i })).toBeVisible();
    await expect(page.getByTestId('aira-assessments-table')).toBeVisible();
  });

  test('New Assessment opens the wizard name step without persisting', async ({ page }) => {
    await page.goto('/assessments');
    await page.getByRole('link', { name: /new assessment/i }).click();
    await expect(page).toHaveURL(/\/assessments\/new/);
    await expect(page.getByTestId('aira-wizard-name')).toBeVisible();
    await expect(page.getByRole('button', { name: /^next$/i })).toBeVisible();
    // Do not fill the wizard or click Next — that can persist to Firestore / the API.
  });
});
