import { expect, test } from '@playwright/test';
import type { WebSocketRoute } from '@playwright/test';

test('Live waits for the initial document exchange and resets after pausing', async ({ page }) => {
  let socket: WebSocketRoute | undefined;
  await page.routeWebSocket('ws://127.0.0.1:1234/**', route => { socket = route; });
  await page.goto('/?room=e3db3fa7-1d94-4ed6-80f3-30a328bad138');
  await expect.poll(() => Boolean(socket)).toBe(true);
  await expect(page.locator('.status-label')).toHaveText('Connecting');
  await expect(page.getByText('Live', { exact: true })).toHaveCount(0);
  // Yjs sync-step2 carrying the encoded empty document update [0, 0].
  socket!.send(Buffer.from([0, 1, 2, 0, 0]));
  await expect(page.locator('.status-label')).toHaveText('Live');
  await page.getByRole('button', { name: 'Pause sync' }).click();
  await expect(page.locator('.status-label')).toHaveText('Offline');
  const previous = socket;
  await page.getByRole('button', { name: 'Resume sync' }).click();
  await expect.poll(() => socket !== previous).toBe(true);
  await expect(page.locator('.status-label')).toHaveText('Connecting');
  socket!.send(Buffer.from([0, 1, 2, 0, 0]));
  await expect(page.locator('.status-label')).toHaveText('Live');
});
