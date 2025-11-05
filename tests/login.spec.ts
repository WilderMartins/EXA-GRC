import { test, expect } from '@playwright/test';

test('login page should be displayed', async ({ page }) => {
  const firebaseConfig = {
    apiKey: 'dummy',
    authDomain: 'dummy',
    projectId: 'dummy',
    storageBucket: 'dummy',
    messagingSenderId: 'dummy',
    appId: 'dummy',
  };

  await page.goto('/');
  await page.evaluate((config) => {
    localStorage.setItem('isSetupComplete', 'true');
    localStorage.setItem('firebaseConfig', JSON.stringify(config));
  }, firebaseConfig);

  await page.reload();

  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Senha')).toBeVisible();
});
