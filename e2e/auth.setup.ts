import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { test as setup } from '@playwright/test';
import { signInWithPassword } from './login';

const authFile = resolve(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  mkdirSync(dirname(authFile), { recursive: true });
  await signInWithPassword(page);
  await page.context().storageState({ path: authFile, indexedDB: true });
});
