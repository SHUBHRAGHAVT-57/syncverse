import { expect, test } from '@playwright/test';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

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

test('peer avatar, caret, and selection use a safe fallback for an invalid color', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a document', exact: true }).click();
  const room = new URL(page.url()).searchParams.get('room')!;
  const peer = new Y.Doc();
  const provider = new WebsocketProvider(testInfo.config.metadata.relayUrl, room, peer, { WebSocketPolyfill: WebSocket });
  try {
    const text = peer.getText('content');
    text.insert(0, 'Shared sample');
    provider.awareness.setLocalState({
      user: { name: 'Test peer', color: 'invalid-color', colorLight: 'rgb(1, 2, 3)' },
      cursor: {
        anchor: Y.createRelativePositionFromTypeIndex(text, 0),
        head: Y.createRelativePositionFromTypeIndex(text, 6),
      },
    });

    const avatar = page.locator('.member').filter({ hasText: 'Test peer' }).locator('.member-avatar');
    await expect(avatar).toHaveCSS('background-color', 'rgb(155, 140, 255)');
    await expect(page.locator('.cm-ySelectionCaret')).toHaveCSS('border-left-color', 'rgb(155, 140, 255)');
    await expect(page.locator('.cm-ySelection')).toHaveCSS('background-color', /rgba\(155, 140, 255, 0\.25\d*\)/);

    provider.awareness.setLocalStateField('user', { name: 'Test peer', color: '#6ed9d0', colorLight: 'rgb(1, 2, 3)' });
    await expect(avatar).toHaveCSS('background-color', 'rgb(110, 217, 208)');
    await expect(page.locator('.cm-ySelectionCaret')).toHaveCSS('border-left-color', 'rgb(110, 217, 208)');
    await expect(page.locator('.cm-ySelection')).toHaveCSS('background-color', /rgba\(110, 217, 208, 0\.25\d*\)/);
  } finally {
    provider.destroy();
    peer.destroy();
  }
});
