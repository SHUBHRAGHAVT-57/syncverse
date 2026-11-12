import { expect, test } from '@playwright/test';

test('profile dialog keeps keyboard focus inside and restores it on Escape', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByTitle('Edit display name');
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('textbox', { name: 'DISPLAY NAME', exact: true })).toBeFocused();
  await dialog.getByRole('button', { name: 'Save profile' }).focus();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Save profile' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('profile save persists and cancel preserves the saved identity', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByTitle('Edit display name');
  await trigger.click();
  await page.getByRole('textbox', { name: 'DISPLAY NAME', exact: true }).fill('  Morgan  ');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(trigger).toContainText('Morgan');
  await page.reload();
  await expect(trigger).toContainText('Morgan');
  await trigger.click();
  await page.getByRole('textbox', { name: 'DISPLAY NAME', exact: true }).fill('Unsaved name');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(page.getByRole('textbox', { name: 'DISPLAY NAME', exact: true })).toHaveValue('Morgan');
});

test('profile dialog fits a 320px viewport and keeps Save reachable', async ({ page }) => {
  await page.goto('/');
  await page.getByTitle('Edit display name').click();
  await page.setViewportSize({ width: 320, height: 568 });
  const dialog = page.getByRole('dialog');
  await expect.poll(() => dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  const save = dialog.getByRole('button', { name: 'Save profile' });
  await save.scrollIntoViewIfNeeded();
  await expect(save).toBeInViewport({ ratio: 1 });
  await save.click();
  await expect(dialog).toHaveCount(0);
});
